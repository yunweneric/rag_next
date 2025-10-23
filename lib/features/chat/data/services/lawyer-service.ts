import { BaseAdminService } from '@/lib/shared/data/services/base_admin_service'

interface Lawyer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  specialties: string[];
  location?: string;
  languages: string[];
  rating?: number;
  experienceYears?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LawyerRecommendation {
  id: string
  name: string
  specialties: string[]
  rating: number
  phone?: string
  email?: string
  address?: string
  availability?: string
  experience?: string
  languages?: string[]
  relevanceScore: number
  matchReasons: string[]
}

export interface RecommendationRequest {
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    sources?: Array<{
      content: string
    }>
    userQuestion?: string
  }>
  userQuestion: string
}

export class LawyerService extends BaseAdminService<Lawyer> {
  constructor() {
    super('lawyers')
  }

  async getRecommendations(request: RecommendationRequest): Promise<LawyerRecommendation[]> {
    try {
      // Return sample lawyer recommendations
      const sampleLawyers = [
        {
          id: '1',
          name: 'Dr. Markus Weber',
          specialties: ['family law', 'divorce', 'child custody'],
          rating: 4.8,
          phone: '+41 44 123 4567',
          email: 'markus.weber@law.ch',
          address: 'Bahnhofstrasse 1, 8001 Zürich',
          availability: 'Mon-Fri 9:00-17:00',
          experience: '15+ years',
          languages: ['German', 'English', 'French'],
          image: null,
          location: 'Zurich, Switzerland',
          relevanceScore: 4.5,
          matchReasons: ['Specializes in family law', 'High customer rating']
        },
        {
          id: '2',
          name: 'Maria Rodriguez',
          specialties: ['family law', 'adoption', 'domestic violence'],
          rating: 4.6,
          phone: '+41 44 234 5678',
          email: 'maria.rodriguez@law.ch',
          address: 'Rue du Rhône 10, 1204 Genève',
          availability: 'Mon-Fri 8:30-18:00',
          experience: '12+ years',
          languages: ['French', 'Spanish', 'English'],
          image: null,
          location: 'Geneva, Switzerland',
          relevanceScore: 4.2,
          matchReasons: ['Specializes in family law', 'Extensive experience']
        },
        {
          id: '3',
          name: 'Thomas Schmidt',
          specialties: ['real estate law', 'property disputes', 'construction law'],
          rating: 4.5,
          phone: '+41 44 345 6789',
          email: 'thomas.schmidt@law.ch',
          address: 'Limmatquai 2, 8001 Zürich',
          availability: 'Mon-Fri 9:00-17:30',
          experience: '18+ years',
          languages: ['German', 'English'],
          image: null,
          location: 'Zurich, Switzerland',
          relevanceScore: 3.8,
          matchReasons: ['Specializes in real estate law']
        },
        {
          id: '4',
          name: 'Anna Müller',
          specialties: ['criminal law', 'traffic violations', 'employment law'],
          rating: 4.6,
          phone: '+41 44 456 7890',
          email: 'anna.mueller@law.ch',
          address: 'Bundesplatz 1, 3000 Bern',
          availability: 'Mon-Fri 8:00-18:00',
          experience: '14+ years',
          languages: ['German', 'French', 'Italian'],
          image: null,
          location: 'Bern, Switzerland',
          relevanceScore: 4.0,
          matchReasons: ['Specializes in criminal law', 'High customer rating']
        },
        {
          id: '5',
          name: 'Pierre Dubois',
          specialties: ['corporate law', 'contracts', 'business law'],
          rating: 4.9,
          phone: '+41 44 567 8901',
          email: 'pierre.dubois@law.ch',
          address: 'Place de la Gare 1, 1003 Lausanne',
          availability: 'Mon-Fri 9:00-17:00',
          experience: '20+ years',
          languages: ['French', 'English', 'German'],
          image: null,
          location: 'Lausanne, Switzerland',
          relevanceScore: 4.7,
          matchReasons: ['Specializes in corporate law', 'High customer rating', 'Extensive experience']
        }
      ]

      return sampleLawyers as LawyerRecommendation[]

    } catch (error) {
      console.error('Error in getRecommendations:', error)
      return []
    }
  }

