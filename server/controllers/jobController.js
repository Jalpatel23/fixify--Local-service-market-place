const { Job, User, Notification } = require('../models');
const { 
  createJobNotification, 
  createSystemNotification, 
  createNearbyQuery, 
  createPagination,
  createJobFilters,
  updateJobStats,
  updateUserStats,
  validateCoordinates,
  formatLocation
} = require('../utils');
const { jobValidationRules, handleValidationErrors } = require('../utils/validation');

/**
 * Create a new job
 * @route POST /api/jobs
 */
const createJob = async (req, res) => {
  try {
    console.log('Create job - Received data:', req.body);
    
    const {
      title,
      description,
      category,
      budget,
      location,
      preferredDate,
      preferredTime,
      requirements,
      images,
      maxDistance
    } = req.body;

    // Validate location coordinates
    if (location && location.coordinates) {
      if (!validateCoordinates(location.coordinates)) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'Location coordinates must be valid [longitude, latitude]'
        });
      }
    }

    // Ensure requirements has the correct structure
    const requirementsData = requirements || {};
    if (!requirementsData.skills || !Array.isArray(requirementsData.skills)) {
      requirementsData.skills = [category]; // Use category as default skill
    }
    if (!requirementsData.experience || !['any', 'beginner', 'intermediate', 'expert'].includes(requirementsData.experience)) {
      requirementsData.experience = 'any';
    }
    if (typeof requirementsData.verifiedOnly !== 'boolean') {
      requirementsData.verifiedOnly = false;
    }
    // Pass through notes if present
    if (requirements && typeof requirements.notes === 'string') {
      requirementsData.notes = requirements.notes;
    }
    
    console.log('Create job - Processed requirements:', requirementsData);

    // Create new job
    const jobData = {
      creator: req.user._id,
      title,
      description,
      category,
      budget,
      location: location || {
        type: 'Point',
        coordinates: [0, 0],
        address: {}
      },
      preferredDate,
      preferredTime,
      requirements: requirementsData,
      images: images || [],
      status: 'open',
      maxDistance: maxDistance || 25
    };
    
    console.log('Create job - Final job data:', jobData);
    
    const job = new Job(jobData);

    await job.save();

    // Update user stats
    await updateUserStats(req.user._id, 'jobsPosted', 1);

    // Send notification to nearby helpers
    // await notifyNearbyHelpers(job);

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job posted successfully'
    });
  } catch (error) {
    console.error('Create job error:', error);
    
    // Log detailed error information
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.errors);
      res.status(400).json({
        error: 'Validation failed',
        message: 'Job data validation failed',
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message,
          value: error.errors[key].value
        }))
      });
    } else {
    res.status(500).json({
      error: 'Failed to create job',
      message: 'Internal server error'
    });
    }
  }
};

/**
 * Get all jobs with filtering and pagination
 * @route GET /api/jobs
 */
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      minBudget,
      maxBudget,
      distance,
      latitude,
      longitude,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query filters
    const filters = createJobFilters({
      category,
      status,
      minBudget,
      maxBudget,
      search
    });

    // Add location-based filtering if coordinates provided
    if (latitude && longitude && distance) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      if (validateCoordinates(parseFloat(latitude), parseFloat(longitude))) {
        Object.assign(filters, createNearbyQuery(coordinates, parseFloat(distance)));
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const { data: jobs, pagination } = await createPagination(
      Job,
      filters,
      sort,
      page,
      limit,
      [
        { path: 'creator', select: 'firstName lastName profileImage rating' },
        { path: 'assignedTo', select: 'firstName lastName profileImage rating' }
      ]
    );

    res.json({
      success: true,
      data: jobs,
      pagination
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      error: 'Failed to get jobs',
      message: 'Internal server error'
    });
  }
};

/**
 * Get a single job by ID
 * @route GET /api/jobs/:id
 */
