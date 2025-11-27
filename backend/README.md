# SDB Admin Backend

Backend API for Smart Doorbell Admin Portal

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
MONGODB_URI=your_azure_cosmos_db_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

3. Create admin user:
```bash
npm run create-admin
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/admin/login` - Admin login
- GET `/api/auth/admin/verify` - Verify token
- POST `/api/auth/admin/logout` - Admin logout

### Users
- GET `/api/users` - Get all users
- GET `/api/users/:id` - Get user by ID
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

### Admin Dashboard
- GET `/api/admin/dashboard/stats` - Dashboard statistics
- GET `/api/admin/dashboard/activities` - Recent activities

### Subscriptions
- GET `/api/subscriptions` - Get all subscriptions
- POST `/api/subscriptions` - Create subscription
- PUT `/api/subscriptions/:id` - Update subscription
- DELETE `/api/subscriptions/:id` - Delete subscription