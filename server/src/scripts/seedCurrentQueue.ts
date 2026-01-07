import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Queue from '../models/Queue';
import Counter from '../models/Counter';
import Service from '../models/Service';
import User from '../models/User';
import { QueueStatus, UserRole, CounterStatus } from '../types';

const seedCurrentQueue = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartq');
    console.log('✅ Connected to database');

    // Get all services
    const services = await Service.find({ status: 'active' });
    if (services.length === 0) {
      console.log('❌ No services found. Please run seedServices.ts first.');
      return;
    }
    console.log(`✅ Found ${services.length} services`);

    // Get customers
    const customers = await User.find({ role: UserRole.CUSTOMER });
    if (customers.length === 0) {
      console.log('❌ No customers found. Please run seedUsers.ts first.');
      return;
    }
    console.log(`✅ Found ${customers.length} customers`);

    // Get staff and counters
    const counters = await Counter.find();
    console.log(`✅ Found ${counters.length} counters`);

    // Delete only today's queue entries (to refresh current state)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await Queue.deleteMany({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    console.log('✅ Cleared today\'s queue entries');

    const now = new Date();
    const currentQueues = [];

    // Get the last queue number
    const lastQueue = await Queue.findOne().sort({ queueNumber: -1 });
    let queueNumberCounter = (lastQueue?.queueNumber || 0) + 1;

    // Create 8 waiting customers (realistic morning queue in Sri Lanka)
    console.log('👥 Creating waiting queue entries...');
    for (let i = 0; i < 8; i++) {
      const customer = customers[i % customers.length];
      const service = services[i % services.length];
      const estimatedTime = new Date(now.getTime() + ((i + 1) * 12) * 60000); // 12 min intervals

      currentQueues.push({
        queueNumber: queueNumberCounter++,
        customer: customer._id,
        service: service._id,
        status: QueueStatus.WAITING,
        priority: i === 0 ? 5 : i === 1 ? 3 : 0, // First two have priority
        estimatedTime: estimatedTime,
        notes: i === 0 ? 'Senior citizen - Priority service' : i === 1 ? 'Pregnant mother - Priority' : undefined,
        createdAt: new Date(now.getTime() - (15 - i) * 60000) // Arrived 5-15 mins ago
      });
    }

    // Create 3 in-progress customers (being served now)
    console.log('⏳ Creating in-progress queue entries...');
    for (let i = 0; i < 3; i++) {
      const customer = customers[(8 + i) % customers.length];
      const service = services[i % services.length];
      const counter = counters[i % counters.length];
      const startedTime = new Date(now.getTime() - (5 + i * 3) * 60000); // Started 5-11 mins ago

      currentQueues.push({
        queueNumber: queueNumberCounter++,
        customer: customer._id,
        service: service._id,
        counter: counter._id,
        status: QueueStatus.IN_PROGRESS,
        priority: 0,
        estimatedTime: startedTime,
        actualStartTime: startedTime,
        notes: 'Currently being served',
        createdAt: new Date(startedTime.getTime() - 10 * 60000) // Joined 10 mins before service
      });

      // Update counter status
      await Counter.findByIdAndUpdate(counter._id, {
        status: CounterStatus.BUSY,
        currentQueue: null // Will be updated after queue is created
      });
    }

    // Insert all queue entries
    const createdQueues = await Queue.insertMany(currentQueues);
    console.log(`✅ Created ${createdQueues.length} current queue entries`);

    // Update counters with the actual queue references
    for (let i = 0; i < 3; i++) {
      const inProgressQueue = createdQueues.find(
        q => q.status === QueueStatus.IN_PROGRESS && q.counter?.toString() === counters[i % counters.length]._id.toString()
      );
      if (inProgressQueue) {
        await Counter.findByIdAndUpdate(counters[i % counters.length]._id, {
          currentQueue: inProgressQueue._id
        });
      }
    }

    // Set remaining counters as available
    for (let i = 3; i < counters.length; i++) {
      await Counter.findByIdAndUpdate(counters[i]._id, {
        status: CounterStatus.AVAILABLE,
        currentQueue: null
      });
    }

    console.log('\n📊 Current Queue Summary:');
    console.log(`   - Waiting: ${currentQueues.filter(q => q.status === QueueStatus.WAITING).length}`);
    console.log(`   - In Progress: ${currentQueues.filter(q => q.status === QueueStatus.IN_PROGRESS).length}`);
    console.log(`   - Total Active: ${currentQueues.length}`);
    
    console.log('\n✨ Current queue data seeded successfully!');
    console.log('💡 Refresh your dashboard to see active queues.');
    
  } catch (error) {
    console.error('❌ Error seeding current queue data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

seedCurrentQueue();
