#!/bin/bash

# Load environment variables from .env
export $(grep -v `^#` ../.env | xargs)

# Replace placeholders in init.sql.template and save as init.sql
if [ ! -f "init-template.sql" ]; then
  echo "Error: init-template.sql not found in $(pwd)"
  exit 1
fi

envsubst < init-template.sql > init.sql