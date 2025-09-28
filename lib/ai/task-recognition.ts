export type TaskSuggestion = {
  message: string;
  confidence: number;
  actionType: 'pricing' | 'occupancy' | 'revenue' | 'competitor' | 'marketing' | 'general';
  parameters?: Record<string, any>;
};

export type RecognitionPattern = {
  keywords: string[];
  actionType: TaskSuggestion['actionType'];
  message: string;
  confidence: number;
  extractParameters?: (text: string) => Record<string, any>;
};

// Define recognition patterns for different hotel management tasks
const recognitionPatterns: RecognitionPattern[] = [
  // Halloween and special events pricing
  {
    keywords: ['halloween', 'weekend', 'price', 'rate', 'update', 'adjust'],
    actionType: 'pricing',
    message: 'I can update your Halloween weekend pricing! Want me to analyze demand and optimize rates?',
    confidence: 0.95,
    extractParameters: (text) => {
      const percentMatch = text.match(/(\d+)%?/);
      const isHalloween = text.toLowerCase().includes('halloween');
      return {
        percentage: percentMatch ? parseInt(percentMatch[1]) : null,
        event: isHalloween ? 'halloween' : null,
        timeframe: 'weekend'
      };
    }
  },

  // General pricing adjustments
  {
    keywords: ['lower', 'reduce', 'decrease', 'price', 'rate', 'cost', '%', 'percent', 'construction'],
    actionType: 'pricing',
    message: 'I can help adjust your hotel pricing! Want me to analyze the impact and implement rate changes?',
    confidence: 0.9,
    extractParameters: (text) => {
      const percentMatch = text.match(/(\d+)%?/);
      const monthMatch = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
      return {
        percentage: percentMatch ? parseInt(percentMatch[1]) : null,
        month: monthMatch ? monthMatch[1].toLowerCase() : null,
        reason: text.toLowerCase().includes('construction') ? 'construction' : null
      };
    }
  },

  // Rate increases
  {
    keywords: ['increase', 'raise', 'boost', 'price', 'rate', 'weekend', 'demand'],
    actionType: 'pricing',
    message: 'I can help increase your rates! Want me to analyze demand patterns and suggest optimal pricing?',
    confidence: 0.85,
    extractParameters: (text) => {
      const percentMatch = text.match(/(\d+)%?/);
      const isWeekend = text.toLowerCase().includes('weekend');
      return {
        percentage: percentMatch ? parseInt(percentMatch[1]) : null,
        timeframe: isWeekend ? 'weekend' : 'general'
      };
    }
  },

  // Occupancy analysis
  {
    keywords: ['occupancy', 'booking', 'sold', 'out', 'full', 'vacancy', 'rooms'],
    actionType: 'occupancy',
    message: 'I can analyze your occupancy data and booking patterns! Want me to generate insights?',
    confidence: 0.8,
    extractParameters: (text) => {
      const weekendMatch = text.match(/weekend|saturday|sunday/i);
      const dateMatch = text.match(/this\s+(week|month|weekend)/i);
      return {
        timeframe: weekendMatch ? 'weekend' : dateMatch ? dateMatch[1] : 'current',
        analysis_type: text.toLowerCase().includes('vs') || text.toLowerCase().includes('compare') ? 'comparison' : 'current'
      };
    }
  },

  // Revenue analysis
  {
    keywords: ['revenue', 'income', 'earnings', 'vs', 'compare', 'last year', 'month'],
    actionType: 'revenue',
    message: 'I can generate revenue reports and year-over-year comparisons! Want me to create charts and insights?',
    confidence: 0.85,
    extractParameters: (text) => {
      const monthMatch = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
      const yearMatch = text.match(/20\d{2}/);
      const isComparison = text.includes('vs') || text.includes('compare') || text.includes('last year');
      return {
        month: monthMatch ? monthMatch[1].toLowerCase() : null,
        year: yearMatch ? parseInt(yearMatch[0]) : null,
        comparison: isComparison
      };
    }
  },

  // Competitor analysis
  {
    keywords: ['competitor', 'competition', 'compare', 'market', 'rates', 'pricing'],
    actionType: 'competitor',
    message: 'I can analyze competitor rates and market positioning! Want me to generate a competitive analysis?',
    confidence: 0.8
  },

  // Marketing and landing pages
  {
    keywords: ['landing page', 'website', 'promo', 'campaign', 'event', 'hackathon', 'marketing'],
    actionType: 'marketing',
    message: 'I can create landing pages and marketing campaigns! Want me to generate promotional content?',
    confidence: 0.9,
    extractParameters: (text) => {
      const eventMatch = text.match(/(hackathon|conference|festival|event)/i);
      const promoMatch = text.match(/promo|discount|offer/i);
      return {
        event_type: eventMatch ? eventMatch[1].toLowerCase() : null,
        has_promo: !!promoMatch
      };
    }
  }
];

export function analyzeTaskForAI(text: string): TaskSuggestion | null {
  const lowerText = text.toLowerCase();
  let bestMatch: TaskSuggestion | null = null;
  let highestScore = 0;

  for (const pattern of recognitionPatterns) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // Calculate keyword match score
    for (const keyword of pattern.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        score += 1;
      }
    }

    // Boost score for multiple keyword matches
    if (matchedKeywords.length > 1) {
      score *= 1.5;
    }

    // Apply confidence multiplier
    const finalScore = score * pattern.confidence;

    if (finalScore > highestScore && finalScore > 1) {
      highestScore = finalScore;

      bestMatch = {
        message: pattern.message,
        confidence: Math.min(finalScore / pattern.keywords.length, 1),
        actionType: pattern.actionType,
        parameters: pattern.extractParameters ? pattern.extractParameters(text) : undefined
      };
    }
  }

  return bestMatch;
}

// Enhanced analysis that provides specific action suggestions
export function generateActionSuggestion(task: string): {
  suggestion: TaskSuggestion | null;
  quickActions: string[];
} {
  const suggestion = analyzeTaskForAI(task);
  const quickActions: string[] = [];

  if (suggestion) {
    switch (suggestion.actionType) {
      case 'pricing':
        quickActions.push('Show current rates', 'Analyze impact', 'Apply changes');
        break;
      case 'occupancy':
        quickActions.push('Current occupancy', 'Year-over-year comparison', 'Booking trends');
        break;
      case 'revenue':
        quickActions.push('Generate revenue chart', 'Monthly comparison', 'Performance insights');
        break;
      case 'competitor':
        quickActions.push('Competitor rate analysis', 'Market positioning', 'Pricing recommendations');
        break;
      case 'marketing':
        quickActions.push('Create landing page', 'Generate promo code', 'Campaign preview');
        break;
    }
  }

  return { suggestion, quickActions };
}