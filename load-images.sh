#!/bin/bash

CLUSTER_NAME="ticket-box"

IMAGES=(
  "redis:7-alpine"
  "redis/redisinsight:latest"
  "ticket-box-backend-api-gateway:latest"
  "ticket-box-backend-user-service:latest"
  "ticket-box-backend-concert-service:latest"
  "ticket-box-backend-concert-relay:latest"
  "ticket-box-backend-order-service:latest"
  "ticket-box-backend-order-relay:latest"
  "ticket-box-backend-order-cron:latest"
  "ticket-box-backend-payment-service:latest"
  "ticket-box-backend-payment-relay:latest"
  "ticket-box-backend-payment-cron:latest"
  "ticket-box-backend-ticket-service:latest"
  "ticket-box-backend-notification-service:latest"
  "ticket-box-backend-notification-relay:latest"
  "ticket-box-backend-notification-cron:latest"
  "ticket-box-backend-reminder-cron:latest"
)

for image in "${IMAGES[@]}"; do
  kind load docker-image "$image" --name "$CLUSTER_NAME"
done

echo "Done!"