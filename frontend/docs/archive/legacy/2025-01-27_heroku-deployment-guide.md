# SELLY Heroku Deployment Guide

**Date:** 2025-01-27  
**Author:** AI Assistant  
**Status:** Ready for Deployment

## Overview

This guide covers deploying SELLY with IndoBERT Transformers to Heroku using a **two-app architecture**:

1. **Frontend App** - Next.js application (SELLY interface)
2. **Backend App** - Python FastAPI service (IndoBERT processing)

## Architecture

```
┌─────────────────────┐    HTTPS    ┌──────────────────────┐
│   Heroku Frontend   │ ──────────► │   Heroku Backend     │
│   (Next.js SELLY)   │             │   (IndoBERT API)     │
│ selly-frontend.app  │             │ selly-indobert.app   │
└─────────────────────┘             └──────────────────────┘
```

## Prerequisites

### 1. Heroku Account & CLI
```bash
# Install Heroku CLI
# Windows: Download from https://devcenter.heroku.com/articles/heroku-cli
# macOS: brew install heroku/brew/heroku
# Linux: curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login
```

### 2. Git Repository
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"
```

### 3. Environment Variables Ready
- `HUGGINGFACE_API_KEY`
- `DEEPSEEK_API_KEY`
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`

## Deployment Methods

### Method 1: Automated Script (Recommended)

```bash
# Windows
deploy-heroku.bat

# Manual equivalent
cd python-ai-service
heroku create selly-indobert
git init
git add .
git commit -m "IndoBERT service"
heroku git:remote -a selly-indobert
git push heroku main

cd ..
heroku create selly-frontend
heroku config:set INDOBERT_SERVICE_URL=https://selly-indobert.herokuapp.com
git push heroku main
```

### Method 2: Manual Step-by-Step

#### Step 1: Deploy Backend (IndoBERT Service)

```bash
# Navigate to Python service
cd python-ai-service

# Create Heroku app
heroku create your-app-name-indobert

# Set environment variables
heroku config:set PYTHONPATH=/app
heroku config:set WEB_CONCURRENCY=1

# Initialize git and deploy
git init
git add .
git commit -m "IndoBERT service for SELLY"
heroku git:remote -a your-app-name-indobert
git push heroku main

# Test deployment
heroku open
# Should show: {"service": "SELLY IndoBERT Service", "status": "running"}
```

#### Step 2: Deploy Frontend (Next.js App)

```bash
# Return to project root
cd ..

# Create frontend app
heroku create your-app-name-frontend

# Set environment variables
heroku config:set NEXT_PUBLIC_ENABLE_INDOBERT_SERVICE=true
heroku config:set INDOBERT_SERVICE_URL=https://your-app-name-indobert.herokuapp.com
heroku config:set NEXT_PUBLIC_ENABLE_HUGGINGFACE=true
heroku config:set HUGGINGFACE_API_KEY=your_hf_key
heroku config:set DEEPSEEK_API_KEY=your_deepseek_key

# Add all your other environment variables from .env.local
heroku config:set SUPABASE_URL=your_supabase_url
heroku config:set SUPABASE_ANON_KEY=your_supabase_key
# ... etc

# Deploy
git add .
git commit -m "SELLY frontend with IndoBERT integration"
heroku git:remote -a your-app-name-frontend
git push heroku main

# Open app
heroku open
```

## Heroku Configuration

### Backend App Settings

```bash
# Python runtime
echo "python-3.11.7" > python-ai-service/runtime.txt

# Process type
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > python-ai-service/Procfile

# Environment variables
heroku config:set PYTHONPATH=/app -a your-backend-app
heroku config:set WEB_CONCURRENCY=1 -a your-backend-app
```

### Frontend App Settings

```bash
# Environment variables
heroku config:set NODE_ENV=production -a your-frontend-app
heroku config:set NEXT_PUBLIC_ENABLE_INDOBERT_SERVICE=true -a your-frontend-app
heroku config:set INDOBERT_SERVICE_URL=https://your-backend-app.herokuapp.com -a your-frontend-app
```

## Memory and Performance Optimization

### Backend Optimization

```python
# In main.py - Heroku memory limits
MODEL_CONFIGS = {
    "indobert-base": {
        "model_id": "indobenchmark/indobert-base-p1",
        "type": "feature-extraction",
        "description": "Base IndoBERT model (optimized for Heroku)"
    }
    # Remove large models for Heroku deployment
}
```

### Heroku Dyno Types

| Dyno Type | RAM | CPU | Cost | Recommended For |
|-----------|-----|-----|------|-----------------|
| **Free** | 512MB | 1x | $0 | Testing only |
| **Hobby** | 512MB | 1x | $7/month | Light usage |
| **Standard-1X** | 512MB | 1x | $25/month | Production |
| **Standard-2X** | 1GB | 2x | $50/month | **Recommended for IndoBERT** |

