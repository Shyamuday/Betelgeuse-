import { Service, ServiceCategory } from '../models';

export const HOPE_HUB_SESSION_PRICE = 300;
export const HOPE_HUB_SESSION_CURRENCY = 'INR';
export const HOPE_HUB_SESSION_DURATION = '30 minutes';

export const HOPE_HUB_SERVICES: Service[] = [
  {
    id: 'breakup-counseling',
    name: 'Breakup & Heartbreak Support',
    description:
      'Gentle support for breakup pain, attachment, closure, and rebuilding your daily rhythm.',
    detailedDescription:
      'A focused support session for people dealing with heartbreak, separation, emotional dependency, no-contact difficulty, or confusion after a relationship ends. The goal is to help you feel steadier and choose your next steps with care.',
    benefits: [
      'Process intense emotions safely',
      'Reduce overthinking and urge to reconnect',
      'Rebuild confidence and routine',
      'Create a simple healing plan',
    ],
    approach:
      'We use supportive listening, CBT-style thought work, grounding practices, and practical next-step planning.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.RELATIONSHIP,
    featured: true,
    imageUrl: '/assets/images/breakup-counseling.jpg',
  },
  {
    id: 'anxiety-therapy',
    name: 'Anxiety & Panic Support',
    description:
      'Support for anxious thoughts, panic feelings, fear loops, body symptoms, and daily stress.',
    detailedDescription:
      'A practical session for people experiencing worry, panic-like symptoms, racing thoughts, avoidance, or fear about everyday situations. We focus on calming tools and a plan you can actually follow.',
    benefits: [
      'Understand your anxiety pattern',
      'Learn grounding and breathing tools',
      'Reduce avoidance',
      'Build confidence for daily situations',
    ],
    approach:
      'We combine psychoeducation, grounding, breathing, CBT-informed reframing, and small exposure steps.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.MENTAL_HEALTH,
    featured: true,
    imageUrl: '/assets/images/anxiety-therapy.jpg',
  },
  {
    id: 'stress-burnout-support',
    name: 'Stress & Burnout Support',
    description:
      'For work pressure, emotional exhaustion, irritability, low energy, and feeling overloaded.',
    detailedDescription:
      'A session for people feeling stretched thin by responsibilities, deadlines, caregiving, or constant mental load. We help identify pressure points and create a lighter, more realistic routine.',
    benefits: [
      'Identify stress triggers',
      'Create a realistic recovery routine',
      'Improve boundaries',
      'Reduce emotional overload',
    ],
    approach:
      'We use stress mapping, priority sorting, nervous-system regulation, and habit planning.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.MENTAL_HEALTH,
    featured: true,
    imageUrl: '/assets/images/stress-management.jpg',
  },
  {
    id: 'career-study-pressure',
    name: 'Career & Study Pressure',
    description:
      'Guidance for career confusion, exam pressure, workplace stress, and decision paralysis.',
    detailedDescription:
      'A focused conversation for students and professionals who feel stuck, pressured, or unsure about their next step. We help bring structure to the decision and reduce emotional noise.',
    benefits: [
      'Clarify choices and next steps',
      'Handle performance pressure',
      'Reduce decision overwhelm',
      'Build a practical action plan',
    ],
    approach:
      'We use solution-focused questions, values clarification, stress planning, and short action cycles.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.CAREER,
    featured: true,
    imageUrl: '/assets/images/career-counseling.jpg',
  },
  {
    id: 'relationship-guidance',
    name: 'Relationship Guidance',
    description:
      'Support for communication issues, conflict, trust concerns, boundaries, and attachment patterns.',
    detailedDescription:
      'A support session for people navigating relationship confusion, repeated conflicts, insecurity, trust concerns, or boundary issues. This can be individual guidance or partner-focused planning.',
    benefits: [
      'Understand repeated conflict patterns',
      'Improve communication',
      'Set healthier boundaries',
      'Make clearer relationship decisions',
    ],
    approach:
      'We use emotion-focused reflection, communication mapping, boundary planning, and practical scripts.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.RELATIONSHIP,
    featured: true,
    imageUrl: '/assets/images/relationship-counseling.jpg',
  },
  {
    id: 'self-esteem-confidence',
    name: 'Self-Esteem & Confidence',
    description:
      'Help with self-doubt, comparison, people-pleasing, guilt, and negative self-talk.',
    detailedDescription:
      'A session for people who feel not good enough, struggle with confidence, or keep putting others first. We focus on self-respect, inner language, and small confidence-building actions.',
    benefits: [
      'Challenge negative self-talk',
      'Build self-respect',
      'Reduce people-pleasing',
      'Practice small confidence steps',
    ],
    approach:
      'We use strengths-based coaching, CBT-informed reframing, self-compassion, and behavior experiments.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.MENTAL_HEALTH,
    featured: false,
    imageUrl: '/assets/images/self-esteem-coaching.jpg',
  },
  {
    id: 'loneliness-emotional-support',
    name: 'Loneliness & Emotional Support',
    description:
      'A safe conversation when you feel alone, unheard, disconnected, or emotionally heavy.',
    detailedDescription:
      'A supportive session for people who need a steady space to talk, organize emotions, and feel less alone. We help you name what is happening and choose one or two manageable next steps.',
    benefits: [
      'Feel heard without judgment',
      'Name difficult emotions',
      'Plan small connection steps',
      'Reduce emotional heaviness',
    ],
    approach:
      'We use supportive counseling, emotional validation, grounding, and simple connection planning.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.MENTAL_HEALTH,
    featured: false,
    imageUrl: '/assets/images/depression-support.jpg',
  },
  {
    id: 'sleep-overthinking-support',
    name: 'Sleep & Overthinking Support',
    description:
      'Support for racing thoughts at night, sleep routine problems, rumination, and mental restlessness.',
    detailedDescription:
      'A practical session for people who cannot switch off mentally, replay conversations, worry at night, or struggle to maintain a sleep routine.',
    benefits: [
      'Create a night routine',
      'Reduce rumination',
      'Learn calming practices',
      'Improve mental rest',
    ],
    approach: 'We use sleep hygiene planning, worry scheduling, grounding tools, and habit design.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.MENTAL_HEALTH,
    featured: false,
    imageUrl: '/assets/images/stress-management.jpg',
  },
  {
    id: 'family-conflict-support',
    name: 'Family Conflict Support',
    description:
      'Support for family pressure, communication gaps, expectations, boundaries, and conflict.',
    detailedDescription:
      'A session for people dealing with family tension, repeated arguments, pressure around life choices, or difficulty setting respectful boundaries.',
    benefits: [
      'Understand family patterns',
      'Prepare calmer conversations',
      'Set respectful boundaries',
      'Reduce guilt and pressure',
    ],
    approach:
      'We use family-systems thinking, communication planning, boundary scripts, and emotional regulation.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.FAMILY,
    featured: false,
    imageUrl: '/assets/images/family-therapy.jpg',
  },
  {
    id: 'grief-loss-support',
    name: 'Grief & Loss Support',
    description:
      'Compassionate support after loss, separation, major life change, or emotional shock.',
    detailedDescription:
      'A gentle support session for people moving through grief, sadness, numbness, or life changes that feel hard to accept. We work at your pace.',
    benefits: [
      'Process grief safely',
      'Understand your grief response',
      'Find steadier coping steps',
      'Honor the loss without rushing',
    ],
    approach:
      'We use grief-informed support, emotional pacing, grounding, and meaning-centered reflection.',
    pricing: { individual: HOPE_HUB_SESSION_PRICE, currency: HOPE_HUB_SESSION_CURRENCY },
    category: ServiceCategory.MENTAL_HEALTH,
    featured: false,
    imageUrl: '/assets/images/grief-counseling.jpg',
  },
];

