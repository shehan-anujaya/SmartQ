import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Service from '../models/Service';
import { ServiceStatus } from '../types';

const services = [
  {
    name: 'General Consultation',
    description: 'Standard consultation with a healthcare professional for general health concerns and checkups.',
    duration: 30,
    price: 50,
    category: 'Medical',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Specialist Consultation',
    description: 'In-depth consultation with a specialist doctor for specific medical conditions and treatments.',
    duration: 45,
    price: 100,
    category: 'Medical',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Lab Tests',
    description: 'Comprehensive laboratory testing including blood work, urinalysis, and other diagnostic tests.',
    duration: 20,
    price: 75,
    category: 'Diagnostics',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'X-Ray Imaging',
    description: 'Digital X-ray imaging services for bones, chest, and other body parts with quick results.',
    duration: 15,
    price: 80,
    category: 'Diagnostics',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Vaccination',
    description: 'Immunization services including flu shots, travel vaccines, and routine vaccinations.',
    duration: 15,
    price: 35,
    category: 'Preventive Care',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Physical Therapy',
    description: 'Rehabilitation and physical therapy sessions for injury recovery and mobility improvement.',
    duration: 60,
    price: 90,
    category: 'Therapy',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Dental Cleaning',
    description: 'Professional dental cleaning and oral hygiene assessment with a certified dentist.',
    duration: 45,
    price: 120,
    category: 'Dental',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Eye Examination',
    description: 'Comprehensive eye exam including vision testing, eye health assessment, and prescription updates.',
    duration: 30,
    price: 65,
    category: 'Vision',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Mental Health Counseling',
    description: 'Confidential counseling session with a licensed mental health professional.',
    duration: 50,
    price: 110,
    category: 'Mental Health',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Pharmacy Consultation',
    description: 'Medication review and consultation with a pharmacist for proper drug management.',
    duration: 15,
    price: 25,
    category: 'Pharmacy',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Emergency Care',
    description: 'Immediate medical attention for urgent health conditions requiring prompt treatment.',
    duration: 60,
    price: 200,
    category: 'Emergency',
    status: ServiceStatus.ACTIVE
  },
  {
    name: 'Health Screening Package',
    description: 'Complete health screening including blood tests, ECG, and physical examination.',
    duration: 90,
    price: 250,
    category: 'Preventive Care',
    status: ServiceStatus.ACTIVE
  }
];

const seedServices = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartq';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing services (optional - comment out if you want to keep existing)
    await Service.deleteMany({});
    console.log('🗑️  Cleared existing services');

    // Insert new services
    const createdServices = await Service.insertMany(services);
    console.log(`✅ Created ${createdServices.length} services:`);
    
    createdServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - $${service.price} (${service.duration} mins)`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedServices();
