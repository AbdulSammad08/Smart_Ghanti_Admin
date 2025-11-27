# Smart Doorbell Admin Portal - React

A modern React-based administrative interface for managing a smart doorbell system with professional design and responsive layout.

## Features

- 🔐 **Authentication System** - Login/logout with protected routes
- 📊 **Dashboard** - Real-time statistics and activity monitoring
- 💳 **Subscription Management** - Plan creation and management
- 👥 **User Management** - Homeowner profiles and secondary users
- 🔄 **Transfer System** - Ownership transfer requests and approvals
- 🎨 **Modern UI/UX** - Clean design with dark/light theme toggle
- 📱 **Responsive Design** - Mobile-first approach

## Technology Stack

- **React** 18.2.0
- **React Router** 6.8.0
- **CSS3** with Grid and Flexbox
- **Font Awesome** 6.0 for icons
- **Inter** Google Font

## Quick Start

1. **Install dependencies**
   ```bash
   cd SDB-Admin-React
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

3. **Login credentials**
   - Email: `admin@example.com`
   - Password: `admin123`

## Project Structure

```
src/
├── components/
│   ├── AuthContext.js    # Authentication context
│   ├── Layout.js         # Main layout with sidebar
│   └── Modal.js          # Reusable modal component
├── pages/
│   ├── Login.js          # Login page
│   ├── Signup.js         # Registration page
│   ├── Dashboard.js      # Main dashboard
│   ├── SubscriptionPlans.js
│   ├── Homeowners.js
│   ├── HomeownerDetails.js
│   ├── ActiveSubscriptions.js
│   └── TransferRequests.js
├── styles/
│   └── index.css         # Main stylesheet
├── App.js                # Main app component
└── index.js              # Entry point
```

## Available Scripts

- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Key Features

### Authentication
- Context-based authentication
- Protected routes
- Session persistence with localStorage

### Layout System
- Responsive sidebar navigation
- Theme toggle (light/dark mode)
- Mobile-optimized design

### Components
- Reusable Modal component
- Consistent button and badge styling
- Responsive data tables

### Pages
- **Dashboard**: Stats overview and recent activities
- **Subscription Plans**: CRUD operations with modal forms
- **Homeowners**: User listing with status badges
- **Homeowner Details**: Comprehensive user information
- **Active Subscriptions**: Subscription management
- **Transfer Requests**: Approval/rejection workflow

## Responsive Breakpoints

- **Desktop**: 992px+ (Full sidebar)
- **Tablet**: 768px-991px (Collapsible sidebar)
- **Mobile**: <768px (Mobile-optimized layout)

## Color Scheme

- **Primary**: #4e73df (Blue)
- **Success**: #1cc88a (Green)
- **Warning**: #f6c23e (Yellow)
- **Danger**: #e74a3b (Red)
- **Background**: #f8f9fc (Light gray)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+