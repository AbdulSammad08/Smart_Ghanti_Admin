# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Create Vercel account at https://vercel.com

## Deployment Steps

### 1. Login to Vercel
```bash
vercel login
```

### 2. Deploy from Project Root
```bash
cd sdb-admin
vercel
```

### 3. Configure Environment Variables
In Vercel Dashboard > Project Settings > Environment Variables, add:

- `MONGODB_URI` = Your Azure Cosmos DB connection string
- `JWT_SECRET` = Your JWT secret key  
- `NODE_ENV` = production
- `ADMIN_EMAIL` = admin@smartbell.com
- `ADMIN_PASSWORD` = SmartBell2024!

### 4. Update CORS Origin
After deployment, update the CORS origin in `backend/server.js`:
```javascript
origin: ['https://your-actual-vercel-url.vercel.app']
```

### 5. Redeploy
```bash
vercel --prod
```

## Important Notes
- Backend runs as serverless functions
- Frontend is served as static files
- Database connections are handled automatically
- File uploads go to `/tmp` (temporary storage)

## Troubleshooting
- Check Vercel function logs for errors
- Ensure all environment variables are set
- Verify Azure Cosmos DB allows connections from Vercel IPs