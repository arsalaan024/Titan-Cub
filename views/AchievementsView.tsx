
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Achievement, User, UserRoles, AchievementPost, Activity } from '../types';
import { db } from '../services/db';

interface AchievementsViewProps {
  user: User | null;
  achievements: Achievement[];
  activities: Activity[];
  posts: AchievementPost[];
  allStudents: User[];
  onAdd: (ach: Achievement) => void;
  onUpdate: (ach: Achievement) => void;
  onDelete: (id: string) => void;
  onRefreshPosts: () => void;
}

const AutoCarousel: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!photos || photos.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [photos]);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {photos.map((src, i) => (
        <img
          key={i}
          src={src}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms] ease-in-out ${i === index ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0 pointer-events-none'
            }`}
          alt="Manifest Proof"
        />
      ))}
    </div>
  );
};

const compressImage = (base64: string, maxWidth = 1200, quality = 0.8): Promise<string> => {
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
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
  });
};

const AchievementsView: React.FC<AchievementsViewProps> = ({ user, achievements, activities, posts, allStudents, onAdd, onUpdate, onDelete, onRefreshPosts }) => {
  const [viewMode, setViewMode] = useState<'official' | 'community'>('official');
  const [officialSearch, setOfficialSearch] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingAch, setEditingAch] = useState<Achievement | null>(null);

  // Custom Alert State
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const [formData, setFormData] = useState<Partial<Achievement>>({
    participantName: '',
    activityId: '',
    activityName: '',
    achievement: '',
    certificateUrl: '',
    userId: ''
  });

  const [postData, setPostData] = useState<Partial<AchievementPost>>({
    topic: '',
    domain: '',
    rank: '',
    description: '',
    photos: [],
    videoUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const postPhotosRef = useRef<HTMLInputElement>(null);

  const canManage = !!user && (
    user.role === UserRoles.ADMIN ||
    user.role === UserRoles.SUPER_ADMIN ||
    user.role === UserRoles.CLUB_ADMIN
  );

  const filteredAchievements = useMemo(() => {
    return achievements.filter(ach =>
      ach.participantName.toLowerCase().includes(officialSearch.toLowerCase()) ||
      ach.activityName.toLowerCase().includes(officialSearch.toLowerCase()) ||
      ach.achievement.toLowerCase().includes(officialSearch.toLowerCase())
    );
  }, [achievements, officialSearch]);

  const handleDownloadCertificate = (ach: Achievement) => {
    const isLinked = !!ach.userId;
    const isOwner = user && ach.userId && user.id === ach.userId;
    const isAdmin = canManage;

    if (isLinked) {
      if (!isOwner && !isAdmin) {
        setNotice({
          title: "🛡️ IDENTITY LOCKED",
          message: "This record is linked to a verified Titan ID. Only the honoree can download this certificate."
        });
        return;
      }
    } else {
      const challenge = prompt(`🛡️ PUBLIC REGISTRY AUTHENTICATION\nTo download this public honor, please enter the achiever's name ("${ach.participantName}"):`);
      if (!challenge) return;
      if (challenge.trim().toLowerCase() !== ach.participantName.trim().toLowerCase()) {
        setNotice({
          title: "❌ AUTHENTICATION FAILED",
          message: "The name provided does not match our records for this public registry entry."
        });
        return;
      }
    }

    try {
      const url = ach.certificateUrl;
      const fileName = `TITAN_HONOR_${ach.participantName.replace(/\s+/g, '_').toUpperCase()}.jpg`;

      if (!url || url === '' || url === '#') {
        alert("⚠️ DATA ERROR: Certificate asset not found.");
        return;
      }

      if (url.startsWith('data:')) {
        const parts = url.split(',');
        const b64Data = parts[1];
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';

        const byteCharacters = atob(b64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(blobUrl); }, 200);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 200);
      }
    } catch (err) {
      alert("⚠️ DOWNLOAD FAILED: Pipeline error.");
    }
  };

  const handlePull = () => {
    setViewMode(viewMode === 'official' ? 'community' : 'official');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setFormData(prev => ({ ...prev, certificateUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handlePostPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentPhotoCount = (postData.photos || []).length;
    if (currentPhotoCount + files.length > 4) {
      alert(`Strategic Limit: You can add a maximum of 4 visual manifests per publication.`);
      return;
    }

    const processed = await Promise.all(
      Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = async () => resolve(await compressImage(reader.result as string));
          reader.readAsDataURL(file);
        });
      })
    );
    setPostData(prev => ({ ...prev, photos: [...(prev.photos || []), ...processed] }));
  };

  const handlePostSubmit = async () => {
    if (!user) return;
    if (!postData.topic || !postData.description || (postData.photos?.length === 0 && !postData.videoUrl)) {
      alert("Victory log requires a topic, description, and visual manifest proof.");
      return;
    }

    const newPost: any = {
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
      topic: postData.topic!,
      domain: postData.domain || 'Uncategorized',
      rank: postData.rank || 'Participant',
      description: postData.description!,
      photos: postData.photos || [],
      videoUrl: postData.videoUrl,
      likes: [],
      comments: []
    };

    try {
      await db.addStudentPost(newPost);
      onRefreshPosts();
      setShowPostModal(false);
      setPostData({ topic: '', domain: '', rank: '', description: '', photos: [], videoUrl: '' });
    } catch (err) {
      alert("Failed to sync victory log.");
    }
  };

  const handleOfficialSubmit = () => {
    if (!formData.participantName || !formData.activityId || !formData.achievement || !formData.certificateUrl) {
      alert("Official Registry Error: Honoree, Activity, Achievement Rank and Proof are required.");
      return;
    }

    const activity = activities.find(a => a.id === formData.activityId);
    const achData: any = {
      participantName: formData.participantName!,
      activityId: formData.activityId!,
      activityName: activity?.name || formData.activityName || 'General Chapter Event',
      achievement: formData.achievement!,
      certificateUrl: formData.certificateUrl!,
      userId: formData.userId
    };

    if (editingAch) {
      db.updateAchievement({ ...achData, id: editingAch.id }).then(() => {
        onRefreshPosts();
        setShowModal(false);
        setEditingAch(null);
      });
    } else {
      db.addAchievement(achData).then(() => {
        onRefreshPosts();
        setShowModal(false);
      });
    }

    setFormData({ participantName: '', activityId: '', activityName: '', achievement: '', certificateUrl: '', userId: '' });
  };

  const handleOfficialDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("🛡️ TITAN OVERSIGHT: Permanent Decommission?\nThis record will be purged from the high-command registry.")) {
      onDelete(id);
    }
  };

  const handleOfficialEdit = (e: React.MouseEvent, ach: Achievement) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingAch(ach);
    setFormData({
      participantName: ach.participantName,
      activityId: ach.activityId,
      activityName: ach.activityName,
      achievement: ach.achievement,
      certificateUrl: ach.certificateUrl,
      userId: ach.userId || ''
    });
    setShowModal(true);
  };

  const renderCardMedia = (post: AchievementPost) => {
    if (post.photos && post.photos.length > 0) return <AutoCarousel photos={post.photos} />;
    if (post.videoUrl && post.videoUrl.trim() !== '') {
      let videoId = '';
      try {
        const url = new URL(post.videoUrl);
        if (url.hostname.includes('youtube.com')) videoId = url.searchParams.get('v') || '';
        else if (url.hostname.includes('youtu.be')) videoId = url.pathname.slice(1);
      } catch (e) { }
      if (videoId) return <iframe src={`https://www.youtube.com/embed/${videoId}?modestbranding=1`} className="w-full h-full" allowFullScreen></iframe>;
      return <video src={post.videoUrl} controls className="w-full h-full object-cover bg-black" />;
    }
    return <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700 font-black uppercase tracking-widest text-[10px]">Asset Missing</div>;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${viewMode === 'official' ? 'bg-[#fcfcfc]' : 'bg-[#0a0a0a]'}`}>

      <div className="fixed top-0 right-16 z-[1000] hidden lg:block">
        <button onClick={handlePull} className={`relative group focus:outline-none transition-transform duration-300`}>
          <div className={`w-14 h-64 relative flex flex-col items-center rounded-b-3xl border-x-4 transition-all duration-700 ${viewMode === 'official' ? 'ribbon-gradient border-maroon-950' : 'dark-ribbon-gradient border-gray-800'}`}>
            <span className="text-white font-black text-[9px] uppercase tracking-[0.4em] vertical-text transform -rotate-180 mt-16 mb-auto select-none opacity-80">{viewMode === 'official' ? 'Pull for Live Wins' : 'Pull for Registry'}</span>
            <div className="mb-8">
              <div className="w-10 h-10 rounded-full border-[3px] border-yellow-500 flex items-center justify-center bg-white shadow-[0_5px_15px_rgba(0,0,0,0.4)]">
                <div className="w-5 h-5 rounded-full border border-yellow-600/20 bg-gray-50"></div>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className={`${viewMode === 'community' ? 'max-w-full' : 'max-w-7xl mx-auto'} px-0 sm:px-6 lg:px-8 py-24`}>

        <div className="lg:hidden mb-12 flex justify-center px-4">
          <div className="bg-gray-200/50 backdrop-blur-xl p-1.5 rounded-full flex gap-2 border border-gray-300/30">
            <button onClick={() => setViewMode('official')} className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'official' ? 'bg-maroon-800 text-white shadow-lg' : 'text-gray-500'}`}>Hall</button>
            <button onClick={() => setViewMode('community')} className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'community' ? 'bg-maroon-800 text-white shadow-lg' : 'text-gray-500'}`}>Live</button>
          </div>
        </div>

        {viewMode === 'official' ? (
          <div className="animate-fade-in px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 border-l-[16px] border-maroon-800 pl-10">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-4 leading-tight">Hall of <br /><span className="text-maroon-800">Fame.</span></h2>
                <p className="text-gray-400 text-base font-medium max-w-lg italic">The certified registry of official academic milestones.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
                <div className="relative w-full sm:w-80">
                  <i className="fa-solid fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                  <input type="text" placeholder="Filter registry..." className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm outline-none font-bold text-sm" value={officialSearch} onChange={e => setOfficialSearch(e.target.value)} />
                </div>
                {canManage && (
                  <button onClick={() => { setEditingAch(null); setFormData({ participantName: '', activityId: '', activityName: '', achievement: '', certificateUrl: '', userId: '' }); setShowModal(true); }} className="bg-maroon-800 text-white px-10 py-6 rounded-2xl font-black shadow-2xl hover:bg-maroon-900 transition-all flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest active:scale-95">
                    <i className="fa-solid fa-medal text-xl"></i> Publish Honor
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {filteredAchievements.map((ach) => (
                <div key={ach.id} className="group bg-white rounded-[3rem] overflow-hidden shadow-xl border border-gray-100 hover:shadow-[0_60px_120px_rgba(0,0,0,0.15)] transition-all duration-500 flex flex-col relative h-[500px]">

                  <div className="relative h-[70%] bg-gray-50 border-b border-gray-100 overflow-hidden flex items-center justify-center p-4">
                    <img src={ach.certificateUrl} className="w-full h-full object-contain transition-transform duration-[3s] group-hover:scale-[1.02]" alt="Honor Manifest" />

                    {canManage && (
                      <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-[100] translate-y-2 group-hover:translate-y-0">
                        <button onClick={(e) => handleOfficialEdit(e, ach)} className="w-12 h-12 bg-white/95 backdrop-blur shadow-xl rounded-2xl flex items-center justify-center text-maroon-800 hover:bg-maroon-800 hover:text-white transition-all border border-gray-100">
                          <i className="fa-solid fa-pen-fancy text-sm"></i>
                        </button>
                        <button onClick={(e) => handleOfficialDelete(e, ach.id)} className="w-12 h-12 bg-red-600/95 backdrop-blur shadow-xl rounded-2xl flex items-center justify-center text-white hover:bg-red-700 transition-all border border-red-500/20">
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>

                  <div className="h-[30%] p-10 flex flex-col justify-center bg-white relative">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 bg-maroon-50 rounded-[1.5rem] flex items-center justify-center text-maroon-800 font-black text-3xl border border-maroon-100 shadow-inner">
                        {ach.participantName.charAt(0)}
                      </div>
                      <div className="flex-grow">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">Titan Chapter Honoree</p>
                        <h4 className="font-black text-gray-900 text-3xl tracking-tighter uppercase leading-none mb-2">{ach.participantName}</h4>
                        <div className="flex items-center gap-2">
                          <span className="bg-maroon-800 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{ach.achievement}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">@ {ach.activityName}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <button onClick={() => handleDownloadCertificate(ach)} className="w-16 h-16 rounded-full bg-maroon-50 text-maroon-800 flex items-center justify-center hover:bg-maroon-800 hover:text-white transition-all shadow-lg active:scale-90 border border-maroon-100">
                          <i className="fa-solid fa-file-arrow-down text-xl"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-slide-up flex flex-col items-center px-4">
            <div className="w-full max-w-[1400px] flex flex-col md:flex-row md:items-center justify-between gap-12 mb-20">
              <div className="flex-grow">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-[0.9] mb-4">Excellence <br /><span className="text-maroon-800">Manifest.</span></h2>
                <p className="text-gray-500 text-base font-medium max-w-2xl mb-10">Visual feed of live technical victories from specialized chapters.</p>
                <div className="relative w-full max-w-xl group">
                  <i className="fa-solid fa-magnifying-glass absolute left-8 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-maroon-800 transition-colors"></i>
                  <input type="text" placeholder="Search manifest..." className="w-full pl-20 pr-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] text-white font-bold text-lg outline-none focus:ring-4 focus:ring-maroon-800/30 transition-all placeholder-gray-600" value={communitySearch} onChange={e => setCommunitySearch(e.target.value)} />
                </div>
              </div>
              {user && (
                <button onClick={() => { setPostData({ topic: '', domain: '', rank: '', description: '', photos: [], videoUrl: '' }); setShowPostModal(true); }} className="bg-maroon-800 text-white px-14 py-6 rounded-[3rem] font-black shadow-[0_20px_50px_rgba(128,0,0,0.5)] hover:bg-maroon-900 transition-all flex items-center justify-center gap-5 text-xs uppercase tracking-widest active:scale-95 flex-shrink-0"><i className="fa-solid fa-plus-circle text-xl"></i> Add Victory</button>
              )}
            </div>

            <div className="w-full max-w-[1400px] space-y-32 pb-64">
              {posts.filter(p => p.userName.toLowerCase().includes(communitySearch.toLowerCase()) || p.topic.toLowerCase().includes(communitySearch.toLowerCase())).map(post => (
                <div key={post.id} className="group relative flex flex-col lg:flex-row items-start gap-12 animate-fade-in">
                  <div className="w-full lg:w-[55%] lg:sticky lg:top-32 relative rounded-[4rem] overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.6)] bg-gray-950 aspect-[16/10] border border-white/5 flex items-center justify-center">
                    {renderCardMedia(post)}
                    <div className="absolute top-10 left-10 flex flex-col gap-3 z-30 pointer-events-none">
                      <span className="bg-maroon-800/90 backdrop-blur-md text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl border border-white/10">{post.domain}</span>
                      <span className="bg-black/60 backdrop-blur-xl text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/5">{post.rank}</span>
                    </div>
                  </div>
                  <div className="w-full lg:w-[45%] flex flex-col pt-4">
                    <div className="flex items-center gap-6 mb-12 px-2">
                      <div className="w-20 h-20 bg-maroon-900/40 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl border border-white/5 shadow-inner">{post.userName.charAt(0)}</div>
                      <div>
                        <h4 className="text-white font-black text-xl uppercase tracking-tighter leading-none mb-2">{post.userName}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">{formatTime(post.timestamp)}</p>
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight mb-10 px-2">{post.topic}</h3>
                    <div className="p-12 bg-white/5 rounded-[3.5rem] border-l-[10px] border-maroon-800 shadow-2xl relative">
                      <p className="text-gray-300 text-lg leading-relaxed font-medium">{post.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {notice && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-fade-in">
          <div className="bg-white rounded-[4rem] w-full max-w-lg p-16 shadow-2xl border border-gray-100 text-center relative">
            <div className="w-24 h-24 bg-maroon-50 rounded-[2rem] flex items-center justify-center text-maroon-800 text-5xl mx-auto mb-10 shadow-inner">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-6 leading-none">{notice.title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed text-lg mb-12">{notice.message}</p>
            <button
              onClick={() => setNotice(null)}
              className="w-full bg-maroon-800 text-white font-black py-7 rounded-[2rem] uppercase tracking-widest text-xs hover:bg-maroon-900 transition-all shadow-xl active:scale-95"
            >
              Dismiss Notice
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-950/90 backdrop-blur-3xl p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-16 shadow-2xl border border-gray-100 my-10 relative">
            <button onClick={() => { setShowModal(false); setEditingAch(null); }} className="absolute top-10 right-10 text-gray-300 hover:text-maroon-800 transition-all"><i className="fa-solid fa-circle-xmark text-6xl"></i></button>
            <h3 className="text-6xl font-black uppercase text-gray-900 mb-8 leading-none">{editingAch ? 'Modify' : 'Publish'} <br /><span className="text-maroon-800">Honor.</span></h3>
            <div className="space-y-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Assigned Honoree</label>
                <select value={formData.userId} onChange={(e) => { const sid = e.target.value; const student = allStudents.find(s => s.id === sid); setFormData({ ...formData, userId: sid, participantName: student ? student.name : formData.participantName }); }} className="w-full bg-gray-50 border-none rounded-3xl p-8 font-black outline-none focus:ring-4 focus:ring-maroon-800/10 shadow-inner appearance-none">
                  <option value="">Guest ID (Unlinked)</option>
                  {allStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Engagement Activity (Club Event)</label>
                <select value={formData.activityId} onChange={(e) => setFormData({ ...formData, activityId: e.target.value })} className="w-full bg-gray-50 border-none rounded-3xl p-8 font-black outline-none focus:ring-4 focus:ring-maroon-800/10 shadow-inner appearance-none">
                  <option value="">Select Chapter Registry Event</option>
                  {activities.map(act => <option key={act.id} value={act.id}>{act.name} ({act.clubName})</option>)}
                  <option value="manual">Manual Entry / External Event</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Achievement Rank</label>
                <input type="text" value={formData.achievement} onChange={(e) => setFormData({ ...formData, achievement: e.target.value })} className="w-full bg-gray-50 border-none rounded-3xl p-8 font-black outline-none focus:ring-4 focus:ring-maroon-800/10 shadow-inner" placeholder="e.g. Winner / 1st Place" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Certificate Provenance</label>
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-72 bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:bg-maroon-50 transition-all overflow-hidden relative group">
                  {formData.certificateUrl ? <img src={formData.certificateUrl} className="w-full h-full object-contain" alt="Proof" /> : <><i className="fa-solid fa-award text-gray-200 text-6xl"></i><span className="text-[9px] font-black uppercase text-gray-400">Upload Registry Proof</span></>}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
            <div className="flex gap-8 mt-20">
              <button onClick={() => { setShowModal(false); setEditingAch(null); }} className="flex-grow bg-gray-100 py-10 rounded-[2rem] font-black uppercase text-[10px] text-gray-400">Cancel</button>
              <button onClick={handleOfficialSubmit} className="flex-grow bg-maroon-800 text-white py-10 rounded-[2rem] font-black uppercase text-[10px] shadow-2xl hover:bg-maroon-900 active:scale-95 transition-all">Sync Registry</button>
            </div>
          </div>
        </div>
      )}

      {showPostModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-950/95 backdrop-blur-3xl p-6 overflow-y-auto animate-fade-in scroll-hide">
          <div className="bg-white rounded-[4rem] w-full max-w-2xl p-16 shadow-2xl relative my-10 border border-gray-100">
            <button onClick={() => setShowPostModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-maroon-800 transition-all"><i className="fa-solid fa-circle-xmark text-6xl"></i></button>
            <h3 className="text-6xl font-black uppercase text-gray-900 mb-10 leading-none">Sync <br /><span className="text-maroon-800">Victory.</span></h3>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <input type="text" className="bg-gray-50 rounded-2xl p-6 font-bold shadow-inner outline-none w-full" placeholder="Domain (e.g. AI)" value={postData.domain} onChange={e => setPostData({ ...postData, domain: e.target.value })} />
                <input type="text" className="bg-gray-50 rounded-2xl p-6 font-bold shadow-inner outline-none w-full" placeholder="Rank (e.g. Winner)" value={postData.rank} onChange={e => setPostData({ ...postData, rank: e.target.value })} />
              </div>
              <input type="text" className="w-full bg-gray-50 rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="Victory Topic" value={postData.topic} onChange={e => setPostData({ ...postData, topic: e.target.value })} />
              <textarea className="w-full bg-gray-50 rounded-2xl p-6 font-bold shadow-inner h-32 outline-none resize-none" placeholder="Narrative detail..." value={postData.description} onChange={e => setPostData({ ...postData, description: e.target.value })} />

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em]">Visual Proof Manifest</label>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${(postData.photos || []).length >= 4 ? 'text-red-500' : 'text-maroon-800'}`}>
                    {(postData.photos || []).length} / 4 Assets
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {(postData.photos || []).map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={p} className="w-full h-full object-cover" />
                      <button onClick={() => setPostData({ ...postData, photos: postData.photos?.filter((_, idx) => idx !== i) })} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  ))}
                  {(postData.photos || []).length < 4 && (
                    <button onClick={() => postPhotosRef.current?.click()} className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 hover:border-maroon-800 transition-all"><i className="fa-solid fa-plus text-2xl"></i></button>
                  )}
                </div>
                <input ref={postPhotosRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePostPhotos} />
              </div>

              <input type="text" className="w-full bg-gray-50 rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="Video Evidence (YouTube Link)" value={postData.videoUrl} onChange={e => setPostData({ ...postData, videoUrl: e.target.value })} />
            </div>

            <div className="flex gap-4 mt-12">
              <button onClick={() => setShowPostModal(false)} className="flex-grow bg-gray-100 py-6 rounded-2xl font-black text-gray-400">Abort</button>
              <button onClick={handlePostSubmit} className="flex-grow bg-maroon-800 text-white py-6 rounded-2xl font-black shadow-xl active:scale-95 transition-all">Broadcast Manifest</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsView;
