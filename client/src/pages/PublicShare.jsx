import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000";

function PublicShare() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const shareToken = window.location.pathname.split("/share/")[1];

  useEffect(() => {
    const fetchPublicFile = async () => {
      try {
        if (!shareToken) {
          setError("Invalid share link.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/files/public/${shareToken}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Public file not found."
          );
        }

        setFile(data.data);
      } catch (err) {
        setError(
          err.message || "Unable to load this public file."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPublicFile();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-cyan-400 text-sm font-bold tracking-[0.3em] uppercase">
            Secure Storage
          </div>

          <h1 className="mt-3 text-2xl font-bold">
            Loading shared file...
          </h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#05070d] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#0a0e18] p-8 text-center">
          <div className="text-red-400 text-sm font-bold tracking-[0.25em] uppercase">
            Public Share
          </div>

          <h1 className="mt-4 text-3xl font-bold">
            File unavailable
          </h1>

          <p className="mt-3 text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!file) {
    return null;
  }

 const isImage = file.mimeType?.startsWith("image/");
const isVideo = file.mimeType?.startsWith("video/");
const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="min-h-screen bg-[#05070d] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-cyan-400 text-sm font-bold tracking-[0.3em] uppercase">
            Secure Storage
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Public File
          </h1>

          <p className="mt-2 text-gray-400">
            This file was shared publicly.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-[#09101b] overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold break-all">
              {file.originalName}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {file.mimeType} •{" "}
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <div className="p-6">
            {isImage && (
              <div className="flex justify-center">
                <img
                  src={file.downloadUrl}
                  alt={file.originalName}
                  className="max-h-[70vh] max-w-full rounded-xl object-contain"
                />
              </div>
            )}
{isVideo && (
  <div className="flex justify-center">
    <video
      src={file.downloadUrl}
      controls
      playsInline
      preload="metadata"
      className="max-h-[70vh] w-full rounded-xl bg-black object-contain"
    >
      Your browser does not support video playback.
    </video>
  </div>
)}
            {isPdf && (
              <iframe
                src={file.downloadUrl}
                title={file.originalName}
                className="w-full h-[70vh] rounded-xl bg-white"
              />
            )}

        {!isImage && !isVideo && !isPdf && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
                <p className="text-gray-300">
                  Preview is not available for this file type.
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/10 flex justify-center">
            <a
              href={file.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-3 font-bold text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Download File
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicShare;