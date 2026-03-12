
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSignIn, useUser } from '@clerk/clerk-react';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { user: existingUser } = useUser();

  React.useEffect(() => {
    if (existingUser) {
      navigate('/profile');
    }
  }, [existingUser, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA handling
  const [needs2FA, setNeeds2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [secondFactorStrategy, setSecondFactorStrategy] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    setError('');
    setLoading(true);

    try {
      // If we're in 2FA mode, attempt the second factor
      if (needs2FA) {
        const result = await signIn!.attemptSecondFactor({
          strategy: secondFactorStrategy as any,
          code: verificationCode,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          onLogin();
          navigate('/');
        } else {
          setError(`Verification failed. Status: ${result.status}`);
        }
        return;
      }

      // Normal password login
      const result = await signIn!.create({
        identifier: email.trim(),
        password: password,
        strategy: 'password',
      });

      console.log('SignIn Result:', result);

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        onLogin();
        navigate('/');
      } else if (result.status === 'needs_second_factor') {
        // Automatically handle 2FA
        console.log('2FA Required. Supported factors:', result.supportedSecondFactors);
        const factors = result.supportedSecondFactors || [];
        
        // Find the best strategy to use
        const phoneFactor = factors.find((f: any) => f.strategy === 'phone_code');
        const totpFactor = factors.find((f: any) => f.strategy === 'totp');
        const emailFactor = factors.find((f: any) => f.strategy === 'email_code');

        if (phoneFactor) {
          setSecondFactorStrategy('phone_code');
          await signIn!.prepareSecondFactor({ strategy: 'phone_code', phoneNumberId: (phoneFactor as any).phoneNumberId });
          setNeeds2FA(true);
          setError('');
        } else if (emailFactor) {
          setSecondFactorStrategy('email_code');
          await signIn!.prepareSecondFactor({ strategy: 'email_code' } as any);
          setNeeds2FA(true);
          setError('');
        } else if (totpFactor) {
          setSecondFactorStrategy('totp');
          setNeeds2FA(true);
          setError('');
        } else {
          setError('Two-factor authentication is required but no supported method was found. Please contact support.');
        }
      } else if (result.status === 'needs_first_factor') {
        setError('Additional verification needed. Please check your email.');
      } else {
        setError(`Login incomplete (Status: ${result.status}). Check your credentials.`);
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || err?.message
        || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 max-w-md w-full border border-gray-100 relative overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#800000]" />

        {/* Logo */}
        <div className="w-16 h-16 bg-[#800000] rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-6 shadow-xl">T</div>

        <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tighter uppercase text-center">Welcome Back</h2>
        <p className="text-gray-400 mb-8 text-sm font-medium text-center">
          {needs2FA ? 'Enter the verification code sent to you' : 'Sign in to your Titan account'}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {!needs2FA ? (
            <>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
                <input
                  type="email"
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 font-semibold outline-none focus:ring-0 focus:border-[#800000] text-gray-900 transition-all placeholder-gray-300"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 font-semibold outline-none focus:ring-0 focus:border-[#800000] text-gray-900 transition-all placeholder-gray-300 pr-14"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#800000] transition-colors"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                {secondFactorStrategy === 'totp' ? 'Authenticator Code' : 'Verification Code'}
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border-2 border-[#800000]/20 rounded-2xl px-5 py-4 font-semibold outline-none focus:ring-0 focus:border-[#800000] text-gray-900 transition-all tracking-widest text-center text-2xl"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-gray-400 font-medium mt-2 text-center">
                {secondFactorStrategy === 'totp'
                  ? 'Open your Authenticator app to find the code'
                  : secondFactorStrategy === 'phone_code'
                  ? 'Check your phone for the code'
                  : 'Check your email for the code'}
              </p>
              <button
                type="button"
                onClick={() => { setNeeds2FA(false); setVerificationCode(''); setError(''); }}
                className="w-full text-[#800000] font-bold text-xs uppercase tracking-widest hover:underline mt-3"
              >
                ← Back to login
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isLoaded}
            className="w-full bg-[#800000] text-white font-black py-5 rounded-2xl hover:bg-[#6b0000] transition-all shadow-xl uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {needs2FA ? 'Verifying...' : 'Signing In...'}
              </span>
            ) : needs2FA ? 'Verify & Sign In' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-gray-400 font-bold text-sm">
            New to Titan?{' '}
            <Link to="/register" className="text-[#800000] hover:underline font-black">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
