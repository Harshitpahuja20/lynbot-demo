import { NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth'
import { getSupabaseAdminClient } from '../../../lib/supabase'
import { campaignOperations } from '../../../lib/database'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` })
  }

  try {
    const userId = req.user.id

    // Accept either { prospects: [...] } or raw array in body
    const body = req.body
    const items = Array.isArray(body) ? body : Array.isArray(body?.prospects) ? body.prospects : []

    // If a top-level campaignId is provided (body.campaignId or query param), apply it to any items missing campaignId.
    const topLevelCampaignId = typeof body?.campaignId === 'string' && body.campaignId
      ? body.campaignId
      : typeof req.query?.campaignId === 'string' && req.query.campaignId
        ? req.query.campaignId
        : null

    if (topLevelCampaignId) {
      for (const it of items) {
        if (!it.campaignId) it.campaignId = topLevelCampaignId
      }
    }

    if (!items.length) {
      return res.status(400).json({ success: false, error: 'No prospects provided' })
    }

    // Validate each item and collect unique campaignIds
    const campaignIds = new Set<string>()
    for (const it of items) {
      if (!it.campaignId) {
        return res.status(400).json({ success: false, error: 'Each prospect must include campaignId' })
      }
      if (!it.linkedinData?.profileUrl || !it.linkedinData?.name) {
        return res.status(400).json({ success: false, error: 'Each prospect must include linkedinData.profileUrl and linkedinData.name' })
      }
      campaignIds.add(it.campaignId)
    }

    // Verify campaigns belong to user
    const invalidCampaigns: string[] = []
    for (const cid of Array.from(campaignIds)) {
      const campaign = await campaignOperations.findById(cid, userId)
      if (!campaign) invalidCampaigns.push(cid)
    }

    if (invalidCampaigns.length) {
      return res.status(404).json({ success: false, error: `Campaign(s) not found: ${invalidCampaigns.join(', ')}` })
    }

    // Prepare prospect rows for bulk insert
    const rows = items.map((p: any) => ({
      user_id: userId,
      campaign_id: p.campaignId,
      linkedin_data: {
        profileUrl: p.linkedinData.profileUrl,
        name: p.linkedinData.name,
        firstName: p.linkedinData.firstName || p.linkedinData.name.split(' ')[0],
        lastName: p.linkedinData.lastName || p.linkedinData.name.split(' ').slice(1).join(' '),
        headline: p.linkedinData.headline || null,
        title: p.linkedinData.title || null,
        company: p.linkedinData.company || null,
        location: p.linkedinData.location || null,
        industry: p.linkedinData.industry || null,
        connectionLevel: p.linkedinData.connectionLevel || '3rd',
        profileImageUrl: p.linkedinData.profileImageUrl || null,
        summary: p.linkedinData.summary || null
      },
      contact_info: p.contactInfo || {},
      status: p.status || 'new',
      interactions: p.interactions || [],
      automation: p.automation || {
        connectionRequestSent: false,
        connectionRequestDate: null,
        welcomeMessageSent: false,
        welcomeMessageDate: null,
        followUpsSent: 0,
        lastFollowUpDate: null,
        emailFollowUpsSent: 0,
        coldEmailSent: false,
        nextScheduledAction: null,
        nextScheduledDate: null,
        automationPaused: false,
        pauseReason: null
      },
      scoring: p.scoring || {
        leadScore: 0,
        factors: {
          titleMatch: 0,
          companyMatch: 0,
          locationMatch: 0,
          industryMatch: 0,
          connectionLevel: 0,
          profileCompleteness: 0,
          activityLevel: 0
        },
        lastCalculated: null
      },
      tags: p.tags || [],
      notes: p.notes || [],
      custom_fields: p.custom_fields || {},
      source: p.source || 'manual',
      is_active: typeof p.is_active === 'boolean' ? p.is_active : true,
      last_updated: new Date().toISOString()
    }))

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.from('prospects').insert(rows).select()
    if (error) {
      console.error('Bulk insert error', error)
      throw error
    }

    // Update campaign statistics: increment totalProspects per campaign
    const countsByCampaign: Record<string, number> = {}
    for (const r of rows) {
      countsByCampaign[r.campaign_id] = (countsByCampaign[r.campaign_id] || 0) + 1
    }

    for (const cid of Object.keys(countsByCampaign)) {
      try {
        const existing = await campaignOperations.findById(cid, userId)
        if (existing) {
          const prev = existing.statistics || { totalProspects: 0 }
          await campaignOperations.update(cid, userId, {
            statistics: { ...prev, totalProspects: (prev.totalProspects || 0) + countsByCampaign[cid] }
          })
        }
      } catch (err) {
        console.warn('Failed updating campaign stats for', cid, err)
      }
    }

    return res.status(201).json({ success: true, message: 'Prospects saved', count: data?.length || rows.length, prospects: data })
  } catch (err) {
    console.error('Error saving prospects bulk:', err)
    return res.status(500).json({ success: false, error: 'Failed to save prospects' })
  }
}

export default withAuth(handler)
