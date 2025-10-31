import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  CreditCard,
  Smartphone,
  Wallet,
  Building2,
  Shield,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';

const PaymentForm = ({ job, onSuccess }) => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('upi');

  // Payment methods available in Razorpay
  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Google Pay, PhonePe, Paytm, etc.'
    },
    {
      id: 'card',
      name: 'Card',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Credit/Debit Cards'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: <Wallet className="h-5 w-5" />,
      description: 'Paytm, PhonePe, Amazon Pay'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: <Building2 className="h-5 w-5" />,
      description: 'All major banks'
    }
  ];

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Create payment order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data) => api.payments.createPaymentOrder(data),
    onSuccess: async (data) => {
      await handleRazorpayPayment(data);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to create payment order');
      setIsProcessing(false);
      toast.error('Failed to initiate payment');
    }
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: (data) => api.payments.verifyPayment(data),
    onSuccess: () => {
      toast.success('Payment completed successfully! 🎉');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsProcessing(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Payment verification failed');
      setIsProcessing(false);
      toast.error('Payment verification failed');
    }
  });

  // Handle Razorpay payment
  const handleRazorpayPayment = async (orderData) => {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError('Failed to load Razorpay. Please check your internet connection.');
      setIsProcessing(false);
      return;
    }

    // Razorpay payment options
    const options = {
      key: orderData.key, // Razorpay Key ID from backend
      amount: orderData.amount, // Amount in paise
      currency: orderData.currency,
      name: 'Fixify',
      description: `Payment for: ${orderData.jobTitle}`,
      order_id: orderData.orderId,
      prefill: {
        name: job.creator?.firstName + ' ' + job.creator?.lastName,
        email: job.creator?.email || '',
      },
      notes: {
        jobId: job._id,
        helperName: orderData.helperName
      },
      theme: {
        color: '#3B82F6' // Blue color
      },
      // Payment method preference
      method: selectedMethod,
      handler: function (response) {
        // Payment successful - verify on backend
        verifyPaymentMutation.mutate({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          paymentMethod: selectedMethod
        });
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
          toast.error('Payment cancelled');
        }
      }
    };

    // Open Razorpay payment modal
    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      setError(response.error.description);
      setIsProcessing(false);
      toast.error('Payment failed: ' + response.error.description);
    });
    razorpay.open();
  };

  // Get the payment amount from job budget
  const getPaymentAmount = () => {
    // If budget is an object with min/max, use max value
    // Otherwise use the budget directly
    if (job.budget && typeof job.budget === 'object') {
      return job.budget.max || job.budget.min || 0;
    }
    return job.budget || 0;
  };

  const paymentAmount = getPaymentAmount();

  // Handle payment submission
  const handlePayment = async () => {
    setError(null);
    setIsProcessing(true);

    // Create payment order
    createOrderMutation.mutate({
      jobId: job._id,
      amount: paymentAmount,
      currency: 'INR'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Make Payment
        </Card.Title>
        <Card.Description>
          Pay for job: {job.title}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Payment Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Job Amount:</span>
                <span className="font-medium">{formatAmount(paymentAmount)}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Platform Fee:</span>
                <span className="font-medium">₹0 (Free!)</span>
              </div>
              <div className="flex justify-between border-t pt-2 border-gray-300 dark:border-gray-600">
                <span className="text-gray-900 dark:text-white font-medium">Helper Receives:</span>
                <span className="font-bold text-lg text-green-600">{formatAmount(paymentAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-900 dark:text-white font-bold text-lg">You Pay:</span>
                <span className="font-bold text-xl text-blue-600">{formatAmount(paymentAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      ${selectedMethod === method.id ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}
                    `}>
                      {method.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {method.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {method.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Test Mode Info */}
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-700 dark:text-yellow-300 text-sm">
              <strong>Test Mode:</strong> No real money will be charged. Use test credentials.
            </span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-3 text-lg"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-5 w-5" />
                Pay {formatAmount(paymentAmount)}
              </>
            )}
          </Button>

          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>100% to Helper</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CreditCard className="h-4 w-4 text-green-500" />
              <span>All Methods</span>
            </div>
          </div>

          {/* Test Payment Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
            <h5 className="font-medium text-gray-900 dark:text-white">Test Payment Details:</h5>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• <strong>UPI:</strong> Use success@razorpay or failure@razorpay</li>
              <li>• <strong>Card:</strong> 4111 1111 1111 1111, CVV: 123, Any future date</li>
              <li>• <strong>Wallet:</strong> Select any wallet and use test OTP: 0000</li>
            </ul>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};

export default PaymentForm;
