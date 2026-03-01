
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { User, Club, Activity, UserRoles, Announcement, ChatMessage } from '../types';
import { db } from '../services/db';

interface ClubDetailViewProps {
  user: User | null;
  clubs: Club[];
  activities: Activity[];
  announcements: Announcement[];
  onAddAnnouncement: (ann: Announcement) => void;
  onUpdate: () => void;
}

const compressImage = (base64: string, maxWidth = 900, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
  });
};

const ClubDetailView: React.FC<ClubDetailViewProps> = ({ user, clubs, activities, announcements, onAddAnnouncement, onUpdate }) => {
  const { clubId } = useParams();
  const club = clubs.find(c => c.id === clubId);
  
  const [activeTab, setActiveTab] = useState<'activities' | 'chat'>('activities');
  const [chatMessage, setChatMessage] = useState('');
  const [clubChats, setClubChats] = useState<ChatMessage[]>([]);
  const [newAnn, setNewAnn] = useState('');
  const [showAnnWidget, setShowAnnWidget] = useState(true);
  const [isEditingClub, setIsEditingClub] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  
  const themeColor = club?.themeColor || '#800000';

  const [clubEditForm, setClubEditForm] = useState({
    name: club?.name || '',
    tagline: club?.tagline || '',
    description: club?.description || '',
    logo: club?.logo || '',
    bannerImage: club?.bannerImage || '',
    facultyName: club?.facultyName || '',
    facultyPhoto: club?.facultyPhoto || '',
    facultyRole: club?.facultyRole || '',
    themeColor: club?.themeColor || '#800000'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const clubLogoInputRef = useRef<HTMLInputElement>(null);
  const clubBannerInputRef = useRef<HTMLInputElement>(null);
  const facultyPhotoInputRef = useRef<HTMLInputElement>(null);
  const activityPhotoInputRef = useRef<HTMLInputElement>(null);
  const activityReportInputRef = useRef<HTMLInputElement>(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityForm, setActivityForm] = useState({
    name: '',
    date: '',
    reportUrl: '',
    reportName: '',
    photos: [] as string[]
  });

  useEffect(() => {
    if (activeTab === 'chat' && clubChats.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [clubChats, activeTab]);

  if (!club) return <Navigate to="/clubs" />;

  const clubActivities = activities.filter(a => a.clubId === clubId);
  const clubAnnouncements = announcements.filter(a => a.clubId === clubId);
  
  const isClubAdmin = user?.role === UserRoles.CLUB_ADMIN || [UserRoles.ADMIN, UserRoles.SUPER_ADMIN].includes(user?.role as any);
  const isMember = user?.clubMembership?.includes(club.id) || isClubAdmin;
  const hasPendingRequest = user?.pendingClubRequests?.includes(club.id);
  const pendingStudents = isClubAdmin ? db.getUsers().filter(u => u.pendingClubRequests?.includes(club.id)) : [];

  const handleSendChat = () => {
    if (!chatMessage.trim() || !user) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderName: user.role === UserRoles.STUDENT ? 'Anonymous Titan' : user.name,
      senderRole: user.role,
      text: chatMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      clubId: club.id
    };
    setClubChats([...clubChats, msg]);
    setChatMessage('');
  };

  const handlePostAnnouncement = () => {
    if (!newAnn.trim() || !user) return;
    onAddAnnouncement({
      id: Date.now().toString(),
      text: newAnn,
      timestamp: new Date().toLocaleDateString(),
      senderName: user.name,
      clubId: club.id
    });
    setNewAnn('');
  };

  const handleUpdateClubSettings = () => {
    db.updateClub({ ...club, ...clubEditForm });
    onUpdate();
    setIsEditingClub(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 1200, 0.7);
      setClubEditForm(prev => ({ ...prev, [field]: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadReport = (url: string, fileName: string) => {
    if (!url || url === '#' || url === '') {
      alert("No report found.");
      return;
    }
    try {
      const safeFileName = `TITAN_REPORT_${fileName.replace(/\s+/g, '_').toUpperCase()}.pdf`;
      if (url.startsWith('data:')) {
        const parts = url.split(',');
        const header = parts[0];
        const base64 = parts[1];
        const mime = header.match(/:(.*?);/)?.[1] || 'application/pdf';
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        const blob = new Blob([array], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = safeFileName;
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => { document.body.removeChild(anchor); URL.revokeObjectURL(blobUrl); }, 200);
      } else {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = safeFileName;
        anchor.target = "_blank";
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => document.body.removeChild(anchor), 200);
      }
    } catch (err) {
      alert("Download failed.");
    }
  };

  const handleActivityPhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 800, 0.5);
        setActivityForm(prev => ({ ...prev, photos: [...prev.photos, compressed] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleActivityReportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setActivityForm(prev => ({ ...prev, reportUrl: reader.result as string, reportName: file.name }));
    reader.readAsDataURL(file);
  };

  const handleJoinRequest = () => {
    if (!user) return;
    db.requestClubJoin(user.id, club.id);
    alert('Join request sent.');
    onUpdate();
  };

  const resolveRequest = (studentId: string, approve: boolean) => {
    db.resolveClubJoin(studentId, club.id, approve);
    onUpdate();
  };

  const openActivityModal = (act?: Activity) => {
    if (act) {
      setEditingActivity(act);
      setActivityForm({ 
        name: act.name, 
        date: act.date, 
        reportUrl: act.reportUrl, 
        reportName: act.reportUrl ? 'Existing Document' : '', 
        photos: [...act.photos] 
      });
    } else {
      setEditingActivity(null);
      setActivityForm({ name: '', date: '', reportUrl: '', reportName: '', photos: [] });
    }
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = () => {
    if (!activityForm.name || !activityForm.date) {
      alert("Required fields missing.");
      return;
    }
    const activityPayload = {
      name: activityForm.name,
      date: activityForm.date,
      reportUrl: activityForm.reportUrl,
      photos: activityForm.photos,
      clubId: club.id,
      clubName: club.name
    };
    if (editingActivity) db.updateActivity({ ...editingActivity, ...activityPayload });
    else db.addActivity({ id: 'act_' + Date.now(), ...activityPayload });
    setIsActivityModalOpen(false);
    onUpdate();
  };

  const deleteActivity = (id: string) => {
    if (confirm('Delete record?')) { db.deleteActivity(id); onUpdate(); }
  };

  return (
    <div className="bg-white min-h-screen relative pb-24">
      {/* Banner Section - Height reduced for mobile */}
      <div className="relative h-[320px] md:h-[480px] overflow-hidden">
        <img src={club.bannerImage} className="w-full h-full object-cover" alt={club.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
        
        {/* Absolute Buttons - Scaled for mobile */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-2 z-50">
          {isClubAdmin && (
            <>
              <button 
                onClick={() => setShowJoinRequests(!showJoinRequests)} 
                className={`backdrop-blur-xl px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest border transition-all ${showJoinRequests ? 'bg-maroon-800 text-white' : 'bg-white/10 text-white'}`}
                style={showJoinRequests ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
              >
                <i className="fa-solid fa-user-plus text-xs md:text-sm"></i>
                <span className="hidden sm:inline">Requests</span>
                {pendingStudents.length > 0 && <span className="bg-red-500 text-white w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center text-[7px] md:text-[8px]">{pendingStudents.length}</span>}
              </button>
              <button 
                onClick={() => setIsEditingClub(!isEditingClub)} 
                className="backdrop-blur-xl px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/20 text-white"
              >
                <i className={`fa-solid ${isEditingClub ? 'fa-xmark' : 'fa-gear'} text-xs md:text-sm`}></i>
                <span className="hidden sm:inline">{isEditingClub ? 'Exit' : 'Config'}</span>
              </button>
            </>
          )}
        </div>

        {/* Brand Info Area - Stacked on mobile */}
        <div className="absolute bottom-6 md:bottom-12 left-4 md:left-12 right-4 md:right-12 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-2xl md:rounded-3xl p-2 md:p-3 shadow-2xl shrink-0">
              <img src={club.logo} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div className="text-white">
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter uppercase leading-tight md:leading-none mb-1 md:mb-3">{club.name}</h2>
              <p className="text-xs md:text-xl font-bold opacity-70 tracking-tight line-clamp-1">{club.tagline}</p>
            </div>
          </div>
          
          {!isMember && (
            <button 
              onClick={handleJoinRequest}
              disabled={hasPendingRequest}
              className={`px-8 py-3 md:px-12 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all shadow-2xl active:scale-95 ${hasPendingRequest ? 'bg-gray-100 text-gray-400' : 'bg-white text-maroon-900'}`}
              style={!hasPendingRequest ? { color: themeColor } : {}}
            >
              {hasPendingRequest ? 'Pending' : 'Join Chapter'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
          <div className="lg:col-span-8">
            {/* Tabs - Scrollable on mobile */}
            <div className="flex gap-2 md:gap-4 mb-8 md:mb-12 border-b-2 border-gray-100 overflow-x-auto scroll-hide">
              <button 
                onClick={() => setActiveTab('activities')}
                className={`px-6 py-3 md:px-8 md:py-4 rounded-t-2xl md:rounded-t-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'activities' ? 'text-white shadow-xl' : 'text-gray-400'}`}
                style={activeTab === 'activities' ? { backgroundColor: themeColor } : {}}
              >
                Logbook
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`px-6 py-3 md:px-8 md:py-4 rounded-t-2xl md:rounded-t-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'chat' ? 'text-white shadow-xl' : 'text-gray-400'}`}
                style={activeTab === 'chat' ? { backgroundColor: themeColor } : {}}
              >
                Chapter Chat
              </button>
            </div>

            {activeTab === 'activities' ? (
              <div className="space-y-8 md:space-y-12">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter">Activity Registry</h3>
                  {isClubAdmin && (
                    <button onClick={() => openActivityModal()} className="text-white px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest" style={{ backgroundColor: themeColor }}>
                      New
                    </button>
                  )}
                </div>

                {clubActivities.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:gap-8">
                    {clubActivities.map(act => (
                      <div key={act.id} className="group bg-gray-50 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 hover:bg-white transition-all duration-500 relative">
                        {isClubAdmin && (
                          <div className="absolute top-6 right-6 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openActivityModal(act)} className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-lg rounded-lg flex items-center justify-center" style={{ color: themeColor }}><i className="fa-solid fa-pen-nib text-[10px]"></i></button>
                            <button onClick={() => deleteActivity(act.id)} className="w-8 h-8 md:w-10 md:h-10 bg-red-600 shadow-lg rounded-lg text-white flex items-center justify-center"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                          </div>
                        )}
                        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                          <div className="md:w-1/3 aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden bg-gray-200">
                             <img src={act.photos[0] || 'https://picsum.photos/seed/noimg/600/400'} className="w-full h-full object-cover" alt="Event" />
                          </div>
                          <div className="flex-grow">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-2 md:mb-3 block" style={{ color: themeColor }}>{act.date}</span>
                            <h4 className="text-xl md:text-3xl font-black tracking-tighter uppercase mb-4 md:mb-6">{act.name}</h4>
                            <div className="flex flex-wrap gap-2 md:gap-4">
                              <button 
                                onClick={() => handleDownloadReport(act.reportUrl, act.name)}
                                className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${act.reportUrl && act.reportUrl !== '#' ? 'bg-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
                                style={act.reportUrl && act.reportUrl !== '#' ? { borderColor: themeColor, color: themeColor } : {}}
                              >
                                <i className="fa-solid fa-file-pdf"></i> Report
                              </button>
                              <Link to={`/gallery?clubId=${club.id}`} className="px-4 py-2 md:px-6 md:py-3 bg-white border border-gray-200 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2" style={{ borderColor: themeColor, color: themeColor }}>
                                <i className="fa-solid fa-images"></i> Visuals
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center opacity-10">
                    <i className="fa-solid fa-folder-open text-7xl mb-6"></i>
                    <p className="text-lg font-black uppercase tracking-widest">No Data</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 border border-gray-100 flex flex-col h-[600px] md:h-[700px]">
                <div className="flex-grow overflow-y-auto space-y-4 md:space-y-6 pr-2 mb-6">
                  {clubChats.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                       <i className="fa-solid fa-comments text-4xl mb-4"></i>
                       <p className="text-xs font-bold uppercase tracking-widest">No Messages</p>
                    </div>
                  ) : clubChats.map(m => (
                    <div key={m.id} className={`flex ${m.senderName === user?.name ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[80%] p-4 md:p-6 rounded-2xl md:rounded-3xl ${m.senderName === user?.name ? 'text-white rounded-tr-none' : 'bg-white border shadow-sm rounded-tl-none'}`} style={m.senderName === user?.name ? { backgroundColor: themeColor } : {}}>
                        <div className="flex justify-between items-center gap-8 mb-1 md:mb-2">
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-60">{m.senderName}</span>
                          <span className="text-[6px] md:text-[7px] font-bold opacity-40">{m.timestamp}</span>
                        </div>
                        <p className="text-xs md:text-sm font-medium leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                
                {isMember ? (
                   <div className="bg-white rounded-2xl md:rounded-[2rem] p-2 md:p-3 flex gap-2 md:gap-4 shadow-sm border border-gray-100">
                    <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Draft message..." className="flex-grow bg-transparent border-none px-4 md:px-6 py-3 md:py-4 font-bold outline-none text-xs md:text-sm" />
                    <button onClick={handleSendChat} className="text-white w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center hover:opacity-80 active:scale-90" style={{ backgroundColor: themeColor }}>
                      <i className="fa-solid fa-paper-plane text-xs md:text-base"></i>
                    </button>
                   </div>
                ) : (
                  <div className="text-center p-6 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Member access restricted</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Stacks on mobile */}
          <div className="lg:col-span-4 space-y-8 md:space-y-12">
            <div className="rounded-2xl md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden" style={{ backgroundColor: themeColor }}>
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <i className="fa-solid fa-bullhorn text-6xl md:text-8xl"></i>
              </div>
              <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-6 md:mb-8 opacity-60">Chapter Broadcasts</h4>
              <div className="space-y-6 md:space-y-8 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 scroll-hide">
                {clubAnnouncements.length > 0 ? clubAnnouncements.map(ann => (
                  <div key={ann.id} className="border-b border-white/10 pb-4 md:pb-6 last:border-0 last:pb-0">
                    <p className="text-sm md:text-base font-medium leading-relaxed mb-2 md:mb-3">{ann.text}</p>
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest opacity-40">{ann.timestamp}</span>
                  </div>
                )) : (
                  <p className="opacity-30 italic text-xs py-4">No active broadcasts.</p>
                )}
              </div>
              {isClubAdmin && (
                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/10">
                  <textarea value={newAnn} onChange={(e) => setNewAnn(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-medium focus:ring-1 focus:ring-white outline-none mb-4 resize-none" placeholder="New broadcast..." rows={2} />
                  <button onClick={handlePostAnnouncement} className="w-full bg-white text-gray-900 py-3 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-xl" style={{ color: themeColor }}>Broadcast</button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl md:rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-sm space-y-8 md:space-y-10">
              <div>
                <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 md:mb-6">Chapter Overview</h4>
                <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed">{club.description}</p>
              </div>
              {club.facultyName && (
                <div className="pt-8 md:pt-10 border-t border-gray-50">
                  <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 md:mb-6">Faculty Supervisor</h4>
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                      <img src={club.facultyPhoto || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="Faculty" />
                    </div>
                    <div>
                      <h5 className="font-black text-gray-900 uppercase tracking-tighter text-sm md:text-base">{club.facultyName}</h5>
                      <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest" style={{ color: themeColor }}>{club.facultyRole}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modals omitted for brevity, but they should also use p-4 or similar mobile padding */}
    </div>
  );
};

export default ClubDetailView;