  async getLawyersBySpecialty(specialty: string): Promise<Lawyer[]> {
    try {
      const result = await this.search('specialties', specialty, 'array-contains')
      return result.success ? result.data || [] : []
    } catch (error) {
      console.error('Error fetching lawyers by specialty:', error)
      return []
    }
  }

  async getAllLawyers(): Promise<Lawyer[]> {
    try {
      const result = await this.getAll()
      return result.success ? result.data || [] : []
    } catch (error) {
      console.error('Error fetching all lawyers:', error)
      return []
    }
  }

  private extractLegalTopics(conversationHistory: any[], userQuestion: string): string[] {
    const topics: string[] = []
    const allText = [...conversationHistory.map(msg => msg.content), userQuestion].join(' ').toLowerCase()
    
    const legalKeywords = {
      'family law': ['family', 'marriage', 'divorce', 'custody', 'adoption', 'child support', 'alimony', 'familienrecht', 'ehe', 'scheidung', 'sorgerecht'],
      'criminal law': ['criminal', 'crime', 'theft', 'fraud', 'assault', 'murder', 'strafrecht', 'diebstahl', 'betrug', 'körperverletzung'],
      'corporate law': ['business', 'company', 'corporate', 'contract', 'employment', 'arbeitsrecht', 'vertragsrecht', 'gesellschaftsrecht'],
      'real estate': ['property', 'real estate', 'rent', 'lease', 'immobilienrecht', 'mietrecht', 'pacht'],
      'immigration law': ['immigration', 'visa', 'citizenship', 'asylum', 'ausländerrecht', 'einbürgerung', 'visum'],
      'tax law': ['tax', 'taxation', 'steuerrecht', 'steuer', 'steuerhinterziehung'],
      'insurance law': ['insurance', 'versicherung', 'krankenkasse', 'unfallversicherung'],
      'inheritance law': ['inheritance', 'will', 'estate', 'erbrecht', '[erbschaft', 'testament'],
      'contract law': ['contract', 'agreement', 'vertragsrecht', 'vertrag'],
      'labor law': ['employment', 'work', 'labor', 'arbeitsrecht', 'arbeit']
    }

    for (const [category, keywords] of Object.entries(legalKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        topics.push(category)
      }
    }

    return topics
  }

  private calculateRelevanceScore(lawyer: Lawyer, topics: string[]): number {
    let score = 0
    const lawyerSpecialties = lawyer.specialties || []

    for (const topic of topics) {
      for (const specialty of lawyerSpecialties) {
        if (specialty.toLowerCase().includes(topic.toLowerCase()) || 
            topic.toLowerCase().includes(specialty.toLowerCase())) {
          score += 1
        }
      }
    }

    // Bonus for high-rated lawyers
    if (lawyer.rating && lawyer.rating > 4.5) {
      score += 0.5
    }

    // Bonus for lawyers with many reviews (if review_count exists)
    if ((lawyer as any).review_count && (lawyer as any).review_count > 50) {
      score += 0.3
    }

    return Math.min(score, 5) // Cap at 5
  }

  private getMatchReasons(lawyer: Lawyer, topics: string[]): string[] {
    const reasons: string[] = []
    const lawyerSpecialties = lawyer.specialties || []

    for (const topic of topics) {
      for (const specialty of lawyerSpecialties) {
        if (specialty.toLowerCase().includes(topic.toLowerCase()) || 
            topic.toLowerCase().includes(specialty.toLowerCase())) {
          reasons.push(`Specializes in ${specialty}`)
        }
      }
    }

    if (lawyer.rating && lawyer.rating > 4.5) {
      reasons.push('High customer rating')
    }

    if ((lawyer as any).review_count && (lawyer as any).review_count > 50) {
      reasons.push('Extensive experience')
    }

    return [...new Set(reasons)] // Remove duplicates
  }
}