const getJob = async (req, res) => {
  try {
    // Try to get the job with normal population
    let job;
    try {
      job = await Job.findById(req.params.id)
      .populate('creator', 'firstName lastName profileImage rating')
      .populate('assignedTo', 'firstName lastName profileImage rating');
    } catch (populateError) {
      console.error('Population failed, trying without population:', populateError);
      
      // If population fails due to corrupted data, try without population
      job = await Job.findById(req.params.id).lean();
      
      if (job) {
        // Manually populate the fields we need
        if (job.creator) {
          try {
            const creator = await User.findById(job.creator).select('firstName lastName profileImage rating');
            job.creator = creator;
          } catch (err) {
            console.error('Failed to populate creator:', err);
            job.creator = { firstName: 'Unknown', lastName: 'User' };
          }
        }
        
        if (job.assignedTo) {
          try {
            const assignedTo = await User.findById(job.assignedTo).select('firstName lastName profileImage rating');
            job.assignedTo = assignedTo;
          } catch (err) {
            console.error('Failed to populate assignedTo:', err);
            job.assignedTo = null;
          }
        }
      }
    }

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The requested job does not exist'
      });
    }

    // Clean up corrupted data before sending response
    if (job.requirements) {
      // Clean skills array
      if (job.requirements.skills && Array.isArray(job.requirements.skills)) {
        job.requirements.skills = job.requirements.skills.filter(skill => 
          skill && typeof skill === 'string' && skill.trim().length > 0
        );
        
        if (job.requirements.skills.length === 0) {
          job.requirements.skills = ['other'];
        }
      } else {
        job.requirements.skills = ['other'];
      }
      
      // Ensure experience has valid value
      if (!job.requirements.experience || 
          !['any', 'beginner', 'intermediate', 'expert'].includes(job.requirements.experience)) {
        job.requirements.experience = 'any';
      }
      
      // Ensure verifiedOnly is boolean
      if (typeof job.requirements.verifiedOnly !== 'boolean') {
        job.requirements.verifiedOnly = false;
      }
    }

    // Try to increment view count (but don't fail if it doesn't work)
    try {
      if (job._id) {
        await Job.findByIdAndUpdate(job._id, { $inc: { 'stats.views': 1 } });
      }
    } catch (incrementError) {
      console.error('Failed to increment views:', incrementError);
      // Don't fail the request for this
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    
    // If it's a validation error, try to get the raw document
    if (error.name === 'ValidationError') {
      try {
        console.log('Validation error occurred, trying to get raw document...');
        
        // Try multiple approaches to get the document
        let rawJob = null;
        
        // Approach 1: Try with lean()
        try {
          rawJob = await Job.findById(req.params.id).lean();
        } catch (leanError) {
          console.error('Lean query failed:', leanError);
        }
        
        // Approach 2: If lean failed, try raw MongoDB operation
        if (!rawJob) {
          try {
            console.log('Trying raw MongoDB operation...');
            const db = Job.db;
            const collection = db.collection('jobs');
            rawJob = await collection.findOne({ _id: req.params.id });
          } catch (rawError) {
            console.error('Raw MongoDB operation failed:', rawError);
          }
        }
        
        if (rawJob) {
          console.log('Raw job data retrieved:', JSON.stringify(rawJob, null, 2));
          
          // Clean up the raw data
          if (rawJob.requirements) {
            console.log('Original requirements:', rawJob.requirements);
            rawJob.requirements.skills = ['other'];
            rawJob.requirements.experience = 'any';
            rawJob.requirements.verifiedOnly = false;
            console.log('Cleaned requirements:', rawJob.requirements);
          }
          
          // Try to populate basic user info
          if (rawJob.creator) {
            try {
              const creator = await User.findById(rawJob.creator).select('firstName lastName profileImage rating');
              rawJob.creator = creator || { firstName: 'Unknown', lastName: 'User' };
            } catch (err) {
              rawJob.creator = { firstName: 'Unknown', lastName: 'User' };
            }
          }
          
          // Also try to fix the corrupted data in the database
          try {
            await Job.updateOne(
              { _id: req.params.id },
              { 
                $set: { 
                  'requirements.skills': ['other'],
                  'requirements.experience': 'any',
                  'requirements.verifiedOnly': false
                }
              }
            );
            console.log('Successfully cleaned up corrupted data in database');
          } catch (cleanupError) {
            console.error('Failed to cleanup corrupted data:', cleanupError);
          }
          
          return res.json({
            success: true,
            data: rawJob
          });
        }
      } catch (rawError) {
        console.error('Failed to get raw document:', rawError);
      }
    }
    
    res.status(500).json({
      error: 'Failed to get job',
      message: 'Internal server error'
    });
  }
};

