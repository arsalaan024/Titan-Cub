
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/db';
import { Achievement, Activity, Club } from '../types';

interface PublicProfileViewProps {
    clubs: Club[];
    activities: Activity[];
    achievements: Achievement[];
}

const PublicProfileView: React.FC<PublicProfileViewProps> = ({ clubs, activities, achievements }) => {
    const { userId } = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        db.getUserProfile(userId).then(p => {
            setProfile(p);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24">
                <div className="text-center">
                    <div className="text-6xl mb-6">👤</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-3">Profile Not Found</h2>
                    <p className="text-gray-400 mb-6">This user hasn't set up their profile yet.</p>
                    <Link to="/clubs" className="text-[#800000] font-black hover:underline">← Back to Clubs</Link>
                </div>
            </div>
        );
    }

    const myAchievements = achievements.filter(a =>
        a.userId === userId || a.participantName?.toLowerCase() === profile.displayName?.toLowerCase()
    );
    const myClubs = clubs.filter(c =>
        activities.some(act => act.clubId === c.id && myAchievements.some(a => a.activityId === act.id))
    );
    const myActivities = activities.filter(a =>
        myClubs.some(c => c.id === a.clubId) || myAchievements.some(ach => ach.activityId === a.id)
    );

    const initials = profile.displayName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    return (
        <div className="min-h-screen bg-gray-50 py-24">
            <div className="max-w-4xl mx-auto px-4">

                {/* Hero */}
                <div className="relative bg-gradient-to-br from-[#800000] via-[#6b0000] to-[#4a0000] rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div className="relative p-10 flex flex-col md:flex-row items-center gap-8">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-white/20 shadow-2xl flex-shrink-0">
                            {profile.photoUrl ? (
                                <img src={profile.photoUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/15 flex items-center justify-center text-white font-black text-3xl">
                                    {initials}
                                </div>
                            )}
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-4xl font-black text-white tracking-tighter">{profile.displayName}</h1>
                            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                                <span className="bg-white/15 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
                                    {profile.role?.replace('_', ' ')}
                                </span>
                            </div>
                            {profile.bio && (
                                <p className="text-white/70 mt-4 font-medium text-sm max-w-md">{profile.bio}</p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8">
                            {[
                                { label: 'Clubs', value: myClubs.length },
                                { label: 'Activities', value: myActivities.length },
                                { label: 'Wins', value: myAchievements.length },
                            ].map(s => (
                                <div key={s.label} className="text-center">
                                    <div className="text-3xl font-black text-white">{s.value}</div>
                                    <div className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Achievements */}
                {myAchievements.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">🏆 Achievements</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {myAchievements.map((ach, i) => (
                                <div key={ach.id} className="flex gap-4 items-start p-4 rounded-2xl bg-amber-50 border border-amber-100">
                                    <div className="text-3xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}</div>
                                    <div>
                                        <div className="font-black text-gray-900">{ach.achievement}</div>
                                        <div className="text-xs text-gray-500 mt-1">{ach.activityName}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Clubs */}
                {myClubs.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">🏛️ Clubs</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {myClubs.map(club => (
                                <div key={club.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                                    {club.logo ? <img src={club.logo} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <div className="w-10 h-10 rounded-xl bg-[#800000]/10 flex items-center justify-center text-[#800000] font-black">{club.name[0]}</div>}
                                    <div>
                                        <div className="font-black text-gray-900 text-sm">{club.name}</div>
                                        <div className="text-gray-400 text-xs">{club.tagline}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfileView;
