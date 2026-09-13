"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone, RotateCw, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DevicePreviewFrameProps {
  websiteId: string;
  domain: string;
  currentSlug: string;
  reloadKey: number;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

export function DevicePreviewFrame({
  websiteId,
  domain,
  currentSlug,
  reloadKey,
}: DevicePreviewFrameProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [localReloadKey, setLocalReloadKey] = useState(0);

  const previewUrl = `/api/websites/${websiteId}/preview?slug=${encodeURIComponent(
    currentSlug
  )}&_t=${reloadKey}_${localReloadKey}`;

  const displayedPath = currentSlug ? `/${currentSlug}.html` : "/";

  return (
    <div className="flex flex-col h-full bg-muted/40 border-l border-border">
      {/* Top Preview Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-background border-b border-border">
        {/* Device Switchers */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md border border-border">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              deviceMode === "desktop"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Desktop view"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              deviceMode === "tablet"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tablet view (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              deviceMode === "mobile"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Mobile view (375px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Address Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded text-[11px] font-mono text-muted-foreground border border-border truncate max-w-xs">
          <Globe className="h-3 w-3 text-primary shrink-0" />
          <span className="truncate">{domain}{displayedPath}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocalReloadKey((k) => k + 1)}
            className="h-8 w-8 p-0"
            title="Reload preview"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Open preview in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
        <div
          className={`h-full transition-all duration-300 bg-background shadow-md border border-border overflow-hidden rounded-md flex flex-col ${
            deviceMode === "desktop"
              ? "w-full"
              : deviceMode === "tablet"
              ? "w-[768px] max-w-full"
              : "w-[380px] max-w-full"
          }`}
        >
          <iframe
            key={`${previewUrl}`}
            src={previewUrl}
            className="w-full h-full border-0 flex-1 bg-white"
            title="Website Live Preview"
          />
        </div>
      </div>
    </div>
  );
}
