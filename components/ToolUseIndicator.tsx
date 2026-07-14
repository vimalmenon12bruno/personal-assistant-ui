"use client";

import { getToolLabel } from "@/lib/tool-labels";

interface Props {
  names: string[];
}

export function ToolUseIndicator({ names }: Props) {
  if (names.length === 0) return null;
  const label = getToolLabel(names[names.length - 1]);

  return (
    <div className="flex items-center gap-2 my-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs w-fit">
      {/* Pulsing dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
      </span>
      {label}&hellip;
    </div>
  );
}
