import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/withAuth';
import { getSupabaseClient } from '../../../../lib/supabase';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const userId = req.user.id;
    const { url, sitemap, title, description } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Website URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid URL'
      });
    }

    // In a real implementation, you would:
    // 1. Crawl the website content
    // 2. Parse the sitemap if provided
    // 3. Extract relevant text content
    // 4. Generate a summary

    // For now, we'll create a mock knowledge item
    const websiteContent = `Website Knowledge: ${title || url}

URL: ${url}
${sitemap ? `Sitemap: ${sitemap}` : ''}
${description ? `Description: ${description}` : ''}

This website knowledge will be used by the AI to understand your business, products, and services when generating personalized messages for prospects.

Key information extracted:
- Business overview and value propositions
- Product/service descriptions
- Company background and expertise
- Target audience and market positioning

The AI will reference this information to create more relevant and personalized outreach messages.`;

    const supabase = getSupabaseClient();
    const { data: item, error } = await supabase
      .from('user_knowledge')
      .insert([{
        user_id: userId,
        title: title || `Website: ${new URL(url).hostname}`,
        content: websiteContent,
        category: 'website',
        type: 'website',
        source_url: url,
        metadata: {
          url,
          sitemap,
          description,
          crawled_at: new Date().toISOString(),
          pages_found: sitemap ? 'Multiple pages via sitemap' : 'Single page'
        },
        tags: ['website', 'business', 'content'],
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating website knowledge:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add website knowledge'
      });
    }

    console.log(`Website knowledge added for user: ${req.user.email} - URL: ${url}`);

    res.json({
      success: true,
      message: 'Website knowledge added successfully',
      item
    });

  } catch (error) {
    console.error('Error adding website knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add website knowledge'
    });
  }
}

export default withAuth(handler);