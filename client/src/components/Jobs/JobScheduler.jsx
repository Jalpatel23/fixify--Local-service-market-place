import React, { useState } from 'react';
import { Calendar, Clock, Repeat, AlertCircle } from 'lucide-react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';

const JobScheduler = ({ onSchedule, initialData = {} }) => {
  const [scheduleType, setScheduleType] = useState(initialData.scheduleType || 'once');
  const [scheduledDate, setScheduledDate] = useState(initialData.scheduledDate || '');
  const [scheduledTime, setScheduledTime] = useState(initialData.scheduledTime || '');
  const [recurringType, setRecurringType] = useState(initialData.recurringType || 'weekly');
  const [recurringInterval, setRecurringInterval] = useState(initialData.recurringInterval || 1);
  const [endDate, setEndDate] = useState(initialData.endDate || '');
  const [reminderTime, setReminderTime] = useState(initialData.reminderTime || '24');

  const scheduleTypes = [
    { value: 'once', label: 'One-time', description: 'Schedule for a specific date and time' },
    { value: 'recurring', label: 'Recurring', description: 'Schedule to repeat at regular intervals' },
    { value: 'asap', label: 'ASAP', description: 'Start immediately when accepted' }
  ];

  const recurringTypes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom' }
  ];

  const reminderOptions = [
    { value: '1', label: '1 hour before' },
    { value: '6', label: '6 hours before' },
    { value: '24', label: '1 day before' },
    { value: '48', label: '2 days before' },
    { value: '168', label: '1 week before' }
  ];

  const handleSchedule = () => {
    const scheduleData = {
      scheduleType,
      scheduledDate: scheduleType === 'once' ? scheduledDate : null,
      scheduledTime: scheduleType === 'once' ? scheduledTime : null,
      recurringType: scheduleType === 'recurring' ? recurringType : null,
      recurringInterval: scheduleType === 'recurring' ? recurringInterval : null,
      endDate: scheduleType === 'recurring' ? endDate : null,
      reminderTime: parseInt(reminderTime)
    };

    onSchedule(scheduleData);
  };

  const isFormValid = () => {
    if (scheduleType === 'once') {
      return scheduledDate && scheduledTime;
    } else if (scheduleType === 'recurring') {
      return scheduledDate && endDate && recurringInterval > 0;
    }
    return true; // ASAP is always valid
  };

  const getNextOccurrence = () => {
    if (scheduleType === 'once') {
      return `${scheduledDate} at ${scheduledTime}`;
    } else if (scheduleType === 'recurring') {
      const interval = recurringInterval > 1 ? `${recurringInterval} ` : '';
      const type = recurringType === 'daily' ? 'days' : 
                   recurringType === 'weekly' ? 'weeks' : 'months';
      return `Every ${interval}${type} starting ${scheduledDate}`;
    }
    return 'As soon as possible';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Schedule Job
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose when you'd like this job to be performed
        </p>
      </div>

      {/* Schedule Type Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Schedule Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {scheduleTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setScheduleType(type.value)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                scheduleType === type.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {type.label}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {type.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* One-time Schedule */}
      {scheduleType === 'once' && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Calendar size={16} />
              One-time Schedule
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Recurring Schedule */}
      {scheduleType === 'recurring' && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Repeat size={16} />
              Recurring Schedule
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={scheduledDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recurrence Type
                  </label>
                  <select
                    value={recurringType}
                    onChange={(e) => setRecurringType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {recurringTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interval
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Reminder Settings */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Clock size={16} />
            Reminder Settings
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Send Reminder
            </label>
            <select
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {reminderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </Card.Content>
      </Card>

      {/* Summary */}
      <Card>
        <Card.Header>
          <Card.Title>Schedule Summary</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Next occurrence: {getNextOccurrence()}
              </span>
            </div>
            {scheduleType === 'recurring' && (
              <div className="flex items-center gap-2">
                <Repeat size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Repeats until: {endDate}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Reminder: {reminderOptions.find(opt => opt.value === reminderTime)?.label}
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSchedule}
          disabled={!isFormValid()}
          className="flex-1"
        >
          Schedule Job
        </Button>
      </div>

      {/* Validation Warning */}
      {!isFormValid() && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <AlertCircle size={16} className="text-yellow-600" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Please fill in all required fields to schedule the job.
          </span>
        </div>
      )}
    </div>
  );
};

export default JobScheduler; 