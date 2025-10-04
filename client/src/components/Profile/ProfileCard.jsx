import React from 'react';
import { User, MapPin, Star } from 'lucide-react';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import Button from '../UI/Button';

const ProfileCard = ({
  user,
  showActions = true,
  onEdit,
  onContact,
  className = '',
  ...props
}) => {
  const {
    firstName,
    lastName,
    profileImage,
    rating,
    location,
    accountType,
    isVerified,
  } = user;
  
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Anonymous';
  const averageRating = rating?.average || 0;
  
  return (
    <Card className={className} {...props}>
      <Card.Header>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary-200 flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt={fullName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="w-8 h-8 text-secondary-500" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{fullName}</h3>
            {averageRating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-warning-500 fill-current" />
                <span className="text-sm">{averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              {onEdit && <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>}
              {onContact && <Button variant="primary" size="sm" onClick={onContact}>Contact</Button>}
            </div>
          )}
        </div>
      </Card.Header>
    </Card>
  );
};

export default ProfileCard; 