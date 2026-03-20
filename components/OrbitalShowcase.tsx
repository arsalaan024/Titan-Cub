import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence, useAnimationFrame, useTransform } from 'motion/react';
import { ShowcaseCard, User, UserRoles } from '../types';
import { db } from '../services/db';
import { formatMediaLink } from '../services/mediaUtils';

// ─── Default seeded cards ─────────────────────────────────────────────────────
const DEFAULT_CARDS: Omit<ShowcaseCard, 'id'>[] = [
  { title: 'Clubs', subtitle: 'Join & Collaborate', description: 'Explore diverse student clubs and find your passion. Connect with like-minded peers.', photoUrl: '', color: '#FF6B6B', order: 0 },
  { title: 'Activities', subtitle: 'Events & Workshops', description: 'Participate in events, cultural activities and hands-on workshops organized by students.', photoUrl: '', color: '#4ECDC4', order: 1 },
  { title: 'Career', subtitle: 'Placements & Internships', description: 'Discover career opportunities, internships and industry connections to launch your future.', photoUrl: '', color: '#45B7D1', order: 2 },
  { title: 'Achievements', subtitle: 'Celebrate Wins', description: 'Showcase your accomplishments and celebrate the success stories of Titan talents.', photoUrl: '', color: '#96CEB4', order: 3 },
  { title: 'Gallery', subtitle: 'Memories & Media', description: 'Browse through the vibrant photo gallery capturing unforgettable campus moments.', photoUrl: '', color: '#FFEAA7', order: 4 },
  { title: 'Community', subtitle: 'Stay Connected', description: 'Engage in live discussions, polls and community announcements across all clubs.', photoUrl: '', color: '#DDA0DD', order: 5 },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const getEventStatus = (card: ShowcaseCard): 'live' | 'upcoming' | 'ended' | 'always' => {
  if (!card.startDate && !card.endDate) return 'always';
  const now = new Date();
  const start = card.startDate ? new Date(card.startDate) : null;
  const end = card.endDate ? new Date(card.endDate + 'T23:59:59') : null;
  if (start && now < start) return 'upcoming';
  if (end && now > end) return 'ended';
  return 'live';
};

const formatDateRange = (start?: string, end?: string): string => {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  if (end) return `Until ${fmt(end)}`;
  return '';
};

const STATUS_STYLES: Record<string, { label: string; bg: string; dot: string }> = {
  live:     { label: '● LIVE',     bg: 'rgba(34,197,94,0.25)',  dot: '#22c55e' },
  upcoming: { label: '◷ UPCOMING', bg: 'rgba(250,204,21,0.2)',  dot: '#facc15' },
  ended:    { label: '✕ ENDED',    bg: 'rgba(239,68,68,0.2)',   dot: '#ef4444' },
  always:   { label: '',           bg: '',                       dot: '' },
};

// ─── Mobile Strip Card ────────────────────────────────────────────────────────
const MobileCard: React.FC<{
  card: ShowcaseCard;
  isActive: boolean;
  onClick: () => void;
}> = ({ card, isActive, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      initial={false}
      animate={{ scale: isActive ? 1.02 : 1, opacity: isActive ? 1 : 0.7 }}
      whileTap={{ scale: 0.97 }}
      className="relative rounded-2xl overflow-hidden cursor-pointer shrink-0"
      style={{
        width: '100%',
        height: 72,
        background: isActive
          ? `linear-gradient(135deg, ${hexToRgba(card.color, 0.3)}, ${hexToRgba(card.color, 0.1)})`
          : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isActive ? hexToRgba(card.color, 0.5) : 'rgba(255,255,255,0.1)'}`,
        boxShadow: isActive ? `0 8px 24px ${hexToRgba(card.color, 0.2)}` : 'none',
      }}
    >
      <div className="flex items-center h-full px-4 gap-3">
        {card.photoUrl ? (
          <img src={formatMediaLink(card.photoUrl)} alt={card.title}
            className="w-10 h-10 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: hexToRgba(card.color, 0.3), border: `1px solid ${hexToRgba(card.color, 0.5)}` }}>
            <i className="fa-solid fa-star text-sm" style={{ color: card.color }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{card.title}</p>
          {card.subtitle && <p className="text-white/50 text-[10px] truncate">{card.subtitle}</p>}
        </div>
        {isActive && (
          <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: card.color }} />
        )}
      </div>
    </motion.div>
  );
};

// ─── 3D Orbital Card ─────────────────────────────────────────────────────────
const OrbitalCard: React.FC<{
  card: ShowcaseCard;
  index: number;
  total: number;
  globalRotation: ReturnType<typeof useMotionValue<number>>;
  isFocused: boolean;
  onClick: () => void;
}> = ({ card, index, total, globalRotation, isFocused, onClick }) => {
  const radius = 320;
  const angleStep = (Math.PI * 2) / total;
  const myAngle = index * angleStep;

  const x = useTransform<number, number>(globalRotation, (rot: number) => Math.sin(myAngle + rot) * radius);
  const z = useTransform<number, number>(globalRotation, (rot: number) => Math.cos(myAngle + rot) * radius);
  const ry = useTransform<number, number>(globalRotation, (rot: number) => (myAngle + rot) * (180 / Math.PI));
  const opacity = useTransform(z, [-radius, radius], [0.12, 1]);
  const scale = useTransform(z, [-radius, radius], [0.72, 1]);

  // Content Overlay
  const status = getEventStatus(card);
  const statusStyle = STATUS_STYLES[status];

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ transformStyle: 'preserve-3d', x, z, rotateY: ry, opacity, scale }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
    >
      <div className="relative w-56 h-72 group">
        <div
          className="relative w-full h-full rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-500"
          style={{
            background: `linear-gradient(145deg, ${hexToRgba(card.color, 0.12)}, ${hexToRgba(card.color, 0.04)})`,
            border: `1px solid ${isFocused ? hexToRgba(card.color, 0.6) : hexToRgba(card.color, 0.2)}`,
            backdropFilter: 'blur(20px)',
            boxShadow: isFocused ? `0 0 40px ${hexToRgba(card.color, 0.25)}, inset 0 1px 0 rgba(255,255,255,0.1)` : `inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Background Image / Gradient */}
          <div className="absolute inset-0 z-0">
            {card.photoUrl ? (
              <img src={formatMediaLink(card.photoUrl)} alt={card.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full"
                style={{ background: `linear-gradient(135deg, ${hexToRgba(card.color, 0.5)}, ${hexToRgba(card.color, 0.2)})` }}>
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fa-solid fa-layer-group text-4xl opacity-20 text-white" />
                </div>
              </div>
            )}
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 flex-1 p-6 flex flex-col justify-end">
            {/* Status badge */}
            {statusStyle.label && (
              <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full text-[8px] font-black backdrop-blur-sm"
                style={{ background: statusStyle.bg, color: 'white', border: `1px solid rgba(255,255,255,0.1)` }}>
                {statusStyle.label}
              </div>
            )}
            <div className="mb-1">
              <div className="inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] mb-2 shadow-lg backdrop-blur-md"
                style={{ background: hexToRgba(card.color, 0.25), color: 'white', border: `1px solid ${hexToRgba(card.color, 0.4)}` }}>
                {card.subtitle || 'Explore'}
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white leading-tight drop-shadow-2xl">
                {card.title}
              </h3>
              {(card.startDate || card.endDate) && (
                <p className="text-[9px] text-white/50 font-medium mt-1">
                  <i className="fa-regular fa-calendar mr-1" />
                  {formatDateRange(card.startDate, card.endDate)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
              <div className="flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i === 0 ? 'w-4' : 'opacity-30'}`}
                    style={{ background: i === 0 ? card.color : 'white' }} />
                ))}
              </div>
              <span className="text-[10px] font-black opacity-40 text-white tracking-widest">
                #{String(index + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Focus ring */}
        {isFocused && (
          <motion.div
            className="absolute -inset-2 rounded-[2.8rem] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              border: `1px solid ${hexToRgba(card.color, 0.5)}`,
              boxShadow: `0 0 30px ${hexToRgba(card.color, 0.15)}`,
            }}
          />
        )}
      </div>
    </motion.div>
  );
};

