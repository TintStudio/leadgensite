import {
  Globe,
  Key,
  Layers,
  MapPin,
  BookOpen,
  Palette,
  Server,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WebsiteCreationFormData } from "@/types/create";
import { TEMPLATES } from "./design-step";

interface StepProps {
  data: WebsiteCreationFormData;
  goToStep: (stepNumber: number) => void;
}

export function ReviewStep({ data, goToStep }: StepProps) {
  const selectedTemplate =
    TEMPLATES.find((t) => t.id === data.template_id) || TEMPLATES[0];

  const totalPages =
    1 + // Homepage
    data.services.length +
    data.service_areas.length +
    data.blog_titles.length +
    1; // Contact Page

  return (
    <div className="space-y-6">
      {/* 1. Business Profile */}
      <Card className="border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            1. Business Information
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToStep(1)}
            className="h-7 text-xs"
          >
            <Edit2 className="mr-1 h-3 w-3" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-muted-foreground block">Business Name</span>
              <span className="font-medium text-foreground">{data.business_name || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Phone Number</span>
              <span className="font-medium text-foreground">{data.phone || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Service Type</span>
              <span className="font-medium text-foreground">{data.service_type || data.niche || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Years in Business</span>
              <span className="font-medium text-foreground">{data.years_in_business || "—"}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-border/50">
            <span className="text-muted-foreground block">Address</span>
            <span className="font-medium text-foreground">
              {data.address}, {data.city}, {data.state} {data.zip}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Keywords */}
      <Card className="border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            2. Keywords
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToStep(2)}
            className="h-7 text-xs"
          >
            <Edit2 className="mr-1 h-3 w-3" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <span className="text-muted-foreground block font-medium mb-1">Target Keyword (Main):</span>
            <span className="font-semibold text-foreground text-sm">
              {data.target_keyword || <span className="italic text-muted-foreground font-normal">None specified</span>}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block font-medium mb-1">
              Secondary Keywords ({data.secondary_keywords.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {data.secondary_keywords.length === 0 ? (
                <span className="text-muted-foreground italic">None specified.</span>
              ) : (
                data.secondary_keywords.map((kw) => (
                  <Badge key={kw} variant="outline" className="font-normal text-[11px]">
                    {kw}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Services */}
      <Card className="border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            3. Configured Services ({data.services.length})
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToStep(3)}
            className="h-7 text-xs"
          >
            <Edit2 className="mr-1 h-3 w-3" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="text-xs">
          {data.services.length === 0 ? (
            <span className="text-muted-foreground italic">No services added.</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.services.map((s) => (
                <span key={s.id} className="bg-muted px-2.5 py-1 rounded font-medium text-foreground">
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Service Areas */}
      <Card className="border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            4. Service Areas ({data.service_areas.length})
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToStep(4)}
            className="h-7 text-xs"
          >
            <Edit2 className="mr-1 h-3 w-3" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex flex-wrap gap-2">
            {data.service_areas.length === 0 ? (
              <span className="text-muted-foreground italic">No service areas added.</span>
            ) : (
              data.service_areas.map((a) => (
                <span key={a} className="bg-muted px-2.5 py-1 rounded font-medium text-foreground">
                  {a}
                </span>
              ))
            )}
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            ZIP code inclusion:{" "}
            <span className="font-semibold text-foreground">
              {data.include_zip_codes ? "Enabled (AI will include local ZIPs)" : "Disabled"}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* 5. Blogs */}
      <Card className="border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            5. Planned Blog Posts ({data.blog_titles.length})
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToStep(5)}
            className="h-7 text-xs"
          >
            <Edit2 className="mr-1 h-3 w-3" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="text-xs">
          {data.blog_titles.length === 0 ? (
            <span className="text-muted-foreground italic">No blog titles planned.</span>
          ) : (
            <ul className="list-disc pl-4 space-y-1">
              {data.blog_titles.map((b) => (
                <li key={b} className="text-foreground">
                  {b}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 6 & 7. Template & URL Structure */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              6. Template
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToStep(6)}
              className="h-7 text-xs"
            >
              <Edit2 className="mr-1 h-3 w-3" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p className="font-semibold text-foreground text-sm">{selectedTemplate.name}</p>
            <p className="text-muted-foreground">{selectedTemplate.description}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              7. Hosting &amp; URL
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToStep(7)}
              className="h-7 text-xs"
            >
              <Edit2 className="mr-1 h-3 w-3" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p className="text-muted-foreground">
              Platform: <span className="font-semibold text-foreground capitalize">{data.hosting_platform}</span>
            </p>
            <p className="text-muted-foreground">
              Target URL:{" "}
              <span className="font-mono font-semibold text-foreground">
                https://{data.domain || "your-site"}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Total Page Count Summary */}
      <div className="rounded-lg bg-primary text-primary-foreground p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <p className="font-bold text-sm">Ready to Generate Static Website</p>
          <p className="text-xs text-primary-foreground/80">
            Total of {totalPages} pages will be created: 1 Home + {data.services.length} Services + {data.service_areas.length} Areas + {data.blog_titles.length} Blogs + 1 Contact.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold whitespace-nowrap">
          {totalPages} Total Pages
        </Badge>
      </div>
    </div>
  );
}
