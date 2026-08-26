import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import { gsap } from "gsap";
import Sidebar from "../components/Sidebar";
import MyFiles from "./MyFiles";
import SharedFiles from "./SharedFiles";

const MAX_FILE_SIZE = 110 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".txt",
  ".mp4",
  ".webm",
  ".mov",
];

const getPageFromPath = () =>
  window.location.pathname.startsWith("/shared-files") ? "shared-files" : "my-files";

function Dashboard({ onLogout }) {
  const [activePage, setActivePage] = useState(getPageFromPath); // "my-files" | "shared-files"

  // Keep the URL in sync with the active tab, and vice versa
  const navigateToPage = (page) => {
    setActivePage(page);
    const path = page === "shared-files" ? "/shared-files" : "/my-files";
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  };

  useEffect(() => {
    // Normalize the root path on first load without adding a history entry
    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", activePage === "shared-files" ? "/shared-files" : "/my-files");
    }

    const onPopState = () => setActivePage(getPageFromPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [activeAction, setActiveAction] = useState("");
  const [copiedFileId, setCopiedFileId] = useState("");

  const [previewUrls, setPreviewUrls] = useState({});
const [deleteTarget, setDeleteTarget] = useState(null);

  const headerRef = useRef(null);

  /* =========================================================
     LOAD FILES
  ========================================================= */

  const loadFiles = async () => {
    try {
      setError("");
      const response = await api.get("/files");
      const loadedFiles = response.data.data || [];
      setFiles(loadedFiles);

      const previewableFiles = loadedFiles.filter(
        (file) =>
          file.mimeType?.startsWith("image/") ||
          file.mimeType?.startsWith("video/")
      );

      if (previewableFiles.length > 0) {
        const previewResults = await Promise.all(
          previewableFiles.map(async (file) => {
            try {
              const previewResponse = await api.get(
                `/files/${file._id}/download`
              );

              return {
                id: file._id,
                url: previewResponse.data.data.downloadUrl,
              };
            } catch {
              return {
                id: file._id,
                url: null,
              };
            }
          })
        );

        const previewMap = {};

        previewResults.forEach((item) => {
          if (item.url) {
            previewMap[item.id] = item.url;
          }
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

  useEffect(() => {
    loadFiles();

    const context = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        );
      }
    });

    return () => context.revert();
  }, []);

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
      return "Only PDF, PNG, JPG/JPEG, TXT, MP4, WEBM, and MOV files are allowed.";
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
useEffect(() => {
  if (!deleteTarget) return;
  const onKeyDown = (e) => { if (e.key === "Escape") setDeleteTarget(null); };
  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [deleteTarget]);

const handleDelete = (fileId) => {
  const file = files.find((f) => f._id === fileId);
  setDeleteTarget(file || { _id: fileId, originalName: "this file" });
};

const cancelDelete = () => setDeleteTarget(null);

const confirmDelete = async () => {
  if (!deleteTarget) return;
  const fileId = deleteTarget._id;
  setDeleteTarget(null);

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

      return updatedFile;
    } catch (error) {
      setError(error.response?.data?.message || "Unable to change file visibility.");
      return null;
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

  /* Share = make public (if needed) then copy the link — used from My Files */
  const handleShare = async (file) => {
    try {
      setError("");
      let target = file;

      if (!file.isPublic) {
        setActiveAction(`share-${file._id}`);
        const response = await api.patch(`/files/${file._id}/visibility`);
        const updatedFile = response.data.data;

        target = {
          ...file,
          isPublic: updatedFile.isPublic,
          shareToken: updatedFile.shareToken || file.shareToken,
        };

        setFiles((prev) =>
          prev.map((f) => (f._id === file._id ? { ...f, ...target } : f))
        );
      }

      if (!target.shareToken) {
        setError("Share link is unavailable for this file.");
        return;
      }

      await navigator.clipboard.writeText(getShareUrl(target.shareToken));
      setCopiedFileId(file._id);
      setTimeout(() => setCopiedFileId(""), 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Unable to share this file.");
    } finally {
      setActiveAction("");
    }
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index] || "GB"}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Unknown";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getFileCategory = (file) => {
    const mimeType = file.mimeType || "";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType === "application/pdf") return "document";
    if (mimeType === "text/plain") return "text";
    return "document";
  };

  return (
  <div className="relative min-h-screen overflow-x-hidden bg-[#03050d] text-slate-200 font-sans">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute left-[-10%] top-[-10%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-purple-700/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[150px]" />
      </div>

      <Sidebar activePage={activePage} onNavigate={navigateToPage} onLogout={onLogout} />

<div ref={headerRef} className="relative z-10 lg:pl-[260px]">
        <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
          {error && (
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300 backdrop-blur-md shadow-lg shadow-red-900/20">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3h.008M10.29 3.86l-7.5 13A1.5 1.5 0 004.09 19h15.82a1.5 1.5 0 001.3-2.25l-7.5-13a1.5 1.5 0 00-2.6 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {activePage === "my-files" ? (
            <MyFiles
              files={files}
              loading={loading}
              uploading={uploading}
              uploadProgress={uploadProgress}
              activeAction={activeAction}
              copiedFileId={copiedFileId}
              previewUrls={previewUrls}
              handleUpload={handleUpload}
              handleDownload={handleDownload}
              handleDelete={handleDelete}
              handleShare={handleShare}
              handleToggleVisibility={handleToggleVisibility}
              handleCopyShareLink={handleCopyShareLink}
              formatBytes={formatBytes}
              formatDate={formatDate}
              getFileCategory={getFileCategory}
            />
          ) : (
            <SharedFiles
              files={files}
              loading={loading}
              activeAction={activeAction}
              copiedFileId={copiedFileId}
              previewUrls={previewUrls}
              getFileCategory={getFileCategory}
              handleCopyShareLink={handleCopyShareLink}
              handleDownload={handleDownload}
              handleToggleVisibility={handleToggleVisibility}
              formatBytes={formatBytes}
              getShareUrl={getShareUrl}
            />
          )}
        </main>
      </div>
      {deleteTarget && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={cancelDelete} />
    <div className="relative w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#0a1220] p-6 shadow-2xl shadow-red-950/40">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-slate-100">Delete this file?</h3>
      <p className="mt-1.5 text-sm text-slate-400">
        <span className="font-semibold text-slate-300">{deleteTarget.originalName}</span> will be permanently removed. This action can't be undone.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={cancelDelete} className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-800/60">
          Cancel
        </button>
        <button onClick={confirmDelete} className="flex-1 rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-2.5 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/25">
          Delete
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default Dashboard;