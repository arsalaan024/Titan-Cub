
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/db';
import { User, UserRoles, Announcement } from '../types';

interface HomeViewProps {
  user: User | null;
  announcements: Announcement[];
}

const HomeView: React.FC<HomeViewProps> = ({ user, announcements: allAnnouncements }) => {
  const [newAnn, setNewAnn] = useState('');
  const [showAnnWidget, setShowAnnWidget] = useState(false);
  const announcements = (allAnnouncements || []).filter(a => a.isGlobal);
  const isSuperAdmin = user?.role === UserRoles.SUPER_ADMIN;

  const handlePostAnnouncement = () => {
    if (!newAnn.trim() || !user) return;
    db.addAnnouncement({
      text: newAnn,
      timestamp: new Date().toLocaleString(),
      senderName: user.name,
      isGlobal: true
    }).then(() => {
      setNewAnn('');
      alert('Global announcement broadcasted!');
    });
  };

  return (
    <div className="flex flex-col relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] md:min-h-[95vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-maroon-950">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1920"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            alt="Campus"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-maroon-950/80 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-white">
          <div className="inline-block bg-white/10 backdrop-blur-md px-4 py-1.5 md:px-6 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-8 md:mb-10 border border-white/20 animate-fade-in shadow-xl">Titan Parent Organization</div>
          <h1 className="text-5xl sm:text-7xl md:text-[10rem] font-black mb-8 md:mb-10 tracking-tighter leading-[0.9] md:leading-[0.8] animate-slide-up">
            COMMAND <br /><span className="text-maroon-500">EXCELLENCE.</span>
          </h1>
          <p className="text-lg md:text-3xl text-maroon-100/70 max-w-3xl mb-12 md:mb-16 leading-relaxed font-bold animate-slide-up [animation-delay:100ms]">
            The strategic nexus for student-led innovation, professional growth, and multi-club governance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-8 animate-slide-up [animation-delay:200ms]">
            <Link to="/clubs" className="px-10 py-5 md:px-14 md:py-6 bg-white text-maroon-900 rounded-[1.5rem] md:rounded-[2rem] font-black hover:bg-maroon-50 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 uppercase tracking-widest text-xs md:text-sm text-center">Explore Sub-Clubs</Link>
            <Link to="/activities" className="px-10 py-5 md:px-14 md:py-6 border-2 border-white/30 text-white rounded-[1.5rem] md:rounded-[2rem] font-black hover:bg-white/10 transition-all uppercase tracking-widest text-xs md:text-sm backdrop-blur-sm text-center">Activity Hub</Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: 'fa-layer-group', title: 'Club Governance', desc: 'Standardized management for specialized student chapters across engineering, arts, and innovation.' },
              { icon: 'fa-briefcase', title: 'Career Pathways', desc: 'Direct pipelines to industry leading placements, internships, and hackathon opportunities.' },
              { icon: 'fa-shield-halved', title: 'Verified Success', desc: 'Blockchain-ready activity tracking and hall of fame for student achievements and certifications.' }
            ].map((feature, i) => (
              <div key={i} className="p-8 md:p-10 bg-gray-50 rounded-[2rem] md:rounded-[3rem] border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-maroon-800 text-white rounded-2xl flex items-center justify-center text-xl md:text-2xl mb-6 md:mb-8 shadow-lg group-hover:rotate-6 transition-transform">
                  <i className={`fa-solid ${feature.icon}`}></i>
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4 uppercase tracking-tighter">{feature.title}</h3>
                <p className="text-gray-500 font-medium text-sm md:text-base leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENT WIDGET */}
      <div className="fixed bottom-6 right-4 sm:bottom-10 sm:right-10 z-[100] flex flex-col items-end gap-4 md:gap-6">
        {showAnnWidget && (
          <div className="w-[calc(100vw-32px)] sm:w-[380px] bg-maroon-900 text-white rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 animate-slide-up">
            <div className="p-6 md:p-8 bg-maroon-800/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-tower-broadcast text-maroon-400 animate-pulse"></i>
                <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">Global Announcements</h4>
              </div>
              <button onClick={() => setShowAnnWidget(false)} className="text-white/30 hover:text-white transition-colors p-1">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="p-6 md:p-8 max-h-[350px] md:max-h-[400px] overflow-y-auto scroll-hide space-y-6 md:space-y-8">
              {announcements.length > 0 ? announcements.map(ann => (
                <div key={ann.id} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                  <p className="text-sm md:text-base font-medium leading-relaxed text-maroon-50 mb-3 md:mb-4">{ann.text}</p>
                  <div className="flex justify-between items-center text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-40">
                    <span>{ann.senderName}</span>
                    <span>{ann.timestamp}</span>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center opacity-30 italic text-sm font-medium">No system broadcasts active.</div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="p-6 md:p-8 pt-0 border-t border-white/5 mt-2">
                <textarea
                  value={newAnn}
                  onChange={(e) => setNewAnn(e.target.value)}
                  placeholder="Draft global broadcast..."
                  className="w-full h-24 md:h-32 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 text-sm font-medium focus:ring-2 focus:ring-maroon-400 outline-none mb-4 placeholder-white/20"
                />
                <button
                  onClick={handlePostAnnouncement}
                  className="w-full bg-white text-maroon-900 font-black py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-maroon-50 transition-all shadow-xl active:scale-95"
                >
                  Broadcast to All
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowAnnWidget(!showAnnWidget)}
          className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-xl md:text-2xl shadow-2xl transition-all hover:scale-110 active:scale-90 relative ${showAnnWidget ? 'bg-white text-maroon-800' : 'bg-maroon-800 text-white'}`}
        >
          <i className={`fa-solid ${showAnnWidget ? 'fa-xmark' : 'fa-bullhorn'}`}></i>
          {!showAnnWidget && announcements.length > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-gray-50 animate-bounce">
              {announcements.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default HomeView;
