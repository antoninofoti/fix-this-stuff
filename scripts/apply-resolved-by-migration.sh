#!/bin/bash

echo "Applying resolved_by migration to ticketdb..."

docker exec -i postgres-fts psql -U postgres -d postgres < /docker-entrypoint-initdb.d/09-add-resolved-by.sql

echo "Migration completed!"
