
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Club } from '../types';
import { formatMediaLink } from '../services/mediaUtils';

interface GalleryPhoto {
  url: string;
  activityName: string;
  clubName: string;
  clubId: string;
  date: string;
  id: string;
}

interface GalleryViewProps {
  activities: Activity[];
  clubs: Club[];
}

const GalleryView: React.FC<GalleryViewProps> = ({ activities, clubs }) => {
  const [searchParams] = useSearchParams();
  const initialClub = searchParams.get('clubId') || 'all';

  const [clubFilter, setClubFilter] = useState(initialClub);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync club filter with URL params if they change
  useEffect(() => {
    const clubId = searchParams.get('clubId');
    if (clubId) {
      setClubFilter(clubId);
    }
  }, [searchParams]);

  // Flatten all photos from all activities
  const allPhotos: GalleryPhoto[] = useMemo(() => {
    let list: GalleryPhoto[] = [];
    activities.forEach(act => {
      act.photos.forEach((p, idx) => {
        list.push({
          url: p,
          activityName: act.name,
          clubName: act.clubName,
          clubId: act.clubId,
          date: act.date,
          id: `${act.id}-${idx}`
        });
      });
    });
    return list;
  }, [activities]);

  // Main grid filtering
  const filteredPhotos = useMemo(() => {
    return allPhotos.filter(p => {
      const matchClub = clubFilter === 'all' || p.clubId === clubFilter;
      const matchSearch = searchTerm === '' || 
        p.activityName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.clubName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const photoDate = new Date(p.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const matchStart = !start || photoDate >= start;
      const matchEnd = !end || photoDate <= end;

      return matchClub && matchSearch && matchStart && matchEnd;
    });
  }, [allPhotos, clubFilter, searchTerm, startDate, endDate]);

  // The currently viewed photo object
  const selectedPhoto = useMemo(() =>
    allPhotos.find(p => p.id === selectedPhotoId),
    [allPhotos, selectedPhotoId]
  );

  // Photos strictly belonging to the same club as the selected photo
  const currentClubPhotos = useMemo(() => {
    if (!selectedPhoto) return [];
    return allPhotos.filter(p => p.clubId === selectedPhoto.clubId);
  }, [allPhotos, selectedPhoto]);

  // Sidebar list (same club, excluding current)
  const sidebarPhotos = useMemo(() => {
    if (!selectedPhoto) return [];
    return currentClubPhotos.filter(p => p.id !== selectedPhoto.id);
  }, [currentClubPhotos, selectedPhoto]);

  // Navigation Logic - Strict within the current club's photo set
  const navigate = (direction: 'next' | 'prev') => {
    if (!selectedPhotoId || currentClubPhotos.length === 0) return;

    const currentIndex = currentClubPhotos.findIndex(p => p.id === selectedPhotoId);
    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % currentClubPhotos.length;
    } else {
      nextIndex = (currentIndex - 1 + currentClubPhotos.length) % currentClubPhotos.length;
    }

    setSelectedPhotoId(currentClubPhotos[nextIndex].id);
  };

  const handleDownload = async () => {
    if (!selectedPhoto) return;
    try {
      const response = await fetch(selectedPhoto.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `titan-${selectedPhoto.clubName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      const link = document.createElement('a');
      link.href = selectedPhoto.url;
      link.target = "_blank";
      link.download = 'titan-intel.jpg';
      link.click();
    }
  };

  // Global Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhotoId) return;
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else setSelectedPhotoId(null);
      }
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'ArrowLeft') navigate('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoId, currentClubPhotos, isFullscreen]);

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Console */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="border-l-4 border-maroon-800 pl-6">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-2 leading-none">Titan <br />Visions</h2>
            <p className="text-gray-500 text-sm font-medium max-w-md uppercase tracking-wider">Visual manifest of excellence across all chapters.</p>
          </div>

          <div className="space-y-8">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 relative">
                <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Search activities or chapters..." 
                  className="w-full pl-14 pr-8 py-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-maroon-800/5 outline-none font-bold text-gray-900 placeholder:text-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-grow relative">
                   <label className="absolute -top-3 left-6 px-2 bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400">From</label>
                   <input 
                    type="date" 
                    className="w-full px-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm outline-none font-bold"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-grow relative">
                   <label className="absolute -top-3 left-6 px-2 bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400">To</label>
                   <input 
                    type="date" 
                    className="w-full px-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm outline-none font-bold"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setClubFilter('all')}
                className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border-2 ${clubFilter === 'all'
                  ? 'bg-maroon-800 border-maroon-800 text-white shadow-xl scale-105'
                  : 'bg-white border-gray-100 text-gray-400 hover:border-maroon-200 hover:text-maroon-800'
                  }`}
              >
                All Chapters
              </button>
              {clubs.map(c => (
                <button
                  key={c.id}
                  onClick={() => setClubFilter(c.id)}
                  className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border-2 ${clubFilter === c.id
                    ? 'bg-maroon-800 border-maroon-800 text-white shadow-xl scale-105'
                    : 'bg-white border-gray-100 text-gray-400 hover:border-maroon-200 hover:text-maroon-800'
                    }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhotoId(photo.id)}
              className="group relative aspect-[4/3] rounded-[1cm] overflow-hidden bg-white p-2 border border-gray-100 shadow-sm hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 cursor-pointer"
            >
              <div className="w-full h-full rounded-[0.8cm] overflow-hidden relative">
                <img
                  src={formatMediaLink(photo.url)}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt={photo.activityName}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8 backdrop-blur-[2px]">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-maroon-400 text-[9px] font-black uppercase tracking-[0.3em] mb-2 block">{photo.clubName}</span>
                    <h4 className="text-white font-black text-2xl mb-1 tracking-tighter uppercase leading-tight">{photo.activityName}</h4>
                    <div className="mt-6 flex items-center gap-2 text-white/80 font-black text-[9px] uppercase tracking-widest">
                      <i className="fa-solid fa-expand"></i>
                      View Intel
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INTELLIGENCE DISCOVERY MODAL */}
      {selectedPhoto && (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-8 animate-fade-in overflow-hidden transition-all duration-500 ${isFullscreen ? 'bg-black' : 'bg-white/60 backdrop-blur-3xl'}`}>

          <div className={`transition-all duration-500 flex flex-col relative overflow-hidden ${isFullscreen ? 'w-full h-full bg-black' : 'bg-white w-full h-full md:rounded-[2.5cm] shadow-[0_50px_150px_rgba(0,0,0,0.2)] border border-white'}`}>

            {!isFullscreen && (
              <div className="flex items-center justify-between p-6 md:px-12 md:py-8 flex-shrink-0 z-50 bg-white shadow-sm">
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => setSelectedPhotoId(null)}
                    className="w-14 h-14 bg-gray-50 hover:bg-white rounded-full flex items-center justify-center text-gray-900 border border-gray-100 hover:border-maroon-800 hover:text-maroon-800 transition-all shadow-sm hover:shadow-xl active:scale-90"
                  >
                    <i className="fa-solid fa-arrow-left text-xl"></i>
                  </button>
                </div>

                <button
                  onClick={handleDownload}
                  className="bg-red-600 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95 flex items-center gap-3"
                >
                  <i className="fa-solid fa-download"></i> Save
                </button>
              </div>
            )}

            <div className={`flex flex-col md:flex-row flex-grow overflow-hidden relative ${isFullscreen ? 'w-full h-full' : ''}`}>

              <div className={`flex flex-col relative transition-all duration-500 ${isFullscreen ? 'w-full h-full p-0' : 'w-full md:w-[70%] h-full p-4 md:p-6 md:pb-8'}`}>
                <div className={`relative flex-grow overflow-hidden flex items-center justify-center group ${isFullscreen ? 'bg-black rounded-0' : 'bg-gray-50 rounded-[1.5cm] border border-gray-100 shadow-inner'}`}>

                  <button
                    onClick={() => navigate('prev')}
                    className="absolute left-6 z-50 w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black shadow-2xl"
                  >
                    <i className="fa-solid fa-chevron-left text-xl"></i>
                  </button>
                  <button
                    onClick={() => navigate('next')}
                    className="absolute right-6 z-50 w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black shadow-2xl"
                  >
                    <i className="fa-solid fa-chevron-right text-xl"></i>
                  </button>

                  <img
                    src={formatMediaLink(selectedPhoto.url)}
                    className={`transition-all duration-700 ease-in-out w-full h-full ${isFullscreen ? 'object-contain' : 'object-cover animate-slide-up'}`}
                    alt="Main Content"
                  />

                  <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-50">
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 ${isFullscreen ? 'bg-maroon-800 text-white' : 'bg-white/80 backdrop-blur-md text-gray-900 border border-white'}`}
                      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                      <i className={`fa-solid ${isFullscreen ? 'fa-minimize' : 'fa-maximize'}`}></i>
                    </button>
                  </div>
                </div>

                {!isFullscreen && (
                  <div className="mt-6 flex items-center justify-end">
                    <div className="flex gap-1.5 px-4">
                      {currentClubPhotos.map((p) => (
                        <div key={p.id} className={`h-1.5 rounded-full transition-all duration-500 ${p.id === selectedPhotoId ? 'w-12 bg-maroon-800' : 'w-2 bg-gray-200'}`}></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!isFullscreen && (
                <div className="hidden md:flex flex-col w-[30%] h-full bg-gray-50 border-l border-gray-100 p-8 overflow-hidden">
                  <div className="mb-6 flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Chapter Archive</h4>
                    <span className="text-[9px] font-bold text-gray-300 uppercase">{currentClubPhotos.length} Items</span>
                  </div>

                  <div className="flex-grow overflow-y-auto pr-2 scroll-hide pb-12">
                    <div className="grid grid-cols-2 gap-3">
                      {sidebarPhotos.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedPhotoId(item.id)}
                          className="group cursor-pointer rounded-[0.5cm] overflow-hidden bg-white p-1 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                          <div className="aspect-square rounded-[0.4cm] overflow-hidden relative">
                            <img
                              src={formatMediaLink(item.url)}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              alt="Archive Item"
                            />
                            <div className="absolute inset-0 bg-maroon-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <i className="fa-solid fa-arrow-left text-white text-lg"></i>
                            </div>
                          </div>
                        </div>
                      ))}
                      {sidebarPhotos.length === 0 && (
                        <div className="col-span-2 py-20 text-center opacity-20">
                          <p className="text-[9px] font-black uppercase tracking-widest italic">No other photos in this chapter</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;
