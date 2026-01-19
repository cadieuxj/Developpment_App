#!/bin/bash

# Script to add environment variables to Vercel
# Run this with: bash setup-vercel-env.sh

set -e

ENV_FILE=".env.example"

# Read environment variables from .env.example
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [[ "$key" =~ ^#.*$ ]] || [[ -z "$key" ]]; then
    continue
  fi

  # Skip if no value
  if [[ -z "$value" ]]; then
    continue
  fi

  echo "Adding $key to Vercel (production, preview, development)..."

  # Add to production, preview, and development environments
  echo "$value" | vercel env add "$key" production preview development --yes || echo "Failed to add $key"

done < "$ENV_FILE"

echo "All environment variables have been added to Vercel!"
