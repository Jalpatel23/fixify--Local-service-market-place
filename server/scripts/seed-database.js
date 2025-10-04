/**
 * Database Seeding Script
 * 
 * Adds realistic dummy data to all collections for testing and development.
 * 
 * Usage: node scripts/seed-database.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Job = require('../models/Job');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixify';

// Sample data arrays
const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Cedar Ln', 'Maple Dr', 'Park Ave', 'First St', 'Second St', 'Third St'];

const jobCategories = ['plumbing', 'electrical', 'carpentry', 'cleaning', 'gardening', 'painting', 'moving', 'repair'];
const skillLevels = ['beginner', 'intermediate', 'expert'];
const jobStatuses = ['open', 'accepted', 'in_progress', 'completed'];

/**
 * Generate random data helpers
 */
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const randomBool = () => Math.random() > 0.5;

/**
 * Generate random coordinates around major US cities
 */
const generateCoordinates = () => {
  const baseCities = [
    { lat: 40.7128, lng: -74.0060 }, // NYC
    { lat: 34.0522, lng: -118.2437 }, // LA
    { lat: 41.8781, lng: -87.6298 }, // Chicago
    { lat: 29.7604, lng: -95.3698 }, // Houston
    { lat: 33.4484, lng: -112.0740 }, // Phoenix
  ];
  
  const baseCity = randomChoice(baseCities);
  return [
    baseCity.lng + randomFloat(-0.5, 0.5), // longitude
    baseCity.lat + randomFloat(-0.5, 0.5)  // latitude
  ];
};

/**
 * Create sample users
 */
const createUsers = async () => {
  console.log('👥 Creating users...');
  
  const users = [];
  
  for (let i = 0; i < 10; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const coordinates = generateCoordinates();
    
    const user = new User({
      clerkId: `user_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      phone: `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
      location: {
        type: 'Point',
        coordinates,
        address: {
          street: `${randomInt(100, 9999)} ${randomChoice(streets)}`,
          city: randomChoice(cities),
          state: randomChoice(states),
          zipCode: `${randomInt(10000, 99999)}`,
          country: 'US'
        }
      },
      skills: Array.from({ length: randomInt(1, 3) }, () => ({
        category: randomChoice(jobCategories),
        name: `${randomChoice(jobCategories)} specialist`,
        experience: randomChoice(skillLevels),
        verified: randomBool()
      })),
      rating: {
        average: randomFloat(3.5, 5.0),
        totalReviews: randomInt(0, 25),
        categories: {
          communication: randomFloat(3.5, 5.0),
          quality: randomFloat(3.5, 5.0),
          timeliness: randomFloat(3.5, 5.0),
          professionalism: randomFloat(3.5, 5.0),
          value: randomFloat(3.5, 5.0)
        },
        distribution: {
          1: randomInt(0, 2),
          2: randomInt(0, 3),
          3: randomInt(0, 5),
          4: randomInt(2, 8),
          5: randomInt(5, 15)
        }
      },
      preferences: {
        maxDistance: randomInt(10, 50),
        notificationSettings: {
          email: randomBool(),
          push: randomBool(),
          sms: randomBool()
        }
      },
      accountType: randomChoice(['client', 'helper', 'both']),
      isVerified: randomBool(),
      stats: {
        jobsPosted: randomInt(0, 15),
        jobsCompleted: randomInt(0, 20),
        totalEarnings: randomInt(0, 5000),
        memberSince: new Date(Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000)
      }
    });
    
    users.push(user);
  }
  
  const savedUsers = await User.insertMany(users);
  console.log(`✅ Created ${savedUsers.length} users`);
  return savedUsers;
};

/**
 * Create sample jobs
 */
