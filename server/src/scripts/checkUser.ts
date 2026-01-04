import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const checkUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartq';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find user by email
    const email = 'shehananujayanewz@gmail.com';
    console.log(`\nSearching for user: ${email}\n`);

    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (user) {
      console.log('✅ User found:');
      console.log('=====================================');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Phone:', user.phone);
      console.log('Role:', user.role);
      console.log('Is Active:', user.isActive);
      console.log('Password Hash:', user.password ? 'Set (hashed)' : 'Not set');
      console.log('Refresh Token:', user.refreshToken ? 'Present' : 'Not set');
      console.log('Created At:', user.createdAt);
      console.log('Updated At:', user.updatedAt);
      console.log('=====================================\n');

      // Test password comparison
      const testPassword = 'test123'; // Replace with actual password you're trying
      const isMatch = await user.comparePassword(testPassword);
      console.log(`Password '${testPassword}' matches:`, isMatch);
    } else {
      console.log('❌ User not found in database');
      
      // List all users
      console.log('\nAll users in database:');
      const allUsers = await User.find({}).select('name email role isActive createdAt');
      if (allUsers.length === 0) {
        console.log('No users found in database');
      } else {
        allUsers.forEach((u, index) => {
          console.log(`\n${index + 1}. ${u.name}`);
          console.log(`   Email: ${u.email}`);
          console.log(`   Role: ${u.role}`);
          console.log(`   Active: ${u.isActive}`);
          console.log(`   Created: ${u.createdAt}`);
        });
      }
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUser();
