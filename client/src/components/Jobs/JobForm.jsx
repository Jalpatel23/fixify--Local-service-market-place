import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, DollarSign, Calendar, Clock, FileText } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import LocationPicker from '../Map/LocationPicker';
import { jobCategories } from '../../utils/config';

const JobForm = ({
  job = null,
  onSubmit,
  onCancel,
  loading = false,
  className = '',
  ...props
}) => {

  const [selectedCategory, setSelectedCategory] = useState(job?.category || '');
  const [budgetType, setBudgetType] = useState(
    job?.budget?.type ||
    (job?.budget?.min !== undefined && job?.budget?.max !== undefined && job?.budget?.min !== job?.budget?.max ? 'range' : 'fixed') || 'fixed'
  );
  const [selectedLocation, setSelectedLocation] = useState(
    job?.location?.coordinates ? {
      lat: job.location.coordinates[1],
      lng: job.location.coordinates[0],
      address: job.location.address?.formatted || 
               (typeof job.location.address === 'object' && job.location.address.street ? 
                `${job.location.address.street}, ${job.location.address.city}, ${job.location.address.state} ${job.location.address.zipCode}, ${job.location.address.country}` :
                job.location.address)
    } : job?.location?.address ? {
      lat: 0,
      lng: 0,
      address: typeof job.location.address === 'object' && job.location.address.street ? 
               `${job.location.address.street}, ${job.location.address.city}, ${job.location.address.state} ${job.location.address.zipCode}, ${job.location.address.country}` :
               job.location.address
    } : null
  );
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      title: job?.title || '',
      description: job?.description || '',
      category: job?.category || '',
      budgetType: job?.budget?.type || (job?.budget?.min !== undefined && job?.budget?.max !== undefined && job?.budget?.min !== job?.budget?.max ? 'range' : 'fixed') || 'fixed',
      budgetMin: job?.budget?.min || job?.budget || '',
      budgetMax: job?.budget?.max || '',
      location: job?.location?.address?.formatted || (typeof job?.location?.address === 'string' ? job.location.address : '') || '',
      preferredDate: job?.preferredDate ? new Date(job.preferredDate).toISOString().split('T')[0] : '',
      preferredTimeStart: job?.preferredTime?.start || '',
      preferredTimeEnd: job?.preferredTime?.end || '',
      requirementsNotes: (job?.requirements?.notes && typeof job.requirements.notes === 'string') ? job.requirements.notes : '',
      maxDistance: job?.maxDistance || 40,
    },
  });
  
  const onSubmitForm = (data) => {
    // Parse requirements string into skills array
    let requirementsSkills = [];
    if (data.requirements && typeof data.requirements === 'string') {
      requirementsSkills = data.requirements.split(',')
        .map(r => r.trim())
        .filter(r => r && r.length > 0); // Filter out empty strings
    } else if (job?.requirements?.skills && Array.isArray(job.requirements.skills)) {
      requirementsSkills = job.requirements.skills.filter(skill => skill && skill.length > 0);
    }
    
    // Ensure we always have at least one skill (use category as fallback)
    if (requirementsSkills.length === 0 && selectedCategory) {
      requirementsSkills = [selectedCategory];
    }
    
    // Ensure all skills are valid enum values
    const validSkills = ['plumbing', 'electrical', 'carpentry', 'cleaning', 'gardening', 'painting', 'moving', 'repair', 'other'];
    requirementsSkills = requirementsSkills.filter(skill => validSkills.includes(skill));
    
    // If no valid skills remain, use category or 'other'
    if (requirementsSkills.length === 0) {
      requirementsSkills = [selectedCategory || 'other'];
    }

    // Format budget according to backend schema
    const budgetData = {
      min: parseInt(data.budgetMin) || 50,
      max: budgetType === 'range' ? (parseInt(data.budgetMax) || parseInt(data.budgetMin) || 50) : parseInt(data.budgetMin) || 50
    };
    
    // Ensure min <= max for validation
    if (budgetData.min > budgetData.max) {
      budgetData.max = budgetData.min;
    }
    
    // Ensure minimum values
    if (budgetData.min < 1) budgetData.min = 1;
    if (budgetData.max < 1) budgetData.max = 1;

    // Format location according to backend schema
    let locationData = null;
    if (selectedLocation) {
      locationData = {
        type: 'Point',
        coordinates: [selectedLocation.lng, selectedLocation.lat],
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        }
      };

      // Try to parse the address string into components
      if (selectedLocation.address && typeof selectedLocation.address === 'string') {
        const addressParts = selectedLocation.address.split(',').map(part => part.trim());
        if (addressParts.length >= 4) {
          locationData.address.street = addressParts[0];
          locationData.address.city = addressParts[1];
          locationData.address.state = addressParts[2];
          locationData.address.zipCode = addressParts[3];
          if (addressParts.length > 4) {
            locationData.address.country = addressParts[4];
          }
        } else {
          // If we can't parse it properly, store it as a formatted string
          locationData.address.street = selectedLocation.address;
        }
      }
    } else {
      // Set default location if none selected
      locationData = {
        type: 'Point',
        coordinates: [0, 0], // Default coordinates
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        }
      };
    }

    // Format preferredDate according to backend schema
    let preferredDateData = null;
    if (data.preferredDate) {
      preferredDateData = new Date(data.preferredDate);
    } else {
      // Set default date to tomorrow if none provided
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      preferredDateData = tomorrow;
    }

    // Format preferredTime according to backend schema
    let preferredTimeData = null;
    if (data.preferredTimeStart && data.preferredTimeEnd) {
      preferredTimeData = {
        start: data.preferredTimeStart,
        end: data.preferredTimeEnd
      };
    } else {
      // Set default time if none provided
      preferredTimeData = {
        start: '09:00',
        end: '17:00'
      };
    }

    const formData = {
      ...data,
      category: selectedCategory,
      budget: budgetData,
      location: locationData,
      maxDistance: Number(data.maxDistance) || 40,
      requirements: {
        skills: requirementsSkills.length > 0 ? requirementsSkills : ['other'], // Default to 'other' if no skills
        experience: job?.requirements?.experience || 'any',
        verifiedOnly: job?.requirements?.verifiedOnly || false,
        notes: data.requirementsNotes || '',
      },
      preferredDate: preferredDateData,
      preferredTime: preferredTimeData,
      // Remove fields that aren't in the backend schema
      budgetType: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      preferredTimeStart: undefined,
      preferredTimeEnd: undefined,
      requirementsNotes: undefined,
    };
    
    // Clean up any empty strings in requirements.skills
    if (formData.requirements && formData.requirements.skills) {
      formData.requirements.skills = formData.requirements.skills.filter(skill => 
        skill && typeof skill === 'string' && skill.trim().length > 0
      );
      
      // If no valid skills, set default
      if (formData.requirements.skills.length === 0) {
        formData.requirements.skills = ['other'];
      }
    }
    
    // Ensure experience field is valid
    if (formData.requirements) {
      const validExperienceLevels = ['any', 'beginner', 'intermediate', 'expert'];
      if (!validExperienceLevels.includes(formData.requirements.experience)) {
        formData.requirements.experience = 'any';
      }
      
      // Ensure verifiedOnly is boolean
      if (typeof formData.requirements.verifiedOnly !== 'boolean') {
        formData.requirements.verifiedOnly = false;
      }
    }
    
    // Debug: Log the formatted data being sent to backend
    console.log('JobForm - Formatted data being sent to backend:', formData);
    console.log('JobForm - Requirements data:', formData.requirements);
    console.log('JobForm - Location data:', formData.location);
    console.log('JobForm - Budget data:', formData.budget);
    
    // Validate that required fields are present
    if (!formData.category) {
      console.error('JobForm - Missing category');
      return;
    }
    if (!formData.location || !formData.location.coordinates) {
      console.error('JobForm - Missing location');
      return;
    }
    if (!formData.budget || !formData.budget.min || !formData.budget.max) {
      console.error('JobForm - Missing budget');
      return;
    }
    if (!formData.preferredDate) {
      console.error('JobForm - Missing preferred date');
      return;
    }
    if (!formData.preferredTime || !formData.preferredTime.start || !formData.preferredTime.end) {
      console.error('JobForm - Missing preferred time');
      return;
    }
    if (!formData.requirements || !formData.requirements.skills || formData.requirements.skills.length === 0) {
      console.error('JobForm - Missing requirements skills');
      return;
    }
    
    onSubmit?.(formData);
  };
  
  return (
    <div className={className} {...props}>
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {job ? 'Edit Job Details' : 'Post a New Job'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {job ? 'Update your job posting with the latest information' : 'Fill in the details below to create your job posting'}
            </p>
          </div>
        </div>
        
        {/* Progress Steps */}
        {job && (
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">1</span>
              </div>
              <span>Review Details</span>
            </div>
            <div className="w-8 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-gray-400 font-medium text-xs">2</span>
              </div>
              <span>Make Changes</span>
            </div>
            <div className="w-8 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-gray-400 font-medium text-xs">3</span>
              </div>
              <span>Save Updates</span>
            </div>
          </div>
        )}
      </div>
      
      <Card.Content>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-8">
          {/* Title */}
          <Input
            label="Job Title"
            placeholder="e.g., Need a plumber for bathroom repair"
            {...register('title', {
              required: 'Job title is required',
              minLength: { value: 5, message: 'Title must be at least 5 characters' },
              maxLength: { value: 100, message: 'Title must be less than 100 characters' },
            })}
            error={errors.title?.message}
            required
          />
          
          {/* Description */}
          <div>
            <label className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2 block">
              Description
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 20, message: 'Description must be at least 20 characters' },
                maxLength: { value: 2000, message: 'Description must be less than 2000 characters' },
              })}
              rows={6}
              className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              placeholder="Describe the job in detail..."
            />
            {errors.description && (
              <p className="text-sm text-error-600 mt-1">{errors.description.message}</p>
            )}
          </div>
          
          {/* Category */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 border border-secondary-200 dark:border-secondary-700 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">🏷️</span>
              </div>
              <label className="text-lg font-semibold text-gray-900 dark:text-white">
                Job Category
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {jobCategories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedCategory(category.value)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.label}</span>
                  </div>
                </button>
              ))}
            </div>
            {!selectedCategory && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Please select a category to continue
                </p>
              </div>
            )}
          </div>
          
          {/* Budget */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 border border-secondary-200 dark:border-secondary-700 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <label className="text-lg font-semibold text-gray-900 dark:text-white">
                Budget & Pricing
              </label>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBudgetType('fixed')}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    budgetType === 'fixed'
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  💰 Fixed Price
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetType('range')}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    budgetType === 'range'
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  📊 Price Range
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minimum Budget
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 50"
                    leftIcon={<DollarSign className="h-4 w-4" />}
                    {...register('budgetMin', {
                      required: 'Minimum budget is required',
                      min: { value: 1, message: 'Minimum budget must be at least $1' },
                    })}
                    error={errors.budgetMin?.message}
                  />
                </div>
                {budgetType === 'range' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Maximum Budget
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 200"
                      leftIcon={<DollarSign className="h-4 w-4" />}
                      {...register('budgetMax', {
                        required: 'Maximum budget is required for range',
                        min: { value: 1, message: 'Maximum budget must be at least $1' },
                      })}
                      error={errors.budgetMax?.message}
                    />
                  </div>
                )}
              </div>
              {/* Max Distance Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Distance (kilometers)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g., 40"
                  {...register('maxDistance', {
                    required: 'Max distance is required',
                    min: { value: 1, message: 'Minimum is 1 kilometer' },
                    max: { value: 100, message: 'Maximum is 100 kilometers' },
                  })}
                  error={errors.maxDistance?.message}
                />
              </div>
            </div>
          </div>
          
                     {/* Location */}
           <div>
             <label className="text-sm font-medium text-white mb-2 block">
               Selected Location:
             </label>
            <LocationPicker
              value={selectedLocation}
              onChange={setSelectedLocation}
              placeholder="Enter address or click on map"
            />
            {!selectedLocation && (
              <p className="text-sm text-error-600 mt-1">Please select a location</p>
            )}
          </div>
          
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preferred Date"
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              {...register('preferredDate', { required: 'Preferred date is required' })}
              error={errors.preferredDate?.message}
              required
            />
            <div className="flex gap-2">
              <Input
                label="Start Time"
                type="time"
                leftIcon={<Clock className="h-4 w-4" />}
                {...register('preferredTimeStart', { required: 'Start time is required' })}
                error={errors.preferredTimeStart?.message}
                required
              />
              <Input
                label="End Time"
                type="time"
                leftIcon={<Clock className="h-4 w-4" />}
                {...register('preferredTimeEnd', { required: 'End time is required' })}
                error={errors.preferredTimeEnd?.message}
                required
              />
            </div>
          </div>
          
          {/* Requirements */}
          <Input
            label="Requirements (optional)"
            placeholder="e.g., Licensed, 2+ years experience, Own tools"
            {...register('requirementsNotes')}
          />
          
          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 py-3 text-base font-medium border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="mr-2">❌</span>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!selectedCategory || !selectedLocation}
                className="flex-1 py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="mr-2">⏳</span>
                    {job ? 'Updating...' : 'Posting...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">✅</span>
                    {job ? 'Update Job' : 'Post Job'}
                  </span>
                )}
              </Button>
            </div>
            
            {(!selectedCategory || !selectedLocation) && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Please complete all required fields to continue
                </p>
              </div>
            )}
          </div>
        </form>
      </Card.Content>
    </div>
  );
};

export default JobForm; 