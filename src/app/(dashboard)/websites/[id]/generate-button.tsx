"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerationProgressModal } from "@/components/websites/generation-progress-modal";

interface GenerateWebsiteButtonProps {
  websiteId: string;
  currentStatus: string;
  websiteName?: string;
}

export function GenerateWebsiteButton({
  websiteId,
  currentStatus,
  websiteName,
}: GenerateWebsiteButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (
      searchParams.get("autostart") === "1" &&
      currentStatus === "pending" &&
      !hasAutoStarted.current
    ) {
      hasAutoStarted.current = true;
      setShowModal(true);
    }
  }, [searchParams, currentStatus]);

  const handleComplete = () => {
    router.refresh();
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        size="sm"
        className="gap-1.5 font-medium"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {currentStatus === "generated" ? "Re-Generate Pages" : "Generate Pages with AI"}
      </Button>

      <GenerationProgressModal
        isOpen={showModal}
        websiteId={websiteId}
        websiteName={websiteName}
        onComplete={handleComplete}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
