# Lovable Deployment Guide - NullAudit v3.0

## Overview

NullAudit v3.0 is fully optimized for deployment on **Lovable**, a modern AI-powered development platform. This guide walks through the deployment process step-by-step.

---

## Prerequisites

1. **Lovable Account** - Sign up at https://lovable.dev
2. **GitHub Repository** - Push NullAudit code to GitHub
3. **Environment Variables** - Prepare configuration values
4. **API Keys** - Gather necessary API credentials

---

## Step 1: Prepare Your Repository

### 1.1 Ensure Project Structure

Lovable auto-detects the following structure:

```
nullaudit-improved/
├── client/                    # React frontend
├── server/                    # Express backend
├── shared/                    # Shared types
├── contracts/                 # Smart contracts
├── package.json               # Root dependencies
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
├── mcp.json                   # MCP configuration
├── README.md                  # Documentation
└── .env.example               # Environment template
```

### 1.2 Create .env.example

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# NullShot Integration
NULLSHOT_API_KEY=your-nullshot-api-key
NULLSHOT_AGENT_ID=your-agent-id

# LLM Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key

# Blockchain Configuration
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
BASE_RPC_URL=https://mainnet.base.org

# IPFS Configuration
IPFS_GATEWAY=https://gateway.pinata.cloud

# Smart Contract Addresses
ATTESTATION_ANCHOR_ADDRESS_ETHEREUM=0x...
ATTESTATION_ANCHOR_ADDRESS_POLYGON=0x...

# Signer Configuration
SIGNER_PRIVATE_KEY=0x...
```

### 1.3 Verify package.json Scripts

```json
{
  "scripts": {
    "dev": "vite --host",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "preview": "vite preview --host",
    "check": "tsc --noEmit",
    "format": "prettier --write ."
  }
}
```

### 1.4 Push to GitHub

```bash
cd nullaudit-improved

# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "NullAudit v3.0 - Ready for Lovable deployment"

# Add remote and push
git remote add origin https://github.com/your-username/nullaudit-improved.git
git branch -M main
git push -u origin main
```

---

## Step 2: Connect to Lovable

### 2.1 Create New Project

1. Go to https://lovable.dev
2. Click **"New Project"** button
3. Select **"Import from GitHub"**

### 2.2 Authorize GitHub

1. Click **"Connect GitHub"**
2. Authorize Lovable to access your repositories
3. Select **nullaudit-improved** repository

### 2.3 Configure Project Settings

1. **Project Name**: `NullAudit`
2. **Description**: `Multi-LLM Security & Evaluation Agent with NullShot Integration`
3. **Visibility**: Public or Private (your choice)
4. Click **"Create Project"**

---

## Step 3: Configure Environment Variables

### 3.1 Access Environment Settings

1. In Lovable dashboard, go to **Settings** → **Environment Variables**
2. Click **"Add Variable"**

### 3.2 Add Required Variables

Add these variables with your actual values:

| Variable | Value | Example |
|----------|-------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `NULLSHOT_API_KEY` | Your NullShot API key | `sk_...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `ETHEREUM_RPC_URL` | Ethereum RPC | `https://...` |
| `POLYGON_RPC_URL` | Polygon RPC | `https://...` |

### 3.3 Save Variables

Click **"Save"** to apply environment variables.

---

## Step 4: Build Configuration

### 4.1 Verify Build Settings

Lovable should auto-detect:
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`
- **Output Directory**: `dist`

### 4.2 Review Build Logs

1. Go to **Deployments** tab
2. Click on latest deployment
3. Review build logs for any errors

---

## Step 5: Deploy

### 5.1 Trigger Deployment

**Option A: Automatic Deployment**
- Lovable auto-deploys on every push to main branch

**Option B: Manual Deployment**
1. Go to **Deployments** tab
2. Click **"Deploy Now"**
3. Wait for build to complete

### 5.2 Monitor Deployment

```
Status: Building...
├─ Installing dependencies
├─ Building frontend (Vite)
├─ Building backend (esbuild)
└─ Deploying to edge network
```

### 5.3 Access Your App

Once deployed, access at:
```
https://nullaudit-[random-id].lovable.app
```

---

## Step 6: Post-Deployment Verification

### 6.1 Check Health

```bash
curl https://nullaudit-[random-id].lovable.app/api/mcp/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "3.0.0"
}
```

### 6.2 Test MCP Tools

```bash
curl https://nullaudit-[random-id].lovable.app/api/mcp/manifest | jq
```

### 6.3 Verify Frontend

1. Open https://nullaudit-[random-id].lovable.app in browser
2. Check dashboard loads correctly
3. Verify UI is responsive

---

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain

1. Go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `nullaudit.example.com`)

### 7.2 Configure DNS

Follow Lovable's DNS configuration instructions:
- Add CNAME record pointing to Lovable edge network
- Wait for DNS propagation (5-15 minutes)

### 7.3 Enable HTTPS

Lovable automatically provisions SSL certificate for custom domains.

---

## Troubleshooting

### Issue: Build Fails

**Problem**: `pnpm install` fails during build

**Solution**:
```bash
# Locally verify build works
pnpm install
pnpm build