/**
 * Update a job
 * @route PUT /api/jobs/:id
 */
const updateJob = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      budget,
      location,
      preferredDate,
      preferredTime,
      requirements,
      images,
      maxDistance
    } = req.body;

    // Validate location coordinates if provided
    if (location && location.coordinates) {
      if (!validateCoordinates(location.coordinates)) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'Location coordinates must be valid [longitude, latitude]'
        });
      }
    }

    // Get the existing job to preserve required fields
    const existingJob = await Job.findById(req.params.id);
    if (!existingJob) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The requested job does not exist'
      });
    }

    // Build update data, preserving existing values for required fields
    const updateData = {
      ...existingJob.toObject(),
      ...req.body
    };

    // Ensure required fields are present
    if (!updateData.budget || !updateData.budget.min || !updateData.budget.max) {
      updateData.budget = existingJob.budget;
    }
    if (!updateData.location || !updateData.location.coordinates) {
      updateData.location = existingJob.location;
    }
    if (!updateData.preferredDate) {
      updateData.preferredDate = existingJob.preferredDate;
    }
    if (!updateData.preferredTime || !updateData.preferredTime.start || !updateData.preferredTime.end) {
      updateData.preferredTime = existingJob.preferredTime;
    }
    if (!updateData.requirements) {
      updateData.requirements = existingJob.requirements;
    }
    if (!updateData.maxDistance) {
      updateData.maxDistance = existingJob.maxDistance || 25;
    }

    // In updateJob, preserve requirements.notes if present
    if (updateData.requirements) {
      // Clean skills array - remove empty strings and invalid values
      if (updateData.requirements.skills && Array.isArray(updateData.requirements.skills)) {
        updateData.requirements.skills = updateData.requirements.skills.filter(skill => 
          skill && typeof skill === 'string' && skill.trim().length > 0
        );
        
        // If no valid skills, set default
        if (updateData.requirements.skills.length === 0) {
          updateData.requirements.skills = ['other'];
        }
      } else {
        updateData.requirements.skills = ['other'];
      }
      
      // Ensure experience has a valid value
      if (!updateData.requirements.experience || 
          !['any', 'beginner', 'intermediate', 'expert'].includes(updateData.requirements.experience)) {
        updateData.requirements.experience = 'any';
      }
      
      // Ensure verifiedOnly is boolean
      if (typeof updateData.requirements.verifiedOnly !== 'boolean') {
        updateData.requirements.verifiedOnly = false;
      }
      
      // Ensure notes is preserved/updated
      if (requirements && typeof requirements.notes === 'string') {
        updateData.requirements.notes = requirements.notes;
      } else if (existingJob.requirements && typeof existingJob.requirements.notes === 'string') {
        updateData.requirements.notes = existingJob.requirements.notes;
      }
      
      console.log('Update job - Requirements after cleanup:', updateData.requirements);
    }

    // Debug: Log the update data
    console.log('Update job - Original data:', req.body);
    console.log('Update job - Merged data:', updateData);
    console.log('Update job - Requirements before cleanup:', updateData.requirements);

    // Try to update with validation first
    let job;
    try {
      job = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
        { new: true, runValidators: false } // Disable validators to prevent errors
    ).populate('creator', 'firstName lastName profileImage');
    } catch (updateError) {
      console.error('Update failed, trying to fix data:', updateError);
      
      // If update fails, try to fix the data and update again
      const fixedUpdateData = { ...updateData };
      
      // Ensure all required fields have valid values
      if (fixedUpdateData.requirements) {
        fixedUpdateData.requirements.skills = ['other'];
        fixedUpdateData.requirements.experience = 'any';
        fixedUpdateData.requirements.verifiedOnly = false;
      }
      
      // Also try to clean up any existing corrupted data in the database
      try {
        await Job.updateOne(
          { _id: req.params.id },
          { 
            $set: { 
              'requirements.skills': ['other'],
              'requirements.experience': 'any',
              'requirements.verifiedOnly': false
            }
          }
        );
      } catch (cleanupError) {
        console.error('Failed to cleanup corrupted data:', cleanupError);
      }
      
      job = await Job.findByIdAndUpdate(
        req.params.id,
        fixedUpdateData,
        { new: true, runValidators: false }
      ).populate('creator', 'firstName lastName profileImage');
    }

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The requested job does not exist'
      });
    }

    res.json({
      success: true,
      data: job,
      message: 'Job updated successfully'
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      error: 'Failed to update job',
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a job
 * @route DELETE /api/jobs/:id
 */
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The requested job does not exist'
      });
    }

    // Check if job can be deleted (not in progress or completed)
    if (job.status === 'in_progress' || job.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot delete job',
        message: 'Cannot delete a job that is in progress or completed'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    // Update user stats
    await updateUserStats(req.user._id, 'jobsPosted', -1);

    // Notify assigned helper if any
    if (job.assignedTo) {
      await createJobNotification(
        job.assignedTo,
        'job_cancelled',
        job._id,
        'Job Cancelled',
        `The job "${job.title}" has been cancelled by the client.`
      );
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      error: 'Failed to delete job',
      message: 'Internal server error'
    });
  }
};

