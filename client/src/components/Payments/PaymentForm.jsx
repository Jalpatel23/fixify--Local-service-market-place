import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';

// Load Stripe
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentFormContent = ({ job, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: (data) => api.payments.createPaymentIntent(data),
    onSuccess: (data) => {
      handlePayment(data);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to create payment');
      setIsProcessing(false);
    }
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: (data) => api.payments.confirmPayment(data.paymentId, data),
    onSuccess: () => {
      toast.success('Payment completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onSuccess();
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Payment failed');
      setIsProcessing(false);
    }
  });

  const handlePayment = async (paymentData) => {
    if (!stripe || !elements) {
      setError('Stripe not loaded');
      setIsProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      paymentData.clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: job.creator?.firstName + ' ' + job.creator?.lastName,
          },
        }
      }
    );

    if (stripeError) {
      setError(stripeError.message);
      setIsProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      confirmPaymentMutation.mutate({
        paymentId: paymentData.paymentId,
        paymentIntentId: paymentIntent.id
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    createPaymentIntentMutation.mutate({
      jobId: job._id,
      amount: job.budget * 100, // Convert to cents
      currency: 'usd'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const platformFee = Math.round(job.budget * 0.05);
  const helperAmount = job.budget - platformFee;

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </Card.Title>
        <Card.Description>
          Secure payment for job: {job.title}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Payment Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Job Amount:</span>
                <span className="font-medium">{formatAmount(job.budget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Platform Fee (5%):</span>
                <span className="font-medium text-red-600">{formatAmount(platformFee)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-900 dark:text-white font-medium">Total:</span>
                <span className="font-bold text-lg">{formatAmount(job.budget)}</span>
              </div>
            </div>
          </div>

          {/* Card Element */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Card Information
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Security Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" />
                Processing Payment...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                Pay {formatAmount(job.budget)}
              </>
            )}
          </Button>

          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Escrow Protection</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Lock className="h-4 w-4 text-green-500" />
              <span>SSL Encrypted</span>
            </div>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
};

const PaymentForm = ({ job, onSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent job={job} onSuccess={onSuccess} />
    </Elements>
  );
};

export default PaymentForm; 