#!/bin/bash

# Define your services and the path to their local .env files
declare -A SERVICES=(
    ["api-gateway-env"]="./services/api-gateway/.env"
    ["user-service-env"]="./services/user-service/.env"
    ["concert-service-env"]="./services/concert-service/.env"
    ["order-service-env"]="./services/order-service/.env"
    ["payment-service-env"]="./services/payment-service/.env"
    ["notification-service-env"]="./services/notification-service/.env"
    ["ticket-service-env"]="./services/ticket-service/.env"
)

echo "Loading environment variables into Kind..."

for secret_name in "${!SERVICES[@]}"; do
  env_file="${SERVICES[$secret_name]}"
  
  # Delete the old secret if it exists, then create the fresh one
  kubectl delete secret "$secret_name" --ignore-not-found=true
  kubectl create secret generic "$secret_name" --from-env-file="$env_file"
done

echo "All environments loaded successfully!"