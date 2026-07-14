"use client";

import type { AgentFile } from "@/lib/types";

interface Props {
  files: AgentFile[];
  sessionId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDownloadList({ files, sessionId }: Props) {
  if (files.length === 0) return null;

  return (
    <div className="mx-4 mb-4 max-w-[85%] md:max-w-[70%]">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
        📎 Files produced
      </p>
      <div className="flex flex-col gap-2">
        {files.map((file) => (
          <a
            key={file.id}
            href={`/api/files?sessionId=${sessionId}&fileId=${file.id}&filename=${encodeURIComponent(file.filename)}`}
            download={file.filename}
            className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors no-underline"
          >
            <span className="text-lg">📄</span>
            <span className="flex-1 truncate font-medium">{file.filename}</span>
            <span className="text-xs text-gray-400 flex-shrink-0">{formatBytes(file.size_bytes)}</span>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
