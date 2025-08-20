# SELLY Heroku Deployment Reference

**Created:** 2025-01-27  
**Last Updated:** 2025-01-27  
**Status:** Production Ready

## Quick Reference

### App URLs Template
```
Frontend: https://[your-app-name]-frontend.herokuapp.com
Backend:  https://[your-app-name]-backend.herokuapp.com
```

### Essential Commands
```bash
# Deploy both apps
./deploy-heroku.bat

# Check app status
heroku ps -a your-app-name

# View logs
heroku logs --tail -a your-app-name

# Scale dynos
heroku ps:scale web=1:standard-2x -a your-app-name
```

## Architecture Overview

```
┌─────────────────────────┐    HTTPS    ┌──────────────────────────┐
│   HEROKU FRONTEND       │ ──────────► │   HEROKU BACKEND         │
│                         │             │                          │
│  Next.js App (SELLY)    │             │  Python FastAPI Service │
│  • Chat Interface       │             │  • IndoBERT Models       │
│  • Dashboard            │             │  • Transformers Library  │
│  • Authentication       │             │  • Indonesian NLP        │
│                         │             │                          │
│  Port: $PORT            │             │  Port: $PORT             │
│  Dyno: Standard-1X      │             │  Dyno: Standard-2X       │
│  Cost: $25/month        │             │  Cost: $50/month         │
└─────────────────────────┘             └──────────────────────────┘
```

## Prerequisites Checklist

### ✅ Required Tools
- [ ] **Heroku CLI** installed and logged in
- [ ] **Git** repository initialized
- [ ] **Node.js 18+** for local development
- [ ] **Python 3.11+** for backend service

### ✅ Required Accounts & Keys
- [ ] **Heroku Account** (free tier available)
- [ ] **Hugging Face API Key** (`hf_...`)
- [ ] **DeepSeek API Key** (`sk-...`)
- [ ] **Supabase Project** (URL + Anon Key)

### ✅ Environment Variables Ready
```bash
# AI Services
HUGGINGFACE_API_KEY=hf_your_key_here
DEEPSEEK_API_KEY=sk_your_key_here

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# IndoBERT Service
NEXT_PUBLIC_ENABLE_INDOBERT_SERVICE=true
INDOBERT_SERVICE_URL=https://your-backend.herokuapp.com
```

## Step-by-Step Deployment

### Method 1: Automated Deployment (Recommended)

```bash
# 1. Run the automated script
./deploy-heroku.bat

# 2. Follow prompts:
#    - Enter frontend app name (e.g., selly-frontend)
#    - Enter backend app name (e.g., selly-backend)
#    - Confirm deployment

# 3. Wait for deployment (5-10 minutes)

# 4. Test deployment
node scripts/test-heroku-deployment.js
```

### Method 2: Manual Deployment

#### Step 1: Deploy Backend (IndoBERT Service)

```bash
# Navigate to Python service
cd python-ai-service

# Create Heroku app
heroku create your-app-name-backend

# Configure environment
heroku config:set PYTHONPATH=/app -a your-app-name-backend
heroku config:set WEB_CONCURRENCY=1 -a your-app-name-backend

# Initialize git and deploy
git init
git add .
git commit -m "SELLY IndoBERT Service"
heroku git:remote -a your-app-name-backend
git push heroku main

# Verify deployment
heroku open -a your-app-name-backend
# Should show: {"service": "SELLY IndoBERT Service", "status": "running"}
```

#### Step 2: Deploy Frontend (Next.js App)

