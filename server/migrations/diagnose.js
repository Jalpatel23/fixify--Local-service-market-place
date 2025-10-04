/**
 * Database Diagnostic Script
 * 
 * Checks for ObjectId reference issues without making any changes.
 * Run this before the migration to see what problems exist.
 * 
 * Usage: node migrations/diagnose.js
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
 * Check if a value is a proper ObjectId instance
 */
const isObjectId = (value) => {
  return value instanceof mongoose.Types.ObjectId;
};

/**
 * Analyze Review collection for issues
 */
const analyzeReviews = async () => {
  console.log('🔍 Analyzing Review collection...');
  console.log('=====================================');
  
  const reviews = await Review.find({}).lean();
  
  if (reviews.length === 0) {
    console.log('ℹ️  No reviews found in database');
    return { total: 0, issues: 0, details: [] };
  }
  
  console.log(`📊 Total reviews: ${reviews.length}`);
  
  let issueCount = 0;
  const issueDetails = [];
  
  for (const review of reviews) {
    const reviewIssues = [];
    
    // Check reviewer field
    if (review.reviewer) {
      if (isStringObjectId(review.reviewer)) {
        reviewIssues.push('reviewer (string ObjectId)');
      } else if (!isObjectId(review.reviewer)) {
        reviewIssues.push('reviewer (invalid type)');
      }
    }
    
    // Check reviewee field
    if (review.reviewee) {
      if (isStringObjectId(review.reviewee)) {
        reviewIssues.push('reviewee (string ObjectId)');
      } else if (!isObjectId(review.reviewee)) {
        reviewIssues.push('reviewee (invalid type)');
      }
    }
    
    // Check job field
    if (review.job) {
      if (isStringObjectId(review.job)) {
        reviewIssues.push('job (string ObjectId)');
      } else if (!isObjectId(review.job)) {
        reviewIssues.push('job (invalid type)');
      }
    }
    
    // Check moderatedBy field
    if (review.moderatedBy) {
      if (isStringObjectId(review.moderatedBy)) {
        reviewIssues.push('moderatedBy (string ObjectId)');
      } else if (!isObjectId(review.moderatedBy)) {
        reviewIssues.push('moderatedBy (invalid type)');
      }
    }
    
    // Check helpfulBy array
    if (review.helpfulBy && Array.isArray(review.helpfulBy)) {
      review.helpfulBy.forEach((id, index) => {
        if (isStringObjectId(id)) {
          reviewIssues.push(`helpfulBy[${index}] (string ObjectId)`);
        } else if (!isObjectId(id)) {
          reviewIssues.push(`helpfulBy[${index}] (invalid type)`);
        }
      });
    }
    
    // Check flags array
    if (review.flags && Array.isArray(review.flags)) {
      review.flags.forEach((flag, index) => {
        if (flag.user) {
          if (isStringObjectId(flag.user)) {
            reviewIssues.push(`flags[${index}].user (string ObjectId)`);
          } else if (!isObjectId(flag.user)) {
            reviewIssues.push(`flags[${index}].user (invalid type)`);
          }
        }
      });
    }
    
    if (reviewIssues.length > 0) {
      issueCount++;
      issueDetails.push({
        id: review._id,
        issues: reviewIssues
      });
    }
  }
  
  if (issueCount === 0) {
    console.log('✅ No ObjectId reference issues found in Reviews');
  } else {
    console.log(`❌ Found issues in ${issueCount} review(s):`);
    issueDetails.slice(0, 5).forEach(detail => {
      console.log(`   Review ${detail.id}:`);
      detail.issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    });
    
    if (issueDetails.length > 5) {
      console.log(`   ... and ${issueDetails.length - 5} more reviews with issues`);
    }
  }
  
  console.log('');
  return { total: reviews.length, issues: issueCount, details: issueDetails };
};

/**
 * Analyze Payment collection for issues
 */
