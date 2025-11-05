
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Screen, DailyGoal, FeedingLog, JournalEntry, AIInsights, JournalMood, SleepLog, DiaperLog, BabyLogType, DiaperType, CommunityPost, CommunityComment, RegistrationAnswers, EmergencyContact } from './types';
import { getAIInsights, generateDailyGoals } from './services/geminiService';

// --- MOCK DATA ---
const initialGoals: DailyGoal[] = [
  { id: 1, text: 'Connect with a friend or family member', progress: 0, total: 1, unit: 'contact', xp: 5, completed: false },
  { id: 2, text: 'Go outside with baby for 15 min', progress: 0, total: 15, unit: 'min', xp: 10, completed: false },
  { id: 3, text: 'Have a nutritious smoothie', progress: 0, total: 1, unit: 'smoothie', xp: 15, completed: false },
];

const initialFeedings: FeedingLog[] = [
  { id: 1, type: 'Breastfeeding', time: '2:30 PM', duration: 20, durationUnit: 'min' },
  { id: 2, type: 'Bottle', time: '11:00 AM', amount: 4, amountUnit: 'oz' },
  { id: 3, type: 'Breastfeeding', time: '8:30 AM', duration: 25, durationUnit: 'min' },
];

const initialSleeps: SleepLog[] = [
    { id: 1, time: '1:00 PM', duration: '1h 30m'},
    { id: 2, time: '9:45 AM', duration: '45m'},
    { id: 3, time: '4:00 AM', duration: '3h'},
];

const initialDiapers: DiaperLog[] = [
    { id: 1, time: '2:15 PM', type: 'Wet'},
    { id: 2, time: '10:50 AM', type: 'Mixed'},
    { id: 3, time: '7:30 AM', type: 'Wet'},
];

const initialJournalEntries: JournalEntry[] = [
    {
        id: 1, date: 'October 18, 2025', mood: 'Feeling Good', prompt: 'What made you smile today?',
        content: "Today was better than yesterday. Emma slept for 3 hours straight, and I finally got to enjoy a warm cup of coffee. I'm learning to celebrate these small victories. Still feeling tired, but grateful for the support from my partner."
    },
    {
        id: 2, date: 'October 17, 2025', mood: 'Feeling Sad', prompt: 'How are you feeling physically and emotionally?',
        content: "Had a rough night with Emma. She was fussy and I felt so helpless. I cried a little after my partner took over. The exhaustion is overwhelming today."
    },
     {
        id: 3, date: 'October 16, 2025', mood: 'Feeling Overwhelmed', prompt: 'What is one thing you are struggling with?',
        content: "I feel like I'm failing. The house is a mess, I haven't showered, and I'm not sure if she's getting enough milk. I love her so much it hurts, but this is so much harder than I ever imagined."
    },
    {
        id: 4, date: 'October 15, 2025', mood: 'Feeling Anxious', prompt: 'What is on your mind right now?',
        content: "Worried about going back to work next month. How will I manage everything? Emma seems so small, and I don't want to leave her."
    },
    {
        id: 5, date: 'October 14, 2025', mood: 'Feeling Good', prompt: 'What made you smile today?',
        content: "My partner brought home dinner and took care of Emma so I could take a long, hot shower. It felt amazing. Feeling a bit more human today."
    },
    { id: 6, date: 'October 12, 2025', mood: 'Feeling Grateful', prompt: 'What is something you are grateful for?', content: 'Grateful for a quiet moment this afternoon.'},
    { id: 7, date: 'October 10, 2025', mood: 'Feeling Sad', prompt: 'How are you feeling physically and emotionally?', content: 'Feeling down again.'},
];

const initialCommunityPosts: CommunityPost[] = [
    {
        id: 1,
        author: 'Jessica M.',
        avatarInitial: 'J',
        timestamp: '3h ago',
        content: 'Feeling so overwhelmed today. The lack of sleep is really getting to me. Any tips for managing the midnight feeds and still feeling human?',
        reactions: { '❤️': 12, '🤗': 25, '👍': 3, '🙏': 1 },
        comments: [
            { id: 1, author: 'Emily R.', avatarInitial: 'E', timestamp: '2h ago', content: 'You are not alone! For us, having my partner take one feed with a bottle of pumped milk was a game-changer.' },
            { id: 2, author: 'Sarah Johnson', avatarInitial: 'S', timestamp: '1h ago', content: 'Sending you so much love. It gets better, I promise. ❤️' },
        ]
    },
    {
        id: 2,
        author: 'Chloe B.',
        avatarInitial: 'C',
        timestamp: '8h ago',
        content: 'Small win today! We had our first successful trip to the grocery store. It was terrifying but we did it! 🙌',
        reactions: { '❤️': 31, '🤗': 5, '👍': 18, '🙏': 0 },
        comments: [
             { id: 3, author: 'Maria G.', avatarInitial: 'M', timestamp: '7h ago', content: 'That is HUGE! Congrats!' },
        ]
    },
];

const initialEmergencyContacts: EmergencyContact[] = [
    { id: 1, name: 'Michael Johnson', relation: 'Partner', phone: '123-455-7890' },
    { id: 2, name: 'Dr. Emily Carter', relation: 'Pediatrician', phone: '098-765-4321' },
    { id: 3, name: 'Jessica Miller', relation: 'Best Friend', phone: '555-123-4567' },
];


