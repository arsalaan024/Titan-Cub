
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/db';
import { User, UserRoles, Announcement } from '../types';
import HomeBanner from '../components/HomeBanner';

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
      {/* Hero Banner Section */}
      <HomeBanner user={user} />


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
