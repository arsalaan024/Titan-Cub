import React, { useState, useRef, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { User, Club, Activity, UserRoles, Announcement, ChatMessage, PortalSettings } from '../types';
import { db } from '../services/db';
import MediaInput from '../components/MediaInput';
import { formatMediaLink } from '../services/mediaUtils';

interface ClubDetailViewProps {
  user: User | null;
  clubs: Club[];
  activities: Activity[];
  announcements: Announcement[];
  onAddAnnouncement: (ann: Announcement) => void;
  onUpdate: () => void;
  portalSettings: PortalSettings | null;
}

const ClubDetailView: React.FC<ClubDetailViewProps> = ({
  user,
  clubs,
  activities,
  announcements,
  onAddAnnouncement,
  onUpdate,
  portalSettings
}) => {
  const { clubId } = useParams();
  const club = clubs.find(c => c.id === clubId);

  const [activeTab, setActiveTab] = useState<'activities' | 'chat' | 'members' | 'requests'>('activities');
  const [chatMessage, setChatMessage] = useState('');
  const [clubChats, setClubChats] = useState<ChatMessage[]>([]);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [newAnn, setNewAnn] = useState('');
  const [isEditingClub, setIsEditingClub] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''] });
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});

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

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityForm, setActivityForm] = useState({
    name: '',
    date: '',
    reportUrl: '',
    reportName: '',
    photos: [] as string[]
  });

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  useEffect(() => {
    if (activeTab === 'chat' && clubChats.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [clubChats, activeTab]);

  const isClubAdmin = user?.role === UserRoles.CLUB_ADMIN || [UserRoles.ADMIN, UserRoles.SUPER_ADMIN].includes(user?.role as any);
  const isMember = user?.clubMembership?.includes(club?.id || '') || isClubAdmin;
  const isPending = user?.pendingClubRequests?.includes(club?.id || '');

  useEffect(() => {
    if (clubId) {
      db.getClubMembers(clubId).then(setClubMembers);
      if (isClubAdmin) {
        db.getClubJoinRequests(clubId).then(setJoinRequests);
      }
    }
  }, [clubId, activeTab, isClubAdmin]);

  // Poll for club chat messages
  useEffect(() => {
    if (activeTab !== 'chat' || !clubId) return;

    const poll = async () => {
      try {
        const latestMsgs = await db.getClubChat(clubId);
        setClubChats(prev => {
          if (JSON.stringify(latestMsgs) !== JSON.stringify(prev)) {
            return latestMsgs;
          }
          return prev;
        });
      } catch (e) {
        console.error("Polling club chat error:", e);
      }
    };

    poll(); // Initial fetch
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [clubId, activeTab]);

  if (!club) return <Navigate to="/clubs" />;

  const clubActivities = activities.filter(a => a.clubId === clubId);
  const clubAnnouncements = announcements.filter(a => a.clubId === clubId);

  const handleRequestJoin = async () => {
    if (!user || isPending) return;
    await db.requestJoinClub(club.id, user.id);
    onUpdate(); // Triggers a re-render from App.tsx which re-fetches the user profile
  };

  const handleProcessRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    await db.handleJoinRequest(requestId, status);
    // Refresh lists
    db.getClubJoinRequests(club.id).then(setJoinRequests);
    db.getClubMembers(club.id).then(setClubMembers);
  };

  const handleSendChat = () => {
    if (!chatMessage.trim() || !user) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name, // Real name in club chat
      senderRole: user.role,
      text: chatMessage,
      timestamp: new Date().toISOString(),
      clubId: club.id
    };
    db.addGlobalChat(msg);
    setChatMessage('');
  };

  const handleCreatePoll = () => {
    const validOptions = pollData.options.filter(opt => opt.trim() !== '');
    if (!pollData.question || validOptions.length < 2 || !user) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name, // Real name in club chat
      senderRole: user.role,
      text: `📊 POLL: ${pollData.question}`,
      timestamp: new Date().toISOString(),
      clubId: club.id,
      poll: {
        question: pollData.question,
        options: validOptions.map(opt => ({ text: opt, votes: 0 }))
      }
    };
    db.addGlobalChat(msg);
    setPollData({ question: '', options: ['', ''] });
    setIsPollOpen(false);
  };

  const handleVote = async (messageId: string, optionIndex: number) => {
    if (localVotes[messageId] !== undefined) return; // Prevent double voting locally for immediate UX
    setLocalVotes(prev => ({ ...prev, [messageId]: optionIndex }));
    try {
      await db.votePoll(messageId, optionIndex);
    } catch (err) {
      console.error('Failed to vote:', err);
    }
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
    db.updateClub({ ...club, ...clubEditForm }).then(() => {
      onUpdate();
      setIsEditingClub(false);
    });
  };

  const handleDownloadReport = (url: string, fileName: string) => {
    if (!url || url === '#' || url === '') {
      alert("No report found.");
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `TITAN_REPORT_${fileName.replace(/\s+/g, '_').toUpperCase()}.pdf`;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => document.body.removeChild(anchor), 200);
  };

  const openActivityModal = (act?: Activity) => {
    if (act) {
      setEditingActivity(act);
      setActivityForm({
        name: act.name,
        date: act.date,
        reportUrl: act.reportUrl || '',
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
    if (editingActivity) db.updateActivity({ ...editingActivity, ...activityPayload }).then(() => {
      setIsActivityModalOpen(false);
      onUpdate();
    });
    else db.addActivity({ id: 'act_' + Date.now(), ...activityPayload }).then(() => {
      setIsActivityModalOpen(false);
      onUpdate();
    });
  };

  return (
    <div className="bg-white min-h-screen relative pb-24">
      <div className="relative h-[320px] md:h-[480px] overflow-hidden">
        <img src={formatMediaLink(club.bannerImage)} className="w-full h-full object-cover" alt={club.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-2 z-50">
          {isClubAdmin && (
            <button
              onClick={() => setIsEditingClub(!isEditingClub)}
              className="backdrop-blur-xl px-5 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/20 text-white"
            >
              <i className={`fa-solid ${isEditingClub ? 'fa-xmark' : 'fa-gear'} text-sm`}></i>
              <span>{isEditingClub ? 'Exit' : 'Config'}</span>
            </button>
          )}
        </div>

        <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-white rounded-3xl p-3 shadow-2xl shrink-0">
              <img src={formatMediaLink(club.logo)} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div className="text-white">
              <h2 className="text-6xl font-black tracking-tighter uppercase leading-none mb-3">{club.name}</h2>
              <p className="text-xl font-bold opacity-70 tracking-tight line-clamp-1">{club.tagline}</p>
            </div>
          </div>
          {user && !isMember && (
            <button
              onClick={handleRequestJoin}
              disabled={isPending}
              className="backdrop-blur-xl px-8 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest border border-white/20 text-white hover:bg-white hover:text-black transition-all disabled:opacity-100 disabled:cursor-not-allowed group shadow-2xl shrink-0"
              style={isPending ? { backgroundColor: themeColor, borderColor: 'transparent' } : {}}
            >
              <i className={`fa-solid ${isPending ? 'fa-clock opacity-50' : 'fa-user-plus group-hover:scale-110'} transition-transform text-lg`}></i>
              <span>{isPending ? 'Request Sent' : 'Request to Join'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <div className="flex gap-4 mb-12 border-b-2 border-gray-100 overflow-x-auto scroll-hide">
              {(isMember ? ['activities', 'chat', 'members'] : ['activities']).concat(isClubAdmin ? ['requests'] : []).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-4 rounded-t-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-white shadow-xl' : 'text-gray-400'}`}
                  style={activeTab === tab ? { backgroundColor: themeColor } : {}}
                >
                  {tab}
                  {tab === 'requests' && joinRequests.length > 0 && (
                    <span className="ml-2 bg-white text-black px-2 py-0.5 rounded-full text-[8px]">{joinRequests.length}</span>
                  )}
                </button>
              ))}
            </div>

            {isEditingClub ? (
              <div className="bg-gray-50 rounded-[3rem] p-12 border border-gray-100 space-y-8 animate-fade-in">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Chapter Configuration</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Club Name</label>
                    <input value={clubEditForm.name} onChange={e => setClubEditForm({ ...clubEditForm, name: e.target.value })} className="w-full p-6 rounded-2xl bg-white border-none shadow-inner font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Theme Color</label>
                    <input type="color" value={clubEditForm.themeColor} onChange={e => setClubEditForm({ ...clubEditForm, themeColor: e.target.value })} className="w-full h-16 rounded-2xl overflow-hidden cursor-pointer" />
                  </div>
                </div>

                <MediaInput label="Chapter Logo" value={clubEditForm.logo} onChange={val => setClubEditForm({ ...clubEditForm, logo: val })} storageMode={portalSettings?.storageMode || 'database'} type="image" />
                <MediaInput label="Hero Banner" value={clubEditForm.bannerImage} onChange={val => setClubEditForm({ ...clubEditForm, bannerImage: val })} storageMode={portalSettings?.storageMode || 'database'} type="image" />

                <div className="pt-8 border-t border-gray-200 space-y-6">
                  <h4 className="font-black uppercase tracking-widest text-[#800000] text-sm">Faculty Oversight</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <input placeholder="Faculty Name" value={clubEditForm.facultyName} onChange={e => setClubEditForm({ ...clubEditForm, facultyName: e.target.value })} className="w-full p-6 rounded-2xl bg-white border-none shadow-inner font-bold" />
                    <input placeholder="Faculty Role" value={clubEditForm.facultyRole} onChange={e => setClubEditForm({ ...clubEditForm, facultyRole: e.target.value })} className="w-full p-6 rounded-2xl bg-white border-none shadow-inner font-bold" />
                  </div>
                  <MediaInput label="Faculty Photo" value={clubEditForm.facultyPhoto} onChange={val => setClubEditForm({ ...clubEditForm, facultyPhoto: val })} storageMode={portalSettings?.storageMode || 'database'} type="image" />
                </div>

                <button onClick={handleUpdateClubSettings} className="w-full py-6 bg-[#800000] text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl">Broadcast Updates</button>
              </div>
            ) : (
              <>
                {activeTab === 'activities' && (
                  <div className="space-y-12">
                    <div className="flex justify-between items-center">
                      <h3 className="text-3xl font-black uppercase tracking-tighter">Activity Registry</h3>
                      {isClubAdmin && <button onClick={() => openActivityModal()} className="px-8 py-4 rounded-2xl text-white font-black uppercase text-[10px]" style={{ backgroundColor: themeColor }}>New Entry</button>}
                    </div>
                    <div className="grid gap-8">
                      {clubActivities.map(act => (
                        <div key={act.id} className="group bg-gray-50 rounded-[3rem] p-10 border border-gray-100 hover:bg-white transition-all duration-500 relative">
                          {isClubAdmin && (
                            <div className="absolute top-6 right-6 flex gap-2">
                              <button onClick={() => openActivityModal(act)} className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center" style={{ color: themeColor }}><i className="fa-solid fa-pen-nib"></i></button>
                              <button onClick={() => { if (confirm('Purge?')) db.deleteActivity(act.id).then(onUpdate); }} className="w-10 h-10 bg-red-600 shadow-lg rounded-xl text-white flex items-center justify-center"><i className="fa-solid fa-trash"></i></button>
                            </div>
                          )}
                          <div className="flex gap-10">
                            <div className="w-1/3 aspect-square rounded-[2.5rem] overflow-hidden bg-gray-200">
                              <img src={formatMediaLink(act.photos[0] || 'https://via.placeholder.com/400')} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-grow">
                              <span className="text-[10px] font-black uppercase tracking-widest mb-3 block" style={{ color: themeColor }}>{act.date}</span>
                              <h4 className="text-3xl font-black tracking-tighter uppercase mb-6">{act.name}</h4>
                              <div className="flex gap-4">
                                <button onClick={() => handleDownloadReport(act.reportUrl || '', act.name)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase border flex items-center gap-2 ${act.reportUrl ? 'bg-white' : 'bg-gray-100 text-gray-300 opacity-50'}`} style={act.reportUrl ? { color: themeColor, borderColor: themeColor } : {}}>
                                  <i className="fa-solid fa-file-pdf"></i> Report
                                </button>
                                <Link to={`/gallery?clubId=${club.id}`} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase border flex items-center gap-2 bg-white" style={{ color: themeColor, borderColor: themeColor }}>
                                  <i className="fa-solid fa-images"></i> Visuals
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="grid grid-cols-4 gap-6">
                    {clubMembers.map(m => (
                      <Link key={m.clerkId} to={`/profile/${m.clerkId}`} className="group bg-white border border-gray-100 rounded-[2.5rem] p-6 text-center hover:shadow-2xl transition-all">
                        <div className="w-20 h-20 rounded-2xl mx-auto overflow-hidden mb-4 ring-4 ring-transparent group-hover:ring-[#800000]/10 transition-all">
                          {m.photoUrl ? <img src={formatMediaLink(m.photoUrl)} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-black text-2xl">{m.displayName?.[0]}</div>}
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-tight text-gray-900 line-clamp-1">{m.displayName}</h4>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.role}</p>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Poll Creation Modal within Club View */}
                {isPollOpen && activeTab === 'chat' && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-gray-900 uppercase">Create a Club Poll</h3>
                        <button onClick={() => setIsPollOpen(false)} className="text-gray-400 hover:text-maroon-800"><i className="fa-solid fa-xmark text-2xl"></i></button>
                      </div>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Ask the club a question..."
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-maroon-800/20 px-6 py-4 rounded-2xl outline-none font-semibold text-gray-900"
                          value={pollData.question}
                          onChange={(e) => setPollData({ ...pollData, question: e.target.value })}
                        />
                        <div className="space-y-2">
                          {pollData.options.map((opt, i) => (
                            <input
                              key={i}
                              type="text"
                              placeholder={`Option ${i + 1}`}
                              className="w-full bg-gray-50 border-2 border-transparent focus:border-maroon-800/20 px-6 py-3 rounded-xl outline-none font-medium text-gray-700 text-sm"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...pollData.options];
                                newOpts[i] = e.target.value;
                                setPollData({ ...pollData, options: newOpts });
                              }}
                            />
                          ))}
                          <button
                            onClick={() => setPollData({ ...pollData, options: [...pollData.options, ''] })}
                            className="text-[10px] font-black uppercase tracking-widest hover:underline"
                            style={{ color: themeColor }}
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handleCreatePoll}
                        className="w-full text-white font-black py-4 rounded-2xl shadow-lg hover:brightness-90 transition-all uppercase tracking-widest text-xs"
                        style={{ backgroundColor: themeColor }}
                      >
                        Launch Poll
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="bg-gray-50 rounded-[3.5rem] p-12 border border-gray-100 flex flex-col h-[700px]">
                    <div className="flex-grow overflow-y-auto space-y-6 pr-4 mb-6 scroll-hide">
                      {clubChats.map(m => {
                        const isMe = m.senderId === user?.id;
                        return (
                          <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-6 rounded-3xl ${isMe ? 'text-white rounded-tr-none' : 'bg-white border shadow-sm rounded-tl-none'}`} style={isMe ? { backgroundColor: themeColor } : {}}>
                              <div className="flex justify-between items-center gap-8 mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{m.senderName}</span>
                                <span className="text-[7px] font-bold opacity-40">{formatTime(m.timestamp)}</span>
                              </div>
                              <p className="text-sm font-medium leading-relaxed">{m.text}</p>

                              {/* Poll Content in Club Chat */}
                              {m.poll && (
                                <div className={`mt-4 rounded-2xl p-5 border ${isMe ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'}`}>
                                  <h4 className="font-black text-xs uppercase tracking-widest mb-4">{m.poll.question}</h4>
                                  <div className="space-y-2">
                                    {m.poll.options.map((opt: any, idx: number) => {
                                      const hasVoted = localVotes[m.id!] !== undefined;
                                      const totalVotes = m.poll?.options.reduce((acc: number, o: any) => acc + o.votes, 0) || 1;
                                      const percent = Math.round((opt.votes / totalVotes) * 100);

                                      return (
                                        <button
                                          key={idx}
                                          onClick={() => handleVote(m.id!, idx)}
                                          disabled={hasVoted}
                                          className={`w-full text-left relative overflow-hidden rounded-xl p-3 text-xs font-semibold transition-all border ${localVotes[m.id!] === idx
                                            ? 'border-gray-900 bg-white text-gray-900 shadow-md'
                                            : isMe
                                              ? 'border-white/20 hover:border-white/40 bg-white/5'
                                              : 'border-transparent hover:border-gray-200 bg-black/5'
                                            }`}
                                        >
                                          <div className={`relative z-10 flex justify-between items-center ${isMe && localVotes[m.id!] === idx ? 'text-gray-900' : ''}`}>
                                            <span>{opt.text}</span>
                                            {hasVoted && <span className="opacity-60">{percent}%</span>}
                                          </div>
                                          {hasVoted && (
                                            <div
                                              className={`absolute inset-y-0 left-0 transition-all duration-500 ${isMe ? 'bg-white/20' : 'bg-black/10'}`}
                                              style={{ width: `${percent}%` }}
                                            />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="bg-white rounded-[2rem] p-3 flex gap-4 shadow-sm border border-gray-100">
                      <button
                        onClick={() => setIsPollOpen(true)}
                        className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 hover:text-gray-600 transition-all border border-transparent flex-shrink-0"
                      >
                        <i className="fa-solid fa-square-poll-vertical text-xl"></i>
                      </button>
                      <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendChat()} placeholder="Draft message..." className="flex-grow bg-transparent border-none px-6 py-4 font-bold outline-none text-sm" />
                      <button onClick={handleSendChat} className="w-14 h-14 rounded-2xl text-white flex items-center justify-center hover:opacity-90 transition-all flex-shrink-0" style={{ backgroundColor: themeColor }}><i className="fa-solid fa-paper-plane"></i></button>
                    </div>
                  </div>
                )}

                {activeTab === 'requests' && isClubAdmin && (
                  <div className="bg-gray-50 rounded-[3rem] p-12 border border-gray-100 space-y-8 animate-fade-in">
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Pending Requests</h3>
                    {joinRequests.length === 0 ? (
                      <p className="text-gray-400 font-medium">No pending requests at the moment.</p>
                    ) : (
                      <div className="grid gap-6">
                        {joinRequests.map(req => (
                          <div key={req.requestId} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                {req.photoUrl ? <img src={formatMediaLink(req.photoUrl)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-gray-400">{req.displayName?.[0]}</div>}
                              </div>
                              <div>
                                <h4 className="font-black text-gray-900 uppercase tracking-tight">{req.displayName}</h4>
                                <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{req.email}</span>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button onClick={() => handleProcessRequest(req.requestId, 'REJECTED')} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-gray-200">Reject</button>
                              <button onClick={() => handleProcessRequest(req.requestId, 'APPROVED')} className="px-6 py-3 rounded-xl bg-green-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-green-600">Approve</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="lg:col-span-4 space-y-12">
            <div className="rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden" style={{ backgroundColor: themeColor }}>
              <div className="absolute top-0 right-0 p-6 opacity-10"><i className="fa-solid fa-bullhorn text-8xl"></i></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-60">Chapter Broadcasts</h4>
              <div className="space-y-8 max-h-[300px] overflow-y-auto pr-2 scroll-hide">
                {clubAnnouncements.map(ann => (
                  <div key={ann.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                    <p className="text-base font-medium leading-relaxed mb-3">{ann.text}</p>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{ann.timestamp}</span>
                  </div>
                ))}
              </div>
              {isClubAdmin && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <textarea value={newAnn} onChange={(e) => setNewAnn(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-medium focus:ring-1 focus:ring-white outline-none mb-4 resize-none" placeholder="New broadcast..." rows={2} />
                  <button onClick={handlePostAnnouncement} className="w-full bg-white py-3 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-xl" style={{ color: themeColor }}>Broadcast</button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-10">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Chapter Overview</h4>
                <p className="text-base text-gray-600 font-medium leading-relaxed">{club.description}</p>
              </div>
              {club.facultyName && (
                <div className="pt-10 border-t border-gray-50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Faculty Supervisor</h4>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                      <img src={formatMediaLink(club.facultyPhoto || 'https://via.placeholder.com/150')} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <h5 className="font-black text-gray-900 uppercase tracking-tighter">{club.facultyName}</h5>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: themeColor }}>{club.facultyRole}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isActivityModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-16 shadow-2xl relative my-10 border border-gray-100">
            <button onClick={() => setIsActivityModalOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-[#800000] transition-all"><i className="fa-solid fa-circle-xmark text-6xl"></i></button>
            <h3 className="text-4xl font-black uppercase text-gray-900 mb-10 tracking-tight">{editingActivity ? 'Modify' : 'Log'} Activity.</h3>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Activity Name</label>
                <input value={activityForm.name} onChange={e => setActivityForm({ ...activityForm, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-8 py-5 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 shadow-inner text-lg" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Engagement Date</label>
                <input type="date" value={activityForm.date} onChange={e => setActivityForm({ ...activityForm, date: e.target.value })} className="w-full bg-gray-50 rounded-2xl px-8 py-5 font-bold border-none shadow-inner" />
              </div>

              <MediaInput label="Official Report (PDF)" value={activityForm.reportUrl} onChange={val => setActivityForm({ ...activityForm, reportUrl: val })} storageMode={portalSettings?.storageMode || 'database'} type="document" />

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Visual Manifest (Photos)</label>
                <div className="grid grid-cols-4 gap-4">
                  {activityForm.photos.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img src={formatMediaLink(p)} className="w-full h-full object-cover" />
                      <button onClick={() => setActivityForm({ ...activityForm, photos: activityForm.photos.filter((_, idx) => idx !== i) })} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  ))}
                </div>
                <MediaInput label="Add Asset" value="" onChange={val => setActivityForm({ ...activityForm, photos: [...activityForm.photos, val] })} storageMode={portalSettings?.storageMode || 'database'} type="image" />
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button onClick={() => setIsActivityModalOpen(false)} className="flex-grow bg-gray-100 py-6 rounded-2xl font-black uppercase text-[10px] text-gray-400">Abort</button>
              <button onClick={handleSaveActivity} className="flex-grow bg-[#800000] text-white py-6 rounded-2xl font-black uppercase text-[10px] shadow-2xl">Sync Registry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDetailView;