const createJobs = async (users) => {
  console.log('💼 Creating jobs...');
  
  const jobTitles = [
    'Fix leaky kitchen faucet',
    'Install ceiling fan in bedroom',
    'Paint living room walls',
    'Clean house before party',
    'Repair broken fence gate',
    'Install new light fixtures',
    'Deep clean carpets',
    'Fix running toilet',
    'Assemble IKEA furniture',
    'Pressure wash driveway'
  ];
  
  const jobDescriptions = [
    'Need someone to fix a dripping faucet in my kitchen. It\'s been leaking for weeks and wasting water.',
    'Looking for an electrician to install a new ceiling fan in the master bedroom. Fan is already purchased.',
    'Want to repaint the living room in a neutral color. Room is about 200 sq ft.',
    'Need a thorough house cleaning before hosting a dinner party this weekend.',
    'My backyard gate is broken and won\'t close properly. Needs repair or replacement.',
    'Have 3 new light fixtures that need professional installation in dining room.',
    'Carpets need deep cleaning after pet accident. Have 2 bedrooms and living room.',
    'Toilet keeps running and won\'t stop. Probably needs new parts.',
    'Bought a wardrobe from IKEA but don\'t have time to assemble it. Instructions included.',
    'Driveway has oil stains and dirt buildup. Need pressure washing service.'
  ];
  
  const jobs = [];
  
  for (let i = 0; i < 12; i++) {
    const client = randomChoice(users);
    const coordinates = generateCoordinates();
    const category = randomChoice(jobCategories);
    const status = randomChoice(jobStatuses);
    const assignedTo = status !== 'open' ? randomChoice(users.filter(u => u._id !== client._id)) : null;
    
    const startHour = randomInt(8, 16); // 8 AM to 4 PM
    const endHour = startHour + randomInt(2, 6); // 2-6 hours later

    const job = new Job({
      creator: client._id, // Required field
      title: randomChoice(jobTitles),
      description: randomChoice(jobDescriptions),
      category,
      assignedTo: assignedTo?._id || null,
      status,
      budget: {
        min: randomInt(50, 200),
        max: randomInt(200, 500),
        isNegotiable: randomBool()
      },
      location: {
        type: 'Point',
        coordinates,
        address: {
          street: `${randomInt(100, 9999)} ${randomChoice(streets)}`,
          city: randomChoice(cities),
          state: randomChoice(states),
          zipCode: `${randomInt(10000, 99999)}`,
          country: 'US'
        }
      },
      preferredDate: new Date(Date.now() + randomInt(1, 30) * 24 * 60 * 60 * 1000),
      preferredTime: { // Required field
        start: `${startHour.toString().padStart(2, '0')}:00`,
        end: `${endHour.toString().padStart(2, '0')}:00`
      },
      isUrgent: randomBool(),
      requirements: {
        skills: [category],
        experienceLevel: randomChoice(['any', 'beginner', 'intermediate', 'expert']),
        verifiedOnly: randomBool(),
        backgroundCheck: randomBool()
      },
      images: Math.random() > 0.5 ? [{
        url: `https://picsum.photos/400/300?random=${i}`,
        caption: 'Problem area photo',
        uploadedAt: new Date()
      }] : [],
      acceptedAt: status !== 'open' ? new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000) : null,
      completedAt: status === 'completed' ? new Date(Date.now() - randomInt(1, 5) * 24 * 60 * 60 * 1000) : null
    });
    
    jobs.push(job);
  }
  
  const savedJobs = await Job.insertMany(jobs);
  console.log(`✅ Created ${savedJobs.length} jobs`);
  return savedJobs;
};

/**
 * Create sample reviews
 */
const createReviews = async (users, jobs) => {
  console.log('⭐ Creating reviews...');
  
  const reviewTitles = [
    'Excellent work!',
    'Very professional',
    'Quick and efficient',
    'Great communication',
    'Highly recommended',
    'Good value for money',
    'On time and reliable',
    'Quality workmanship'
  ];
  
  const reviewContents = [
    'Did an amazing job fixing my faucet. Very professional and cleaned up after themselves.',
    'Arrived on time and completed the work quickly. Would definitely hire again.',
    'Great communication throughout the project. Kept me updated on progress.',
    'High quality work at a fair price. Exceeded my expectations.',
    'Very knowledgeable and explained everything clearly. Highly recommend.',
    'Finished the job faster than expected and did excellent work.',
    'Professional, courteous, and skilled. Will use their services again.',
    'Attention to detail was impressive. Very satisfied with the results.'
  ];
  
  const completedJobs = jobs.filter(job => job.status === 'completed' && job.assignedTo);
  const reviews = [];
  
  for (let i = 0; i < Math.min(8, completedJobs.length); i++) {
    const job = completedJobs[i];
    const rating = randomInt(4, 5); // Mostly positive reviews
    
    const review = new Review({
      reviewer: job.creator, // Use creator instead of client
      reviewee: job.assignedTo,
      job: job._id,
      rating,
      title: randomChoice(reviewTitles),
      content: randomChoice(reviewContents),
      categories: {
        communication: randomInt(4, 5),
        quality: randomInt(4, 5),
        timeliness: randomInt(4, 5),
        professionalism: randomInt(4, 5),
        value: randomInt(4, 5)
      },
      status: 'approved',
      helpfulVotes: {
        up: randomInt(0, 10),
        down: randomInt(0, 2)
      },
      helpfulBy: [],
      flags: []
    });
    
    reviews.push(review);
  }
  
  const savedReviews = await Review.insertMany(reviews);
  console.log(`✅ Created ${savedReviews.length} reviews`);
  return savedReviews;
};

/**
 * Create sample payments
 */
