import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Award, 
  ThumbsUp, 
  Users, 
  Star,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { Modal } from '../UI/Modal';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { EmptyState } from '../UI/EmptyState';

const SkillEndorsements = ({ userId, isOwnProfile = false }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillForm, setSkillForm] = useState({
    name: '',
    description: '',
    level: 'intermediate'
  });
  const queryClient = useQueryClient();

  // Fetch user's skills and endorsements
  const { data: skills, isLoading, error } = useQuery({
    queryKey: ['user', 'skills', userId],
    queryFn: () => api.auth.getUserSkills(userId),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: 'blue',
      intermediate: 'green',
      advanced: 'orange',
      expert: 'red'
    };
    return colors[level] || 'gray';
  };

  const getAverageRating = (endorsements) => {
    if (!endorsements || endorsements.length === 0) return 0;
    const total = endorsements.reduce((sum, endorsement) => sum + endorsement.rating, 0);
    return (total / endorsements.length).toFixed(1);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">Error loading skills</div>
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
            Skills & Endorsements
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showcase your skills and get endorsed by others
          </p>
        </div>
        {isOwnProfile && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Skill
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : skills?.length === 0 ? (
        <EmptyState
          icon={<Award className="h-12 w-12" />}
          title="No Skills Yet"
          description={isOwnProfile ? "Add your first skill to showcase your expertise." : "This user hasn't added any skills yet."}
          action={isOwnProfile ? (
            <Button onClick={() => setShowAddModal(true)}>
              Add Skill
            </Button>
          ) : null}
        />
      ) : (
        <div className="space-y-4">
          {skills?.map((skill) => (
            <Card key={skill._id}>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title className="flex items-center gap-2">
                    <Award size={16} />
                    {skill.name}
                    <Badge variant={getSkillLevelColor(skill.level)} size="sm">
                      {skill.level}
                    </Badge>
                  </Card.Title>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {skill.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500" />
                    <span className="text-sm font-medium">
                      {getAverageRating(skill.endorsements)}/5
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({skill.endorsements?.length || 0} endorsements)
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillEndorsements; 