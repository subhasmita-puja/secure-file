import { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { gsap } from "gsap";

function Login({ onLogin, onRegister }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authStatus, setAuthStatus] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);

  // Animation Refs
  const formContainerRef = useRef(null);
  const visualStateRef = useRef(null);
  const lockGroupRef = useRef(null);
  const floatingLockRef = useRef(null); // Added ref for the orbiting lock

  useEffect(() => {
    // Initial entrance ambient animation for the form
    gsap.fromTo(
      formContainerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
    );

    // Continuous floating animation for the lock and cloud
    gsap.to(visualStateRef.current, {
      y: -15,
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    // Orbiting lock animation around the form container
    const animateOrbitingLock = () => {
      if (!formContainerRef.current || !floatingLockRef.current) return;
      
      const offset = 24; // Distance the lock stays outside the form's border
      const width = formContainerRef.current.offsetWidth + offset;
      const height = formContainerRef.current.offsetHeight + offset;

      // Reset any existing animations on resize to prevent glitching
      gsap.killTweensOf(floatingLockRef.current);
      gsap.set(floatingLockRef.current, { x: -offset, y: -offset });

      // Path around the 4 corners of the form
      gsap.to(floatingLockRef.current, {
        keyframes: [
          { x: width, y: -offset, duration: 3, ease: "none" },
          { x: width, y: height, duration: 3, ease: "none" },
          { x: -offset, y: height, duration: 3, ease: "none" },
          { x: -offset, y: -offset, duration: 3, ease: "none" }
        ],
        repeat: -1,
      });
    };

    // Delay slightly to ensure DOM layout is painted before calculating bounds
    setTimeout(animateOrbitingLock, 100);
    window.addEventListener("resize", animateOrbitingLock);
    return () => window.removeEventListener("resize", animateOrbitingLock);
  }, []);

  useEffect(() => {
    // Orchestrate animation during authentication
    if (authStatus === "authenticating") {
      gsap.to(lockGroupRef.current, {
        scale: 1.1,
        rotationY: 180,
        duration: 1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    } else if (authStatus === "success") {
      gsap.killTweensOf(lockGroupRef.current);
      gsap.to(lockGroupRef.current, {
        scale: 1.2,
        rotationY: 0,
        filter: "drop-shadow(0 0 40px rgba(34,211,238,1))",
        duration: 0.5,
      });
    } else {
      gsap.killTweensOf(lockGroupRef.current);
      gsap.to(lockGroupRef.current, {
        scale: 1,
        rotationY: 0,
        duration: 0.5,
      });
    }
  }, [authStatus]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setAuthStatus("authenticating");

    try {
      const response = await api.post("/auth/login", form);
      const token = response.data.data.token;
      
      sessionStorage.setItem("token", token);
      
      setTimeout(() => {
        setAuthStatus("success");
        onLogin();
      }, 1500);

    } catch (error) {
      setError(
        error.response?.data?.message || "Authentication breach detected. Verify credentials."
      );
      setAuthStatus("idle");
      setLoading(false);
      
      // Error shake
      gsap.fromTo(
        formContainerRef.current,
        { x: -8 },
        { x: 8, duration: 0.1, yoyo: true, repeat: 5, ease: "power1.inOut" }
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-[#03050d] font-sans text-slate-200 overflow-hidden flex items-center justify-center lg:justify-end lg:pr-32">
      
      {/* BACKGROUND STAGE: Full Page 3D Neon Environment */}
      <div className="absolute inset-0 z-0 flex items-center justify-center lg:justify-start lg:pl-[10%] overflow-hidden pointer-events-none" style={{ perspective: '1200px' }}>
        
        {/* Ambient Background Glows */}
        <div className="absolute top-1/3 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-10 w-[600px] h-[300px] bg-purple-700/15 rounded-full blur-[150px]"></div>

       

        {/* Center Floating Composition (Cloud + Lock) */}
        <div ref={visualStateRef} className="relative z-10 flex flex-col items-center justify-center mt-[-60px] scale-75 sm:scale-100">
          {/* ViewBox expanded and filter area increased to prevent SVG clipping */}
          <svg width="400" height="260" viewBox="-30 -20 400 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] overflow-visible">
            <defs>
              <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="lock-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Neon Cloud Outline */}
            <path d="M90 190 C40 190 20 160 30 130 C35 110 50 95 70 90 C80 60 110 40 150 45 C170 20 210 20 230 45 C270 40 300 60 310 90 C330 95 345 110 350 130 C360 160 340 190 290 190 Z" 
                  stroke="#22d3ee" strokeWidth="5" fill="rgba(34,211,238,0.08)" filter="url(#neon-glow)" />
            <path d="M100 180 C60 180 40 155 50 130 C55 115 65 105 85 100 C95 75 120 60 155 65 C170 45 200 45 215 65 C250 60 275 75 285 100 C305 105 315 115 320 130 C330 155 310 180 270 180 Z" 
                  stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.6" />

            {/* Central Lock Group */}
            <g ref={lockGroupRef} style={{ transformOrigin: "190px 140px" }}>
              {/* Lock Shackle */}
              <path d="M155 120 V95 C155 75 225 75 225 95 V120" stroke="#22d3ee" strokeWidth="12" fill="none" strokeLinecap="round" filter="url(#neon-glow)" />
              <path d="M155 120 V95 C155 75 225 75 225 95 V120" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.9" />
              
              {/* Lock Body */}
              <rect x="135" y="115" width="110" height="85" rx="15" fill="url(#lock-grad)" stroke="#22d3ee" strokeWidth="3" filter="url(#neon-glow)" />
              
              {/* Lock Circuits / Details */}
              <circle cx="150" cy="130" r="3" fill="#67e8f9" />
              <circle cx="230" cy="130" r="3" fill="#67e8f9" />
              <circle cx="150" cy="185" r="3" fill="#67e8f9" />
              <circle cx="230" cy="185" r="3" fill="#67e8f9" />
              <path d="M145 150 H160 M220 150 H235 M145 165 H155 M225 165 H235" stroke="#22d3ee" strokeWidth="2" opacity="0.6" />

              {/* Glowing Keyhole */}
              <path d="M190 145 C182 145 175 152 175 160 C175 165 178 170 183 173 L180 188 H200 L197 173 C202 170 205 165 205 160 C205 152 198 145 190 145 Z" fill="#a5f3fc" filter="url(#neon-glow)" />
              <path d="M190 148 C184 148 179 153 179 160 C179 164 182 168 185 170 L183 185 H197 L195 170 C198 168 201 164 201 160 C201 153 196 148 190 148 Z" fill="#ffffff" />
            </g>
          </svg>
        </div>

        {/* The 3D Podium */}
        <div className="absolute top-[55%] flex flex-col items-center z-0 scale-75 sm:scale-100">
          <div className="w-[340px] h-[80px] rounded-[100%] border-[3px] border-cyan-400 bg-[#061433] shadow-[0_0_40px_#22d3ee,inset_0_0_20px_#22d3ee] z-20"></div>
          <div className="w-[336px] h-[50px] bg-gradient-to-b from-[#061433] to-[#020617] mt-[-40px] border-x-2 border-cyan-900/40 rounded-b-[100%] z-10 shadow-[0_15px_30px_rgba(0,0,0,0.9)]"></div>
          <div className="w-[350px] h-[85px] rounded-[100%] border-2 border-cyan-600 bg-transparent shadow-[0_0_20px_#0891b2] mt-[-65px] z-0 opacity-70"></div>
          <div className="w-[380px] h-[90px] rounded-[100%] border border-cyan-900 bg-gradient-to-t from-cyan-900/30 to-transparent shadow-[0_0_40px_#164e63] mt-[-60px] -z-10"></div>
        </div>

        {/* Perspective Cyber Floor Grid - Expanded to full width */}
        <div 
          className="absolute bottom-0 w-[200vw] h-[45vh] border-t border-cyan-900/50 opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(transparent 95%, rgba(34,211,238,0.3) 100%),
              linear-gradient(90deg, transparent 95%, rgba(34,211,238,0.3) 100%)
            `,
            backgroundSize: '50px 50px',
            transform: 'rotateX(75deg) translateY(50px) translateZ(-50px)',
            maskImage: 'linear-gradient(to top, black 15%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 100%)'
          }}
        ></div>
      </div>

      {/* FOREGROUND FORM WRAPPER */}
      <div className="relative z-10 w-full max-w-md mx-4 lg:mx-0">
        
        {/* Orbiting Lock */}
        <div 
          ref={floatingLockRef} 
          className="absolute top-0 left-0 w-8 h-8 z-50 pointer-events-none drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]"
        >
          {/* <svg className="w-full h-full text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg> */}
        </div>

        {/* Form Container */}
        <div 
          ref={formContainerRef} 
          className="w-full p-8 sm:p-10 bg-[#03050d]/60 backdrop-blur-xl border border-cyan-500/20 rounded-3xl shadow-[0_0_50px_rgba(8,145,178,0.15)]"
        >
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-500">
              System Access
            </h1>
            <p className="text-cyan-600/70 mt-2 text-xs sm:text-sm font-semibold tracking-widest uppercase">
              Encrypted File Storage Node
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 relative group">
              <label htmlFor="email" className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@network.local"
                  required
                  className="w-full px-4 py-3 bg-[#02040a]/80 border border-cyan-900/50 rounded-xl text-cyan-50 placeholder-cyan-900/60 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all duration-300 shadow-inner"
                />
              </div>
            </div>

           
<div className="space-y-2 relative group">
              <label htmlFor="password" className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-[#02040a]/80 border border-cyan-900/50 rounded-xl text-cyan-50 placeholder-cyan-900/60 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all duration-300 shadow-inner pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-600/70 hover:text-cyan-400 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-red-400 text-sm backdrop-blur-md">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full relative overflow-hidden group py-4 px-6 bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold tracking-widest uppercase text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              
              <span className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                   Login...
                  </>
                ) : (
                  "Login"
                )}
              </span>
            </button>
          </form>

        <div className="mt-8 pt-6 border-t border-cyan-900/40 text-center">
            <button 
              type="button" 
              onClick={onRegister}
              className="group flex items-center justify-center mx-auto gap-2 text-cyan-600/70 hover:text-cyan-400 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Register Here
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default Login;