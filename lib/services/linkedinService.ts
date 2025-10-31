interface LinkedInCredentials {
  email: string;
  encryptedPassword: string;
}

interface SearchCriteria {
  keywords?: string;
  location?: string;
  company?: string;
  title?: string;
  industry?: string;
  connectionLevel?: string;
  currentCompany?: string;
  pastCompany?: string;
  school?: string;
  profileLanguage?: string;
  serviceCategory?: string;
  nonprofit?: string;
  salesNavigatorUrl?: string;
  customFilters?: any;
}

interface ProspectData {
  profileUrl: string;
  name: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  title?: string;
  company?: string;
  location?: string;
  industry?: string;
  connectionLevel?: string;
  profileImageUrl?: string;
  summary?: string;
}

class LinkedInService {
  private isLoggedIn: boolean = false;

  async decryptPassword(encryptedPassword: string): Promise<string> {
    // In a real implementation, you would decrypt the password
    // For now, we'll assume it's already decrypted for demo purposes
    return encryptedPassword;
  }

  async login(credentials: LinkedInCredentials): Promise<boolean> {
    try {
      // Simulate login validation
      if (!credentials.email || !credentials.encryptedPassword) {
        return false;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        return false;
      }

      // Simulate successful login for demo purposes
      this.isLoggedIn = true;
      return true;
      
    } catch (error) {
      console.error('LinkedIn login failed:', error);
      return false;
    }
  }

  buildSearchUrl(criteria: SearchCriteria): string {
    const baseUrl = 'https://www.linkedin.com/search/results/people/';
    const params = new URLSearchParams();

    if (criteria.keywords) {
      params.append('keywords', criteria.keywords);
    }
    
    if (criteria.location) {
      params.append('geoUrn', `["${criteria.location}"]`);
    }
    
    if (criteria.currentCompany) {
      params.append('currentCompany', `["${criteria.currentCompany}"]`);
    }
    
    if (criteria.title) {
      params.append('title', `["${criteria.title}"]`);
    }
    
    if (criteria.industry) {
      params.append('industry', `["${criteria.industry}"]`);
    }
    
    if (criteria.connectionLevel && criteria.connectionLevel !== 'all') {
      params.append('network', `["${criteria.connectionLevel.toUpperCase()}"]`);
    }
    
    if (criteria.pastCompany) {
      params.append('pastCompany', `["${criteria.pastCompany}"]`);
    }
    
    if (criteria.school) {
      params.append('school', `["${criteria.school}"]`);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  generateMockProspects(criteria: SearchCriteria, maxResults: number): ProspectData[] {
    const prospects: ProspectData[] = [];
    
    // Sample prospect data based on search criteria
    const sampleNames = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
      'Jessica Miller', 'Christopher Taylor', 'Amanda Anderson', 'Matthew Thomas', 'Ashley Jackson',
      'Daniel White', 'Jennifer Harris', 'Ryan Martin', 'Michelle Thompson', 'Kevin Garcia',
      'Lisa Rodriguez', 'Brian Martinez', 'Nicole Robinson', 'Jason Clark', 'Stephanie Lewis'
    ];

    const sampleTitles = [
      'Software Engineer', 'Marketing Manager', 'Sales Director', 'Product Manager', 'Data Analyst',
      'Business Development Manager', 'Operations Manager', 'HR Director', 'Financial Analyst', 'Project Manager',
      'Senior Developer', 'Marketing Specialist', 'Account Executive', 'UX Designer', 'Content Manager'
    ];

    const sampleCompanies = [
      'Tech Solutions Inc', 'Global Marketing Corp', 'Innovation Labs', 'Digital Dynamics', 'Future Systems',
      'Creative Agency', 'Data Insights Co', 'Business Growth Partners', 'Strategic Solutions', 'Modern Enterprises'
    ];

    const sampleLocations = [
      'San Francisco, CA', 'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Austin, TX',
      'Seattle, WA', 'Boston, MA', 'Denver, CO', 'Atlanta, GA', 'Miami, FL'
    ];

    const sampleIndustries = [
      'Technology', 'Marketing', 'Finance', 'Healthcare', 'Education',
      'Consulting', 'Manufacturing', 'Retail', 'Real Estate', 'Media'
    ];

    for (let i = 0; i < Math.min(maxResults, 25); i++) {
      const name = sampleNames[i % sampleNames.length];
      const nameParts = name.split(' ');
      const title = criteria.title || sampleTitles[i % sampleTitles.length];
      const company = criteria.currentCompany || sampleCompanies[i % sampleCompanies.length];
      const location = criteria.location || sampleLocations[i % sampleLocations.length];
      const industry = criteria.industry || sampleIndustries[i % sampleIndustries.length];

      prospects.push({
        profileUrl: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '-')}-${i + 1}`,
        name: name,
        firstName: nameParts[0],
        lastName: nameParts[1] || '',
        headline: `${title} at ${company}`,
        title: title,
        company: company,
        location: location,
        industry: industry,
        connectionLevel: '3rd',
        profileImageUrl: `https://images.unsplash.com/photo-${1500000000 + i}?w=150&h=150&fit=crop&crop=face`,
        summary: `Experienced ${title.toLowerCase()} with expertise in ${industry.toLowerCase()}. Passionate about driving growth and innovation.`
      });
    }

    return prospects;
  }

  async searchProspects(criteria: SearchCriteria, maxResults: number = 25): Promise<ProspectData[]> {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in to LinkedIn');
    }

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock prospects based on search criteria
      const prospects = this.generateMockProspects(criteria, maxResults);
      
      return prospects;
      
    } catch (error) {
      console.error('LinkedIn search failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // No browser to close in mock implementation
    this.isLoggedIn = false;
  }
}

export default LinkedInService;