import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Queue from '../models/Queue';
import Counter from '../models/Counter';
import Service from '../models/Service';
import User from '../models/User';
import { QueueStatus, CounterStatus, UserRole } from '../types';

const seedQueue = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartq');
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🗑️  Clearing existing queue and counter data...');
    await Queue.deleteMany({});
    await Counter.deleteMany({});
    console.log('✅ Existing data cleared');

    // Get all services
    const services = await Service.find({ status: 'active' }).limit(6);
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

    // Get staff members
    const staffMembers = await User.find({ role: UserRole.STAFF });
    console.log(`✅ Found ${staffMembers.length} staff members`);

    // Create Counters
    console.log('🏢 Creating counters...');
    const counters = [
      {
        counterNumber: 1,
        name: 'Counter 1 - General',
        services: [services[0]._id, services[1]._id], // General and Specialist Consultation
        status: CounterStatus.AVAILABLE,
        assignedStaff: staffMembers[0]?._id || null
      },
      {
        counterNumber: 2,
        name: 'Counter 2 - Diagnostics',
        services: [services[2]._id, services[3]._id], // Lab Tests and X-Ray
        status: CounterStatus.AVAILABLE,
        assignedStaff: staffMembers[1]?._id || null
      },
      {
        counterNumber: 3,
        name: 'Counter 3 - Preventive Care',
        services: [services[4]._id], // Vaccination
        status: CounterStatus.AVAILABLE,
        assignedStaff: staffMembers[2]?._id || null
      },
      {
        counterNumber: 4,
        name: 'Counter 4 - Therapy',
        services: [services[5]._id], // Physical Therapy
        status: CounterStatus.BUSY,
        assignedStaff: staffMembers[3]?._id || null
      }
    ];

    const createdCounters = await Counter.insertMany(counters);
    console.log(`✅ Created ${createdCounters.length} counters`);

    // Create Queue Entries
    console.log('👥 Creating queue entries...');
    const now = new Date();
    const queueEntries = [];
    let queueNumberCounter = 1;

    // Create some waiting queue entries
    for (let i = 0; i < Math.min(5, customers.length); i++) {
      const serviceIndex = i % services.length;
      const estimatedTime = new Date(now.getTime() + (i * 10 + 5) * 60000); // Staggered wait times
      
      queueEntries.push({
        queueNumber: queueNumberCounter++,
        customer: customers[i]._id,
        service: services[serviceIndex]._id,
        status: QueueStatus.WAITING,
        priority: i === 0 ? 5 : 0, // First customer has priority
        estimatedTime: estimatedTime,
        notes: i === 0 ? 'Priority customer' : undefined
      });
    }

    // Create one in-progress queue entry
    if (customers.length > 5) {
      queueEntries.push({
        queueNumber: queueNumberCounter++,
        customer: customers[5]._id,
        service: services[0]._id,
        counter: createdCounters[0]._id,
        status: QueueStatus.IN_PROGRESS,
        priority: 0,
        estimatedTime: now,
        actualStartTime: new Date(now.getTime() - 5 * 60000), // Started 5 mins ago
        notes: 'Currently being served'
      });

      // Update counter to show it's busy with this queue
      await Counter.findByIdAndUpdate(createdCounters[0]._id, {
        status: CounterStatus.BUSY,
        currentQueue: null // Will be set after queue is created
      });
    }

    // Create some completed queue entries (from earlier today)
    const earlierToday = new Date(now);
    earlierToday.setHours(9, 0, 0, 0);

    for (let i = 0; i < Math.min(3, customers.length - 6); i++) {
      const customerIndex = 6 + i;
      if (customerIndex < customers.length) {
        const serviceIndex = i % services.length;
        const startTime = new Date(earlierToday.getTime() + i * 30 * 60000);
        const endTime = new Date(startTime.getTime() + 20 * 60000);

        queueEntries.push({
          queueNumber: queueNumberCounter++,
          customer: customers[customerIndex]._id,
          service: services[serviceIndex]._id,
          counter: createdCounters[i % createdCounters.length]._id,
          status: QueueStatus.COMPLETED,
          priority: 0,
          estimatedTime: startTime,
          actualStartTime: startTime,
          actualEndTime: endTime,
          notes: 'Completed successfully'
        });
      }
    }

    const createdQueues = [];

    // Create queue entries one by one to trigger pre-save hooks
    for (const entry of queueEntries) {
      const queue = await Queue.create(entry);
      createdQueues.push(queue);
    }
    
    console.log(`✅ Created ${createdQueues.length} queue entries`);

    // Update the in-progress counter with the actual queue reference
    const inProgressQueue = createdQueues.find(q => q.status === QueueStatus.IN_PROGRESS);
    if (inProgressQueue) {
      await Counter.findByIdAndUpdate(createdCounters[0]._id, {
        currentQueue: inProgressQueue._id
      });
      console.log('✅ Updated counter with in-progress queue');
    }

    // Display summary
    console.log('\n📊 Queue Data Summary:');
    console.log(`   Counters: ${createdCounters.length}`);
    console.log(`   Total Queue Entries: ${createdQueues.length}`);
    
    const waitingCount = createdQueues.filter(q => q.status === QueueStatus.WAITING).length;
    const inProgressCount = createdQueues.filter(q => q.status === QueueStatus.IN_PROGRESS).length;
    const completedCount = createdQueues.filter(q => q.status === QueueStatus.COMPLETED).length;
    
    console.log(`   - Waiting: ${waitingCount}`);
    console.log(`   - In Progress: ${inProgressCount}`);
    console.log(`   - Completed: ${completedCount}`);
    
    console.log('\n✨ Queue data seeded successfully!');
    console.log('💡 You can now join the queue as a customer.');
    
  } catch (error) {
    console.error('❌ Error seeding queue data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

seedQueue();
