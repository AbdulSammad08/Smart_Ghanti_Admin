# Deployment Guide

## 🚀 Quick Setup for New Users

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/sdb-admin.git
cd sdb-admin
npm run install-all
```

### 2. Environment Setup
```bash
# Copy the example environment file
cp .env.example backend/.env

# Edit the .env file with your Azure Cosmos DB credentials
# Update MONGODB_URI with your connection string
# Set a secure JWT_SECRET
```

### 3. Create Admin Account
```bash
npm run create-admin
```

### 4. Start the Application
```bash
# Terminal 1 - Start Backend
npm run start-backend

# Terminal 2 - Start Frontend  
npm run start-frontend
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🌐 Production Deployment

### Backend Deployment (Node.js hosting)

1. **Environment Variables**
   Set these on your hosting platform:
   ```
   MONGODB_URI=your_azure_cosmos_db_connection
   JWT_SECRET=your_secure_jwt_secret
   PORT=5000
   NODE_ENV=production
   ```

2. **Deploy Commands**
   ```bash
   cd backend
   npm install --production
   npm start
   ```

### Frontend Deployment (Static hosting)

1. **Build the Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the `build` folder** to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - GitHub Pages

### Environment-Specific Configurations

#### Development
```env
NODE_ENV=development
MONGODB_URI=your_dev_database
```

#### Production
```env
NODE_ENV=production
MONGODB_URI=your_prod_database
```

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npm run test-connection
```

### Admin Login Issues
```bash
# Recreate admin account
npm run create-admin
```

### Port Conflicts
- Backend default: 5000
- Frontend default: 3000
- Change PORT in .env if needed

## 📋 Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Admin account created
- [ ] Frontend builds successfully
- [ ] API endpoints tested
- [ ] CORS settings configured for production domain
- [ ] Security headers implemented
- [ ] SSL certificate configured

## 🔒 Security Considerations

1. **Never commit .env files**
2. **Use strong JWT secrets**
3. **Enable HTTPS in production**
4. **Configure CORS properly**
5. **Regular security updates**
6. **Monitor database access**

## 📊 Monitoring

### Health Checks
- Backend: `GET /api/health`
- Database: `GET /api/admin/system/status`

### Logs
- Check server logs for errors
- Monitor database connection status
- Track authentication failures