```bash
# Return to project root
cd ..

# Create frontend app
heroku create your-app-name-frontend

# Set environment variables
heroku config:set NEXT_PUBLIC_ENABLE_INDOBERT_SERVICE=true -a your-app-name-frontend
heroku config:set INDOBERT_SERVICE_URL=https://your-app-name-backend.herokuapp.com -a your-app-name-frontend
heroku config:set NEXT_PUBLIC_ENABLE_HUGGINGFACE=true -a your-app-name-frontend
heroku config:set HUGGINGFACE_API_KEY=your_hf_key -a your-app-name-frontend
heroku config:set DEEPSEEK_API_KEY=your_deepseek_key -a your-app-name-frontend
heroku config:set SUPABASE_URL=your_supabase_url -a your-app-name-frontend
heroku config:set SUPABASE_ANON_KEY=your_supabase_key -a your-app-name-frontend

# Deploy
git add .
git commit -m "SELLY Frontend with IndoBERT Integration"
heroku git:remote -a your-app-name-frontend
git push heroku main

# Open app
heroku open -a your-app-name-frontend
```

## Configuration Reference

### Backend Configuration (Python Service)

#### Required Files
```
python-ai-service/
├── Procfile                 # web: uvicorn main:app --host 0.0.0.0 --port $PORT
├── runtime.txt              # python-3.11.7
├── requirements.txt         # Python dependencies
└── main.py                  # FastAPI application
```

#### Environment Variables
```bash
# System
PYTHONPATH=/app
WEB_CONCURRENCY=1
PORT=(auto-assigned by Heroku)

# Optional: Model optimization
MODEL_DOWNLOAD_TIMEOUT=300
HEROKU_APP_NAME=(auto-set by Heroku)
```

### Frontend Configuration (Next.js App)

#### Required Files
```
├── Dockerfile               # Node.js container definition
├── heroku.yml              # Heroku build configuration
├── package.json            # Node.js dependencies
└── next.config.js          # Next.js configuration
```

#### Environment Variables
```bash
# Core App
NODE_ENV=production
PORT=(auto-assigned by Heroku)

# IndoBERT Integration
NEXT_PUBLIC_ENABLE_INDOBERT_SERVICE=true
INDOBERT_SERVICE_URL=https://your-backend.herokuapp.com

# AI Services
NEXT_PUBLIC_ENABLE_HUGGINGFACE=true
HUGGINGFACE_API_KEY=hf_your_key
DEEPSEEK_API_KEY=sk_your_key

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# TensorFlow (if enabled)
NEXT_PUBLIC_ENABLE_TENSORFLOW=true
```

## Dyno Sizing & Costs

### Recommended Production Setup

| Component | Dyno Type | RAM | CPU | Cost/Month | Reason |
|-----------|-----------|-----|-----|------------|---------|
| **Backend** | Standard-2X | 1GB | 2x | $50 | IndoBERT models need memory |
| **Frontend** | Standard-1X | 512MB | 1x | $25 | Sufficient for Next.js |
| **Total** | - | - | - | **$75** | Production ready |

### Budget Options

| Setup | Backend | Frontend | Total Cost | Performance |
|-------|---------|----------|------------|-------------|
| **Free Tier** | Free | Free | $0 | Testing only, may crash |
| **Hobby** | Hobby | Hobby | $14 | Limited, sleeps after 30min |
| **Mixed** | Standard-2X | Hobby | $57 | Good performance, some sleep |
| **Production** | Standard-2X | Standard-1X | $75 | Full performance |

### Scaling Commands
```bash
# Scale backend for IndoBERT
heroku ps:scale web=1:standard-2x -a your-backend-app

# Scale frontend
heroku ps:scale web=1:standard-1x -a your-frontend-app

# Check current scaling
heroku ps -a your-app-name
```

## Testing & Verification

### Health Checks
```bash
# Backend health
curl https://your-backend.herokuapp.com/
# Expected: {"service": "SELLY IndoBERT Service", "status": "running"}

# Frontend health
curl https://your-frontend.herokuapp.com/
# Expected: HTML page or redirect

# IndoBERT processing test
curl -X POST https://your-backend.herokuapp.com/process \
  -H "Content-Type: application/json" \
  -d '{"text": "Halo SELLY", "task": "feature-extraction", "model_name": "indobert-base"}'
```