# Check for any TypeScript errors
pnpm check

# Push fixed code to GitHub
git add .
git commit -m "Fix build errors"
git push origin main
```

### Issue: Environment Variables Not Loaded

**Problem**: `process.env.VARIABLE` returns undefined

**Solution**:
1. Verify variable is set in Lovable dashboard
2. Ensure variable name matches exactly (case-sensitive)
3. Redeploy after adding variables
4. Check server logs for errors

### Issue: API Endpoints Not Responding

**Problem**: `404 Not Found` on `/api/mcp/*`

**Solution**:
1. Verify server is running: `curl https://your-app.lovable.app/api/mcp/health`
2. Check server logs in Lovable dashboard
3. Ensure Express routes are properly configured
4. Verify `server/index.ts` is correctly bundled

### Issue: Frontend Not Loading

**Problem**: Blank page or 404

**Solution**:
1. Check browser console for errors
2. Verify Vite build output in `dist/public`
3. Ensure `index.html` is in correct location
4. Check that static file serving is configured

---

## Monitoring & Logs

### 7.1 Access Logs

1. Go to **Deployments** → **Logs**
2. Filter by date/time
3. Search for errors or specific messages

### 7.2 Monitor Performance

1. Go to **Analytics** tab
2. View request metrics
3. Monitor error rates

### 7.3 Set Up Alerts (Optional)

1. Go to **Settings** → **Alerts**
2. Configure alerts for:
   - Build failures
   - High error rates
   - Deployment issues

---

## Continuous Deployment

### 8.1 Auto-Deploy on Push

Lovable automatically deploys when you push to main:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Lovable automatically builds and deploys
# Check deployment status in dashboard
```

### 8.2 Preview Deployments

Create a preview deployment for pull requests:

1. Create feature branch
2. Push to GitHub
3. Create pull request
4. Lovable creates preview deployment
5. Test changes before merging

---

## Performance Optimization

### 9.1 Enable Caching

Lovable automatically caches:
- Static assets (images, CSS, JS)
- API responses (configurable)
- Database queries (if applicable)

### 9.2 Monitor Bundle Size

```bash
# Locally check bundle size
pnpm build

# Review dist folder size
du -sh dist/
```

### 9.3 Optimize Images

- Use WebP format where possible
- Compress images before uploading
- Use responsive images

---

## Security Best Practices

### 10.1 Environment Variables

✅ **DO**:
- Store sensitive data in environment variables
- Use strong, unique API keys
- Rotate keys regularly

❌ **DON'T**:
- Commit secrets to repository
- Share API keys in chat/email
- Use same key across environments

### 10.2 HTTPS

- All Lovable apps use HTTPS by default
- Custom domains get automatic SSL certificates
- Enable HSTS for additional security

### 10.3 Rate Limiting

- Implement rate limiting on API endpoints
- Use Lovable's built-in DDoS protection
- Monitor for suspicious traffic

---

## Scaling

### 11.1 Auto-Scaling

Lovable automatically scales based on traffic:
- Horizontal scaling for high load
- Automatic load balancing
- No manual configuration needed

### 11.2 Database Scaling

If using database:
- Lovable provides managed database options
- Automatic backups
- Point-in-time recovery

### 11.3 Cost Optimization

- Monitor resource usage
- Optimize database queries
- Cache frequently accessed data
- Use edge functions for computation

---

## Rollback & Versioning

### 12.1 Rollback to Previous Deployment

1. Go to **Deployments** tab
2. Find previous deployment
3. Click **"Rollback"**
4. Confirm rollback

### 12.2 Version Management

Tag releases in GitHub:

```bash
git tag -a v3.0.0 -m "NullAudit v3.0 - NullShot Integration"
git push origin v3.0.0
```

---

## Support & Resources

- **Lovable Documentation**: https://lovable.dev/docs
- **Lovable Community**: https://discord.gg/lovable
- **NullAudit GitHub**: https://github.com/your-username/nullaudit-improved
- **NullShot Docs**: https://nullshot.ai/en/docs/developers

---

## Checklist

- [ ] Repository pushed to GitHub
- [ ] Project created in Lovable
- [ ] Environment variables configured
- [ ] Build succeeds locally
- [ ] Deployment completes without errors
- [ ] Health endpoint responds
- [ ] Frontend loads correctly
- [ ] MCP tools are accessible
- [ ] Smart contracts deployed (if needed)
- [ ] Custom domain configured (optional)
- [ ] Monitoring and alerts set up
- [ ] Documentation updated

---

**Version 3.0** - Lovable Deployment Guide  
**Last Updated**: December 4, 2024

**Status**: ✅ Ready for Production Deployment
