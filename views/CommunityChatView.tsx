
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, ChatMessage, UserRoles } from '../types';

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

  const handleSend = () => {
    if (!text.trim() || !user) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.role === UserRoles.STUDENT ? 'Anonymous Titan' : user.name,
      senderRole: user.role,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      poll: {
        question: pollData.question,
        options: validOptions.map(opt => ({ text: opt, votes: Math.floor(Math.random() * 5) }))
      }
    };
    onSendMessage(msg);
    setPollData({ question: '', options: ['', ''] });
    setIsPollOpen(false);
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
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-200 overflow-hidden flex flex-col flex-grow relative">
        <div className="flex-grow p-8 overflow-y-auto space-y-6">
          {messages.map((m) => {
            const isMe = m.senderName === (user.role === UserRoles.STUDENT ? 'Anonymous Titan' : user.name);
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
                    <span className="text-[8px] font-bold opacity-40 uppercase">{m.timestamp}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <div className="flex gap-4 items-end">
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