export type FeaturedService = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  discount?: number;
  consultantName: string;
  consultantPhone: string;
  duration: string;
  image: string;
  featured: boolean;
  bookingUrl?: string;
  badge?: string;
};

const featuredBadges: Record<string, string> = {
  'breakup-counseling': 'Popular',
  'anxiety-therapy': 'Anxiety care',
  'stress-burnout-support': 'Stress support',
  'career-study-pressure': 'Career support',
  'relationship-guidance': 'Relationships',
};

export const FEATURED_SERVICES: FeaturedService[] = HOPE_HUB_SERVICES.filter(
  (service) => service.featured,
).map((service) => ({
  id: service.id,
  name: service.name,
  description: service.description,
  price: HOPE_HUB_SESSION_PRICE,
  currency: HOPE_HUB_SESSION_CURRENCY,
  consultantName: 'Hope Hub Care Team',
  consultantPhone: '',
  duration: HOPE_HUB_SESSION_DURATION,
  image: service.imageUrl ?? '',
  featured: service.featured,
  badge: featuredBadges[service.id],
}));

export const SERVICE_PRICING = Object.fromEntries(
  HOPE_HUB_SERVICES.map((service) => [
    service.id,
    {
      individual: HOPE_HUB_SESSION_PRICE,
      currency: HOPE_HUB_SESSION_CURRENCY,
    },
  ]),
);

export function getAllServices(): Service[] {
  return HOPE_HUB_SERVICES;
}

export function getFeaturedServices(): FeaturedService[] {
  return FEATURED_SERVICES;
}

export function getServiceById(serviceId: string): Service | undefined {
  return HOPE_HUB_SERVICES.find((service) => service.id === serviceId);
}

export function getServiceIds(): string[] {
  return HOPE_HUB_SERVICES.map((service) => service.id);
}

export function getServicePricing(serviceId: string) {
  return SERVICE_PRICING[serviceId as keyof typeof SERVICE_PRICING];
}