// --- SVG ICONS ---
const HomeIcon = ({ active }: { active: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-brand-primary dark:text-dark-accent' : 'text-gray-400 dark:text-dark-accent/70'}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const BabyIcon = ({ active }: { active: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-brand-primary dark:text-dark-accent' : 'text-gray-400 dark:text-dark-accent/70'}><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 5 6.3"/><path d="M12 2a3 3 0 0 1 2.5 4.5L12 8l-2.5-1.5A3 3 0 0 1 12 2Z"/></svg>;
const JournalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path><path d="M12 8.5V17m-3-6.5h6"/></svg>;
const NestIcon = ({ active }: { active: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-brand-primary dark:text-dark-accent' : 'text-gray-400 dark:text-dark-accent/70'}><path d="M4.2 11.8c.2-1.3.8-2.5 1.7-3.4s2.2-1.5 3.5-1.7" /><path d="M20.2 10.3c-.2-1.3-.8-2.5-1.7-3.4s-2.2-1.5-3.5-1.7" /><path d="M8 18c-1.4.1-2.8-.2-4-1-.7-.4-1.2-1-1.6-1.7" /><path d="M15 18c1.4.1 2.8-.2 4-1 .7-.4 1.2-1 1.6-1.7" /><path d="M9.5 13a2.5 2.5 0 0 1-5 0" /><path d="M14.5 13a2.5 2.5 0 0 1-5 0" /><path d="M19.5 13a2.5 2.5 0 0 1-5 0" /></svg>;
const ProfileIcon = ({ active }: { active: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-brand-primary dark:text-dark-accent' : 'text-gray-400 dark:text-dark-accent/70'}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;

const SleepIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const DiaperIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 22a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9.2a2 2 0 0 1 .9-1.7l6-3.9a2 2 0 0 1 2.2 0l6 3.9a2 2 0 0 1 .9 1.7Z"/><path d="M12 14v8"/><path d="M20 9.2C17.6 8 14.9 8 12 8s-5.6 0-8 1.2"/></svg>;
const FeedingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-3.38 19.53 1 1 0 0 0 .53.17h5.7a1 1 0 0 0 .53-.17A10 10 0 0 0 12 2Z"></path><path d="M12 6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"></path></svg>;


// --- SUB COMPONENTS ---

const Header = ({ title }: { title: string }) => (
    <header className="fixed top-0 left-0 right-0 bg-brand-lightest/80 dark:bg-dark-bg/80 backdrop-blur-sm z-10 p-4 text-center border-b border-brand-light dark:border-dark-primary h-20 flex items-center justify-center">
        <div>
            <h1 className="text-2xl font-bold text-brand-primary dark:text-dark-accent">{title}</h1>
        </div>
    </header>
);

const BottomNav = ({ activeScreen, setActiveScreen }: { activeScreen: Screen; setActiveScreen: (screen: Screen) => void }) => {
    const navItems = [
        { id: 'home', icon: HomeIcon, label: 'Home' },
        { id: 'baby', icon: BabyIcon, label: 'Baby' },
        { id: 'journal', icon: JournalIcon, label: 'Journal' },
        { id: 'resources', icon: NestIcon, label: 'Nest' },
        { id: 'profile', icon: ProfileIcon, label: 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-primary dark:border-t dark:border-dark-bg/50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center h-20 px-2">
            {navItems.map((item) => {
                if (item.id === 'journal') {
                    return (
                        <div key={item.id} className="relative w-16 h-16 -mt-10">
                            <button
                                onClick={() => setActiveScreen('journal')}
                                className="absolute inset-0 bg-gradient-to-br from-brand-medium-light to-brand-medium rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform"
                            >
                                <JournalIcon />
                            </button>
                        </div>
                    );
                }
                const Icon = item.icon as React.ElementType<{ active: boolean }>;
                const isActive = activeScreen === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveScreen(item.id as Screen)}
                        className={`flex flex-col items-center justify-center space-y-1 text-sm font-medium w-16 h-16 rounded-lg transition-colors ${isActive ? 'bg-brand-lightest dark:bg-dark-bg' : ''}`}
                    >
                        <Icon active={isActive} />
                        <span className={`transition-colors ${isActive ? 'text-brand-primary dark:text-dark-accent font-bold' : 'text-gray-400 dark:text-dark-accent/70'}`}>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

const ConcernBanner = ({ message, onDismiss }: { message: string, onDismiss: () => void}) => (
    <div className="fixed top-20 left-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg z-50 flex justify-between items-center shadow-md dark:bg-red-900 dark:text-red-200 dark:border-red-400">
        <div>
            <p className="font-bold">A Gentle Check-in</p>
            <p className="text-sm">{message}</p>
        </div>
        <button onClick={onDismiss} className="text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    </div>
);

const LevelUpModal = ({ level, onClose }: { level: number, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-brand-darkest dark:text-brand-darkest">Congratulations!</h2>
            <p className="text-brand-dark dark:text-brand-dark mt-2 mb-6">You've reached Level <span className="font-bold text-brand-primary dark:text-dark-accent">{level}</span>! Keep up the amazing self-care.</p>
            <button onClick={onClose} className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl">Continue</button>
        </div>
    </div>
);

const Toast = ({ message, onDismiss }: { message: string, onDismiss: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 transition-opacity duration-300">
            {message}
        </div>
    );
};

// --- HOME SCREEN COMPONENTS ---
const MoodChart = ({ entries }: { entries: JournalEntry[] }) => {
    const [timeFrame, setTimeFrame] = useState<'month' | 'year'>('month');

    const moodToValue = (mood: JournalMood): number => {
        const mapping: { [key in JournalMood]: number } = {
            'Feeling Sad': 1,
            'Feeling Anxious': 2,
            'Feeling Overwhelmed': 3,
            'Feeling Grateful': 4,
            'Feeling Good': 5,
        };
        return mapping[mood];
    };
    
    const moodToEmoji = (mood: JournalMood): string => {
        const mapping: { [key in JournalMood]: string } = {
            'Feeling Good': '😊',
            'Feeling Grateful': '🙏',
            'Feeling Anxious': '😟',
            'Feeling Overwhelmed': '😫',
            'Feeling Sad': '😔',
        };
        return mapping[mood] || '😐';
    };

    const filteredEntries = useMemo(() => {
        const now = new Date();
        const filtered = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            if (isNaN(entryDate.getTime())) return false;
            
            const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
            if (timeFrame === 'month') return diffDays <= 30;
            if (timeFrame === 'year') return diffDays <= 365;
            return false;
        });
        return filtered.slice(0, 7).reverse(); // Show up to last 7 entries for clarity
    }, [entries, timeFrame]);

    const Chart = () => {
        if (filteredEntries.length < 2) {
            return <div className="h-40 flex items-center justify-center text-sm text-brand-dark dark:text-brand-dark">Not enough data to display chart.</div>;
        }

        const width = 300;
        const height = 150;
        const padding = { top: 10, right: 10, bottom: 20, left: 30 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const points = filteredEntries.map((entry, i) => {
            const x = (i / (filteredEntries.length - 1)) * chartWidth + padding.left;
            const y = chartHeight - ((moodToValue(entry.mood) - 1) / 4) * chartHeight + padding.top;
            return { x, y, mood: entry.mood, date: entry.date };
        });

        const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');
        
        const yAxisLabels: {mood: JournalMood, value: number}[] = [
            { mood: 'Feeling Sad', value: 1 }, { mood: 'Feeling Anxious', value: 2 },
            { mood: 'Feeling Overwhelmed', value: 3 }, { mood: 'Feeling Grateful', value: 4 },
            { mood: 'Feeling Good', value: 5 },
        ];

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {yAxisLabels.map(label => {
                    const y = chartHeight - ((label.value - 1) / 4) * chartHeight + padding.top;
                    return (
                        <g key={label.mood}>
                           <text x={padding.left - 15} y={y + 4} fontSize="16" textAnchor="middle" alignmentBaseline="middle" className="fill-current text-brand-dark dark:text-brand-darkest">{moodToEmoji(label.mood)}</text>
                           <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-brand-lightest dark:text-dark-primary" strokeWidth="1" />
                        </g>
                    );
                })}
                <path d={path} fill="none" stroke="#6f6fe5" className="dark:stroke-dark-accent" strokeWidth="2" />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#4343d7" className="dark:fill-dark-accent" />
                        <title>{`${p.mood} - ${p.date}`}</title>
                    </g>
                ))}
            </svg>
        );
    };

    return (
        <div className="bg-white dark:bg-dark-secondary p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-3">
                 <h3 className="text-lg font-bold text-brand-darkest dark:text-brand-darkest">Your Mood Trend</h3>
                 <div className="flex space-x-1 bg-brand-lightest dark:bg-dark-primary p-1 rounded-full">
                     {(['month', 'year'] as const).map(tf => (
                         <button key={tf} onClick={() => setTimeFrame(tf)} className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${timeFrame === tf ? 'bg-white dark:bg-dark-accent text-brand-primary dark:text-dark-bg shadow-sm' : 'text-brand-dark dark:text-dark-accent'}`}>
                             {tf}
                         </button>
                     ))}
                 </div>
            </div>
            <Chart />
        </div>
    );
};

const AIInsightsSummaryCard = ({ insights, isLoading }: { insights: AIInsights | null, isLoading: boolean }) => {
    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 p-4 rounded-2xl shadow-sm border border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-bold text-brand-darkest dark:text-purple-200 mb-3 flex items-center space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.09 14.09A6 6 0 0 1 9 18.09M9 18.09C7.43 17.5 6 15.91 6 14a6 6 0 0 1 12 0c0 1.91-1.43 3.5-3 4.09M9 22h6"/><path d="M12 2v6"/></svg>
                <span>AI-Powered Insights</span>
            </h3>
            <div className="text-xs text-brand-dark/80 dark:text-purple-200/80 italic mb-4 p-2 bg-purple-100/50 dark:bg-purple-900/30 rounded-lg flex items-start space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                 <span>This is a supportive tool, not a substitute for professional mental health care.</span>
            </div>
            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-4 bg-purple-200/50 dark:bg-purple-800/50 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-purple-200/50 dark:bg-purple-800/50 rounded w-1/2 animate-pulse"></div>
                    <div className="h-4 bg-purple-200/50 dark:bg-purple-800/50 rounded w-5/6 animate-pulse"></div>
                </div>
            ) : insights ? (
                <div className="space-y-3">
                    <div>
                        <h4 className="font-semibold text-sm text-brand-dark dark:text-purple-300 mb-1">Gentle Summary</h4>
                        <p className="text-sm text-brand-darkest dark:text-purple-100 leading-relaxed">{insights.summary}</p>
                    </div>
                     <div className="pt-2 border-t border-purple-200/50 dark:border-purple-700/50">
                        <h4 className="font-semibold text-sm text-brand-dark dark:text-purple-300 mb-1">Your Mood Trend</h4>
                        <p className="text-sm text-brand-darkest dark:text-purple-100 leading-relaxed">{insights.moodTrend}</p>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500 dark:text-purple-200/80">Write in your journal and tap "Get AI-Powered Insights" to see your summary here.</p>
            )}
        </div>
    );
};

// --- SCREENS ---
const HomeScreen = ({ 
    goals, setGoals, insights, isLoading, entries, userLevel, levelLabel, userXp, MAX_XP,
    setUserLevel, setUserXp, setShowLevelUpModal,
    selfCareStreak, setSelfCareStreak, streakAwardedToday, setStreakAwardedToday,
    emergencyContacts, babyName, babyAgeWeeks
}: { 
    goals: DailyGoal[], 
    setGoals: React.Dispatch<React.SetStateAction<DailyGoal[]>>,
    insights: AIInsights | null,
    isLoading: boolean,
    entries: JournalEntry[],
    userLevel: number,
    levelLabel: string,
    userXp: number,
    MAX_XP: number,
    setUserLevel: React.Dispatch<React.SetStateAction<number>>,
    setUserXp: React.Dispatch<React.SetStateAction<number>>,
    setShowLevelUpModal: React.Dispatch<React.SetStateAction<boolean>>,
    selfCareStreak: number,
    setSelfCareStreak: React.Dispatch<React.SetStateAction<number>>,
    streakAwardedToday: boolean,
    setStreakAwardedToday: React.Dispatch<React.SetStateAction<boolean>>,
    emergencyContacts: EmergencyContact[],
    babyName: string,
    babyAgeWeeks: number
}) => {
    const today = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), []);

    const wellnessFacts = useMemo(() => [
        "Omega-3 fatty acids, found in fish like salmon and walnuts, can help reduce symptoms of depression.",
        "Just 15 minutes of sunlight can boost your vitamin D levels, which is linked to improved mood.",
        "Staying hydrated is crucial; even mild dehydration can impact your mood and energy levels.",
        "Deep breathing exercises can activate your parasympathetic nervous system, promoting a state of calm.",
        "A diet rich in antioxidants from fruits and vegetables can help reduce inflammation linked to anxiety.",
    ], []);

    const fact = useMemo(() => wellnessFacts[Math.floor(Math.random() * wellnessFacts.length)], [wellnessFacts]);

    const handleGoalToggle = (id: number) => {
        const goal = goals.find(g => g.id === id);
        if (!goal || goal.completed) {
            return;
        }

        const updatedGoals = goals.map(g => 
            g.id === id ? { ...g, completed: true, progress: g.total } : g
        );
        setGoals(updatedGoals);

        const allGoalsCompleted = updatedGoals.every(g => g.completed);
        if (allGoalsCompleted && !streakAwardedToday) {
            setSelfCareStreak(prevStreak => prevStreak + 1);
            setStreakAwardedToday(true);
        }

        let newXp = userXp + goal.xp;
        let newLevel = userLevel;
        if (newXp >= MAX_XP) {
            newLevel += 1;
            newXp -= MAX_XP;
            setUserLevel(newLevel);
            setShowLevelUpModal(true);
        }
        setUserXp(newXp);
    };
    
    return (
        <div className="p-4 space-y-6">
            <div className="bg-gradient-to-br from-brand-medium to-brand-primary dark:bg-dark-primary text-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">Welcome Back, Mama</h2>
                        <p className="text-sm opacity-80">{today}</p>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-2">
                        <span>⭐</span>
                        <span>Level {userLevel}</span>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between text-sm font-medium mb-1">
                        <span>{levelLabel}</span>
                        <span>{userXp}/{MAX_XP} XP</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2.5">
                        <div className="bg-white rounded-full h-2.5 transition-all duration-500" style={{ width: `${(userXp / MAX_XP) * 100}%` }}></div>
                    </div>
                </div>
                <p className="mt-4 text-sm opacity-90">{`Your baby, ${babyName}, is ${babyAgeWeeks} weeks old today! Every day you're growing stronger together. Keep going, you're doing amazing! 🥰`}</p>
            </div>

            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-transparent p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="bg-red-500/10 text-red-500 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-brand-darkest dark:text-red-100">Need immediate support?</h3>
                        <p className="text-sm text-brand-dark dark:text-red-200">Postpartum Support Hotline</p>
                    </div>
                </div>
                <a href="tel:1-800-944-4773" className="bg-red-500 text-white p-3 rounded-full shadow-md transform hover:scale-105 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </a>
            </div>

            <div className="bg-white dark:bg-dark-secondary p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-brand-darkest dark:text-brand-darkest">Your Care Routine</h3>
                    <div className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-500/30 text-orange-600 dark:text-orange-200 text-xs font-bold px-2 py-1 rounded-full">
                        <span>🔥</span>
                        <span>{selfCareStreak} Day Streak</span>
                    </div>
                </div>
                <div className="space-y-3">
                    {goals.map(goal => (
                        <div key={goal.id} className="flex items-center space-x-4">
                            <button onClick={() => handleGoalToggle(goal.id)} className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${goal.completed ? 'bg-brand-medium-light border-brand-medium-light' : 'border-brand-light dark:border-dark-primary'}`}>
                                {goal.completed && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                            </button>
                            <p className={`flex-grow text-brand-dark dark:text-brand-dark transition-colors ${goal.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                                {goal.text}
                            </p>
                            {!goal.completed && (
                                <span className="bg-brand-lightest dark:bg-dark-primary text-brand-primary dark:text-dark-accent text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">+{goal.xp} XP</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <MoodChart entries={entries} />
            <AIInsightsSummaryCard insights={insights} isLoading={isLoading} />
            
            <div className="bg-brand-lightest dark:bg-dark-secondary border border-brand-light dark:border-transparent p-4 rounded-2xl flex items-start space-x-4">
                <div className="text-brand-primary dark:text-brand-primary mt-1 flex-shrink-0">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.09 14.09A6 6 0 0 1 9 18.09M9 18.09C7.43 17.5 6 15.91 6 14a6 6 0 0 1 12 0c0 1.91-1.43 3.5-3 4.09M9 22h6"/><path d="M12 2v6"/></svg>
                </div>
                <div>
                    <h3 className="font-bold text-brand-darkest dark:text-brand-darkest">Wellness Fact</h3>
                    <p className="text-sm text-brand-dark dark:text-brand-dark mt-1">{fact}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-secondary p-4 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-brand-darkest dark:text-brand-darkest mb-4">Emergency Contacts</h3>
                <div className="space-y-3">
                    {emergencyContacts.map(contact => (
                        <div key={contact.id} className="flex items-center justify-between p-3 bg-brand-lightest dark:bg-dark-primary/20 rounded-lg">
                            <div>
                                <p className="font-semibold text-brand-darkest dark:text-brand-darkest">{contact.name}</p>
                                <p className="text-sm text-gray-500 dark:text-brand-dark/80">{contact.relation}</p>
                            </div>
                            <a href={`tel:${contact.phone}`} className="bg-red-500 text-white p-3 rounded-full shadow-md transform hover:scale-105 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LogEntryModal = ({ type, onClose, onAddLog }: { type: BabyLogType, onClose: () => void, onAddLog: (log: any) => void }) => {
    // Feeding states
    const [feedingType, setFeedingType] = useState<'Breastfeeding' | 'Bottle' | null>(null);
    const [duration, setDuration] = useState('');
    const [amount, setAmount] = useState('');
    // Sleep state
    const [sleepDuration, setSleepDuration] = useState('');
    // Diaper state
    const [diaperType, setDiaperType] = useState<DiaperType | null>(null);
    
    const handleLog = () => {
        const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        let newLog: any = { id: Date.now(), time };

        if (type === 'Feeding') {
            if (feedingType === 'Breastfeeding') {
                newLog = { ...newLog, type: 'Breastfeeding', duration: parseInt(duration), durationUnit: 'min' };
            } else if (feedingType === 'Bottle') {
                 newLog = { ...newLog, type: 'Bottle', amount: parseInt(amount), amountUnit: 'oz' };
            }
        } else if (type === 'Sleep') {
            newLog = { ...newLog, duration: sleepDuration };
        } else if (type === 'Diaper') {
             newLog = { ...newLog, type: diaperType };
        }
        
        onAddLog(newLog);
        onClose();
    };

    const renderFeedingForm = () => (
        <>
            {!feedingType ? (
                <div className="space-y-3">
                    <h3 className="font-bold text-center text-brand-darkest dark:text-brand-darkest">How did you feed?</h3>
                    <button onClick={() => setFeedingType('Breastfeeding')} className="w-full text-left p-4 bg-brand-lightest dark:bg-dark-primary rounded-lg font-semibold text-brand-darkest dark:text-dark-accent">Breastfeeding</button>
                    <button onClick={() => setFeedingType('Bottle')} className="w-full text-left p-4 bg-brand-lightest dark:bg-dark-primary rounded-lg font-semibold text-brand-darkest dark:text-dark-accent">Bottle</button>
                </div>
            ) : feedingType === 'Breastfeeding' ? (
                <div className="space-y-3">
                    <h3 className="font-bold text-center text-brand-darkest dark:text-brand-darkest">Log Breastfeeding</h3>
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-dark">Duration (minutes)</label>
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent dark:text-brand-darkest" placeholder="e.g., 20" />
                </div>
            ) : (
                 <div className="space-y-3">
                    <h3 className="font-bold text-center text-brand-darkest dark:text-brand-darkest">Log Bottle Feed</h3>
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-dark">Amount (oz)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent dark:text-brand-darkest" placeholder="e.g., 4" />
                </div>
            )}
        </>
    );

    const renderSleepForm = () => (
        <div className="space-y-3">
            <h3 className="font-bold text-center text-brand-darkest dark:text-brand-darkest">Log Sleep</h3>
            <label className="block text-sm font-medium text-brand-dark dark:text-brand-dark">Duration (e.g., 2h 30m)</label>
            <input type="text" value={sleepDuration} onChange={e => setSleepDuration(e.target.value)} className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent dark:text-brand-darkest" placeholder="e.g., 1h 45m" />
        </div>
    );
    
    const renderDiaperForm = () => (
         <div className="space-y-3">
            <h3 className="font-bold text-center text-brand-darkest dark:text-brand-darkest">Log Diaper Change</h3>
             <div className="flex space-x-2">
                 {(['Wet', 'Dirty', 'Mixed'] as DiaperType[]).map(dt => (
                     <button key={dt} onClick={() => setDiaperType(dt)} className={`w-full p-3 rounded-lg font-semibold ${diaperType === dt ? 'bg-brand-medium text-white dark:bg-dark-primary dark:text-white' : 'bg-brand-lightest dark:bg-dark-primary/50 text-brand-darkest dark:text-dark-accent'}`}>{dt}</button>
                 ))}
             </div>
        </div>
    );

    const isLogButtonDisabled = () => {
        if (type === 'Feeding') return !feedingType || (feedingType === 'Breastfeeding' && !duration) || (feedingType === 'Bottle' && !amount);
        if (type === 'Sleep') return !sleepDuration;
        if (type === 'Diaper') return !diaperType;
        return true;
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-6 relative" onClick={e => e.stopPropagation()}>
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-brand-dark/70 dark:hover:text-brand-darkest">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                {type === 'Feeding' && renderFeedingForm()}
                {type === 'Sleep' && renderSleepForm()}
                {type === 'Diaper' && renderDiaperForm()}
                <button onClick={handleLog} disabled={isLogButtonDisabled()} className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl disabled:bg-gray-300 dark:disabled:bg-dark-primary/50">
                    Log Entry
                </button>
            </div>
        </div>
    );
};

const BabyScreen = ({ 
    feedings, setFeedings,
    sleeps, setSleeps,
    diapers, setDiapers
 }: { 
    feedings: FeedingLog[], setFeedings: React.Dispatch<React.SetStateAction<FeedingLog[]>>,
    sleeps: SleepLog[], setSleeps: React.Dispatch<React.SetStateAction<SleepLog[]>>,
    diapers: DiaperLog[], setDiapers: React.Dispatch<React.SetStateAction<DiaperLog[]>>
}) => {
    const [activeTab, setActiveTab] = useState<BabyLogType>('Feeding');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const logButtonConfig = {
        Feeding: { text: 'Log Feeding', icon: <FeedingIcon />, color: 'bg-pink-500 shadow-pink-500/30' },
        Sleep: { text: 'Log Sleep', icon: <SleepIcon />, color: 'bg-indigo-500 shadow-indigo-500/30' },
        Diaper: { text: 'Log Diaper', icon: <DiaperIcon />, color: 'bg-green-500 shadow-green-500/30' },
    };

    const handleAddLog = (log: any) => {
        if (activeTab === 'Feeding') setFeedings(prev => [log, ...prev]);
        if (activeTab === 'Sleep') setSleeps(prev => [log, ...prev]);
        if (activeTab === 'Diaper') setDiapers(prev => [log, ...prev]);
    };

    return (
        <div className="p-4 space-y-6">
            {isModalOpen && <LogEntryModal type={activeTab} onClose={() => setIsModalOpen(false)} onAddLog={handleAddLog} />}
            <h2 className="text-2xl font-bold text-brand-darkest dark:text-dark-text">Baby Care Tracker</h2>
            <p className="text-brand-dark dark:text-dark-accent -mt-5">Keep track of your baby's routine</p>
            
            <div className="bg-white dark:bg-dark-secondary p-1 rounded-full flex justify-around shadow-sm">
                {(['Feeding', 'Sleep', 'Diaper'] as BabyLogType[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-brand-medium text-white dark:bg-dark-primary dark:text-white' : 'text-brand-dark dark:text-brand-dark hover:bg-brand-lightest dark:hover:bg-dark-primary/20'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            <button onClick={() => setIsModalOpen(true)} className={`w-full text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg ${logButtonConfig[activeTab].color}`}>
                {logButtonConfig[activeTab].icon}
                <span>{logButtonConfig[activeTab].text}</span>
            </button>
            
            <div className="space-y-4">
                 <h3 className="text-lg font-bold text-brand-darkest dark:text-dark-text">Today's Logs</h3>
                 {activeTab === 'Feeding' && feedings.map(feed => (
                    <div key={feed.id} className="bg-white dark:bg-dark-secondary p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/50 text-pink-500 dark:text-pink-300 rounded-full flex items-center justify-center">
                                {feed.type === 'Bottle' ? 
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-3.38 19.53 1 1 0 0 0 .53.17h5.7a1 1 0 0 0 .53-.17A10 10 0 0 0 12 2Z"></path><path d="M12 6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"></path></svg>
                                    : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5.25c-3.33-2.5-8.5-1.5-8.5 3.75 0 4.5 8.5 9 8.5 9s8.5-4.5 8.5-9c0-5.25-5.17-6.25-8.5-3.75Z"/><path d="M12 11.25a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0-2.5 2.5c0 1.92 1.5 3.5 2.5 3.5Z"/></svg>
                                }
                            </div>
                            <div>
                                <p className="font-semibold text-brand-darkest dark:text-brand-darkest">{feed.type}</p>
                                <p className="text-sm text-gray-500 dark:text-brand-dark/80">{feed.time}</p>
                            </div>
                        </div>
                        <p className="font-bold text-brand-darkest dark:text-brand-darkest">{feed.duration ? `${feed.duration} ${feed.durationUnit}` : `${feed.amount} ${feed.amountUnit}`}</p>
                    </div>
                 ))}
                 {activeTab === 'Sleep' && sleeps.map(sleep => (
                    <div key={sleep.id} className="bg-white dark:bg-dark-secondary p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-300 rounded-full flex items-center justify-center"><SleepIcon /></div>
                             <div>
                                <p className="font-semibold text-brand-darkest dark:text-brand-darkest">Sleep</p>
                                <p className="text-sm text-gray-500 dark:text-brand-dark/80">{sleep.time}</p>
                            </div>
                        </div>
                        <p className="font-bold text-brand-darkest dark:text-brand-darkest">{sleep.duration}</p>
                    </div>
                 ))}
                 {activeTab === 'Diaper' && diapers.map(diaper => (
                    <div key={diaper.id} className="bg-white dark:bg-dark-secondary p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 text-green-500 dark:text-green-300 rounded-full flex items-center justify-center"><DiaperIcon /></div>
                             <div>
                                <p className="font-semibold text-brand-darkest dark:text-brand-darkest">{diaper.type} Diaper</p>
                                <p className="text-sm text-gray-500 dark:text-brand-dark/80">{diaper.time}</p>
                            </div>
                        </div>
                    </div>
                 ))}
            </div>
        </div>
    );
};


const AIInsightsModal = ({ insights, isLoading, onClose }: { insights: AIInsights | null; isLoading: boolean; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-brand-dark/70 dark:hover:text-brand-darkest">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <h2 className="text-2xl font-bold text-brand-darkest dark:text-brand-darkest text-center">AI Insights</h2>
                <div className="text-xs text-center text-brand-dark/80 dark:text-brand-dark italic p-3 bg-brand-lightest dark:bg-dark-primary/50 rounded-lg -mt-2">
                    <p>Please remember, this analysis is a supportive tool and not a substitute for professional mental health care.</p>
                </div>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary dark:border-dark-accent"></div>
                        <p className="mt-4 text-brand-dark dark:text-brand-dark">Analyzing your reflections...</p>
                    </div>
                ) : insights ? (
                    <div className="space-y-6 text-sm">
                        <div>
                            <h3 className="font-bold text-brand-primary dark:text-brand-primary mb-2">Summary</h3>
                            <p className="text-brand-darkest dark:text-dark-accent bg-brand-lightest dark:bg-dark-primary p-3 rounded-lg">{insights.summary}</p>
                        </div>
                         <div>
                            <h3 className="font-bold text-brand-primary dark:text-brand-primary mb-2">Mood Trend</h3>
                            <p className="text-brand-darkest dark:text-dark-accent bg-brand-lightest dark:bg-dark-primary p-3 rounded-lg">{insights.moodTrend}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-primary dark:text-brand-primary mb-2">Suggestions</h3>
                            <ul className="list-disc list-inside space-y-2 text-brand-darkest dark:text-dark-accent bg-brand-lightest dark:bg-dark-primary p-3 rounded-lg">
                                {insights.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-brand-dark dark:text-brand-dark">
                        <p>Could not load insights. Please try again later.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const NewEntryModal = ({ onClose, onSaveEntry, initialEntry }: { onClose: () => void; onSaveEntry: (entry: JournalEntry) => void; initialEntry: JournalEntry | null }) => {
    const [selectedMood, setSelectedMood] = useState<JournalMood | null>(null);
    const [gratitude, setGratitude] = useState('');
    const [lookingForward, setLookingForward] = useState('');
    const [otherThoughts, setOtherThoughts] = useState('');

    useEffect(() => {
        if (initialEntry) {
            setSelectedMood(initialEntry.mood);
            const content = initialEntry.content;
            
            const gratitudeMatch = content.match(/Grateful for: ([\s\S]*?)(?=\n\nLooking forward to:|\n\nOther thoughts:|$)/);
            const lookingForwardMatch = content.match(/Looking forward to: ([\s\S]*?)(?=\n\nOther thoughts:|$)/);
            const otherThoughtsMatch = content.match(/Other thoughts: ([\s\S]*?)$/);

            setGratitude(gratitudeMatch ? gratitudeMatch[1].trim() : '');
            setLookingForward(lookingForwardMatch ? lookingForwardMatch[1].trim() : '');
            
            // A more robust way to get other thoughts if the other sections don't exist
            if (otherThoughtsMatch) {
                 setOtherThoughts(otherThoughtsMatch[1].trim());
            } else if (!gratitudeMatch && !lookingForwardMatch) {
                setOtherThoughts(content);
            }

        }
    }, [initialEntry]);

    const moods: { mood: JournalMood, emoji: string }[] = [
        { mood: 'Feeling Good', emoji: '😊' },
        { mood: 'Feeling Grateful', emoji: '🙏' },
        { mood: 'Feeling Anxious', emoji: '😟' },
        { mood: 'Feeling Overwhelmed', emoji: '😫' },
        { mood: 'Feeling Sad', emoji: '😔' },
    ];
    
    const optionalPrompts = [
        "What made you smile today?", "What is one thing you are struggling with?", "How are you feeling physically and emotionally?",
    ];

    const handleSubmit = () => {
        if (!selectedMood) return;

        const id = initialEntry ? initialEntry.id : Date.now();
        const date = initialEntry ? initialEntry.date : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        let contentParts = [];
        if (gratitude) contentParts.push(`Grateful for: ${gratitude}`);
        if (lookingForward) contentParts.push(`Looking forward to: ${lookingForward}`);
        if (otherThoughts) contentParts.push(`Other thoughts: ${otherThoughts}`);
        const content = contentParts.join('\n\n');

        const newEntry: JournalEntry = {
            id: id,
            date: date,
            mood: selectedMood,
            prompt: 'Daily Reflection',
            content: content.trim() || "No specific thoughts written today.",
        };

        onSaveEntry(newEntry);
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-brand-dark/70 dark:hover:text-brand-darkest z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-center text-brand-darkest dark:text-brand-darkest mb-3">{initialEntry ? 'Edit Entry' : 'How are you feeling today?'}</h3>
                        <div className="flex justify-around">
                            {moods.map(({ mood, emoji }) => (
                                <button key={mood} onClick={() => setSelectedMood(mood)} className={`text-3xl p-2 rounded-full transition-transform transform hover:scale-110 ${selectedMood === mood ? 'bg-brand-light dark:bg-dark-primary' : ''}`}>
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-brand-dark dark:text-brand-dark mb-1">What are 3 things you are grateful for today?</label>
                        <textarea value={gratitude} onChange={e => setGratitude(e.target.value)} rows={2} className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg text-sm bg-transparent dark:text-brand-darkest" />
                    </div>
                    
                     <div>
                        <label className="block text-sm font-medium text-brand-dark dark:text-brand-dark mb-1">What are 3 things you look forward to in the future?</label>
                        <textarea value={lookingForward} onChange={e => setLookingForward(e.target.value)} rows={2} className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg text-sm bg-transparent dark:text-brand-darkest" />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-brand-dark dark:text-brand-dark mb-2">Optional Prompts</h4>
                        <div className="flex flex-wrap gap-2">
                           {optionalPrompts.map(p => (
                               <button key={p} onClick={() => setOtherThoughts(prev => `${prev}\n\n${p}\n`)} className="bg-brand-lightest dark:bg-dark-primary text-brand-primary dark:text-dark-accent text-xs font-semibold px-2 py-1 rounded-full">
                                   {p}
                               </button>
                           ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-brand-dark dark:text-brand-dark mb-1">Any other thoughts?</label>
                        <textarea value={otherThoughts} onChange={e => setOtherThoughts(e.target.value)} rows={4} className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg text-sm bg-transparent dark:text-brand-darkest" />
                    </div>
                    
                    <button onClick={handleSubmit} disabled={!selectedMood} className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl disabled:bg-gray-300 dark:disabled:bg-dark-primary/50">
                        {initialEntry ? 'Save Changes' : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <h3 className="text-lg font-bold text-brand-darkest dark:text-brand-darkest">Delete Entry?</h3>
            <p className="text-sm text-brand-dark dark:text-brand-dark">Are you sure you want to delete this entry permanently? This action cannot be undone.</p>
            <div className="flex space-x-4 pt-2">
                <button onClick={onCancel} className="w-full bg-gray-200 dark:bg-dark-primary/50 text-gray-800 dark:text-dark-accent font-semibold py-2 rounded-lg">Cancel</button>
                <button onClick={onConfirm} className="w-full bg-red-500 text-white font-semibold py-2 rounded-lg">Delete</button>
            </div>
        </div>
    </div>
);

const JournalScreen = ({ entries, setEntries, setConcernMessage, setToastMessage, insights, isInsightsLoading, setInsights, setIsInsightsLoading }: { entries: JournalEntry[], setEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>, setConcernMessage: (msg: string) => void, setToastMessage: (msg: string) => void, insights: AIInsights | null, isInsightsLoading: boolean, setInsights: React.Dispatch<React.SetStateAction<AIInsights | null>>, setIsInsightsLoading: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const [showInsightsModal, setShowInsightsModal] = useState(false);
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDeleteId, setEntryToDeleteId] = useState<number | null>(null);
    const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null);

    const todayString = useMemo(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), []);
    
    const moodColors: {[key in JournalMood]: string} = {
        'Feeling Good': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
        'Feeling Sad': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
        'Feeling Anxious': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
        'Feeling Grateful': 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
        'Feeling Overwhelmed': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
    };

    const handleGetInsights = useCallback(async (currentEntries: JournalEntry[]) => {
        if (!currentEntries || currentEntries.length === 0) {
            setInsights(null);
            setShowInsightsModal(true);
            return;
        }
        setShowInsightsModal(true);
        setIsInsightsLoading(true);
        try {
            const result = await getAIInsights(currentEntries);
            setInsights(result);
            if (result.concernFlag && result.concernMessage) {
                setConcernMessage(result.concernMessage);
            }
        } catch (error) {
            console.error(error);
            setInsights(null);
        } finally {
            setIsInsightsLoading(false);
        }
    }, [setConcernMessage, setInsights, setIsInsightsLoading]);
    
    const handleSaveEntry = (entry: JournalEntry) => {
        const isUpdate = entries.some(e => e.id === entry.id);
        let updatedEntries;
        if (isUpdate) {
            updatedEntries = entries.map(e => e.id === entry.id ? entry : e);
            setEntries(updatedEntries);
            setToastMessage("Your entry has been updated!");
        } else {
            updatedEntries = [entry, ...entries];
            setEntries(updatedEntries);
            setToastMessage("Journal entry saved!");
        }
        setShowEntryModal(false);
        setEntryToEdit(null);
    
        // Automatically trigger AI insights after saving.
        handleGetInsights(updatedEntries);
    };

    const handleNewEntry = () => {
        setEntryToEdit(null);
        setShowEntryModal(true);
    }

    const handleEditRequest = (entry: JournalEntry) => {
        setEntryToEdit(entry);
        setShowEntryModal(true);
    };

    const handleDeleteRequest = (id: number) => {
        setEntryToDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (entryToDeleteId !== null) {
            setEntries(prev => prev.filter(entry => entry.id !== entryToDeleteId));
        }
        setShowDeleteModal(false);
        setEntryToDeleteId(null);
    };

    const closeEntryModal = () => {
        setShowEntryModal(false);
        setEntryToEdit(null);
    };
    
    return (
        <div className="p-4 space-y-6">
            {showInsightsModal && <AIInsightsModal insights={insights} isLoading={isInsightsLoading} onClose={() => setShowInsightsModal(false)} />}
            {showEntryModal && <NewEntryModal onClose={closeEntryModal} onSaveEntry={handleSaveEntry} initialEntry={entryToEdit} />}
            {showDeleteModal && <DeleteConfirmationModal onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} />}
            
            <div>
                <h2 className="text-2xl font-bold text-brand-darkest dark:text-dark-text">Daily Journal</h2>
                <p className="text-brand-dark dark:text-dark-accent">Your private space for reflection</p>
            </div>

            <button onClick={handleNewEntry} className="w-full bg-brand-medium text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-brand-medium/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Write Today's Entry</span>
            </button>
            
            <button onClick={() => handleGetInsights(entries)} className="w-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.09 14.09A6 6 0 0 1 9 18.09M9 18.09C7.43 17.5 6 15.91 6 14a6 6 0 0 1 12 0c0 1.91-1.43 3.5-3 4.09M9 22h6"/><path d="M12 2v6"/></svg>
                <span>Get AI-Powered Insights</span>
            </button>


            <div className="space-y-4">
                <h3 className="text-lg font-bold text-brand-darkest dark:text-dark-text">Past Entries</h3>
                {entries.map(entry => (
                    <div key={entry.id} className="bg-white dark:bg-dark-secondary p-5 rounded-2xl shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2 text-sm text-brand-dark dark:text-brand-dark font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                <span>{entry.date}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                {entry.date === todayString && (
                                    <button onClick={() => handleEditRequest(entry)} className="text-gray-400 hover:text-brand-primary dark:text-brand-dark/70 dark:hover:text-dark-accent">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                )}
                                <button onClick={() => handleDeleteRequest(entry.id)} className="text-gray-400 hover:text-red-500 dark:text-brand-dark/70 dark:hover:text-red-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                             </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <span className={`px-2.5 py-1 rounded-full ${moodColors[entry.mood]}`}>{entry.mood === 'Feeling Good' ? '😊' : entry.mood === 'Feeling Sad' ? '😔' : entry.mood === 'Feeling Anxious' ? '😟' : entry.mood === 'Feeling Grateful' ? '🙏' : '😫' } {entry.mood}</span>
                            <span className="px-2.5 py-1 rounded-full bg-brand-lightest dark:bg-dark-primary text-brand-primary dark:text-dark-accent">✨ {entry.prompt}</span>
                        </div>
                        <p className="text-brand-darkest dark:text-brand-darkest leading-relaxed pt-2 whitespace-pre-wrap">{entry.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NewPostModal = ({ onClose, onAddPost }: { onClose: () => void, onAddPost: (content: string) => void }) => {
    const [content, setContent] = useState('');
    const prompts = ["Share a small win from today...", "What's something that made you laugh?", "Ask for advice on..."];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-center text-brand-darkest dark:text-brand-darkest">Create a Post</h3>
                <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg text-sm bg-transparent dark:text-brand-darkest"
                    rows={5}
                    placeholder="Share your thoughts with the community..."
                />
                <div className="flex flex-wrap gap-2">
                    {prompts.map(p => (
                        <button key={p} onClick={() => setContent(prev => `${prev} ${p}`)} className="bg-brand-lightest dark:bg-dark-primary text-brand-primary dark:text-dark-accent text-xs font-semibold px-2 py-1 rounded-full">
                            {p}
                        </button>
                    ))}
                </div>
                 <div className="flex space-x-4 pt-2">
                    <button onClick={onClose} className="w-full bg-gray-200 dark:bg-dark-primary/50 text-gray-800 dark:text-dark-accent font-semibold py-2 rounded-lg">Cancel</button>
                    <button onClick={() => { onAddPost(content); onClose(); }} disabled={!content.trim()} className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg disabled:bg-gray-300 dark:disabled:bg-dark-primary/50">Post</button>
                </div>
            </div>
        </div>
    );
};

const ReportPostModal = ({ onClose, onSubmit }: { onClose: () => void, onSubmit: (reason: string, details: string) => void }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');
    const reasons = ["Hate Speech", "Spam or Scams", "Harassment", "False Information", "It's inappropriate"];

    const handleSubmit = () => {
        if (selectedReason) {
            onSubmit(selectedReason, details);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-center text-brand-darkest dark:text-brand-darkest">Report Post</h3>
                <p className="text-sm text-center text-brand-dark dark:text-brand-dark -mt-2">Why are you reporting this post?</p>
                <div className="space-y-2">
                    {reasons.map(reason => (
                        <button
                            key={reason}
                            onClick={() => setSelectedReason(reason)}
                            className={`w-full text-left p-3 rounded-lg font-semibold text-sm ${selectedReason === reason ? 'bg-brand-medium text-white dark:bg-dark-primary dark:text-white' : 'bg-brand-lightest dark:bg-dark-primary/50 text-brand-darkest dark:text-dark-accent'}`}
                        >
                            {reason}
                        </button>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-dark mb-1">Additional details (optional)</label>
                    <textarea
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg text-sm bg-transparent dark:text-brand-darkest"
                        placeholder="Provide more information..."
                    />
                </div>
                <div className="flex space-x-4 pt-2">
                    <button onClick={onClose} className="w-full bg-gray-200 dark:bg-dark-primary/50 text-gray-800 dark:text-dark-accent font-semibold py-2 rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} disabled={!selectedReason} className="w-full bg-red-500 text-white font-semibold py-2 rounded-lg disabled:bg-red-300 dark:disabled:bg-red-500/50">Submit Report</button>
                </div>
            </div>
        </div>
    );
};

interface CommunityPostComponentProps {
    post: CommunityPost;
    onReactionUpdate: (postId: number, toIncrement: keyof CommunityPost['reactions'] | null, toDecrement: keyof CommunityPost['reactions'] | null) => void;
    onComment: (postId: number, comment: string) => void;
    onReportRequest: (postId: number) => void;
}

// Fix: Changed component signature to be of type React.FC to correctly handle React's special `key` prop.
const CommunityPostComponent: React.FC<CommunityPostComponentProps> = ({ post, onReactionUpdate, onComment, onReportRequest }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [selectedReaction, setSelectedReaction] = useState<keyof CommunityPost['reactions'] | null>(null);

    const handleReactionClick = (reaction: keyof CommunityPost['reactions']) => {
        let toIncrement: keyof CommunityPost['reactions'] | null = null;
        let toDecrement: keyof CommunityPost['reactions'] | null = null;

        if (selectedReaction === reaction) {
            toDecrement = reaction;
            setSelectedReaction(null);
        } else {
            if (selectedReaction) {
                toDecrement = selectedReaction;
            }
            toIncrement = reaction;
            setSelectedReaction(reaction);
        }
        
        onReactionUpdate(post.id, toIncrement, toDecrement);
    };


    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(commentText.trim()) {
            onComment(post.id, commentText);
            setCommentText('');
        }
    };

    return (
        <div className="bg-white dark:bg-dark-secondary p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-brand-light dark:bg-dark-primary rounded-full flex items-center justify-center text-brand-primary dark:text-dark-accent font-bold">{post.avatarInitial}</div>
                    <div>
                        <p className="font-bold text-sm text-brand-darkest dark:text-brand-darkest">{post.author}</p>
                        <p className="text-xs text-gray-400 dark:text-brand-dark/60">{post.timestamp}</p>
                    </div>
                </div>
                <button onClick={() => onReportRequest(post.id)} className="text-gray-400 hover:text-gray-600 dark:text-brand-dark/60 dark:hover:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>
            </div>
            <p className="text-brand-dark dark:text-brand-dark leading-relaxed">{post.content}</p>
            <div className="flex justify-between items-center border-t border-b border-brand-lightest dark:border-dark-primary/20 py-2">
                <div className="flex space-x-2">
                    {(Object.keys(post.reactions) as (keyof CommunityPost['reactions'])[]).map(r => (
                        <button key={r} onClick={() => handleReactionClick(r)} className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-colors ${selectedReaction === r ? 'bg-brand-light dark:bg-dark-primary/50 text-brand-primary dark:text-brand-darkest' : 'bg-brand-lightest dark:bg-dark-primary/20 text-brand-dark dark:text-brand-dark hover:bg-brand-light/50 dark:hover:bg-dark-primary/30'}`}>
                            <span>{r}</span>
                            <span className="font-semibold">{post.reactions[r]}</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowComments(!showComments)} className="text-sm font-semibold text-brand-dark dark:text-brand-dark">{post.comments.length} Comments</button>
            </div>
            {showComments && (
                <div className="space-y-3 pt-2">
                    {post.comments.map(comment => (
                        <div key={comment.id} className="flex items-start space-x-2">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-dark-primary/50 rounded-full flex items-center justify-center text-gray-600 dark:text-dark-accent font-bold text-sm flex-shrink-0">{comment.avatarInitial}</div>
                            <div className="bg-brand-lightest dark:bg-dark-primary/20 p-2 rounded-lg w-full">
                                <p className="font-bold text-xs text-brand-darkest dark:text-brand-darkest">{comment.author} <span className="text-gray-400 dark:text-brand-dark/60 font-normal ml-2">{comment.timestamp}</span></p>
                                <p className="text-sm text-brand-dark dark:text-brand-dark">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                    <form onSubmit={handleCommentSubmit} className="flex space-x-2">
                        <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="w-full text-sm p-2 border border-brand-light dark:border-dark-primary/50 rounded-full px-4 bg-transparent dark:text-brand-darkest" />
                        <button type="submit" className="bg-brand-medium text-white px-4 rounded-full font-semibold text-sm">Reply</button>
                    </form>
                </div>
            )}
        </div>
    );
};

const SupportHubScreen = ({ posts, setPosts, setToastMessage }: { posts: CommunityPost[], setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>, setToastMessage: (msg: string) => void }) => {
    const [activeTab, setActiveTab] = useState<'Community' | 'Resources'>('Community');
    const [showNewPostModal, setShowNewPostModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [postToReportId, setPostToReportId] = useState<number | null>(null);

    const handleReportRequest = (postId: number) => {
        setPostToReportId(postId);
        setShowReportModal(true);
    };

    const handleReportSubmit = (reason: string, details: string) => {
        setShowReportModal(false);
        setToastMessage("We received your report and will work on addressing your concerns.");
        setPostToReportId(null);
    };
    
    const handleReactionUpdate = (postId: number, toIncrement: keyof CommunityPost['reactions'] | null, toDecrement: keyof CommunityPost['reactions'] | null) => {
        setPosts(posts.map(p => {
            if (p.id === postId) {
                const newReactions = { ...p.reactions };
                if (toIncrement) {
                    newReactions[toIncrement] += 1;
                }
                if (toDecrement && newReactions[toDecrement] > 0) {
                    newReactions[toDecrement] -= 1;
                }
                return { ...p, reactions: newReactions };
            }
            return p;
        }));
    };

    const handleComment = (postId: number, comment: string) => {
        const newComment: CommunityComment = { id: Date.now(), author: 'Sarah Johnson', avatarInitial: 'S', timestamp: 'Just now', content: comment };
        setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    };

    const handleAddPost = (content: string) => {
        const newPost: CommunityPost = {
            id: Date.now(), author: 'Sarah Johnson', avatarInitial: 'S', timestamp: 'Just now', content,
            reactions: { '❤️': 0, '🤗': 0, '👍': 0, '🙏': 0 }, comments: []
        };
        setPosts([newPost, ...posts]);
    };

    const ResourcesView = () => (
        <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/30 p-5 rounded-2xl space-y-4">
                 <h3 className="font-bold text-red-800 dark:text-red-200 flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span>Emergency Contacts</span>
                </h3>
                <div className="space-y-3">
                    <div className="bg-white dark:bg-dark-secondary p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-brand-darkest dark:text-brand-darkest">Postpartum Support International</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">1-800-944-4773</p>
                        </div>
                        <span className="text-xs font-medium text-gray-400 dark:text-brand-dark/60">24/7</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <button className="bg-white dark:bg-dark-secondary p-6 rounded-2xl text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-brand-lightest dark:bg-dark-primary/20 text-brand-primary dark:text-dark-accent p-3 rounded-full inline-block"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                    <p className="font-semibold text-brand-darkest dark:text-brand-darkest">Support Groups</p>
                </button>
                 <button className="bg-white dark:bg-dark-secondary p-6 rounded-2xl text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
                     <div className="bg-brand-lightest dark:bg-dark-primary/20 text-brand-primary dark:text-dark-accent p-3 rounded-full inline-block"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg></div>
                    <p className="font-semibold text-brand-darkest dark:text-brand-darkest">Video Library</p>
                </button>
            </div>
            <div className="bg-white dark:bg-dark-secondary p-5 rounded-2xl space-y-4">
                 <h3 className="font-bold text-brand-darkest dark:text-brand-darkest flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                    <span>Educational Articles</span>
                </h3>
                 <div className="space-y-3">
                     <a href="#" className="flex justify-between items-center p-3 rounded-lg hover:bg-brand-lightest dark:hover:bg-dark-primary/20">
                        <div><p className="font-semibold text-brand-darkest dark:text-brand-darkest">Understanding Postpartum Depression</p><p className="text-sm text-gray-500 dark:text-brand-dark/80">Mental Health</p></div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-brand-dark/70"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 space-y-6">
            {showNewPostModal && <NewPostModal onClose={() => setShowNewPostModal(false)} onAddPost={handleAddPost} />}
            {showReportModal && <ReportPostModal onClose={() => setShowReportModal(false)} onSubmit={handleReportSubmit} />}
            <div>
                <h2 className="text-2xl font-bold text-brand-darkest dark:text-dark-text">Community Nest</h2>
                <p className="text-brand-dark dark:text-dark-accent">Connect with other mothers</p>
            </div>
            <div className="bg-white dark:bg-dark-secondary p-1 rounded-full flex justify-around shadow-sm">
                {(['Community', 'Resources'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-brand-medium text-white dark:bg-dark-primary dark:text-white' : 'text-brand-dark dark:text-brand-dark hover:bg-brand-lightest dark:hover:bg-dark-primary/20'}`}>
                        {tab}
                    </button>
                ))}
            </div>
            {activeTab === 'Community' ? (
                <div className="space-y-4">
                    <button onClick={() => setShowNewPostModal(true)} className="w-full bg-brand-lightest dark:bg-dark-secondary text-brand-primary dark:text-brand-darkest font-bold py-3 rounded-xl flex items-center justify-center space-x-2 border border-brand-light dark:border-dark-primary/20">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20v-4a6 6 0 0 1 6-6v0a6 6 0 0 1 6 6v4" /><path d="M6 20h12" /></svg>
                        <span>Start a Conversation</span>
                    </button>
                    {posts.map(post => <CommunityPostComponent key={post.id} post={post} onReactionUpdate={handleReactionUpdate} onComment={handleComment} onReportRequest={handleReportRequest} />)}
                </div>
            ) : <ResourcesView />}
        </div>
    );
};

const ProfileScreen = ({ settings, setSettings, onLogout, userName, babyName, babyDob, postpartumWeeks, postpartumMonths }: {
    settings: { darkMode: boolean; feedingReminders: boolean; moodCheckins: boolean; selfCareReminders: boolean; },
    setSettings: React.Dispatch<React.SetStateAction<{ darkMode: boolean; feedingReminders: boolean; moodCheckins: boolean; selfCareReminders: boolean; }>>,
    onLogout: () => void,
    userName: string,
    babyName: string,
    babyDob: string,
    postpartumWeeks: number,
    postpartumMonths: number
}) => {
    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const settingItems = [
        { key: 'darkMode', label: 'Dark Mode', description: 'Reduce eye strain in low light.' },
        { key: 'feedingReminders', label: 'Feeding Reminders', description: 'Get notified when it might be time for the next feed.' },
        { key: 'moodCheckins', label: 'Mood Check-ins', description: 'A gentle nudge to reflect on your feelings.' },
        { key: 'selfCareReminders', label: 'Self-Care Reminders', description: 'Reminders to complete your daily goals.' },
    ];

    return (
        <div className="p-4 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-brand-darkest dark:text-dark-text">Profile & Settings</h2>
                <p className="text-brand-dark dark:text-dark-accent">Manage your app experience</p>
            </div>

             {/* User Info Section */}
            <div className="bg-white dark:bg-dark-secondary p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-brand-light dark:bg-dark-primary rounded-full flex items-center justify-center text-brand-primary dark:text-dark-accent text-2xl font-bold">{userName.charAt(0)}</div>
                    <div>
                        <p className="font-bold text-lg text-brand-darkest dark:text-brand-darkest">{userName}</p>
                        <p className="text-sm text-gray-500 dark:text-brand-dark/80">Member since Oct 2025</p>
                    </div>
                </div>
                <button className="text-brand-primary dark:text-dark-accent font-semibold text-sm border border-brand-light dark:border-dark-primary/50 px-4 py-2 rounded-full hover:bg-brand-lightest dark:hover:bg-dark-primary/20 transition-colors">
                    Edit
                </button>
            </div>

            {/* Baby Info / Postpartum Journey Section */}
            <div className="bg-gradient-to-br from-brand-light to-brand-medium-light dark:from-purple-500/80 dark:to-indigo-600/80 p-5 rounded-2xl shadow-lg space-y-4">
                <h3 className="text-lg font-bold text-brand-darkest dark:text-white flex items-center space-x-2">
                    <BabyIcon active={true} /> <span>Your Journey</span>
                </h3>
                <div className="flex justify-around text-center">
                    <div>
                        <p className="text-2xl font-bold text-brand-primary dark:text-white">{postpartumWeeks}</p>
                        <p className="text-sm font-medium text-brand-dark dark:text-indigo-100">Weeks Postpartum</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-brand-primary dark:text-white">{postpartumMonths}</p>
                        <p className="text-sm font-medium text-brand-dark dark:text-indigo-100">Months Postpartum</p>
                    </div>
                </div>
                <div className="pt-3 border-t border-brand-medium/20 dark:border-white/20">
                        <p className="font-semibold text-brand-darkest dark:text-white">Baby: {babyName}</p>
                        <p className="text-sm text-brand-dark dark:text-indigo-100">Born: {new Date(babyDob).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-secondary p-5 rounded-2xl shadow-sm space-y-4">
                {settingItems.map(item => (
                    <div key={item.key} className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-brand-darkest dark:text-brand-darkest">{item.label}</p>
                            <p className="text-sm text-gray-500 dark:text-brand-dark/80">{item.description}</p>
                        </div>
                        <button
                            onClick={() => handleToggle(item.key as keyof typeof settings)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-brand-medium' : 'bg-gray-200 dark:bg-dark-primary/50'}`}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="bg-white dark:bg-dark-secondary p-5 rounded-2xl shadow-sm space-y-4">
                <button className="w-full text-left font-semibold text-brand-darkest dark:text-brand-darkest">Account Information</button>
                <button className="w-full text-left font-semibold text-brand-darkest dark:text-brand-darkest">Help & Support</button>
                <button className="w-full text-left font-semibold text-brand-darkest dark:text-brand-darkest">Privacy Policy</button>
            </div>
            
            <button onClick={onLogout} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl">
                Log Out
            </button>
        </div>
    );
};

const LoginScreen = ({ onLogin, onNavigateToRegister }: { onLogin: () => void, onNavigateToRegister: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-lightest dark:bg-dark-bg">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-brand-primary dark:text-dark-accent">CareNest</h1>
                    <p className="mt-2 text-brand-dark dark:text-dark-accent/80">Your postpartum wellness companion.</p>
                </div>
                <div className="bg-white dark:bg-dark-secondary p-8 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-bold text-center text-brand-darkest dark:text-brand-darkest">Log In</h2>
                    <div>
                        <label className="text-sm font-medium text-brand-dark dark:text-brand-dark">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full mt-1 p-3 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-primary dark:text-brand-primary"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-brand-dark dark:text-brand-dark">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mt-1 p-3 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-primary dark:text-brand-primary"
                            placeholder="••••••••"
                        />
                    </div>
                    <button onClick={onLogin} className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl">
                        Log In
                    </button>
                </div>
                <p className="text-center text-sm text-brand-dark dark:text-brand-dark">
                    Don't have an account?{' '}
                    <button onClick={onNavigateToRegister} className="font-semibold text-brand-primary dark:text-dark-accent hover:underline">
                        Register
                    </button>
                </p>
            </div>
        </div>
    );
};

interface UserInfo {
    fullName: string;
    userDob: string;
    babyName: string;
    babyDob: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const RegistrationScreen = ({ onRegister, onNavigateToLogin }: { onRegister: (goals: DailyGoal[], userInfo: UserInfo, contacts: EmergencyContact[]) => void, onNavigateToLogin: () => void }) => {
    const [registrationStep, setRegistrationStep] = useState<'userInfo' | 'emergencyContacts' | 'questionnaire'>('userInfo');
    const [userInfo, setUserInfo] = useState<UserInfo>({
        fullName: '',
        userDob: '',
        babyName: '',
        babyDob: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState('');

    const [localEmergencyContacts, setLocalEmergencyContacts] = useState<EmergencyContact[]>([]);
    const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '' });
    const [consentChecked, setConsentChecked] = useState(false);
    
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState<RegistrationAnswers>({
        supportScale: 0,
        sleepHours: '',
        emotionalGoal: '',
        selfCareMethods: '',
        stressors: [],
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserInfo(prev => ({ ...prev, [name]: value }));
        if (name === 'confirmPassword' || name === 'password') {
            setPasswordError('');
        }
    };

    const handleContinueFromUserInfo = () => {
        if (userInfo.password !== userInfo.confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }
        if (userInfo.password.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            return;
        }
        setRegistrationStep('emergencyContacts');
    };

    const isUserInfoValid = useMemo(() => {
        const { confirmPassword, ...rest } = userInfo;
        // FIX: Added a type guard `typeof field === 'string'` to prevent a potential runtime error where `field` could be of type `unknown` and not have a `.trim()` method.
        return Object.values(rest).every(field => typeof field === 'string' && field.trim() !== '') && confirmPassword.trim() !== '';
    }, [userInfo]);

    const questions = [
        {
            id: 1,
            question: "On a scale of 1–5, how supported did you feel during your pregnancy?",
            component: (
                <div className="flex justify-around">
                    {[1, 2, 3, 4, 5].map(num => (
                        <button
                            key={num}
                            onClick={() => setAnswers(prev => ({ ...prev, supportScale: num }))}
                            className={`w-12 h-12 rounded-full text-lg font-bold transition-colors ${answers.supportScale === num ? 'bg-brand-medium text-white' : 'bg-brand-lightest dark:bg-dark-primary/50 text-brand-dark'}`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            ),
            isAnswered: answers.supportScale > 0,
        },
        {
            id: 2,
            question: "How many hours do you typically sleep in a 24-hour period?",
            component: <input type="text" value={answers.sleepHours} onChange={e => setAnswers(prev => ({...prev, sleepHours: e.target.value}))} className="w-full p-3 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-primary dark:text-brand-primary" placeholder="e.g., 5 hours, broken" />,
            isAnswered: answers.sleepHours.trim() !== '',
        },
        {
            id: 3,
            question: "What is your primary emotional health goal right now?",
            component: <input type="text" value={answers.emotionalGoal} onChange={e => setAnswers(prev => ({...prev, emotionalGoal: e.target.value}))} className="w-full p-3 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-primary dark:text-brand-primary" placeholder="e.g., feel calmer, sleep better..." />,
            isAnswered: answers.emotionalGoal.trim() !== '',
        },
        {
            id: 4,
            question: "What self-care activities or coping methods work best for you?",
            component: <input type="text" value={answers.selfCareMethods} onChange={e => setAnswers(prev => ({...prev, selfCareMethods: e.target.value}))} className="w-full p-3 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-primary dark:text-brand-primary" placeholder="e.g., Exercise, journaling, talking..." />,
            isAnswered: answers.selfCareMethods.trim() !== '',
        },
        {
            id: 5,
            question: "What are your main stressors currently? (Select up to 3)",
            component: (
                 <div className="space-y-2">
                    {['Lack of sleep', 'Feeding challenges', 'Health issues', 'Relationship stress', 'Financial stress', 'Isolation / loneliness', 'Domestic workload', 'Work-life balance'].map(stressor => (
                        <button
                            key={stressor}
                            onClick={() => {
                                const currentStressors = answers.stressors;
                                if (currentStressors.includes(stressor)) {
                                    setAnswers(prev => ({...prev, stressors: currentStressors.filter(s => s !== stressor)}));
                                } else if (currentStressors.length < 3) {
                                    setAnswers(prev => ({...prev, stressors: [...currentStressors, stressor]}));
                                }
                            }}
                            className={`w-full text-left p-3 rounded-lg font-semibold text-sm transition-colors ${answers.stressors.includes(stressor) ? 'bg-brand-medium text-white' : 'bg-brand-lightest dark:bg-dark-primary/50 text-brand-darkest dark:text-dark-accent'}`}
                        >
                            {stressor}
                        </button>
                    ))}
                </div>
            ),
            isAnswered: answers.stressors.length > 0,
        },
    ];

    const currentQuestion = questions[step - 1];

    const handleNext = () => {
        if (step < questions.length) {
            setStep(s => s + 1);
        } else {
            handleFinish();
        }
    };
    
    const handleBack = () => {
        if (step > 1) {
            setStep(s => s - 1);
        } else if (step === 1) {
            setRegistrationStep('emergencyContacts');
        }
    };

    const handleFinish = async () => {
        setIsGenerating(true);
        try {
            const goals = await generateDailyGoals(answers);
            onRegister(goals, userInfo, localEmergencyContacts);
        } catch(error) {
            console.error("Failed to generate goals:", error);
            onRegister(initialGoals, userInfo, localEmergencyContacts);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNewContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewContact(prev => ({ ...prev, [name]: value }));
    };

    const addContact = () => {
        if (newContact.name.trim() && newContact.relation.trim() && newContact.phone.trim()) {
            setLocalEmergencyContacts(prev => [...prev, { ...newContact, id: Date.now() }]);
            setNewContact({ name: '', relation: '', phone: '' });
        }
    };

    const removeContact = (idToRemove: number) => {
        setLocalEmergencyContacts(prev => prev.filter(contact => contact.id !== idToRemove));
    };

    if (isGenerating) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-lightest dark:bg-dark-bg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary dark:border-dark-accent mb-4"></div>
                <h2 className="text-xl font-bold text-brand-darkest dark:text-dark-text">Personalizing your experience...</h2>
                <p className="text-brand-dark dark:text-dark-accent">Our AI is creating a daily care plan just for you.</p>
            </div>
        );
    }
    
    if (registrationStep === 'userInfo') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-lightest dark:bg-dark-bg">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-dark-secondary p-8 rounded-2xl shadow-lg space-y-4">
                        <div className="text-center mb-4">
                            <h1 className="text-3xl font-bold text-brand-primary dark:text-dark-accent">Join CareNest</h1>
                            <p className="mt-1 text-brand-dark dark:text-dark-accent/80">Let's get your account set up.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-brand-dark dark:text-brand-dark">Full Name</label>
                                <input name="fullName" value={userInfo.fullName} onChange={handleUserInfoChange} className="w-full mt-1 p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-brand-dark dark:text-brand-dark">Your Birth Date</label>
                                <input name="userDob" type="date" value={userInfo.userDob} onChange={handleUserInfoChange} className="w-full mt-1 p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-brand-dark dark:text-brand-dark">Baby's Name</label>
                                <input name="babyName" value={userInfo.babyName} onChange={handleUserInfoChange} className="w-full mt-1 p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-brand-dark dark:text-brand-dark">Baby's Birth Date</label>
                                <input name="babyDob" type="date" value={userInfo.babyDob} onChange={handleUserInfoChange} className="w-full mt-1 p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-dark dark:text-brand-dark">Email</label>
                            <input name="email" type="email" value={userInfo.email} onChange={handleUserInfoChange} className="w-full mt-1 p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-dark dark:text-brand-dark">Password</label>
                            <input name="password" type="password" placeholder="6+ characters" value={userInfo.password} onChange={handleUserInfoChange} className="w-full mt-1 p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-brand-dark dark:text-brand-dark">Confirm Password</label>
                            <input name="confirmPassword" type="password" value={userInfo.confirmPassword} onChange={handleUserInfoChange} className="w-full mt-1 p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                        </div>
                        {passwordError && <p className="text-red-500 text-xs text-center">{passwordError}</p>}
                        
                        <button onClick={handleContinueFromUserInfo} disabled={!isUserInfoValid} className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl disabled:bg-gray-300 dark:disabled:bg-dark-primary/50">
                            Continue
                        </button>
                    </div>
                    <p className="text-center text-sm text-brand-dark dark:text-brand-dark mt-8">
                        Already have an account?{' '}
                        <button onClick={onNavigateToLogin} className="font-semibold text-brand-primary dark:text-dark-accent hover:underline">
                            Log In
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    if (registrationStep === 'emergencyContacts') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-lightest dark:bg-dark-bg">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-dark-secondary p-8 rounded-2xl shadow-lg space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-brand-darkest dark:text-brand-darkest">Emergency Contacts</h2>
                            <p className="mt-1 text-brand-dark dark:text-dark-accent/80">Add people you trust who can be contacted in a crisis.</p>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {localEmergencyContacts.map((contact) => (
                                <div key={contact.id} className="flex items-center justify-between p-2 bg-brand-lightest dark:bg-dark-primary/20 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-brand-darkest dark:text-brand-darkest text-sm">{contact.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-brand-dark/80">{contact.relation} - {contact.phone}</p>
                                    </div>
                                    <button onClick={() => removeContact(contact.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-brand-light dark:border-dark-primary/50 pt-4 space-y-3">
                            <h3 className="font-semibold text-brand-darkest dark:text-brand-darkest">Add a new contact</h3>
                            <div className="grid grid-cols-2 gap-2">
                                 <input name="name" value={newContact.name} onChange={handleNewContactChange} placeholder="Name" className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                                 <input name="relation" value={newContact.relation} onChange={handleNewContactChange} placeholder="Relation (e.g., Partner)" className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                            </div>
                            <input name="phone" type="tel" value={newContact.phone} onChange={handleNewContactChange} placeholder="Phone Number" className="w-full p-2 border border-brand-light dark:border-dark-primary/50 rounded-lg bg-transparent text-brand-darkest dark:text-brand-darkest" />
                            <button onClick={addContact} className="w-full bg-brand-medium-light text-brand-darkest font-bold py-2 rounded-xl">Add Contact</button>
                        </div>
                        <div className="flex items-start space-x-3 pt-4">
                            <input
                                type="checkbox"
                                id="consent-checkbox"
                                checked={consentChecked}
                                onChange={(e) => setConsentChecked(e.target.checked)}
                                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <label htmlFor="consent-checkbox" className="text-xs text-brand-dark dark:text-brand-dark">
                                Checking this box confirms that the following individuals agree to being your emergency contacts and being messaged or called on your behalf during a mental health crisis.
                            </label>
                        </div>
                        <div className="flex space-x-4 pt-2">
                            <button onClick={() => setRegistrationStep('userInfo')} className="w-full bg-gray-200 dark:bg-dark-primary/50 text-gray-800 dark:text-dark-accent font-semibold py-3 rounded-xl">
                                Back
                            </button>
                            <button onClick={() => setRegistrationStep('questionnaire')} disabled={localEmergencyContacts.length === 0 || !consentChecked} className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl disabled:bg-gray-300 dark:disabled:bg-dark-primary/50">
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-lightest dark:bg-dark-bg">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-dark-secondary p-8 rounded-2xl shadow-lg space-y-6">
                    <div className="relative h-2 w-full bg-brand-lightest dark:bg-dark-primary/50 rounded-full">
                        <div className="absolute top-0 left-0 h-2 bg-brand-medium rounded-full transition-all duration-500" style={{ width: `${(step / questions.length) * 100}%` }}></div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-brand-darkest dark:text-brand-darkest">{currentQuestion.question}</h2>
                    </div>
                    <div>{currentQuestion.component}</div>
                    <div className="flex space-x-4">
                         <button onClick={handleBack} className="w-full bg-gray-200 dark:bg-dark-primary/50 text-gray-800 dark:text-dark-accent font-semibold py-3 rounded-xl">
                            Back
                        </button>
                        <button onClick={handleNext} disabled={!currentQuestion.isAnswered} className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl disabled:bg-gray-300 dark:disabled:bg-dark-primary/50">
                            {step === questions.length ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
                 <p className="text-center text-sm text-brand-dark dark:text-brand-dark mt-8">
                    Already have an account?{' '}
                    <button onClick={onNavigateToLogin} className="font-semibold text-brand-primary dark:text-dark-accent hover:underline">
                        Log In
                    </button>
                </p>
            </div>
        </div>
    );
};


// --- APP COMPONENT ---
export default function App() {
    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

    // User State
    const [userName, setUserName] = useState('Sarah Johnson');
    const [babyName, setBabyName] = useState('Emma');
    const [babyDob, setBabyDob] = useState('2025-09-06');
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(initialEmergencyContacts);
    
    // App State
    const [activeScreen, setActiveScreen] = useState<Screen>('home');
    const [goals, setGoals] = useState<DailyGoal[]>(initialGoals);
    const [feedings, setFeedings] = useState<FeedingLog[]>(initialFeedings);
    const [sleeps, setSleeps] = useState<SleepLog[]>(initialSleeps);
    const [diapers, setDiapers] = useState<DiaperLog[]>(initialDiapers);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);
    const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(initialCommunityPosts);

    // Insights State
    const [insights, setInsights] = useState<AIInsights | null>(null);
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);
    const [concernMessage, setConcernMessage] = useState<string>('');
    const [showConcernBanner, setShowConcernBanner] = useState(false);
    
    // Gamification State
    const [userLevel, setUserLevel] = useState(1);
    const [userXp, setUserXp] = useState(25);
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);
    const [selfCareStreak, setSelfCareStreak] = useState(3);
    const [streakAwardedToday, setStreakAwardedToday] = useState(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    // Settings State
    const [settings, setSettings] = useState({
        darkMode: false,
        feedingReminders: true,
        moodCheckins: true,
        selfCareReminders: true,
    });
    
    const MAX_XP = 100;
    const levelLabels = ["New Bloom", "Growing Sprout", "Strong Root", "Shining Sun", "Full Bloom"];
    const levelLabel = levelLabels[userLevel - 1] || levelLabels[levelLabels.length - 1];

    useEffect(() => {
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings.darkMode]);

    useEffect(() => {
        if (concernMessage) {
            setShowConcernBanner(true);
        }
    }, [concernMessage]);

    useEffect(() => {
        const autoFetchInsights = async () => {
            if (journalEntries && journalEntries.length > 0) {
                setIsInsightsLoading(true);
                try {
                    const result = await getAIInsights(journalEntries);
                    setInsights(result);
                    if (result.concernFlag && result.concernMessage) {
                        setConcernMessage(result.concernMessage);
                    }
                } catch (error) {
                    console.error("Error auto-fetching insights for home screen:", error);
                    setInsights(null);
                } finally {
                    setIsInsightsLoading(false);
                }
            } else {
                setInsights(null);
            }
        };

        if (isLoggedIn) {
            autoFetchInsights();
        }
    }, [journalEntries, isLoggedIn]);
    
    // Auth handlers
    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleRegister = (newGoals: DailyGoal[], userInfo: UserInfo, contacts: EmergencyContact[]) => {
        setGoals(newGoals);
        setUserName(userInfo.fullName);
        setBabyName(userInfo.babyName);
        setBabyDob(userInfo.babyDob);
        setEmergencyContacts(contacts);
        setUserLevel(1);
        setUserXp(0);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setAuthScreen('login');
    };

    const calculateAgeInWeeks = (dob: string): number => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - birthDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 7);
    };
    const babyAgeWeeks = calculateAgeInWeeks(babyDob);

    const calculateAgeInMonths = (dob: string): number => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
        months -= birthDate.getMonth();
        months += today.getMonth();
        if (today.getDate() < birthDate.getDate()) {
            months--;
        }
        return months <= 0 ? 0 : months;
    };
    const babyAgeMonths = calculateAgeInMonths(babyDob);

    const renderScreen = () => {
        switch (activeScreen) {
            case 'home': return <HomeScreen 
                goals={goals} setGoals={setGoals} 
                insights={insights} isLoading={isInsightsLoading} entries={journalEntries}
                userLevel={userLevel} levelLabel={levelLabel} userXp={userXp} MAX_XP={MAX_XP}
                setUserLevel={setUserLevel} setUserXp={setUserXp} setShowLevelUpModal={setShowLevelUpModal}
                selfCareStreak={selfCareStreak} setSelfCareStreak={setSelfCareStreak}
                streakAwardedToday={streakAwardedToday} setStreakAwardedToday={setStreakAwardedToday}
                emergencyContacts={emergencyContacts}
                babyName={babyName}
                babyAgeWeeks={babyAgeWeeks}
            />;
            case 'baby': return <BabyScreen 
                feedings={feedings} setFeedings={setFeedings}
                sleeps={sleeps} setSleeps={setSleeps}
                diapers={diapers} setDiapers={setDiapers}
            />;
            case 'journal': return <JournalScreen 
                entries={journalEntries} setEntries={setJournalEntries} 
                setConcernMessage={setConcernMessage} setToastMessage={setToastMessage}
                insights={insights} isInsightsLoading={isInsightsLoading}
                setInsights={setInsights} setIsInsightsLoading={setIsInsightsLoading}
            />;
            case 'resources': return <SupportHubScreen 
                posts={communityPosts} setPosts={setCommunityPosts} setToastMessage={setToastMessage}
            />;
            case 'profile': return <ProfileScreen 
                settings={settings} setSettings={setSettings} 
                onLogout={handleLogout} 
                userName={userName}
                babyName={babyName}
                babyDob={babyDob}
                postpartumWeeks={babyAgeWeeks}
                postpartumMonths={babyAgeMonths}
            />;
            default: return <HomeScreen 
                goals={goals} setGoals={setGoals} 
                insights={insights} isLoading={isInsightsLoading} entries={journalEntries}
                userLevel={userLevel} levelLabel={levelLabel} userXp={userXp} MAX_XP={MAX_XP}
                setUserLevel={setUserLevel} setUserXp={setUserXp} setShowLevelUpModal={setShowLevelUpModal}
                selfCareStreak={selfCareStreak} setSelfCareStreak={setSelfCareStreak}
                streakAwardedToday={streakAwardedToday} setStreakAwardedToday={setStreakAwardedToday}
                emergencyContacts={emergencyContacts}
                babyName={babyName}
                babyAgeWeeks={babyAgeWeeks}
            />;
        }
    };
    
    if (!isLoggedIn) {
        if (authScreen === 'login') {
            return <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setAuthScreen('register')} />;
        }
        return <RegistrationScreen onRegister={handleRegister} onNavigateToLogin={() => setAuthScreen('login')} />;
    }

    return (
        <div className="font-sans text-base antialiased text-brand-darkest dark:text-dark-text min-h-screen">
            <Header title="CareNest" />
            
            {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage('')} />}
            {showConcernBanner && <ConcernBanner message={concernMessage} onDismiss={() => setShowConcernBanner(false)} />}
            {showLevelUpModal && <LevelUpModal level={userLevel} onClose={() => setShowLevelUpModal(false)} />}
            
            <main className="pt-20 pb-24">
                {renderScreen()}
            </main>
            
            <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        </div>
    );
}
