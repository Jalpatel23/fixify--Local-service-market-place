import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import JobForm from '../components/Jobs/JobForm';

const PostJobPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { getToken } = useClerkAuth();

  const createJobMutation = useMutation({
    mutationFn: async (jobData) => {
      console.log('Posting job with data:', jobData);

      try {
        // Get authentication token
        const token = await getToken();
        console.log('Got auth token:', token ? 'Yes' : 'No');

        // Try direct fetch first to test server connectivity
        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const directResponse = await fetch('http://localhost:5000/api/jobs', {
          method: 'POST',
          headers,
          body: JSON.stringify(jobData)
        });

        console.log('Direct fetch response status:', directResponse.status);

        if (directResponse.ok) {
          const directData = await directResponse.json();
          console.log('Direct fetch success:', directData);
          return directData.data || directData;
        } else {
          const errorText = await directResponse.text();
          console.error('Direct fetch failed:', directResponse.status, errorText);
          throw new Error(`Server error: ${directResponse.status} - ${errorText}`);
        }
      } catch (fetchError) {
        console.error('Direct fetch error:', fetchError);

        // Fallback to apiService
        try {
          const response = await apiService.jobs.create(jobData);
          console.log('API service success:', response);
          return response.data || response;
        } catch (apiError) {
          console.error('API service error:', apiError);
          throw apiError;
        }
      }
    },
    onSuccess: (data) => {
      console.log('Job creation successful:', data);
      toast.success('Job posted successfully!');
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['my-jobs']);

      // Navigate to dashboard if no job ID, otherwise to job detail
      if (data?._id) {
        navigate(`/jobs/${data._id}`);
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      console.error('Job creation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to post job';
      toast.error(errorMessage);
    }
  });

  const handleSubmit = async (formData) => {
    console.log('PostJobPage - Form submission started');
    console.log('PostJobPage - Received form data:', formData);
    console.log('PostJobPage - Requirements:', formData.requirements);
    console.log('PostJobPage - Location:', formData.location);
    console.log('PostJobPage - Budget:', formData.budget);

    // The JobForm component already handles all the data formatting
    // so we can directly submit the formData
    createJobMutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
            Post a New Job
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Describe your project and find the right professional for the job.
          </p>
        </div>

        {/* Use the enhanced JobForm component */}
        <JobForm
          job={null} // No existing job for creation
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={createJobMutation.isLoading}
        />
      </div>
    </div>
  );
};

export default PostJobPage;