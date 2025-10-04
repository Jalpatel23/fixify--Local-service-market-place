import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Search, 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { apiService } from '../services/api';
import socketService from '../services/socket';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Avatar from '../components/UI/Avatar';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';

const MessagesPage = () => {
  const { user: clerkUser } = useClerkAuth();
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Connect to socket
  useEffect(() => {
    if (clerkUser) {
      socketService.connect(clerkUser.id);
    }
    return () => socketService.disconnect();
  }, [clerkUser]);

  // Handle URL parameters for user-specific conversations
  useEffect(() => {
    const targetUserId = searchParams.get('user');
    if (targetUserId && profile?.data?.data?._id) {
      startConversationWithUser(targetUserId);
    } else if (!targetUserId) {
      loadConversations();
    }
  }, [searchParams, profile?.data?.data?._id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.messages.getConversations();
      setConversations(response.data?.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start conversation with specific user
  const startConversationWithUser = useCallback(async (targetUserId) => {
    try {
      setIsLoading(true);
      
      // Check if conversation already exists
      const response = await apiService.messages.getConversations();
      const existingConversations = response.data?.data || [];
      const existingConversation = existingConversations.find(conv => 
        conv.otherUser._id === targetUserId
      );

      if (existingConversation) {
        setSelectedConversation(existingConversation);
        await loadMessages(existingConversation.conversationId);
      } else {
        // Create new conversation object
        const newConversation = {
          conversationId: `new_${targetUserId}`,
          otherUser: {
            _id: targetUserId,
            firstName: 'User',
            lastName: '',
            profileImage: null
          },
          lastMessage: {
            content: 'Start a conversation...',
            createdAt: new Date().toISOString()
          },
          unreadCount: 0,
          isNewConversation: true
        };
        setSelectedConversation(newConversation);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId || conversationId.startsWith('new_')) return;
    
    try {
      setIsLoadingMessages(true);
      const response = await apiService.messages.getMessages(conversationId);
      const loadedMessages = response.data?.data || [];
      
      // Process messages to determine ownership
      const currentUserId = profile?.data?.data?._id;
      const processedMessages = loadedMessages.map(msg => ({
        ...msg,
        isOwn: msg.sender._id === currentUserId
      }));
      
      setMessages(processedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [profile?.data?.data?._id]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      
      // Create optimistic message
      const optimisticMessage = {
        id: Date.now(),
        content: newMessage.trim(),
        sender: {
          _id: profile?.data?.data?._id,
          firstName: profile?.data?.data?.firstName || 'You',
          lastName: profile?.data?.data?.lastName || ''
        },
        recipient: {
          _id: selectedConversation.otherUser._id,
          firstName: selectedConversation.otherUser.firstName,
          lastName: selectedConversation.otherUser.lastName
        },
        createdAt: new Date().toISOString(),
        isOwn: true,
        status: 'sending'
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      // Send to server
      const messageData = {
        recipientId: selectedConversation.otherUser._id,
        content: newMessage.trim(),
        type: 'text'
      };

      const response = await apiService.messages.sendMessage(messageData);
      
      // Update message with server response
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...response.data.data, isOwn: true, status: 'sent' }
          : msg
      ));

      // Refresh conversations to update last message
      await loadConversations();
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
      setNewMessage(newMessage.trim());
    } finally {
      setIsSending(false);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.conversationId);
  };

  // Handle back to conversations
  const handleBackToConversations = () => {
    setSelectedConversation(null);
    setMessages([]);
    navigate('/messages');
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Detect if this is a single conversation view
  const targetUserId = searchParams.get('user');
  const isSingleConversation = Boolean(targetUserId);

  // --- FIX isOwn bug for single-conversation page ---
  // Always process messages to set isOwn based on current user
  useEffect(() => {
    if (!isSingleConversation) return;
    const currentUserId = profile?.data?.data?._id;
    if (!currentUserId || messages.length === 0) return;
    // Only update if any message is missing isOwn or is incorrect
    const needsUpdate = messages.some(
      (msg) => msg.isOwn !== (String(msg.sender?._id || msg.sender) === String(currentUserId))
    );
    if (needsUpdate) {
      setMessages((prevMsgs) =>
        prevMsgs.map((msg) => ({
          ...msg,
          isOwn: String(msg.sender?._id || msg.sender) === String(currentUserId),
        }))
      );
    }
  }, [isSingleConversation, profile?.data?.data?._id, messages]);

  if (isSingleConversation) {
    // Single conversation UI (no sidebar)
    return (
      <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {selectedConversation && (
              <Avatar
                src={selectedConversation.otherUser.profileImage}
                alt={`${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`}
                fallback={selectedConversation.otherUser.firstName?.[0] || 'U'}
                size="md"
              />
            )}
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {selectedConversation?.otherUser.firstName} {selectedConversation?.otherUser.lastName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedConversation?.lastMessage?.content || 'Start a conversation...'}
              </p>
            </div>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="md" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={message._id || message.id || index}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.isOwn
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-70">
                      {formatTimestamp(message.createdAt)}
                    </span>
                    {message.isOwn && (
                      <span className="ml-2">
                        {message.status === 'sending' ? (
                          <Clock className="w-3 h-3 text-gray-400" />
                        ) : message.status === 'sent' ? (
                          <Check className="w-3 h-3 text-gray-400" />
                        ) : (
                          <CheckCheck className="w-3 h-3 text-blue-500" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start your conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Send a message to begin chatting with {selectedConversation?.otherUser.firstName}
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 max-w-2xl mx-auto w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Connect with job posters and helpers
            </p>
          </div>
          {selectedConversation && isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToConversations}
              className="md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations List */}
        <div className={`${isMobile && selectedConversation ? 'hidden' : 'w-full md:w-80'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="md" />
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.conversationId}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation?.conversationId === conversation.conversationId
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500'
                        : ''
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={conversation.otherUser.profileImage}
                        alt={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`}
                        fallback={conversation.otherUser.firstName?.[0] || 'U'}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(conversation.lastMessage?.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No conversations yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Start messaging with other users to see conversations here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className={`${isMobile && !selectedConversation ? 'hidden' : 'flex-1'} bg-white dark:bg-gray-800 flex flex-col`}>
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToConversations}
                      className="md:hidden"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <Avatar
                    src={selectedConversation.otherUser.profileImage}
                    alt={`${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`}
                    fallback={selectedConversation.otherUser.firstName?.[0] || 'U'}
                    size="md"
                  />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedConversation.lastMessage?.content || 'Start a conversation...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <LoadingSpinner size="md" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div
                      key={message._id || message.id || index}
                      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">
                            {formatTimestamp(message.createdAt)}
                          </span>
                          {message.isOwn && (
                            <span className="ml-2">
                              {message.status === 'sending' ? (
                                <Clock className="w-3 h-3 text-gray-400" />
                              ) : message.status === 'sent' ? (
                                <Check className="w-3 h-3 text-gray-400" />
                              ) : (
                                <CheckCheck className="w-3 h-3 text-blue-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Start your conversation
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Send a message to begin chatting with {selectedConversation.otherUser.firstName}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
