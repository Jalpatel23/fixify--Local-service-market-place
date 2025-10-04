import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Clock,
  DollarSign,
  User,
  Calendar,
  Star,
  MessageCircle,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Eye,
  Users,
  Tag,
  Shield,
  Award,
  CalendarDays,
  Clock3,
  Building2,
  Map,
  FileText,
  AlertTriangle,
  Heart,
  Share2,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ConfirmationModal from '../components/UI/ConfirmationModal';
import AuthPrompt from '../components/Auth/AuthPrompt';
import toast from 'react-hot-toast';
import MapComponent from '../components/Map/Map';
import { jobCategories, experienceLevels } from '../utils/config';
import { calculateDistance } from '../utils/mapUtils';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const { getToken, isSignedIn } = useClerkAuth();

  // Modal states
  const [confirmModal, setConfirmModal] = React.useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    action: null
  });

  // Local loading states for immediate feedback
  const [localLoading, setLocalLoading] = React.useState({
    accept: false,
    complete: false,
    cancel: false,
    reopen: false,
    save: false
  });

  // User location state
  const [userLocation, setUserLocation] = React.useState(null);
  const [locationLoading, setLocationLoading] = React.useState(false);

  // Get user location
  const getLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationLoading(false);
          toast.success('Location found! Distance calculated.');
        },
        (error) => {
          toast.error('Location access denied or unavailable.');
          setLocationLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
      setLocationLoading(false);
    }
  };

  // Fetch job details
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      console.log('Fetching job details for ID:', id);

      try {
        const headers = {
          'Content-Type': 'application/json'
        };

        // Only try to get token if user is signed in
        if (isSignedIn) {
          try {
            const token = await getToken();
            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }
          } catch (tokenError) {
            console.log('Token not available, proceeding without authentication');
          }
        }

        const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
          headers
        });

        console.log('Job detail response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Job detail data:', data);
          return data.data || data;
        } else {
          const errorText = await response.text();
          console.error('Job detail fetch failed:', response.status, errorText);
          throw new Error(`Failed to fetch job: ${response.status}`);
        }
      } catch (error) {
        console.error('Job detail error:', error);
        throw error;
      }
    },
    retry: 1
  });

  // Accept job mutation
  const acceptJobMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const response = await fetch(`http://localhost:5000/api/jobs/${id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept job');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Job accepted successfully!');
      queryClient.invalidateQueries(['job', id]);
      queryClient.invalidateQueries(['jobs']);
      setConfirmModal({ isOpen: false, type: 'warning', title: '', message: '', action: null });
      setLocalLoading(prev => ({ ...prev, accept: false }));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to accept job');
      setConfirmModal({ isOpen: false, type: 'warning', title: '', message: '', action: null });
      setLocalLoading(prev => ({ ...prev, accept: false }));
    }
  });

  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.jobs.complete(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job marked as completed!');
      queryClient.invalidateQueries(['job', id]);
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['my-jobs']);
      setConfirmModal({ isOpen: false, type: 'warning', title: '', message: '', action: null });
      setLocalLoading(prev => ({ ...prev, complete: false }));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to complete job');
      setConfirmModal({ isOpen: false, type: 'warning', title: '', message: '', action: null });
      setLocalLoading(prev => ({ ...prev, complete: false }));
    }
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async (reason) => {
      const response = await apiService.jobs.cancel(id, { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job cancelled successfully!');
      queryClient.invalidateQueries(['job', id]);
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['my-jobs']);
      setConfirmModal({ isOpen: false, type: 'warning', title: '', message: '', action: null });
      setLocalLoading(prev => ({ ...prev, cancel: false }));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel job');
      setConfirmModal({ isOpen: false, type: 'warning', title: '', message: '', action: null });
      setLocalLoading(prev => ({ ...prev, cancel: false }));
    }
  });

  // Reopen job mutation
  const reopenJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.jobs.reopen(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job reopened successfully!');
      queryClient.invalidateQueries(['job', id]);
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['my-jobs']);
      setConfirmModal({ isOpen: false, type: 'warning', title: '', message: '', action: null });
      setLocalLoading(prev => ({ ...prev, reopen: false }));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reopen job');
      setConfirmModal({ isOpen: false, type: 'warning', title: '', message: '', action: null });
      setLocalLoading(prev => ({ ...prev, reopen: false }));
    }
  });

  // Save job mutation
  const saveJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.jobs.save(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job saved successfully!');
      queryClient.invalidateQueries(['job', id]);
      setLocalLoading(prev => ({ ...prev, save: false }));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save job');
      setLocalLoading(prev => ({ ...prev, save: false }));
    }
  });

  // Helper functions
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatBudget = (min, max) => {
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
      case 'accepted': return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
      case 'in_progress': return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200';
      case 'completed': return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200';
      case 'cancelled': return 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200';
      default: return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200';
    }
  };

  const getCategoryInfo = (category) => {
    return jobCategories.find(c => c.value === category) || { label: category, icon: '📋' };
  };

  const getExperienceLevelInfo = (level) => {
    return experienceLevels.find(e => e.value === level) || { label: level };
  };

  const canAcceptJob = () => {
    const userId = profile?.data?.data?._id;
    return job &&
           job.status === 'open' &&
           userId &&
           job.creator?._id !== userId;
  };

  const canCompleteJob = () => {
    const userId = profile?.data?.data?._id;
    return job &&
           (job.status === 'accepted' || job.status === 'in_progress') &&
           userId &&
           job.creator?._id === userId;
  };

  const canCancelJob = () => {
    const userId = profile?.data?.data?._id;
    return job &&
           (job.status === 'accepted' || job.status === 'in_progress') &&
           userId &&
           job.assignedTo?._id === userId;
  };

  const canReopenJob = () => {
    const userId = profile?.data?.data?._id;
    return job &&
           (job.status === 'accepted' || job.status === 'in_progress') &&
           userId &&
           job.creator?._id === userId;
  };

  // Check if job is saved by current user
  const isJobSaved = () => {
    const userId = profile?.data?.data?._id;
    return job?.stats?.savedBy?.includes(userId) || false;
  };

  // Check if user can save this job (not their own job)
  const canSaveJob = () => {
    const userId = profile?.data?.data?._id;
    return job && userId && job.creator?._id !== userId;
  };

  // Modal helper functions
  const showAcceptConfirmation = () => {
    setConfirmModal({
      isOpen: true,
      type: 'success',
      title: 'Accept Job',
      message: `Are you sure you want to accept "${job.title}"? You will be responsible for completing this job.`,
      action: () => {
        setLocalLoading(prev => ({ ...prev, accept: true }));
        acceptJobMutation.mutate();
      }
    });
  };

  const showCompleteConfirmation = () => {
    setConfirmModal({
      isOpen: true,
      type: 'success',
      title: 'Mark as Complete',
      message: `Are you sure you want to mark "${job.title}" as completed? This action cannot be undone and will finalize the job.`,
      action: () => {
        setLocalLoading(prev => ({ ...prev, complete: true }));
        completeJobMutation.mutate();
      }
    });
  };

  const showCancelConfirmation = () => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Cancel Job',
      message: `Are you sure you want to cancel your acceptance of "${job.title}"? The job will become available for others to accept.`,
      action: () => {
        setLocalLoading(prev => ({ ...prev, cancel: true }));
        cancelJobMutation.mutate('User cancelled acceptance');
      }
    });
  };

  const showReopenConfirmation = () => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Reopen Job',
      message: `Are you sure you want to reopen "${job.title}"? This will remove the current assignee and make the job available for others to accept.`,
      action: () => {
        setLocalLoading(prev => ({ ...prev, reopen: true }));
        reopenJobMutation.mutate();
      }
    });
  };

  const handleSaveJob = () => {
    setLocalLoading(prev => ({ ...prev, save: true }));
    saveJobMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              Job Not Found
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/browse"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(job.category);
  const experienceInfo = getExperienceLevelInfo(job.requirements?.experience);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
                      {job.title}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                      {job.status ? job.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                    </span>
                    {job.isUrgent && (
                      <span className="px-2 py-1 bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200 rounded-full text-xs font-medium flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        URGENT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Posted {formatDate(job.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {job.stats?.views || 0} views
                    </div>
                    {profile?.data?.data?._id && job.creator?._id === profile.data.data._id && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">
                        YOUR JOB
                      </span>
                    )}
                  </div>

                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      <span className="mr-1">{categoryInfo.icon}</span> {categoryInfo.label}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {formatBudget(job.budget?.min, job.budget?.max)}
                  </div>
                  {job.budget?.isNegotiable && (
                    <div className="text-sm text-secondary-500 dark:text-secondary-400">
                      Negotiable
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <AuthPrompt requireAuth={true} promptMessage="Please sign in to accept this job">
                  {canAcceptJob() && (
                    <button
                      onClick={showAcceptConfirmation}
                      disabled={acceptJobMutation.isLoading || localLoading.accept}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium"
                    >
                      {(acceptJobMutation.isLoading || localLoading.accept) && (
                        <div className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {(acceptJobMutation.isLoading || localLoading.accept) ? 'Accepting...' : 'Accept Job'}
                    </button>
                  )}
                </AuthPrompt>

                {canCompleteJob() && (
                  <button
                    onClick={showCompleteConfirmation}
                    disabled={completeJobMutation.isLoading || localLoading.complete}
                    className="px-6 py-3 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium"
                  >
                    {(completeJobMutation.isLoading || localLoading.complete) && (
                      <div className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {(completeJobMutation.isLoading || localLoading.complete) ? 'Completing...' : 'Mark as Complete'}
                  </button>
                )}

                {canCancelJob() && (
                  <button
                    onClick={showCancelConfirmation}
                    disabled={cancelJobMutation.isLoading || localLoading.cancel}
                    className="px-6 py-3 bg-error-600 text-white rounded-lg hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium"
                  >
                    {(cancelJobMutation.isLoading || localLoading.cancel) && (
                      <div className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {(cancelJobMutation.isLoading || localLoading.cancel) ? 'Cancelling...' : 'Cancel Acceptance'}
                  </button>
                )}

                {canReopenJob() && (
                  <button
                    onClick={showReopenConfirmation}
                    disabled={reopenJobMutation.isLoading || localLoading.reopen}
                    className="px-6 py-3 bg-warning-600 text-white rounded-lg hover:bg-warning-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium"
                  >
                    {(reopenJobMutation.isLoading || localLoading.reopen) && (
                      <div className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {(reopenJobMutation.isLoading || localLoading.reopen) ? 'Reopening...' : 'Reopen Job'}
                  </button>
                )}

                <AuthPrompt requireAuth={true} promptMessage="Please sign in to save this job">
                  {canSaveJob() && (
                    <button
                      onClick={handleSaveJob}
                      disabled={saveJobMutation.isLoading || localLoading.save}
                      className={`px-4 py-3 border transition-colors flex items-center ${
                        isJobSaved() 
                          ? 'border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20' 
                          : 'border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                      } rounded-lg`}
                    >
                      {(saveJobMutation.isLoading || localLoading.save) && (
                        <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <Bookmark className={`w-4 h-4 mr-2 ${isJobSaved() ? 'fill-current' : ''}`} />
                      {(saveJobMutation.isLoading || localLoading.save) 
                        ? (isJobSaved() ? 'Removing...' : 'Saving...') 
                        : (isJobSaved() ? 'Saved' : 'Save Job')
                      }
                    </button>
                  )}
                </AuthPrompt>

                <AuthPrompt requireAuth={true} promptMessage="Please sign in to message the job creator">
                  {job.creator && profile?.data?.data?._id !== job.creator._id && (
                    <Link
                      to={`/messages?user=${job.creator._id}`}
                      className="inline-flex items-center px-4 py-3 border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Link>
                  )}
                </AuthPrompt>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Job Description
              </h2>
              <div className="prose prose-secondary dark:prose-invert max-w-none">
                <p className="text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Requirements & Preferences
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Experience Level
                    </h3>
                    <div className="text-secondary-600 dark:text-secondary-400 capitalize">
                      {experienceInfo.label}
                    </div>
                  </div>

                  {job.requirements?.skills && job.requirements.skills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
                        <Tag className="w-4 h-4 mr-2" />
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    {job.requirements?.verifiedOnly && (
                      <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-success-500" />
                        Verified professionals only
                      </div>
                    )}

                    {job.requirements?.backgroundCheck && (
                      <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-success-500" />
                        Background check required
                      </div>
                    )}
                  </div>

                  {job.requirements?.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Additional Requirements
                      </h3>
                      <div className="text-secondary-600 dark:text-secondary-400 whitespace-pre-wrap text-sm">
                        {job.requirements.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location & Timing */}
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location & Timing
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {job.location?.address && (
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        Address
                      </h3>
                      <div className="text-secondary-600 dark:text-secondary-400">
                        {job.location.address.street && (
                          <div>{job.location.address.street}</div>
                        )}
                        <div>
                          {job.location.address.city && `${job.location.address.city}, `}
                          {job.location.address.state} {job.location.address.zipCode}
                        </div>
                        {job.location.address.country && job.location.address.country !== 'US' && (
                          <div>{job.location.address.country}</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Preferred Date
                    </h3>
                    <div className="text-secondary-600 dark:text-secondary-400">
                      {job.preferredDate ? formatDate(job.preferredDate) : 'Flexible'}
                    </div>
                  </div>

                  {/* Distance from user */}
                  {userLocation && job.location?.coordinates && (
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Distance from you
                      </h3>
                      <div className="text-primary-600 dark:text-primary-400 font-medium">
                        {(() => {
                          const distKm = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            job.location.coordinates[1],
                            job.location.coordinates[0]
                          );
                          return `${distKm.toFixed(1)} km`;
                        })()}
                      </div>
                    </div>
                  )}

                  {job.preferredTime && (
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
                        <Clock3 className="w-4 h-4 mr-2" />
                        Preferred Time
                      </h3>
                      <div className="text-secondary-600 dark:text-secondary-400">
                        {formatTime(job.preferredTime.start)} - {formatTime(job.preferredTime.end)}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {job.location?.coordinates && Array.isArray(job.location.coordinates) && job.location.coordinates.length === 2 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 flex items-center">
                          <Map className="w-4 h-4 mr-2" />
                          Location Map
                        </h3>
                        {!userLocation && (
                          <button
                            onClick={getLocation}
                            disabled={locationLoading}
                            className="px-3 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                          >
                            {locationLoading ? (
                              <div className="inline-block w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <MapPin className="w-3 h-3 mr-1" />
                            )}
                            {locationLoading ? 'Getting...' : 'Find Distance'}
                          </button>
                        )}
                      </div>
                      {(() => {
                        const coords = job.location?.coordinates;
                        const marker = coords && coords.length === 2 ? [{ lat: coords[1], lng: coords[0], title: job.title }] : [];
                        console.log('JobDetailPage Map markers:', coords, marker);
                        return null;
                      })()}
                      <MapComponent
                        center={{ lat: job.location.coordinates[1], lng: job.location.coordinates[0] }}
                        zoom={15}
                        markers={[{ lat: job.location.coordinates[1], lng: job.location.coordinates[0], title: job.title }]}
                        height="250px"
                        className="rounded-lg border border-secondary-200 dark:border-secondary-700"
                      />
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${job.location.coordinates[1]},${job.location.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 mt-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Get Directions
                      </a>
                    </div>
                  ) : (
                    <div className="text-secondary-500 dark:text-secondary-400 text-center py-8">
                      <Map className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No map location available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Statistics */}
            {job.stats && (
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Job Statistics
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {job.stats.views || 0}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {job.stats.savedBy?.length || 0}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {userLocation && job.location?.coordinates ? (
                        (() => {
                          const distKm = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            job.location.coordinates[1],
                            job.location.coordinates[0]
                          );
                          return distKm.toFixed(1);
                        })()
                      ) : (
                        job.maxDistance || 0
                      )}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      {userLocation ? 'Distance from you (km)' : 'Max Distance (km)'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Creator */}
            {job.creator && (
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Posted By
                </h3>

                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                    {job.creator.profileImage ? (
                      <img
                        src={job.creator.profileImage}
                        alt={`${job.creator.firstName} ${job.creator.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary-600 dark:text-primary-400 font-medium text-lg">
                        {job.creator.firstName?.[0]}{job.creator.lastName?.[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 truncate">
                      {job.creator.firstName} {job.creator.lastName}
                    </h4>

                    {/* {job.creator.rating && (
                      <div className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-warning-500 mr-1" />
                        <span className="text-sm text-secondary-600 dark:text-secondary-400">
                          {job.creator.rating.average?.toFixed(1)} ({job.creator.rating.totalReviews} reviews)
                        </span>
                      </div>
                    )} */}

                    <div className="flex items-center space-x-3 mt-3">
                      <AuthPrompt requireAuth={true} promptMessage="Please sign in to message this user">
                        {profile?.data?.data?._id !== job.creator._id && (
                          <Link
                            to={`/messages?user=${job.creator._id}`}
                            className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Message
                          </Link>
                        )}
                      </AuthPrompt>

                      {job.creator.email && (
                        <a
                          href={`mailto:${job.creator.email}`}
                          className="inline-flex items-center text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Assigned To */}
            {job.assignedTo && (
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-success-500" />
                  Assigned To
                </h3>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center">
                    {job.assignedTo.profileImage ? (
                      <img
                        src={job.assignedTo.profileImage}
                        alt={`${job.assignedTo.firstName} ${job.assignedTo.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-success-600 dark:text-success-400 font-medium">
                        {job.assignedTo.firstName?.[0]}{job.assignedTo.lastName?.[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                      {job.assignedTo.firstName} {job.assignedTo.lastName}
                    </h4>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      Accepted {job.acceptedAt ? formatDate(job.acceptedAt) : 'recently'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Info */}
            {job.status === 'cancelled' && job.cancellationReason && (
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-error-500" />
                  Cancellation Details
                </h3>

                <div className="space-y-2">
                  <div className="text-sm text-secondary-600 dark:text-secondary-400">
                    <strong>Reason:</strong> {job.cancellationReason}
                  </div>
                  {job.cancelledAt && (
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      <strong>Cancelled:</strong> {formatDate(job.cancelledAt)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: 'warning', title: '', message: '', action: null })}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={
          confirmModal.type === 'success' ? 'Yes, Accept' :
          confirmModal.type === 'danger' ? 'Yes, Cancel' :
          confirmModal.type === 'warning' ? 'Yes, Reopen' :
          'Yes, Complete'
        }
        isLoading={
          acceptJobMutation.isLoading ||
          completeJobMutation.isLoading ||
          cancelJobMutation.isLoading ||
          reopenJobMutation.isLoading
        }
      />
    </div>
  );
};

export default JobDetailPage;
