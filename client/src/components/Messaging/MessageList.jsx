import React, { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { Send, Trash2, MoreVertical } from 'lucide-react';
import { apiService } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';
import EmptyState from '../UI/EmptyState';
import socketService from '../../services/socket';

const MessageList = ({ 
  conversationId, 
  otherUser,
  className = '' 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const [typingTimeout, setTypingTimeout] = React.useState(null);

  // Get messages for this conversation
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => apiService.messages.getMessages(conversationId),
    enabled: !!conversationId && !conversationId.startsWith('new_'), // Don't fetch for new conversations
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: () => apiService.messages.markAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => apiService.messages.sendMessage(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId) => apiService.messages.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.data]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId && messages?.data?.length > 0) {
      markAsReadMutation.mutate();
    }
  }, [conversationId, messages?.data]);

  // Socket.io event listeners
  useEffect(() => {
    if (!conversationId || !user) return;

    // Connect to socket
    socketService.connect(user.id);

    // Listen for new messages
    socketService.onNewMessage((data) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });

    // Listen for typing indicators
    socketService.onUserTyping((data) => {
      if (data.userId === otherUser?.clerkId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socketService.removeListener('new_message');
      socketService.removeListener('user_typing');
    };
  }, [conversationId, user, otherUser, queryClient]);

  // Handle sending message
  const handleSendMessage = (content) => {
    if (!content.trim()) return;

    const messageData = {
      recipientId: otherUser._id, // Use MongoDB _id instead of clerkId
      content: content.trim(),
      type: 'text'
    };

    sendMessageMutation.mutate(messageData);

    // Emit socket event for real-time updates (only if we have a real conversation)
    if (conversationId && !conversationId.startsWith('new_')) {
      socketService.sendMessage({
        ...messageData,
        conversationId,
        senderId: user.id,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    socketService.sendTyping({
      senderId: user.id,
      recipientId: otherUser.clerkId
    });

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      socketService.sendStopTyping({
        senderId: user.id,
        recipientId: otherUser.clerkId
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

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
        icon={<Send className="h-12 w-12" />}
        title="Error loading messages"
        description="There was an error loading the messages. Please try again."
      />
    );
  }

  if (!messages?.data?.length) {
    return (
      <EmptyState
        icon={<Send className="h-12 w-12" />}
        title="No messages yet"
        description="Start the conversation by sending a message."
      />
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.data.map((message) => {
          const isOwnMessage = message.sender.clerkId === user?.id;
          
          return (
            <div
              key={message._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-xs lg:max-w-md px-4 py-2 rounded-lg
                  ${isOwnMessage
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs opacity-75">
                    {message.sender.firstName} {message.sender.lastName}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs opacity-75">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                    {isOwnMessage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMessageMutation.mutate(message._id)}
                        className="p-1 h-auto opacity-50 hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary-100 dark:bg-secondary-800 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={sendMessageMutation.isLoading}
      />
    </div>
  );
};

// Message Input Component
const MessageInput = ({ onSendMessage, onTyping, disabled = false }) => {
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    onTyping();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-secondary-200 dark:border-secondary-700">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!message.trim() || disabled}
          className="px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

export default MessageList; 