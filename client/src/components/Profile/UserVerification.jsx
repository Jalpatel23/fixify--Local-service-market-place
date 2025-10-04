import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload,
  Camera,
  FileText,
  AlertCircle,
  UserCheck,
  Award
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { Modal } from '../UI/Modal';
import { LoadingSpinner } from '../UI/LoadingSpinner';

const UserVerification = ({ user, onUpdate }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [verificationType, setVerificationType] = useState('id');
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [verificationNotes, setVerificationNotes] = useState('');
  const queryClient = useQueryClient();

  // Submit verification mutation
  const submitVerificationMutation = useMutation({
    mutationFn: (data) => api.auth.submitVerification(data),
    onSuccess: () => {
      toast.success('Verification submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      setShowUploadModal(false);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit verification');
    }
  });

  const verificationTypes = [
    {
      id: 'id',
      label: 'Government ID',
      description: 'Driver\'s license, passport, or national ID',
      icon: UserCheck,
      required: true
    },
    {
      id: 'address',
      label: 'Address Verification',
      description: 'Utility bill or bank statement',
      icon: FileText,
      required: true
    },
    {
      id: 'background',
      label: 'Background Check',
      description: 'Criminal background verification',
      icon: Shield,
      required: false
    },
    {
      id: 'skills',
      label: 'Skill Certifications',
      description: 'Professional licenses and certifications',
      icon: Award,
      required: false
    }
  ];

  const getVerificationStatus = (type) => {
    const verification = user?.verifications?.find(v => v.type === type);
    if (!verification) return 'not_submitted';
    return verification.status;
  };

  const getStatusBadge = (status) => {
    const variants = {
      approved: 'success',
      pending: 'warning',
      rejected: 'error',
      not_submitted: 'secondary'
    };
    const labels = {
      approved: 'Approved',
      pending: 'Pending Review',
      rejected: 'Rejected',
      not_submitted: 'Not Submitted'
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const handleFileUpload = (type, files) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: Array.from(files)
    }));
  };

  const handleSubmitVerification = () => {
    const formData = new FormData();
    formData.append('type', verificationType);
    formData.append('notes', verificationNotes);
    
    if (uploadedFiles[verificationType]) {
      uploadedFiles[verificationType].forEach((file, index) => {
        formData.append(`files`, file);
      });
    }

    submitVerificationMutation.mutate(formData);
  };

  const VerificationUploadModal = () => (
    <Modal
      isOpen={showUploadModal}
      onClose={() => setShowUploadModal(false)}
      title="Submit Verification"
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Verification Type
          </label>
          <select
            value={verificationType}
            onChange={(e) => setVerificationType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {verificationTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Upload Documents
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload(verificationType, e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500 font-medium">
                Click to upload
              </span>
              <span className="text-gray-500"> or drag and drop</span>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG, PDF up to 10MB each
            </p>
          </div>
          {uploadedFiles[verificationType] && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {uploadedFiles[verificationType].length} file(s) selected
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Additional Notes
          </label>
          <textarea
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="Any additional information..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSubmitVerification}
            disabled={!uploadedFiles[verificationType] || submitVerificationMutation.isLoading}
            className="flex-1"
          >
            {submitVerificationMutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Submitting...
              </>
            ) : (
              'Submit Verification'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowUploadModal(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Identity Verification
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verify your identity to build trust and unlock premium features
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2"
        >
          <Shield size={16} />
          Submit Verification
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {verificationTypes.map((type) => {
          const Icon = type.icon;
          const status = getVerificationStatus(type.id);
          const verification = user?.verifications?.find(v => v.type === type.id);
          
          return (
            <Card key={type.id}>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title className="flex items-center gap-2">
                    <Icon size={16} />
                    {type.label}
                    {type.required && (
                      <Badge variant="error" size="sm">Required</Badge>
                    )}
                  </Card.Title>
                  {getStatusBadge(status)}
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {type.description}
                </p>
                
                {verification && (
                  <div className="space-y-2">
                    {verification.submittedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Submitted: {new Date(verification.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {verification.reviewedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        {verification.status === 'approved' ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <XCircle size={14} className="text-red-500" />
                        )}
                        <span className="text-gray-600 dark:text-gray-400">
                          Reviewed: {new Date(verification.reviewedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {verification.notes && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Notes:</strong> {verification.notes}
                      </div>
                    )}
                  </div>
                )}

                {status === 'not_submitted' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVerificationType(type.id);
                      setShowUploadModal(true);
                    }}
                    className="mt-3"
                  >
                    Submit {type.label}
                  </Button>
                )}
              </Card.Content>
            </Card>
          );
        })}
      </div>

      {/* Verification Benefits */}
      <Card>
        <Card.Header>
          <Card.Title>Verification Benefits</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Shield className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Trust Badge</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verified users get a trust badge on their profile
              </p>
            </div>
            <div className="text-center">
              <Award className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Priority Listing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verified users appear higher in job search results
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Premium Features</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access to advanced features and higher job limits
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      <VerificationUploadModal />
    </div>
  );
};

export default UserVerification; 