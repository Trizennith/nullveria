#!/bin/sh
echo "Waiting for MySQL..."
echo "MYSQL_HOST: ${MYSQL_HOST}"
echo "MYSQL_PORT: ${MYSQL_PORT}"
until nc -z -v -w30 "$MYSQL_HOST" "${MYSQL_PORT:-3306}"; do
  echo "Waiting for MySQL to be ready at $MYSQL_HOST:${MYSQL_PORT:-3306}..."
  sleep 2
done

npm run start:prod
