import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Users,
  X,
  Plus,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ConfirmModal from '../components/UI/ConfirmModal';
import Card from '../components/UI/Card';
import JobForm from '../components/Jobs/JobForm';
import toast from 'react-hot-toast';

const MyJobsPage = () => {
  const { user, isLoaded, isSignedIn, tokenReady } = useAuth();
  const queryClient = useQueryClient();
  const [editingJob, setEditingJob] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, action: null, job: null });

  // Fetch user's jobs
  const { data: myJobs = [], isLoading, error } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: async () => {
      try {
        const response = await apiService.jobs.myJobs();
        const jobs = response.data?.data || response.data || response || [];
        return Array.isArray(jobs) ? jobs : [];
      } catch (error) {
        console.error('Failed to fetch my jobs:', error);
        return [];
      }
    },
    enabled: !!user && isLoaded && isSignedIn && tokenReady
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.jobs.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job updated successfully');
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      setShowEditForm(false);
      setEditingJob(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update job');
    }
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.jobs.delete(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete job');
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200';
      case 'accepted':
      case 'in_progress':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  const formatBudget = (job) => {
    if (typeof job.budget === 'number') {
      return `$${job.budget}`;
    } else if (job.minBudget && job.maxBudget) {
      return `$${job.minBudget} - $${job.maxBudget}`;
    } else if (job.minBudget) {
      return `$${job.minBudget}+`;
    }
    return 'Budget not specified';
  };

  const formatLocation = (location) => {
    if (!location) return 'Remote';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location.address) {
      if (typeof location.address === 'object' && location.address.street) {
        const { street, city, state, zipCode, country } = location.address;
        return `${street}, ${city}, ${state} ${zipCode}, ${country}`;
      }
      if (typeof location.address === 'string') {
        return location.address;
      }
    }
    return 'Remote';
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowEditForm(true);
  };

  const handleDeleteJob = (job) => {
    setConfirmState({ open: true, action: 'delete', job });
  };

  const handleUpdateJob = (data) => {
    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob._id, data });
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingJob(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Error Loading Jobs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Failed to load your jobs. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">📋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                My Jobs
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1.5">
                Manage and track your job postings
              </p>
            </div>
          </div>
          <Link
            to="/post-job"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Job
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { icon: Users, label: 'Total Jobs', value: myJobs.length, color: 'from-blue-500 to-blue-600' },
            { icon: Clock, label: 'Open', value: myJobs.filter(job => job.status === 'open').length, color: 'from-green-500 to-green-600' },
            { icon: Users, label: 'In Progress', value: myJobs.filter(job => job.status === 'accepted' || job.status === 'in_progress').length, color: 'from-amber-500 to-amber-600' },
            { icon: CheckCircle, label: 'Completed', value: myJobs.filter(job => job.status === 'completed').length, color: 'from-emerald-500 to-emerald-600' }
          ].map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Jobs List */}
        {myJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-800/50">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No jobs posted yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start by posting your first job to find skilled professionals.
            </p>
            <Link
              to="/post-job"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300"
            >
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myJobs.map((job) => (
              <div key={job._id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-800/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {formatBudget(job)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    {formatLocation(job.location)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
                    <button 
                      onClick={() => handleEditJob(job)}
                      disabled={job.status === 'in_progress' || job.status === 'completed'}
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={job.status === 'in_progress' || job.status === 'completed' ? 'Cannot edit jobs that are in progress or completed' : 'Edit job'}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteJob(job)}
                      disabled={deleteJobMutation.isLoading || job.status === 'in_progress' || job.status === 'completed'}
                      className="flex items-center text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={job.status === 'in_progress' || job.status === 'completed' ? 'Cannot delete jobs that are in progress or completed' : 'Delete job'}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deleteJobMutation.isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  {job.assignedTo && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Assigned to {job.assignedTo.firstName} {job.assignedTo.lastName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Job Modal */}
        {showEditForm && editingJob && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-gray-100/20 dark:border-gray-800/20">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Edit className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                        Edit Job
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {editingJob.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-blue-100">
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                  <span>Editing job details</span>
                  <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                  <span>Review changes</span>
                  <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                  <span>Save updates</span>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
                <JobForm
                  job={editingJob}
                  onSubmit={handleUpdateJob}
                  onCancel={handleCancelEdit}
                  loading={updateJobMutation.isLoading}
                />
              </div>
              
              {/* Modal Footer */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span>Last updated: {new Date(editingJob.updatedAt || editingJob.createdAt).toLocaleDateString()}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(editingJob.status)}`}>
                      {editingJob.status.toUpperCase()}
                    </span></span>
                  </div>
                  <span>Job ID: {editingJob._id.slice(-8)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.action === 'delete' ? 'Delete this job?' : 'Confirm action'}
        description={confirmState.action === 'delete' ? `"${confirmState.job?.title}" will be permanently deleted. This cannot be undone.` : 'Please confirm your action.'}
        confirmText={confirmState.action === 'delete' ? 'Delete' : 'Confirm'}
        tone={confirmState.action === 'delete' ? 'danger' : 'primary'}
        loading={deleteJobMutation.isLoading}
        onCancel={() => setConfirmState({ open: false, action: null, job: null })}
        onConfirm={() => {
          if (confirmState.action === 'delete' && confirmState.job) {
            deleteJobMutation.mutate(confirmState.job._id, {
              onSettled: () => setConfirmState({ open: false, action: null, job: null })
            });
          } else {
            setConfirmState({ open: false, action: null, job: null });
          }
        }}
      />
    </div>
  );
};

export default MyJobsPage;
