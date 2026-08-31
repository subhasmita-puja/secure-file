import { useMemo, useState } from "react";
const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024; // 1 GB
const FILTERS = [
  { key: "all", label: "All Files" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "document", label: "Documents" },
  { key: "text", label: "Text" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "name-asc", label: "Name A-Z" },
  { key: "name-desc", label: "Name Z-A" },
  { key: "largest", label: "Largest" },
  { key: "smallest", label: "Smallest" },
];

function MyFiles({
  files,
  loading,

  // Upload state
  uploading,
  uploadProgress,
  selectedFiles,
  removeSelectedFile,
  clearSelectedFiles,
  uploadSelectedFiles,

  // File actions
  activeAction,
  copiedFileId,
  previewUrls,
  handleUpload,
  handleDownload,
  handleDelete,
  handleShare,
  handleToggleVisibility,
  handleCopyShareLink,

  // Helpers
  formatBytes,
  formatDate,
  getFileCategory,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fileInputId = "my-files-upload-input";

  const totalSize = files.reduce(
    (total, file) =>
      total + Number(file.size || 0),
    0
  );
const remainingStorage = Math.max(
  STORAGE_QUOTA_BYTES - totalSize,
  0
);

const storageUsagePercent = Math.min(
  (totalSize / STORAGE_QUOTA_BYTES) * 100,
  100
);
  const selectedTotalSize = selectedFiles.reduce(
    (total, file) =>
      total + Number(file.size || 0),
    0
  );

  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (search.trim()) {
      const query = search
        .trim()
        .toLowerCase();

      result = result.filter((file) =>
        file.originalName
          ?.toLowerCase()
          .includes(query)
      );
    }

    if (filter !== "all") {
      result = result.filter(
        (file) =>
          getFileCategory(file) === filter
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.createdAt || 0) -
            new Date(b.createdAt || 0)
          );

        case "name-asc":
          return (
            a.originalName || ""
          ).localeCompare(
            b.originalName || ""
          );

        case "name-desc":
          return (
            b.originalName || ""
          ).localeCompare(
            a.originalName || ""
          );

        case "largest":
          return (
            Number(b.size || 0) -
            Number(a.size || 0)
          );

        case "smallest":
          return (
            Number(a.size || 0) -
            Number(b.size || 0)
          );

        case "newest":
        default:
          return (
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
          );
      }
    });

    return result;
  }, [
    files,
    search,
    filter,
    sortBy,
    getFileCategory,
  ]);

  return (
    <section>
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500">
          Command Center
        </p>

        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          My Files
        </h2>
      </div>

      {/* =====================================================
          SEARCH + UPLOAD
      ====================================================== */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search files..."
            className="w-full rounded-xl border border-slate-800 bg-[#07101d]/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-cyan-500/50 focus:bg-[#0a1220]"
          />
        </div>

        {/* Upload button */}
        <label
          htmlFor={fileInputId}
          className={`flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${
            uploading
              ? "cursor-not-allowed border-cyan-900 bg-cyan-950/20 text-cyan-700"
              : "border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>

          {uploading
            ? `Uploading ${uploadProgress}%`
            : "Upload File"}

          <input
            id={fileInputId}
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.txt,.mp4,.webm,.mov"
            hidden
          />
        </label>
      </div>

      {/* =====================================================
          SELECTED FILES
      ====================================================== */}
      {selectedFiles.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-cyan-900/50 bg-[#07101d]/80 shadow-lg backdrop-blur-xl">

          {/* Selected files header */}
          <div className="flex flex-col gap-3 border-b border-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 13h6m-3-3v6m8-8V8a2 2 0 00-2-2h-3.5L13 4.5A2 2 0 0011.586 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-3"
                    />
                  </svg>
                </div>

                <p className="text-sm font-bold text-slate-200">
                  Selected Files
                </p>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  {selectedFiles.length}
                </span>
              </div>

              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {formatBytes(selectedTotalSize)} ready to upload
              </p>
            </div>

            {/* Cancel all */}
            <button
              type="button"
              onClick={clearSelectedFiles}
              disabled={uploading}
              className="self-start rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
            >
              Cancel All
            </button>
          </div>

          {/* Selected files list */}
          <div className="max-h-72 overflow-y-auto p-3">
            <div className="space-y-2">
              {selectedFiles.map(
                (file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-black/20 p-3 transition-colors hover:border-slate-700"
                  >
                    {/* File icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 3v6h6"
                        />
                      </svg>
                    </div>

                    {/* File information */}
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xs font-bold text-slate-200"
                        title={file.name}
                      >
                        {file.name}
                      </p>

                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        {formatBytes(file.size)}
                        <span className="mx-1.5 text-slate-700">
                          •
                        </span>
                        {file.type ||
                          "Unknown type"}
                      </p>
                    </div>

                    {/* Cancel individual file */}
                    <button
                      type="button"
                      onClick={() =>
                        removeSelectedFile(index)
                      }
                      disabled={uploading}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-2 text-[9px] font-bold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Remove this file"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>

                      <span className="hidden sm:inline">
                        Cancel
                      </span>
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Upload selected files */}
          <div className="border-t border-slate-800/60 p-4">
            <button
              type="button"
              onClick={uploadSelectedFiles}
              disabled={
                uploading ||
                selectedFiles.length === 0
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-cyan-300 transition-all hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>

                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>

                  Upload{" "}
                  {selectedFiles.length}{" "}
                  {selectedFiles.length === 1
                    ? "File"
                    : "Files"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          UPLOAD PROGRESS
      ====================================================== */}
      {uploading && (
        <div className="mb-5 rounded-xl border border-cyan-900/50 bg-black/40 p-3.5">

          <div className="mb-2 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-cyan-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />

              Uploading
            </span>

            <span className="font-extrabold text-cyan-300">
              {uploadProgress}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
              style={{
                width: `${uploadProgress}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* =====================================================
          FILTERS + SORT
      ====================================================== */}
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-800/50 pb-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              onClick={() =>
                setFilter(item.key)
              }
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === item.key
                  ? "border border-cyan-400/30 bg-cyan-500/15 text-cyan-300"
                  : "border border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Sort by:
          </span>

          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value)
            }
            className="rounded-lg border border-slate-800 bg-[#07101d]/80 px-3 py-1.5 text-xs font-bold text-slate-200 outline-none focus:border-cyan-500/50"
          >
            {SORT_OPTIONS.map(
              (option) => (
                <option
                  key={option.key}
                  value={option.key}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
      ====================================================== */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">

        <span className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5">
          <span className="text-cyan-400">
            {filteredFiles.length}
          </span>{" "}
          Files
        </span>

        <span className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5">
          <span className="text-cyan-400">
            {formatBytes(totalSize)}
          </span>{" "}
          used
        </span>
            {/* Remaining storage */}
    <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
      <span className="text-emerald-400">
        {formatBytes(remainingStorage)}
      </span>{" "}
      remaining
    </span>

    {/* Total quota */}
    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-600">
      {formatBytes(STORAGE_QUOTA_BYTES)} total storage
    </span>
      </div>
 {/* Storage progress */}
  <div className="mt-4">

    <div className="mb-1.5 flex items-center justify-between">

      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
        Storage usage
      </span>

      <span className="text-[10px] font-bold text-cyan-400">
        {storageUsagePercent.toFixed(1)}%
      </span>

    </div>

    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
        style={{
          width: `${storageUsagePercent}%`,
        }}
      />

    </div>

    <div className="mt-1.5 flex justify-between text-[9px] font-semibold text-slate-600">

      <span>
        {formatBytes(totalSize)} used
      </span>

      <span>
        {formatBytes(remainingStorage)} available
      </span>

    </div>

  </div>
      {/* =====================================================
          FILE LIST
      ====================================================== */}
      {loading ? (
        <div className="rounded-3xl border border-cyan-900/30 bg-[#07101d]/60 p-16 text-center backdrop-blur-xl">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-900 border-t-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />

          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Scanning Vault...
          </p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-cyan-900/50 bg-[#07101d]/40 p-16 text-center backdrop-blur-xl">

          <h4 className="text-lg font-bold text-slate-300">
            No files found
          </h4>

          <p className="mt-2 text-xs text-slate-500">
            {files.length === 0
              ? "Upload your first file to get started."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">

          {filteredFiles.map(
            (file) => {
              const isDownloading =
                activeAction ===
                `download-${file._id}`;

              const isDeleting =
                activeAction ===
                `delete-${file._id}`;

              const isSharing =
                activeAction ===
                `share-${file._id}`;

              const isTogglingVisibility =
                activeAction ===
                `visibility-${file._id}`;

              const category =
                getFileCategory(file);

              const isImage =
                category === "image";

              const isVideo =
                category === "video";

              const isPdf =
                file.mimeType ===
                "application/pdf";

              const previewUrl =
                previewUrls?.[file._id];

              const accent = isPdf
                ? {
                    border:
                      "border-red-500/20",
                    bg: "bg-red-500/10",
                    text: "text-red-400",
                    from: "from-red-500/10",
                  }
                : category === "text"
                ? {
                    border:
                      "border-cyan-500/20",
                    bg: "bg-cyan-500/10",
                    text: "text-cyan-400",
                    from: "from-cyan-500/10",
                  }
                : {
                    border:
                      "border-purple-500/20",
                    bg: "bg-purple-500/10",
                    text: "text-purple-400",
                    from: "from-purple-500/10",
                  };

              return (
                <div
                  key={file._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1220]/90 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-700/50 hover:shadow-[0_10px_30px_rgba(8,145,178,0.15)]"
                >

                  {/* Preview */}
                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        file._id
                      )
                    }
                    className="relative block aspect-video w-full overflow-hidden border-b border-slate-800/50 bg-[#02050a] text-left"
                    title="Open file"
                  >
                    {isImage &&
                    previewUrl ? (
                      <>
                        <img
                          src={previewUrl}
                          alt={
                            file.originalName
                          }
                          className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/90 via-transparent to-transparent" />
                      </>
                    ) : isVideo &&
                      previewUrl ? (
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
                            <svg
                              className="h-4 w-4 translate-x-[1px] text-black"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div
                        className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${accent.from} via-[#050b14] to-[#02050a]`}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl border sm:h-14 sm:w-14 ${accent.border} ${accent.bg} ${accent.text}`}
                        >
                          <span className="text-xs font-extrabold uppercase tracking-wider sm:text-sm">
                            {(
                              file.originalName
                                ?.split(".")
                                .pop() ||
                              "FILE"
                            ).slice(0, 4)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Visibility badge */}
                    <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md">

                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          file.isPublic
                            ? "bg-purple-400 shadow-[0_0_5px_#a855f7]"
                            : "bg-emerald-400 shadow-[0_0_5px_#34d399]"
                        }`}
                      />

                      {file.isPublic
                        ? "Public"
                        : "Private"}
                    </div>
                  </button>

                  {/* Details */}
                  <div className="flex flex-1 flex-col p-3.5 sm:p-4">

                    <p
                      className="truncate text-sm font-bold text-slate-200"
                      title={
                        file.originalName
                      }
                    >
                      {file.originalName}
                    </p>

                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                      <span>
                        {(file.mimeType ||
                          "").split(
                          "/"
                        )[1] ||
                          file.mimeType}
                      </span>

                      <span className="h-1 w-1 rounded-full bg-slate-700" />

                      <span>
                        {formatBytes(
                          file.size
                        )}
                      </span>
                    </p>

                    <p className="mt-1 text-[10px] font-semibold text-slate-600">
                      Uploaded:{" "}
                      {formatDate(
                        file.createdAt
                      )}
                    </p>

                    <div className="mt-auto" />

                    {/* Action bar */}
                    <div className="mt-3.5 grid grid-cols-4 gap-2 border-t border-slate-800/60 pt-3">

                      {/* Visibility */}
                      <button
                        onClick={() =>
                          handleToggleVisibility(
                            file._id
                          )
                        }
                        disabled={
                          activeAction !==
                            "" ||
                          isTogglingVisibility
                        }
                        aria-label={
                          file.isPublic
                            ? "Make private"
                            : "Make public"
                        }
                        title={
                          file.isPublic
                            ? "Make Private"
                            : "Make Public"
                        }
                        className={`flex items-center justify-center rounded-lg py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          file.isPublic
                            ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        {isTogglingVisibility ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />

                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : file.isPublic ? (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3.53 9.47l.94.94M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />

                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Download */}
                      <button
                        onClick={() =>
                          handleDownload(
                            file._id
                          )
                        }
                        disabled={
                          activeAction !==
                            "" ||
                          isDownloading
                        }
                        aria-label="Download file"
                        title="Download File"
                        className="flex items-center justify-center rounded-lg bg-blue-500/10 py-2.5 text-blue-400 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />

                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018 12V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Share */}
                      <button
                        onClick={() =>
                          handleCopyShareLink(
                            file
                          )
                        }
                        disabled={
                          activeAction !==
                            "" ||
                          !file.isPublic
                        }
                        aria-label={
                          copiedFileId ===
                          file._id
                            ? "Link copied"
                            : "Copy share link"
                        }
                        title={
                          file.isPublic
                            ? copiedFileId ===
                              file._id
                              ? "Copied!"
                              : "Copy Share Link"
                            : "Make the file public first to share it"
                        }
                        className="flex items-center justify-center rounded-lg bg-cyan-500/10 py-2.5 text-cyan-400 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {copiedFileId ===
                        file._id ? (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342a4 4 0 100-2.684m0 2.684a4 4 0 110-2.684m0 2.684l6.632 3.658m-6.632-6.342l6.632-3.658m0 0a4 4 0 105.367-5.367 4 4 0 00-5.367 5.367zm0 9.316a4 4 0 105.367 5.367 4 4 0 00-5.367-5.367z"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() =>
                          handleDelete(
                            file._id
                          )
                        }
                        disabled={
                          activeAction !==
                            "" ||
                          isDeleting
                        }
                        aria-label="Delete file"
                        title="Delete File"
                        className="flex items-center justify-center rounded-lg bg-red-500/10 py-2.5 text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />

                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

export default MyFiles;