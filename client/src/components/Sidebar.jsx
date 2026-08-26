import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    key: "my-files",
    label: "My Files",
    sublabel: "Manage",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
  {
    key: "shared-files",
    label: "Shared Files",
    sublabel: "Public links",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
      </svg>
    ),
  },
];

function Sidebar({ activePage, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Escape-to-close + lock body scroll while the drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  // Auto-close the drawer if the window is resized into the desktop layout
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e) => { if (e.matches) setMobileOpen(false); };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const NavButton = ({ item }) => {
    const isActive = activePage === item.key;
    return (
      <button
        onClick={() => {
          onNavigate(item.key);
          setMobileOpen(false);
        }}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
          isActive
            ? "border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
            : "border border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/50 hover:text-slate-200"
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        )}
        <span className={isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}>
          {item.icon}
        </span>
        <span>
          <span className="block text-sm font-bold">{item.label}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            {item.sublabel}
          </span>
        </span>
      </button>
    );
  };

  const Brand = () => (
    <div className="flex items-center gap-3 px-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
        <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
          SECURE STORAGE
        </p>
        <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-700 font-bold">
          Encrypted Node
        </p>
      </div>
    </div>
  );

  const LogoutButton = () => (
    <button
      onClick={onLogout}
      className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 transition-all hover:border-red-400 hover:bg-red-500/20 hover:text-red-300"
    >
      Logout
    </button>
  );

  return (
    <>
      {/* Top bar — shown below lg */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-cyan-900/40 bg-[#03050d]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            {NAV_ITEMS.find((item) => item.key === activePage)?.label || "Menu"}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="rounded-lg border border-cyan-800/40 bg-cyan-500/10 p-2 text-cyan-400"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Off-canvas drawer — below lg */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 left-0 z-50 flex w-[80vw] max-w-[300px] flex-col border-r border-cyan-900/40 bg-[#03050d] px-4 py-6 shadow-2xl shadow-black/60 transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Brand />
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <NavButton key={item.key} item={item} />
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <LogoutButton />
        </div>
      </aside>

      {/* Fixed rail — lg and up */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-[260px] lg:flex-col lg:border-r lg:border-cyan-900/40 lg:bg-[#03050d]/80 lg:px-4 lg:py-6 lg:backdrop-blur-xl">
        <div className="mb-8">
          <Brand />
        </div>
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <NavButton key={item.key} item={item} />
          ))}
        </nav>
        <div className="mt-auto pt-6">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;