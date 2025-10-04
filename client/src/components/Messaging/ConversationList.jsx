import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Clock, User } from 'lucide-react';
import { apiService } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import LoadingSpinner from '../UI/LoadingSpinner';
import EmptyState from '../UI/EmptyState';

const ConversationList = ({ 
  selectedConversation, 
  onSelectConversation,
  className = '' 
}) => {
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiService.messages.getConversations(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-12 w-12" />}
        title="Error loading conversations"
        description="There was an error loading your conversations. Please try again."
      />
    );
  }

  if (!conversations?.data?.length) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-12 w-12" />}
        title="No conversations yet"
        description="Start a conversation by accepting a job or contacting a user."
      />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {conversations.data.map((conversation) => {
        const isSelected = selectedConversation === conversation.conversationId;
        const hasUnread = conversation.unreadCount > 0;
        
        return (
          <div
            key={conversation.conversationId}
            onClick={() => onSelectConversation(conversation)}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all duration-200
              ${isSelected 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50 dark:border-secondary-700 dark:hover:border-secondary-600 dark:hover:bg-secondary-800/50'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {conversation.otherUser.profileImage ? (
                  <img
                    src={conversation.otherUser.profileImage}
                    alt={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                )}
              </div>

              {/* Conversation Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                    {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {hasUnread && (
                      <Badge variant="primary" size="sm">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate mt-1">
                  {conversation.lastMessage.content}
                </p>

                {/* Rating */}
                {conversation.otherUser.rating && (
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(conversation.otherUser.rating.average)
                              ? 'text-yellow-400'
                              : 'text-secondary-300 dark:text-secondary-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-secondary-500 dark:text-secondary-400 ml-1">
                      ({conversation.otherUser.rating.count})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList; 