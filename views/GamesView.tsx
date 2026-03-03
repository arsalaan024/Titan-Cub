
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { User, UserRoles, CodingModule, CodingProblem } from '../types';

interface GamesViewProps {
  user: User | null;
  onSync: () => void;
}

type GameType = 'memory' | 'pattern' | 'focus' | 'math' | 'reaction' | 'gauntlet' | 'hub' | 'leaderboard';

// --- SUB-COMPONENTS ---

const CodingGauntlet = ({ user, onSaveScore }: { user: User, onSaveScore: (p: number, a: number, l: boolean, isGauntlet: boolean) => void }) => {
  const [modules, setModules] = useState<CodingModule[]>(db.getCodingModules());
  const [selectedModule, setSelectedModule] = useState<CodingModule | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [gameState, setGameState] = useState<'selecting' | 'playing' | 'feedback' | 'finished'>('selecting');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean, explanation: string } | null>(null);
  const [usedHint, setUsedHint] = useState(false);

  // Admin Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    moduleId: '',
    prompt: '',
    level: 'Beginner' as CodingProblem['level'],
    points: 10,
    timeLimit: 60,
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    hint: ''
  });

  useEffect(() => {
    setModules(db.getCodingModules());
  }, [showAdminModal]);

  const startModule = (mod: CodingModule) => {
    if (mod.problems.length === 0) {
      alert("This module has no logic units provisioned.");
      return;
    }
    setSelectedModule(mod);
    setCurrentProblemIndex(0);
    setScore(0);
    setGameState('playing');
    setTimeLeft(mod.problems[0].time_limit_seconds);
    setUsedHint(false);
  };

  useEffect(() => {
    let timer: number;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      handleAnswer(''); // Timeout
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleAnswer = (answer: string) => {
    if (!selectedModule) return;
    const problem = selectedModule.problems[currentProblemIndex];
    const isCorrect = answer === problem.correct_answer;

    let pointsGained = 0;
    if (isCorrect) {
      pointsGained = problem.points;
      if (usedHint) pointsGained = Math.round(pointsGained * 0.6);
      setScore(s => s + pointsGained);
    }

    setLastFeedback({ correct: isCorrect, explanation: problem.explanation });
    setGameState('feedback');
  };

  const nextProblem = () => {
    if (!selectedModule) return;
    if (currentProblemIndex < selectedModule.problems.length - 1) {
      const nextIdx = currentProblemIndex + 1;
      setCurrentProblemIndex(nextIdx);
      setTimeLeft(selectedModule.problems[nextIdx].time_limit_seconds);
      setUsedHint(false);
      setGameState('playing');
    } else {
      setGameState('finished');
      onSaveScore(score, 100, true, true);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.moduleId || !adminFormData.prompt || adminFormData.options.some(o => !o.trim()) || !adminFormData.explanation) {
      alert("Missing required logic parameters.");
      return;
    }

    const newProblem: CodingProblem = {
      id: 'custom_' + Date.now(),
      level: adminFormData.level,
      difficulty: adminFormData.level === 'Beginner' ? 1 : adminFormData.level === 'Intermediate' ? 2 : adminFormData.level === 'Advanced' ? 3 : 4,
      points: adminFormData.points,
      time_limit_seconds: adminFormData.timeLimit,
      prompt: adminFormData.prompt,
      options: adminFormData.options,
      correct_answer: adminFormData.options[adminFormData.correctIndex],
      explanation: adminFormData.explanation,
      hint: adminFormData.hint
    };

    db.addCodingProblem(adminFormData.moduleId, newProblem);
    setShowAdminModal(false);
    resetAdminForm();
  };

  const resetAdminForm = () => {
    setAdminFormData({
      moduleId: '',
      prompt: '',
      level: 'Beginner',
      points: 10,
      timeLimit: 60,
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      hint: ''
    });
  };

  const CodeVibes = () => (
    <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden select-none">
      <div className="absolute top-10 left-10 text-[8px] font-mono text-green-500 whitespace-pre">
        {`01010101\n10101010\n11001100\nTITAN_OS_v2.3\nBOOTING...`}
      </div>
      <div className="absolute bottom-20 right-10 text-[8px] font-mono text-green-500 whitespace-pre text-right">
        {`[KERNEL_STRICT]\nIDENT_SUCCESS\nENCRYPT_OFF\nAUTH_OK`}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,255,0,0.05)_1px,transparent_1px)] [background-size:40px_40px]"></div>
    </div>
  );

  if (gameState === 'selecting') {
    const isAdmin = [UserRoles.ADMIN, UserRoles.SUPER_ADMIN].includes(user.role as UserRoles);
    return (
      <div className="animate-fade-in relative z-10 p-6 md:p-12">
        <CodeVibes />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 md:mb-16">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">Logic Domains</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="bg-green-500 text-gray-950 px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:bg-green-400 active:scale-95 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-plus-circle text-sm"></i>
              Provision Logic Unit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-6xl mx-auto">
          {modules.map(mod => (
            <button
              key={mod.id}
              onClick={() => startModule(mod)}
              className="p-8 md:p-12 bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] hover:border-green-500/30 hover:bg-gray-900/60 transition-all text-left group relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-code text-green-500/20 text-5xl"></i>
              </div>
              <h4 className="text-xl md:text-3xl font-black uppercase mb-3 md:mb-4 text-white group-hover:text-green-400 transition-colors">{mod.name}</h4>
              <p className="text-gray-400 text-sm md:text-base mb-8 md:mb-12 leading-relaxed font-medium">{mod.description}</p>
              <div className="flex items-center justify-between pt-6 md:pt-8 border-t border-white/5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{mod.problems.length} Logic Units Detected</span>
                <div className="w-10 md:w-12 h-10 md:h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-green-500 group-hover:border-green-500 transition-all">
                  <i className="fa-solid fa-chevron-right text-white text-xs group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Admin Question Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-white/10 rounded-[3rem] w-full max-w-2xl p-8 md:p-16 my-10 relative animate-fade-in shadow-3xl">
              <button onClick={() => setShowAdminModal(false)} aria-label="Close provision modal" className="absolute top-10 right-10 text-gray-500 hover:text-white transition-all"><i className="fa-solid fa-xmark text-3xl"></i></button>
              <h3 className="text-3xl font-black uppercase text-white mb-10 tracking-tighter">Logic Unit Provisioning</h3>

              <form onSubmit={handleAdminSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="targetModule" className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-2">Target Module</label>
                    <select id="targetModule" value={adminFormData.moduleId} onChange={e => setAdminFormData({ ...adminFormData, moduleId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:ring-1 focus:ring-green-500 transition-all appearance-none">
                      <option value="" className="bg-gray-900">Select Domain</option>
                      {modules.map(m => <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="rankLevel" className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-2">Rank Level</label>
                    <select id="rankLevel" value={adminFormData.level} onChange={e => setAdminFormData({ ...adminFormData, level: e.target.value as any })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:ring-1 focus:ring-green-500 transition-all appearance-none">
                      <option value="Beginner" className="bg-gray-900">Beginner</option>
                      <option value="Intermediate" className="bg-gray-900">Intermediate</option>
                      <option value="Advanced" className="bg-gray-900">Advanced</option>
                      <option value="Expert" className="bg-gray-900">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="promptInst" className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-2">Prompt Instructions</label>
                  <textarea id="promptInst" value={adminFormData.prompt} onChange={e => setAdminFormData({ ...adminFormData, prompt: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-white font-medium outline-none focus:ring-1 focus:ring-green-500 h-32 resize-none" placeholder="Enter logic challenge prompt..." />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-2">Response Vectors (Options)</p>
                  <div className="space-y-3">
                    {adminFormData.options.map((opt, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <button type="button" aria-label={`Select option ${i + 1} as correct`} onClick={() => setAdminFormData({ ...adminFormData, correctIndex: i })} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${adminFormData.correctIndex === i ? 'bg-green-500 text-gray-950' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                          <i className={`fa-solid ${adminFormData.correctIndex === i ? 'fa-check' : 'fa-circle'} text-xs`}></i>
                        </button>
                        <input type="text" aria-label={`Option ${i + 1} text`} value={opt} onChange={e => { const newOpts = [...adminFormData.options]; newOpts[i] = e.target.value; setAdminFormData({ ...adminFormData, options: newOpts }); }} className="flex-grow bg-white/5 border border-white/10 rounded-xl p-4 text-white font-medium outline-none focus:ring-1 focus:ring-green-500" placeholder={`Vector 0${i + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="logicExpl" className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-2">Logic Explanation</label>
                  <textarea id="logicExpl" value={adminFormData.explanation} onChange={e => setAdminFormData({ ...adminFormData, explanation: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-white font-medium outline-none focus:ring-1 focus:ring-green-500 h-24 resize-none" placeholder="Provide technical breakdown of the correct answer..." />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => { setShowAdminModal(false); resetAdminForm(); }}
                    className="flex-grow bg-white/5 text-gray-400 border border-white/10 font-black py-6 rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95"
                  >
                    Abort Provisioning
                  </button>
                  <button
                    type="submit"
                    className="flex-grow bg-white text-gray-950 font-black py-6 rounded-2xl uppercase tracking-widest text-xs shadow-2xl hover:bg-green-500 transition-all active:scale-95"
                  >
                    Verify & Provision
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="text-center py-24 md:py-32 animate-fade-in relative z-10 px-6">
        <CodeVibes />
        <div className="w-24 md:w-32 h-24 md:h-32 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center text-4xl md:text-6xl mx-auto mb-10 md:mb-12 shadow-[0_0_60px_rgba(34,197,94,0.3)] border border-green-500/20">
          <i className="fa-solid fa-terminal"></i>
        </div>
        <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-white">Module Synchronized</h3>
        <p className="text-gray-500 mb-12 md:mb-16 font-mono text-sm md:text-lg">Protocol complete. Data record updated.</p>
        <div className="text-7xl md:text-9xl font-black text-green-500 mb-12 md:mb-20 tabular-nums drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]">+{score}</div>
        <button onClick={() => setGameState('selecting')} className="bg-white text-gray-950 px-12 md:px-20 py-6 md:py-8 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-3xl active:scale-95 transition-all hover:bg-green-400">Return to Grid</button>
      </div>
    );
  }

  const currentProb = selectedModule!.problems[currentProblemIndex];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in relative z-10 p-6 md:p-12">
      <CodeVibes />

      {/* Game X Button */}
      <button
        onClick={() => setGameState('selecting')}
        aria-label="Abort current game"
        className="absolute top-6 right-6 md:top-12 md:right-12 w-14 h-14 md:w-20 md:h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-blue-400 border border-white/10 transition-all group z-[100] shadow-2xl"
      >
        <i className="fa-solid fa-xmark text-2xl md:text-4xl group-hover:scale-110 transition-transform"></i>
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-12 md:mb-20 px-4 gap-8">
        <div className="flex items-center gap-6 md:gap-10 self-start">
          <div className="w-14 md:w-20 h-14 md:h-20 bg-green-500 text-gray-950 rounded-2xl md:rounded-[2rem] flex items-center justify-center font-black text-xl md:text-3xl shadow-[0_0_40px_rgba(34,197,94,0.5)]">{currentProblemIndex + 1}</div>
          <div>
            <h4 className="font-black text-white uppercase tracking-tighter text-lg md:text-3xl leading-none mb-2">{selectedModule?.name}</h4>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] md:text-xs text-green-500/80 font-black uppercase tracking-widest">RANK: {currentProb.level}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-10 md:gap-16 self-end sm:self-center pr-12 md:pr-24">
          <div className="text-right">
            <p className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3">TTL_REMAIN</p>
            <p className={`font-mono font-black text-2xl md:text-4xl tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</p>
          </div>
          <div className="text-right border-l border-white/10 pl-10 md:pl-16">
            <p className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3">SYNC_SCORE</p>
            <p className="font-mono font-black text-2xl md:text-4xl tabular-nums text-green-500">{score}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-md rounded-[3rem] md:rounded-[4rem] p-8 md:p-24 border border-white/10 shadow-3xl mb-12 md:mb-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-green-500/40 to-transparent"></div>
        <p className="text-xl md:text-4xl font-bold text-gray-100 leading-tight md:leading-snug mb-10 md:mb-16 font-mono">
          <span className="text-green-500 mr-4 md:mr-6">{">>>"}</span>
          {currentProb.prompt}
        </p>

        {(currentProb.code_snippet || currentProb.buggy_code) && (
          <div className="bg-[#080808] rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 mb-10 md:mb-16 overflow-x-auto border border-white/5 shadow-inner font-mono text-sm md:text-lg leading-relaxed text-blue-300 relative">
            <div className="absolute top-4 right-8 text-[10px] md:text-xs font-black text-white/20 uppercase tracking-widest pointer-events-none">SRC_MANIFEST</div>
            <pre className="whitespace-pre"><code>{currentProb.code_snippet || currentProb.buggy_code}</code></pre>
          </div>
        )}

        {gameState === 'playing' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {currentProb.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className="p-6 md:p-10 bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] text-left font-mono font-bold text-sm md:text-lg text-gray-300 hover:border-green-500/60 hover:bg-green-500/10 hover:text-white transition-all active:scale-95 shadow-xl group"
              >
                <span className="text-green-500/30 group-hover:text-green-500 mr-4 md:mr-6 text-xs md:text-sm">0{i + 1}</span>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className={`p-10 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] border-2 animate-slide-up backdrop-blur-2xl ${lastFeedback?.correct ? 'bg-green-500/10 border-green-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
            <div className="flex items-center gap-6 md:gap-10 mb-8 md:mb-12">
              <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl ${lastFeedback?.correct ? 'bg-green-500 text-gray-950' : 'bg-red-500 text-white'}`}>
                <i className={`fa-solid ${lastFeedback?.correct ? 'fa-check' : 'fa-xmark'} text-xl md:text-3xl`}></i>
              </div>
              <h5 className={`text-xl md:text-4xl font-black uppercase tracking-[0.2em] ${lastFeedback?.correct ? 'text-green-400' : 'text-red-400'}`}>
                {lastFeedback?.correct ? 'INTEGRITY_OK' : 'FAULT_DETECTED'}
              </h5>
            </div>
            <div className="space-y-4 mb-10 md:mb-16">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Analysis</p>
              <p className="text-gray-200 font-medium leading-relaxed text-base md:text-2xl border-l-4 border-white/10 pl-6 md:pl-10">{lastFeedback?.explanation}</p>
            </div>
            <button onClick={nextProblem} className="w-full md:w-auto bg-white text-gray-950 px-12 md:px-16 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-3xl hover:bg-green-400 transition-all">Engage Next Unit</button>
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <div className="flex justify-center">
          <button
            onClick={() => { setUsedHint(true); alert(`HINT_DECRYPTED: ${currentProb.hint}`); }}
            disabled={usedHint}
            className={`flex items-center gap-4 md:gap-6 font-black uppercase text-[10px] md:text-xs tracking-[0.3em] transition-all px-10 md:px-12 py-5 md:py-6 rounded-full border border-white/5 ${usedHint ? 'text-gray-700 opacity-50' : 'text-green-500/50 hover:text-green-400 hover:border-green-500/20'}`}
          >
            <i className="fa-solid fa-microchip"></i>
            Request Debug Insight
          </button>
        </div>
      )}
    </div>
  );
};

const MemoryMatrix = ({ onSaveScore }: { onSaveScore: (p: number, a: number, l: boolean, g: boolean) => void }) => {
  const [level, setLevel] = useState(1);
  const gridSize = 5;
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'showing' | 'guessing' | 'success' | 'result' | 'idle'>('idle');

  const startLevel = useCallback(() => {
    const cellCount = gridSize * gridSize;
    const highlightCount = Math.min(15, 3 + level);
    const newHighlighted: number[] = [];
    while (newHighlighted.length < highlightCount) {
      const rand = Math.floor(Math.random() * cellCount);
      if (!newHighlighted.includes(rand)) newHighlighted.push(rand);
    }
    setHighlighted(newHighlighted);
    setSelected([]);
    setGameState('showing');
    const viewTime = Math.max(600, 2500 - (level * 100));
    setTimeout(() => setGameState('guessing'), viewTime);
  }, [level]);

  const handleCellClick = (idx: number) => {
    if (gameState !== 'guessing' || selected.includes(idx)) return;
    const isCorrect = highlighted.includes(idx);
    const newSelected = [...selected, idx];
    setSelected(newSelected);
    if (!isCorrect) {
      onSaveScore(Math.max(0, (level - 1) * 20), 0, false, false);
      setGameState('result');
    } else if (newSelected.length === highlighted.length) {
      onSaveScore(level * 50, 100, true, false);
      setGameState('success');
      setTimeout(() => {
        setLevel(prev => prev + 1);
        setGameState('idle');
      }, 1000);
    }
  };

  return (
    <div className="p-4 md:p-8 text-center animate-fade-in relative">
      <h3 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tighter">Memory Matrix</h3>
      <div className="flex justify-center items-center gap-4 mb-6 md:mb-8">
        <span className="bg-maroon-800 text-white px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">Level {level}</span>
      </div>
      <div className="max-w-[320px] md:max-w-md mx-auto aspect-square grid gap-1.5 md:gap-2 mb-8 md:mb-10 p-3 md:p-4 border-2 border-maroon-100 rounded-[2rem] md:rounded-[2.5rem] bg-white shadow-inner grid-cols-5">
        {Array.from({ length: gridSize * gridSize }).map((_, i) => (
          <button key={i} aria-label={`Grid cell ${i + 1}`} onClick={() => handleCellClick(i)} className={`rounded-lg md:rounded-xl aspect-square transition-all duration-300 border ${gameState === 'showing' && highlighted.includes(i) ? 'bg-maroon-800 scale-95 shadow-lg' : gameState === 'guessing' && selected.includes(i) && highlighted.includes(i) ? 'bg-green-50 scale-90' : gameState === 'success' && highlighted.includes(i) ? 'bg-green-600' : gameState === 'result' && highlighted.includes(i) ? 'bg-maroon-800' : gameState === 'result' && selected.includes(i) && !highlighted.includes(i) ? 'bg-red-500' : 'bg-gray-50 hover:bg-gray-100 border-gray-100'}`} />
        ))}
      </div>
      {gameState === 'idle' && <button onClick={startLevel} className="bg-maroon-800 text-white px-10 md:px-12 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl text-[10px] md:text-xs">Initiate Level {level}</button>}
      {gameState === 'showing' && <p className="text-maroon-800 font-black text-sm md:text-lg uppercase tracking-widest animate-pulse">Memorize...</p>}
      {gameState === 'guessing' && <p className="text-gray-900 font-black text-sm md:text-lg uppercase tracking-widest">Strike {highlighted.length} Active Vectors</p>}
      {gameState === 'success' && <p className="text-green-600 font-black text-lg md:text-2xl uppercase tracking-widest">Success</p>}
      {gameState === 'result' && <div><p className="text-red-600 font-black text-lg mb-4 uppercase tracking-widest">Failure</p><button onClick={() => { setLevel(1); setGameState('idle'); }} className="bg-gray-900 text-white px-10 md:px-12 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs">Re-Init</button></div>}
    </div>
  );
};

const SpeedMath = ({ onSaveScore }: { onSaveScore: (p: number, a: number, l: boolean, g: boolean) => void }) => {
  const [level, setLevel] = useState(1);
  const [problem, setProblem] = useState({ q: '', a: 0 });
  const [timeLeft, setTimeLeft] = useState(10);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateProblem = useCallback(() => {
    const difficulty = Math.min(level, 10);
    const a = Math.floor(Math.random() * (10 * difficulty)) + 1;
    const b = Math.floor(Math.random() * (5 * difficulty)) + 1;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * (difficulty > 5 ? 3 : 2))];
    let ans = 0;
    if (op === '+') ans = a + b;
    else if (op === '-') ans = a - b;
    else ans = a * b;
    setProblem({ q: `${a} ${op} ${b} = ?`, a: ans });
    setTimeLeft(Math.max(3, 10 - Math.floor(level / 2)));
  }, [level]);

  useEffect(() => {
    let timer: number;
    if (isPlaying && timeLeft > 0) timer = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    else if (timeLeft === 0 && isPlaying) endGame();
    return () => clearInterval(timer);
  }, [timeLeft, isPlaying]);

  const endGame = () => { setIsPlaying(false); onSaveScore(score, 100, score > 100, false); };

  const handleInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(input) === problem.a) {
      setScore(score + level * 10);
      setLevel(level + 1);
      setInput('');
      generateProblem();
    } else endGame();
  };

  return (
    <div className="p-4 md:p-8 text-center animate-fade-in max-w-xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tighter">Speed Math</h3>
      <p className="text-gray-500 mb-8 md:mb-12 text-[10px] md:text-sm uppercase tracking-widest font-bold">Protocol {level} | Points: {score}</p>
      {isPlaying ? (
        <div className="space-y-6 md:space-y-8">
          <div className="text-4xl md:text-6xl font-black text-maroon-800 tracking-tighter">{problem.q}</div>
          <form onSubmit={handleInput} className="w-full">
            <input aria-label="Solution input" autoFocus type="number" value={input} onChange={e => setInput(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl md:rounded-[2rem] px-6 md:px-10 py-4 md:py-6 text-2xl md:text-3xl font-black text-center shadow-inner" placeholder="?" />
          </form>
          <div className={`text-[10px] md:text-sm font-black uppercase tracking-widest ${timeLeft < 3 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>Time: {timeLeft}s</div>
        </div>
      ) : (
        <button onClick={() => { setIsPlaying(true); setScore(0); setLevel(1); setInput(''); generateProblem(); }} className="bg-maroon-800 text-white px-10 md:px-12 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl text-[10px] md:text-xs">Begin</button>
      )}
    </div>
  );
};

const FocusTap = ({ onSaveScore }: { onSaveScore: (p: number, a: number, l: boolean, g: boolean) => void }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [chances, setChances] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [targets, setTargets] = useState<{ id: number, x: number, y: number, isTarget: boolean, createdAt: number }[]>([]);

  const stopGame = useCallback(() => { setIsPlaying(false); onSaveScore(score, 100, score > 50, false); setTargets([]); }, [score, onSaveScore]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0 && chances > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      const spawnRate = Math.max(250, 750 - ((30 - timeLeft) * 12) - (score / 4));
      const spawn = setInterval(() => {
        const id = Date.now();
        const diff = (30 - timeLeft) / 30;
        const isTarget = Math.random() > (0.2 + (diff * 0.2));
        setTargets(prev => [...prev, { id, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, isTarget, createdAt: Date.now() }]);
      }, spawnRate);
      const monitor = setInterval(() => {
        const now = Date.now();
        setTargets(prev => {
          const valid: typeof prev = [];
          let lost = false;
          prev.forEach(t => { if (now - t.createdAt > 2000) { if (t.isTarget) lost = true; } else valid.push(t); });
          if (lost) setChances(c => Math.max(0, c - 1));
          return valid;
        });
      }, 100);
      return () => { clearInterval(timer); clearInterval(spawn); clearInterval(monitor); };
    } else if ((timeLeft === 0 || chances === 0) && isPlaying) stopGame();
  }, [isPlaying, timeLeft, score, chances, stopGame]);

  return (
    <div className="p-4 md:p-8 text-center animate-fade-in relative h-[500px] md:h-[600px] bg-white rounded-3xl md:rounded-[3rem] overflow-hidden border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8 relative z-10 gap-4">
        <div className="text-left self-start sm:self-center"><h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Focus Tap</h3><p className="text-[8px] md:text-[10px] font-black text-maroon-800 uppercase tracking-widest">Strike Titan 'T' (2s)</p></div>
        <div className="flex gap-4 md:gap-8 self-end sm:self-center">
          <div className="text-center"><p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase">Integrity</p><div className="flex gap-1 mt-1">{Array.from({ length: 3 }).map((_, i) => <div key={i} className={`w-2 md:w-3 h-2 md:h-3 rounded-full ${i < chances ? 'bg-red-500' : 'bg-gray-100'}`}></div>)}</div></div>
          <div className="text-center"><p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase">Points</p><p className="font-black text-sm md:text-xl tabular-nums">{score}</p></div>
          <div className="text-center"><p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase">Time</p><p className="font-black text-sm md:text-xl tabular-nums">{timeLeft}s</p></div>
        </div>
      </div>
      {!isPlaying ? <div className="h-full flex flex-col items-center justify-center -mt-10 sm:mt-0"><button onClick={() => { setIsPlaying(true); setScore(0); setTimeLeft(30); setChances(3); }} className="bg-maroon-800 text-white px-10 md:px-12 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl text-[10px] md:text-xs">Initiate Protocol</button></div> :
        <div className="relative w-full h-[350px] md:h-[400px]">
          {targets.map(t => (
            <button key={t.id} aria-label={t.isTarget ? 'Hit target' : 'Hit distractor'} onClick={() => { if (t.isTarget) setScore(s => s + 10); else setChances(c => Math.max(0, c - 1)); setTargets(prev => prev.filter(x => x.id !== t.id)); }} className={`absolute w-10 md:w-14 h-10 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black shadow-lg border-2 ${t.isTarget ? 'bg-maroon-800 border-maroon-950 scale-110' : 'bg-gray-100 text-gray-400 border-gray-200'} text-xs md:text-base`} style={{ left: `${t.x}%`, top: `${t.y}%` }}>{t.isTarget ? 'T' : 'O'}</button>
          ))}
        </div>}
    </div>
  );
};

const PatternLogic = ({ onSaveScore }: { onSaveScore: (p: number, a: number, l: boolean, g: boolean) => void }) => {
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState<{ seq: (number | string)[], options: (number | string)[], ans: number | string }>({ seq: [], options: [], ans: '' });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'result'>('idle');

  const generatePattern = useCallback(() => {
    const type = Math.floor(Math.random() * 3);
    let seq: (number | string)[] = [], ans: number | string = '', options: (number | string)[] = [];
    if (type === 0) { const start = Math.floor(Math.random() * 10), step = Math.floor(Math.random() * 5) + 1; seq = [start, start + step, start + 2 * step, start + 3 * step, '?']; ans = start + 4 * step; }
    else if (type === 1) { const start = Math.floor(Math.random() * 3) + 1, ratio = 2; seq = [start, start * ratio, start * ratio * ratio, start * ratio * ratio * ratio, '?']; ans = start * Math.pow(ratio, 4); }
    else { const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), start = Math.floor(Math.random() * 10); seq = [chars[start], chars[start + 2], chars[start + 4], chars[start + 6], '?']; ans = chars[start + 8]; }
    options = [ans, typeof ans === 'number' ? (ans as number) + 2 : 'Z', typeof ans === 'number' ? (ans as number) - 1 : 'M'].sort(() => Math.random() - 0.5);
    setQuestion({ seq, options, ans });
    setGameState('playing');
  }, []);

  return (
    <div className="p-4 md:p-8 text-center animate-fade-in max-w-xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tighter">Pattern Solver</h3>
      <p className="text-gray-500 mb-8 md:mb-12 text-[10px] md:text-sm uppercase tracking-widest font-bold">Analysis level {level}</p>
      {gameState === 'playing' ? <div className="space-y-8 md:space-y-12"><div className="flex justify-center gap-2 md:gap-4">{question.seq.map((s, i) => <div key={i} className={`w-12 md:w-16 h-12 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl font-black ${s === '?' ? 'bg-maroon-50 text-maroon-800 border-2 border-dashed' : 'bg-white border border-gray-100'}`}>{s}</div>)}</div><div className="grid grid-cols-3 gap-2 md:gap-4">{question.options.map((opt, i) => <button key={i} aria-label={`Choose answer ${opt}`} onClick={() => { if (opt === question.ans) { onSaveScore(level * 30, 100, true, false); setLevel(level + 1); generatePattern(); } else setGameState('result'); }} className="bg-white border py-4 md:py-6 rounded-xl md:rounded-2xl font-black text-sm md:text-xl shadow-sm hover:border-maroon-800 transition-all">{opt}</button>)}</div></div> :
        <button onClick={generatePattern} className="bg-maroon-800 text-white px-10 md:px-12 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl text-[10px] md:text-xs">Engage Solver</button>}
    </div>
  );
};

const ReactionTime = ({ onSaveScore }: { onSaveScore: (p: number, a: number, l: boolean, g: boolean) => void }) => {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'result'>('idle');
  const [startTime, setStartTime] = useState(0);
  const [reaction, setReaction] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  const startTest = () => {
    setGameState('waiting');
    setTargetIndex(null);
    setTimeout(() => { setTargetIndex(Math.floor(Math.random() * 4)); setGameState('ready'); }, 1500 + Math.random() * 2500);
  };

  useEffect(() => { if (gameState === 'ready') setStartTime(Date.now()); }, [gameState]);

  return (
    <div className="p-4 md:p-8 text-center animate-fade-in h-[450px] md:h-[500px] flex flex-col items-center justify-center">
      {gameState === 'idle' && <div className="space-y-8"><h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Reaction Reflex</h3><button onClick={startTest} className="bg-maroon-800 text-white px-10 md:px-12 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl text-[10px] md:text-xs">Initialize Grid</button></div>}
      {(gameState === 'waiting' || gameState === 'ready') && <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-[320px] md:max-w-md aspect-square p-3 md:p-4 bg-gray-50 rounded-[2.5rem] md:rounded-[3rem] border-4 border-dashed border-gray-200">{Array.from({ length: 4 }).map((_, i) => <button key={i} aria-label={`Reaction target ${i + 1}`} onClick={() => { if (gameState === 'ready' && i === targetIndex) { const diff = Date.now() - startTime; setReaction(diff); setGameState('result'); onSaveScore(Math.max(0, 500 - Math.floor(diff / 2)), 100, diff < 350, false); } else if (gameState === 'waiting') { alert("False Start!"); setGameState('idle'); } else { setReaction(0); setGameState('result'); onSaveScore(0, 0, false, false); } }} className={`rounded-[1.5rem] border shadow-sm ${gameState === 'ready' && targetIndex === i ? 'bg-maroon-800 border-maroon-950 scale-[0.98]' : 'bg-white border-gray-100'}`}>{gameState === 'ready' && targetIndex === i && <span className="text-white font-black text-[10px] md:text-xs uppercase tracking-widest">STRIKE</span>}</button>)}</div>}
      {gameState === 'result' && <div className="space-y-8"><h4 className="text-gray-400 font-black uppercase tracking-widest text-xs md:text-sm">Latency</h4><div className="text-5xl md:text-8xl font-black text-maroon-800">{reaction > 0 ? `${reaction}ms` : 'FAILED'}</div><button onClick={startTest} className="bg-gray-900 text-white px-10 md:px-12 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs">Retest</button></div>}
    </div>
  );
};

// --- MAIN GAMES VIEW ---

const GamesView: React.FC<GamesViewProps> = ({ user, onSync }) => {
  const [activeGame, setActiveGame] = useState<GameType>('hub');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const fetchLeaderboard = useCallback(async () => {
    const data = await db.getLeaderboard();
    setLeaderboard(data || []);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeGame, fetchLeaderboard]);

  const saveScore = useCallback(async (points: number, accuracy: number, levelCleared: boolean, isGauntlet: boolean = false) => {
    if (user) {
      await db.updateUserGameStats(user.id, points, accuracy, levelCleared, isGauntlet);
      onSync();
      fetchLeaderboard();
    }
  }, [user, onSync, fetchLeaderboard]);

  const getTier = (points: number) => {
    if (points >= 7001) return { name: 'Platinum', color: 'text-blue-400', bg: 'bg-blue-900/20' };
    if (points >= 3001) return { name: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    if (points >= 1001) return { name: 'Silver', color: 'text-gray-400', bg: 'bg-gray-900/20' };
    return { name: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-900/20' };
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-xl max-w-md text-center border border-gray-100">
        <div className="w-14 md:w-16 h-14 md:h-16 bg-maroon-50 rounded-2xl flex items-center justify-center text-maroon-800 text-2xl md:text-3xl mx-auto mb-6"><i className="fa-solid fa-gamepad"></i></div>
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Gaming HQ Locked</h2>
        <a href="#/login" className="block w-full bg-maroon-800 text-white font-black py-3 rounded-xl hover:bg-maroon-900 transition-all uppercase tracking-widest text-[10px]">Login</a>
      </div>
    </div>
  );

  const userTier = getTier(user.gameStats?.totalPoints || 0);

  return (
    <div className="py-12 md:py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 mb-12 md:mb-20 border-l-[8px] md:border-l-8 border-maroon-800 pl-6 md:pl-8">
          <div><h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase mb-2 md:mb-4">Gaming HQ</h2><p className="text-gray-500 text-sm md:text-xl font-medium max-w-xl">Enhance core cognitive metrics through competitive training simulation.</p></div>
          <div className="flex items-center gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="w-12 md:w-16 h-12 md:h-16 bg-maroon-50 rounded-xl md:rounded-2xl flex items-center justify-center text-maroon-800 text-xl md:text-2xl shadow-inner border border-maroon-100"><i className="fa-solid fa-ranking-star"></i></div>
            <div><div className="flex items-center gap-2 md:gap-3 mb-0.5 md:mb-1"><span className="font-black text-lg md:text-2xl tabular-nums">{user.gameStats?.totalPoints || 0}</span><span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest ${userTier.color} ${userTier.bg}`}>Tier: {userTier.name}</span></div><p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Status</p></div>
          </div>
        </div>

        <div className="flex gap-2 md:gap-4 mb-8 md:mb-16 overflow-x-auto scroll-hide pb-2">
          <button onClick={() => setActiveGame('hub')} className={`px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all border-2 flex-shrink-0 ${activeGame === 'hub' ? 'bg-maroon-800 border-maroon-800 text-white shadow-xl' : 'bg-white text-gray-400 border-gray-100'}`}>Operational Hub</button>
          <button onClick={() => setActiveGame('leaderboard')} className={`px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all border-2 flex-shrink-0 ${activeGame === 'leaderboard' ? 'bg-maroon-800 border-maroon-800 text-white shadow-xl' : 'bg-white text-gray-400 border-gray-100'}`}>Leaderboard</button>
        </div>

        <div className={`rounded-[2rem] md:rounded-[4rem] shadow-xl border p-4 min-h-[500px] md:min-h-[600px] transition-all duration-700 relative overflow-hidden ${activeGame === 'gauntlet' ? 'bg-[#0f0f0f] border-gray-800' : 'bg-white border-gray-100'}`}>

          {/* Game Cross Button - Integrated at GamesView level for simple exit */}
          {activeGame !== 'hub' && activeGame !== 'leaderboard' && activeGame !== 'gauntlet' && (
            <button
              onClick={() => setActiveGame('hub')}
              aria-label="Back to hub"
              className="absolute top-6 right-6 w-12 h-12 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-maroon-800 shadow-xl z-50 border border-gray-100 transition-all active:scale-90"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          )}

          {activeGame === 'hub' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 md:p-12">
              {[
                { type: 'gauntlet', name: 'Coding Gauntlet', icon: 'fa-code-branch', desc: 'Syntactic, logical, and algorithmic challenges for the modern engineer.', color: 'bg-maroon-800' },
                { type: 'memory', name: 'Memory Matrix', icon: 'fa-table-cells', desc: 'Spatial recall and 5x5 grid memory expansion.', color: 'bg-blue-500' },
                { type: 'math', name: 'Speed Math', icon: 'fa-plus-minus', desc: 'Quantitative agility and mental arithmetic.', color: 'bg-green-500' },
                { type: 'pattern', name: 'Pattern Solver', icon: 'fa-diagram-project', desc: 'Inductive reasoning and logic sequences.', color: 'bg-purple-500' },
                { type: 'focus', name: 'Focus Tap', icon: 'fa-bullseye', desc: 'Selective attention and distractor filtering.', color: 'bg-orange-500' },
                { type: 'reaction', name: 'Reflex Test', icon: 'fa-bolt', desc: 'Neuromuscular response and latency test.', color: 'bg-red-500' }
              ].map(game => (
                <div key={game.type} className="group p-6 md:p-10 bg-gray-50 rounded-2xl md:rounded-[3rem] border border-gray-100 hover:bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col" onClick={() => setActiveGame(game.type as GameType)}>
                  <div className={`w-12 md:w-16 h-12 md:h-16 ${game.color} text-white rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl mb-6 md:mb-10 shadow-lg group-hover:scale-110 transition-all`}><i className={`fa-solid ${game.icon}`}></i></div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-2 md:mb-4">{game.name}</h3>
                  <p className="text-gray-500 text-sm md:text-base font-medium leading-relaxed mb-10 md:mb-16 flex-grow">{game.desc}</p>
                  <div className="flex justify-between items-center text-[10px] md:text-xs font-black uppercase tracking-widest text-maroon-800"><span>Begin Protocol</span><i className="fa-solid fa-arrow-right-long group-hover:translate-x-3 transition-all"></i></div>
                </div>
              ))}
            </div>
          )}

          {activeGame === 'leaderboard' && (
            <div className="animate-fade-in md:p-16">
              <h3 className="text-3xl md:text-5xl font-black mb-10 md:mb-16 uppercase tracking-tighter text-gray-900">Global Ranking</h3>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full text-left min-w-[600px] md:min-w-0">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-6 px-4 md:px-0 text-[9px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                      <th className="py-6 text-[9px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                      <th className="py-6 text-[9px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Net Score</th>
                      <th className="py-6 text-[9px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Gauntlet</th>
                      <th className="py-6 text-[9px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {leaderboard.map((entry, idx) => (
                      <tr key={entry.id} className={`hover:bg-maroon-50/10 transition-all ${entry.id === user.id ? 'bg-maroon-50/30' : ''}`}>
                        <td className="py-6 px-4 md:px-0"><div className={`w-10 md:w-12 h-10 md:h-12 rounded-xl flex items-center justify-center font-black text-xs md:text-sm ${idx === 0 ? 'bg-yellow-500 text-white shadow-lg' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'text-gray-400'}`}>{idx + 1}</div></td>
                        <td className="py-6"><p className="font-black text-gray-900 uppercase text-sm md:text-base">{entry.name}</p><p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${getTier(entry.points).color}`}>{getTier(entry.points).name} Class</p></td>
                        <td className="py-6 text-center font-black text-base md:text-xl tabular-nums">{entry.points}</td>
                        <td className="py-6 text-center font-bold text-gray-500 tabular-nums text-sm md:text-lg">{entry.gauntlet || 0}</td>
                        <td className="py-6 text-center">
                          <div className="w-16 md:w-24 h-2 md:h-3 bg-gray-100 rounded-full mx-auto overflow-hidden">
                            <div className="h-full bg-maroon-800" style={{ width: `${entry.accuracy}%` }} />
                          </div>
                          <span className="text-[9px] md:text-[11px] font-bold text-gray-400 tabular-nums mt-1.5 block">{entry.accuracy}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeGame === 'gauntlet' && <CodingGauntlet user={user} onSaveScore={saveScore} />}
          {activeGame === 'memory' && <MemoryMatrix onSaveScore={saveScore} />}
          {activeGame === 'math' && <SpeedMath onSaveScore={saveScore} />}
          {activeGame === 'focus' && <FocusTap onSaveScore={saveScore} />}
          {activeGame === 'pattern' && <PatternLogic onSaveScore={saveScore} />}
          {activeGame === 'reaction' && <ReactionTime onSaveScore={saveScore} />}

          {activeGame !== 'hub' && activeGame !== 'leaderboard' && activeGame !== 'gauntlet' && (
            <div className="mt-12 md:mt-24 pt-8 md:pt-12 border-t border-gray-100 flex justify-center">
              <button onClick={() => setActiveGame('hub')} className="text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 text-gray-400 hover:text-maroon-800">
                <i className="fa-solid fa-arrow-left"></i> Abort Protocol
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamesView;