```bash
# Upgrade to Standard-2X for better performance
heroku ps:scale web=1:standard-2x -a your-backend-app
```

## Environment Variables

### Required for Backend
```bash
PYTHONPATH=/app
WEB_CONCURRENCY=1
PORT=(automatically set by Heroku)
```

### Required for Frontend
```bash
# IndoBERT Integration
NEXT_PUBLIC_ENABLE_INDOBERT_SERVICE=true
INDOBERT_SERVICE_URL=https://your-backend-app.herokuapp.com

# AI Services
NEXT_PUBLIC_ENABLE_HUGGINGFACE=true
HUGGINGFACE_API_KEY=hf_your_key
DEEPSEEK_API_KEY=sk-your_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Other environment variables from your .env.local
```

## Testing Deployment

### 1. Test Backend Service
```bash
# Health check
curl https://your-backend-app.herokuapp.com/

# Test IndoBERT processing
curl -X POST https://your-backend-app.herokuapp.com/process \
  -H "Content-Type: application/json" \
  -d '{"text": "Halo SELLY", "task": "feature-extraction", "model_name": "indobert-base"}'
```

### 2. Test Frontend Integration
```bash
# Open test page
https://your-frontend-app.herokuapp.com/test-hf

# Test Indonesian queries
# Should show "🇮🇩 Using IndoBERT Transformers service" in logs
```

### 3. Monitor Logs
```bash
# Backend logs
heroku logs --tail -a your-backend-app

# Frontend logs  
heroku logs --tail -a your-frontend-app
```

## Troubleshooting

### Common Issues

#### 1. Backend Memory Errors
```bash
# Error: "Memory quota exceeded"
# Solution: Upgrade dyno type
heroku ps:scale web=1:standard-2x -a your-backend-app

# Or optimize model loading
# Edit main.py to load only essential models
```

#### 2. Model Download Timeout
```bash
# Error: "Model download timeout"
# Solution: Increase timeout and use smaller models
heroku config:set MODEL_DOWNLOAD_TIMEOUT=300 -a your-backend-app
```

#### 3. Frontend Can't Connect to Backend
```bash
# Check environment variable
heroku config:get INDOBERT_SERVICE_URL -a your-frontend-app

# Should return: https://your-backend-app.herokuapp.com
# If not, set it:
heroku config:set INDOBERT_SERVICE_URL=https://your-backend-app.herokuapp.com -a your-frontend-app
```

#### 4. Build Failures
```bash
# Backend build fails
heroku logs --tail -a your-backend-app
# Check requirements.txt and Python version

# Frontend build fails  
heroku logs --tail -a your-frontend-app
# Check package.json and Node.js version
```

## Cost Optimization

### Free Tier Limitations
- **512MB RAM** - May not be enough for IndoBERT
- **Sleep after 30 minutes** - Cold starts
- **550 dyno hours/month** - Limited uptime

### Recommended Production Setup
```bash
# Backend: Standard-2X ($50/month)
heroku ps:scale web=1:standard-2x -a your-backend-app

# Frontend: Standard-1X ($25/month)  
heroku ps:scale web=1:standard-1x -a your-frontend-app

# Total: ~$75/month for full IndoBERT capability
```

### Cost-Saving Alternatives
1. **Use Hobby dynos** ($7/month each) for testing
2. **Scale down when not in use**
3. **Use Heroku Scheduler** for periodic tasks
4. **Consider Railway or Render** as alternatives

## Monitoring and Maintenance

### Health Checks
```bash
# Add health check endpoints
# Backend: GET /health
# Frontend: GET /api/health

# Set up monitoring
heroku addons:create papertrail -a your-backend-app
heroku addons:create papertrail -a your-frontend-app
```

### Performance Monitoring
```bash
# Add New Relic (free tier available)
heroku addons:create newrelic -a your-backend-app
heroku addons:create newrelic -a your-frontend-app
```

### Automated Deployments
```bash
# Connect to GitHub for auto-deploy
heroku git:remote -a your-frontend-app
heroku config:set GITHUB_REPO=your-username/your-repo
```

## Security Considerations

### Environment Variables
- Never commit API keys to git
- Use Heroku config vars for all secrets
- Rotate keys regularly

### CORS Configuration
```python
# In main.py, add CORS for frontend domain
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-app.herokuapp.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Conclusion

Deploying SELLY with IndoBERT to Heroku provides:

✅ **Scalable Architecture** - Separate frontend and backend scaling  
✅ **Professional Deployment** - Production-ready with monitoring  
✅ **Cost-Effective** - Pay only for what you use  
✅ **Easy Maintenance** - Heroku handles infrastructure  
✅ **Global CDN** - Fast worldwide access  

**Total Setup Time:** ~30 minutes  
**Monthly Cost:** $14-75 depending on dyno types  
**Performance:** Production-ready with proper dyno sizing

Ready to deploy your Indonesian AI assistant to the world! 🚀
