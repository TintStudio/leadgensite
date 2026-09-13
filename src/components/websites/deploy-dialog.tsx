"use client";

import { useState } from "react";
import {
  GitBranch,
  Cloud,
  Server,
  Globe,
  ExternalLink,
  Download,
  Copy,
  Check,
  X,
  FileCheck,
  Terminal,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HostingPlatform } from "@/types/create";

interface DeployDialogProps {
  websiteId: string;
  businessName: string;
  domain: string;
  initialPlatform?: HostingPlatform;
}

interface PlatformConfig {
  id: HostingPlatform;
  name: string;
  badge: string;
  icon: typeof GitBranch;
  description: string;
  targetUrlText: string;
  steps: { title: string; instruction: string; command?: string }[];
  highlightFile: string;
  highlightNote: string;
  externalLink?: { label: string; url: string };
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: "github",
    name: "GitHub Pages",
    badge: "Free Static Hosting",
    icon: GitBranch,
    description:
      "Host directly from a GitHub repository. Pure static HTML/CSS/JS served globally with free SSL.",
    targetUrlText: "https://[username].github.io or custom domain",
    highlightFile: ".nojekyll",
    highlightNote:
      "Pre-configured in root. Prevents Jekyll from omitting Handlebars-rendered files and CSS.",
    steps: [
      {
        title: "Download ZIP Package",
        instruction:
          "Click 'Download ZIP' below. The archive includes all rendered HTML pages, styles, sitemap, and .nojekyll.",
      },
      {
        title: "Create GitHub Repository",
        instruction:
          "Create a new public or private repository on GitHub (e.g. your-business-site or username.github.io).",
      },
      {
        title: "Commit & Push Static Files",
        instruction:
          "Extract the ZIP and push all contents to your repository's main or gh-pages branch.",
        command: "git init\ngit add .\ngit commit -m 'Initial site build'\ngit push -u origin main",
      },
      {
        title: "Enable GitHub Pages in Settings",
        instruction:
          "In GitHub, go to Settings > Pages. Under 'Build and deployment', set Source to 'Deploy from a branch', select branch 'main' (or 'gh-pages') and folder '/ (root)', then Save.",
      },
    ],
    externalLink: {
      label: "GitHub Pages Documentation",
      url: "https://pages.github.com/",
    },
  },
  {
    id: "netlify",
    name: "Netlify",
    badge: "Drag & Drop Instant Deploy",
    icon: Cloud,
    description:
      "Global edge network with automated SSL, instant drag-and-drop deployment, and edge CDN.",
    targetUrlText: "https://[subdomain].netlify.app",
    highlightFile: "_headers",
    highlightNote:
      "Pre-configured with security headers (X-Frame-Options, X-Content-Type) and 1-year CSS caching.",
    steps: [
      {
        title: "Download Website ZIP",
        instruction: "Download the complete ZIP package using the button below.",
      },
      {
        title: "Open Netlify Drop",
        instruction:
          "Go to Netlify Drop in your web browser. No CLI or Git configuration required.",
      },
      {
        title: "Drop to Deploy",
        instruction:
          "Drag the downloaded ZIP package directly onto the Netlify drop zone. Your site goes live instantly.",
      },
      {
        title: "Configure Custom Subdomain",
        instruction:
          "In Netlify Site Settings > Domain Management, set your custom subdomain or bind your apex domain.",
      },
    ],
    externalLink: {
      label: "Open Netlify Drop",
      url: "https://app.netlify.com/drop",
    },
  },
  {
    id: "vercel",
    name: "Vercel",
    badge: "Edge Frontend Cloud",
    icon: Server,
    description:
      "Zero-configuration static deployment powered by Vercel's global CDN and high-speed edge.",
    targetUrlText: "https://[subdomain].vercel.app",
    highlightFile: "vercel.json",
    highlightNote:
      "Configured for clean URLs (removes .html extensions automatically) and immutable asset caching.",
    steps: [
      {
        title: "Download & Extract ZIP",
        instruction:
          "Download the ZIP package below and extract the contents to a folder on your computer.",
      },
      {
        title: "Deploy via Vercel CLI (or Dashboard)",
        instruction:
          "Open your terminal in the extracted folder and run the command below, or import a connected Git repository.",
        command: "npx vercel --prod",
      },
      {
        title: "Instant Edge Production",
        instruction:
          "Vercel reads the included vercel.json automatically and routes clean URLs across all edges.",
      },
    ],
    externalLink: {
      label: "Vercel Dashboard",
      url: "https://vercel.com/dashboard",
    },
  },
  {
    id: "cloudflare",
    name: "Cloudflare Pages",
    badge: "Ultra-Fast Edge",
    icon: Cloud,
    description:
      "Deploy directly to Cloudflare's ultra-low latency worldwide network with unlimited bandwidth.",
    targetUrlText: "https://[subdomain].pages.dev",
    highlightFile: "index.html & sitemap.xml",
    highlightNote:
      "Full static compliance with Cloudflare's Direct Upload standard and automatic Brotli compression.",
    steps: [
      {
        title: "Download & Extract Archive",
        instruction: "Download the ZIP package below and unzip all files into a directory.",
      },
      {
        title: "Open Cloudflare Dashboard",
        instruction:
          "Go to Cloudflare > Workers & Pages > Create application > Pages > Direct Upload.",
      },
      {
        title: "Upload Folder",
        instruction:
          "Upload your extracted folder directly into the Cloudflare browser interface and click Deploy.",
      },
    ],
    externalLink: {
      label: "Cloudflare Pages Dashboard",
      url: "https://dash.cloudflare.com/?to=/:account/pages",
    },
  },
  {
    id: "custom",
    name: "Custom Host / cPanel",
    badge: "Apache / Nginx / cPanel",
    icon: Globe,
    description:
      "Host on your own VPS, shared hosting, Apache, Nginx, or cPanel file manager with standard web roots.",
    targetUrlText: "https://yourdomain.com",
    highlightFile: "public_html",
    highlightNote:
      "Pure static assets requiring zero backend dependencies, Node.js, or database servers.",
    steps: [
      {
        title: "Download Archive",
        instruction: "Download the ZIP archive using the button below.",
      },
      {
        title: "Upload to Web Server Root",
        instruction:
          "Using cPanel File Manager, FTP/SFTP, or SSH, upload and extract all files into your public_html or /var/www/html directory.",
      },
      {
        title: "Configure DNS Records",
        instruction:
          "Point your domain's A Record (@) to your hosting server's IP address, and CNAME (www) to your root domain.",
      },
    ],
  },
];

