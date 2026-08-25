import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import { gsap } from "gsap";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".txt",
];

function Dashboard({ onLogout }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [activeAction, setActiveAction] = useState("");
  const [copiedFileId, setCopiedFileId] = useState("");

  const [previewUrls, setPreviewUrls] = useState({});

  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const listRef = useRef(null);

  /* =========================================================
     LOAD FILES
  ========================================================= */

  const loadFiles = async () => {
    try {
      setError("");
      const response = await api.get("/files");
      const loadedFiles = response.data.data || [];
      setFiles(loadedFiles);

      const imageFiles = loadedFiles.filter(
        (file) => file.mimeType?.startsWith("image/")
      );

      if (imageFiles.length > 0) {
        const previewResults = await Promise.all(
          imageFiles.map(async (file) => {
            try {
              const previewResponse = await api.get(`/files/${file._id}/download`);
              return { id: file._id, url: previewResponse.data.data.downloadUrl };
            } catch {
              return { id: file._id, url: null };
            }
          })
        );

        const previewMap = {};
        previewResults.forEach((item) => {
          if (item.url) previewMap[item.id] = item.url;
        });
        setPreviewUrls(previewMap);
      } else {
        setPreviewUrls({});
      }
    } catch (error) {
      if (error.response?.status === 401) {
        onLogout();
        return;
      }
      setError(error.response?.data?.message || "Unable to load your files.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL ANIMATION
  ========================================================= */

  useEffect(() => {
    loadFiles();

    const context = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -30 },
          { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
        );
      }

      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, delay: 0.2, ease: "power3.out" }
        );
      }
    });

    return () => context.revert();
  }, []);

  /* =========================================================
     FILE LIST ANIMATION
  ========================================================= */

  useEffect(() => {
    if (!files.length || !listRef.current) return;

    gsap.fromTo(
      listRef.current.children,
      { opacity: 0, y: 25, rotationX: 8, transformPerspective: 800 },
      { opacity: 1, y: 0, rotationX: 0, stagger: 0.08, duration: 0.6, ease: "back.out(1.5)" }
    );
  }, [files]);

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateFile = (file) => {
    if (!file) return "Please select a file.";
    if (file.size === 0) return "Empty files cannot be uploaded.";
    if (file.size > MAX_FILE_SIZE) return "File size must not exceed 100 MB.";

    const extension = file.name.includes(".")
      ? `.${file.name.split(".").pop().toLowerCase()}`
      : "";

    const validMimeType = ALLOWED_TYPES.includes(file.type);
    const validExtension = ALLOWED_EXTENSIONS.includes(extension);

    if (!validMimeType && !validExtension) {
      return "Only PDF, PNG, JPG/JPEG, and TXT files are allowed.";
    }
    return "";
  };

  /* =========================================================
     UPLOAD
  ========================================================= */

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setUploadProgress(0);
      setError("");

      await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setUploadProgress(100);
      await loadFiles();
      event.target.value = "";
    } catch (error) {
      setError(error.response?.data?.message || "File upload failed.");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handleDownload = async (fileId) => {
    try {
      setActiveAction(`download-${fileId}`);
      setError("");
      const response = await api.get(`/files/${fileId}/download`);
      window.open(response.data.data.downloadUrl, "_blank");
    } catch (error) {
      setError(error.response?.data?.message || "Unable to download the file.");
    } finally {
      setActiveAction("");
    }
  };

  const handleDelete = async (fileId) => {
    const confirmed = window.confirm("Are you sure you want to permanently delete this file?");
    if (!confirmed) return;

    try {
      setActiveAction(`delete-${fileId}`);
      setError("");
      await api.delete(`/files/${fileId}`);
      setFiles((prev) => prev.filter((file) => file._id !== fileId));
      setPreviewUrls((prev) => {
        const updated = { ...prev };
        delete updated[fileId];
        return updated;
      });
    } catch (error) {
      setError(error.response?.data?.message || "Unable to delete the file.");
    } finally {
      setActiveAction("");
    }
  };

  const handleToggleVisibility = async (fileId) => {
    try {
      setActiveAction(`visibility-${fileId}`);
      setError("");
      const response = await api.patch(`/files/${fileId}/visibility`);
      const updatedFile = response.data.data;

      setFiles((prev) =>
        prev.map((file) =>
          file._id === fileId
            ? { ...file, isPublic: updatedFile.isPublic, shareToken: updatedFile.shareToken || file.shareToken }
            : file
        )
      );
    } catch (error) {
      setError(error.response?.data?.message || "Unable to change file visibility.");
    } finally {
      setActiveAction("");
    }
  };

  const getShareUrl = (shareToken) => `${window.location.origin}/share/${shareToken}`;

  const handleCopyShareLink = async (file) => {
    if (!file.shareToken) {
      setError("Share link is unavailable for this file.");
      return;
    }
    try {
      await navigator.clipboard.writeText(getShareUrl(file.shareToken));
      setCopiedFileId(file._id);
      setTimeout(() => setCopiedFileId(""), 2000);
    } catch {
      setError("Unable to copy the share link.");
    }
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const totalSize = files.reduce((total, file) => total + Number(file.size || 0), 0);
  const publicCount = files.filter((file) => file.isPublic).length;
  const privateCount = files.length - publicCount;

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index] || "GB"}`;
  };

  const getFileExtension = (fileName) => {
    if (!fileName?.includes(".")) return "FILE";
    return fileName.split(".").pop().toUpperCase();
  };

  const isImage = (file) => file.mimeType?.startsWith("image/");
  const isPdf = (file) => file.mimeType === "application/pdf";
  const isText = (file) => file.mimeType === "text/plain";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03050d] text-slate-200 font-sans">
      
      {/* Background Ambience */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute left-[-10%] top-[-10%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-purple-700/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[150px]" />
      </div>

      {/* Header */}
      <header ref={headerRef} className="relative z-10 border-b border-cyan-900/40 bg-[#03050d]/80 px-4 py-4 md:px-8 md:py-5 backdrop-blur-xl sticky top-0">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <svg className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                SECURE STORAGE
              </h1>
              <p className="hidden md:block mt-0.5 text-[10px] uppercase tracking-[0.25em] text-cyan-600 font-bold">
                Encrypted Node Uplink
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="group relative overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider text-red-400 transition-all hover:border-red-400 hover:bg-red-500/20 hover:text-red-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
        
        {/* Intro */}
        <div className="mb-8">
          <p className="mb-1 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-cyan-500">
            Command Center
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Dashboard Overview
          </h2>
        </div>

        {/* Statistics Grid */}
        <div ref={statsRef} className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Files", value: files.length, color: "cyan" },
            { label: "Storage Used", value: formatBytes(totalSize), color: "blue" },
            { label: "Public Access", value: publicCount, color: "purple" },
            { label: "Private Vault", value: privateCount, color: "emerald" },
          ].map((stat, idx) => (
            <div key={idx} className={`relative overflow-hidden rounded-2xl border border-${stat.color}-500/20 bg-[#07101d]/60 p-5 backdrop-blur-xl shadow-lg group hover:border-${stat.color}-500/40 transition-colors`}>
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-${stat.color}-500/10 blur-[30px] group-hover:bg-${stat.color}-500/20 transition-all`} />
              <p className="relative z-10 text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
              <p className={`relative z-10 mt-2 text-2xl md:text-3xl font-extrabold text-${stat.color}-400`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300 backdrop-blur-md shadow-lg shadow-red-900/20">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3h.008M10.29 3.86l-7.5 13A1.5 1.5 0 004.09 19h15.82a1.5 1.5 0 001.3-2.25l-7.5-13a1.5 1.5 0 00-2.6 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[340px_1fr] items-start">
          
          {/* =================================================
              UPLOAD PANEL
          ================================================= */}
          <section className="sticky top-28 rounded-3xl border border-cyan-800/40 bg-[#07101d]/60 p-6 shadow-[0_0_40px_rgba(8,145,178,0.08)] backdrop-blur-xl">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">Uplink Ready</p>
              </div>
              <h3 className="text-xl font-extrabold text-white">Upload File</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Supported formats: PDF, PNG, JPG/JPEG, TXT.<br />Max size: <span className="text-cyan-400 font-bold">100 MB</span>.
              </p>
            </div>

            <label className={`group relative block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all ${uploading ? "cursor-not-allowed border-cyan-900 bg-cyan-950/20" : "border-cyan-700/50 bg-[#0a1628]/50 hover:border-cyan-400 hover:bg-[#0c1b33] hover:shadow-[0_0_25px_rgba(34,211,238,0.1)]"}`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="font-bold text-cyan-300 text-sm">
                {uploading ? "Transmitting Data..." : "Select File for Upload"}
              </p>
              <p className="mt-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Browse Device</p>
              <input type="file" onChange={handleUpload} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg,.txt" hidden />
            </label>

            {uploading && (
              <div className="mt-6 p-4 rounded-xl bg-black/40 border border-cyan-900/50">
                <div className="mb-2 flex items-center justify-between text-[10px]">
                  <span className="font-bold uppercase tracking-wider text-cyan-500">Progress</span>
                  <span className="font-extrabold text-cyan-300">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </section>

          {/* =================================================
              FILES GRID
          ================================================= */}
          <section>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-800/50 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">Encrypted Directory</p>
                <h3 className="mt-1 text-2xl font-extrabold text-white">My Files</h3>
              </div>
              <p className="text-xs font-semibold text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-cyan-400">{files.length}</span> Indexed
              </p>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-cyan-900/30 bg-[#07101d]/60 p-16 text-center backdrop-blur-xl">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-900 border-t-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                <p className="text-xs font-semibold tracking-widest uppercase text-slate-500">Scanning Vault...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-cyan-900/50 bg-[#07101d]/40 p-16 text-center backdrop-blur-xl flex flex-col items-center justify-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-950/30">
                  <svg className="h-10 w-10 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-300">Vault is Empty</h4>
                <p className="mt-2 text-xs text-slate-500 max-w-xs">Initialize your node by uploading a file from the command panel.</p>
              </div>
            ) : (
              /* THE NEW RESPONSIVE CARD GRID */
              <div ref={listRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {files.map((file) => {
                  const isDownloading = activeAction === `download-${file._id}`;
                  const isDeleting = activeAction === `delete-${file._id}`;
                  const isChangingVisibility = activeAction === `visibility-${file._id}`;

                  return (
                    <div key={file._id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1220]/90 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-700/50 hover:bg-[#0d182b] hover:shadow-[0_10px_30px_rgba(8,145,178,0.15)]">
                      
                      {/* --- Visual Preview Header --- */}
                      <div className="relative aspect-video w-full overflow-hidden bg-[#02050a] border-b border-slate-800/50">
                        {isImage(file) && previewUrls[file._id] ? (
                          <>
                            <img src={previewUrls[file._id]} alt={file.originalName} className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/90 via-transparent to-transparent" />
                          </>
                        ) : (
                          <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${isPdf(file) ? 'from-red-500/10' : isText(file) ? 'from-cyan-500/10' : 'from-purple-500/10'} via-[#050b14] to-[#02050a]`}>
                             <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${isPdf(file) ? 'border-red-500/20 bg-red-500/10 text-red-400' : isText(file) ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400' : 'border-purple-500/20 bg-purple-500/10 text-purple-400'}`}>
                                <span className="text-sm font-extrabold uppercase tracking-wider">{getFileExtension(file.originalName)}</span>
                             </div>
                          </div>
                        )}

                        {/* Privacy Badge overlayed on image */}
                        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                          <span className={`h-1.5 w-1.5 rounded-full ${file.isPublic ? 'bg-purple-400 shadow-[0_0_5px_#a855f7]' : 'bg-emerald-400 shadow-[0_0_5px_#34d399]'}`} />
                          {file.isPublic ? "Public" : "Private"}
                        </div>
                      </div>

                      {/* --- Card Details --- */}
                      <div className="flex flex-col flex-grow p-4">
                        <h4 className="truncate text-sm font-bold text-slate-200" title={file.originalName}>
                          {file.originalName}
                        </h4>
                        
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          <span className="truncate max-w-[50%]">{file.mimeType.split('/')[1] || file.mimeType}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-700" />
                          <span>{formatBytes(file.size)}</span>
                        </div>

                        {/* Public Share URL Box */}
                        {file.isPublic && file.shareToken && (
                          <div className="mt-3 flex items-center justify-between rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2">
                            <p className="truncate text-[10px] text-purple-300/70 w-3/4">
                              {getShareUrl(file.shareToken)}
                            </p>
                            <button onClick={() => handleCopyShareLink(file)} className="text-purple-400 hover:text-purple-300 p-1" title="Copy Link">
                              {copiedFileId === file._id ? (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              )}
                            </button>
                          </div>
                        )}

                        <div className="mt-auto" /> {/* Pushes actions to the bottom */}
                        
                        {/* --- Compact Action Bar --- */}
                        <div className="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-slate-800/60">
                          
                          {/* Download Button */}
                          <button
                            onClick={() => handleDownload(file._id)}
                            disabled={activeAction !== "" || isDownloading}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/10 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download File"
                          >
                            {isDownloading ? (
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            )}
                            <span className="hidden sm:inline lg:hidden xl:inline">DL</span>
                          </button>

                          {/* Visibility Toggle Button */}
                          <button
                            onClick={() => handleToggleVisibility(file._id)}
                            disabled={activeAction !== "" || isChangingVisibility}
                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${file.isPublic ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"}`}
                            title={file.isPublic ? "Make Private" : "Make Public"}
                          >
                            {isChangingVisibility ? (
                               <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : file.isPublic ? (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.53 9.47l.94.94M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(file._id)}
                            disabled={activeAction !== "" || isDeleting}
                            className="flex items-center justify-center rounded-lg bg-red-500/10 px-3 py-2 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Permanently Delete File"
                          >
                            {isDeleting ? (
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;