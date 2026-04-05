import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from './hooks/useLogin';

const Login = () => {
  const {
    identifier,
    setIdentifier,
    password,
    setPassword,
    isLoading, errors,
    handleLogin,
    handleGoogleSuccess,
  } = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const imageRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    
    // Calculate movement offsets (approx 30px max either direction)
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;

    // Use requestAnimationFrame for a buttery smooth, optimized experience
    requestAnimationFrame(() => {
      if (imageRef.current) {
        // scale slightly to avoid seeing the edges during movement, and translate smoothly
        imageRef.current.style.transform = `scale(1.05) translate(${-x}px, ${-y}px)`;
      }
    });
  };

  return (
    <div 
      className="flex min-h-screen bg-white font-sans overflow-hidden" 
      onMouseMove={handleMouseMove}
    >
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
        `}
      </style>


      {/* Left Side: Testimonial/Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <img 
          ref={imageRef}
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2047" 
          alt="Cafe POS System" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[400ms] ease-out will-change-transform"
          style={{ transform: 'scale(1.05)' }}
        />
        {/* Subtle Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none"></div>
        
        {/* Testimonial Text Overlay */}
        <div className="absolute bottom-12 left-12 right-12 text-white z-20 pointer-events-none">
          <div className="mb-4 text-white opacity-80 animate-slide-up-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.017 21L16.41 14.9042H10.875V3H21V11.7583L17.707 21H14.017ZM6.14197 21L8.535 14.9042H3V3H13.125V11.7583L9.83197 21H6.14197Z" />
            </svg>
          </div>
          <p className="text-[0.95rem] font-medium leading-relaxed mb-8 max-w-[90%] tracking-wide animate-slide-up-2">
            "The Odoo POS Cafe system transformed our workflow. From fast billing to seamless kitchen integration, it's everything a modern restaurant needs to handle peak hours effortlessly."
          </p>
          <div className="flex justify-between items-end pointer-events-auto animate-slide-up-3">
            <div>
              <p className="font-bold tracking-wide">Sarah Jenkins</p>
              <p className="text-xs text-gray-300 mt-1 font-medium">Head Barista & Manager</p>
            </div>
            <div className="flex gap-4">
              <button className="text-white hover:text-blue-300 transition-colors p-2 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button className="text-white hover:text-blue-300 transition-colors p-2 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-24 lg:px-20 xl:px-32 relative z-10 bg-white">
        <div className="w-full max-w-[420px] mx-auto">
          
          <div className="text-left md:text-center mb-10 animate-slide-up-1">
            <h2 className="text-[1.8rem] font-bold text-foreground tracking-tight leading-tight mb-2">
              Welcome to Odoo POS Cafe
            </h2>
            <p className="text-muted-foreground text-[0.9rem] font-medium">
              Please login to your POS Terminal
            </p>
          </div>

          {errors.global && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium text-center animate-pulse">
              {errors.global}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="animate-slide-up-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input 
                type="text" 
                placeholder="cashier@poscafe.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={`w-full border ${errors.identifier ? 'border-red-400' : 'border-border'} rounded-[0.5rem] p-3.5 text-[0.95rem] text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-secondary/30`}
              />
              {errors.identifier && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.identifier}</p>}
            </div>

            {/* Password */}
            <div className="animate-slide-up-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border ${errors.password ? 'border-red-400' : 'border-border'} rounded-[0.5rem] p-3.5 text-[0.95rem] ${!showPassword ? 'tracking-[0.2em]' : ''} text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-secondary/30 pr-12`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground outline-none transition-colors">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.7 11.7 0 01-4.373 5.157M6.343 6.343L3 3m3.343 3.343l2.829 2.829M19.07 19.07L21 21m-1.93-1.93l-2.829-2.829M9.878 9.878a3 3 0 104.243 4.243" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end pt-1 pb-1 animate-slide-up-3">
              <Link to="/forgot-password" className="text-[0.75rem] font-bold text-primary hover:text-primary/80 transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <div className="animate-slide-up-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-[0.5rem] py-3.5 text-[0.95rem] transition-colors disabled:opacity-80 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-7 animate-slide-up-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400 text-xs font-semibold">OR</span>
            </div>
          </div>

          <div className="animate-slide-up-4" style={{ animationDelay: '0.45s' }}>
            {/* Google Button */}
            <button 
              type="button"
              onClick={handleGoogleSuccess}
              className="w-full border border-border rounded-[0.5rem] py-3.5 flex items-center justify-center gap-3 text-[0.9rem] font-semibold text-foreground hover:bg-secondary/50 transition-colors active:bg-secondary"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-[1.1rem] h-[1.1rem]" />
              Continue with Google
            </button>
            
            {/* Footer */}
            <p className="mt-10 text-center text-[0.8rem] text-muted-foreground font-medium">
              Don't have an Account?{' '}
              <Link to="/register" className="text-primary font-bold ml-1 hover:underline">
                Sign-up
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