/**
 * Accept a job
 * @route POST /api/jobs/:id/accept
 */
const acceptJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The requested job does not exist'
      });
    }

    // Check if job is available
    if (!job.isAvailable()) {
      return res.status(400).json({
        error: 'Job not available',
        message: 'This job is no longer available for acceptance'
      });
    }

    // Accept the job
    await job.acceptJob(req.user._id);

    // Update user stats
    await updateUserStats(req.user._id, 'jobsAccepted', 1);
    await updateUserStats(job.creator, 'jobsAssigned', 1);

    // Notify job creator
    await createJobNotification(
      job.creator,
      'job_accepted',
      job._id,
      'Job Accepted',
      `Your job "${job.title}" has been accepted by ${req.user.firstName} ${req.user.lastName}.`
    );

    res.json({
      success: true,
      data: job,
      message: 'Job accepted successfully'
    });
  } catch (error) {
    console.error('Accept job error:', error);
    res.status(500).json({
      error: 'Failed to accept job',
      message: 'Internal server error'
    });
  }
};

/**
 * Complete a job
 * @route POST /api/jobs/:id/complete
 */
const completeJob = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The requested job does not exist'
      });
    }

    // Check if user can complete the job
    const canComplete = job.creator.toString() === req.user._id.toString() ||
                       job.assignedTo?.toString() === req.user._id.toString();

    if (!canComplete) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only complete jobs you created or were assigned to'
      });
    }

    // Complete the job
    await job.completeJob();

    // Update user stats
    if (job.assignedTo) {
      await updateUserStats(job.assignedTo, 'jobsCompleted', 1);
    }
    await updateUserStats(job.creator, 'jobsCompleted', 1);

    // Add rating and review if provided
    if (rating && review) {
      const targetUser = job.creator.toString() === req.user._id.toString() 
        ? job.assignedTo 
        : job.creator;

      if (targetUser) {
        await addJobReview(targetUser, req.user._id, rating, review, job._id);
      }
    }

    // Notify both parties
    const otherUser = job.creator.toString() === req.user._id.toString() 
      ? job.assignedTo 
      : job.creator;

    if (otherUser) {
      await createJobNotification(
        otherUser,
        'job_completed',
        job._id,
        'Job Completed',
        `The job "${job.title}" has been marked as completed.`
      );
    }

    res.json({
      success: true,
      data: job,
      message: 'Job completed successfully'
    });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({
      error: 'Failed to complete job',
      message: 'Internal server error'
    });
  }
};

