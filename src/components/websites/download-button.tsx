"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  websiteId: string;
  domain: string;
}

export function DownloadButton({ websiteId, domain }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(`/api/websites/${websiteId}/download`);
      if (!res.ok) {
        throw new Error("Download failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${domain.replace(/[^a-zA-Z0-9-_]/g, "-")}-website.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to download ZIP file. Please ensure website is generated.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      disabled={isDownloading}
      className="gap-1.5 font-medium border-border"
    >
      <Download className="h-4 w-4" />
      {isDownloading ? "Downloading..." : "Download ZIP"}
    </Button>
  );
}
