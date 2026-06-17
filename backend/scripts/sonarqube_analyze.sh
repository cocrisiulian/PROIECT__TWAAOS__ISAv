#!/bin/bash

# SonarQube Backend Analysis Script
# Usage: ./scripts/sonarqube_backend_analyze.sh <sonar_token> [sonar_host]

set -e

SONAR_TOKEN=${1:-}
SONAR_HOST=${2:-http://localhost:9000}
PROJECT_KEY="usv_events_backend"

if [ -z "$SONAR_TOKEN" ]; then
    echo "Error: SonarQube token required"
    echo "Usage: $0 <sonar_token> [sonar_host]"
    echo ""
    echo "To get a token:"
    echo "1. Open http://localhost:9000/account/security"
    echo "2. Generate a Global Analysis Token"
    echo "3. Pass it to this script"
    exit 1
fi

echo "================================"
echo "SonarQube Backend Analysis"
echo "================================"
echo "Project Key: $PROJECT_KEY"
echo "SonarQube Host: $SONAR_HOST"
echo "Analysis directory: $(pwd)"
echo ""

# Check if sonar-scanner is installed
if ! command -v sonar-scanner &> /dev/null; then
    echo "Error: sonar-scanner not found"
    echo "Install with: npm install -g sonarqube-scanner"
    exit 1
fi

echo "Starting analysis..."
sonar-scanner \
  -Dsonar.projectKey=$PROJECT_KEY \
  -Dsonar.sources=app \
  -Dsonar.tests=tests \
  -Dsonar.host.url=$SONAR_HOST \
  -Dsonar.token=$SONAR_TOKEN \
  -Dsonar.exclusions="**/tests/**,**/__pycache__/**,**/.venv/**,**/venv/**"

echo ""
echo "================================"
echo "Analysis Complete!"
echo "View results at:"
echo "$SONAR_HOST/dashboard?id=$PROJECT_KEY"
echo "================================"