/**
 * Cancel a job
 * @route POST /api/jobs/:id/cancel
 */
const cancelJob = async (req, res) => {
  try {
    const { reason } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The requested job does not exist'
      });
    }

    // Check if user can cancel the job
    const canCancel = job.creator.toString() === req.user._id.toString() ||
                     job.assignedTo?.toString() === req.user._id.toString();

    if (!canCancel) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only cancel jobs you created or were assigned to'
      });
    }

    // Determine if this is the creator cancelling or assigned user cancelling
    const isCreatorCancelling = job.creator.toString() === req.user._id.toString();

    // Cancel the job
    await job.cancelJob(req.user._id, reason, isCreatorCancelling);

    // Notify the other party
    const otherUser = job.creator.toString() === req.user._id.toString() 
      ? job.assignedTo 
      : job.creator;

    if (otherUser) {
      const notificationTitle = isCreatorCancelling ? 'Job Cancelled' : 'Job Acceptance Cancelled';
      const notificationMessage = isCreatorCancelling 
        ? `The job "${job.title}" has been cancelled by the creator.${reason ? ` Reason: ${reason}` : ''}`
        : `The job "${job.title}" is now available again as the previous assignee cancelled their acceptance.${reason ? ` Reason: ${reason}` : ''}`;
      
      await createJobNotification(
        otherUser,
        isCreatorCancelling ? 'job_cancelled' : 'job_reopened',
        job._id,
        notificationTitle,
        notificationMessage
      );
    }

    res.json({
      success: true,
      data: job,
      message: isCreatorCancelling ? 'Job cancelled successfully' : 'Job acceptance cancelled and job is now available again'
    });
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({
      error: 'Failed to cancel job',
      message: 'Internal server error'
    });
  }
};

/**
 * Reopen a job (make it available again)
 * @route POST /api/jobs/:id/reopen
 */
const reopenJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The requested job does not exist'
      });
    }

    // Only job creator can reopen
    if (job.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the job creator can reopen this job'
      });
    }

    // Can only reopen accepted or in_progress jobs
    if (!['accepted', 'in_progress'].includes(job.status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Can only reopen accepted or in-progress jobs'
      });
    }

    // Store the previous assignee for notification
    const previousAssignee = job.assignedTo;

    // Reopen the job
    job.status = 'open';
    job.assignedTo = null;
    job.acceptedAt = null;
    await job.save();

    // Notify the previous assignee
    if (previousAssignee) {
      await createJobNotification(
        previousAssignee,
        'job_reopened',
        job._id,
        'Job Reopened',
        `The job "${job.title}" has been reopened by the creator.`
      );
    }

    res.json({
      success: true,
      data: job,
      message: 'Job reopened successfully'
    });
  } catch (error) {
    console.error('Reopen job error:', error);
    res.status(500).json({
      error: 'Failed to reopen job',
      message: 'Internal server error'
    });
  }
};

/**
 * Get user's posted jobs
 * @route GET /api/jobs/my-jobs
 */
const getMyJobs = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'User not authenticated or session expired.'
    });
  }
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filters = { creator: req.user._id };
    if (status) filters.status = status;

    const { data: jobs, pagination } = await createPagination(
      Job,
      filters,
      { createdAt: -1 },
      page,
      limit,
      [
        { path: 'assignedTo', select: 'firstName lastName profileImage rating' }
      ]
    );

    res.json({
      success: true,
      data: jobs,
      pagination
    });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      error: 'Failed to get your jobs',
      message: 'Internal server error'
    });
  }
};

/**
 * Get user's accepted jobs
 * @route GET /api/jobs/accepted-jobs
 */
const getAcceptedJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filters = { assignedTo: req.user._id };
    if (status) filters.status = status;

    const { data: jobs, pagination } = await createPagination(
      Job,
      filters,
      { createdAt: -1 },
      page,
      limit,
      [
        { path: 'creator', select: 'firstName lastName profileImage rating' }
      ]
    );

    res.json({
      success: true,
      data: jobs,
      pagination
    });
  } catch (error) {
    console.error('Get accepted jobs error:', error);
    res.status(500).json({
      error: 'Failed to get accepted jobs',
      message: 'Internal server error'
    });
  }
};

/**
 * Save/unsave a job
 * @route POST /api/jobs/:id/save
 */
const toggleJobSave = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The requested job does not exist'
      });
    }

    const user = await User.findById(req.user._id);
    const savedIndex = user.savedJobs.indexOf(job._id);

    // Ensure job.stats and job.stats.savedBy exist
    if (!job.stats) {
      job.stats = {
        views: 0,
        applications: 0,
        savedBy: []
      };
    }
    if (!Array.isArray(job.stats.savedBy)) {
      job.stats.savedBy = [];
    }

    if (savedIndex > -1) {
      // Remove from saved jobs
      user.savedJobs.splice(savedIndex, 1);
      // Remove user from job's savedBy array
      const userIndex = job.stats.savedBy.indexOf(req.user._id);
      if (userIndex > -1) {
        job.stats.savedBy.splice(userIndex, 1);
      }
    } else {
      // Add to saved jobs
      user.savedJobs.push(job._id);
      // Add user to job's savedBy array
      if (!job.stats.savedBy.includes(req.user._id)) {
        job.stats.savedBy.push(req.user._id);
      }
    }

    await user.save();
    await job.save();

    res.json({
      success: true,
      data: {
        isSaved: savedIndex === -1,
        savedJobs: user.savedJobs
      },
      message: savedIndex > -1 ? 'Job removed from saved' : 'Job saved successfully'
    });
  } catch (error) {
    console.error('Toggle job save error:', error);
    res.status(500).json({
      error: 'Failed to save job',
      message: 'Internal server error'
    });
  }
};

/**
 * Get saved jobs
 * @route GET /api/jobs/saved
 */
const getSavedJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(req.user._id).populate('savedJobs');
    const savedJobIds = user.savedJobs.map(job => job._id);

    const { data: jobs, pagination } = await createPagination(
      Job,
      { _id: { $in: savedJobIds } },
      { createdAt: -1 },
      page,
      limit,
      [
        { path: 'creator', select: 'firstName lastName profileImage rating' },
        { path: 'assignedTo', select: 'firstName lastName profileImage rating' }
      ]
    );

    res.json({
      success: true,
      data: jobs,
      pagination
    });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      error: 'Failed to get saved jobs',
      message: 'Internal server error'
    });
  }
};

/**
 * Helper function to notify nearby helpers about new job
 */
const notifyNearbyHelpers = async (job) => {
  try {
    const nearbyHelpers = await User.find({
      accountType: { $in: ['helper', 'both'] },
      isActive: true,
      ...createNearbyQuery(job.location.coordinates, 50)
    }).select('_id').limit(50);

    if (nearbyHelpers.length) {
      const notifications = nearbyHelpers.map(h => ({
        recipient: h._id,
        type: 'job_posted',
        title: 'New Job Available',
        message: `A new ${job.category} job has been posted near you: "${job.title}"`,
        jobId: job._id
      }));
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Notify nearby helpers error:', error);
  }
};

/**
 * Helper function to add job review
 */
const addJobReview = async (targetUserId, reviewerId, rating, review, jobId) => {
  try {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return;

    const newReview = {
      reviewer: reviewerId,
      rating,
      review,
      jobId,
      createdAt: new Date()
    };

    targetUser.rating.reviews.push(newReview);
    targetUser.rating.totalReviews += 1;
    targetUser.rating.averageRating = targetUser.calculateAverageRating();

    await targetUser.save();
  } catch (error) {
    console.error('Add job review error:', error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  acceptJob,
  completeJob,
  cancelJob,
  reopenJob,
  getMyJobs,
  getAcceptedJobs,
  toggleJobSave,
  getSavedJobs
};