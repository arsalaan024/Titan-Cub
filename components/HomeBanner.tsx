
import React, { useState, useEffect } from 'react';
import { HomeBanner as HomeBannerType, User, UserRoles } from '../types';
import { db } from '../services/db';

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
      }, 3000);
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

  // Convert Google Drive sharing links to direct image URLs
  const convertToDirectUrl = (url: string): string => {
    // Match: https://drive.google.com/file/d/FILE_ID/view?...
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
      return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
    }
    // Match: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (openMatch) {
      return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
    }
    // Match: https://drive.google.com/uc?id=FILE_ID&...
    const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    if (ucMatch) {
      return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
    }
    return url; // Return as-is if not a Google Drive link
  };

  const handleAddBanner = async () => {
    if (!newImage) return;
    try {
      const directUrl = convertToDirectUrl(newImage.trim());
      await db.addHomeBanner({
        imageUrl: directUrl,
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
      console.log('Banner deleted:', id);
      fetchBanners();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete banner: ' + (err as any)?.message);
    }
  };

  if (loading) return (
    <div className="h-[90vh] bg-maroon-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
    </div>
  );

  return (
    <section className="relative h-[50vh] md:h-[55vh] overflow-hidden group">
      {banners.length > 0 ? (
        <>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'
              }`}
            >
              <img
                src={banner.imageUrl}
                className="w-full h-full object-cover"
                alt={banner.title || 'Banner'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  console.error('Banner image failed:', banner.imageUrl);
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-maroon-950/80 via-maroon-950/40 to-transparent"></div>
              
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
                  {banner.title && (
                    <h1 className="text-5xl sm:text-7xl md:text-[8rem] font-black mb-6 tracking-tighter leading-[0.9] animate-slide-up">
                      {banner.title}
                    </h1>
                  )}
                  {banner.subtitle && (
                    <p className="text-lg md:text-3xl text-maroon-100/80 max-w-3xl mb-12 font-bold animate-slide-up [animation-delay:100ms]">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Dots */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentIndex ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
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
                <img src={b.imageUrl} className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
