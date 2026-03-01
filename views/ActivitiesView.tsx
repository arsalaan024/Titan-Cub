
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, User, UserRoles, Club } from '../types';

interface ActivitiesViewProps {
  activities: Activity[];
  user: User | null;
  clubs: Club[];
  onAdd: (act: Activity) => void;
  onUpdate: (act: Activity) => void;
  onDelete: (id: string) => void;
}

const compressImage = (base64: string, maxWidth = 800, quality = 0.6): Promise<string> => {
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

const ActivitiesView: React.FC<ActivitiesViewProps> = ({ activities, user, clubs, onAdd, onUpdate, onDelete }) => {
  const [commonSearch, setCommonSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAct, setEditingAct] = useState<Activity | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    clubId: clubs[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    reportUrl: '',
    reportName: '',
    photos: [] as string[]
  });

  const reportInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const filteredActivities = useMemo(() => {
    const term = commonSearch.toLowerCase();
    return activities.filter(act => {
      const matchName = act.name.toLowerCase().includes(term);
      const matchClub = act.clubName.toLowerCase().includes(term);
      const matchDate = act.date.includes(term);
      return matchName || matchClub || matchDate;
    });
  }, [activities, commonSearch]);

  const handleDownloadReport = (url: string, fileName: string) => {
    if (!url || url === '#' || url === '') {
      alert("No report document found for this registry entry.");
      return;
    }

    try {
      const safeFileName = `TITAN_REPORT_${fileName.replace(/\s+/g, '_').toUpperCase()}.pdf`;
      if (url.startsWith('data:')) {
        const parts = url.split(',');
        const header = parts[0];
        const base64 = parts[1];
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
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
      console.error("Report download failed:", err);
      alert("⚠️ DOWNLOAD ERROR: The secure data pipeline failed.");
    }
  };

  const goToGallery = (clubId: string) => {
    navigate(`/gallery?clubId=${clubId}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'report' | 'photo') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (type === 'report') {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, reportUrl: reader.result as string, reportName: file.name }));
      reader.readAsDataURL(file);
    } else {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string);
          setFormData(prev => ({ ...prev, photos: [...prev.photos, compressed] }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleOpenAdd = () => {
    setEditingAct(null);
    setFormData({ name: '', clubId: clubs[0]?.id || '', date: new Date().toISOString().split('T')[0], reportUrl: '', reportName: '', photos: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (act: Activity) => {
    setEditingAct(act);
    setFormData({ name: act.name, clubId: act.clubId, date: act.date, reportUrl: act.reportUrl, reportName: act.reportUrl ? 'Current Document' : '', photos: [...act.photos] });
    setShowModal(true);
  };

  const handlePublish = () => {
    if (!formData.name || !formData.date || !formData.clubId) {
      alert("Required fields missing.");
      return;
    }
    const selectedClub = clubs.find(c => c.id === formData.clubId);
    const activityData: Activity = {
      id: editingAct ? editingAct.id : 'act_' + Date.now(),
      name: formData.name,
      clubId: formData.clubId,
      clubName: selectedClub?.name || 'Unknown Club',
      date: formData.date,
      reportUrl: formData.reportUrl,
      photos: formData.photos
    };
    if (editingAct) onUpdate(activityData);
    else onAdd(activityData);
    setShowModal(false);
  };

  const canEdit = user && [UserRoles.ADMIN, UserRoles.SUPER_ADMIN, UserRoles.CLUB_ADMIN].includes(user.role as UserRoles);

  return (
    <div className="py-12 md:py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10 mb-12 md:mb-16">
          <div>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 uppercase leading-[0.9] md:leading-[0.8] mb-4 md:mb-6 animate-slide-up">Activity <br/><span className="text-maroon-800">Master List.</span></h2>
            <p className="text-gray-500 text-base md:text-xl font-medium max-w-xl animate-fade-in">Unified registry for all campus chapters. Download reports and view visual manifest evidence.</p>
          </div>
          {canEdit && (
            <button onClick={handleOpenAdd} className="bg-maroon-800 text-white px-8 py-4 md:px-12 md:py-6 rounded-xl md:rounded-[2rem] font-black shadow-2xl uppercase tracking-widest text-[10px] md:text-xs active:scale-95 transition-all hover:bg-maroon-900 flex items-center justify-center gap-3 animate-fade-in">
              <i className="fa-solid fa-plus-circle text-lg"></i> Register New
            </button>
          )}
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 mb-8 md:mb-12 animate-fade-in">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-gray-300 text-lg md:text-xl"></i>
            <input 
              type="text" 
              placeholder="Search by name, club, or date..."
              className="w-full pl-14 md:pl-20 pr-6 py-4 md:py-6 bg-gray-50 border-none rounded-xl md:rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-maroon-800/10 transition-all outline-none font-bold text-base md:text-xl shadow-inner"
              value={commonSearch}
              onChange={(e) => setCommonSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity</th>
                  <th className="px-6 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Host Club</th>
                  <th className="px-6 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Report</th>
                  <th className="px-6 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Photos</th>
                  {canEdit && (
                    <>
                      <th className="px-6 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Edit</th>
                      <th className="px-6 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Delete</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredActivities.length > 0 ? filteredActivities.map((act) => (
                  <tr key={act.id} className="group hover:bg-maroon-50/10 transition-all text-sm md:text-base">
                    <td className="px-6 md:px-10 py-4 md:py-6 font-black text-gray-900 group-hover:text-maroon-800 transition-colors">{act.name}</td>
                    <td className="px-6 md:px-10 py-4 md:py-6 font-bold text-gray-500 uppercase text-[10px] md:text-xs">{act.clubName}</td>
                    <td className="px-6 md:px-10 py-4 md:py-6 font-bold text-gray-400 tabular-nums">{act.date}</td>
                    <td className="px-6 md:px-10 py-4 md:py-6 text-center">
                      <button 
                        onClick={() => handleDownloadReport(act.reportUrl, act.name)} 
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-all border ${act.reportUrl && act.reportUrl !== '#' ? 'bg-white text-maroon-800 hover:bg-maroon-800 hover:text-white border-maroon-100 shadow-sm' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`} 
                        disabled={!act.reportUrl || act.reportUrl === '#'}
                      >
                        <i className="fa-solid fa-file-pdf text-lg md:text-xl"></i>
                      </button>
                    </td>
                    <td className="px-6 md:px-10 py-4 md:py-6 text-center">
                      <button onClick={() => goToGallery(act.clubId)} className="w-10 h-10 md:w-12 md:h-12 bg-white text-gray-400 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-maroon-800 hover:text-white transition-all shadow-sm border border-gray-100">
                        <i className="fa-solid fa-images text-lg md:text-xl"></i>
                      </button>
                    </td>
                    {canEdit && (
                      <>
                        <td className="px-6 md:px-10 py-4 md:py-6 text-center">
                          <button onClick={() => handleOpenEdit(act)} className="w-10 h-10 bg-white text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all active:scale-90 border border-blue-50">
                            <i className="fa-solid fa-pen-nib"></i>
                          </button>
                        </td>
                        <td className="px-6 md:px-10 py-4 md:py-6 text-center">
                          <button onClick={() => onDelete(act.id)} className="w-10 h-10 bg-white text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all active:scale-90 border border-red-50">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={canEdit ? 7 : 5} className="py-24 md:py-32 text-center text-gray-300 font-black uppercase tracking-[0.4em] italic text-xs md:text-sm">
                      Registry Empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-xl p-4 md:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[2rem] md:rounded-[4rem] w-full max-w-xl p-8 md:p-16 shadow-2xl relative my-6 md:my-10 border border-gray-100">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 md:top-10 md:right-10 text-gray-300 hover:text-maroon-800 transition-colors">
              <i className="fa-solid fa-circle-xmark text-3xl md:text-4xl"></i>
            </button>
            <h3 className="text-2xl md:text-4xl font-black uppercase text-gray-900 mb-8 md:mb-10 tracking-tighter">{editingAct ? 'Update Record' : 'New Entry'}</h3>
            
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Activity Designation</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 shadow-inner text-base md:text-xl" placeholder="Official Title" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Host Club</label>
                    <select value={formData.clubId} onChange={(e) => setFormData({...formData, clubId: e.target.value})} className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 font-bold outline-none appearance-none border-none shadow-inner text-sm md:text-base">
                      {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Engagement Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 font-bold outline-none border-none shadow-inner text-sm md:text-base" />
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Report (PDF)</label>
                <button onClick={() => reportInputRef.current?.click()} className={`w-full py-4 md:py-6 rounded-xl md:rounded-2xl border-2 border-dashed font-black transition-all flex items-center justify-center gap-3 text-xs md:text-sm ${formData.reportUrl ? 'border-green-500 text-green-600 bg-green-50 shadow-inner' : 'border-gray-200 text-gray-400 hover:border-maroon-800'}`}>
                  <i className={`fa-solid ${formData.reportUrl ? 'fa-check-circle' : 'fa-file-pdf'}`}></i>
                  {formData.reportName || "Select Report"}
                </button>
                <input ref={reportInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'report')} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Visual Manifest</label>
                <div className="grid grid-cols-4 gap-2 md:gap-4 mb-2">
                  {formData.photos.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-lg md:rounded-xl overflow-hidden group shadow-sm">
                      <img src={p} className="w-full h-full object-cover" alt="p" />
                      <button onClick={() => setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  ))}
                  <button onClick={() => photoInputRef.current?.click()} className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg md:rounded-xl flex items-center justify-center text-gray-300 hover:border-maroon-800 transition-all"><i className="fa-solid fa-plus text-lg"></i></button>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-10 md:mt-16">
              <button onClick={() => setShowModal(false)} className="flex-grow bg-gray-100 py-5 md:py-6 rounded-xl md:rounded-[1.5rem] font-black uppercase text-[10px] md:text-xs text-gray-400">Abort</button>
              <button onClick={handlePublish} className="flex-grow bg-maroon-800 text-white py-5 md:py-6 rounded-xl md:rounded-[1.5rem] font-black uppercase text-[10px] md:text-xs shadow-2xl active:scale-95 transition-all">Sync Publication</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesView;
