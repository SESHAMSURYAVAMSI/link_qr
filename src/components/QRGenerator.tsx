
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileUp,
  Link2,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Type,
  UploadCloud,
  X,
  History,
  Trash2,
  RotateCcw,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { downloadQRCode, generateQRCode } from "@/lib/qr";

type InputMode = "url" | "text" | "file";

type QRHistoryItem = {
  id: string;
  mode: InputMode;
  content: string;
  qrColor: string;
  backgroundColor: string;
  size: string;
  createdAt: string;
};

const BUCKET_NAME = "qr-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const HISTORY_KEY = "qr-studio-history";
const MAX_HISTORY_ITEMS = 30;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export default function QRGenerator() {
  const [mode, setMode] = useState<InputMode>("url");
  const [value, setValue] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [qrColor, setQrColor] = useState("#241000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [size, setSize] = useState("512");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [generatedValue, setGeneratedValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [historyItems, setHistoryItems] = useState<QRHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyMessage, setHistoryMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved history once in the browser.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          const validItems = parsed.filter(
            (item): item is QRHistoryItem =>
              item !== null &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              ["url", "text", "file"].includes(item.mode) &&
              typeof item.content === "string" &&
              typeof item.qrColor === "string" &&
              typeof item.backgroundColor === "string" &&
              typeof item.size === "string" &&
              typeof item.createdAt === "string",
          );

          // eslint-disable-next-line react-hooks/set-state-in-effect
          setHistoryItems(validItems.slice(0, MAX_HISTORY_ITEMS));
        }
      }
    } catch {
      setHistoryMessage("Could not read saved history from this browser.");
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  // Generate a QR code when the content or its design changes.
  useEffect(() => {
    if (!value.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQrImage("");
      setGeneratedValue("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const image = await generateQRCode(
          value,
          qrColor,
          backgroundColor,
          Number(size),
        );

        if (!cancelled) {
          setQrImage(image);
          setGeneratedValue(value.trim());
          setError("");
        }
      } catch {
        if (!cancelled) {
          setQrImage("");
          setGeneratedValue("");
          setError("Unable to generate the QR code. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value, qrColor, backgroundColor, size]);

  // Persist history metadata, not image data.
  useEffect(() => {
    if (!historyLoaded) return;

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyItems));
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistoryMessage("Unable to save history in this browser.");
    }
  }, [historyItems, historyLoaded]);

  function clearFileSelection() {
    setSelectedFile(null);
    setUploadedFileUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleModeChange(nextMode: InputMode) {
    setMode(nextMode);
    setValue("");
    setQrImage("");
    setGeneratedValue("");
    setError("");
    setHistoryMessage("");
    clearFileSelection();
  }

  function handleFileSelection(file?: File) {
    if (!file) return;

    setError("");
    setValue("");
    setQrImage("");
    setGeneratedValue("");
    setUploadedFileUrl("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setSelectedFile(null);
      setError("Choose a PDF, PNG, JPEG, or WebP file.");
      return;
    }

    if (file.size === 0) {
      setSelectedFile(null);
      setError("The selected file is empty.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError("The maximum file size is 10 MB.");
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError("");
    setQrImage("");
    setGeneratedValue("");
    setValue("");

    try {
      const extension =
        selectedFile.name.split(".").pop()?.toLowerCase() || "file";

      const safeExtension = /^[a-z0-9]+$/.test(extension)
        ? extension
        : "file";

      const filePath =
        `uploads/${crypto.randomUUID()}.${safeExtension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error("Supabase did not return a public file URL.");
      }

      setUploadedFileUrl(data.publicUrl);
      setValue(data.publicUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleSaveToHistory() {
    if (!generatedValue || !qrImage || !historyLoaded) return;

    const existing = historyItems.find(
      (item) => item.content === generatedValue && item.mode === mode,
    );

    const item: QRHistoryItem = {
      id: crypto.randomUUID(),
      mode,
      content: generatedValue,
      qrColor,
      backgroundColor,
      size,
      createdAt: new Date().toISOString(),
    };

    const updated = [
      item,
      ...historyItems.filter((entry) => entry.id !== existing?.id),
    ].slice(0, MAX_HISTORY_ITEMS);

    setHistoryItems(updated);
    setHistoryMessage("QR code saved to history.");
  }

  function handleRestoreHistory(item: QRHistoryItem) {
    setMode(item.mode);
    setValue(item.content);
    setQrColor(item.qrColor);
    setBackgroundColor(item.backgroundColor);
    setSize(item.size);
    setError("");
    setHistoryMessage("");

    if (item.mode === "file") {
      setUploadedFileUrl(item.content);
      setSelectedFile(null);
    } else {
      clearFileSelection();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDeleteHistory(id: string) {
    setHistoryItems((items) => items.filter((item) => item.id !== id));
    setHistoryMessage("History entry deleted.");
  }

  function handleClearHistory() {
    setHistoryItems([]);
    setHistoryMessage("History cleared.");
  }

  function handleDownload() {
    if (!qrImage) return;

    downloadQRCode(qrImage, `qr-studio-${Date.now()}.png`);
  }

  function handleReset() {
    setMode("url");
    setValue("");
    setQrImage("");
    setGeneratedValue("");
    setError("");
    setQrColor("#241000");
    setBackgroundColor("#FFFFFF");
    setSize("512");
    setHistoryMessage("");
    clearFileSelection();
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "Unknown date";

    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const fileSizeLabel = selectedFile
    ? selectedFile.size < 1024 * 1024
      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
      : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
    : "";

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <Sparkles size={23} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#241000]">
                Create your QR code
              </h2>
              <p className="text-sm text-stone-500">
                Enter content, upload a file, or customize your QR.
              </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-[#fff7f1] p-1.5">
            <button
              type="button"
              onClick={() => handleModeChange("url")}
              aria-pressed={mode === "url"}
              className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition ${
                mode === "url"
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-stone-500 hover:text-[#241000]"
              }`}
            >
              <Link2 size={17} />
              Website
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("text")}
              aria-pressed={mode === "text"}
              className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition ${
                mode === "text"
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-stone-500 hover:text-[#241000]"
              }`}
            >
              <Type size={17} />
              Text
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("file")}
              aria-pressed={mode === "file"}
              className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition ${
                mode === "file"
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-stone-500 hover:text-[#241000]"
              }`}
            >
              <FileUp size={17} />
              File upload
            </button>
          </div>

          {mode === "file" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#241000]">
                  Upload a PDF or image
                </h3>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  Upload your file to Supabase and generate a QR
                  containing its public URL.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  handleFileSelection(event.target.files?.[0])
                }
                className="hidden"
              />

              {!selectedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-orange-200 bg-[#fffaf7] px-5 py-10 text-center transition hover:border-orange-400 hover:bg-orange-50"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                    <UploadCloud size={28} />
                  </div>
                  <span className="font-semibold text-[#241000]">
                    Choose a file from your computer
                  </span>
                  <span className="mt-2 text-xs text-stone-500">
                    PDF, PNG, JPEG or WebP · Maximum 10 MB
                  </span>
                </button>
              ) : (
                <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700">
                      <FileUp size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-semibold text-[#241000]">
                        {selectedFile.name}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {fileSizeLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearFileSelection}
                      disabled={uploading}
                      aria-label="Remove selected file"
                      className="rounded-lg p-2 text-stone-500 hover:bg-white hover:text-red-600 disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {uploadedFileUrl && (
                    <a
                      href={uploadedFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block break-all text-xs text-orange-700 underline"
                    >
                      Open uploaded file
                    </a>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={
                  !selectedFile || uploading || Boolean(uploadedFileUrl)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#EA580C] px-5 py-3.5 font-semibold text-white transition hover:bg-[#c94b08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <LoaderCircle size={19} className="animate-spin" />
                ) : (
                  <UploadCloud size={19} />
                )}
                {uploading
                  ? "Uploading file..."
                  : uploadedFileUrl
                    ? "File uploaded — QR ready"
                    : "Upload file and generate QR"}
              </button>
            </div>
          ) : (
            <>
              <label
                htmlFor="qr-value"
                className="mb-2 block text-sm font-semibold text-[#241000]"
              >
                {mode === "url" ? "Website or shareable link" : "Your text"}
              </label>

              <textarea
                id="qr-value"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={
                  mode === "url"
                    ? "https://example.com"
                    : "Type anything you want to share..."
                }
                rows={4}
                maxLength={4000}
                spellCheck={false}
                className="w-full resize-y rounded-2xl border border-stone-200 bg-[#fffdfb] px-4 py-4 text-sm text-[#241000] outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

              <div className="mt-2 flex justify-between text-xs text-stone-400">
                <span>QR codes generate automatically</span>
                <span>{value.length}/4000</span>
              </div>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 break-words rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="my-7 h-px bg-stone-100" />

          <h3 className="mb-4 font-bold text-[#241000]">
            Customize your QR
          </h3>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="qr-color"
                className="mb-2 block text-sm font-medium text-stone-600"
              >
                QR color
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-stone-200 p-2">
                <input
                  id="qr-color"
                  type="color"
                  value={qrColor}
                  onChange={(event) => setQrColor(event.target.value)}
                  className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent"
                />
                <span className="text-sm font-medium text-stone-600">
                  {qrColor.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="qr-background"
                className="mb-2 block text-sm font-medium text-stone-600"
              >
                Background color
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-stone-200 p-2">
                <input
                  id="qr-background"
                  type="color"
                  value={backgroundColor}
                  onChange={(event) =>
                    setBackgroundColor(event.target.value)
                  }
                  className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent"
                />
                <span className="text-sm font-medium text-stone-600">
                  {backgroundColor.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="qr-size"
                className="mb-2 block text-sm font-medium text-stone-600"
              >
                Download image resolution
              </label>
              <select
                id="qr-size"
                value={size}
                onChange={(event) => setSize(event.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#241000] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="256">256 × 256 — Standard</option>
                <option value="512">512 × 512 — High quality</option>
                <option value="1024">1024 × 1024 — Print quality</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-[#241000]"
          >
            <RefreshCw size={15} />
            Reset everything
          </button>
        </section>

        {/* Preview and download */}
        <section className="flex flex-col rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-[#241000]">
              Live preview
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Preview and download your QR code.
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-[#fffaf7] px-4 py-8">
            {qrImage ? (
              <div className="w-full max-w-[300px]">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <img
                    src={qrImage}
                    alt="Generated QR code"
                    className="mx-auto aspect-square w-full"
                  />
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  QR code ready
                </div>
              </div>
            ) : (
              <div className="flex max-w-xs flex-col items-center py-8 text-center">
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-orange-100 text-orange-600">
                  {loading || uploading ? (
                    <LoaderCircle className="animate-spin" size={40} />
                  ) : (
                    <QrCode size={48} strokeWidth={1.5} />
                  )}
                </div>
                <h3 className="font-bold text-[#241000]">
                  {uploading
                    ? "Uploading your file..."
                    : "Your QR code will appear here"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Enter a link, type text, or upload a file to create
                  your QR code.
                </p>
              </div>
            )}
          </div>

          {qrImage && (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Encoded content
                </p>
                <p className="break-all text-sm text-stone-700">
                  {generatedValue}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#EA580C] px-5 py-4 font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-[#c94b08] active:scale-[0.99]"
              >
                <Download size={19} />
                Download QR Code (PNG)
              </button>

              <button
                type="button"
                onClick={handleSaveToHistory}
                disabled={!historyLoaded}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-5 py-3.5 font-semibold text-orange-800 transition hover:bg-orange-50 disabled:opacity-50"
              >
                <History size={18} />
                Save QR to history
              </button>
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-stone-400">
            <ShieldCheck size={15} className="shrink-0" />
            QR generation happens in your browser. Files are stored in Supabase.
          </div>
        </section>
      </div>

      {/* Local QR history */}
      <section className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <History size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#241000]">
                QR code history
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Your saved codes on this browser · {historyItems.length}/{MAX_HISTORY_ITEMS}
              </p>
            </div>
          </div>

          {historyItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              Clear history
            </button>
          )}
        </div>

        {historyMessage && (
          <p role="status" className="mt-4 text-sm text-stone-500">
            {historyMessage}
          </p>
        )}

        {!historyLoaded ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-stone-500">
            <LoaderCircle className="animate-spin" size={18} />
            Loading history...
          </div>
        ) : historyItems.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-orange-200 bg-[#fffaf7] px-5 py-10 text-center">
            <Clock size={34} className="text-orange-400" />
            <h3 className="mt-3 font-semibold text-[#241000]">
              No saved QR codes yet
            </h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">
              Generate a QR code and select Save QR to history.
              Your saved items will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-stone-100 bg-[#fffdfb] p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                  {item.mode === "url" ? (
                    <Link2 size={21} />
                  ) : item.mode === "text" ? (
                    <Type size={21} />
                  ) : (
                    <FileUp size={21} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                    {item.mode === "url"
                      ? "Website QR"
                      : item.mode === "text"
                        ? "Text QR"
                        : "File QR"}
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-[#241000]">
                    {item.content}
                  </p>
                  <p className="mt-2 text-xs text-stone-400">
                    Saved {formatDate(item.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestoreHistory(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EA580C] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c94b08]"
                  >
                    <RotateCcw size={15} />
                    Reopen
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteHistory(item.id)}
                    aria-label="Delete history entry"
                    className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-3 py-2.5 text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-5 text-xs leading-5 text-stone-400">
          History is stored locally in this browser and is limited to
          30 entries. Clearing browser data or using another device
          will not preserve this list. Uploaded files remain in
          Supabase unless separately deleted or made unavailable.
        </p>
      </section>
    </div>
  );
}
