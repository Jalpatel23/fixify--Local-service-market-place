/**
 * Migration: Fix ObjectId references in Review and Payment collections
 * 
 * This migration ensures all user and job references in Review and Payment
 * collections are proper ObjectIds instead of strings.
 * 
 * Run with: node migrations/001-fix-objectid-references.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Job = require('../models/Job');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixify';

/**
 * Check if a value is a valid ObjectId string but not an ObjectId instance
 */
const isStringObjectId = (value) => {
  return typeof value === 'string' && mongoose.isValidObjectId(value) && value.length === 24;
};

/**
 * Convert string ObjectId to ObjectId instance
 */
const toObjectId = (value) => {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return value;
};

/**
 * Fix Review collection ObjectId references
 */
const fixReviewReferences = async () => {
  console.log('🔍 Checking Review collection for string ObjectId references...');
  
  const reviews = await Review.find({}).lean();
  let fixedCount = 0;
  
  for (const review of reviews) {
    const updates = {};
    let needsUpdate = false;
    
    // Check reviewer field
    if (isStringObjectId(review.reviewer)) {
      updates.reviewer = toObjectId(review.reviewer);
      needsUpdate = true;
    }
    
    // Check reviewee field
    if (isStringObjectId(review.reviewee)) {
      updates.reviewee = toObjectId(review.reviewee);
      needsUpdate = true;
    }
    
    // Check job field
    if (isStringObjectId(review.job)) {
      updates.job = toObjectId(review.job);
      needsUpdate = true;
    }
    
    // Check moderatedBy field
    if (review.moderatedBy && isStringObjectId(review.moderatedBy)) {
      updates.moderatedBy = toObjectId(review.moderatedBy);
      needsUpdate = true;
    }
    
    // Check helpfulBy array
    if (review.helpfulBy && Array.isArray(review.helpfulBy)) {
      const fixedHelpfulBy = review.helpfulBy.map(id => 
        isStringObjectId(id) ? toObjectId(id) : id
      );
      if (JSON.stringify(fixedHelpfulBy) !== JSON.stringify(review.helpfulBy)) {
        updates.helpfulBy = fixedHelpfulBy;
        needsUpdate = true;
      }
    }
    
    // Check flags array
    if (review.flags && Array.isArray(review.flags)) {
      const fixedFlags = review.flags.map(flag => ({
        ...flag,
        user: isStringObjectId(flag.user) ? toObjectId(flag.user) : flag.user
      }));
      if (JSON.stringify(fixedFlags) !== JSON.stringify(review.flags)) {
        updates.flags = fixedFlags;
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await Review.updateOne({ _id: review._id }, { $set: updates });
      fixedCount++;
      console.log(`✅ Fixed Review ${review._id}`);
    }
  }
  
  console.log(`📊 Fixed ${fixedCount} Review records`);
  return fixedCount;
};

/**
 * Fix Payment collection ObjectId references
 */
const fixPaymentReferences = async () => {
  console.log('🔍 Checking Payment collection for string ObjectId references...');
  
  const payments = await Payment.find({}).lean();
  let fixedCount = 0;
  
  for (const payment of payments) {
    const updates = {};
    let needsUpdate = false;
    
    // Check job field
    if (isStringObjectId(payment.job)) {
      updates.job = toObjectId(payment.job);
      needsUpdate = true;
    }
    
    // Check client field
    if (isStringObjectId(payment.client)) {
      updates.client = toObjectId(payment.client);
      needsUpdate = true;
    }
    
    // Check helper field
    if (isStringObjectId(payment.helper)) {
      updates.helper = toObjectId(payment.helper);
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await Payment.updateOne({ _id: payment._id }, { $set: updates });
      fixedCount++;
      console.log(`✅ Fixed Payment ${payment._id}`);
    }
  }
  
  console.log(`📊 Fixed ${fixedCount} Payment records`);
  return fixedCount;
};

/**
 * Validate that all references point to existing documents
 */
const validateReferences = async () => {
  console.log('🔍 Validating all references point to existing documents...');
  
  let orphanedCount = 0;
  
  // Check Review references
  const reviews = await Review.find({}).lean();
  for (const review of reviews) {
    // Check if reviewer exists
    if (review.reviewer) {
      const reviewerExists = await User.exists({ _id: review.reviewer });
      if (!reviewerExists) {
        console.log(`⚠️  Review ${review._id} references non-existent reviewer: ${review.reviewer}`);
        orphanedCount++;
      }
    }
    
    // Check if reviewee exists
    if (review.reviewee) {
      const revieweeExists = await User.exists({ _id: review.reviewee });
      if (!revieweeExists) {
        console.log(`⚠️  Review ${review._id} references non-existent reviewee: ${review.reviewee}`);
        orphanedCount++;
      }
    }
    
    // Check if job exists
    if (review.job) {
      const jobExists = await Job.exists({ _id: review.job });
      if (!jobExists) {
        console.log(`⚠️  Review ${review._id} references non-existent job: ${review.job}`);
        orphanedCount++;
      }
    }
  }
  
  // Check Payment references
  const payments = await Payment.find({}).lean();
  for (const payment of payments) {
    // Check if client exists
    if (payment.client) {
      const clientExists = await User.exists({ _id: payment.client });
      if (!clientExists) {
        console.log(`⚠️  Payment ${payment._id} references non-existent client: ${payment.client}`);
        orphanedCount++;
      }
    }
    
    // Check if helper exists
    if (payment.helper) {
      const helperExists = await User.exists({ _id: payment.helper });
      if (!helperExists) {
        console.log(`⚠️  Payment ${payment._id} references non-existent helper: ${payment.helper}`);
        orphanedCount++;
      }
    }
    
    // Check if job exists
    if (payment.job) {
      const jobExists = await Job.exists({ _id: payment.job });
      if (!jobExists) {
        console.log(`⚠️  Payment ${payment._id} references non-existent job: ${payment.job}`);
        orphanedCount++;
      }
    }
  }
  
  if (orphanedCount === 0) {
    console.log('✅ All references are valid');
  } else {
    console.log(`⚠️  Found ${orphanedCount} orphaned references`);
  }
  
  return orphanedCount;
};

/**
 * Main migration function
 */
const runMigration = async () => {
  try {
    console.log('🚀 Starting ObjectId reference migration...');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Run migrations
    const reviewsFixed = await fixReviewReferences();
    const paymentsFixed = await fixPaymentReferences();
    
    // Validate references
    await validateReferences();
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Reviews fixed: ${reviewsFixed}`);
    console.log(`   Payments fixed: ${paymentsFixed}`);
    console.log(`   Total records fixed: ${reviewsFixed + paymentsFixed}`);
    
    if (reviewsFixed + paymentsFixed === 0) {
      console.log('✅ No ObjectId reference issues found - database is clean!');
    } else {
      console.log('✅ Migration completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('📡 Disconnected from MongoDB');
    }
  }
};

/**
 * Rollback function (Note: This migration is generally safe and doesn't need rollback)
 * ObjectId conversion is a one-way operation that improves data integrity
 */
const rollback = async () => {
  console.log('ℹ️  This migration converts string IDs to ObjectIds for better data integrity.');
  console.log('ℹ️  Rollback is not recommended as it would degrade data quality.');
  console.log('ℹ️  If you need to rollback, restore from a database backup taken before migration.');
  return Promise.resolve();
};

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration error:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  rollback,
  fixReviewReferences,
  fixPaymentReferences,
  validateReferences
};
