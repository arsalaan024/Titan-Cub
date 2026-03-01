import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- COMPREHENSIVE SAMPLE DATA ---
const sampleProfiles = [
  { id: 'u1', name: 'Arsalaan Khan', email: 'arsalaan@example.com', role: 'SUPER_ADMIN', status: 'active' },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'ADMIN', status: 'active' },
  { id: 'u3', name: 'Alex Rivers', email: 'alex@example.com', role: 'STUDENT', status: 'active' },
  { id: 'u4', name: 'Priya Sharma', email: 'priya@example.com', role: 'STUDENT', status: 'active' },
];

const sampleClubs = [
  { id: 'c1', name: 'Titan Robotics', tagline: 'Innovate. Build. Dominate.', description: 'Building the next generation of autonomous systems.', lead_name: 'Sarah Chen', faculty_name: 'Dr. Smith', banner_image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200', logo: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=200', theme_color: '#800000' },
  { id: 'c2', name: 'Cyber Sentinel', tagline: 'Secure the Future.', description: 'Advanced cybersecurity research and capture the flag competitions.', lead_name: 'Alex Rivers', faculty_name: 'Prof. Miller', banner_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200', logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=200', theme_color: '#000080' },
];

const sampleActivities = [
  { id: 'a1', name: 'Robo-Wars 2026', club_id: 'c1', club_name: 'Titan Robotics', date: '2026-03-15', report_url: '#', photos: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800'] },
  { id: 'a2', name: 'CTF Challenge', club_id: 'c2', club_name: 'Cyber Sentinel', date: '2026-04-10', report_url: '#', photos: ['https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'] },
];

const sampleAchievements = [
  { id: 'ach1', participant_name: 'Alex Rivers', activity_name: 'CTF Challenge', achievement: '1st Place', certificate_url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&q=80&w=400', user_id: 'u3' },
  { id: 'ach2', participant_name: 'Priya Sharma', activity_name: 'Robo-Wars 2026', achievement: 'Best Design', certificate_url: 'https://images.unsplash.com/photo-1589330694653-999330694653?auto=format&fit=crop&q=80&w=400', user_id: 'u4' },
];

const samplePosts = [
  { id: 'p1', user_id: 'u3', user_name: 'Alex Rivers', topic: 'Won the Regional Hackathon!', domain: 'AI & ML', rank: 'Winner', description: 'Our team built an AI-powered disaster response system that won first prize at the Regional Hackathon. Check out the demo!', photos: ['https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800'], timestamp: new Date().toISOString() },
];

const sampleAnnouncements = [
  { id: 'ann1', text: 'Welcome to the new Titan Club Portal!', sender_name: 'System', timestamp: new Date().toISOString(), is_global: true },
];

const sampleCareer = [
  { id: 'caee0000-0000-0000-0000-000000000001', type: 'internship', title: 'Software Engineering Intern', company: 'Google', description: 'Looking for enthusiastic developers to join our team.', date: '2026-05-01', link: 'https://google.com/careers' },
  { id: 'caee0000-0000-0000-0000-000000000002', type: 'placement', title: 'Full Stack Developer', company: 'Microsoft', student_name: 'Arsalaan Khan', package: '45 LPA', is_record: true, batch: '2025', quote: 'Titan Club paved the way for my success.', student_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
];

const getTableData = (table: string) => {
  switch (table) {
    case 'profiles': return sampleProfiles;
    case 'clubs': return sampleClubs;
    case 'activities': return sampleActivities;
    case 'achievements': return sampleAchievements;
    case 'student_posts': return samplePosts;
    case 'announcements': return sampleAnnouncements;
    case 'career_items': return sampleCareer;
    default: return [];
  }
};

const createMockBuilder = (table: string) => {
  const builder: any = {
    _data: getTableData(table),
    then: (resolve: any) => resolve({ data: builder._data, error: null }),
    select: () => builder,
    eq: (col: string, val: any) => {
      builder._data = builder._data.filter((item: any) => item[col] === val);
      return builder;
    },
    order: () => builder,
    not: () => builder,
    single: () => {
      const originalThen = builder.then;
      builder.then = (resolve: any) => resolve({ data: builder._data[0] || null, error: null });
      return builder;
    },
    insert: (obj: any) => {
      builder._data = Array.isArray(obj) ? obj : [obj];
      return builder;
    },
    update: (obj: any) => builder,
    delete: () => builder,
  };
  return builder;
};

const mockClient: any = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signInWithPassword: async ({ email, password }: any) => {
      console.log('OFFLINE AUTH: Simulating Login for', email);
      return {
        data: {
          user: {
            id: 'mock-user-id',
            email: email,
            user_metadata: { name: 'Titan Member', role: 'STUDENT' }
          }
        },
        error: null
      };
    },
    signUp: async ({ email, password, options }: any) => {
      console.log('OFFLINE AUTH: Simulating Signup for', email);
      return {
        data: {
          user: {
            id: 'mock-user-id',
            email: email,
            user_metadata: options.data
          }
        },
        error: null
      };
    },
    signOut: async () => { },
  },
  from: (table: string) => createMockBuilder(table),
};

let supabaseInstance: any = null;
const USE_OFFLINE_MODE = false; // Disabling since VPN is now active

try {
  console.log('--- SUPABASE INITIALIZATION ---');

  if (USE_OFFLINE_MODE) {
    console.warn("⚠️ OFFLINE MODE ENABLED: Using Synthetic Identity Service.");
    supabaseInstance = mockClient;
  } else if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);

    // Quick test of the connection
    supabaseInstance.from('clubs').select('count', { count: 'exact', head: true })
      .then((res: any) => {
        if (res.error) console.error('Supabase Connection Test Failed:', res.error);
        else console.log('Supabase Connection Test Successful.');
      })
      .catch((err: any) => {
        console.error('Supabase Fetch Protocol Error:', err);
      });
  } else {
    // If truly missing, we fallback but show a loud error
    console.error("FATAL ERROR: Supabase Credentials Missing in .env.local!");
    supabaseInstance = mockClient;
  }
} catch (error) {
  console.error("Supabase Initialization Error:", error);
  supabaseInstance = mockClient;
}

export const supabase = supabaseInstance;
