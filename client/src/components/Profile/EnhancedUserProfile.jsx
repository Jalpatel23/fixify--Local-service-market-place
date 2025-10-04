import React, { useState } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Shield, Award, Calendar, Star } from 'lucide-react';

const EnhancedUserProfile = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Star },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'availability', label: 'Availability', icon: Calendar }
  ];

  const getVerificationStatus = () => {
    const verifications = user?.verifications || [];
    const approved = verifications.filter(v => v.status === 'approved').length;
    const total = verifications.length;
    return { approved, total };
  };

  const getSkillCount = () => {
    return user?.skills?.length || 0;
  };

  const getAverageRating = () => {
    const skills = user?.skills || [];
    if (skills.length === 0) return 0;
    
    const totalRating = skills.reduce((sum, skill) => {
      const endorsements = skill.endorsements || [];
      const avgRating = endorsements.length > 0 
        ? endorsements.reduce((s, e) => s + e.rating, 0) / endorsements.length
        : 0;
      return sum + avgRating;
    }, 0);
    
    return (totalRating / skills.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <Card.Content>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-gray-600 dark:text-gray-400">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {user?.isVerified && (
                  <Badge variant="success" size="sm">
                    <Shield size={12} className="mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="blue" size="sm">
                  {user?.accountType || 'User'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {getAverageRating()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average Rating
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Card.Content>
                <div className="text-center">
                  <Shield className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Verification Status
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {getVerificationStatus().approved}/{getVerificationStatus().total}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Documents verified
                  </p>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content>
                <div className="text-center">
                  <Award className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Skills
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {getSkillCount()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Skills listed
                  </p>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content>
                <div className="text-center">
                  <Calendar className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Availability
                  </h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {user?.availability?.availableDays || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Days available
                  </p>
                </div>
              </Card.Content>
            </Card>
          </div>
        )}

        {activeTab === 'verification' && (
          <Card>
            <Card.Content>
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Verification Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  User verification features will be implemented here.
                </p>
                <Button variant="outline">
                  Manage Verification
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {activeTab === 'skills' && (
          <Card>
            <Card.Content>
              <div className="text-center py-8">
                <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Skills & Endorsements
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Skills and endorsements management will be implemented here.
                </p>
                <Button variant="outline">
                  Manage Skills
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {activeTab === 'availability' && (
          <Card>
            <Card.Content>
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Availability Schedule
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Availability management will be implemented here.
                </p>
                <Button variant="outline">
                  Manage Availability
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedUserProfile; 