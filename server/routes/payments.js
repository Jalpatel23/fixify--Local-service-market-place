const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  getUserPayments,
  getPaymentStats,
  handleWebhook,
  createRefund,
  getPaymentByJobId,
  paymentValidation
} = require('../controllers/paymentController');

// Razorpay payment routes

// Create payment order (called when user clicks "Pay Now")
router.post('/create-order', authenticateUser, paymentValidation, createPaymentOrder);

// Verify payment after completion
router.post('/verify', authenticateUser, verifyPayment);

// Get payment details
router.get('/details/:paymentId', authenticateUser, getPaymentDetails);

// Get all user payments
router.get('/user', authenticateUser, getUserPayments);

// Get payment statistics
router.get('/stats', authenticateUser, getPaymentStats);

// Get payment by job ID
router.get('/job/:jobId', authenticateUser, getPaymentByJobId);

// Create refund
router.post('/:paymentId/refund', authenticateUser, createRefund);

// Razorpay webhook (no auth required - Razorpay calls this)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
