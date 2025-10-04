import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Search, ArrowLeft } from 'lucide-react';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import LoadingSpinner from '../UI/LoadingSpinner';
import socketService from '../../services/socket';
import { apiService } from '../../services/api';

const MessagingPage = () => {
  const { user: clerkUser } = useClerkAuth();
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [hasProcessedUrl, setHasProcessedUrl] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = React.useRef(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Connect to socket when component mounts
  useEffect(() => {
    if (clerkUser) {
      socketService.connect(clerkUser.id);
    }

    return () => {
      socketService.disconnect();
    };
  }, [clerkUser]);

  // Function to start conversation with a specific user
  const startConversationWithUser = useCallback(async (targetUserId) => {
    try {
      console.log('=== Starting conversation with user:', targetUserId);
      setIsStartingConversation(true);

      // Create a simple conversation object without complex API calls
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

      console.log('Created simple conversation:', newConversation);
      setSelectedConversation(newConversation);

      // Try to load existing messages for this user pair
      try {
        console.log('Checking for existing messages...');
        const conversationsResponse = await apiService.messages.getConversations();
        const existingConversations = conversationsResponse.data?.data || [];

        // Look for existing conversation with this user
        const existingConversation = existingConversations.find(conv =>
          conv.otherUser._id === targetUserId
        );

        if (existingConversation) {
          // console.log('Found existing conversation, loading messages...');

          // Update conversation first
          const updatedConversation = {
            ...existingConversation,
            otherUser: existingConversation.otherUser,
            isNewConversation: false
          };

          // console.log('Setting updated conversation:', updatedConversation);
          setSelectedConversation(updatedConversation);

          // Load messages and wait for profile data
          setIsLoadingMessages(true);
          const messagesResponse = await apiService.messages.getMessages(existingConversation.conversationId);
          const loadedMessages = messagesResponse.data?.data || [];

          // Store raw messages temporarily - we'll process them when profile is ready
          setMessages(loadedMessages.map(msg => ({ ...msg, isOwn: false }))); // Temporary, will be fixed
          setIsLoadingMessages(false);

          // console.log('Messages loaded, waiting for profile to calculate isOwn...');
        }
      } catch (error) {
        console.error('Error checking for existing messages:', error);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsStartingConversation(false);
    }
  }, []);

  // Reset state when URL changes
  useEffect(() => {
    setSelectedConversation(null);
    setMessages([]);
    setConversations([]);
    setHasProcessedUrl(false);
    setIsLoadingConversations(false);
    setIsLoadingMessages(false);
  }, [searchParams]);

  // Function to load conversations list for main messages page
  const loadConversationsList = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      // console.log('=== Loading conversations list ===');
      const response = await apiService.messages.getConversations();
      const conversationsList = response.data?.data || [];

      // console.log('Loaded conversations:', conversationsList);
      setConversations(conversationsList);

      // If there are conversations, don't auto-select any
      // Let user click on one to view messages

    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Memoize the target user ID to prevent infinite loops
  // const targetUserId = useMemo(() => searchParams.get('user'), [searchParams]);
  // const profileUserId = useMemo(() => profile?.data?.data?._id, [profile?.data?.data?._id]);

  // Handle user query parameter to start conversation OR load conversations list
  useEffect(() => {
    const currentTargetUserId = searchParams.get('user');
    const currentProfileUserId = profile?.data?.data?._id;

    // console.log('=== MessagingPage useEffect triggered ===');
    // console.log('Target user ID from URL:', currentTargetUserId);
    // console.log('Profile user ID:', currentProfileUserId);
    // console.log('Is starting conversation:', isStartingConversation);
    // console.log('Has processed URL:', hasProcessedUrl);

    if (currentTargetUserId && currentProfileUserId && !isStartingConversation && !hasProcessedUrl) {
      // Start conversation with specific user
      // console.log('Conditions met, starting conversation...');
      setHasProcessedUrl(true);
      startConversationWithUser(currentTargetUserId);
    } else if (!currentTargetUserId && currentProfileUserId && !hasProcessedUrl) {
      // Load conversations list for main messages page
      // console.log('Loading conversations list for main messages page...');
      setHasProcessedUrl(true);
      loadConversationsList();
    } else {
      // console.log('Conditions not met for starting conversation');
      // if (!currentTargetUserId) console.log('- No target user ID');
      // if (!currentProfileUserId) console.log('- No profile data');
      // if (isStartingConversation) console.log('- Already starting conversation');
      // if (hasProcessedUrl) console.log('- Already processed URL');
    }
  }, [searchParams, profile?.data?.data?._id, isStartingConversation, hasProcessedUrl, startConversationWithUser, loadConversationsList]);

  // Process messages when profile data becomes available
  useEffect(() => {
    if (profile?.data?.data?._id && messages.length > 0) {
      const currentUserId = profile.data.data._id;
      // console.log('=== PROCESSING MESSAGES WITH PROFILE ===');
      // console.log('Current user ID:', currentUserId);
      // console.log('Processing', messages.length, 'messages');

      const processedMessages = messages.map(msg => {
        // Skip if already processed (has correct isOwn)
        if (msg.isOwn !== false && msg.isOwn !== undefined) {
          return msg;
        }

        const senderId = msg.sender._id || msg.sender;
        const senderIdStr = String(senderId);
        const currentUserIdStr = String(currentUserId);
        const isOwn = senderIdStr === currentUserIdStr;

        // console.log(`Processing message: "${msg.content}" - isOwn: ${isOwn}`);

        return {
          ...msg,
          isOwn: isOwn
        };
      });

      // console.log('Messages processed with isOwn property');
      setMessages(processedMessages);
    }
  }, [profile?.data?.data?._id, messages.length]);

  const handleSelectConversation = async (conversation) => {
    // console.log('=== Selecting conversation:', conversation);
    setSelectedConversation(conversation);

    // Load messages for this conversation
    if (conversation && conversation.conversationId) {
      try {
        setIsLoadingMessages(true);
        // console.log('Loading messages for selected conversation:', conversation.conversationId);
        const response = await apiService.messages.getMessages(conversation.conversationId);
        const loadedMessages = response.data?.data || [];

        // console.log('Loaded messages for conversation:', loadedMessages);

        // Store raw messages temporarily - they'll be processed by the profile useEffect
        setMessages(loadedMessages.map(msg => ({ ...msg, isOwn: false }))); // Temporary, will be fixed by profile useEffect

      } catch (error) {
        console.error('Error loading messages for conversation:', error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    } else {
      setMessages([]);
      setIsLoadingMessages(false);
    }
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedConversation) {
      try {
        // Create optimistic message for immediate UI update
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
          isOwn: true
        };

        // Add message to UI immediately
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        // Send to server
        const messageData = {
          recipientId: selectedConversation.otherUser._id,
          content: newMessage.trim(),
          type: 'text'
        };

        // console.log('Sending message to server:', messageData);
        const response = await apiService.messages.sendMessage(messageData);
        // console.log('Message sent successfully:', response);

      } catch (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        setMessages(prev => prev.slice(0, -1));
        // Restore message in input
        setNewMessage(newMessage.trim());
      }
    }
  };

  // Filter conversations based on search query
  // const filteredConversations = selectedConversation ? [selectedConversation] : [];

  // Debug logging
  // console.log('=== MessagingPage Render ===');
  // console.log('Selected conversation:', selectedConversation);
  // console.log('Messages:', messages);
  // console.log('Is mobile:', isMobile);

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Messages
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Connect with job posters and helpers
          </p>
        </div>

        {/* Mobile Layout */}
        {isMobile ? (
          <div className="h-[calc(100vh-300px)] mb-20">
            {selectedConversation ? (
              // Message View
              <div className="h-full flex flex-col">
                {/* Conversation Header */}
                <div className="flex items-center space-x-3 p-4 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToConversations}
                    className="p-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center space-x-3 flex-1">
                    {selectedConversation.otherUser.profileImage ? (
                      <img
                        src={selectedConversation.otherUser.profileImage}
                        alt={`${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                          {selectedConversation.otherUser.firstName?.[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                        {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                      </h3>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">
                        {selectedConversation.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1">
                  {true ? (
                    <div className="h-full flex flex-col">
                      {/* Messages Area */}
                      <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-300px)]">
                        {isLoadingMessages ? (
                          <div className="flex items-center justify-center h-full">
                            <LoadingSpinner size="md" />
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center text-secondary-500 dark:text-secondary-400">
                            <p>Start your conversation with {selectedConversation.otherUser.firstName}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {messages.map((message, index) => (
                              <div
                                key={message._id || message.id || `message-${index}`}
                                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    message.isOwn
                                      ? 'bg-primary-500 text-white'
                                      : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p className="text-xs mt-1 opacity-70">
                                    {new Date(message.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message Input - Fixed at bottom */}
                      <div className="border-t border-secondary-200 dark:border-secondary-700 p-4 bg-white dark:bg-secondary-900">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-800 dark:text-secondary-100"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendMessage();
                              }
                            }}
                          />
                          <Button
                            onClick={handleSendMessage}
                            className="px-4 py-2"
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <MessageList
                      conversationId={selectedConversation.conversationId}
                      otherUser={selectedConversation.otherUser}
                    />
                  )}
                </div>
              </div>
            ) : (
              // Conversation List
              <div className="h-full">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner size="md" />
                  </div>
                ) : conversations.length > 0 ? (
                  <div className="p-4">
                    <div className="space-y-2">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation._id || conversation.conversationId}
                          className={`p-3 rounded-lg border cursor-pointer ${
                            selectedConversation?._id === conversation._id || selectedConversation?.conversationId === conversation.conversationId
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                              : 'hover:bg-secondary-50 dark:hover:bg-secondary-800 border-secondary-200 dark:border-secondary-700'
                          }`}
                          onClick={() => handleSelectConversation(conversation)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center">
                              <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                                {conversation.otherUser.firstName?.[0] || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-secondary-900 dark:text-secondary-100 truncate">
                                {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                              </h4>
                              <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
                                {conversation.lastMessage?.content || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ConversationList
                    selectedConversation={selectedConversation}
                    onSelectConversation={handleSelectConversation}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          /* Desktop Layout */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Conversation List */}
            <div className="md:col-span-1">
              <Card className="h-full">
                <Card.Header>
                  <Card.Title>Conversations</Card.Title>
                  <Card.Description>
                    Your recent conversations
                  </Card.Description>
                </Card.Header>
                <Card.Content className="h-full overflow-y-auto">
                  {isLoadingConversations ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : conversations.length > 0 ? (
                    <div className="space-y-2">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation._id || conversation.conversationId}
                          className={`p-3 rounded-lg border cursor-pointer ${
                            selectedConversation?._id === conversation._id || selectedConversation?.conversationId === conversation.conversationId
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                              : 'hover:bg-secondary-50 dark:hover:bg-secondary-800 border-secondary-200 dark:border-secondary-700'
                          }`}
                          onClick={() => handleSelectConversation(conversation)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center">
                              <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                                {conversation.otherUser.firstName?.[0] || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-secondary-900 dark:text-secondary-100 truncate">
                                {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                              </h4>
                              <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
                                {conversation.lastMessage?.content || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ConversationList
                      selectedConversation={selectedConversation}
                      onSelectConversation={handleSelectConversation}
                    />
                  )}
                </Card.Content>
              </Card>
            </div>

            {/* Message List */}
            <div className="md:col-span-2">
              <Card className="h-full">
                {selectedConversation ? (
                  <>
                    <Card.Header>
                      <div className="flex items-center space-x-3">
                        {selectedConversation.otherUser.profileImage ? (
                          <img
                            src={selectedConversation.otherUser.profileImage}
                            alt={`${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                              {selectedConversation.otherUser.firstName?.[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <Card.Title>
                            {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                          </Card.Title>
                          <Card.Description>
                            {selectedConversation.lastMessage.content}
                          </Card.Description>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Content className="h-full p-0">
                      {true ? (
                        <div className="h-full flex flex-col">
                          {/* Messages Area */}
                          <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-400px)]">
                            {isLoadingMessages ? (
                              <div className="flex items-center justify-center h-full">
                                <LoadingSpinner size="md" />
                              </div>
                            ) : messages.length === 0 ? (
                              <div className="text-center text-secondary-500 dark:text-secondary-400">
                                <p>Start your conversation with {selectedConversation.otherUser.firstName}</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {messages.map((message, index) => (
                                  <div
                                    key={message._id || message.id || `message-${index}`}
                                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div
                                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        message.isOwn
                                          ? 'bg-primary-500 text-white'
                                          : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100'
                                      }`}
                                    >
                                      <p className="text-sm">{message.content}</p>
                                      <p className="text-xs mt-1 opacity-70">
                                        {new Date(message.createdAt).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Message Input - Fixed at bottom */}
                          <div className="border-t border-secondary-200 dark:border-secondary-700 p-4 bg-white dark:bg-secondary-900">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-800 dark:text-secondary-100"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSendMessage();
                                  }
                                }}
                              />
                              <Button
                                onClick={handleSendMessage}
                                className="px-4 py-2"
                              >
                                Send
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <MessageList
                          conversationId={selectedConversation.conversationId}
                          otherUser={selectedConversation.otherUser}
                        />
                      )}
                    </Card.Content>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-secondary-600 dark:text-secondary-400">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage; 