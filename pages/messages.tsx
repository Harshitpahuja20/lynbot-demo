import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  Users,
  ArrowLeft,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
  Mail,
  Linkedin,
  RefreshCw,
  Sparkles,
  Plus
} from 'lucide-react';

interface Prospect {
  _id: string;
  linkedinData: {
    name: string;
    profileImageUrl?: string;
    company?: string;
    profileUrl?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

interface Message {
  _id: string;
  prospectId: Prospect;
  conversationId: string;
  type: 'sent' | 'received';
  messageType: string;
  content: string;
  subject?: string;
  platform: 'linkedin' | 'email';
  emailData?: {
    to: string;
    from: string;
    cc?: string[];
    bcc?: string[];
    messageId?: string;
  };
  status: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  automated: boolean;
}

interface Conversation {
  conversationId: string;
  prospect: Prospect;
  platform: 'linkedin' | 'email';
  lastMessage: Message;
  unreadCount: number;
  totalMessages: number;
}

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [syncingEmails, setSyncingEmails] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [activePlatform, setActivePlatform] = useState<'all' | 'linkedin' | 'email'>('all');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [showNewEmailModal, setShowNewEmailModal] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const platformParam = activePlatform !== 'all' ? `&platform=${activePlatform}` : '';
      const response = await fetch(`/api/messages?${platformParam}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/signin';
          return;
        }
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations || []);
      } else {
        throw new Error(data.error || 'Failed to fetch conversations');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      setError('');
      
      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        
        // Mark unread messages as read
        const unreadMessages = data.messages.filter((msg: Message) => 
          msg.type === 'received' && msg.status !== 'read'
        );
        
        for (const msg of unreadMessages) {
          markMessageAsRead(msg._id);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSyncEmails = async () => {
    setSyncingEmails(true);
    try {
      const response = await fetch('/api/messages/email-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sync emails');
      }

      const data = await response.json();
      if (data.success) {
        setError('');
        // Refresh conversations to show new emails
        await fetchConversations();
        if (selectedConversation) {
          await fetchMessages(selectedConversation.conversationId);
        }
      } else {
        throw new Error(data.error || 'Failed to sync emails');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync emails');
    } finally {
      setSyncingEmails(false);
    }
  };

  const handleGenerateEmailDraft = async () => {
    if (!selectedConversation) return;

    setGeneratingDraft(true);
    try {
      const response = await fetch('/api/ai/email-draft', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospectId: selectedConversation.prospect._id,
          messageType: 'cold_email',
          tone: 'professional'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate email draft');
      }

      const data = await response.json();
      if (data.success && data.draft) {
        setEmailSubject(data.draft.subject);
        setNewMessage(data.draft.content);
        setEmailTo(data.draft.to || selectedConversation.prospect.contactInfo?.email || '');
        setError('');
      } else {
        throw new Error(data.error || 'Failed to generate email draft');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate email draft');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    // Additional validation for email
    if (selectedConversation.platform === 'email' && !emailSubject.trim()) {
      setError('Subject is required for email messages');
      return;
    }

    setSendingMessage(true);
    try {
      const requestBody: any = {
        prospectId: selectedConversation.prospect._id,
        content: newMessage.trim(),
        conversationId: selectedConversation.conversationId,
        messageType: 'manual',
        platform: selectedConversation.platform
      };

      // Add email-specific fields
      if (selectedConversation.platform === 'email') {
        requestBody.subject = emailSubject.trim();
        requestBody.to = emailTo || selectedConversation.prospect.contactInfo?.email;
        requestBody.from = emailFrom;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await response.json();
      if (data.success) {
        // Add the new message to the current conversation
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
        setEmailSubject('');
        
        // Update the conversation list
        fetchConversations();
        setError('');
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Set email fields based on conversation platform
    if (conversation.platform === 'email') {
      setEmailTo(conversation.prospect.contactInfo?.email || '');
      // Get user's email from localStorage or fetch from API
      const userEmail = sessionStorage.getItem('userEmail') || '';
      setEmailFrom(userEmail);
    }
    fetchMessages(conversation.conversationId);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setMessages([]);
    setNewMessage('');
    setEmailSubject('');
    setEmailTo('');
    setEmailFrom('');
    fetchConversations(); // Refresh to update unread counts
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.type === 'sent') {
      switch (message.status) {
        case 'sent':
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'delivered':
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'read':
          return <CheckCircle className="h-4 w-4 text-blue-500" />;
        case 'failed':
          return <AlertCircle className="h-4 w-4 text-red-500" />;
        default:
          return <Clock className="h-4 w-4 text-gray-400" />;
      }
    }
    return null;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const platformMatch = activePlatform === 'all' || conversation.platform === activePlatform;
    const searchMatch = 
      conversation.prospect.linkedinData?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conversation.prospect.linkedinData?.company && 
         conversation.prospect.linkedinData?.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return platformMatch && searchMatch;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading conversations...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full lg:w-1/3 border-r border-gray-200 flex flex-col`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSyncEmails}
                    disabled={syncingEmails}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50"
                    title="Sync Emails"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncingEmails ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowNewEmailModal(true)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                    title="New Email"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Platform Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setActivePlatform('all')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activePlatform === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActivePlatform('linkedin')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activePlatform === 'linkedin'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Linkedin className="h-4 w-4 mr-1" />
                  LinkedIn
                </button>
                <button
                  onClick={() => setActivePlatform('email')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activePlatform === 'email'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {conversations.length === 0 ? 'No conversations yet' : 'No conversations match your search'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {conversations.length === 0 
                      ? 'Start engaging with your prospects to see conversations here.'
                      : 'Try adjusting your search criteria.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.conversationId}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedConversation?.conversationId === conversation.conversationId 
                          ? 'bg-blue-50 border-r-2 border-blue-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Profile Image */}
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {conversation.prospect.linkedinData?.profileImageUrl ? (
                            <img 
                              src={conversation.prospect.linkedinData?.profileImageUrl} 
                              alt={conversation.prospect.linkedinData?.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.prospect.linkedinData?.name}
                            </p>
                            <div className="flex items-center space-x-1">
                              {/* Platform Indicator */}
                              <div className={`p-1 rounded ${
                                conversation.platform === 'email' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-blue-100 text-blue-600'
                              }`}>
                                {conversation.platform === 'email' ? (
                                  <Mail className="h-3 w-3" />
                                ) : (
                                  <Linkedin className="h-3 w-3" />
                                )}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(conversation.lastMessage.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          {conversation.prospect.linkedinData?.company && (
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.prospect.linkedinData?.company}
                            </p>
                          )}
                          
                          {/* Show subject for email conversations */}
                          {conversation.platform === 'email' && conversation.lastMessage.subject && (
                            <p className="text-xs text-gray-600 truncate font-medium">
                              Subject: {conversation.lastMessage.subject}
                            </p>
                          )}
                          
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage.type === 'sent' ? 'You: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversation View */}
          <div className={`${selectedConversation ? 'block' : 'hidden lg:block'} flex-1 flex flex-col`}>
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleBackToList}
                        className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {selectedConversation.prospect.linkedinData?.profileImageUrl ? (
                          <img 
                            src={selectedConversation.prospect.linkedinData?.profileImageUrl} 
                            alt={selectedConversation.prospect.linkedinData?.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {selectedConversation.prospect.linkedinData?.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedConversation.platform === 'email' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {selectedConversation.platform === 'email' ? 'Email' : 'LinkedIn'}
                          </div>
                          {selectedConversation.prospect.linkedinData?.company && (
                            <p className="text-sm text-gray-500">
                              {selectedConversation.prospect.linkedinData?.company}
                            </p>
                          )}
                        </div>
                        {selectedConversation.platform === 'email' && selectedConversation.prospect.contactInfo?.email && (
                          <p className="text-sm text-gray-500">
                            {selectedConversation.prospect.contactInfo.email}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {selectedConversation.prospect.linkedinData?.profileUrl && (
                        <a
                          href={selectedConversation.prospect.linkedinData?.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                          title="View LinkedIn Profile"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No messages in this conversation yet.</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'sent'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          {/* Email Subject */}
                          {message.platform === 'email' && message.subject && (
                            <div className={`text-xs font-medium mb-1 pb-1 border-b ${
                              message.type === 'sent' ? 'border-blue-300' : 'border-gray-300'
                            }`}>
                              Subject: {message.subject}
                            </div>
                          )}
                          
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-between mt-1 ${
                            message.type === 'sent' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {message.type === 'sent' && (
                              <div className="ml-2">
                                {getMessageStatusIcon(message)}
                              </div>
                            )}
                          </div>
                          {message.automated && (
                            <div className={`text-xs mt-1 ${
                              message.type === 'sent' ? 'text-blue-200' : 'text-gray-400'
                            }`}>
                              Automated
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  {/* Email Fields */}
                  {selectedConversation.platform === 'email' && (
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                          <input
                            type="email"
                            value={emailTo}
                            onChange={(e) => setEmailTo(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="recipient@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                          <input
                            type="email"
                            value={emailFrom}
                            onChange={(e) => setEmailFrom(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="your@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Email subject"
                          />
                          <button
                            onClick={handleGenerateEmailDraft}
                            disabled={generatingDraft}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 flex items-center"
                            title="Generate AI Draft"
                          >
                            {generatingDraft ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      {selectedConversation.platform === 'email' && !emailSubject && !emailTo && (
                        <div className="mb-2">
                          <button
                            onClick={handleGenerateEmailDraft}
                            disabled={generatingDraft}
                            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generate AI Email Draft
                          </button>
                        </div>
                      )}
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={selectedConversation.platform === 'email' ? 'Type your email message...' : 'Type your message...'}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        !newMessage.trim() || 
                        sendingMessage || 
                        (selectedConversation.platform === 'email' && (!emailSubject.trim() || !emailTo.trim()))
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        selectedConversation.platform === 'email' ? (
                          <Mail className="w-4 h-4" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Press Enter to send{selectedConversation.platform === 'email' ? ' email' : ''}, Shift+Enter for new line
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Select a conversation</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Email Modal */}
        {showNewEmailModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Compose New Email</h3>
                  <button
                    onClick={() => {
                      setShowNewEmailModal(false);
                      setEmailSubject('');
                      setEmailTo('');
                      setEmailFrom('');
                      setNewMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="recipient@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                      <input
                        type="email"
                        value={emailFrom}
                        onChange={(e) => setEmailFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="your@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email subject"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Type your email message..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowNewEmailModal(false);
                      setEmailSubject('');
                      setEmailTo('');
                      setEmailFrom('');
                      setNewMessage('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Handle sending new email
                      setShowNewEmailModal(false);
                      // You would implement prospect selection here
                    }}
                    disabled={!emailTo.trim() || !emailSubject.trim() || !newMessage.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4 mr-2 inline" />
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MessagesPage;