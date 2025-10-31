const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const User = require('../models/User');
const { handleValidationErrors } = require('../utils/validation');
const { body } = require('express-validator');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Validation rules
const paymentValidation = [
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('amount').isNumeric().withMessage('Valid amount is required'),
  body('currency').isIn(['INR', 'USD', 'EUR']).withMessage('Valid currency is required'),
  handleValidationErrors
];

/**
 * Create Razorpay order for payment
 * This is called when user clicks "Pay Now" button
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { jobId, amount, currency = 'INR' } = req.body;
    const clientId = req.user._id.toString();

    // Get job details
    const job = await Job.findById(jobId).populate('creator assignedTo');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify the user is the job creator (client)
    if (job.creator._id.toString() !== clientId) {
      return res.status(403).json({ message: 'You can only pay for your own jobs' });
    }

    // Check if job is accepted and has a helper
    if (job.status !== 'completed' && job.status !== 'accepted') {
      return res.status(400).json({
        message: 'Job must be completed or accepted before payment'
      });
    }

    if (!job.assignedTo) {
      return res.status(400).json({ message: 'No helper assigned to this job' });
    }

    // NO PLATFORM FEE - 100% goes to helper
    const platformFee = 0;
    const helperAmount = amount;

    // Create payment record in database
    const payment = new Payment({
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      job: jobId,
      client: clientId,
      helper: job.assignedTo._id,
      amount,
      currency,
      platformFee: 0, // No fee
      helperAmount, // 100% to helper
      description: `Payment for job: ${job.title}`,
      metadata: {
        jobTitle: job.title,
        jobCategory: job.category,
        location: job.location?.address || 'Unknown'
      },
      razorpayOrderId: '', // Will be updated after creating order
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise (smallest currency unit)
      currency: currency,
      receipt: payment.paymentId,
      notes: {
        paymentId: payment.paymentId,
        jobId: jobId,
        clientId: clientId,
        helperId: job.assignedTo._id.toString(),
        jobTitle: job.title
      }
    });

    // Update payment with Razorpay order ID
    payment.razorpayOrderId = razorpayOrder.id;
    await payment.save();

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      paymentId: payment.paymentId,
      key: process.env.RAZORPAY_KEY_ID, // Send to frontend
      helperName: job.assignedTo.firstName + ' ' + job.assignedTo.lastName,
      jobTitle: job.title
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

/**
 * Verify payment signature and confirm payment
 * Called after user completes payment on Razorpay
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod
    } = req.body;

    // Verify signature to ensure payment is genuine
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Find payment by Razorpay order ID
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id })
      .populate('job');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    // Update payment status
    payment.status = 'completed';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.completedAt = new Date();

    // Store payment method details
    payment.paymentMethod = {
      type: razorpayPayment.method || paymentMethod || 'upi',
      details: razorpayPayment.card_id || razorpayPayment.vpa || 'N/A',
      vpa: razorpayPayment.vpa,
      wallet: razorpayPayment.wallet,
      bank: razorpayPayment.bank
    };

    await payment.save();

    // Update job status to paid
    await Job.findByIdAndUpdate(payment.job._id, {
      paymentStatus: 'paid',
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Payment verified and completed successfully',
      payment: {
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        helperAmount: payment.helperAmount,
        paymentMethod: payment.paymentMethod
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

/**
 * Get payment details by payment ID
 */
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
    if (payment.client._id.toString() !== userId &&
        payment.helper._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ message: 'Failed to get payment details' });
  }
};

/**
 * Get all payments for a user (both as client and helper)
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, role, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filter by role (client or helper)
    if (role === 'client') {
      query.client = userId;
    } else if (role === 'helper') {
      query.helper = userId;
    } else {
      // Both roles
      query = { $or: [{ client: userId }, { helper: userId }] };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('job', 'title category status')
      .populate('client', 'firstName lastName')
      .populate('helper', 'firstName lastName')
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

/**
 * Get payment statistics for user
 */
const getPaymentStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { role = 'all' } = req.query;

    const stats = await Payment.getPaymentStats(userId, role);

    res.json({ stats });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Failed to get payment stats' });
  }
};

/**
 * Razorpay webhook handler
 * Automatically called by Razorpay on payment events
 */
const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const paymentData = req.body.payload.payment.entity;

    switch (event) {
      case 'payment.captured':
        // Payment successful
        await Payment.findOneAndUpdate(
          { razorpayPaymentId: paymentData.id },
          {
            status: 'completed',
            completedAt: new Date()
          }
        );
        break;

      case 'payment.failed':
        // Payment failed
        await Payment.findOneAndUpdate(
          { razorpayOrderId: paymentData.order_id },
          { status: 'failed' }
        );
        break;

      case 'refund.created':
        // Refund initiated
        await Payment.findOneAndUpdate(
          { razorpayPaymentId: paymentData.payment_id },
          {
            status: 'refunded',
            refundedAt: new Date()
          }
        );
        break;
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

/**
 * Create refund for a payment
 */
const createRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id.toString();

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Only client can request refund
    if (payment.client.toString() !== userId) {
      return res.status(403).json({ message: 'Only client can request refund' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only refund completed payments' });
    }

    // Create refund on Razorpay
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount * 100, // Full refund in paise
      notes: {
        reason: 'Client requested refund',
        paymentId: payment.paymentId
      }
    });

    // Update payment status
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    await payment.save();

    // Update job status
    await Job.findByIdAndUpdate(payment.job, {
      paymentStatus: 'refunded'
    });

    res.json({
      message: 'Refund initiated successfully',
      refund: refund
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      message: 'Failed to create refund',
      error: error.message
    });
  }
};

/**
 * Get payment by job ID
 */
const getPaymentByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id.toString();

    const payment = await Payment.findOne({ job: jobId })
      .populate('client', 'firstName lastName')
      .populate('helper', 'firstName lastName');

    if (!payment) {
      return res.status(404).json({ message: 'No payment found for this job' });
    }

    // Check if user has access
    if (payment.client._id.toString() !== userId &&
        payment.helper._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment by job error:', error);
    res.status(500).json({ message: 'Failed to get payment' });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  getUserPayments,
  getPaymentStats,
  handleWebhook,
  createRefund,
  getPaymentByJobId,
  paymentValidation
};
