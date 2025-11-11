import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useWebSocket } from '../contexts/WebSocketContext';
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
  _id?: string;
  id?: string;
  linkedinData?: {
    name?: string;
    profileImageUrl?: string;
    company?: string;
    profileUrl?: string;
  };
  linkedin_data?: {
    name?: string;
    profileImageUrl?: string;
    company?: string;
    profileUrl?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  contact_info?: {
    email?: string;
    phone?: string;
  };
}

interface Message {
  _id?: string;
  id?: string;
  prospectId?: Prospect;
  prospect_id?: string;
  prospects?: Prospect;
  conversationId?: string;
  conversation_id?: string;
  type: 'sent' | 'received';
  messageType?: string;
  message_type?: string;
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
  email_data?: {
    to: string;
    from: string;
    cc?: string[];
    bcc?: string[];
    messageId?: string;
  };
  status: string;
  sentAt?: string;
  sent_at?: string;
  readAt?: string;
  read_at?: string;
  createdAt?: string;
  created_at?: string;
  automated: boolean;
}

interface Conversation {
  conversationId?: string;
  conversation_id?: string;
  prospect?: Prospect;
  prospects?: Prospect;
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
  const [activePlatform, setActivePlatform] = useState<'linkedin' | 'email'>('linkedin');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [showNewEmailModal, setShowNewEmailModal] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'conversations' | 'sent'>('conversations');
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [sentEmailsLoading, setSentEmailsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const hasAutoLoadedRef = React.useRef<{linkedin: boolean, email: boolean}>({linkedin: false, email: false});
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const { socket } = useWebSocket();

  useEffect(() => {
    fetchConversations();
    fetchEmailAccounts();
    
    // Listen for new LinkedIn messages from webhook
    if (socket && socket.connected) {
      socket.on('newLinkedInMessage', (data) => {
        console.log('New LinkedIn message received:', data);
        
        // Skip if this is a message we sent (is_sender = true)
        if (data.is_sender === true) {
          return;
        }
        
        // If viewing this chat, add message to current messages
        const currentChatId = selectedConversation?.conversationId || selectedConversation?.conversation_id;
        if (currentChatId === data.chat_id) {
          const newMsg = {
            id: data.message_id,
            content: data.message || (data.attachments?.length > 0 ? '[Attachment]' : ''),
            type: 'received' as const,
            platform: 'linkedin' as const,
            status: 'delivered',
            created_at: data.timestamp,
            automated: false
          };
          setMessages(prev => {
            // Prevent duplicate messages
            if (prev.some(m => m.id === data.message_id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
        
        // Update conversation last message without full reload
        setConversations(prev => prev.map(conv => {
          const convId = conv.conversationId || conv.conversation_id;
          if (convId === data.chat_id) {
            return {
              ...conv,
              lastMessage: {
                content: data.message || '[Attachment]',
                created_at: data.timestamp,
                type: 'received' as const,
                status: 'delivered',
                platform: 'linkedin' as const,
                automated: false
              },
              unreadCount: currentChatId === data.chat_id ? conv.unreadCount : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        }));
      });
    }
    
    return () => {
      if (socket && socket.connected) {
        socket.off('newLinkedInMessage');
      }
    };
  }, [socket, selectedConversation]);

  // Auto-load messages when LinkedIn or Sales Nav tab is selected (only once per session)
  useEffect(() => {
    if (activeTab === 'conversations' && activePlatform === 'linkedin' && !hasAutoLoadedRef.current.linkedin) {
      hasAutoLoadedRef.current.linkedin = true;
      handleSyncLinkedInMessages();
    } else if (activeTab === 'conversations' && activePlatform === 'email' && !hasAutoLoadedRef.current.email) {
      hasAutoLoadedRef.current.email = true;
      handleSyncLinkedInMessages();
    }
  }, [activePlatform, activeTab]);

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentEmails();
    }
  }, [activeTab, activePlatform]);

  // Auto-scroll to bottom when messages change or loading completes
  useEffect(() => {
    if (!messagesLoading && messagesContainerRef.current && messages.length > 0) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [messages, messagesLoading]);

  const fetchEmailAccounts = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user?.email_accounts) {
          setEmailAccounts(data.user.email_accounts);
          if (data.user.email_accounts.length > 0) {
            setEmailFrom(data.user.email_accounts[0].email);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching email accounts:', err);
    }
  };

  const fetchSentEmails = async () => {
    try {
      setSentEmailsLoading(true);
      const params = new URLSearchParams();
      if (activePlatform === 'email') {
        params.append('platform', 'email');
      }
      
      const response = await fetch(`/api/messages/sent-emails?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSentEmails(data.emails || []);
        }
      }
    } catch (err) {
      console.error('Error fetching sent emails:', err);
    } finally {
      setSentEmailsLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const platformParam = `&platform=${activePlatform}`;
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
        const dbConversations = data.conversations || [];
        
        // Merge with existing LinkedIn conversations from Unipile
        setConversations(prev => {
          const linkedinConvs = prev.filter(c => c.platform === 'linkedin');
          const dbConvIds = new Set(dbConversations.map((c: any) => c.conversationId || c.conversation_id));
          const uniqueLinkedinConvs = linkedinConvs.filter(c => !dbConvIds.has(c.conversationId || c.conversation_id));
          return [...uniqueLinkedinConvs, ...dbConversations];
        });
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

  const fetchMessages = async (conversationId: string, platform?: string) => {
    try {
      setMessagesLoading(true);
      setError('');
      
      // Use Unipile API for LinkedIn conversations
      if (platform === 'linkedin') {
        const messagesResponse = await fetch(
          `/api/unipile/messages?chat_id=${conversationId}`,
          {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          }
        );
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          
          if (messagesData.success && messagesData.data?.items) {
            // Transform Unipile messages to our format
            const transformedMessages = messagesData.data.items.map((msg: any) => ({
              id: msg.id,
              content: msg.body || msg.text || '',
              type: msg.is_sender ? 'sent' : 'received',
              platform: 'linkedin',
              status: 'delivered',
              created_at: msg.timestamp || msg.date,
              automated: false
            })).reverse(); // Reverse to show oldest first
            
            setMessages(transformedMessages);
            setMessagesLoading(false);
            return;
          }
        }
      }
      
      // Fallback to database API for email or if Unipile fails
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
          const msgId = msg._id || msg.id;
          if (msgId) markMessageAsRead(msgId);
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

  const handleSyncLinkedInMessages = async () => {
    setSyncingEmails(true);
    setSyncStatus('Fetching LinkedIn chats...');
    setError('');
    
    try {
      // Get user's Unipile account ID from profile
      const profileResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const profileData = await profileResponse.json();
      const accountId = profileData.user?.unipile_account_id;
      
      if (!accountId) {
        throw new Error('LinkedIn account not connected via Unipile');
      }
      
      // Fetch chats from Unipile
      const chatsResponse = await fetch(`/api/unipile/chats?account_id=${accountId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!chatsResponse.ok) {
        throw new Error('Failed to fetch LinkedIn chats');
      }
      
      const chatsData = await chatsResponse.json();
      
      if (chatsData.success && chatsData.data?.items) {
        // Transform Unipile chats to conversation format
        const linkedinConversations = chatsData.data.items.map((chat: any) => ({
          conversationId: chat.id,
          conversation_id: chat.id,
          prospect: {
            linkedin_data: {
              name: chat.attendee?.name || 'Unknown',
              profileImageUrl: chat.attendee?.pictureUrl,
              profileUrl: chat.attendee?.profileUrl,
              company: chat.attendee?.occupation
            }
          },
          platform: 'linkedin' as const,
          lastMessage: {
            content: chat.last_message?.body || '',
            created_at: chat.timestamp || chat.last_message?.date,
            type: chat.last_message?.is_sender ? 'sent' : 'received',
            status: 'delivered'
          },
          unreadCount: chat.unread_count || 0,
          totalMessages: 1
        }));
        
        setConversations(prev => {
          const existingIds = new Set(prev.map(c => c.conversationId || c.conversation_id));
          const newConvs = linkedinConversations.filter((c: any) => !existingIds.has(c.conversationId));
          return [...newConvs, ...prev];
        });
        
        setSyncStatus('Sync complete!');
        setTimeout(() => setSyncStatus(''), 3000);
      }
    } catch (err) {
      console.error('Error syncing LinkedIn chats:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync LinkedIn chats');
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
          prospectId: (selectedConversation.prospect || selectedConversation.prospects)?._id,
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
        const prospect = selectedConversation.prospect || selectedConversation.prospects;
        const contactInfo = prospect?.contactInfo || prospect?.contact_info;
        setEmailSubject(data.draft.subject);
        setNewMessage(data.draft.content);
        setEmailTo(data.draft.to || contactInfo?.email || '');
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
      const selectedConvId = selectedConversation.conversationId || selectedConversation.conversation_id;
      
      // Use Unipile API for LinkedIn messages
      if (selectedConversation.platform === 'linkedin') {
        const selectedProspect = selectedConversation.prospect || selectedConversation.prospects;
        const profileResponse = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const profileData = await profileResponse.json();
        const accountId = profileData.user?.unipile_account_id;
        
        const response = await fetch('/api/unipile/send-message', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: selectedConvId,
            text: newMessage.trim(),
            prospect_id: selectedProspect?._id || selectedProspect?.id,
            account_id: accountId,
            recipient_name: (selectedProspect?.linkedinData || selectedProspect?.linkedin_data)?.name
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send message');
        }

        const data = await response.json();
        console.log('LinkedIn message send:', data);
        if (data.success) {
          const sentMessageId = data.data.message_id || Date.now().toString();
          const newMsg = {
            id: sentMessageId,
            content: newMessage.trim(),
            type: 'sent' as const,
            platform: 'linkedin' as const,
            status: 'delivered',
            created_at: new Date().toISOString(),
            automated: false
          };
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            if (prev.some(m => m.id === sentMessageId)) {
              return prev;
            }
            return [...prev, newMsg];
          });
          setNewMessage('');
          setError('');
        }
      } else {
        // Use database API for email messages
        const selectedProspect = selectedConversation.prospect || selectedConversation.prospects;
        const requestBody: any = {
          prospect_id: selectedProspect?._id || selectedProspect?.id,
          content: newMessage.trim(),
          conversation_id: selectedConvId,
          message_type: 'manual',
          platform: selectedConversation.platform
        };

        const contactInfo = selectedProspect?.contactInfo || selectedProspect?.contact_info;
        requestBody.subject = emailSubject.trim();
        requestBody.to = emailTo || contactInfo?.email;
        requestBody.from = emailFrom;

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
          setMessages(prev => [...prev, data.data]);
          setNewMessage('');
          setEmailSubject('');
          await fetchConversations();
          setError('');
        } else {
          throw new Error(data.error || 'Failed to send message');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    const prospect = conversation.prospect || conversation.prospects;
    const convId = conversation.conversationId || conversation.conversation_id || '';
    const contactInfo = prospect?.contactInfo || prospect?.contact_info;
    
    if (conversation.platform === 'email') {
      setEmailTo(contactInfo?.email || '');
      if (emailAccounts.length > 0 && !emailFrom) {
        setEmailFrom(emailAccounts[0].email);
      }
    }
    fetchMessages(convId, conversation.platform);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setMessages([]);
    setNewMessage('');
    setEmailSubject('');
    setEmailTo('');
    setEmailFrom('');
  };

  // Send email from the "Compose New Email" modal (ad-hoc email)
  const handleSendModalEmail = async () => {
    if (!emailTo.trim() || !emailSubject.trim() || !newMessage.trim() || !emailFrom.trim()) {
      setError('To, from, subject and message are required');
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('/api/messages/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailTo.trim(),
          from: emailFrom.trim(),
          subject: emailSubject.trim(),
          content: newMessage.trim()
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      setShowNewEmailModal(false);
      setEmailSubject('');
      setEmailTo('');
      setEmailFrom('');
      setNewMessage('');
      setError('');
      
      if (activeTab === 'sent') {
        await fetchSentEmails();
      } else {
        await fetchConversations();
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSendingMessage(false);
    }
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
    const platformMatch = conversation.platform === activePlatform;
    const prospect = conversation.prospect || conversation.prospects;
    const linkedinData = prospect?.linkedinData || prospect?.linkedin_data;
    const searchMatch = 
      linkedinData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (linkedinData?.company && 
         linkedinData?.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
                    onClick={handleSyncLinkedInMessages}
                    disabled={syncingEmails}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md disabled:opacity-50"
                    title="Sync LinkedIn Messages"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncingEmails ? 'animate-spin' : ''}`} />
                  </button>
                  {syncStatus && (
                    <span className="text-xs text-gray-600">{syncStatus}</span>
                  )}
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
              
              {/* Tab Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setActiveTab('conversations')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'conversations'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Conversations
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'sent'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Emails
                </button>
              </div>

              {/* Platform Selector - Only show for conversations tab */}
              {activeTab === 'conversations' && (
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
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
                    <Linkedin className="h-4 w-4 mr-1" />
                    Sales Nav.
                  </button>
                </div>
              )}

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

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
              {activeTab === 'conversations' ? 
                filteredConversations.length === 0 ? (
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
                  {filteredConversations.map((conversation) => {
                    const convId = conversation.conversationId || conversation.conversation_id;
                    const prospect = conversation.prospect || conversation.prospects;
                    const selectedConvId = selectedConversation?.conversationId || selectedConversation?.conversation_id;
                    
                    return (
                    <div
                      key={convId}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedConvId === convId 
                          ? 'bg-blue-50 border-r-2 border-blue-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Profile Image */}
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {((prospect?.linkedinData || prospect?.linkedin_data)?.profileImageUrl) ? (
                            <img 
                              src={(prospect?.linkedinData || prospect?.linkedin_data)?.profileImageUrl} 
                              alt={(prospect?.linkedinData || prospect?.linkedin_data)?.name}
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
                              {(prospect?.linkedinData || prospect?.linkedin_data)?.name}
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
                                {formatMessageTime(conversation.lastMessage.createdAt || conversation.lastMessage.created_at || '')}
                              </span>
                            </div>
                          </div>
                          
                          {(prospect?.linkedinData || prospect?.linkedin_data)?.company && (
                            <p className="text-xs text-gray-500 truncate">
                              {(prospect?.linkedinData || prospect?.linkedin_data)?.company}
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
                    );
                  })}
                </div>
              ) : (
                /* Sent Emails List */
                sentEmailsLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                    <p className="mt-2 text-sm text-gray-600">Loading sent emails...</p>
                  </div>
                ) : sentEmails.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No sent emails</h3>
                    <p className="mt-1 text-sm text-gray-500">Emails you send will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {sentEmails.map((email) => (
                      <div key={email.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Mail className="h-4 w-4 text-green-600" />
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {email.subject}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">To: {email.to_email}</p>
                            <p className="text-xs text-gray-500">From: {email.from_email}</p>
                            <p className="text-sm text-gray-600 truncate mt-1">{email.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatMessageTime(email.sent_at)}
                            </p>
                          </div>
                          <div className="ml-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Conversation View */}
          <div className={`${selectedConversation ? 'block' : 'hidden lg:block'} flex-1 flex flex-col`}>
            {selectedConversation ? (() => {
              const selectedProspect = selectedConversation.prospect || selectedConversation.prospects;
              const selectedConvId = selectedConversation.conversationId || selectedConversation.conversation_id || '';
              
              return (
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
                        {((selectedProspect?.linkedinData || selectedProspect?.linkedin_data)?.profileImageUrl) ? (
                          <img 
                            src={(selectedProspect?.linkedinData || selectedProspect?.linkedin_data)?.profileImageUrl} 
                            alt={(selectedProspect?.linkedinData || selectedProspect?.linkedin_data)?.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {(selectedProspect?.linkedinData || selectedProspect?.linkedin_data)?.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedConversation.platform === 'email' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {selectedConversation.platform === 'email' ? 'Email' : 'LinkedIn'}
                          </div>
                          {(selectedProspect?.linkedinData || selectedProspect?.linkedin_data)?.company && (
                            <p className="text-sm text-gray-500">
                              {(selectedProspect?.linkedinData || selectedProspect?.linkedin_data)?.company}
                            </p>
                          )}
                        </div>
                        {selectedConversation.platform === 'email' && (selectedProspect?.contactInfo || selectedProspect?.contact_info)?.email && (
                          <p className="text-sm text-gray-500">
                            {(selectedProspect?.contactInfo || selectedProspect?.contact_info)?.email}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {(selectedProspect?.linkedinData || selectedProspect?.linkedin_data)?.profileUrl && (
                        <a
                          href={(selectedProspect?.linkedinData || selectedProspect?.linkedin_data)?.profileUrl}
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
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-320px)]">
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
                    messages.map((message) => {
                      const msgId = message._id || message.id;
                      const msgCreatedAt = message.createdAt || message.created_at || '';
                      
                      return (
                      <div
                        key={msgId}
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
                              {formatMessageTime(msgCreatedAt)}
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
                      );
                    })
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
                          <select
                            value={emailFrom}
                            onChange={(e) => setEmailFrom(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select email account</option>
                            {emailAccounts.map((account) => (
                              <option key={account.email} value={account.email}>
                                {account.email} ({account.provider})
                              </option>
                            ))}
                          </select>
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
                        (selectedConversation.platform === 'email' && (!emailSubject.trim() || !emailTo.trim() || !emailFrom.trim()))
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
              );
            })() : (
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
                      <select
                        value={emailFrom}
                        onChange={(e) => setEmailFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select email account</option>
                        {emailAccounts.map((account) => (
                          <option key={account.email} value={account.email}>
                            {account.email} ({account.provider})
                          </option>
                        ))}
                      </select>
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
                    onClick={handleSendModalEmail}
                    disabled={sendingMessage || !emailTo.trim() || !emailFrom.trim() || !emailSubject.trim() || !newMessage.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2 inline" />
                    )}
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