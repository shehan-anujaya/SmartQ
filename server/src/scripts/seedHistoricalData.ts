import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Queue from '../models/Queue';
import Appointment from '../models/Appointment';
import Service from '../models/Service';
import User from '../models/User';
import Counter from '../models/Counter';
import { QueueStatus, AppointmentStatus, UserRole } from '../types';

const seedHistoricalData = async () => {
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
    const staffMembers = await User.find({ role: UserRole.STAFF });
    const counters = await Counter.find();
    console.log(`✅ Found ${staffMembers.length} staff members and ${counters.length} counters`);

    console.log('🗑️  Clearing historical data...');
    // Keep today's data, remove only old historical data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Queue.deleteMany({ createdAt: { $lt: today } });
    await Appointment.deleteMany({ appointmentDate: { $lt: today } });
    console.log('✅ Old historical data cleared');

    // Generate data for the past 30 days
    const now = new Date();
    const historicalData = {
      queues: [] as any[],
      appointments: [] as any[]
    };

    console.log('📊 Generating historical data for the past 30 days...');

    // Peak hours in Sri Lanka: 9-11 AM and 3-5 PM (after work/lunch)
    const peakHours = [9, 10, 15, 16];
    const regularHours = [8, 11, 12, 13, 14, 17];

    for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      
      // Skip Sundays (most Sri Lankan businesses closed)
      if (date.getDay() === 0) continue;
      
      // Saturday has fewer appointments (half day)
      const isSaturday = date.getDay() === 6;
      const maxEntriesPerHour = isSaturday ? 2 : 4;

      // Generate queue entries for this day
      [...peakHours, ...regularHours].forEach(hour => {
        const entriesCount = peakHours.includes(hour) 
          ? Math.floor(Math.random() * maxEntriesPerHour) + maxEntriesPerHour 
          : Math.floor(Math.random() * (maxEntriesPerHour - 1)) + 1;

        for (let i = 0; i < entriesCount; i++) {
          const customer = customers[Math.floor(Math.random() * customers.length)];
          const service = services[Math.floor(Math.random() * services.length)];
          const counter = counters[Math.floor(Math.random() * counters.length)];
          
          const startTime = new Date(date);
          startTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
          
          const duration = service.duration || 30;
          const endTime = new Date(startTime.getTime() + duration * 60000);
          
          // 95% completion rate for historical data
          const isCompleted = Math.random() > 0.05;

          historicalData.queues.push({
            queueNumber: historicalData.queues.length + 1,
            customer: customer._id,
            service: service._id,
            counter: counter._id,
            status: isCompleted ? QueueStatus.COMPLETED : QueueStatus.CANCELLED,
            priority: Math.random() > 0.9 ? 5 : 0, // 10% priority cases
            estimatedTime: startTime,
            actualStartTime: startTime,
            actualEndTime: isCompleted ? endTime : null,
            createdAt: new Date(startTime.getTime() - 30 * 60000), // Created 30 mins before
            updatedAt: endTime
          });
        }
      });

      // Generate appointments for future dates (next 14 days from this past date)
      if (daysAgo <= 14) {
        const appointmentsPerDay = isSaturday ? 6 : 12;
        
        for (let i = 0; i < appointmentsPerDay; i++) {
          const customer = customers[Math.floor(Math.random() * customers.length)];
          const service = services[Math.floor(Math.random() * services.length)];
          const staff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
          
          const appointmentDate = new Date(date);
          const hour = [...peakHours, ...regularHours][Math.floor(Math.random() * (peakHours.length + regularHours.length))];
          appointmentDate.setHours(hour, [0, 15, 30, 45][Math.floor(Math.random() * 4)], 0, 0);
          
          // Determine status based on whether appointment is in the past
          let status;
          if (appointmentDate < now) {
            // 90% completed, 5% cancelled, 5% no-show
            const rand = Math.random();
            if (rand < 0.9) status = AppointmentStatus.COMPLETED;
            else if (rand < 0.95) status = AppointmentStatus.CANCELLED;
            else status = AppointmentStatus.NO_SHOW;
          } else {
            // 95% confirmed, 5% scheduled
            status = Math.random() > 0.05 ? AppointmentStatus.CONFIRMED : AppointmentStatus.SCHEDULED;
          }

          historicalData.appointments.push({
            customer: customer._id,
            service: service._id,
            appointmentDate: appointmentDate,
            appointmentTime: `${hour.toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}`,
            status: status,
            notes: status === AppointmentStatus.COMPLETED 
              ? 'Consultation completed successfully' 
              : status === AppointmentStatus.CANCELLED 
              ? 'Patient requested cancellation'
              : status === AppointmentStatus.NO_SHOW
              ? 'Patient did not arrive'
              : 'Appointment booked online',
            staffAssigned: staff?._id,
            createdAt: new Date(appointmentDate.getTime() - 24 * 60 * 60000), // Created 1 day before
            updatedAt: appointmentDate > now ? new Date() : appointmentDate
          });
        }
      }
    }

    // Insert historical data in batches
    console.log('💾 Inserting historical queue data...');
    if (historicalData.queues.length > 0) {
      await Queue.insertMany(historicalData.queues);
      console.log(`✅ Inserted ${historicalData.queues.length} historical queue entries`);
    }

    console.log('💾 Inserting historical appointment data...');
    if (historicalData.appointments.length > 0) {
      // Insert directly into collection to bypass Mongoose validation for historical dates
      await Appointment.collection.insertMany(historicalData.appointments);
      console.log(`✅ Inserted ${historicalData.appointments.length} historical appointments`);
    }

    // Display summary
    console.log('\n📊 Historical Data Summary:');
    console.log(`   Date Range: Past 30 days`);
    console.log(`   Queue Entries: ${historicalData.queues.length}`);
    console.log(`   Appointments: ${historicalData.appointments.length}`);
    
    const completedQueues = historicalData.queues.filter(q => q.status === QueueStatus.COMPLETED).length;
    const completedAppointments = historicalData.appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    
    console.log(`   - Completed Queues: ${completedQueues}`);
    console.log(`   - Completed Appointments: ${completedAppointments}`);
    console.log(`   - Completion Rate: ${Math.round((completedQueues / historicalData.queues.length) * 100)}%`);
    
    console.log('\n✨ Historical data seeded successfully!');
    console.log('💡 AI Analytics will now have sufficient data for insights.');
    
  } catch (error) {
    console.error('❌ Error seeding historical data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

seedHistoricalData();
