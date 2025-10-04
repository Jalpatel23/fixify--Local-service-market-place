import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Briefcase, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  MapPin,
  DollarSign,
  Calendar
} from 'lucide-react';
import { apiService } from '../../services/api';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import LoadingSpinner from '../UI/LoadingSpinner';
import EmptyState from '../UI/EmptyState';
import toast from 'react-hot-toast';

const JobModeration = () => {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    page: 1
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminJobs', filters],
    queryFn: () => apiService.admin.getJobsForModeration(filters),
    placeholderData: (prev) => prev,
    staleTime: 30000
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, data }) => apiService.admin.updateJobStatus(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
      toast.success('Job status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update job status');
    }
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleJobAction = (jobId, status, reason = '') => {
    updateJobMutation.mutate({
      jobId,
      data: { status, reason }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Briefcase className="h-12 w-12" />}
        title="Error loading jobs"
        description="There was an error loading the job list. Please try again."
      />
    );
  }

  const { data: jobs, pagination } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          Job Moderation
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Review and manage job postings
        </p>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:border-secondary-600 dark:text-secondary-100"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:border-secondary-600 dark:text-secondary-100"
              >
                <option value="">All Categories</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="cleaning">Cleaning</option>
                <option value="gardening">Gardening</option>
                <option value="painting">Painting</option>
                <option value="carpentry">Carpentry</option>
                <option value="moving">Moving</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => setFilters({ status: '', category: '', page: 1 })}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Jobs List */}
      <Card>
        <Card.Header>
          <Card.Title>Jobs ({pagination?.total || 0})</Card.Title>
          <Card.Description>
            Showing {jobs?.length || 0} of {pagination?.total || 0} jobs
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {jobs?.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job._id} className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                          {job.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      
                      <p className="text-secondary-600 dark:text-secondary-400 mb-3">
                        {job.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-secondary-500" />
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">
                            {job.location?.address || 'Location not specified'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-secondary-500" />
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">
                            ${job.budget?.min} - ${job.budget?.max}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-secondary-500" />
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">
                            {new Date(job.preferredDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-secondary-600 dark:text-secondary-400">
                        <span>Posted by: {job.creator?.firstName} {job.creator?.lastName}</span>
                        {job.assignedTo && (
                          <span>Assigned to: {job.assignedTo?.firstName} {job.assignedTo?.lastName}</span>
                        )}
                        <span>Category: {job.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/jobs/${job._id}`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {job.status === 'open' && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleJobAction(job._id, 'accepted')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="error"
                            onClick={() => handleJobAction(job._id, 'cancelled', 'Moderated')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {job.status === 'accepted' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleJobAction(job._id, 'in_progress')}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {job.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleJobAction(job._id, 'completed')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Briefcase className="h-12 w-12" />}
              title="No jobs found"
              description="No jobs match the current filters."
            />
          )}
        </Card.Content>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-secondary-600 dark:text-secondary-400">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobModeration; 