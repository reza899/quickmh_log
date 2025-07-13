#!/bin/bash

# QuickMH Log - Production Build Script
# This script runs all the necessary steps to prepare the application for production

set -e  # Exit on any error

echo "🚀 Starting QuickMH Log production build..."

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.0.0 or higher."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! npm list semver &> /dev/null; then
    npm install semver --no-save --silent
fi

# Compare versions using Node.js
if ! node -e "
const semver = require('semver');
const current = '$NODE_VERSION';
const required = '$REQUIRED_VERSION';
if (!semver.gte(current, required)) {
  console.error(\`❌ Node.js version \${current} is not supported. Please use version \${required} or higher.\`);
  process.exit(1);
}
"; then
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is supported"

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci --silent
else
    npm install --silent
fi

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate || {
    echo "⚠️  Security vulnerabilities found. Please review and fix them."
    echo "Run 'npm audit fix' to automatically fix issues where possible."
    exit 1
}

# Run linting
echo "🔍 Running code linting..."
npm run lint || {
    echo "❌ Linting failed. Please fix the issues and try again."
    echo "Run 'npm run lint:fix' to automatically fix some issues."
    exit 1
}

# Check code formatting
echo "✨ Checking code formatting..."
npm run format:check || {
    echo "❌ Code formatting issues found. Please fix them and try again."
    echo "Run 'npm run format' to automatically format the code."
    exit 1
}

# Run tests
echo "🧪 Running tests..."
npm test || {
    echo "❌ Tests failed. Please fix the issues and try again."
    exit 1
}

# Build the application
echo "🏗️  Building the application..."
npm run build || {
    echo "❌ Build failed. Please check the errors and try again."
    exit 1
}

# Check if build output exists
if [ ! -d "public" ]; then
    echo "❌ Build output directory 'public' not found."
    exit 1
fi

if [ ! -f "public/index.html" ]; then
    echo "❌ Build output 'public/index.html' not found."
    exit 1
fi

# Generate build info
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "{
  \"buildTime\": \"$BUILD_TIME\",
  \"buildHash\": \"$BUILD_HASH\",
  \"version\": \"$(node -p "require('./package.json').version")\"
}" > public/build-info.json

echo "✅ Build completed successfully!"
echo ""
echo "📊 Build Summary:"
echo "  Build time: $BUILD_TIME"
echo "  Git hash: $BUILD_HASH"
echo "  Output directory: public/"
echo ""

# Calculate bundle sizes
if command -v du &> /dev/null; then
    echo "📏 Bundle sizes:"
    du -sh public/* 2>/dev/null | head -10
    echo ""
fi

echo "🎉 Your application is ready for deployment!"
echo ""
echo "Next steps:"
echo "  1. Test the build: npm run preview"
echo "  2. Deploy the 'public' directory to your hosting service"
echo "  3. Set up your domain and SSL certificate"
echo ""
echo "📝 Production deployment checklist:"
echo "  ☑ Security headers configured (CSP, HSTS, etc.)"
echo "  ☑ HTTPS enabled"
echo "  ☑ Gzip compression enabled"
echo "  ☑ Cache headers configured"
echo "  ☑ Error monitoring set up"
echo ""