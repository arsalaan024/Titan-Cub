import { User, Club, Activity, CareerItem, ChatMessage, Announcement, Achievement, TeamMember, AchievementPost, UserRole } from '../types';

let authToken: string | null = null;
const WORKER_URL = (import.meta as any).env?.VITE_CLOUDFLARE_WORKER_URL || '';

export const setDbToken = (token: string | null) => {
  authToken = token;
};

const fetcher = async (path: string, options: RequestInit = {}) => {
  if (!WORKER_URL) throw new Error('Cloudflare Worker URL is not configured.');

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };

  const response = await fetch(`${WORKER_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Network request failed';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch (e) {
      // Not a JSON error, use plain text
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const db = {
  // --- Profiles / Users ---
  getUsers: async () => {
    return fetcher('/api/users');
  },

  updateUserStatus: async (userId: string, status: 'active' | 'inactive') => {
    await fetcher(`/api/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },

  updateUserRole: async (userId: string, role: UserRole) => {
    await fetcher(`/api/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
  },

  updateUserGameStats: async (userId: string, points: number, accuracy: number, levelCleared: boolean, isCodingGauntlet: boolean = false) => {
    await fetcher(`/api/users/${userId}/game-stats`, {
      method: 'PUT',
      body: JSON.stringify({ points, accuracy, levelCleared, isCodingGauntlet })
    });
  },

  getLeaderboard: async () => {
    return fetcher('/api/leaderboard');
  },

  // --- Clubs ---
  getClubs: async () => {
    return fetcher('/api/clubs');
  },
  addClub: async (club: any) => {
    return fetcher('/api/clubs', { method: 'POST', body: JSON.stringify(club) });
  },
  updateClub: async (club: any) => {
    await fetcher(`/api/clubs/${club.id}`, { method: 'PUT', body: JSON.stringify(club) });
  },
  deleteClub: async (id: string) => {
    await fetcher(`/api/clubs/${id}`, { method: 'DELETE' });
  },

  // --- Activities ---
  getActivities: async () => {
    return fetcher('/api/activities');
  },
  addActivity: async (act: any) => {
    return fetcher('/api/activities', { method: 'POST', body: JSON.stringify(act) });
  },
  updateActivity: async (act: any) => {
    await fetcher(`/api/activities/${act.id}`, { method: 'PUT', body: JSON.stringify(act) });
  },
  deleteActivity: async (id: string) => {
    await fetcher(`/api/activities/${id}`, { method: 'DELETE' });
  },

  // --- Achievements ---
  getAchievements: async () => {
    return fetcher('/api/achievements');
  },
  addAchievement: async (ach: any) => {
    return fetcher('/api/achievements', { method: 'POST', body: JSON.stringify(ach) });
  },
  updateAchievement: async (ach: any) => {
    await fetcher(`/api/achievements/${ach.id}`, { method: 'PUT', body: JSON.stringify(ach) });
  },
  deleteAchievement: async (id: string) => {
    await fetcher(`/api/achievements/${id}`, { method: 'DELETE' });
  },

  // --- Team Members ---
  getTeamMembers: async () => {
    return fetcher('/api/team-members');
  },
  addTeamMember: async (member: any) => {
    return fetcher('/api/team-members', { method: 'POST', body: JSON.stringify(member) });
  },
  updateTeamMember: async (member: any) => {
    await fetcher(`/api/team-members/${member.id}`, { method: 'PUT', body: JSON.stringify(member) });
  },

  // --- Announcements ---
  getAnnouncements: async () => {
    return fetcher('/api/announcements');
  },
  addAnnouncement: async (ann: any) => {
    return fetcher('/api/announcements', { method: 'POST', body: JSON.stringify(ann) });
  },

  // --- Social Posts ---
  getStudentPosts: async () => {
    return fetcher('/api/posts');
  },
  addStudentPost: async (post: any) => {
    return fetcher('/api/posts', { method: 'POST', body: JSON.stringify(post) });
  },

  // --- Career ---
  getCareer: async () => {
    return fetcher('/api/career');
  },
  addCareer: async (item: any) => {
    return fetcher('/api/career', { method: 'POST', body: JSON.stringify(item) });
  },
  deleteCareer: async (id: string) => {
    await fetcher(`/api/career/${id}`, { method: 'DELETE' });
  },

  // --- Global Chat ---
  getGlobalChat: async () => {
    return fetcher('/api/chat');
  },
  addGlobalChat: async (msg: any) => {
    await fetcher('/api/chat', { method: 'POST', body: JSON.stringify(msg) });
  }
};
