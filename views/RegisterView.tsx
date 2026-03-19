
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole, UserRoles } from '../types';
import { useSignUp, useUser } from '@clerk/clerk-react';

const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { user: existingUser } = useUser();

  React.useEffect(() => {
    if (existingUser) {
      navigate('/profile');
    }
  }, [existingUser, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRoles.STUDENT as UserRole,
    accessCode: '',
    uid: ''
  });

  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    setLoading(true);

    console.log('--- CLERK ENROLLMENT START ---');

    try {
      const selectedRole = formData.role as UserRoles;
      const normalizedCode = formData.accessCode.trim();

      console.log('Registration Profile:', { role: selectedRole, email: formData.email.trim() });

      if (selectedRole === UserRoles.SUPER_ADMIN) {
        if (normalizedCode !== 'ARSALAN2025') {
          console.warn('REGISTRATION BLOCKED: Invalid Super Admin passkey.');
          throw new Error('Super Admin Passkey Invalid. Authorization Denied.');
        }
      } else if ([UserRoles.ADMIN, UserRoles.CLUB_ADMIN, UserRoles.CAREER_ADMIN].includes(selectedRole)) {
        if (normalizedCode !== 'TITAN2025') {
          console.warn('REGISTRATION BLOCKED: Invalid Admin passkey.');
          throw new Error('Admin Passkey Invalid. Authorization Denied.');
        }
      }

      // Start the signup process
      await signUp.create({
        emailAddress: formData.email.trim(),
        password: formData.password,
        unsafeMetadata: {
          role: selectedRole,
          name: formData.name.trim(),
          uid: formData.uid.trim()
        }
      });
      console.log('Clerk Identity created. Initiating verification...');

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerifying(true);
      console.log('Verification code sent to:', formData.email);

    } catch (err: any) {
      const clerkError = err.errors?.[0]?.message || err.message;
      console.error('PROVISIONING FAILED:', clerkError);
      setError(clerkError || 'Identity could not be verified.');
    } finally {
      setLoading(false);
      console.log('--- CLERK ENROLLMENT SEQUENCE ---');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        console.log('Verification Complete. Synchronizing session...');
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/');
      } else {
        console.error(completeSignUp);
        setError('Verification incomplete. Please check your code.');
      }
    } catch (err: any) {
      const clerkError = err.errors?.[0]?.message || err.message;
      setError(clerkError || 'Code verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 md:py-16">
      <div className="bg-white rounded-[4rem] shadow-2xl p-10 md:p-16 max-w-4xl w-full border border-gray-100 animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
          <i className="fa-solid fa-id-card-clip text-[15rem]"></i>
        </div>

        <div className="flex items-center gap-6 mb-10 relative">
          <div className="w-16 h-16 bg-maroon-800 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl rotate-3 shrink-0">T</div>
          <div>
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">Titan Registration</h2>
            <p className="text-gray-400 text-sm font-medium mt-1">
              {verifying ? 'Verifying identity...' : 'Step into the Titan ecosystem.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold flex items-center gap-4 animate-slide-up shadow-sm">
            <i className="fa-solid fa-triangle-exclamation text-xl"></i>
            {error}
          </div>
        )}

        {verifying ? (
          <form onSubmit={handleVerify} className="space-y-10 relative animate-fade-in">
            <div className="space-y-4">
              <label htmlFor="verifyCode" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-2 text-center font-inter">Verification Code</label>
              <input
                id="verifyCode"
                type="text"
                className="w-full bg-gray-50 border-none rounded-2xl px-8 py-4 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-4xl transition-all text-center tracking-[0.5em] placeholder:tracking-normal"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <p className="text-center text-sm text-gray-400 font-medium">Please enter the 6-digit code sent to your email.</p>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-maroon-800 text-white font-black py-6 rounded-2xl hover:bg-maroon-900 transition-all shadow-xl uppercase tracking-widest text-xs mt-4 active:scale-95 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Complete Registration'}
            </button>
            <button type="button" onClick={() => setVerifying(false)} className="w-full text-maroon-800 font-bold text-[10px] uppercase tracking-widest hover:underline">
              Check information again
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="regName" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-1 font-inter">Display Name</label>
                <input
                  id="regName"
                  type="text"
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-lg transition-all"
                  placeholder="Arsalaan Khan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="regEmail" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-1 font-inter">Email</label>
                <input
                  id="regEmail"
                  type="email"
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-lg transition-all"
                  autoComplete="email"
                  placeholder="arsalaankhan@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="regPass" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-1 font-inter">Password</label>
                <div className="relative group">
                  <input
                    id="regPass"
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-lg transition-all pr-16"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-maroon-800 transition-colors"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-1 font-inter">Account Type</p>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {[
                    { r: UserRoles.STUDENT, icon: 'fa-user-graduate', label: 'Student' },
                    { r: UserRoles.ADMIN, icon: 'fa-shield', label: 'Admin' },
                    { r: UserRoles.SUPER_ADMIN, icon: 'fa-crown', label: 'Super Admin' }
                  ].map(({ r, icon, label }) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r })}
                      className={`py-4 px-1 rounded-2xl flex items-center justify-center gap-2 text-[8px] sm:text-[10px] font-black uppercase transition-all border-2 ${formData.role === r
                        ? 'bg-maroon-800 text-white border-maroon-800 shadow-xl'
                        : 'bg-gray-50 text-gray-400 border-gray-50 hover:border-maroon-100 hover:text-maroon-800'
                        }`}
                    >
                      <i className={`fa-solid ${icon} text-lg`}></i>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formData.role === UserRoles.STUDENT && (
              <div className="animate-fade-in space-y-4 pt-6 border-t border-gray-100">
                <label htmlFor="regUID" className="block text-[10px] font-black text-maroon-800 uppercase tracking-[0.4em] px-1 font-inter flex items-center gap-3">
                  <i className="fa-solid fa-id-card text-lg"></i>
                  University UID (From ID-Card)
                </label>
                <input
                  id="regUID"
                  type="text"
                  className="w-full bg-[#fdf2f2] border-2 border-maroon-50 rounded-2xl px-6 py-4 font-bold outline-none focus:border-maroon-800 transition-all text-lg"
                  placeholder="e.g. 21CS045"
                  value={formData.uid}
                  onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                  required
                />
                <p className="text-[9px] text-maroon-400 font-bold uppercase tracking-widest px-1 italic flex items-center gap-2">
                   <i className="fa-solid fa-circle-info"></i>
                   Found on your institutional ID-card. Mandatory for verification.
                </p>
              </div>
            )}

            {formData.role !== UserRoles.STUDENT && (
              <div className="animate-fade-in space-y-4 pt-6 border-t border-gray-100">
                <label htmlFor="authCode" className="block text-[10px] font-black text-maroon-800 uppercase tracking-[0.4em] px-1 font-inter flex items-center gap-3">
                  <i className="fa-solid fa-key text-lg"></i> Passkey Authorization
                </label>
                <div className="relative group">
                   <input
                    id="authCode"
                    type="text"
                    style={!showAccessCode ? { WebkitTextSecurity: 'disc' } as any : {}}
                    className="w-full bg-maroon-50 border-none rounded-2xl px-6 py-4 font-bold placeholder-maroon-200 focus:ring-4 focus:ring-maroon-800/10 transition-all text-lg pr-16"
                    placeholder="Enter security key"
                    autoComplete="off"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-maroon-200 hover:text-maroon-800 transition-colors"
                  >
                    <i className={`fa-solid ${showAccessCode ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-maroon-800 text-white font-black py-7 rounded-[2rem] hover:bg-maroon-900 transition-all shadow-2xl uppercase tracking-widest text-sm mt-4 active:scale-95 disabled:opacity-50">
              {loading ? 'Processing...' : 'Create My Account'}
            </button>
          </form>
        )}

        <div className="mt-10 text-center border-t border-gray-50 pt-8">
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Already a Titan? <Link to="/login" className="text-maroon-800 hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
