
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, ChatMessage, UserRoles } from '../types';
import { formatMediaLink } from '../services/mediaUtils';
import { db } from '../services/db';

interface CommunityChatViewProps {
  user: User | null;
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
}

const CommunityChatView: React.FC<CommunityChatViewProps> = ({ user, messages, onSendMessage }) => {
  const [text, setText] = useState('');
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''] });
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const handleSend = () => {
    if (!text.trim() || !user) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.role === UserRoles.STUDENT ? 'Anonymous Titan' : user.name,
      senderRole: user.role,
      text: text,
      timestamp: new Date().toISOString(),
    };
    onSendMessage(msg);
    setText('');
  };

  const handleCreatePoll = () => {
    const validOptions = pollData.options.filter(opt => opt.trim() !== '');
    if (!pollData.question || validOptions.length < 2 || !user) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.role === UserRoles.STUDENT ? 'Anonymous Titan' : user.name,
      senderRole: user.role,
      text: `📊 POLL: ${pollData.question}`,
      timestamp: new Date().toISOString(),
      poll: {
        question: pollData.question,
        options: validOptions.map(opt => ({ text: opt, votes: 0 }))
      }
    };
    onSendMessage(msg);
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

  if (!user) return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-xl max-w-md text-center border border-gray-100">
        <div className="w-16 h-16 bg-maroon-50 rounded-2xl flex items-center justify-center text-maroon-800 text-3xl mx-auto mb-6"><i className="fa-solid fa-comments"></i></div>
        <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Access Restricted</h2>
        <p className="text-gray-500 mb-8 text-sm font-medium">Please login to join the Titan global forum.</p>
        <Link to="/login" className="block w-full bg-maroon-800 text-white font-black py-3 rounded-xl hover:bg-maroon-900 transition-all uppercase tracking-widest text-[10px]">Login</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-full mx-auto px-4 py-4 flex flex-col h-[calc(100vh-80px)]">
      {/* Poll Creation Modal */}
      {isPollOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 uppercase">Create a Poll</h3>
              <button onClick={() => setIsPollOpen(false)} className="text-gray-400 hover:text-maroon-800"><i className="fa-solid fa-xmark text-2xl"></i></button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Ask a question..."
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
                  className="text-maroon-800 text-[10px] font-black uppercase tracking-widest hover:underline"
                >
                  + Add Option
                </button>
              </div>
            </div>
            <button
              onClick={handleCreatePoll}
              className="w-full bg-maroon-800 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-maroon-900 transition-all uppercase tracking-widest text-xs"
            >
              Launch Poll
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-200 overflow-hidden flex flex-col flex-grow relative">
        <div className="flex-grow p-8 overflow-y-auto space-y-6">
          {messages.map((m) => {
            const isMe = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-3xl p-6 shadow-sm relative ${isMe ? 'bg-maroon-800 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'}`}>
                  <div className="flex items-center justify-between gap-10 mb-3">
                    {m.senderId ? (
                      <Link to={`/profile/${m.senderId}`} className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 hover:opacity-100 hover:text-maroon-300 transition-all">
                        {m.senderName}
                      </Link>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">{m.senderName}</span>
                    )}
                    <span className="text-[8px] font-bold opacity-40 uppercase">{formatTime(m.timestamp)}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{m.text}</p>

                  {/* Poll Content */}
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
                                ? 'border-maroon-300 bg-maroon-50'
                                : 'border-transparent hover:border-gray-200 bg-black/5'
                                }`}
                            >
                              <div className="relative z-10 flex justify-between items-center">
                                <span>{opt.text}</span>
                                {hasVoted && <span className="opacity-60">{percent}%</span>}
                              </div>
                              {hasVoted && (
                                <div
                                  className="absolute inset-y-0 left-0 bg-maroon-800/10 transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([^\/\?\s]+)/;
                    const dropboxRegex = /https:\/\/www\.dropbox\.com\/s\/([^\/\?\s]+)/;
                    const generalImgRegex = /https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg)/i;

                    const match = m.text.match(driveRegex) || m.text.match(dropboxRegex) || m.text.match(generalImgRegex);

                    if (match) {
                      const embedUrl = formatMediaLink(match[0]);
                      return (
                        <div className="mt-3 rounded-xl overflow-hidden border border-white/20 shadow-sm bg-black/5">
                          <img src={embedUrl} alt="Shared Asset" className="max-w-full h-auto block" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <div className="flex gap-4 items-end">
            <button
              onClick={() => setIsPollOpen(true)}
              className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-maroon-50 hover:text-maroon-800 transition-all border-2 border-transparent hover:border-maroon-800/10 flex-shrink-0"
            >
              <i className="fa-solid fa-square-poll-vertical text-2xl"></i>
            </button>
            <div className="flex-grow bg-gray-50 rounded-[2rem] px-8 py-2 flex items-center border-2 border-transparent focus-within:bg-white focus-within:border-maroon-800/20 transition-all">
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} className="w-full bg-transparent border-none focus:ring-0 text-base font-semibold placeholder-gray-400 outline-none text-gray-800 resize-none py-3" placeholder="Type a message..." />
            </div>
            <button onClick={handleSend} className="bg-maroon-800 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-maroon-900 transition-all shadow-md active:scale-90 flex-shrink-0"><i className="fa-solid fa-paper-plane text-xl"></i></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityChatView;
