
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole, UserRoles } from '../types';
import { useSignIn } from '@clerk/clerk-react';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [role, setRole] = useState<UserRole>(UserRoles.STUDENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    setLoading(true);

    console.log('--- CLERK LOGIN SEQUENCE START ---');

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password: password.trim(),
      });

      if (result.status === 'complete') {
        console.log('Clerk Authentication Successful');
        await setActive({ session: result.createdSessionId });
        onLogin();
        navigate('/');
      } else {
        console.warn('Incomplete sign-in status:', result.status);
        setError('Authentication incomplete. Please check your credentials.');
      }
    } catch (err: any) {
      const clerkError = err.errors?.[0]?.message || err.message;
      console.error('CLERK LOGIN FAILURE:', clerkError);
      setError(clerkError || 'Identity verification protocol failed.');
    } finally {
      setLoading(false);
      console.log('--- CLERK LOGIN SEQUENCE END ---');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-4 py-12 md:py-20">
      <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl p-8 sm:p-12 md:p-16 max-w-2xl w-full border border-gray-100 animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 md:h-2 bg-maroon-800"></div>
        <div className="w-16 h-16 md:w-24 md:h-24 bg-maroon-800 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white font-black text-3xl md:text-4xl mx-auto mb-6 md:mb-10 shadow-2xl">T</div>
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-2 tracking-tighter uppercase text-center leading-none">Titan Gateway</h2>
        <p className="text-gray-500 mb-8 md:mb-12 text-sm md:text-xl font-medium text-center">Authentication protocol initialized.</p>

        {error && (
          <div className="mb-8 md:mb-10 p-4 md:p-6 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs md:text-sm font-bold flex items-center gap-3 md:gap-4 animate-slide-up">
            <i className="fa-solid fa-shield-halved text-lg"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-8 md:space-y-12">
          <div>
            <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 md:mb-6 px-2">Access Modality</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {[
                { r: UserRoles.STUDENT, icon: 'fa-user-graduate', label: 'Student' },
                { r: UserRoles.ADMIN, icon: 'fa-user-shield', label: 'General' },
                { r: UserRoles.CLUB_ADMIN, icon: 'fa-layer-group', label: 'Club Admin' },
                { r: UserRoles.CAREER_ADMIN, icon: 'fa-briefcase', label: 'Career' },
                { r: UserRoles.SUPER_ADMIN, icon: 'fa-crown', label: 'Super' }
              ].map(({ r, icon, label }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-4 px-2 md:py-5 md:px-4 rounded-xl md:rounded-[1.5rem] flex flex-col items-center gap-2 md:gap-3 text-[8px] md:text-[10px] font-black uppercase tracking-tight transition-all border-2 ${role === r
                    ? 'bg-maroon-800 text-white border-maroon-800 shadow-xl scale-105 z-10'
                    : 'bg-gray-50 text-gray-400 border-gray-50 hover:border-maroon-100 hover:text-maroon-800'
                    }`}
                >
                  <i className={`fa-solid ${icon} text-xl md:text-2xl`}></i>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="space-y-2">
              <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-2">Institutional ID</label>
              <input type="email" className="w-full bg-gray-50 border-none rounded-xl md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-6 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-base md:text-xl" placeholder="id@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-2">Secret Password</label>
              <input type="password" className="w-full bg-gray-50 border-none rounded-xl md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-6 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-base md:text-xl" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-maroon-800 text-white font-black py-6 md:py-8 rounded-2xl md:rounded-[2rem] hover:bg-maroon-900 transition-all shadow-2xl uppercase tracking-widest text-xs md:text-sm mt-4 active:scale-95 disabled:opacity-50">
            {loading ? 'Decrypting Identity...' : `Sync Identity as ${role.split('_')[0]}`}
          </button>
        </form>

        <div className="mt-12 md:mt-16 text-center border-t border-gray-50 pt-8 md:pt-10">
          <p className="text-gray-400 font-bold text-xs md:text-sm uppercase tracking-widest">
            New to Titan Chapter? <Link to="/register" className="text-maroon-800 hover:underline">Enroll Role</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
