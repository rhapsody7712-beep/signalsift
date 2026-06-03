import { useRef, useState } from "react";
import type { Candidate } from "../engine/types";

interface Props {
  onAdd: (candidate: Candidate) => void;
  onClose: () => void;
}

type Method = "paste" | "upload" | "sharepoint";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generateId(name: string): string {
  return `${slugify(name)}-${Date.now().toString(36)}`;
}

export default function ResumeIngestionModal({ onAdd, onClose }: Props) {
  const [method, setMethod] = useState<Method>("paste");
  const [name, setName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [sharePointUrl, setSharePointUrl] = useState("");
  const [sharePointText, setSharePointText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setFileError("Only .txt files are supported in Phase 0. PDF/DOCX parsing is coming in Phase 1.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setFileText((ev.target?.result as string) ?? "");
    reader.onerror = () => setFileError("Could not read file.");
    reader.readAsText(file);
  }

  function resolvedText(): string {
    if (method === "paste") return pasteText;
    if (method === "upload") return fileText;
    return sharePointText;
  }

  function canSubmit(): boolean {
    if (!name.trim()) return false;
    const text = resolvedText().trim();
    if (!text) return false;
    if (method === "sharepoint" && !sharePointUrl.trim()) return false;
    return true;
  }

  function handleSubmit() {
    if (!canSubmit()) return;
    const text = resolvedText().trim();
    const candidate: Candidate = {
      id: generateId(name.trim()),
      name: name.trim(),
      resumeText: text,
      source: method === "upload" ? "uploaded" : method === "sharepoint" ? "sharepoint" : "pasted",
      sourceUrl: method === "sharepoint" ? sharePointUrl.trim() : undefined,
    };
    onAdd(candidate);
    onClose();
  }

  const TAB: Record<Method, string> = {
    paste: "Paste text",
    upload: "Upload .txt",
    sharepoint: "SharePoint link",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add Candidate Resume</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Phase 0 · Plain text only · Scores instantly on add
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Candidate name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Smith"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Method tabs */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              How to provide the resume
            </label>
            <div className="flex gap-1 bg-gray-100 rounded p-1 w-fit">
              {(["paste", "upload", "sharepoint"] as Method[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`text-xs px-3 py-1.5 rounded transition-colors font-medium ${
                    method === m
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {TAB[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Paste */}
          {method === "paste" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Resume text <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Paste the full resume text here…"
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                rows={14}
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                {pasteText.trim().split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
          )}

          {/* Upload */}
          {method === "upload" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                .txt file <span className="text-red-500">*</span>
              </label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleFileChange(fakeEvent);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {fileName ? (
                  <div>
                    <p className="text-sm font-medium text-blue-600">📄 {fileName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {fileText.trim().split(/\s+/).filter(Boolean).length} words loaded
                    </p>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setFileName(null);
                        setFileText("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs text-red-400 hover:text-red-600 mt-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Click to choose or drag & drop a .txt file</p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF / DOCX support coming in Phase 1
                    </p>
                  </div>
                )}
              </div>
              {fileError && (
                <p className="text-xs text-red-600 mt-1.5 bg-red-50 border border-red-200 rounded px-2 py-1">
                  {fileError}
                </p>
              )}
            </div>
          )}

          {/* SharePoint */}
          {method === "sharepoint" && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-700">
                <p className="font-semibold mb-1">Phase 0 note</p>
                <p>
                  Direct SharePoint fetching requires a backend connector (Phase 1). For now, open
                  the document in SharePoint, copy all text, and paste it below. The link is saved
                  for reference.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  SharePoint URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://yourorg.sharepoint.com/…"
                  value={sharePointUrl}
                  onChange={e => setSharePointUrl(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Resume text (copied from SharePoint) <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Paste the resume text you copied from the SharePoint document…"
                  value={sharePointText}
                  onChange={e => setSharePointText(e.target.value)}
                  rows={10}
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {sharePointText.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-400">
            Candidate will be scored against current criteria immediately.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-1.5 border border-gray-200 text-gray-600 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Add &amp; Score
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