### Integration Testing
```bash
# Run comprehensive test
node scripts/test-heroku-deployment.js https://your-frontend.herokuapp.com https://your-backend.herokuapp.com

# Test specific features
# 1. Open: https://your-frontend.herokuapp.com/test-hf
# 2. Try Indonesian queries
# 3. Check for "🇮🇩 Using IndoBERT Transformers service" in logs
```

### Performance Monitoring
```bash
# View real-time logs
heroku logs --tail -a your-backend-app
heroku logs --tail -a your-frontend-app

# Check dyno metrics
heroku ps:exec -a your-backend-app
# Then run: top, free -h, df -h

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-backend.herokuapp.com/
```

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. Backend Memory Errors
```
Error: "Memory quota exceeded" or "R14 - Memory quota exceeded"
```
**Solution:**
```bash
# Upgrade to larger dyno
heroku ps:scale web=1:standard-2x -a your-backend-app

# Check memory usage
heroku ps:exec -a your-backend-app
# Run: free -h
```

#### 2. Model Loading Timeout
```
Error: "Model download timeout" or "H12 - Request timeout"
```
**Solution:**
```bash
# Increase timeout
heroku config:set MODEL_DOWNLOAD_TIMEOUT=600 -a your-backend-app

# Restart app to reload models
heroku restart -a your-backend-app
```

#### 3. Frontend Can't Connect to Backend
```
Error: "Failed to fetch" or "Network error"
```
**Solution:**
```bash
# Check backend URL configuration
heroku config:get INDOBERT_SERVICE_URL -a your-frontend-app

# Should return: https://your-backend.herokuapp.com
# If wrong, fix it:
heroku config:set INDOBERT_SERVICE_URL=https://your-backend.herokuapp.com -a your-frontend-app
```

#### 4. Build Failures
```
Error: "Build failed" or "Push rejected"
```
**Solution:**
```bash
# Check build logs
heroku logs --tail -a your-app-name

# Common fixes:
# - Check Python version in runtime.txt
# - Verify requirements.txt syntax
# - Ensure Procfile exists and is correct
# - Check package.json for Node.js apps
```

#### 5. App Sleeping (Free/Hobby Dynos)
```
Error: "Application Error" after inactivity
```
**Solution:**
```bash
# Upgrade to Standard dynos (no sleeping)
heroku ps:scale web=1:standard-1x -a your-app-name

# Or use a ping service to keep app awake
# Add to cron: curl https://your-app.herokuapp.com/ every 25 minutes
```

### Debugging Commands
```bash
# Access app shell
heroku ps:exec -a your-app-name

# View environment variables
heroku config -a your-app-name

# Check dyno status
heroku ps -a your-app-name

# View recent logs
heroku logs --num=100 -a your-app-name

# Restart app
heroku restart -a your-app-name
```

## Maintenance & Updates

### Regular Maintenance Tasks

#### Weekly
- [ ] Check app performance and response times
- [ ] Review error logs for issues
- [ ] Monitor dyno usage and costs

#### Monthly
- [ ] Update dependencies (security patches)
- [ ] Review and optimize dyno sizing
- [ ] Check API key usage and limits
- [ ] Backup environment configurations

#### Quarterly
- [ ] Review and update Python/Node.js versions
- [ ] Optimize model loading and caching
- [ ] Performance testing and optimization
- [ ] Cost analysis and optimization

### Update Deployment
```bash
# Update backend
cd python-ai-service
git add .
git commit -m "Update IndoBERT service"
git push heroku main

# Update frontend
cd ..
git add .
git commit -m "Update SELLY frontend"
git push heroku main
```

### Backup Configuration
```bash
# Export all environment variables
heroku config -a your-frontend-app > frontend-config-backup.txt
heroku config -a your-backend-app > backend-config-backup.txt

# Save app information
echo "Frontend: $(heroku info -a your-frontend-app --json)" > app-info.json
echo "Backend: $(heroku info -a your-backend-app --json)" >> app-info.json
```

