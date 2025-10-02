import { getSupabaseClient, getSupabaseAdminClient } from './supabase'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  password_hash: string
  first_name: string
  last_name: string
  company?: string
  role: 'user' | 'admin' | 'premium'
  subscription: {
    plan: 'free' | 'full_access'
    status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
    startDate?: string
    endDate?: string
    nextBillingDate?: string
    amount?: number
  }
  linkedin_accounts: Array<{
    email: string
    encryptedPassword: string
    isActive: boolean
    lastLogin?: string
    accountHealth: {
      status: 'healthy' | 'warning' | 'restricted' | 'banned'
      lastCheck?: string
      restrictions: string[]
    }
    dailyLimits: {
      connections: number
      messages: number
      profileViews: number
    }
    dailyUsage: {
      connections: number
      messages: number
      profileViews: number
      lastReset: string
    }
  }>
  email_accounts: Array<{
    email: string
    encryptedPassword?: string
    provider: 'gmail' | 'outlook' | 'smtp'
    smtpSettings?: {
      host: string
      port: number
      secure: boolean
    }
    imapSettings?: {
      host: string
      port: number
      secure: boolean
    }
    isActive: boolean
    lastUsed?: string
    lastSyncAt?: string
    dailyLimits: {
      emails: number
    }
    dailyUsage: {
      emails: number
      lastReset: string
    }
    accountHealth: {
      status: 'healthy' | 'warning' | 'restricted' | 'banned'
      lastCheck?: string
      restrictions: string[]
    }
  }>
  api_keys: {
    openai?: string
    encryptedOpenAI?: string
    perplexity?: string
    encryptedPerplexity?: string
    claude?: string
    encryptedClaude?: string
  }
  settings: {
    timezone: string
    workingHours: { start: number; end: number }
    workingDays: number[]
    aiProvider: {
      provider: 'openai' | 'perplexity' | 'claude'
      model: string
      temperature: number
      maxTokens: number
    }
    automation: {
      enabled: boolean
      connectionRequests: { enabled: boolean }
      welcomeMessages: { enabled: boolean }
      followUpMessages: { enabled: boolean }
      profileViews: { enabled: boolean }
      emailSending: { enabled: boolean }
      emailSending: { enabled: boolean }
    }
    notifications: {
      email: boolean
      webhook: boolean
    }
  }
  usage: {
    totalConnections: number
    totalMessages: number
    totalCampaigns: number
    totalProspects: number
  }
  is_active: boolean
  last_login?: string
  email_verified: boolean
  onboarding_complete: boolean
  email_verification_token?: string
  email_verification_expires?: string
  password_reset_token?: string
  password_reset_expires?: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  search_criteria: {
    keywords?: string
    location?: string
    company?: string
    title?: string
    industry?: string
    connectionLevel?: string
    currentCompany?: string
    pastCompany?: string
    school?: string
    profileLanguage?: string
    serviceCategory?: string
    nonprofit?: string
    salesNavigatorUrl?: string
    customFilters?: any
  }
  message_templates: {
    // AI-generated conversation starters are configured here
    connectionRequest: {
      enabled: boolean
      template?: string
      tone: 'professional' | 'casual' | 'friendly' | 'direct'
      useAI: boolean
      customPrompt?: string
    }
    welcomeMessage: {
      enabled: boolean
      template?: string
      tone: 'professional' | 'casual' | 'friendly' | 'direct'
      useAI: boolean
      customPrompt?: string
      delay: number
    }
    followUpSequence: Array<{
      order: number
      template?: string
      tone: 'professional' | 'casual' | 'friendly' | 'direct'
      useAI: boolean
      customPrompt?: string
      delay: number
      enabled: boolean
    }>
    emailTemplates: {
      coldEmail: {
        enabled: boolean
        template?: string
        tone: 'professional' | 'casual' | 'friendly' | 'direct'
        useAI: boolean
        customPrompt?: string
        delay: number
      }
      followUpEmail: {
        enabled: boolean
        template?: string
        tone: 'professional' | 'casual' | 'friendly' | 'direct'
        useAI: boolean
        customPrompt?: string
        delay: number
      }
    }
  }
  automation: {
    enabled: boolean
    dailyLimits: {
      connections: number
      messages: number
      emails: number
    }
    timing: {
      workingHours: { start: number; end: number }
      workingDays: number[]
      randomDelay: { min: number; max: number }
    }
    withdrawInvitations: {
      enabled: boolean
      afterDays: number
    }
    emailSending: {
      enabled: boolean
      dailyLimit: number
    }
  }
  statistics: {
    totalProspects: number
    connectionsSent: number
    connectionsAccepted: number
    messagesSent: number
    messagesReplied: number
    profileViews: number
    acceptanceRate: number
    responseRate: number
    lastActivity?: string
  }
  integrations: {
    webhooks: Array<{
      name: string
      url: string
      events: string[]
      enabled: boolean
      secret?: string
    }>
    zapier: { enabled: boolean; webhookUrl?: string }
    make: { enabled: boolean; webhookUrl?: string }
    n8n: { enabled: boolean; webhookUrl?: string }
  }
  tags: string[]
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Prospect {
  id: string
  user_id: string
  campaign_id: string
  linkedin_data: {
    profileUrl: string
    linkedinId?: string
    name: string
    firstName?: string
    lastName?: string
    headline?: string
    title?: string
    company?: string
    location?: string
    industry?: string
    connectionLevel?: string
    profileImageUrl?: string
    backgroundImageUrl?: string
    summary?: string
    experience?: Array<{
      title: string
      company: string
      duration: string
      description: string
    }>
    education?: Array<{
      school: string
      degree: string
      field: string
      duration: string
    }>
    skills?: string[]
    languages?: string[]
    mutualConnections?: number
    followers?: number
    connections?: number
  }
  contact_info: {
    email?: string
    phone?: string
    website?: string
    twitter?: string
    otherSocial?: any
  }
  status: 'new' | 'connection_pending' | 'connection_sent' | 'connected' | 'connection_failed' | 'connection_declined' | 'message_sent' | 'message_replied' | 'message_failed' | 'follow_up_sent' | 'follow_up_replied' | 'unresponsive' | 'qualified' | 'not_qualified' | 'archived'
  interactions: Array<{
    type: 'connection_request' | 'message' | 'follow_up' | 'profile_view' | 'note'
    content?: string
    timestamp: string
    response?: string
    responseTimestamp?: string
    automated: boolean
    jobId?: string
    metadata?: any
  }>
  automation: {
    connectionRequestSent: boolean
    connectionRequestDate?: string | null
    welcomeMessageSent: boolean
    welcomeMessageDate?: string | null
    followUpsSent: number
    lastFollowUpDate?: string | null
    nextScheduledAction?: 'connection_request' | 'welcome_message' | 'follow_up' | 'withdraw_invitation' | null
    nextScheduledDate?: string | null
    automationPaused: boolean
    pauseReason?: string | null
    coldEmailSent: boolean
    coldEmailDate?: string | null
    emailFollowUpsSent: number
    lastEmailFollowUpDate?: string | null
  }
  scoring: {
    leadScore: number
    factors: {
      titleMatch: number
      companyMatch: number
      locationMatch: number
      industryMatch: number
      connectionLevel: number
      profileCompleteness: number
      activityLevel: number
    }
    lastCalculated?: string | null
  }
  tags: string[]
  notes: Array<{
    content: string
    author: string
    timestamp: string
    type: 'note' | 'reminder' | 'task'
  }>
  custom_fields: any
  source: 'search' | 'import' | 'manual' | 'sales_navigator'
  search_query?: string
  is_active: boolean
  last_updated: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  user_id: string
  prospect_id: string
  campaign_id?: string
  conversation_id: string
  type: 'sent' | 'received'
  message_type: 'connection_request' | 'welcome' | 'follow_up' | 'manual' | 'auto_reply' | 'cold_email' | 'email_follow_up'
  content: string
  subject?: string
  platform: 'linkedin' | 'email' | 'other'
  email_data?: {
    to: string
    from: string
    cc?: string[]
    bcc?: string[]
    messageId?: string
    inReplyTo?: string
    references?: string[]
    threadId?: string
  }
  status: 'draft' | 'sending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed'
  linkedin_message_id?: string
  thread_id?: string
  automated: boolean
  ai_generated: boolean
  ai_prompt?: string
  template_used?: string
  scheduled_for?: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  replied_at?: string
  failure_reason?: string
  retry_count: number
  metadata: {
    userAgent?: string
    ipAddress?: string
    deviceInfo?: string
    location?: string
    responseTime?: number
    characterCount?: number
    wordCount?: number
  }
  attachments: Array<{
    type: string
    url: string
    filename: string
    size: number
    mimeType: string
  }>
  analytics: {
    opened: boolean
    openedAt?: string
    clickedLinks: Array<{
      url: string
      clickedAt: string
    }>
    responseReceived: boolean
    responseTime?: number
    sentiment: 'positive' | 'neutral' | 'negative'
    leadQuality: 'hot' | 'warm' | 'cold' | 'unqualified'
  }
  tags: string[]
  is_archived: boolean
  is_starred: boolean
  is_important: boolean
  created_at: string
  updated_at: string
}

