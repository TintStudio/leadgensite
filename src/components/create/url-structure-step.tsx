import { Globe, Server, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HostingPlatform, WebsiteCreationFormData } from "@/types/create";

interface StepProps {
  data: WebsiteCreationFormData;
  updateData: (fields: Partial<WebsiteCreationFormData>) => void;
}

interface PlatformOption {
  id: HostingPlatform;
  name: string;
  suffix?: string;
  placeholder: string;
  description: string;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: "netlify",
    name: "Netlify",
    suffix: ".netlify.app",
    placeholder: "e.g. waterdamagearvada",
    description: "Fast global CDN edge network with instant ZIP / Git deployment.",
  },
  {
    id: "vercel",
    name: "Vercel",
    suffix: ".vercel.app",
    placeholder: "e.g. waterdamagearvada",
    description: "Next-gen static frontend cloud with automated preview URLs.",
  },
  {
    id: "cloudflare",
    name: "Cloudflare Pages",
    suffix: ".pages.dev",
    placeholder: "e.g. waterdamagearvada",
    description: "Ultra-fast distributed deployment powered by Cloudflare edge.",
  },
  {
    id: "github",
    name: "GitHub Pages",
    suffix: ".github.io",
    placeholder: "e.g. waterdamagearvada",
    description: "Free static site hosting on GitHub with .nojekyll auto-configured.",
  },
  {
    id: "custom",
    name: "Custom Domain",
    placeholder: "e.g. waterdamagerestorationarvada.com",
    description: "Connect your own custom root domain or branded subdomain.",
  },
];

export function UrlStructureStep({ data, updateData }: StepProps) {
  const currentPlatform =
    PLATFORMS.find((p) => p.id === data.hosting_platform) || PLATFORMS[0];

  const handleSubdomainChange = (val: string) => {
    // Sanitize subdomain format
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    updateData({
      platform_subdomain: sanitized,
      domain: `${sanitized}${currentPlatform.suffix || ""}`,
    });
  };

  const handleCustomDomainChange = (val: string) => {
    updateData({
      custom_domain: val.toLowerCase().trim(),
      domain: val.toLowerCase().trim(),
    });
  };

  const selectPlatform = (platform: HostingPlatform) => {
    const selected = PLATFORMS.find((p) => p.id === platform);
    let resolvedDomain = "";

    if (platform === "custom") {
      resolvedDomain = data.custom_domain;
    } else {
      resolvedDomain = `${data.platform_subdomain}${selected?.suffix || ""}`;
    }

    updateData({
      hosting_platform: platform,
      domain: resolvedDomain,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          Select Target Hosting Platform
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select where your website will be published. You can deploy directly or download as ZIP anytime.
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PLATFORMS.map((platform) => {
          const isSelected = data.hosting_platform === platform.id;
          return (
            <Card
              key={platform.id}
              className={cn(
                "cursor-pointer transition-all border",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-muted/20"
                  : "border-border hover:border-foreground/40"
              )}
              onClick={() => selectPlatform(platform.id)}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-foreground text-sm">
                      {platform.name}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {platform.description}
                  </p>
                </div>

                {platform.suffix && (
                  <div className="mt-3 pt-2 border-t border-border text-[11px] font-mono text-muted-foreground">
                    *{platform.suffix}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* URL / Subdomain Input */}
      <Card className="border-border">
        <CardContent className="pt-6 space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-primary" />
            {data.hosting_platform === "custom"
              ? "Enter Custom Domain"
              : `Enter ${currentPlatform.name} Subdomain`}
          </Label>

          {data.hosting_platform === "custom" ? (
            <div className="space-y-2">
              <Input
                placeholder="waterdamagerestorationarvada.com"
                value={data.custom_domain}
                onChange={(e) => handleCustomDomainChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter your complete domain. You will be able to configure DNS records after generation.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex rounded-md border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary overflow-hidden">
                <input
                  type="text"
                  placeholder={currentPlatform.placeholder}
                  value={data.platform_subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  className="flex-1 bg-background px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground"
                />
                <span className="bg-muted px-3 py-2 text-xs font-mono font-medium text-muted-foreground border-l border-border flex items-center">
                  {currentPlatform.suffix}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Final Target URL:{" "}
                <span className="font-mono font-semibold text-foreground">
                  https://{data.platform_subdomain || "your-site"}
                  {currentPlatform.suffix}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
