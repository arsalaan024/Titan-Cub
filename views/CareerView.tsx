
import React, { useState, useRef } from 'react';
import { CareerItem, User, UserRoles } from '../types';
import { GoogleGenAI } from "@google/genai";

interface CareerViewProps {
  items: CareerItem[];
  user: User | null;
  onAdd: (item: CareerItem) => void;
  onDelete: (id: string) => void;
}

const compressImage = (base64: string, maxWidth = 400, quality = 0.7): Promise<string> => {
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

const CareerView: React.FC<CareerViewProps> = ({ items, user, onAdd, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'placement' | 'internship' | 'hackathon'>('placement');
  const [placementSubTab, setPlacementSubTab] = useState<'opportunities' | 'records'>('opportunities');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CareerItem | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<CareerItem>>({
    title: '',
    company: '',
    description: '',
    link: '',
    date: '',
    studentName: '',
    package: '',
    studentPhoto: '',
    resumeUrl: '',
    requirements: '',
    whoCanApply: '',
    linkedinUrl: '',
    batch: '',
    quote: ''
  });

  const canEdit = user && [UserRoles.CAREER_ADMIN, UserRoles.ADMIN, UserRoles.SUPER_ADMIN].includes(user.role as UserRoles);

  const filteredItems = items.filter(item => {
    if (item.type !== activeTab) return false;
    if (activeTab === 'placement') {
      return placementSubTab === 'records' ? item.isRecord : !item.isRecord;
    }
    return true;
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setFormData(prev => ({ ...prev, studentPhoto: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleResumeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Resume file too large. Limit is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, resumeUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadResume = (url: string | undefined, studentName: string | undefined) => {
    if (!url || url === '#' || url === '') {
      alert("⚠️ DATA ERROR\nNo professional resume manifest found for this student record.");
      return;
    }

    try {
      const fileName = `TITAN_RESUME_${(studentName || 'STUDENT').replace(/\s+/g, '_').toUpperCase()}.pdf`;
      
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
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        
        setTimeout(() => {
          document.body.removeChild(anchor);
          URL.revokeObjectURL(blobUrl);
        }, 200);
      } else {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.target = "_blank";
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => document.body.removeChild(anchor), 200);
      }
    } catch (err) {
      console.error("Resume download failed:", err);
      alert("⚠️ DOWNLOAD FAILURE\nThe resume asset could not be streamed to your device.");
    }
  };

  const handleAddSubmit = () => {
    if (activeTab === 'placement' && placementSubTab === 'records') {
      if (!formData.studentName || !formData.company || !formData.title || !formData.package) {
        alert("Please provide student name, company, post, and package.");
        return;
      }
    } else {
      if (!formData.title || !formData.company || !formData.description) {
        alert("Title, company, and description are required.");
        return;
      }
    }

    const newItem: CareerItem = {
      id: Date.now().toString(),
      type: activeTab,
      isRecord: activeTab === 'placement' && placementSubTab === 'records',
      title: formData.title || '',
      company: formData.company,
      description: formData.description || '',
      link: formData.link,
      date: formData.date,
      studentName: formData.studentName,
      package: formData.package,
      studentPhoto: formData.studentPhoto,
      resumeUrl: formData.resumeUrl,
      requirements: formData.requirements,
      whoCanApply: formData.whoCanApply,
      linkedinUrl: formData.linkedinUrl,
      batch: formData.batch,
      quote: formData.quote
    };

    onAdd(newItem);
    setShowAddModal(false);
    setFormData({ title: '', company: '', description: '', link: '', date: '', studentName: '', package: '', studentPhoto: '', resumeUrl: '', requirements: '', whoCanApply: '', linkedinUrl: '', batch: '', quote: '' });
  };

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-4">Career Hub</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium">Strategic gateway to elite placements, internships, and industrial insights.</p>
        </div>

        {/* Career Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {['placement', 'internship', 'hackathon'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                if (tab === 'placement') setPlacementSubTab('opportunities');
              }}
              className={`px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all border-2 ${
                activeTab === tab 
                  ? 'bg-maroon-800 border-maroon-800 text-white shadow-2xl scale-105' 
                  : 'bg-white border-gray-100 text-gray-400 hover:border-maroon-200 hover:text-maroon-800'
              }`}
            >
              {tab}s
            </button>
          ))}
        </div>

        {/* Placement Sub-Navigation */}
        {activeTab === 'placement' && (
          <div className="flex justify-center gap-8 mb-12 border-b border-gray-100 pb-4">
            <button 
              onClick={() => setPlacementSubTab('opportunities')}
              className={`text-[10px] font-black uppercase tracking-widest transition-all px-4 ${placementSubTab === 'opportunities' ? 'text-maroon-800 border-b-2 border-maroon-800 pb-4 -mb-[18px]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Active Opportunities
            </button>
            <button 
              onClick={() => setPlacementSubTab('records')}
              className={`text-[10px] font-black uppercase tracking-widest transition-all px-4 ${placementSubTab === 'records' ? 'text-maroon-800 border-b-2 border-maroon-800 pb-4 -mb-[18px]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Placed Records (Hall of Fame)
            </button>
          </div>
        )}

        <div className="mb-12 flex justify-between items-center">
          <div>
             <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
              {activeTab === 'placement' ? (placementSubTab === 'records' ? 'Hall of Excellence' : 'Openings') : `${activeTab}s`}
            </h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Verified Titan Data Pipeline</p>
          </div>
          {canEdit && (
            <div className="flex gap-4">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-maroon-800 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-maroon-900 active:scale-95 transition-all flex items-center gap-3"
              >
                <i className="fa-solid fa-plus-circle"></i> Provision Record
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className={`group relative bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 hover:shadow-[0_40px_100px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer flex flex-col h-full`}
            >
              {item.isRecord ? (
                <div className="flex flex-col h-full">
                  <div className="relative h-64 overflow-hidden bg-gray-50">
                    <img 
                      src={item.studentPhoto || `https://ui-avatars.com/api/?name=${item.studentName}&background=800000&color=fff`} 
                      className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" 
                      alt={item.studentName} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    <div className="absolute top-6 right-6 flex flex-col gap-2">
                      <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20">
                         <span className="text-white font-black text-[11px] tabular-nums tracking-widest">{item.package}</span>
                      </div>
                      {parseInt(item.package || '0') >= 20 && (
                        <div className="bg-yellow-500 text-black px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest text-center shadow-lg">
                          Elite Placement
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-6 left-6">
                      <span className="bg-maroon-800 text-white px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest mb-2 inline-block shadow-lg">Batch {item.batch || '2024'}</span>
                      <h4 className="text-white font-black text-2xl tracking-tighter uppercase leading-none">{item.studentName}</h4>
                    </div>
                  </div>

                  <div className="p-8 flex-grow flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center text-maroon-800 shadow-inner border border-maroon-100">
                        <i className="fa-solid fa-building text-sm"></i>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Placed At</p>
                        <p className="font-black text-gray-900 uppercase tracking-tight text-sm">{item.company}</p>
                      </div>
                    </div>

                    <p className="text-gray-500 text-xs font-medium leading-relaxed italic mb-8 line-clamp-2">
                      "{item.quote || 'Standardized excellence and innovation in action.'}"
                    </p>

                    <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex gap-2">
                        {item.linkedinUrl && (
                          <a 
                            href={item.linkedinUrl} 
                            target="_blank" 
                            onClick={(e) => e.stopPropagation()} 
                            className="w-8 h-8 bg-[#0077b5]/10 text-[#0077b5] rounded-lg flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-all shadow-sm"
                          >
                            <i className="fa-brands fa-linkedin-in text-xs"></i>
                          </a>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownloadResume(item.resumeUrl, item.studentName); }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm border ${item.resumeUrl ? 'bg-maroon-50 text-maroon-800 hover:bg-maroon-800 hover:text-white border-maroon-100' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}
                          title="Download Resume"
                        >
                          <i className="fa-solid fa-file-invoice text-xs"></i>
                        </button>
                      </div>
                      <button className="flex items-center gap-2 text-maroon-800 font-black text-[9px] uppercase tracking-widest group/btn">
                         Story <i className="fa-solid fa-arrow-right-long group-hover/btn:translate-x-1 transition-transform"></i>
                      </button>
                    </div>
                  </div>

                  {canEdit && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="absolute top-6 left-6 w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all shadow-xl border border-white/20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-8 flex flex-col h-full border-t-8 border-maroon-800">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-maroon-50 rounded-2xl flex items-center justify-center text-maroon-800 text-2xl group-hover:bg-maroon-800 group-hover:text-white transition-all shadow-inner border border-maroon-100">
                      <i className={`fa-solid ${
                        item.type === 'placement' ? 'fa-building' :
                        item.type === 'internship' ? 'fa-user-graduate' :
                        'fa-code'
                      }`}></i>
                    </div>
                    {canEdit && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-maroon-800 font-black text-[10px] uppercase tracking-[0.3em] mb-2">{item.company}</p>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4">{item.title}</h3>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed line-clamp-3">{item.description}</p>
                  </div>
                  
                  <div className="mt-auto pt-8 border-t border-gray-50 flex items-center justify-between">
                    {item.date ? (
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <i className="fa-regular fa-calendar"></i>
                        <span>{item.date}</span>
                      </div>
                    ) : <span></span>}
                    <span className="flex items-center gap-2 text-maroon-800 font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform duration-500">
                      View Details <i className="fa-solid fa-arrow-right-long"></i>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="py-48 text-center opacity-10 flex flex-col items-center">
            <i className="fa-solid fa-cloud-moon text-[10rem] mb-8"></i>
            <p className="text-2xl font-black uppercase tracking-[0.4em]">No Live Intel</p>
          </div>
        )}
      </div>

      {/* MODAL SYSTEM */}
      {selectedItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-950/90 backdrop-blur-3xl p-4 sm:p-6 animate-fade-in">
          <div className={`rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative border max-h-[90vh] overflow-y-auto scroll-hide ${selectedItem.isRecord ? 'bg-white border-white' : 'bg-white/10 backdrop-blur-2xl border-white/20'}`}>
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 sm:top-10 sm:right-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-maroon-800 transition-all z-[1100] shadow-xl"
            >
              <i className="fa-solid fa-xmark text-xl sm:text-2xl"></i>
            </button>

            {selectedItem.isRecord ? (
              <div className="p-8 sm:p-12">
                <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
                  <div className="relative group">
                    <div className="w-48 h-48 rounded-[3rem] overflow-hidden bg-gray-100 border-8 border-maroon-50 shadow-2xl relative z-10">
                      <img 
                        src={selectedItem.studentPhoto || `https://ui-avatars.com/api/?name=${selectedItem.studentName}&background=800000&color=fff`} 
                        className="w-full h-full object-cover" 
                        alt="p" 
                      />
                    </div>
                    <div className="absolute -inset-4 bg-maroon-800/10 rounded-[4rem] blur-2xl group-hover:bg-maroon-800/20 transition-all"></div>
                  </div>
                  
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                      <span className="bg-maroon-800 text-white px-5 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg">Class of {selectedItem.batch || '2024'}</span>
                      {selectedItem.linkedinUrl && (
                        <a href={selectedItem.linkedinUrl} target="_blank" className="w-8 h-8 bg-[#0077b5] text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                          <i className="fa-brands fa-linkedin-in text-xs"></i>
                        </a>
                      )}
                    </div>
                    <h3 className="text-5xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-3">{selectedItem.studentName}</h3>
                    <p className="text-xl font-bold text-maroon-800 mb-6 uppercase tracking-tight">{selectedItem.title} @ {selectedItem.company}</p>
                    <div className="inline-flex items-center gap-3 bg-green-100 text-green-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-inner border border-green-200">
                      <i className="fa-solid fa-trophy text-lg"></i>
                      Placed: {selectedItem.package}
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                   <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner relative">
                    <i className="fa-solid fa-quote-left absolute top-8 left-8 text-maroon-800/10 text-7xl"></i>
                    <h4 className="text-[10px] font-black text-maroon-800 uppercase tracking-[0.4em] mb-6 relative z-10">Success Statement</h4>
                    <p className="text-gray-600 text-lg font-medium leading-relaxed italic relative z-10">
                      "{selectedItem.quote || 'I am deeply honored to represent the Titan Chapter. This achievement is a result of consistent mentorship and the innovative environment provided by our student body.'}"
                    </p>
                  </div>

                  <div className="p-10 bg-white border-2 border-gray-50 rounded-[2.5rem] shadow-sm hover:border-maroon-800/10 transition-all group">
                    <h4 className="text-[10px] font-black text-maroon-800 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 bg-maroon-800 rounded-xl flex items-center justify-center text-white text-[10px]">
                        <i className="fa-solid fa-magnifying-glass-chart"></i>
                      </div>
                      Strategic Summary & Journey
                    </h4>
                    <p className="text-gray-500 text-base font-medium leading-relaxed">
                      {selectedItem.description || 'Verified placement success documented through official departmental pipelines and industrial verification.'}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row gap-6">
                    <button 
                      onClick={() => handleDownloadResume(selectedItem.resumeUrl, selectedItem.studentName)}
                      className={`flex-grow font-black py-7 rounded-3xl flex items-center justify-center gap-4 shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs ${selectedItem.resumeUrl ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      <i className="fa-solid fa-file-pdf text-lg"></i>
                      Download Technical Resume
                    </button>
                    <button 
                       onClick={() => setSelectedItem(null)}
                       className="px-12 bg-gray-100 text-gray-500 font-black rounded-3xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px] border border-gray-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* OPPORTUNITY VIEW - UPDATED TO MATCH SCREENSHOT */
              <div className="p-6 sm:p-12 text-white">
                <div className="flex flex-col gap-8 mb-12">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                         <i className={`fa-solid ${
                           selectedItem.type === 'placement' ? 'fa-building' :
                           selectedItem.type === 'internship' ? 'fa-user-graduate' :
                           'fa-code'
                         } text-white text-3xl sm:text-4xl`}></i>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-2">{selectedItem.title}</h3>
                        <p className="text-maroon-500 font-black uppercase tracking-[0.3em] text-xs sm:text-base">{selectedItem.company}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  {/* Registry Status Section */}
                  <div className="p-6 sm:p-8 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between shadow-2xl backdrop-blur-xl">
                    <div className="flex-grow">
                      <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Registry Status</p>
                      <p className="text-green-500 font-black uppercase text-sm sm:text-lg tracking-tight">Currently Active</p>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                      <i className="fa-solid fa-satellite-dish text-green-500 text-xl sm:text-2xl animate-pulse"></i>
                    </div>
                  </div>

                  {/* Timeline Section */}
                  <div className="p-6 sm:p-8 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between shadow-2xl backdrop-blur-xl">
                    <div className="flex-grow">
                      <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Key Timeline</p>
                      <p className="text-white font-black uppercase text-sm sm:text-lg tracking-tight">{selectedItem.date || 'To Be Announced'}</p>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-maroon-500/10 rounded-2xl flex items-center justify-center border border-maroon-500/20">
                      <i className="fa-solid fa-hourglass-start text-maroon-500 text-xl sm:text-2xl"></i>
                    </div>
                  </div>

                  {/* Strategic Objectives Section */}
                  <div className="p-8 sm:p-10 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-maroon-500/20 rounded-2xl flex items-center justify-center border border-maroon-500/30">
                        <i className="fa-solid fa-align-left text-maroon-500 text-sm sm:text-lg"></i>
                      </div>
                      <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.3em]">Strategic Objectives</h4>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base font-medium whitespace-pre-wrap line-clamp-6">
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-8 flex flex-col gap-4">
                    {selectedItem.link && selectedItem.link !== '#' ? (
                      <a 
                        href={selectedItem.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full bg-white text-black font-black py-6 sm:py-7 rounded-[2rem] flex items-center justify-center gap-4 shadow-[0_15px_40px_rgba(255,255,255,0.2)] hover:bg-gray-100 transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-sm"
                      >
                        <i className="fa-solid fa-paper-plane text-lg"></i>
                        Launch Intelligence Application
                      </a>
                    ) : (
                      <div className="w-full py-6 sm:py-7 rounded-[2rem] bg-white/5 text-gray-500 font-black flex items-center justify-center uppercase tracking-widest text-[10px] sm:text-xs italic border border-white/10">Access Portal Locked</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD RECORD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-950/90 backdrop-blur-xl p-6 overflow-y-auto animate-fade-in scroll-hide">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-16 my-10 shadow-2xl relative border border-gray-100">
            <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-maroon-800 transition-colors">
               <i className="fa-solid fa-circle-xmark text-5xl"></i>
            </button>
            <div className="mb-12">
               <h3 className="text-4xl font-black uppercase tracking-tighter text-gray-900 leading-none mb-3">Provision Hub Entry</h3>
               <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Configure verified industrial dataset</p>
            </div>
            
            <div className="space-y-10">
              {activeTab === 'placement' && placementSubTab === 'records' ? (
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Official Identity Name</label>
                    <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-maroon-800/10 transition-all" placeholder="e.g. Arsalaan Khan" value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Corporate Designation</label>
                      <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-maroon-800/10 transition-all" placeholder="e.g. SDE-1" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Financial Package</label>
                      <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-maroon-800/10 transition-all" placeholder="e.g. 45 LPA" value={formData.package} onChange={e => setFormData({...formData, package: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Hiring Entity (Company)</label>
                      <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-maroon-800/10 transition-all" placeholder="e.g. Microsoft" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Academic Batch</label>
                      <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-maroon-800/10 transition-all" placeholder="e.g. 2021-2025" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">LinkedIn Identity (URL)</label>
                    <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-maroon-800/10 transition-all" placeholder="https://linkedin.com/in/..." value={formData.linkedinUrl} onChange={e => setFormData({...formData, linkedinUrl: e.target.value})} />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Success Quote / Statement</label>
                    <textarea className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-maroon-800/10 transition-all h-24 resize-none" placeholder="Provide a brief statement of success..." value={formData.quote} onChange={e => setFormData({...formData, quote: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Portrait Manifest</label>
                      <button onClick={() => photoInputRef.current?.click()} className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center overflow-hidden hover:bg-maroon-50 hover:border-maroon-200 transition-all group">
                        {formData.studentPhoto ? <img src={formData.studentPhoto} className="w-full h-full object-cover" alt="p" /> : <><i className="fa-solid fa-camera text-gray-300 text-3xl group-hover:scale-110 transition-transform"></i><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2">Upload Identity</span></>}
                      </button>
                      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Technical Resume (PDF)</label>
                      <button onClick={() => resumeInputRef.current?.click()} className={`w-full h-32 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all group ${formData.resumeUrl ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-maroon-200'}`}>
                         <i className={`fa-solid ${formData.resumeUrl ? 'fa-check-circle' : 'fa-file-pdf'} text-3xl group-hover:scale-110 transition-transform`}></i>
                         <span className="text-[8px] font-black uppercase tracking-widest mt-2">{formData.resumeUrl ? 'Resume Uploaded' : 'Upload Resume'}</span>
                      </button>
                      <input ref={resumeInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleResumeFileUpload} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Strategic Designation</label>
                      <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="e.g. Senior Researcher" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Operating Unit</label>
                      <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="e.g. Titan Robotics" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Tactical Intelligence (Description)</label>
                    <textarea className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner h-24 resize-none outline-none" placeholder="Define core objectives..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Requirements</label>
                      <textarea className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner h-24 resize-none outline-none" placeholder="List technical requirements..." value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Eligibility</label>
                      <textarea className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner h-24 resize-none outline-none" placeholder="Define eligible student groups..." value={formData.whoCanApply} onChange={e => setFormData({...formData, whoCanApply: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Registry Link</label>
                      <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="https://..." value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Operational Deadline</label>
                      <input type="date" className="w-full bg-gray-50 border-none rounded-2xl p-6 font-bold shadow-inner outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-6 mt-16">
              <button onClick={() => setShowAddModal(false)} className="flex-grow bg-gray-100 py-7 rounded-3xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-200 transition-all">Abort Config</button>
              <button onClick={handleAddSubmit} className="flex-grow bg-maroon-800 text-white py-7 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-maroon-900 active:scale-95 transition-all">Validate & Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerView;