// User operations
export const userOperations = {
  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async findByEmail(email: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async findById(id: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async update(id: string, updates: Partial<User>) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async findAll(options: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  } = {}) {
    const supabase = getSupabaseClient()
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })

    if (options.search) {
      query = query.or(`email.ilike.%${options.search}%,first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,company.ilike.%${options.search}%`)
    }

    if (options.role && options.role !== 'all') {
      query = query.eq('role', options.role)
    }

    if (options.status && options.status !== 'all') {
      const isActive = options.status === 'active'
      query = query.eq('is_active', isActive)
    }

    query = query.order('created_at', { ascending: false })

    if (options.limit) {
      const from = ((options.page || 1) - 1) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query
    
    if (error) throw error
    return { users: data || [], total: count || 0 }
  },

  async comparePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword)
  },

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(12)
    return bcrypt.hash(password, salt)
  }
}

// Campaign operations
export const campaignOperations = {
  async create(campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('campaigns')
      .insert([campaignData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async findByUserId(userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async findById(id: string, userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async update(id: string, userId: string, updates: Partial<Campaign>) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string, userId: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// Prospect operations
export const prospectOperations = {
  async create(prospectData: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('prospects')
      .insert([prospectData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async findByUserId(userId: string, options?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    campaignId?: string
  }) {
    const supabase = getSupabaseClient()
    let query = supabase
      .from('prospects')
      .select(`
        *,
        campaigns!inner(id, name)
      `)
      .eq('user_id', userId)

    if (options?.search) {
      query = query.or(`linkedin_data->>name.ilike.%${options.search}%,linkedin_data->>company.ilike.%${options.search}%,linkedin_data->>title.ilike.%${options.search}%`)
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    if (options?.campaignId && options.campaignId !== 'all') {
      query = query.eq('campaign_id', options.campaignId)
    }

    query = query.order('created_at', { ascending: false })

    if (options?.limit) {
      const from = ((options.page || 1) - 1) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async findById(id: string, userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('prospects')
      .select(`
        *,
        campaigns!inner(id, name)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async update(id: string, userId: string, updates: Partial<Prospect>) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('prospects')
      .update({ ...updates, last_updated: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        campaigns!inner(id, name)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string, userId: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// Message operations
export const messageOperations = {
  async create(messageData: Omit<Message, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select(`
        *,
        prospects!inner(id, linkedin_data)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async findByUserId(userId: string, options?: {
    conversationId?: string
    page?: number
    limit?: number
  }) {
    const supabase = getSupabaseClient()
    let query = supabase
      .from('messages')
      .select(`
        *,
        prospects!inner(id, linkedin_data)
      `)
      .eq('user_id', userId)

    if (options?.conversationId) {
      query = query.eq('conversation_id', options.conversationId)
      query = query.order('created_at', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (options?.limit) {
      const from = ((options.page || 1) - 1) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async findById(id: string, userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        prospects!inner(id, linkedin_data)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async update(id: string, userId: string, updates: Partial<Message>) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        prospects!inner(id, linkedin_data)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async markAsRead(id: string, userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('messages')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
        analytics: {
          opened: true,
          openedAt: new Date().toISOString()
        }
      })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('type', 'received')
      .select(`
        *,
        prospects!inner(id, linkedin_data)
      `)
      .single()
    
    if (error) throw error
    return data
  }
}