const createPayments = async (users, jobs) => {
  console.log('💳 Creating payments...');
  
  const completedJobs = jobs.filter(job => job.status === 'completed' && job.assignedTo);
  const payments = [];
  
  for (let i = 0; i < Math.min(6, completedJobs.length); i++) {
    const job = completedJobs[i];
    const amount = randomInt(job.budget.min * 100, job.budget.max * 100); // Convert to cents
    const platformFee = Math.round(amount * 0.05);
    const helperAmount = amount - platformFee;
    
    const payment = new Payment({
      paymentId: `pay_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      stripePaymentIntentId: `pi_${Math.random().toString(36).substr(2, 24)}`,
      job: job._id,
      client: job.creator, // Use creator instead of client
      helper: job.assignedTo,
      amount,
      currency: 'usd',
      platformFee,
      helperAmount,
      status: 'completed',
      paymentMethod: {
        type: randomChoice(['card', 'bank_transfer']),
        last4: `${randomInt(1000, 9999)}`,
        brand: randomChoice(['visa', 'mastercard', 'amex']),
        country: 'US'
      },
      escrow: {
        isEscrow: true,
        releaseDate: new Date(Date.now() - randomInt(1, 5) * 24 * 60 * 60 * 1000),
        autoRelease: true,
        releaseConditions: ['job_completed', 'client_approval']
      },
      dispute: {
        isDisputed: false
      },
      description: `Payment for job: ${job.title}`,
      metadata: {
        jobTitle: job.title,
        jobCategory: job.category,
        location: job.location.address?.city || 'Unknown'
      },
      completedAt: new Date(Date.now() - randomInt(1, 5) * 24 * 60 * 60 * 1000)
    });
    
    payments.push(payment);
  }
  
  const savedPayments = await Payment.insertMany(payments);
  console.log(`✅ Created ${savedPayments.length} payments`);
  return savedPayments;
};

/**
 * Create sample notifications
 */
const createNotifications = async (users, jobs) => {
  console.log('🔔 Creating notifications...');

  const notificationTypes = [
    { type: 'job_posted', title: 'New job posted nearby', message: 'A new job matching your skills has been posted in your area.' },
    { type: 'job_accepted', title: 'Your job was accepted', message: 'Great news! Someone has accepted your job request.' },
    { type: 'job_completed', title: 'Job completed', message: 'Your job has been marked as completed. Please review the work.' },
    { type: 'message_received', title: 'New message', message: 'You have received a new message about your job.' },
    { type: 'review_received', title: 'New review', message: 'You have received a new review for your work.' },
    { type: 'payment_received', title: 'Payment received', message: 'You have received payment for your completed job.' },
    { type: 'system_alert', title: 'Welcome to Fixify!', message: 'Welcome to our platform! Complete your profile to get started.' }
  ];

  const notifications = [];

  for (let i = 0; i < 15; i++) {
    const recipient = randomChoice(users);
    const sender = Math.random() > 0.3 ? randomChoice(users.filter(u => u._id !== recipient._id)) : null;
    const notifType = randomChoice(notificationTypes);
    const relatedJob = Math.random() > 0.5 ? randomChoice(jobs) : null;

    const notification = new Notification({
      recipient: recipient._id,
      sender: sender?._id || null,
      type: notifType.type,
      title: notifType.title,
      message: notifType.message,
      jobId: relatedJob?._id || null,
      isRead: randomBool(),
      readAt: randomBool() ? new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000) : null,
      priority: randomChoice(['low', 'medium', 'high']),
      metadata: {
        source: 'system',
        category: notifType.type
      }
    });

    notifications.push(notification);
  }

  const savedNotifications = await Notification.insertMany(notifications);
  console.log(`✅ Created ${savedNotifications.length} notifications`);
  return savedNotifications;
};

/**
 * Main seeding function
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log(`📡 Connecting to: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    // Check if data already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`⚠️  Database already has ${existingUsers} users.`);
      console.log('Do you want to clear existing data and reseed? (This will delete all data!)');
      console.log('To proceed, run: node scripts/seed-database.js --force');

      if (!process.argv.includes('--force')) {
        console.log('Seeding cancelled. Use --force flag to override.');
        return;
      }

      console.log('🗑️  Clearing existing data...');
      await Promise.all([
        User.deleteMany({}),
        Job.deleteMany({}),
        Review.deleteMany({}),
        Payment.deleteMany({}),
        Notification.deleteMany({})
      ]);
      console.log('✅ Existing data cleared\n');
    }

    // Create all data in order (maintaining relationships)
    const users = await createUsers();
    const jobs = await createJobs(users);
    const reviews = await createReviews(users, jobs);
    const payments = await createPayments(users, jobs);
    const notifications = await createNotifications(users, jobs);

    // Summary
    console.log('\n🎉 Database seeding completed!');
    console.log('================================');
    console.log(`👥 Users: ${users.length}`);
    console.log(`💼 Jobs: ${jobs.length}`);
    console.log(`⭐ Reviews: ${reviews.length}`);
    console.log(`💳 Payments: ${payments.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);
    console.log(`📊 Total records: ${users.length + jobs.length + reviews.length + payments.length + notifications.length}`);

    console.log('\n📋 Sample data includes:');
    console.log('• 10 users with realistic profiles and skills');
    console.log('• 12 jobs in various categories and statuses');
    console.log('• 8 reviews for completed jobs');
    console.log('• 6 payments for completed jobs');
    console.log('• 15 notifications of various types');

    console.log('\n🚀 You can now:');
    console.log('• Test the migration system with real data');
    console.log('• See populated user profiles and job listings');
    console.log('• Test populate queries and relationships');
    console.log('• Run the diagnostic to see if any issues exist');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding error:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
