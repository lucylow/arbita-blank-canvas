# Deployment Guide for Lovable

This guide explains how to deploy NullAudit webapp to Lovable platform.

## Prerequisites

- Lovable account
- Git repository (optional)
- Node.js 18+ and pnpm installed locally for testing

## Project Structure

NullAudit follows the standard Vite + React + Express structure that Lovable supports:

```
nullaudit-webapp/
├── client/          # Frontend React application
├── server/          # Backend Express server
├── shared/          # Shared types and utilities
├── contracts/       # Smart contracts (Solidity)
├── package.json     # Dependencies and scripts
└── vite.config.ts   # Vite configuration
```

## Deployment Steps

### 1. Prepare the Project

Ensure all files are in place:
- ✅ client/src/ contains all React components
- ✅ server/ contains Express routes
- ✅ shared/ contains TypeScript types
- ✅ package.json has all dependencies
- ✅ vite.config.ts is properly configured

### 2. Upload to Lovable

**Option A: Direct Upload**
1. Compress the entire project as a ZIP file
2. Go to Lovable dashboard
3. Click "New Project" → "Upload ZIP"
4. Select your nullaudit-webapp.zip
5. Wait for Lovable to process and deploy

**Option B: Git Integration**
1. Push code to GitHub repository
2. Connect Lovable to your GitHub account
3. Select the repository
4. Lovable will auto-deploy

### 3. Environment Configuration

Set environment variables in Lovable dashboard:

```env
NODE_ENV=production
PORT=3000
NULLSHOT_API_KEY=your_api_key_here
```

### 4. Build Configuration

Lovable automatically runs:
```bash
pnpm install
pnpm build
pnpm start
```

The build process:
1. Installs dependencies via pnpm
2. Builds frontend with Vite
3. Compiles backend with esbuild
4. Starts Express server

### 5. Verify Deployment

After deployment, verify:
- ✅ Dashboard loads at `/`
- ✅ Human Review page accessible at `/review`
- ✅ API endpoints respond at `/api/hitl/*`
- ✅ Static assets load correctly
- ✅ Routing works for all pages

## Key Files for Lovable

### package.json
Contains build and start scripts:
```json
{
  "scripts": {
    "dev": "vite --host",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

### vite.config.ts
Configures Vite build:
- Output directory: `dist/public`
- React plugin enabled
- TailwindCSS integration
- Asset handling

### server/index.ts
Express server configuration:
- Serves static files from `dist/public`
- API routes at `/api/*`
- Client-side routing support

## Troubleshooting

### Build Fails
- Check package.json for missing dependencies
- Verify TypeScript types are correct
- Ensure all imports use correct paths

### Routes Not Working
- Verify server/index.ts has catch-all route
- Check that static path is correct
- Ensure client-side router (wouter) is configured

### API Errors
- Check server/routes/ files are included
- Verify Express middleware is configured
- Check API route registration in server/index.ts

### Missing Assets
- Ensure client/public/ files are included
- Check vite.config.ts asset handling
- Verify static file serving in Express

## Performance Optimization

Lovable automatically handles:
- ✅ Asset compression
- ✅ CDN distribution
- ✅ HTTPS/SSL
- ✅ Auto-scaling

Additional optimizations in code:
- Code splitting via React lazy loading
- Efficient re-renders with React.memo
- Optimized polling intervals
- Minimal bundle size

## Security Considerations

- API keys should be in environment variables
- Smart contract addresses configurable
- CORS properly configured
- Input validation on all API endpoints

## Monitoring

After deployment, monitor:
- Response times
- Error rates
- API usage
- User sessions

Lovable provides built-in monitoring dashboard.

## Updates and Maintenance

To update the deployed application:
1. Make changes locally
2. Test with `pnpm dev`
3. Create new ZIP or push to Git
4. Lovable auto-deploys updates

## Support

For Lovable-specific issues:
- Check Lovable documentation
- Contact Lovable support
- Review deployment logs in dashboard

For NullAudit code issues:
- Check README.md
- Review CHANGELOG.md
- Inspect browser console for errors

## Production Checklist

Before going live:
- [ ] All environment variables set
- [ ] API endpoints tested
- [ ] Smart contract addresses configured
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Mobile responsive verified
- [ ] Cross-browser tested
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Documentation complete

## Rollback

If deployment fails:
1. Lovable keeps previous version
2. Click "Rollback" in dashboard
3. Previous working version restored

## Custom Domain

To use custom domain:
1. Go to Lovable project settings
2. Add custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

---

**Your NullAudit webapp is now ready for deployment to Lovable!**