const analyzePayments = async () => {
  console.log('🔍 Analyzing Payment collection...');
  console.log('=====================================');
  
  const payments = await Payment.find({}).lean();
  
  if (payments.length === 0) {
    console.log('ℹ️  No payments found in database');
    return { total: 0, issues: 0, details: [] };
  }
  
  console.log(`📊 Total payments: ${payments.length}`);
  
  let issueCount = 0;
  const issueDetails = [];
  
  for (const payment of payments) {
    const paymentIssues = [];
    
    // Check job field
    if (payment.job) {
      if (isStringObjectId(payment.job)) {
        paymentIssues.push('job (string ObjectId)');
      } else if (!isObjectId(payment.job)) {
        paymentIssues.push('job (invalid type)');
      }
    }
    
    // Check client field
    if (payment.client) {
      if (isStringObjectId(payment.client)) {
        paymentIssues.push('client (string ObjectId)');
      } else if (!isObjectId(payment.client)) {
        paymentIssues.push('client (invalid type)');
      }
    }
    
    // Check helper field
    if (payment.helper) {
      if (isStringObjectId(payment.helper)) {
        paymentIssues.push('helper (string ObjectId)');
      } else if (!isObjectId(payment.helper)) {
        paymentIssues.push('helper (invalid type)');
      }
    }
    
    if (paymentIssues.length > 0) {
      issueCount++;
      issueDetails.push({
        id: payment._id,
        issues: paymentIssues
      });
    }
  }
  
  if (issueCount === 0) {
    console.log('✅ No ObjectId reference issues found in Payments');
  } else {
    console.log(`❌ Found issues in ${issueCount} payment(s):`);
    issueDetails.slice(0, 5).forEach(detail => {
      console.log(`   Payment ${detail.id}:`);
      detail.issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    });
    
    if (issueDetails.length > 5) {
      console.log(`   ... and ${issueDetails.length - 5} more payments with issues`);
    }
  }
  
  console.log('');
  return { total: payments.length, issues: issueCount, details: issueDetails };
};

/**
 * Check for orphaned references (references to non-existent documents)
 */
const checkOrphanedReferences = async () => {
  console.log('🔍 Checking for orphaned references...');
  console.log('=====================================');
  
  let orphanCount = 0;
  
  // Check Review references
  const reviews = await Review.find({}).lean();
  for (const review of reviews) {
    // Check if reviewer exists
    if (review.reviewer) {
      const reviewerId = isStringObjectId(review.reviewer) 
        ? new mongoose.Types.ObjectId(review.reviewer) 
        : review.reviewer;
      const reviewerExists = await User.exists({ _id: reviewerId });
      if (!reviewerExists) {
        console.log(`❌ Review ${review._id} → reviewer ${review.reviewer} (user not found)`);
        orphanCount++;
      }
    }
    
    // Check if reviewee exists
    if (review.reviewee) {
      const revieweeId = isStringObjectId(review.reviewee) 
        ? new mongoose.Types.ObjectId(review.reviewee) 
        : review.reviewee;
      const revieweeExists = await User.exists({ _id: revieweeId });
      if (!revieweeExists) {
        console.log(`❌ Review ${review._id} → reviewee ${review.reviewee} (user not found)`);
        orphanCount++;
      }
    }
    
    // Check if job exists
    if (review.job) {
      const jobId = isStringObjectId(review.job) 
        ? new mongoose.Types.ObjectId(review.job) 
        : review.job;
      const jobExists = await Job.exists({ _id: jobId });
      if (!jobExists) {
        console.log(`❌ Review ${review._id} → job ${review.job} (job not found)`);
        orphanCount++;
      }
    }
  }
  
  // Check Payment references
  const payments = await Payment.find({}).lean();
  for (const payment of payments) {
    // Check if client exists
    if (payment.client) {
      const clientId = isStringObjectId(payment.client) 
        ? new mongoose.Types.ObjectId(payment.client) 
        : payment.client;
      const clientExists = await User.exists({ _id: clientId });
      if (!clientExists) {
        console.log(`❌ Payment ${payment._id} → client ${payment.client} (user not found)`);
        orphanCount++;
      }
    }
    
    // Check if helper exists
    if (payment.helper) {
      const helperId = isStringObjectId(payment.helper) 
        ? new mongoose.Types.ObjectId(payment.helper) 
        : payment.helper;
      const helperExists = await User.exists({ _id: helperId });
      if (!helperExists) {
        console.log(`❌ Payment ${payment._id} → helper ${payment.helper} (user not found)`);
        orphanCount++;
      }
    }
    
    // Check if job exists
    if (payment.job) {
      const jobId = isStringObjectId(payment.job) 
        ? new mongoose.Types.ObjectId(payment.job) 
        : payment.job;
      const jobExists = await Job.exists({ _id: jobId });
      if (!jobExists) {
        console.log(`❌ Payment ${payment._id} → job ${payment.job} (job not found)`);
        orphanCount++;
      }
    }
  }
  
  if (orphanCount === 0) {
    console.log('✅ No orphaned references found');
  } else {
    console.log(`❌ Found ${orphanCount} orphaned reference(s)`);
  }
  
  console.log('');
  return orphanCount;
};

