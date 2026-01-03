# SmartQ - Smart Queue & Appointment Management System

A full-stack MERN application with TypeScript for managing queues and appointments efficiently.

## 🚀 Tech Stack

### Backend
- Node.js & Express
- TypeScript
- MongoDB & Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Express Validator

### Frontend
- React 18
- TypeScript
- Redux Toolkit (State Management)
- TailwindCSS (Styling)
- React Router v6
- Axios
- React Hot Toast

## 📋 Features

### For Customers
- User registration and authentication
- Book appointments with preferred date/time
- Join queue for walk-in services
- View appointment history
- Real-time queue position updates
- Cancel appointments/queues

### For Staff/Admin
- View and manage all queues
- Update queue status (waiting, in progress, completed)
- View all appointments
- Update appointment status
- Service management (create, update, delete)
- User management (admin only)
- Dashboard with statistics

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server root:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the client root:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The client will run on `http://localhost:3000`

## 📁 Project Structure

```
SmartQ/
├── server/                  # Backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Helper functions
│   │   └── server.ts       # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── client/                  # Frontend
    ├── src/
    │   ├── components/     # Reusable components
    │   │   ├── auth/       # Protected routes
    │   │   ├── common/     # UI components
    │   │   └── layout/     # Layout components
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   ├── store/          # Redux store & slices
    │   ├── types/          # TypeScript types
    │   ├── App.tsx         # Main app component
    │   └── main.tsx        # Entry point
    ├── package.json
    └── tsconfig.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create service (Admin/Staff)
- `PUT /api/services/:id` - Update service (Admin/Staff)
- `DELETE /api/services/:id` - Delete service (Admin)

### Queue
- `GET /api/queues` - Get all queues (Admin/Staff)
- `GET /api/queues/my-queues` - Get my queues
- `POST /api/queues` - Join queue
- `PUT /api/queues/:id/status` - Update queue status (Admin/Staff)
- `DELETE /api/queues/:id` - Cancel queue

### Appointments
- `GET /api/appointments` - Get all appointments (Admin/Staff)
- `GET /api/appointments/my-appointments` - Get my appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PUT /api/appointments/:id/status` - Update status (Admin/Staff)
- `DELETE /api/appointments/:id` - Cancel appointment

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/activate` - Activate user
- `PUT /api/users/:id/deactivate` - Deactivate user

## 🚢 Deployment

### Backend (Render)

1. Push code to GitHub
2. Connect to Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

## 👥 User Roles

- **Customer**: Book appointments, join queues, view history
- **Staff**: Manage queues, appointments, and services
- **Admin**: Full access including user management

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected routes
- Input validation
- Error handling
- CORS configuration
- Helmet security headers


## 👨‍💻 Author

Shehan Anujaya

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
