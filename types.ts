export type Screen = 'home' | 'baby' | 'journal' | 'resources' | 'profile';
export type BabyLogType = 'Feeding' | 'Sleep' | 'Diaper';

export interface DailyGoal {
  id: number;
  text: string;
  progress: number;
  total: number;
  unit: string;
  xp: number;
  completed: boolean;
}

export interface FeedingLog {
  id: number;
  type: 'Breastfeeding' | 'Bottle';
  time: string;
  amount?: number;
  amountUnit?: string;
  duration?: number;
  durationUnit?: string;
}

export interface SleepLog {
  id: number;
  time: string;
  duration: string;
}

export type DiaperType = 'Wet' | 'Dirty' | 'Mixed';

export interface DiaperLog {
  id: number;
  time: string;
  type: DiaperType;
}

export type JournalMood = 'Feeling Good' | 'Feeling Sad' | 'Feeling Anxious' | 'Feeling Grateful' | 'Feeling Overwhelmed';

export interface JournalEntry {
  id: number;
  date: string;
  mood: JournalMood;
  prompt: string;
  content: string;
}

export interface AIInsights {
  summary: string;
  moodTrend: string;
  suggestions: string[];
  concernFlag: boolean;
  concernMessage: string;
}

export interface CommunityComment {
  id: number;
  author: string;
  avatarInitial: string;
  timestamp: string;
  content: string;
}

export interface CommunityPost {
  id: number;
  author: string;
  avatarInitial: string;
  timestamp: string;
  content: string;
  reactions: {
    '❤️': number;
    '🤗': number;
    '👍': number;
    '🙏': number;
  };
  comments: CommunityComment[];
}

export interface RegistrationAnswers {
  supportScale: number;
  sleepHours: string;
  emotionalGoal: string;
  selfCareMethods: string;
  stressors: string[];
}

export interface EmergencyContact {
    id: number;
    name: string;
    relation: string;
    phone: string;
}