export function DeployDialog({
  websiteId,
  businessName,
  domain,
  initialPlatform = "github",
}: DeployDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = useState<HostingPlatform>(
    initialPlatform || "github"
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentConfig =
    PLATFORM_CONFIGS.find((p) => p.id === selectedPlatformId) || PLATFORM_CONFIGS[0];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="default"
        size="sm"
        className="gap-1.5 font-medium"
      >
        <Server className="h-4 w-4" />
        Deploy Website
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-lg border border-border bg-background shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Deploy Static Website
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Target Domain: <span className="font-semibold text-foreground">{domain}</span> ({businessName})
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Platform Selection Tabs */}
            <div className="border-b border-border px-6 py-2 bg-muted/10 flex items-center gap-2 overflow-x-auto">
              {PLATFORM_CONFIGS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatformId === platform.id;
                return (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatformId(platform.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {platform.name}
                  </button>
                );
              })}
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Platform Info Banner */}
              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {currentConfig.name} Deployment Guide
                    </span>
                    <Badge variant="outline" className="text-[11px] font-normal border-border">
                      {currentConfig.badge}
                    </Badge>
                  </div>
                  {currentConfig.externalLink && (
                    <a
                      href={currentConfig.externalLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {currentConfig.externalLink.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentConfig.description}
                </p>

                {/* Adapter Indicator */}
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs">
                  <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-foreground">
                    Included Adapter File: <code className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">{currentConfig.highlightFile}</code>
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    — {currentConfig.highlightNote}
                  </span>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Deployment Steps
                </h3>

                <div className="space-y-3">
                  {currentConfig.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-md border border-border bg-background flex flex-col gap-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div className="space-y-1 flex-1">
                          <h4 className="text-xs font-bold text-foreground">
                            {step.title}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {step.instruction}
                          </p>
                        </div>
                      </div>

                      {step.command && (
                        <div className="ml-8 mt-1 relative rounded border border-border bg-muted/60 p-2.5 font-mono text-[11px] text-foreground flex items-center justify-between">
                          <span className="whitespace-pre-line select-all">{step.command}</span>
                          <button
                            onClick={() => handleCopy(step.command!, idx)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted ml-2 shrink-0"
                            title="Copy command"
                          >
                            {copiedIndex === idx ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Bar */}
            <div className="border-t border-border px-6 py-3.5 bg-muted/30 flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                Pure Static HTML/CSS — No Node or Database Needed
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isDownloading ? "Preparing ZIP..." : "Download ZIP Package"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
