#!/bin/bash

# Deploy script for NCM Analyzer Pro
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="ncmanalyzerpro"
DOMAIN="ncmanalyzerpro.com.br"
REMOTE_USER="ubuntu"
REMOTE_HOST="your-ec2-instance-ip"
REMOTE_PATH="/var/www/$APP_NAME"

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Build the application
echo "📦 Building application..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf deploy.tar.gz -C dist .

# Upload to server
echo "📤 Uploading to server..."
scp deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/
scp nginx.conf $REMOTE_USER@$REMOTE_HOST:/tmp/

# Deploy on server
echo "🔧 Deploying on server..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
    # Backup current deployment
    if [ -d "/var/www/ncmanalyzerpro" ]; then
    sudo cp -r /var/www/ncmanalyzerpro /var/www/ncmanalyzerpro.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # Create directory if it doesn't exist
    sudo mkdir -p /var/www/ncmanalyzerpro
    
    # Extract new files
    cd /var/www/ncmanalyzerpro
    sudo tar -xzf /tmp/deploy.tar.gz
    
    # Set permissions
    sudo chown -R www-data:www-data /var/www/ncmanalyzerpro
sudo chmod -R 755 /var/www/ncmanalyzerpro
    
    # Update Nginx configuration
    sudo cp /tmp/nginx.conf /etc/nginx/sites-available/ncmanalyzerpro
sudo ln -sf /etc/nginx/sites-available/ncmanalyzerpro /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    # Clean up
    rm /tmp/deploy.tar.gz /tmp/nginx.conf
    
    echo "✅ Deployment completed successfully"
EOF

# Clean up local files
rm deploy.tar.gz

echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
echo "🌐 Your application is now available at: https://$DOMAIN"

# Optional: Run health check
echo "🔍 Running health check..."
sleep 5
if curl -f -s https://$DOMAIN > /dev/null; then
    echo "✅ Health check passed - site is responding"
else
    echo "⚠️  Health check failed - please verify deployment"
fi