// ─── Admin Edit Modal ─────────────────────────────────────────────────────────
const AdminModal: React.FC<{
  editing: ShowcaseCard | null;
  onSave: (card: Partial<ShowcaseCard>) => void;
  onClose: () => void;
}> = ({ editing, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<ShowcaseCard>>(editing || { title: '', subtitle: '', description: '', photoUrl: '', color: '#FFB464', order: 0, startDate: '', endDate: '', registrationLink: '' });

  useEffect(() => {
    setForm(editing || { title: '', subtitle: '', description: '', photoUrl: '', color: '#FFB464', order: 0, startDate: '', endDate: '', registrationLink: '' });
  }, [editing]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl z-10 overflow-y-auto max-h-[90vh]"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6">
          {editing ? 'Edit Event Card' : 'New Event Card'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Title *</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-sm outline-none focus:border-white/30 transition-all"
              placeholder="e.g. Tech Fest 2026" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Subtitle / Category</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-sm outline-none focus:border-white/30 transition-all"
              placeholder="e.g. Annual Tech Event" value={form.subtitle || ''} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
            <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-sm outline-none focus:border-white/30 transition-all resize-none"
              placeholder="Short description of the event..." value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Photo URL (Drive / Dropbox)</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-sm outline-none focus:border-white/30 transition-all font-mono"
                placeholder="https://drive.google.com/..." value={form.photoUrl || ''} onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))} />
            </div>
            {form.photoUrl && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/50">
                <img src={form.photoUrl} className="w-full h-full object-cover" alt="Preview"
                  onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100/1a1a1a/white?text=!") } />
              </div>
            )}
          </div>

          {/* ── Event Window ── */}
          <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.02] space-y-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-regular fa-clock text-yellow-400" /> Event Window
            </p>
            <p className="text-[10px] text-white/30">Card will show as <span className="text-green-400 font-bold">LIVE</span> only between these dates. Leave blank to always show.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Start Date</label>
                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-all"
                  value={form.startDate || ''} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">End Date</label>
                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-all"
                  value={form.endDate || ''} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ── Registration Link ── */}
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              <i className="fa-solid fa-link mr-1 text-indigo-400" /> Registration Link
            </label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-sm outline-none focus:border-white/30 transition-all font-mono"
              placeholder="https://forms.google.com/..." value={form.registrationLink || ''} onChange={e => setForm(f => ({ ...f, registrationLink: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Accent Color</label>
              <div className="flex items-center gap-3">
                <input type="color" className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  value={form.color || '#FFB464'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                <span className="text-white/50 text-sm font-mono">{form.color}</span>
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Display Order</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-sm outline-none focus:border-white/30 transition-all"
                value={form.order ?? 0} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) }))} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button onClick={() => { if (form.title?.trim()) { onSave(form); onClose(); } }}
            className="flex-1 py-3 rounded-xl bg-white text-gray-900 text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-xl">
            {editing ? 'Save Changes' : 'Create Card'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface OrbitalShowcaseProps {
  user: User | null;
}

const OrbitalShowcase: React.FC<OrbitalShowcaseProps> = ({ user }) => {
  const [cards, setCards] = useState<ShowcaseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ShowcaseCard | null>(null);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === UserRoles.ADMIN || user?.role === UserRoles.SUPER_ADMIN;
  const rotationY = useMotionValue(0);
  const smoothRotationY = useSpring(rotationY, { damping: 30, stiffness: 80 });

  // ── Fetch cards ──
  const loadCards = useCallback(async () => {
    try {
      const data = await db.getShowcaseCards();
      if (data.length === 0) {
        // Seed defaults
        const seeded: ShowcaseCard[] = [];
        for (const d of DEFAULT_CARDS) {
          const added = await db.addShowcaseCard(d) as ShowcaseCard;
          seeded.push(added);
        }
        setCards(seeded);
      } else {
        setCards(data);
      }
    } catch (e) {
      console.error('Failed to load showcase cards', e);
      // Fall back to defaults for display
      setCards(DEFAULT_CARDS.map((d, i) => ({ ...d, id: `default-${i}` })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  // ── Constant auto-rotation ──
  useAnimationFrame((_time, delta) => {
    if (focusedIndex === null) {
      rotationY.set(rotationY.get() + delta * 0.00018);
    }
  });

  // ── Mouse parallax ──
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: (e.clientX - rect.left - rect.width / 2) / (rect.width / 2),
        y: (e.clientY - rect.top - rect.height / 2) / (rect.height / 2),
      });
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  // ── Card click ──
  const handleCardClick = (i: number) => {
    if (focusedIndex === i) { setFocusedIndex(null); return; }
    setFocusedIndex(i);
    const angleStep = (Math.PI * 2) / cards.length;
    rotationY.set(-i * angleStep);
  };

  // ── Admin helpers ──
  const handleSave = async (form: Partial<ShowcaseCard>) => {
    if (editingCard) {
      await db.updateShowcaseCard({ ...editingCard, ...form });
    } else {
      await db.addShowcaseCard(form);
    }
    setEditingCard(null);
    loadCards();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this card?')) return;
    await db.deleteShowcaseCard(id);
    setFocusedIndex(null);
    loadCards();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  const focusedCard = focusedIndex !== null ? cards[focusedIndex] : null;
  // Non-admins only see always-on + live + upcoming cards (not ended ones)
  const visibleCards = isAdmin ? cards : cards.filter(c => getEventStatus(c) !== 'ended');
  const activeCard = visibleCards[mobileActiveIndex] || visibleCards[0];

  return (
    <>
      {/* ═══════════════ DESKTOP VIEW (lg+) ═══════════════ */}
      <section className="hidden lg:block relative w-full overflow-hidden" style={{ height: '70vh', background: '#030306' }}>
        {/* Background glow - smoothed for seamless transition */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,_#0d0d1a_0%,_#030306_100%)]" />
        <div className="absolute top-1/2 left-[37.5%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-900/15 blur-[100px] pointer-events-none" />

        {/* Admin controls */}
        {isAdmin && (
          <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
            <button onClick={() => { setEditingCard(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
              <i className="fa-solid fa-plus" /> Add Card
            </button>
            {focusedCard && (
              <>
                <button onClick={() => { setEditingCard(focusedCard); setModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
                  <i className="fa-solid fa-pen" /> Edit
                </button>
                <button onClick={() => handleDelete(focusedCard.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/30 transition-all border border-red-500/20">
                  <i className="fa-solid fa-trash" /> Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Left column header */}
        <div className="absolute top-8 left-10 z-50">
          <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.4em] mb-1">Orbital.OS</p>
          <h2 className="text-2xl font-black text-white tracking-tighter">Explore Titan</h2>
        </div>

        {/* orbit dots */}
        <div className="absolute left-[37.5%] top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="absolute inset-0 w-[640px] h-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
        </div>

        {/* 3D carousel scene (75% width) */}
        <div ref={containerRef} className="absolute top-0 left-0 w-3/4 h-full flex items-center justify-center" style={{ perspective: '1800px' }}>
          <motion.div
            className="relative w-full h-full flex items-center justify-center"
            style={{
              transformStyle: 'preserve-3d',
              rotateX: mousePosition.y * -5,
              rotateY: mousePosition.x * 4,
            }}
          >
            {visibleCards.map((card, i) => (
              <OrbitalCard
                key={card.id}
                card={card}
                index={i}
                total={visibleCards.length}
                globalRotation={smoothRotationY}
                isFocused={focusedIndex === i}
                onClick={() => handleCardClick(i)}
              />
            ))}

            {/* Central light column */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ transform: 'translateZ(-80px)' }}>
              <motion.div
                className="w-[1px] h-80 bg-gradient-to-b from-transparent via-white/20 to-transparent"
                animate={{ opacity: focusedIndex !== null ? 0.1 : 0.4 }}
              />
            </div>
          </motion.div>
        </div>

        {/* Right panel info (25% width) */}
        <div className="absolute top-0 right-0 w-1/4 h-full flex flex-col justify-center px-8 border-l border-white/[0.06]">
          <AnimatePresence mode="wait">
            {focusedCard ? (
              <motion.div
                key={focusedCard.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                {/* Event status + date */}
                {(() => {
                  const st = getEventStatus(focusedCard);
                  const sStyle = STATUS_STYLES[st];
                  return sStyle.label ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black" style={{ background: sStyle.bg, color: 'white' }}>
                        {sStyle.label}
                      </span>
                      {(focusedCard.startDate || focusedCard.endDate) && (
                        <span className="text-white/30 text-[10px]">{formatDateRange(focusedCard.startDate, focusedCard.endDate)}</span>
                      )}
                    </div>
                  ) : null;
                })()}

                {/* Card photo large preview */}
                {focusedCard.photoUrl ? (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden">
                    <img src={formatMediaLink(focusedCard.photoUrl)} alt={focusedCard.title}
                      className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-2xl flex items-center justify-center"
                    style={{ background: hexToRgba(focusedCard.color, 0.1), border: `1px solid ${hexToRgba(focusedCard.color, 0.2)}` }}>
                    <i className="fa-solid fa-image text-4xl" style={{ color: hexToRgba(focusedCard.color, 0.4) }} />
                  </div>
                )}

                <div>
                  <div className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-3"
                    style={{ background: hexToRgba(focusedCard.color, 0.2), color: focusedCard.color }}>
                    {focusedCard.subtitle || 'Module'}
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter mb-3">{focusedCard.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed font-medium">
                    {focusedCard.description}
                  </p>
                </div>

                {/* Registration Button */}
                {focusedCard.registrationLink && getEventStatus(focusedCard) !== 'ended' && (
                  <a
                    href={focusedCard.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl text-center text-xs font-black uppercase tracking-widest transition-all duration-300 hover:brightness-110 hover:shadow-xl flex items-center justify-center gap-2"
                    style={{ background: focusedCard.color, color: '#000' }}
                  >
                    <i className="fa-solid fa-pen-to-square" />
                    Register Now
                  </a>
                )}
                {focusedCard.registrationLink && getEventStatus(focusedCard) === 'ended' && (
                  <div className="w-full py-3 rounded-xl text-center text-xs font-black uppercase tracking-widest bg-white/5 text-white/20 cursor-not-allowed flex items-center justify-center gap-2">
                    <i className="fa-solid fa-lock" /> Registration Closed
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {visibleCards.map((_, i) => (
                    <button key={i}
                      onClick={() => handleCardClick(i)}
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        width: i === focusedIndex ? 20 : 6,
                        background: i === focusedIndex ? focusedCard.color : 'rgba(255,255,255,0.15)'
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
                  <i className="fa-solid fa-circle-nodes text-white/30 text-2xl" />
                </div>
                <p className="text-white/25 text-sm font-medium leading-relaxed">
                  Click any card in the orbit to explore its details.
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  {visibleCards.map((c, i) => (
                    <button key={i} onClick={() => handleCardClick(i)}
                      className="w-2 h-2 rounded-full transition-all hover:scale-150"
                      style={{ background: c.color }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Click-to-dismiss hint */}
        {focusedIndex === null && (
          <motion.p
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 text-[10px] font-black uppercase tracking-[0.3em] pointer-events-none"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Click a card to focus
          </motion.p>
        )}
      </section>

      {/* ═══════════════ MOBILE VIEW (< lg) ═══════════════ */}
      <section className="lg:hidden relative w-full py-4 px-3 overflow-hidden" style={{ background: '#030306' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_#0d0d1a_0%,_#030306_100%)]" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.4em]">Orbital.OS</p>
              <h2 className="text-xl font-black text-white tracking-tighter">Explore Titan</h2>
            </div>
            {isAdmin && (
              <button onClick={() => { setEditingCard(null); setModalOpen(true); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                <i className="fa-solid fa-plus" /> Add
              </button>
            )}
          </div>

          {/* Active card preview */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCard?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full rounded-3xl overflow-hidden mb-4"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(activeCard?.color || '#FFB464', 0.15)}, ${hexToRgba(activeCard?.color || '#FFB464', 0.05)})`,
                border: `1px solid ${hexToRgba(activeCard?.color || '#FFB464', 0.3)}`,
              }}
            >
              {activeCard?.photoUrl ? (
                <div className="w-full h-40">
                  <img src={formatMediaLink(activeCard.photoUrl)} alt={activeCard.title}
                    className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 flex items-center justify-center"
                  style={{ background: hexToRgba(activeCard?.color || '#FFB464', 0.1) }}>
                  <i className="fa-solid fa-image text-4xl" style={{ color: hexToRgba(activeCard?.color || '#FFB464', 0.3) }} />
                </div>
              )}
              <div className="p-5">
                {/* Status + date row */}
                {activeCard && (() => {
                  const st = getEventStatus(activeCard);
                  const sStyle = STATUS_STYLES[st];
                  return sStyle.label ? (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black" style={{ background: sStyle.bg, color: 'white' }}>
                        {sStyle.label}
                      </span>
                      {(activeCard.startDate || activeCard.endDate) && (
                        <span className="text-white/30 text-[9px]">{formatDateRange(activeCard.startDate, activeCard.endDate)}</span>
                      )}
                    </div>
                  ) : null;
                })()}
                <div className="inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] mb-2"
                  style={{ background: hexToRgba(activeCard?.color || '#FFB464', 0.2), color: activeCard?.color }}>
                  {activeCard?.subtitle || 'Module'}
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter mb-2">{activeCard?.title}</h3>
                {activeCard?.description && (
                  <p className="text-white/40 text-sm leading-relaxed">{activeCard.description}</p>
                )}
                {/* Register button */}
                {activeCard?.registrationLink && getEventStatus(activeCard) !== 'ended' && (
                  <a
                    href={activeCard.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full py-2.5 rounded-xl text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    style={{ background: activeCard.color, color: '#000' }}
                  >
                    <i className="fa-solid fa-pen-to-square" /> Register Now
                  </a>
                )}
                {activeCard?.registrationLink && getEventStatus(activeCard) === 'ended' && (
                  <div className="mt-4 w-full py-2.5 rounded-xl text-center text-xs font-black uppercase tracking-widest bg-white/5 text-white/20 flex items-center justify-center gap-2">
                    <i className="fa-solid fa-lock" /> Registration Closed
                  </div>
                )}
                {isAdmin && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { setEditingCard(activeCard); setModalOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                      <i className="fa-solid fa-pen" /> Edit
                    </button>
                    <button onClick={() => handleDelete(activeCard!.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest border border-red-500/20">
                      <i className="fa-solid fa-trash" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Strips */}
          <div className="space-y-2">
            {visibleCards.map((card, i) => (
              <MobileCard
                key={card.id}
                card={card}
                isActive={mobileActiveIndex === i}
                onClick={() => setMobileActiveIndex(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ Admin Modal ═══════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <AdminModal
            editing={editingCard}
            onSave={handleSave}
            onClose={() => { setModalOpen(false); setEditingCard(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default OrbitalShowcase;
