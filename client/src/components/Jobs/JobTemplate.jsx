import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Star,
  Clock,
  MapPin,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Modal } from '../UI/Modal';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { EmptyState } from '../UI/EmptyState';

const JobTemplate = ({ onUseTemplate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    budget: '',
    requirements: '',
    location: '',
    isPublic: false
  });
  const queryClient = useQueryClient();

  // Fetch user's job templates
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['jobTemplates'],
    queryFn: () => api.jobs.getTemplates(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data) => api.jobs.createTemplate(data),
    onSuccess: () => {
      toast.success('Template created successfully');
      queryClient.invalidateQueries({ queryKey: ['jobTemplates'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create template');
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => api.jobs.updateTemplate(id, data),
    onSuccess: () => {
      toast.success('Template updated successfully');
      queryClient.invalidateQueries({ queryKey: ['jobTemplates'] });
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update template');
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => api.jobs.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['jobTemplates'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  });

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      budget: '',
      requirements: '',
      location: '',
      isPublic: false
    });
  };

  const handleCreateTemplate = () => {
    createTemplateMutation.mutate(templateForm);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    updateTemplateMutation.mutate({ id: editingTemplate._id, data: templateForm });
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      budget: template.budget,
      requirements: template.requirements,
      location: template.location,
      isPublic: template.isPublic
    });
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleUseTemplate = (template) => {
    onUseTemplate(template);
  };

  const TemplateForm = () => (
    <Modal
      isOpen={showCreateModal}
      onClose={() => {
        setShowCreateModal(false);
        setEditingTemplate(null);
        resetForm();
      }}
      title={editingTemplate ? 'Edit Template' : 'Create Job Template'}
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Template Name
          </label>
          <Input
            type="text"
            value={templateForm.name}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Weekly House Cleaning"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={templateForm.description}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this template is for..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={templateForm.category}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select Category</option>
              <option value="cleaning">Cleaning</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="landscaping">Landscaping</option>
              <option value="painting">Painting</option>
              <option value="moving">Moving</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget
            </label>
            <Input
              type="number"
              value={templateForm.budget}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, budget: e.target.value }))}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Requirements
          </label>
          <textarea
            value={templateForm.requirements}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, requirements: e.target.value }))}
            placeholder="List any specific requirements..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Default Location
          </label>
          <Input
            type="text"
            value={templateForm.location}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Enter default location"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={templateForm.isPublic}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
            Make this template public (visible to other users)
          </label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
            disabled={!templateForm.name || !templateForm.category}
            className="flex-1"
          >
            {editingTemplate ? 'Update Template' : 'Create Template'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              setEditingTemplate(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">Error loading templates</div>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Job Templates
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create and manage reusable job templates
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Create Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : templates?.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No Templates Yet"
          description="Create your first job template to save time on recurring jobs."
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              Create Template
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => (
            <Card key={template._id}>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title className="flex items-center gap-2">
                    {template.isPublic && <Star size={16} className="text-yellow-500" />}
                    {template.name}
                  </Card.Title>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template._id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {template.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium capitalize">{template.category}</span>
                  </div>
                  {template.budget && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={14} className="text-gray-400" />
                      <span className="text-gray-500">Budget:</span>
                      <span className="font-medium">${template.budget}</span>
                    </div>
                  )}
                  {template.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{template.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1"
                    size="sm"
                  >
                    <Copy size={14} className="mr-2" />
                    Use Template
                  </Button>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      <TemplateForm />
    </div>
  );
};

export default JobTemplate; 