/**
 * Test a sample populate query to see if it works
 */
const testPopulateQueries = async () => {
  console.log('🔍 Testing populate queries...');
  console.log('=====================================');
  
  // Test Review populate
  const sampleReview = await Review.findOne({});
  if (sampleReview) {
    try {
      const populatedReview = await Review.findById(sampleReview._id)
        .populate('reviewer', 'firstName lastName')
        .populate('reviewee', 'firstName lastName')
        .populate('job', 'title');
      
      console.log('📋 Sample Review populate test:');
      console.log(`   Review ID: ${populatedReview._id}`);
      console.log(`   Reviewer: ${populatedReview.reviewer ? 
        (populatedReview.reviewer.firstName + ' ' + populatedReview.reviewer.lastName) : 
        '❌ NULL (populate failed)'}`);
      console.log(`   Reviewee: ${populatedReview.reviewee ? 
        (populatedReview.reviewee.firstName + ' ' + populatedReview.reviewee.lastName) : 
        '❌ NULL (populate failed)'}`);
      console.log(`   Job: ${populatedReview.job ? 
        populatedReview.job.title : 
        '❌ NULL (populate failed)'}`);
    } catch (error) {
      console.log(`❌ Review populate failed: ${error.message}`);
    }
  } else {
    console.log('ℹ️  No reviews to test populate with');
  }
  
  // Test Payment populate
  const samplePayment = await Payment.findOne({});
  if (samplePayment) {
    try {
      const populatedPayment = await Payment.findById(samplePayment._id)
        .populate('client', 'firstName lastName')
        .populate('helper', 'firstName lastName')
        .populate('job', 'title');
      
      console.log('\n💳 Sample Payment populate test:');
      console.log(`   Payment ID: ${populatedPayment._id}`);
      console.log(`   Client: ${populatedPayment.client ? 
        (populatedPayment.client.firstName + ' ' + populatedPayment.client.lastName) : 
        '❌ NULL (populate failed)'}`);
      console.log(`   Helper: ${populatedPayment.helper ? 
        (populatedPayment.helper.firstName + ' ' + populatedPayment.helper.lastName) : 
        '❌ NULL (populate failed)'}`);
      console.log(`   Job: ${populatedPayment.job ? 
        populatedPayment.job.title : 
        '❌ NULL (populate failed)'}`);
    } catch (error) {
      console.log(`❌ Payment populate failed: ${error.message}`);
    }
  } else {
    console.log('ℹ️  No payments to test populate with');
  }
  
  console.log('');
};

/**
 * Main diagnostic function
 */
const runDiagnostic = async () => {
  try {
    console.log('🔍 Database Diagnostic Report');
    console.log('============================');
    console.log(`📡 Connecting to: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');
    
    // Run all diagnostic checks
    const reviewResults = await analyzeReviews();
    const paymentResults = await analyzePayments();
    const orphanCount = await checkOrphanedReferences();
    await testPopulateQueries();
    
    // Summary
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('====================');
    console.log(`Reviews analyzed: ${reviewResults.total}`);
    console.log(`Reviews with issues: ${reviewResults.issues}`);
    console.log(`Payments analyzed: ${paymentResults.total}`);
    console.log(`Payments with issues: ${paymentResults.issues}`);
    console.log(`Orphaned references: ${orphanCount}`);
    
    const totalIssues = reviewResults.issues + paymentResults.issues + orphanCount;
    
    if (totalIssues === 0) {
      console.log('\n🎉 RESULT: Your database is clean! No migration needed.');
    } else {
      console.log(`\n⚠️  RESULT: Found ${totalIssues} issue(s) that the migration will fix.`);
      console.log('\n📋 RECOMMENDED ACTIONS:');
      console.log('1. Create a backup: npm run backup');
      console.log('2. Run migration: npm run migrate');
      console.log('3. Test your application thoroughly');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

// Run diagnostic if called directly
if (require.main === module) {
  runDiagnostic()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Diagnostic error:', error);
      process.exit(1);
    });
}

module.exports = { runDiagnostic };
