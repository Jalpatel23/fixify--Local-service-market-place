const mongoose = require('mongoose');
const Job = require('../models/Job');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixSavedByData() {
  try {
    console.log('Starting to fix corrupted savedBy data...');
    
    // Find all jobs with corrupted savedBy data
    const jobs = await Job.find({
      $or: [
        { 'stats.savedBy': { $exists: false } },
        { 'stats.savedBy': { $type: 'string' } },
        { 'stats.savedBy': { $type: 'array', $elemMatch: { $type: 'string' } } }
      ]
    });
    
    console.log(`Found ${jobs.length} jobs with corrupted savedBy data`);
    
    for (const job of jobs) {
      console.log(`Fixing job: ${job._id}`);
      
      // Initialize stats if it doesn't exist
      if (!job.stats) {
        job.stats = {
          views: 0,
          applications: 0,
          savedBy: []
        };
      }
      
      // Fix savedBy array
      if (!Array.isArray(job.stats.savedBy)) {
        job.stats.savedBy = [];
      } else {
        // Remove any non-ObjectId values
        job.stats.savedBy = job.stats.savedBy.filter(id => {
          return mongoose.Types.ObjectId.isValid(id);
        });
      }
      
      await job.save();
      console.log(`Fixed job: ${job._id}`);
    }
    
    console.log('Successfully fixed all corrupted savedBy data!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing savedBy data:', error);
    process.exit(1);
  }
}

fixSavedByData();
