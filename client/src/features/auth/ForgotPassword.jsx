import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';

const ForgotPassword = () => {
  const [method, setMethod] = useState('email'); // 'email' or 'phone'
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const navigate = useNavigate();

  const imageRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;

    requestAnimationFrame(() => {
      if (imageRef.current) {
        imageRef.current.style.transform = `scale(1.05) translate(${-x}px, ${-y}px)`;
      }
    });
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setGlobalError('');
    try {
      await authApi.requestOtp({ identifier, method });
      setStep(2);
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setGlobalError('');
    try {
      await authApi.resetPassword({ identifier, otp, newPassword });
      alert('Password Reset Successful');
      navigate('/login');
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Invalid OTP or Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden" onMouseMove={handleMouseMove}>
      <style>
        {`
          @keyframes slideUpFade {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-up-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
          .animate-slide-up-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
          .animate-slide-up-3 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both; }
          .animate-slide-up-4 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both; }
          .animate-slide-up-5 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both; }
        `}
      </style>

      {/* Left Side: Form Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-24 lg:px-20 xl:px-32 relative">
        <div className="w-full max-w-[420px] mx-auto py-10">

          {/* Animated Lock Icon (The "Something New") */}
          <div className="flex justify-center md:justify-start mb-6 animate-slide-up-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${step === 1 ? 'bg-[#FAF8F5] text-[#4E342E]' : 'bg-[#5D4037] text-white shadow-lg shadow-[#5D4037]/20 scale-110'}`}>
              <svg className="w-7 h-7 transition-all duration-500 will-change-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {step === 1 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                )}
              </svg>
            </div>
          </div>

          <div className="text-left md:text-left mb-8 animate-slide-up-1">
            <h2 className="text-[1.8rem] font-bold text-[#4E342E] tracking-tight leading-tight mb-2 transition-all">
              {step === 1 ? 'Forgot Password?' : 'Secure Reset'}
            </h2>
            <p className="text-[#8D6E63] text-[0.9rem] font-medium">
              {step === 1
                ? "No worries, we'll send you reset instructions."
                : `Enter the code sent to ${identifier}`
              }
            </p>
          </div>

          {globalError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium text-center animate-pulse">
              {globalError}
            </div>
          )}

          {step === 1 ? (
            // /* STEP 1: REQUEST OTP */
            <div className="animate-[fadeIn_0.5s_ease-out]">
              {/* Delivery Method Tabs */}
              <div className="flex bg-[#EFEBE6] rounded-xl p-1 mb-8 shadow-inner animate-slide-up-2">
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${method === 'email' ? 'bg-[#FAF8F5] text-[#4E342E] shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-[#8D6E63] hover:text-[#4E342E]'}`}
                  onClick={() => { setMethod('email'); setIdentifier(''); setGlobalError(''); }}
                >
                  Email Address
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${method === 'phone' ? 'bg-[#FAF8F5] text-[#4E342E] shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-[#8D6E63] hover:text-[#4E342E]'}`}
                  onClick={() => { setMethod('phone'); setIdentifier(''); setGlobalError(''); }}
                >
                  Phone Number
                </button>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="animate-slide-up-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 capitalize tracking-wide">
                    {method === 'email' ? 'Registered Email' : 'Registered Phone'}
                  </label>
                  <input
                    type={method === 'email' ? "email" : "tel"}
                    placeholder={method === 'email' ? "admin@gmail.com" : "+1 234 567 8900"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-[0.5rem] p-3.5 text-[0.95rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
                  />
                </div>

                <div className="animate-slide-up-4">
                  <button
                    type="submit"
                    disabled={isLoading || !identifier.trim()}
                    className="w-full bg-[#5D4037] hover:bg-[#3E2723] text-white font-semibold rounded-[0.5rem] py-3.5 text-[0.95rem] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Code...
                      </>
                    ) : `Send Code to ${method === 'email' ? 'Email' : 'Phone'}`}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // /* STEP 2: VERIFY OTP AND RESET */
            <div className="animate-[fadeIn_0.5s_ease-out]">
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="animate-slide-up-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide">6-Digit Code</label>
                  <input
                    type="text"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    required
                    className="w-full border border-gray-200 rounded-[0.5rem] p-3.5 text-[1.2rem] text-center tracking-[0.7em] font-mono text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-bold"
                  />
                </div>

                <div className="animate-slide-up-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-[0.5rem] p-3.5 text-[0.95rem] tracking-[0.2em] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                  />
                </div>

                <div className="pt-2 animate-slide-up-4">
                  <button
                    type="submit"
                    disabled={isLoading || otp.length < 6 || !newPassword}
                    className="w-full bg-[#5D4037] hover:bg-[#3E2723] text-white font-semibold rounded-[0.5rem] py-3.5 text-[0.95rem] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Securing Account...
                      </>
                    ) : 'Reset Password'}
                  </button>
                </div>

                <div className="text-center pt-2 animate-slide-up-5">
                  <button
                    type="button"
                    className="text-[0.8rem] text-gray-500 font-semibold hover:text-gray-900 transition-colors"
                    onClick={() => { setStep(1); setOtp(''); setGlobalError(''); }}
                    disabled={isLoading}
                  >
                    Use a different {method}? Go Back
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer Back to Login Link */}
          <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center animate-slide-up-5 transition-transform" style={{ animationDelay: step === 1 ? '0.5s' : '0.6s' }}>
            <Link to="/login" className="flex items-center gap-2 text-[0.85rem] font-bold text-gray-500 hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Login
            </Link>
          </div>

        </div>
      </div>

      {/* Right Side: Thematic Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#4E342E] border-l border-[#E0D4C8] overflow-hidden">
        <img
          ref={imageRef}
          src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=2070"
          alt="Cafe Infrastructure"
          className="absolute inset-0 w-full h-full object-cover filter opacity-90 transition-all duration-[10s] ease-out will-change-transform hover:scale-[1.07]"
          style={{ transform: 'scale(1.05)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

        {/* Dynamic Overlaid Status (The "Something New") */}
        <div className="absolute bottom-12 left-12 right-12 text-white pointer-events-none">
          <div className="mb-4 animate-slide-up-1">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-colors duration-500 ${step === 1 ? 'bg-white/10 text-white' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
              <span className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`}></span>
              {step === 1 ? 'System Locked' : 'Secure Connection Active'}
            </span>
          </div>
          <p className="text-[1.1rem] font-medium leading-relaxed mb-4 max-w-[90%] tracking-wide animate-slide-up-2">
            {step === 1
              ? "Access your POS account easily. We'll help you secure your terminal connection."
              : "Authentication verified. You are now securely modifying root access parameters."}
          </p>
        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;
