import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/ui/Loader';
import { useRegister } from './hooks/useRegister';

const Register = () => {
  const {
    name, setName,
    email, setEmail,
    phone, setPhone,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    errors, isLoading,
    handleRegister,
    handleGoogleSignup,
  } = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      {isLoading && <Loader fullScreen text="Creating Account..." />}

      {/* Left Side: Form Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-24 lg:px-20 xl:px-32 relative">
        <div className="w-full max-w-[420px] mx-auto py-10">

          <div className="text-left md:text-center mb-8 animate-slide-up-1">
            <h2 className="text-[1.8rem] font-bold text-[#4E342E] tracking-tight leading-tight mb-2">
              Join Odoo POS Cafe
            </h2>
            <p className="text-[#8D6E63] text-[0.9rem] font-medium">
              Create your pos terminal account
            </p>gf
          </div>

          {errors.global && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium text-center animate-pulse">
              {errors.global}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div className="animate-slide-up-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Pam Beesly"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border ${errors.name ? 'border-red-400' : 'border-gray-200'} rounded-[0.5rem] p-3 text-[0.95rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="animate-slide-up-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border ${errors.email ? 'border-red-400' : 'border-gray-200'} rounded-[0.5rem] p-3 text-[0.95rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="animate-slide-up-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <input
                type="text"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full border ${errors.phone ? 'border-red-400' : 'border-gray-200'} rounded-[0.5rem] p-3 text-[0.95rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="animate-slide-up-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border ${errors.password ? 'border-red-400' : 'border-gray-200'} rounded-[0.5rem] p-3 text-[0.95rem] ${!showPassword ? 'tracking-[0.2em]' : ''} text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all pr-12`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-900 outline-none transition-colors">
                  {showPassword ? (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="animate-slide-up-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full border ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200'} rounded-[0.5rem] p-3 text-[0.95rem] ${!showConfirmPassword ? 'tracking-[0.2em]' : ''} text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all pr-12`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-900 outline-none transition-colors">
                  {showConfirmPassword ? (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword}</p>}
            </div>

            {/* Register Button */}
            <div className="animate-slide-up-5">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#5D4037] hover:bg-[#3E2723] text-white font-semibold rounded-[0.5rem] py-3.5 text-[0.95rem] transition-colors disabled:opacity-80 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : 'Sign Up'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-7 animate-slide-up-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400 text-xs font-semibold">OR</span>
            </div>
          </div>

          {/* Google Button */}
          <div className="animate-slide-up-5" style={{ animationDelay: '0.55s' }}>
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full border border-[#E0D4C8] rounded-[0.5rem] py-3 flex items-center justify-center gap-3 text-[0.9rem] font-semibold text-[#4E342E] hover:bg-[#FAF8F5] transition-colors active:bg-[#EFEBE6]"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-[1.1rem] h-[1.1rem]" />
              Sign up with Google
            </button>

            <p className="mt-8 text-center text-[0.8rem] text-[#8D6E63] font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-[#5D4037] font-bold ml-1 hover:underline">
                Log in
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Right Side: Testimonial/Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#4E342E] border-l border-[#E0D4C8] overflow-hidden">
        <img
          ref={imageRef}
          src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=2000"
          alt="Cafe POS Setup"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[400ms] ease-out will-change-transform"
          style={{ transform: 'scale(1.05)' }}
        />
        {/* Subtle Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none"></div>

        {/* Testimonial Text Overlay */}
        <div className="absolute bottom-12 left-12 right-12 text-white z-20 pointer-events-none">
          <div className="mb-4 text-white opacity-80 animate-slide-up-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.017 21L16.41 14.9042H10.875V3H21V11.7583L17.707 21H14.017ZM6.14197 21L8.535 14.9042H3V3H13.125V11.7583L9.83197 21H6.14197Z" />
            </svg>
          </div>
          <p className="text-[0.95rem] font-medium leading-relaxed mb-8 max-w-[90%] tracking-wide animate-slide-up-2">
            "Running a restaurant requires speed and accuracy. The automated table management and kitchen display features ensure we never miss an order, keeping our customers happy."
          </p>
          <div className="flex justify-between items-end animate-slide-up-3 pointer-events-auto">
            <div>
              <p className="font-bold tracking-wide">David Ortez</p>
              <p className="text-xs text-gray-300 mt-1 font-medium">Restaurant Owner</p>
            </div>
            <div className="flex gap-4">
              <button className="text-white hover:text-[#E8C39E] transition-colors p-2 cursor-pointer outline-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button className="text-white hover:text-[#E8C39E] transition-colors p-2 cursor-pointer outline-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Register;
