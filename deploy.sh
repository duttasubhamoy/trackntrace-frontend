#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="realntested-admin"
CLOUDFRONT_DISTRIBUTION_ID="E2NVJ8ZMU6JST4" # Replace with your CloudFront distribution ID

echo -e "${GREEN}Starting deployment process...${NC}"

# 1. Clean previous build
echo "Cleaning previous build..."
rm -rf build

# 2. Build with production environment
echo "Building with production environment..."
export NODE_ENV=production
export REACT_APP_BACKEND_URL=https://test1.richi.life

# Verify environment variables are set
echo "Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "REACT_APP_BACKEND_URL: $REACT_APP_BACKEND_URL"

# Run the build
npm run build

# Verify no localhost in build
node verify-build.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Aborting deployment.${NC}"
    exit 1
fi

# 3. Deploy to S3 with appropriate cache control
echo "Uploading to S3..."

# Upload index.html with no-cache headers
echo "Uploading index.html with no-cache headers..."
aws s3 sync build/ s3://$BUCKET_NAME \
    --delete \
    --cache-control "no-cache,no-store,must-revalidate" \
    --exclude "*" \
    --include "index.html"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to upload index.html! Aborting.${NC}"
    exit 1
fi

# Upload static assets with long-term caching
echo "Uploading static assets with caching..."
aws s3 sync build/ s3://$BUCKET_NAME \
    --delete \
    --cache-control "public,max-age=31536000,immutable" \
    --exclude "index.html"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to upload static assets! Aborting.${NC}"
    exit 1
fi

# 4. Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create CloudFront invalidation! Your changes may not be visible immediately.${NC}"
    exit 1
fi

# 5. Wait for invalidation to complete
echo "Waiting for CloudFront invalidation to complete..."
aws cloudfront wait invalidation-completed \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --id $INVALIDATION_ID

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "Please wait a few minutes for CloudFront to fully propagate the changes."
echo "You may need to clear your browser cache to see the updates."