import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { UserRole } from '../types';

dotenv.config();

const users = [
  {
    name: 'Admin User',
    email: 'admin@smartq.com',
    password: 'Admin@123',
    phone: '0771234567',
    role: UserRole.ADMIN,
    isActive: true
  },
  {
    name: 'Staff User',
    email: 'staff@smartq.com',
    password: 'Staff@123',
    phone: '0779876543',
    role: UserRole.STAFF,
    isActive: true
  },
  {
    name: 'Staff Member 2',
    email: 'staff2@smartq.com',
    password: 'Staff@123',
    phone: '0775551234',
    role: UserRole.STAFF,
    isActive: true
  },
  {
    name: 'Staff Member 3',
    email: 'staff3@smartq.com',
    password: 'Staff@123',
    phone: '0775551235',
    role: UserRole.STAFF,
    isActive: true
  },
  {
    name: 'Staff Member 4',
    email: 'staff4@smartq.com',
    password: 'Staff@123',
    phone: '0775551236',
    role: UserRole.STAFF,
    isActive: true
  },
  // Customer accounts
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Customer@123',
    phone: '0761234567',
    role: UserRole.CUSTOMER,
    isActive: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'Customer@123',
    phone: '0762345678',
    role: UserRole.CUSTOMER,
    isActive: true
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    password: 'Customer@123',
    phone: '0763456789',
    role: UserRole.CUSTOMER,
    isActive: true
  },
  {
    name: 'Alice Brown',
    email: 'alice@example.com',
    password: 'Customer@123',
    phone: '0764567890',
    role: UserRole.CUSTOMER,
    isActive: true
  },
  {
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    password: 'Customer@123',
    phone: '0765678901',
    role: UserRole.CUSTOMER,
    isActive: true
  },
  {
    name: 'Diana Davis',
    email: 'diana@example.com',
    password: 'Customer@123',
    phone: '0766789012',
    role: UserRole.CUSTOMER,
    isActive: true
  },
  {
    name: 'Edward Miller',
    email: 'edward@example.com',
    password: 'Customer@123',
    phone: '0767890123',
    role: UserRole.CUSTOMER,
    isActive: true
  },
  {
    name: 'Fiona Martinez',
    email: 'fiona@example.com',
    password: 'Customer@123',
    phone: '0768901234',
    role: UserRole.CUSTOMER,
    isActive: true
  },
  {
    name: 'George Garcia',
    email: 'george@example.com',
    password: 'Customer@123',
    phone: '0769012345',
    role: UserRole.CUSTOMER,
    isActive: true
  },
  {
    name: 'Hannah Rodriguez',
    email: 'hannah@example.com',
    password: 'Customer@123',
    phone: '0760123456',
    role: UserRole.CUSTOMER,
    isActive: true
  }
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, deleting and recreating...`);
        await User.deleteOne({ email: userData.email });
      }
      
      // Use User.create() - password will be hashed by pre-save middleware
      await User.create(userData);
      console.log(`Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\n✅ Users seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADMIN:');
    console.log('  Email: admin@smartq.com');
    console.log('  Password: Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STAFF:');
    console.log('  Email: staff@smartq.com');
    console.log('  Password: Staff@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CUSTOMERS:');
    console.log('  Email: john@example.com (or any customer email)');
    console.log('  Password: Customer@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedUsers();
