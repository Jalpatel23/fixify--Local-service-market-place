const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const {
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
} = require('../controllers/paymentController');

// Payment processing routes
router.post('/create-intent', authenticateUser, paymentValidation, createPaymentIntent);
router.post('/:paymentId/confirm', authenticateUser, confirmPayment);

// Payment management routes
router.get('/details/:paymentId', authenticateUser, getPaymentDetails);
router.get('/user', authenticateUser, getUserPayments);
router.get('/stats', authenticateUser, getPaymentStats);

// Escrow management
router.post('/:paymentId/release-escrow', authenticateUser, releaseEscrow);

// Dispute management
router.post('/:paymentId/dispute', authenticateUser, createDispute);
router.put('/:paymentId/resolve-dispute', authenticateUser, requireAdmin, resolveDispute);
router.get('/disputes', authenticateUser, requireAdmin, getDisputes);

module.exports = router; 