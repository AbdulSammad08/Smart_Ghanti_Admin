# Smart Bell Database Admin Portal

A comprehensive admin portal for managing Smart Bell database operations with Azure Cosmos DB integration.

## 🚀 Features

- **Admin Authentication**: Secure login system with JWT tokens
- **User Management**: View and manage homeowners and users
- **Subscription Management**: Handle subscription plans and payments
- **Transfer Requests**: Manage ownership transfers and beneficial allotments
- **Payment Tracking**: Monitor payment proofs and receipts
- **Real-time Dashboard**: Live statistics and system status
- **Azure Cosmos DB Integration**: Seamless cloud database connectivity

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB/Azure Cosmos DB** for database
- **Mongoose** for ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads

### Frontend
- **React.js** with functional components
- **React Router** for navigation
- **Context API** for state management
- **CSS3** for styling

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Azure Cosmos DB account
- Git

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sdb-admin.git
   cd sdb-admin
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=your_azure_cosmos_db_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   ```

## 🚀 Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   # or
   node server.js
   ```

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔐 Default Admin Credentials

After setting up, create an admin account by running:
```bash
cd backend
node create-working-admin.js
```

Default credentials:
- **Email**: admin@smartbell.com
- **Password**: SmartBell2024!

## 📁 Project Structure

```
sdb-admin/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── dbCheck.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── User.js
│   │   ├── Subscription.js
│   │   └── ...
│   ├── routes/
│   │   ├── auth-db.js
│   │   ├── admin.js
│   │   ├── users.js
│   │   └── ...
│   ├── uploads/
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .gitignore
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/admin/verify` - Verify JWT token
- `POST /api/auth/admin/logout` - Admin logout

### Admin Management
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `POST /api/admin/create-admin` - Create new admin
- `GET /api/admin/admins` - Get all admins
- `DELETE /api/admin/admins/:id` - Delete admin

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/verify` - Verify user

### System
- `GET /api/health` - Health check
- `GET /api/admin/system/status` - System status

## 🗄️ Database Models

- **Admin**: Admin user accounts
- **User**: Homeowner accounts
- **Subscription**: Subscription plans
- **Transfer**: Ownership transfers
- **BeneficialAllotment**: Beneficial allotments
- **OwnershipTransfer**: Ownership transfers
- **SecondaryOwnership**: Secondary ownership records
- **Payment**: Payment records

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Database connection security
- File upload restrictions

## 🚀 Deployment

### Backend Deployment
1. Set environment variables on your hosting platform
2. Install dependencies: `npm install`
3. Start the server: `npm start`

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `build` folder to your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact [your-email@example.com]

## 🔄 Version History

- **v1.0.0** - Initial release with basic admin functionality
- **v1.1.0** - Added Azure Cosmos DB integration
- **v1.2.0** - Enhanced authentication and security features

---

**Note**: Make sure to keep your `.env` file secure and never commit it to version control.