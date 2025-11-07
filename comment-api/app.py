# comment-api/app.py
from flask import Flask, request, jsonify, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import datetime
import pika
import json
import requests
from functools import wraps

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:3001/auth")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            print("[!] Token is missing from request", flush=True)
            return jsonify({"message": "Token is missing"}), 401
        
        try:
            print(f"[*] Verifying token with auth-service: {AUTH_SERVICE_URL}/verify-token", flush=True)
            resp = requests.get(
                f"{AUTH_SERVICE_URL}/verify-token",
                headers={"Authorization": f"Bearer {token}"}
            )
            print(f"[*] Auth-service response status: {resp.status_code}", flush=True)
            if resp.status_code != 200:
                print(f"[!] Auth-service returned non-200: {resp.text}", flush=True)
                return jsonify({"message": "Invalid or expired token"}), 401
            
            data = resp.json()
            print(f"[*] Auth-service response data: {data}", flush=True)
            if not data.get("valid"):
                print(f"[!] Token validation failed", flush=True)
                return jsonify({"message": "Invalid token"}), 401
            
            # Attach user info to request
            request.user = data["user"]  # {'id': 2, 'email': ..., 'role': ...}
            print(f"[✓] Token verified successfully for user: {request.user}", flush=True)
        except Exception as e:
            print(f"[!] Exception during token verification: {e}", flush=True)
            return jsonify({"message": f"Token verification failed: {e}"}), 500

        return f(*args, **kwargs)
    return decorated


def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if token:
            try:
                resp = requests.get(
                    f"{AUTH_SERVICE_URL}/verify-token",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("valid"):
                        # Attach user info to request
                        request.user = data["user"]  # {'id': 2, 'email': ..., 'role': ...}
                        return f(*args, **kwargs)
            except Exception as e:
                print(f"Token verification failed: {e}")
        
        # No token or invalid token, continue as guest
        request.user = None
        return f(*args, **kwargs)
    return decorated


app = Flask(__name__)
CORS(app)


# Configurations

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET", "defaultsecret")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")



db = SQLAlchemy(app)


# DB Model

class Comment(db.Model):
    __tablename__ = 'comment'
    id = db.Column(db.Integer, primary_key=True)
    comment_text = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, nullable=False)
    ticket_id = db.Column(db.Integer, nullable=False)
    creation_date = db.Column(
        db.DateTime, default=datetime.datetime.now(datetime.timezone.utc)
    )


# Helper for RabbitMQ

def publish_event(event_type, data):
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        channel = connection.channel()

        # Declare exchange & queue
        channel.exchange_declare(exchange="comments-exchange", exchange_type="direct", durable=True)
        channel.queue_declare(queue="comments-queue", durable=True)
        channel.queue_bind(
            exchange="comments-exchange",
            queue="comments-queue",
            routing_key=f"comment.{event_type}"
        )

        # Publish message
        channel.basic_publish(
            exchange="comments-exchange",
            routing_key=f"comment.{event_type}",
            body=json.dumps(data),
            properties=pika.BasicProperties(delivery_mode=2)
        )

        connection.close()
        print(f"[✓] Published {event_type} event to RabbitMQ", flush=True)
    except Exception as e:
        print(f"[!] Failed to publish {event_type} event: {e}", flush=True)


# Create Blueprint with /api prefix
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Routes
@api_bp.route('/tickets/<int:ticket_id>/comments', methods=['GET'])
@optional_token
def get_comments(ticket_id):
    comments = Comment.query.filter_by(ticket_id=ticket_id).order_by(Comment.creation_date).all()
    return jsonify([
        {
            "id": c.id,
            "ticket_id": c.ticket_id,
            "author_id": c.author_id,
            "comment_text": c.comment_text,
            "creation_date": c.creation_date.strftime("%Y-%m-%d %H:%M")
        }
        for c in comments
    ])

@api_bp.route('/comments', methods=['POST'])
@token_required
def post_comment():
    data = request.get_json()
    comment_data = {
        "ticket_id": data.get("ticket_id"),
        "author_id": request.user.get("id"),
        "comment_text": data.get("comment_text"),
        "creation_date": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    publish_event("created", comment_data)
    return jsonify({"message": "Comment submitted successfully to RabbitMQ"}), 201

@api_bp.route('/comments/<int:comment_id>', methods=['PUT'])
@token_required
def update_comment(comment_id):
    data = request.get_json()
    new_text = data.get("comment_text")

    if not new_text:
        return jsonify({"message": "New comment_text is required"}), 400

    user_id = request.user.get("id")

    event_data = {
        "id": comment_id,
        "comment_text": new_text,
        "requesting_user": user_id,
    }
    
    publish_event("updated", event_data)
    return jsonify({"message": "Comment update request successfully submitted to rabbitMQ"})

@api_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@token_required
def delete_comment(comment_id):
    event_data = {"id": comment_id}
    publish_event("deleted", event_data)
    return jsonify({"message": "Comment delete request successfully submitted to rabbitMQ"})

# Register blueprint
app.register_blueprint(api_bp)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "OK",
        "service": "comment-api",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }), 200




# Run

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003)
