/**
 * Guided Q&A chatbot as "Dr. Priya" — each step shows a question with
 * tap-to-select options so users don't have to type unless they choose to.
 */

export type BotReply = {
  message: string;
  nextStage: number;
  needsOperator: boolean;
  options?: string[];
  capturedName?: string;
  capturedPhone?: string;
  showBookButton?: boolean;
  showWhatsAppButton?: boolean;
  allowFreeText?: boolean;
};

const BOT_NAME = 'Dr. Priya';

const CONCERN_OPTIONS = [
  'Skin, hair or allergy issues',
  'Chronic or long-term condition',
  'Digestive or lifestyle concern',
  'Child or family health',
  'Stress, sleep or mental wellness',
  'General consultation',
  'Something else'
] as const;

const DURATION_OPTIONS = [
  'A few days',
  '1–2 weeks',
  '1–3 months',
  'More than 3 months'
] as const;

const TREATMENT_OPTIONS = [
  'First time seeking help',
  'Tried homeopathy before',
  'Tried other treatments',
  'Not sure / mixed'
] as const;

const BOOK_OPTIONS = [
  'Yes, I want to book',
  'Tell me more first',
  'Not right now'
] as const;

const FOLLOWUP_OPTIONS = [
  'Book consultation now',
  'I have another question',
  'No, I am good'
] as const;

const CALLBACK_OPTIONS = [
  'Yes, call or WhatsApp me',
  'I will reach out myself',
  'No thanks'
] as const;

const CLOSING_OPTIONS = [
  'Start a new question',
  'Close chat'
] as const;

const GREETING = `Hi there! 👋 I'm ${BOT_NAME}, your care advisor at Vitalis.\n\nI'll ask a few quick questions so we can guide you to the right care. Tap an option below to get started.`;

const YES_RE =
  /\byes\b|\bsure\b|\bokay\b|\byes please\b|\byep\b|\byeah\b|\bbook\b|\bwant to\b|\bwilling\b|want to book|book consultation|book now/i;
const NO_RE =
  /\bno\b|\bnot\b|\bdon'?t\b|\bnope\b|\bnah\b|\bnot now\b|\bmaybe later\b|\blater\b|\bnot interested\b|\bno thanks?\b|not right now|no, i am good|close chat/i;

function hasPhone(text: string): boolean {
  return /(\+?\d[\d\s\-]{8,14}\d)/.test(text);
}

function extractPhone(text: string): string | undefined {
  const m = text.match(/(\+?\d[\d\s\-]{8,14}\d)/);
  return m?.[1]?.replace(/\s/g, '');
}

function isNo(text: string): boolean {
  return NO_RE.test(text) && !YES_RE.test(text);
}

function isYes(text: string): boolean {
  return YES_RE.test(text);
}

function matchesAny(text: string, options: readonly string[]): boolean {
  const t = text.trim().toLowerCase();
  return options.some((o) => t === o.toLowerCase() || t.includes(o.toLowerCase().slice(0, 12)));
}

/** Options shown for the question the bot is currently waiting on. */
export function getPendingOptions(stage: number): string[] | undefined {
  switch (stage) {
    case 0:
      return [...CONCERN_OPTIONS];
    case 1:
      return [...DURATION_OPTIONS];
    case 2:
      return [...TREATMENT_OPTIONS];
    case 3:
      return [...BOOK_OPTIONS];
    case 4:
      return [...FOLLOWUP_OPTIONS];
    case 5:
      return [...CALLBACK_OPTIONS];
    case 7:
      return [...CLOSING_OPTIONS];
    default:
      return undefined;
  }
}

export function getGreetingReply(): BotReply {
  return {
    message: GREETING,
    nextStage: 0,
    needsOperator: false,
    options: [...CONCERN_OPTIONS],
    allowFreeText: true
  };
}

