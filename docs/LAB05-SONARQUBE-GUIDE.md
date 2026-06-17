# SonarQube SAST Analysis Guide - Lab #05

This document explains how to set up and run SonarQube static code analysis on the USV Events application.

## What is SonarQube?

SonarQube is a self-managed, automatic code review tool that:
- Detects bugs, vulnerabilities, and code smells
- Performs SAST (Static Application Security Testing)
- Measures code quality and technical debt
- Supports multiple programming languages (Python, JavaScript, Java, etc.)

## Prerequisites

- Docker and Docker Compose installed
- Backend and Frontend source code

## Step 1: Start SonarQube with Docker Compose

Start SonarQube and its database container:

```bash
docker compose up -d sonarqube sonarqube_db
```

This will:
- Start PostgreSQL database for SonarQube (port 5432 internally)
- Start SonarQube server (port 9000)
- Wait for health checks to pass (~30-60 seconds on first startup)

Verify SonarQube is running:

```bash
curl http://localhost:9000/api/system/health
```

Expected response:
```json
{
  "health": "GREEN",
  "causes": []
}
```

## Step 2: Access SonarQube Web Interface

Open browser and go to: http://localhost:9000

**Default credentials:**
- Username: `admin`
- Password: `admin`

**First login:** You'll be prompted to change the admin password.

## Step 3: Create Project Tokens

### For Backend Analysis

1. Go to http://localhost:9000/account/security
2. Click "Generate Tokens"
3. Token name: `usv_events_backend_token`
4. Select type: Global Analysis Token
5. Copy the token (you'll use it in next step)

### For Frontend Analysis

1. Repeat steps 1-5 with token name: `usv_events_frontend_token`

## Step 4: Install SonarQube Scanner

SonarQube Scanner is needed to analyze the code.

### Option A: Using npm (Recommended for Frontend)

```bash
npm install -g sonarqube-scanner
```

### Option B: Download standalone scanner

https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/

### Windows Command Line

For Windows, you can also use PowerShell with the standalone scanner.

## Step 5: Analyze Backend (Python)

Navigate to backend directory and run analysis:

```bash
cd backend

# If using npm sonar-scanner
sonar-scanner \
  -Dsonar.projectKey=usv_events_backend \
  -Dsonar.sources=app \
  -Dsonar.tests=tests \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_BACKEND_TOKEN_HERE
```

#### Windows PowerShell:

```powershell
$env:SONAR_TOKEN = "YOUR_BACKEND_TOKEN_HERE"

sonar-scanner `
  -Dsonar.projectKey=usv_events_backend `
  -Dsonar.sources=app `
  -Dsonar.tests=tests `
  -Dsonar.host.url=http://localhost:9000 `
  -Dsonar.token=$env:SONAR_TOKEN
```

Analysis will take 1-3 minutes. Watch the console output for progress.

## Step 6: Analyze Frontend (JavaScript/React)

Navigate to frontend directory and run analysis:

```bash
cd frontend

# Install dependencies first (if not already done)
npm install

# Run build to generate files for analysis
npm run build

# Run SonarScanner
sonar-scanner \
  -Dsonar.projectKey=usv_events_frontend \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_FRONTEND_TOKEN_HERE
```

#### Windows PowerShell:

```powershell
$env:SONAR_TOKEN = "YOUR_FRONTEND_TOKEN_HERE"

sonar-scanner `
  -Dsonar.projectKey=usv_events_frontend `
  -Dsonar.sources=src `
  -Dsonar.host.url=http://localhost:9000 `
  -Dsonar.token=$env:SONAR_TOKEN
```

## Step 7: View Analysis Results

After analysis completes, view results at:

- Backend: http://localhost:9000/dashboard?id=usv_events_backend
- Frontend: http://localhost:9000/dashboard?id=usv_events_frontend

### Key Metrics to Review

1. **Code Quality Gate**: Pass/Fail status
2. **Bugs**: Issues that could cause crashes or incorrect behavior
3. **Vulnerabilities**: Security issues
4. **Code Smells**: Maintainability issues  
5. **Coverage**: Test coverage percentage
6. **Duplications**: Code duplication percentage
7. **Technical Debt**: Time to fix all issues

## Step 8: Generate Report

### Export Quality Gate Report

1. In SonarQube, go to project dashboard
2. Click "Print" or use browser print function
3. Save as PDF

### Via Command Line (API)

Backend report:
```bash
curl -u admin:PASSWORD http://localhost:9000/api/issues/search?componentKeys=usv_events_backend > backend_issues.json
```

Frontend report:
```bash
curl -u admin:PASSWORD http://localhost:9000/api/issues/search?componentKeys=usv_events_frontend > frontend_issues.json
```

## Troubleshooting

### SonarQube web interface not accessible

Check logs:
```bash
docker logs usv_events_sonarqube
```

Wait longer (first startup can take 2-3 minutes).

### Analysis fails with "invalid token"

- Verify token is correct and not expired
- Generate a new token if needed
- Check spelling of project key matches `-Dsonar.projectKey`

### "No execution found" error

Verify you're in the correct directory with `sonar-project.properties` or use full `-D` parameters

### Port already in use

Change SonarQube port in docker-compose.yml:
```yaml
ports:
  - "9001:9000"  # Changed from 9000
```

Then access at http://localhost:9001

### Scanner not found

Install globally:
```bash
npm install -g sonarqube-scanner
```

Or use full path to scanner executable.

## Security Considerations

1. **Never commit tokens** to Git - use environment variables
2. **Change default admin password** on first login
3. **In production**, set `sonar.forceAuthentication=true`
4. **Network isolation**: Keep SonarQube access restricted

## Integration with CI/CD

For automated analysis in GitHub Actions or similar:

```yaml
- name: SonarQube Analysis
  run: |
    sonar-scanner \
      -Dsonar.projectKey=${{ secrets.SONAR_PROJECT_KEY }} \
      -Dsonar.host.url=${{ secrets.SONAR_HOST_URL }} \
      -Dsonar.token=${{ secrets.SONAR_TOKEN }}
```

## Lab #05 Deliverables

1. ✅ SonarQube installed and running
2. ✅ Backend analysis completed
3. ✅ Frontend analysis completed
4. 📋 Generate screenshot showing:
   - SonarQube dashboard overview
   - Backend quality metrics
   - Frontend quality metrics
   - List of detected vulnerabilities/bugs
5. 📋 Export PDF reports for ClickUp

## References

- SonarQube Documentation: https://docs.sonarqube.org
- SonarQube Scanner: https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
- Python Analysis: https://docs.sonarqube.org/latest/analysis/languages/python/
- JavaScript Analysis: https://docs.sonarqube.org/latest/analysis/languages/javascript/
