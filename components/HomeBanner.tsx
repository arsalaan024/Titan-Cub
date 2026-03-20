
import React, { useState, useEffect } from 'react';
import { HomeBanner as HomeBannerType, User, UserRoles } from '../types';
import { db } from '../services/db';
import { Link } from 'react-router-dom';
import { formatMediaLink } from '../services/mediaUtils';

interface HomeBannerProps {
  user: User | null;
}

const HomeBanner: React.FC<HomeBannerProps> = ({ user }) => {
  const [banners, setBanners] = useState<HomeBannerType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [newImage, setNewImage] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === UserRoles.ADMIN || user?.role === UserRoles.SUPER_ADMIN;

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000); // 5 seconds interval
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const data = await db.getHomeBanners();
      setBanners(data);
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleAddBanner = async () => {
    if (!newImage) return;
    try {
      await db.addHomeBanner({
        imageUrl: newImage.trim(),
        title: newTitle,
        subtitle: newSubtitle,
        order: banners.length
      });
      setNewImage('');
      setNewTitle('');
      setNewSubtitle('');
      fetchBanners();
    } catch (err) {
      alert('Failed to add banner');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await db.deleteHomeBanner(id);
      fetchBanners();
    } catch (err) {
      alert('Failed to delete banner: ' + (err as any)?.message);
    }
  };

  const cards = [
    { title: 'Career Discovery', path: '/career', icon: 'fa-briefcase', number: '01', desc: 'Secure your future with top placement opportunities and internships.' },
    { title: 'Recent Activities', path: '/activities', icon: 'fa-calendar-days', number: '02', desc: 'Explore the latest events, workshops, and seminars on campus.' },
    { title: 'Diverse Clubs', path: '/clubs', icon: 'fa-people-group', number: '03', desc: 'Join vibrant student-led organizations that match your passion.' },
    { title: 'Interactive Games', path: '/games', icon: 'fa-gamepad', number: '04', desc: 'Engage in fun challenges, earn points, and climb the leaderboard.' },
  ];

  if (loading) return (
    <div className="h-[90vh] bg-maroon-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
    </div>
  );

  return (
    <section className="relative min-h-[80vh] md:min-h-[85vh] bg-maroon-950 overflow-visible group pb-12 md:pb-16">
      {banners.length > 0 ? (
        <>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              <img
                src={formatMediaLink(banner.imageUrl)}
                className="w-full h-full object-cover z-0"
                alt={banner.title || 'Banner'}
                referrerPolicy="no-referrer"
              />
              {/* Deep Navy/Blue Overlay as seen in reference image */}
              <div className="absolute inset-0 bg-[#0b1c39]/70 z-10 transition-opacity"></div>
              
              <div className="absolute inset-0 flex items-center z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-4xl">
                     <div className="flex items-center gap-3 mb-6 animate-slide-up">
                       <i className="fa-solid fa-graduation-cap text-[#f7a623] text-xl"></i>
                       <h5 className="text-[#f7a623] text-sm font-black uppercase tracking-[0.3em]">Welcome to Titan Club!</h5>
                       <span className="w-16 h-[2px] bg-[#f7a623]"></span>
                     </div>
                    {banner.title && (
                      <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-[0.95] animate-slide-up [animation-delay:100ms]">
                        {banner.title}
                      </h1>
                    )}
                    {banner.subtitle && (
                      <p className="text-base md:text-xl text-white/70 max-w-2xl mb-12 font-medium leading-relaxed animate-slide-up [animation-delay:200ms]">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 animate-slide-up [animation-delay:300ms]">
                      <Link to="/about" className="bg-[#f7a623] text-white font-black px-10 py-5 rounded-full text-[10px] uppercase tracking-widest hover:bg-[#e0951d] transition-all shadow-xl flex items-center gap-2">
                        About More <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Dots */}
          <div className="absolute bottom-[40%] right-8 flex flex-col gap-4 z-30 hidden lg:flex">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-white scale-150' : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Navigation Controls in Image Style */}
          <div className="absolute inset-y-0 left-0 w-full flex items-center justify-between px-4 sm:px-8 z-30 pointer-events-none">
            <button 
              onClick={() => setCurrentIndex((currentIndex - 1 + banners.length) % banners.length)}
              className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all pointer-events-auto"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <button 
              onClick={() => setCurrentIndex((currentIndex + 1) % banners.length)}
              className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all pointer-events-auto"
            >
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-maroon-950 flex items-center justify-center text-white p-8">
           <div className="text-center">
             <h2 className="text-4xl font-bold mb-4">Welcome to Titan Portal</h2>
             <p className="text-white/60">No banners configured yet. Admins can add them below.</p>
           </div>
        </div>
      )}

      {/* Clickable Blocks Overlaying at the Bottom: 30% Smaller, Further-Right, and Mobile Strips */}
      <div className="absolute bottom-0 left-0 w-full z-40 translate-y-1/2 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-20 lg:pr-0 flex justify-end">
          <div className="w-[50%] xs:w-[40%] sm:w-full lg:w-[75%] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4">
            {cards.map((card, i) => (
              <Link 
                to={card.path} 
                key={i} 
                className="group/card bg-white rounded-xl md:rounded-[2.2rem] p-2 md:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1 lg:hover:-translate-y-3 transition-all duration-500 flex flex-row lg:flex-col items-center lg:items-start gap-3 lg:gap-0 relative overflow-hidden aspect-auto lg:aspect-square h-auto"
              >
                {/* Number Watermark (Hidden on mobile strips to keep it clean) */}
                <div className="absolute top-3 right-3 text-2xl font-black text-maroon-800/10 group-hover/card:text-maroon-800/20 transition-colors uppercase select-none hidden lg:block">
                  {card.number}
                </div>
                
                {/* Icon Circle */}
                <div className="relative z-10 w-7 h-7 md:w-10 md:h-10 bg-maroon-50 rounded-lg md:rounded-xl flex items-center justify-center text-maroon-800 text-[10px] md:text-base lg:mb-3 group-hover/card:bg-maroon-800 group-hover/card:text-white transition-all duration-500 flex-shrink-0">
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>
                
                <div className="flex-1 lg:w-full">
                  <h3 className="text-[9px] md:text-xs font-black text-gray-900 lg:mb-2 uppercase tracking-tighter leading-tight truncate">
                    {card.title}
                  </h3>
                  
                  <p className="text-gray-500 text-[8px] md:text-[9px] font-medium leading-relaxed hidden lg:line-clamp-2 md:block">
                    {card.desc.substring(0, 40)}...
                  </p>
                </div>
                
                <div className="mt-auto flex items-center gap-1.5 text-maroon-800 font-black text-[7px] md:text-[7px] uppercase tracking-widest group-hover/card:gap-3 transition-all duration-500 hidden lg:flex">
                  <span>Explore</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </div>


              </Link>
            ))}
          </div>
        </div>
      </div>


      {/* Admin Controls Floating Button */}
      {isAdmin && (
        <button
          onClick={() => setShowAdmin(!showAdmin)}
          className="absolute top-4 right-4 md:right-8 z-50 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all shadow-2xl"
          title="Manage Banners"
        >
          <i className={`fa-solid ${showAdmin ? 'fa-xmark' : 'fa-images'}`}></i>
        </button>
      )}

      {/* Admin Panel */}
      {showAdmin && isAdmin && (
        <div className="absolute top-20 right-4 md:right-8 z-50 w-80 max-h-[85%] overflow-y-auto bg-maroon-900/95 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-3xl animate-slide-up">
          {/* Custom slim scrollbar styles are good, but standard scrollbar works fine natively */}
          <h3 className="text-white font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
            <i className="fa-solid fa-gear text-maroon-400"></i>
            Banner Management
          </h3>
          
          <div className="space-y-4 mb-8">
            <input
              type="text"
              placeholder="Image URL"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-maroon-400 outline-none"
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
            />
            <input
              type="text"
              placeholder="Title (Optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-maroon-400 outline-none"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              placeholder="Subtitle (Optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-maroon-400 outline-none h-20"
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
            />
            <button
              onClick={handleAddBanner}
              className="w-full bg-white text-maroon-900 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-maroon-50 transition-all"
            >
              Add Banner Slide
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Current Slides</p>
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl mb-2">
                <img src={formatMediaLink(b.imageUrl)} className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white truncate">{b.title || 'Untitled Slide'}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteBanner(b.id);
                  }}
                  className="p-3 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg transition-all cursor-pointer flex-shrink-0"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeBanner;
