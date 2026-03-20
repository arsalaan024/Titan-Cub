
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/db';
import { User, UserRoles, SecondaryBanner as SecondaryBannerType } from '../types';
import { formatMediaLink } from '../services/mediaUtils';

interface SecondaryBannerProps {
  user: User | null;
}

const SecondaryBanner: React.FC<SecondaryBannerProps> = ({ user }) => {
  const [banners, setBanners] = useState<SecondaryBannerType[]>([]);
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

  const fetchBanners = async () => {
    try {
      const data = await db.getSecondaryBanners();
      setBanners(data);
    } catch (err) {
      console.error('Failed to fetch secondary banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = async () => {
    if (!newImage) return;
    try {
      await db.addSecondaryBanner({
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
    if (!confirm('Delete this banner?')) return;
    try {
      await db.deleteSecondaryBanner(id);
      if (currentIndex >= banners.length - 1) setCurrentIndex(0);
      fetchBanners();
    } catch (err) {
      alert('Failed to delete banner');
    }
  };

  if (loading && banners.length === 0) return null;

  const currentBanner = banners[currentIndex] || {
    id: 'default',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe1?q=80&w=2070&auto=format&fit=crop',
    title: '',
    subtitle: ''
  };

  const hasContent = currentBanner.title || currentBanner.subtitle;

  return (
    <section className="relative w-full py-4 px-4 bg-[#030306] group/sec">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentBanner.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative min-h-[150px] md:min-h-[250px] rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/5"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0 text-white/10 flex items-center justify-center bg-gray-900">
               <i className="fa-solid fa-image text-4xl opacity-20" />
               <img 
                src={formatMediaLink(currentBanner.imageUrl)} 
                className="absolute inset-0 w-full h-full object-cover"
                alt={currentBanner.title || 'Titan Banner'}
                onLoad={() => setLoading(false)}
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
              />
              {/* Only show heavy gradient if there is text to read */}
              <div className={`absolute inset-0 transition-opacity duration-700 ${hasContent ? 'bg-gradient-to-r from-black/80 via-black/30 to-transparent' : 'bg-black/5'} z-10`} />
              <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] z-10" />
            </div>

            {hasContent && (
              <div className="relative z-20 h-full flex flex-col justify-center items-start p-8 md:p-14 max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-4 md:mb-6 tracking-tighter">
                    {currentBanner.title} {currentBanner.title && currentBanner.subtitle && <br />}
                    <span className="text-[#f7a623] italic font-serif opacity-90">{currentBanner.subtitle}</span>
                  </h2>

                  {/* Button only shows if there's a link */}
                  {currentBanner.link && (
                     <Link 
                      to={currentBanner.link} 
                      className="inline-flex items-center gap-3 bg-[#4a3b2a] backdrop-blur-xl border border-white/5 text-white/90 font-black px-8 py-3.5 rounded-xl text-[9px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95 group/btn"
                    >
                      Explore
                      <i className="fa-solid fa-arrow-right text-[7px] transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  )}
                </motion.div>
              </div>
            )}

            {/* Navigation Dots if multiple */}
            {banners.length > 1 && (
              <div className="absolute bottom-8 right-10 flex gap-2 z-30">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-[#f7a623] scale-125' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Admin Controls Floating Button */}
      {isAdmin && (
        <button
          onClick={() => setShowAdmin(!showAdmin)}
          className="absolute top-10 right-10 z-50 p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/20 transition-all opacity-0 group-hover/sec:opacity-100 shadow-2xl"
          title="Manage Secondary Banners"
        >
          <i className={`fa-solid ${showAdmin ? 'fa-xmark' : 'fa-camera'}`}></i>
        </button>
      )}

      {/* Admin Panel */}
      {showAdmin && isAdmin && (
        <div className="absolute top-28 right-10 z-50 w-80 bg-black/90 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-3xl animate-slide-up">
          <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
            <i className="fa-solid fa-gear text-[#f7a623]"></i>
            Banner Management
          </h3>
          
          <div className="space-y-4 mb-8 text-[10px] font-black uppercase tracking-widest">
            <input
              type="text"
              placeholder="Image URL"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-[#f7a623] outline-none"
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
            />
            <input
              type="text"
              placeholder="Title (Optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-[#f7a623] outline-none"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Highlight Title (Optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-[#f7a623] outline-none"
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
            />
            <button
              onClick={handleAddBanner}
              className="w-full bg-[#f7a623] text-white py-3 rounded-xl hover:brightness-110 transition-all font-black uppercase tracking-widest"
            >
              Add Banner Slide
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl mb-2 group/item">
                <img src={formatMediaLink(b.imageUrl)} className="w-10 h-10 object-cover rounded-lg" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white/80 truncate uppercase tracking-tighter">{b.title || 'Pure Image Slide'}</p>
                </div>
                <button
                  onClick={() => handleDeleteBanner(b.id)}
                  className="p-2 text-red-400 hover:text-red-500 transition-colors"
                >
                  <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default SecondaryBanner;
