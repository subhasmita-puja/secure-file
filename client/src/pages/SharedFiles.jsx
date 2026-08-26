function SharedFiles({
  files,
  loading,
  activeAction,
  copiedFileId,
  previewUrls,
  getFileCategory,
  handleCopyShareLink,
  handleDownload,
  handleToggleVisibility,
  formatBytes,
  getShareUrl,
}) {
  const publicFiles = files.filter((file) => file.isPublic);
  const activeLinks = publicFiles.filter((file) => file.shareToken).length;
  const totalSharedSize = publicFiles.reduce((total, file) => total + Number(file.size || 0), 0);

  return (
    <section>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500">
          Public Distribution
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Shared Files
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Files you've made publicly accessible
        </p>
      </div>

      {/* KPI Section */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Public Files", value: publicFiles.length, color: "purple" },
          { label: "Active Links", value: activeLinks, color: "cyan" },
          { label: "Total Shared", value: formatBytes(totalSharedSize), color: "emerald" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl border border-${stat.color}-500/20 bg-[#07101d]/60 p-5 backdrop-blur-xl shadow-lg`}
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-${stat.color}-500/10 blur-[30px]`} />
            <p className="relative z-10 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
            <p className={`relative z-10 mt-2 text-2xl md:text-3xl font-extrabold text-${stat.color}-400`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-cyan-900/30 bg-[#07101d]/60 p-16 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-900 border-t-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-500">Loading shared files...</p>
        </div>
      ) : publicFiles.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-cyan-900/50 bg-[#07101d]/40 p-16 text-center backdrop-blur-xl">
          <h4 className="text-lg font-bold text-slate-300">Nothing shared yet</h4>
          <p className="mt-2 text-xs text-slate-500">
            Make a file public from "My Files" to generate a shareable link.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {publicFiles.map((file) => {
            const isChangingVisibility = activeAction === `visibility-${file._id}`;
            const isDownloading = activeAction === `download-${file._id}`;

            const category = getFileCategory ? getFileCategory(file) : "";
            const isImage = category === "image" || file.mimeType?.startsWith("image/");
            const isVideo = category === "video" || file.mimeType?.startsWith("video/");
            const isPdf = file.mimeType === "application/pdf";
            const previewUrl = previewUrls?.[file._id];

            const accent = isPdf
              ? { border: "border-red-500/20", bg: "bg-red-500/10", text: "text-red-400", from: "from-red-500/10" }
              : category === "text"
              ? { border: "border-cyan-500/20", bg: "bg-cyan-500/10", text: "text-cyan-400", from: "from-cyan-500/10" }
              : { border: "border-purple-500/20", bg: "bg-purple-500/10", text: "text-purple-400", from: "from-purple-500/10" };

            return (
              <div
                key={file._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1220]/90 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-700/50 hover:shadow-[0_10px_30px_rgba(168,85,247,0.12)]"
              >
                {/* Preview area */}
                <button
                  type="button"
                  onClick={() => handleDownload(file._id)}
                  className="relative block aspect-video w-full overflow-hidden border-b border-slate-800/50 bg-[#02050a] text-left"
                  title="Open file"
                >
                  {isImage && previewUrl ? (
                    <>
                      <img
                        src={previewUrl}
                        alt={file.originalName}
                        className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/90 via-transparent to-transparent" />
                    </>
                  ) : isVideo && previewUrl ? (
                    <div className="relative h-full w-full bg-black">
                      <video
                        src={previewUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-contain"
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
                          <svg className="h-4 w-4 translate-x-[1px] text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${accent.from} via-[#050b14] to-[#02050a]`}>
                      <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border ${accent.border} ${accent.bg} ${accent.text}`}>
                        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                          {(file.originalName?.split(".").pop() || "FILE").slice(0, 4)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-300 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_5px_#a855f7]" />
                    Public
                  </div>
                </button>

                {/* Details */}
                <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                  <p className="truncate text-sm font-bold text-slate-200" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <span>{(file.mimeType || "").split("/")[1] || file.mimeType}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span>{formatBytes(file.size)}</span>
                  </p>

                  {/* Share link box */}
                  {file.shareToken && (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-purple-500/20 bg-purple-500/5 px-2.5 py-2">
                      <p className="truncate text-[10px] text-purple-300/70 w-3/4">
                        {getShareUrl(file.shareToken)}
                      </p>
                      <button onClick={() => handleCopyShareLink(file)} className="p-1 text-purple-400 hover:text-purple-300" title="Copy Link">
                        {copiedFileId === file._id ? (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="mt-auto" />

                  {/* Action bar */}
                  <div className="mt-3.5 grid grid-cols-3 gap-1.5 border-t border-slate-800/60 pt-3 sm:gap-2">
                    <button
                      onClick={() => handleCopyShareLink(file)}
                      disabled={!file.shareToken}
                      className="flex items-center justify-center gap-1 rounded-lg bg-cyan-500/10 px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-cyan-400 transition-colors hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed sm:text-[10px]"
                      title="Copy Link"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      <span className="hidden sm:inline">{copiedFileId === file._id ? "Copied!" : "Copy"}</span>
                    </button>

                    <button
                      onClick={() => window.open(getShareUrl(file.shareToken), "_blank")}
                      disabled={!file.shareToken || isDownloading}
                      className="flex items-center justify-center gap-1 rounded-lg bg-blue-500/10 px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed sm:text-[10px]"
                      title="Open"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      <span className="hidden sm:inline">Open</span>
                    </button>

                    <button
                      onClick={() => handleToggleVisibility(file._id)}
                      disabled={activeAction !== "" || isChangingVisibility}
                      className="flex items-center justify-center gap-1 rounded-lg bg-red-500/10 px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed sm:text-[10px]"
                      title="Make Private"
                    >
                      {isChangingVisibility ? (
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.53 9.47l.94.94M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          <span className="hidden sm:inline">Private</span>
                        </>
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
  );
}

export default SharedFiles;