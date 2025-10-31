import os
import json
import time
import pika
import psycopg2

# --- Database setup ---
def connect_db_with_retry(retries=10, delay=5):
    for attempt in range(retries):
        try:
            conn = psycopg2.connect(
                dbname=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT")
            )
            print("[✓] Connected to Postgres.", flush=True)
            return conn
        except psycopg2.OperationalError as e:
            print(f"[!] Postgres not ready (attempt {attempt + 1}/{retries}): {e}", flush=True)
            time.sleep(delay)
    raise Exception("Postgres connection failed after retries.")

db_conn = connect_db_with_retry()
cursor = db_conn.cursor()

# Ensure table exists
cursor.execute("""
CREATE TABLE IF NOT EXISTS comment (
    id SERIAL PRIMARY KEY,
    comment_text TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    ticket_id INTEGER NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")
db_conn.commit()

# --- Message handler ---
def callback(ch, method, properties, body):
    print(f"[x] Received event {method.routing_key}: {body}", flush=True)
    try:
        event_data = json.loads(body)

        if method.routing_key == "comment.created":
            cursor.execute(
                """
                INSERT INTO comment (comment_text, author_id, ticket_id, creation_date)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    event_data["comment_text"],
                    event_data["author_id"],
                    event_data["ticket_id"],
                    event_data["creation_date"]
                )
            )
            print("[✓] Inserted new comment into DB.", flush=True)

        elif method.routing_key == "comment.updated":

            cursor.execute("SELECT author_id FROM comment WHERE id = %s", (event_data["id"],))
            row = cursor.fetchone()

            if not row:
                print("[x] Comment not found — rejecting update")
                return

            author_id = row[0]
            
            
            if author_id != event_data["requesting_user"]:
                print("[x] Unauthorized update attempt — ignoring")
                return

            cursor.execute(
                """
                UPDATE comment
                SET comment_text = %s
                WHERE id = %s
                """,
                (event_data["comment_text"], event_data["id"])
            )
            print("[✓] Updated comment in DB.", flush=True)

        elif method.routing_key == "comment.deleted":

            cursor.execute("SELECT * FROM comment WHERE id = %s", (event_data["id"],))
            row = cursor.fetchone()

            if not row:
                print("[x] Comment not found — rejecting delete")
                return

            cursor.execute(
                "DELETE FROM comment WHERE id = %s",
                (event_data["id"],)
            )
            print("[✓] Deleted comment from DB.", flush=True)

        db_conn.commit()
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print("[!] Error processing message:", e, flush=True)
        ch.basic_nack(delivery_tag=method.delivery_tag)

# --- RabbitMQ setup ---
def main():
    rabbitmq_host = os.getenv("RABBITMQ_HOST", "localhost")

    def connect_rabbitmq_with_retry(host, retries=10, delay=2):
        for attempt in range(retries):
            try:
                conn = pika.BlockingConnection(pika.ConnectionParameters(host))
                print("[✓] Connected to RabbitMQ.", flush=True)
                return conn
            except pika.exceptions.AMQPConnectionError as e:
                print(f"[!] RabbitMQ not ready (attempt {attempt + 1}/{retries}): {e}", flush=True)
                time.sleep(delay)
        raise Exception("RabbitMQ connection failed after retries.")

    connection = connect_rabbitmq_with_retry(rabbitmq_host)
    channel = connection.channel()

    # Declare exchange & queue
    channel.exchange_declare(exchange="comments-exchange", exchange_type="direct", durable=True)
    channel.queue_declare(queue="comments-queue", durable=True)

    # Bind queue to multiple routing keys
    for event in ["created", "updated", "deleted"]:
        channel.queue_bind(
            exchange="comments-exchange",
            queue="comments-queue",
            routing_key=f"comment.{event}"
        )

    channel.basic_consume(queue="comments-queue", on_message_callback=callback)
    print("[*] Waiting for messages. To exit press CTRL+C", flush=True)
    channel.start_consuming()

if __name__ == "__main__":
    main()