## Security Best Practices

### Environment Variables
- ✅ Never commit API keys to git
- ✅ Use Heroku config vars for all secrets
- ✅ Rotate API keys regularly (quarterly)
- ✅ Use different keys for staging/production

### CORS Configuration
```python
# In python-ai-service/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.herokuapp.com",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### HTTPS Enforcement
```javascript
// In next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ]
  }
}
```

## Performance Optimization

### Backend Optimizations
```python
# Model caching
@lru_cache(maxsize=3)
def get_cached_model(model_name: str):
    return load_model(model_name)

# Connection pooling
import asyncio
semaphore = asyncio.Semaphore(10)  # Limit concurrent requests

# Memory management
import gc
gc.collect()  # Force garbage collection after model operations
```

### Frontend Optimizations
```javascript
// API request caching
const cache = new Map();
const getCachedResponse = (key, fetcher) => {
  if (cache.has(key)) return cache.get(key);
  const response = fetcher();
  cache.set(key, response);
  return response;
};

// Request debouncing
import { debounce } from 'lodash';
const debouncedApiCall = debounce(apiCall, 300);
```

## Monitoring & Alerts

### Add-ons for Monitoring
```bash
# Papertrail for log management
heroku addons:create papertrail -a your-app-name

# New Relic for performance monitoring
heroku addons:create newrelic -a your-app-name

# Heroku Postgres for database (if needed)
heroku addons:create heroku-postgresql:hobby-dev -a your-app-name
```

### Custom Health Checks
```python
# Add to main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "models_loaded": len(models),
        "memory_usage": get_memory_usage()
    }
```

## Cost Optimization Tips

### Reduce Costs
1. **Use Hobby dynos** for development ($7/month each)
2. **Scale down during off-hours** (if applicable)
3. **Use free add-ons** where possible
4. **Monitor usage** with Heroku metrics
5. **Optimize model loading** to reduce memory usage

### Cost Monitoring
```bash
# View current costs
heroku ps -a your-app-name

# Set up billing alerts
heroku addons:create heroku-billing-alerts

# Monitor dyno usage
heroku logs --ps=web -a your-app-name | grep "dyno"
```

## Quick Command Reference

```bash
# Deployment
./deploy-heroku.bat                                    # Automated deployment
git push heroku main                                   # Manual deployment

# Management
heroku ps -a your-app-name                            # Check dyno status
heroku logs --tail -a your-app-name                   # View live logs
heroku restart -a your-app-name                       # Restart app
heroku ps:scale web=1:standard-2x -a your-app-name    # Scale dyno

# Configuration
heroku config -a your-app-name                        # View all config vars
heroku config:set KEY=value -a your-app-name          # Set config var
heroku config:unset KEY -a your-app-name              # Remove config var

# Debugging
heroku ps:exec -a your-app-name                       # Access app shell
heroku logs --num=100 -a your-app-name                # View recent logs
heroku run bash -a your-app-name                      # Run one-off command

# Testing
node scripts/test-heroku-deployment.js                # Test deployment
curl https://your-app.herokuapp.com/health            # Health check
```

---

## Summary

This deployment setup provides:

✅ **Production-Ready Architecture** - Separate frontend/backend scaling  
✅ **Indonesian AI Processing** - Full IndoBERT capabilities via Transformers  
✅ **Cost-Effective Scaling** - Pay only for what you need  
✅ **Professional Infrastructure** - Heroku's enterprise-grade platform  
✅ **Easy Maintenance** - Simple git-based deployments  
✅ **Global Accessibility** - CDN and worldwide availability  

**Total Setup Time:** ~30 minutes  
**Monthly Cost:** $14-75 (depending on dyno types)  
**Performance:** Production-ready with proper scaling  

Your SELLY with IndoBERT is ready for the world! 🚀🇮🇩
