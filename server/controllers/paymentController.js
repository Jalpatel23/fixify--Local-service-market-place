const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const User = require('../models/User');
const { handleValidationErrors } = require('../utils/validation');
const { body } = require('express-validator');

// Validation rules
const paymentValidation = [
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('amount').isNumeric().withMessage('Valid amount is required'),
  body('currency').isIn(['usd', 'eur', 'gbp', 'cad', 'aud']).withMessage('Valid currency is required'),
  handleValidationErrors
];

const createPaymentIntent = async (req, res) => {
  try {
    const { jobId, amount, currency = 'usd' } = req.body;
    const clientId = req.user._id.toString();

    // Get job details
    const job = await Job.findById(jobId).populate('creator');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only pay for your own jobs' });
    }

    if (job.status !== 'accepted') {
      return res.status(400).json({ message: 'Job must be accepted before payment' });
    }

    // Calculate platform fee (5% of job amount)
    const platformFee = Math.round(amount * 0.05);
    const helperAmount = amount - platformFee;

    // Create payment record
    const payment = new Payment({
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      job: jobId,
      client: clientId,
      helper: job.assignedTo,
      amount,
      currency,
      platformFee,
      helperAmount,
      description: `Payment for job: ${job.title}`,
      metadata: {
        jobTitle: job.title,
        jobCategory: job.category,
        location: job.location?.address || 'Unknown'
      }
    });

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        paymentId: payment.paymentId,
        jobId: jobId,
        clientId: clientId,
        helperId: job.assignedTo?.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    payment.stripePaymentIntentId = paymentIntent.id;
    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paymentIntentId } = req.body;

    const payment = await Payment.findOne({ paymentId }).populate('job');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();

      // Update job status
      await Job.findByIdAndUpdate(payment.job._id, {
        status: 'in_progress',
        paymentStatus: 'paid'
      });

      res.json({ 
        message: 'Payment confirmed successfully',
        payment: payment
      });
    } else {
      payment.status = 'failed';
      await payment.save();
      
      res.status(400).json({ message: 'Payment failed' });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
};

const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id.toString();

    const payment = await Payment.findOne({ paymentId })
      .populate('job')
      .populate('client', 'firstName lastName email')
      .populate('helper', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user has access to this payment
    if (payment.client !== userId && payment.helper !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ message: 'Failed to get payment details' });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { status, page = 1, limit = 10 } = req.query;

    const query = {
      $or: [{ client: userId }, { helper: userId }]
    };

    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('job', 'title category status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ message: 'Failed to get payments' });
  }
};

const getPaymentStats = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { role = 'all' } = req.query;

    const stats = await Payment.getPaymentStats(userId, role);
    
    res.json({ stats });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Failed to get payment stats' });
  }
};

const releaseEscrow = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id.toString();

    const payment = await Payment.findOne({ paymentId }).populate('job');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Only client can release escrow
    if (payment.client !== userId) {
      return res.status(403).json({ message: 'Only the client can release escrow' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Payment must be completed to release escrow' });
    }

    // Transfer funds to helper via Stripe
    const transfer = await stripe.transfers.create({
      amount: payment.helperAmount,
      currency: payment.currency,
      destination: (await User.findById(payment.helper))?.stripe?.accountId, // Helper's connected account
      metadata: {
        paymentId: payment.paymentId,
        jobId: payment.job._id.toString()
      }
    });

    // Update payment status
    payment.escrow.releaseDate = new Date();
    await payment.save();

    // Update job status
    await Job.findByIdAndUpdate(payment.job._id, {
      status: 'completed',
      paymentStatus: 'released'
    });

    res.json({ 
      message: 'Escrow released successfully',
      transfer: transfer
    });
  } catch (error) {
    console.error('Release escrow error:', error);
    res.status(500).json({ message: 'Failed to release escrow' });
  }
};

const createDispute = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user._id.toString();

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Only client or helper can create dispute
    if (payment.client !== userId && payment.helper !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (payment.dispute.isDisputed) {
      return res.status(400).json({ message: 'Dispute already exists' });
    }

    payment.dispute.isDisputed = true;
    payment.dispute.reason = reason;
    payment.dispute.description = description;
    await payment.save();

    res.json({ 
      message: 'Dispute created successfully',
      dispute: payment.dispute
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ message: 'Failed to create dispute' });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { resolution } = req.body;
    const adminId = req.user._id.toString();

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (!payment.dispute.isDisputed) {
      return res.status(400).json({ message: 'No dispute to resolve' });
    }

    payment.dispute.resolution = resolution;
    payment.dispute.resolvedBy = adminId;
    payment.dispute.resolvedAt = new Date();

    // Handle resolution
    switch (resolution) {
      case 'refund_client':
        payment.status = 'refunded';
        // Process refund via Stripe
        await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId
        });
        break;
      case 'pay_helper':
        payment.status = 'completed';
        // Release escrow to helper
        await stripe.transfers.create({
          amount: payment.helperAmount,
          currency: payment.currency,
          destination: (await User.findById(payment.helper))?.stripe?.accountId
        });
        break;
      case 'partial_refund':
        // Handle partial refund logic
        break;
    }

    await payment.save();

    res.json({ 
      message: 'Dispute resolved successfully',
      resolution: payment.dispute
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ message: 'Failed to resolve dispute' });
  }
};

const getDisputes = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { 'dispute.isDisputed': true };
    if (status) {
      query['dispute.resolution'] = status;
    }

    const disputes = await Payment.find(query)
      .populate('job', 'title category')
      .populate('client', 'firstName lastName')
      .populate('helper', 'firstName lastName')
      .sort({ 'dispute.resolvedAt': -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      disputes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ message: 'Failed to get disputes' });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentDetails,
  getUserPayments,
  getPaymentStats,
  releaseEscrow,
  createDispute,
  resolveDispute,
  getDisputes,
  paymentValidation
}; 