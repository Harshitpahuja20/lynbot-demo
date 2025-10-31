import { NextApiResponse } from "next";
import {
  withAuth,
  AuthenticatedRequest,
} from "../../../lib/middleware/withAuth";
import { prospectOperations, campaignOperations } from "../../../lib/database";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return handleGetProspects(req, res);
    case "POST":
      return handleCreateProspect(req, res);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`,
      });
  }
}

async function handleGetProspects(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  try {
    const userId = req.user.id;

    // sanitize query params
    const pageParam =
      typeof req.query.page === "string"
        ? req.query.page
        : String(req.query.page?.[0] ?? "1");
    const limitParam =
      typeof req.query.limit === "string"
        ? req.query.limit
        : String(req.query.limit?.[0] ?? "20");

    const page = Math.max(
      1,
      Number.isFinite(Number(pageParam)) ? Number(pageParam) : 1
    );
    const limit = Math.min(
      200,
      Math.max(1, Number.isFinite(Number(limitParam)) ? Number(limitParam) : 20)
    );

    const search = (req.query.search as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const campaignId = (req.query.campaignId as string) || undefined;

    const { items, total } = await prospectOperations.findByUserId(userId, {
      page,
      limit,
      search,
      status,
      campaignId,
    });

    return res.status(200).json({
      success: true,
      prospects: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching prospects:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch prospects",
    });
  }
}

async function handleCreateProspect(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  try {
    const userId = req.user.id;

    const { campaignId, linkedinData, contactInfo } = req.body;

    // Validation
    if (!campaignId || !linkedinData?.profileUrl || !linkedinData?.name) {
      return res.status(400).json({
        success: false,
        error: "Campaign ID, LinkedIn profile URL, and name are required",
      });
    }

    // Verify campaign belongs to user
    const campaign = await campaignOperations.findById(campaignId, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
    }

    // Create new prospect
    const prospect = await prospectOperations.create({
      user_id: userId,
      campaign_id: campaignId,
      linkedin_data: {
        profileUrl: linkedinData.profileUrl,
        name: linkedinData.name,
        firstName: linkedinData.firstName || linkedinData.name.split(" ")[0],
        lastName:
          linkedinData.lastName ||
          linkedinData.name.split(" ").slice(1).join(" "),
        headline: linkedinData.headline,
        title: linkedinData.title,
        company: linkedinData.company,
        location: linkedinData.location,
        industry: linkedinData.industry,
        connectionLevel: linkedinData.connectionLevel || "3rd",
        profileImageUrl: linkedinData.profileImageUrl,
        summary: linkedinData.summary,
      },
      contact_info: contactInfo || {},
      status: "new",
      interactions: [],
      automation: {
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
        pauseReason: null,
      },
      scoring: {
        leadScore: 0,
        factors: {
          titleMatch: 0,
          companyMatch: 0,
          locationMatch: 0,
          industryMatch: 0,
          connectionLevel: 0,
          profileCompleteness: 0,
          activityLevel: 0,
        },
        lastCalculated: null,
      },
      tags: [],
      notes: [],
      custom_fields: {},
      source: "manual" as const,
      is_active: true,
      last_updated: new Date().toISOString(),
    });

    // Update campaign statistics
    const updatedCampaign = await campaignOperations.findById(
      campaignId,
      userId
    );
    if (updatedCampaign) {
      const prev = updatedCampaign.statistics || { totalProspects: 0 };
      await campaignOperations.update(campaignId, userId, {
        statistics: { ...prev, totalProspects: (prev.totalProspects || 0) + 1 },
      });
    }

    console.log(`New prospect added: ${linkedinData.name}`);

    res.status(201).json({
      success: true,
      message: "Prospect created successfully",
      prospect,
    });
  } catch (error) {
    console.error("Error creating prospect:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create prospect",
    });
  }
}

export default withAuth(handler);
