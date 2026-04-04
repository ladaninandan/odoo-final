import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  const textBgRef = useRef(null);

  const handleMouseMove = (e) => {
    if (textBgRef.current) {
      // Calculate cursor position as a percentage of the viewport
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      
      requestAnimationFrame(() => {
        // Shift the background image INSIDE the 404 text natively
        textBgRef.current.style.backgroundPosition = `${x}% ${y}%`;
      });
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center font-sans relative overflow-hidden selection:bg-gray-900 selection:text-white"
      onMouseMove={handleMouseMove}
    >
      <style>
        {`
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(40px); filter: blur(10px); }
            100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
          }
          .animate-reveal { 
             opacity: 0; 
             filter: blur(10px); 
             animation: fadeSlideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
          }
        `}
      </style>

      {/* Decorative floating minimal grid behind everything */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.3]" 
        style={{ 
          backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}
      ></div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center pt-10">
        
        {/* Colossal Masked 404 Text */}
        <h1 
          ref={textBgRef}
          className="text-[12rem] sm:text-[16rem] md:text-[22rem] lg:text-[28rem] font-black leading-[0.8] tracking-tighter select-none will-change-[background-position] transition-[background-position] duration-75 ease-out animate-reveal"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2070')",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            backgroundSize: "130%",
            backgroundPosition: "50% 50%",
            WebkitTextStroke: "1px rgba(0,0,0,0.05)" // subtle outline to define shape
          }}
        >
          404
        </h1>

        {/* Sleek Floating Glassmorphism Content Panel */}
        <div 
          className="relative z-20 bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_30px_80px_rgba(0,0,0,0.08)] px-8 py-10 md:px-14 md:py-12 rounded-[2rem] max-w-[90%] sm:max-w-lg md:max-w-2xl text-center transform -translate-y-16 md:-translate-y-24 animate-reveal"
          style={{ animationDelay: '0.2s' }}
        >
          {/* Minimal Status Dot */}
          <div className="flex items-center justify-center gap-2 mb-6">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
             <span className="text-[0.75rem] font-bold text-gray-500 uppercase tracking-widest">Connection Severed</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-5">
            You've hit a dead end.
          </h2>
          
          <p className="text-gray-500 font-medium text-[0.95rem] md:text-[1.05rem] leading-relaxed mb-10 max-w-lg mx-auto">
            The destination you're attempting to access doesn't exist within this architecture. It may have been permanently relocated or deleted from the server.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/" 
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return Home
            </Link>

            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center"
            >
              System Login
            </Link>
          </div>
        </div>

      </div>

      {/* Edge Gradients for clean fade-offs */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#fafafa] to-transparent pointer-events-none z-0"></div>
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#fafafa] to-transparent pointer-events-none z-0"></div>

    </div>
  );
};

export default NotFound;