export function getBotReply(stage: number, userMessage: string): BotReply {
  const msg = userMessage.trim();

  switch (stage) {
    // Stage 0: concern selected
    case 0:
      return {
        message: `Thank you for sharing. 🙏\n\nHow long have you been experiencing this?`,
        nextStage: 1,
        needsOperator: false,
        options: [...DURATION_OPTIONS],
        allowFreeText: true
      };

    // Stage 1: duration selected
    case 1:
      return {
        message: `Got it. Have you tried any treatment for this before?`,
        nextStage: 2,
        needsOperator: false,
        options: [...TREATMENT_OPTIONS],
        allowFreeText: true
      };

    // Stage 2: treatment history — suggest consultation
    case 2:
      return {
        message:
          `Thank you. Based on what you shared, a personalised online consultation with our homeopathic doctors would be a good next step.\n\nWould you like to book a consultation?`,
        nextStage: 3,
        needsOperator: false,
        options: [...BOOK_OPTIONS],
        allowFreeText: true
      };

    // Stage 3: booking decision
    case 3:
      if (matchesAny(msg, ['Tell me more first']) || /more|cost|process|how|what|doctor/i.test(msg)) {
        return {
          message:
            `Of course! Our consultations are private, doctor-led, and done from your phone or laptop. A doctor reviews your case and guides you on medicine and follow-up.\n\nMost patients find it convenient and affordable compared to repeated clinic visits.`,
          nextStage: 4,
          needsOperator: false,
          options: [...FOLLOWUP_OPTIONS],
          showBookButton: true,
          allowFreeText: true
        };
      }
      if (isNo(msg) || matchesAny(msg, ['Not right now'])) {
        return {
          message:
            `No worries at all! 😊 Would you like our care team to call or WhatsApp you when you are ready?`,
          nextStage: 5,
          needsOperator: false,
          options: [...CALLBACK_OPTIONS],
          allowFreeText: true
        };
      }
      return {
        message:
          `Wonderful! 🌟 Tap below to book, or ask me anything before you go.`,
        nextStage: 4,
        needsOperator: false,
        options: [...FOLLOWUP_OPTIONS],
        showBookButton: true,
        allowFreeText: true
      };

    // Stage 4: post-booking interest
    case 4:
      if (isNo(msg) || matchesAny(msg, ['No, I am good', 'Close chat'])) {
        return {
          message: `Thank you for chatting with me today. Wishing you good health! 💚`,
          nextStage: 7,
          needsOperator: false,
          options: [...CLOSING_OPTIONS],
          allowFreeText: true
        };
      }
      if (matchesAny(msg, ['Book consultation now']) || isYes(msg)) {
        return {
          message: `Great — use the button below to book. Our team will take it from there!`,
          nextStage: 4,
          needsOperator: false,
          showBookButton: true,
          options: ['I have another question', 'No, I am good'],
          allowFreeText: true
        };
      }
      return {
        message:
          `Happy to help! Consultations are confidential, online, and tailored to your concern. A doctor is assigned based on what you shared.\n\nAnything else you'd like to know?`,
        nextStage: 4,
        needsOperator: false,
        options: [...FOLLOWUP_OPTIONS],
        showBookButton: true,
        allowFreeText: true
      };

    // Stage 5: callback preference
    case 5: {
      if (isNo(msg) || matchesAny(msg, ['No thanks', 'I will reach out myself'])) {
        return {
          message:
            `That is perfectly fine! 💚 Reach us on WhatsApp anytime. Wishing you good health!`,
          nextStage: 7,
          needsOperator: false,
          showWhatsAppButton: true,
          options: [...CLOSING_OPTIONS],
          allowFreeText: true
        };
      }

      const phone = extractPhone(msg);
      if (phone || hasPhone(msg)) {
        return {
          message:
            `Thank you! 🙏 Our coordinator will reach out soon on ${phone ?? 'your number'}. You are in good hands.`,
          nextStage: 6,
          needsOperator: true,
          capturedPhone: phone,
          allowFreeText: true
        };
      }

      if (matchesAny(msg, ['Yes, call or WhatsApp me'])) {
        return {
          message: `Please type your name and mobile / WhatsApp number (e.g. Rahul 9876543210).`,
          nextStage: 5,
          needsOperator: false,
          allowFreeText: true
        };
      }

      return {
        message: `Please share your phone or WhatsApp number so we can reach you.`,
        nextStage: 5,
        needsOperator: false,
        capturedName: msg.length < 60 && !hasPhone(msg) ? msg : undefined,
        allowFreeText: true
      };
    }

    case 6:
      return {
        message: `You're welcome! Our team will be in touch very soon. Take care! 💚`,
        nextStage: 7,
        needsOperator: false,
        showWhatsAppButton: true,
        options: [...CLOSING_OPTIONS],
        allowFreeText: true
      };

    case 7:
      if (matchesAny(msg, ['Start a new question'])) {
        return {
          message: `Of course! What would you like help with today?`,
          nextStage: 0,
          needsOperator: false,
          options: [...CONCERN_OPTIONS],
          allowFreeText: true
        };
      }
      return {
        message: `Thank you for visiting Vitalis. We are here whenever you need us. 💚`,
        nextStage: 7,
        needsOperator: false,
        options: ['Start a new question'],
        allowFreeText: true
      };

    default:
      return {
        message: `How can I help you today?`,
        nextStage: 0,
        needsOperator: false,
        options: [...CONCERN_OPTIONS],
        allowFreeText: true
      };
  }
}

export { GREETING, BOT_NAME };
