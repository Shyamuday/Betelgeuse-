export type Disease = {
  id: string;
  name: string;
  description: string;
  feeInPaise: number;
  intakeQuestions: string[];
};

export type DiseaseInfo = {
  name: string;
  shortName: string;
  slug: string;
  imageUrl: string;
  imageAlt: string;
  category?: string;
  diseaseType?: string;
  icdCode?: string;
  summary: string;
  about: string;
  ourApproach?: {
    title: string;
    intro: string;
    points: string[];
  };
  symptoms: string[];
  causes?: string[];
  riskFactors?: string[];
  diagnosis?: string;
  tests?: string[];
  treatmentOptions?: {
    allopathy?: string;
    ayurveda?: string;
    homeopathy?: string;
    lifestyle?: string;
  };
  medications?: string[];
  homeCare?: string[];
  prevention?: string[];
  severityLevel?: string;
  whenToSeeDoctor?: string;
  emergencySigns?: string[];
  duration?: string;
  stages?: string[];
  commonIn?: {
    ageGroup?: string;
    gender?: string;
  };
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  reviewedBy?: string;
  lastUpdated?: string;
  references?: string[];
  careApproach: string[];
  details: string[];
  warning?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalPath?: string;
  };
};
