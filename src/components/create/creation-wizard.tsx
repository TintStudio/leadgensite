"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessInfoStep } from "./business-info-step";
import { KeywordsStep } from "./keywords-step";
import { ServicesStep } from "./services-step";
import { ServiceAreasStep } from "./service-areas-step";
import { BlogsStep } from "./blogs-step";
import { DesignStep } from "./design-step";
import { UrlStructureStep } from "./url-structure-step";
import { ReviewStep } from "./review-step";
import { WebsiteCreationFormData } from "@/types/create";

const STEPS = [
  { id: 1, name: "Business Info" },
  { id: 2, name: "Keywords" },
  { id: 3, name: "Services" },
  { id: 4, name: "Service Areas" },
  { id: 5, name: "Blogs" },
  { id: 6, name: "Template" },
  { id: 7, name: "URL Structure" },
  { id: 8, name: "Review" },
];

interface CreationWizardProps {
  isAdmin?: boolean;
}

export function CreationWizard({ isAdmin = false }: CreationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<WebsiteCreationFormData>({
    business_name: "",
    website_name: "",
    domain: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    niche: "",
    description: "",
    years_in_business: "",
    service_type: "",
    background_info: "",
    target_keyword: "",
    secondary_keywords: [],
    services: [],
    service_areas_text: "",
    service_areas: [],
    detailed_areas: [],
    include_zip_codes: false,
    blog_titles: [],
    template_id: "plumber-pro",
    hosting_platform: "netlify",
    platform_subdomain: "",
    custom_domain: "",
  });

  const updateFormData = (fields: Partial<WebsiteCreationFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const validateCurrentStep = () => {
    setError(null);

    // If Admin, bypass all validations so admin can navigate freely
    if (isAdmin) {
      return true;
    }

    // Compulsory validations for regular users
    if (currentStep === 1) {
      if (!formData.business_name.trim()) {
        setError("Business Name is required.");
        return false;
      }
      if (!formData.phone.trim()) {
        setError("Phone Number is required.");
        return false;
      }
      if (!formData.address.trim()) {
        setError("Business Address is required.");
        return false;
      }
      if (!formData.city.trim()) {
        setError("City is required.");
        return false;
      }
      if (!formData.state.trim()) {
        setError("State is required.");
        return false;
      }
      if (!formData.zip.trim()) {
        setError("ZIP Code is required.");
        return false;
      }
      if (!formData.service_type.trim() && !formData.niche.trim()) {
        setError("Service Type / Industry is required.");
        return false;
      }
      if (!formData.description.trim()) {
        setError("Business Description is required.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.target_keyword.trim()) {
        setError("Please provide at least 1 Target Keyword (Primary Keyword).");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.services || formData.services.length === 0) {
        setError("Please add at least 1 service.");
        return false;
      }
    }

    if (currentStep === 4) {
      if (!formData.service_areas || formData.service_areas.length === 0) {
        setError("Please add at least 1 Service Area.");
        return false;
      }
    }

    if (currentStep === 7) {
      if (formData.hosting_platform === "custom" && !formData.custom_domain.trim()) {
        setError("Please enter your Custom Domain.");
        return false;
      }
      if (formData.hosting_platform !== "custom" && !formData.platform_subdomain.trim()) {
        setError("Please specify a subdomain.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = (stepNumber: number) => {
    setError(null);
    // Admins can jump to ANY tab at any time regardless of data
    if (isAdmin) {
      setCurrentStep(stepNumber);
      return;
    }

    // Regular users can only navigate to previous completed steps or if current is valid
    if (stepNumber <= currentStep || validateCurrentStep()) {
      setCurrentStep(stepNumber);
    }
  };

  const handleSubmit = async (generateNow = true) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to save project");
        setLoading(false);
        return;
      }

      // If user chose to generate now, redirect directly to website page with autostart
      if (generateNow && data.websiteId) {
        router.push(`/websites/${data.websiteId}?autostart=1`);
      } else {
        // Redirect to websites dashboard list
        router.push(`/websites?created=${data.websiteId || ""}`);
      }
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps Header */}
      <div className="border-b border-border pb-6 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] max-w-4xl mx-auto px-2">
          {STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={() => {
                  if (isAdmin) {
                    goToStep(step.id);
                  } else if (step.id <= currentStep || validateCurrentStep()) {
                    goToStep(step.id);
                  }
                }}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "border-2 border-primary text-primary bg-background"
                      : "border border-border text-muted-foreground bg-muted/40"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : step.id}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Step Container */}
      <Card className="max-w-4xl mx-auto border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {STEPS[currentStep - 1].name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <BusinessInfoStep data={formData} updateData={updateFormData} />
          )}
          {currentStep === 2 && (
            <KeywordsStep data={formData} updateData={updateFormData} />
          )}
          {currentStep === 3 && (
            <ServicesStep data={formData} updateData={updateFormData} />
          )}
          {currentStep === 4 && (
            <ServiceAreasStep data={formData} updateData={updateFormData} />
          )}
          {currentStep === 5 && (
            <BlogsStep data={formData} updateData={updateFormData} />
          )}
          {currentStep === 6 && (
            <DesignStep data={formData} updateData={updateFormData} />
          )}
          {currentStep === 7 && (
            <UrlStructureStep data={formData} updateData={updateFormData} />
          )}
          {currentStep === 8 && (
            <ReviewStep data={formData} goToStep={goToStep} />
          )}
        </CardContent>

        {/* Footer Navigation Buttons */}
        <CardFooter className="flex items-center justify-between border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={handleNext}>
              {currentStep === 7 ? "Review Website Details" : "Next Step"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? "Preparing Website..." : "Generate Website with AI"}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
