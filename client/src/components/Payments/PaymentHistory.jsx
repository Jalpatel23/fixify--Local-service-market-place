import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { EmptyState } from '../UI/EmptyState';

const PaymentHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['user-payments', { search: searchQuery, status: statusFilter, page }],
    queryFn: () => api.payments.getUserPayments({ 
      search: searchQuery, 
      status: statusFilter, 
      page 
    }),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => api.payments.getPaymentStats(),
    staleTime: 5 * 60 * 1000
  });

  const formatAmount = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle className="h-4 w-4 text-green-500" />,
      pending: <Clock className="h-4 w-4 text-yellow-500" />,
      failed: <XCircle className="h-4 w-4 text-red-500" />,
      disputed: <AlertCircle className="h-4 w-4 text-orange-500" />,
      refunded: <XCircle className="h-4 w-4 text-gray-500" />
    };
    return icons[status] || <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'success',
      pending: 'warning',
      failed: 'error',
      disputed: 'warning',
      refunded: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const statusOptions = [
    { value: 'all', label: 'All Payments' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'disputed', label: 'Disputed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">Error loading payment history</div>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Payment History
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your payment transactions and escrow releases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {stats?.completed?.count || 0} successful payments
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.completed?.count || 0}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.pending?.count || 0}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatAmount(stats.completed?.totalAmount || 0)}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Disputed</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.disputed?.count || 0}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        <div className="flex gap-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Payments List */}
      {paymentsData?.payments?.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12" />}
          title="No Payments Found"
          description={searchQuery || statusFilter !== 'all' 
            ? "No payments match your current filters." 
            : "You haven't made any payments yet."
          }
        />
      ) : (
        <div className="space-y-4">
          {paymentsData?.payments?.map((payment) => (
            <Card key={payment._id}>
              <Card.Content className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(payment.status)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {payment.metadata?.jobTitle || 'Job Payment'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                        <span className="ml-2 font-medium">
                          {formatAmount(payment.amount, payment.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Date:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(payment.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <Badge 
                          variant={getStatusColor(payment.status)} 
                          size="sm" 
                          className="ml-2"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>

                    {payment.dispute?.isDisputed && (
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            Dispute Filed
                          </span>
                        </div>
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          {payment.dispute.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {payment.status === 'completed' && payment.escrow?.isEscrow && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Handle escrow release
                          console.log('Release escrow for payment:', payment.paymentId);
                        }}
                      >
                        Release Escrow
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {paymentsData?.pagination && paymentsData.pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {paymentsData.pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === paymentsData.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory; 