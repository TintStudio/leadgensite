"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerationProgressModalProps {
  isOpen: boolean;
  websiteId: string;
  websiteName?: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export function GenerationProgressModal({
  isOpen,
  websiteId,
  websiteName,
  onComplete,
  onClose,
}: GenerationProgressModalProps) {
  const [statusMessage, setStatusMessage] = useState("Researching keywords for new pages");
  const [currentPages, setCurrentPages] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [percentage, setPercentage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const startedRef = useRef(false);

  const startStream = useCallback(() => {
    if (!websiteId) return;

    setError(null);
    setIsFinished(false);
    setStatusMessage("Researching keywords for new pages");
    setCurrentPages(0);
    setPercentage(0);

    // Close any previous event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/websites/${websiteId}/generate-stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.phase === "error") {
          setError(data.message || "Failed to generate website");
          eventSource.close();
          return;
        }

        if (data.message) {
          setStatusMessage(data.message);
        }

        if (typeof data.current === "number") {
          setCurrentPages(data.current);
        }

        if (typeof data.total === "number") {
          setTotalPages(data.total);
        }

        if (typeof data.percent === "number") {
          setPercentage(data.percent);
        }

        if (data.phase === "complete") {
          setIsFinished(true);
          setPercentage(100);
          setStatusMessage("Website generated successfully!");
          eventSource.close();
          if (onComplete) {
            setTimeout(() => {
              onComplete();
            }, 1500);
          }
        }
      } catch (err) {
        console.error("Error parsing generation stream", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      if (!isFinished) {
        setError("Connection lost or timeout. Please check your network and try again.");
      }
    };
  }, [websiteId, onComplete, isFinished]);

  useEffect(() => {
    if (isOpen && !startedRef.current) {
      startedRef.current = true;
      startStream();
    } else if (!isOpen) {
      startedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isOpen, startStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header with circular animated icon */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {error ? (
              <AlertCircle className="h-6 w-6 text-destructive" />
            ) : isFinished ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
          </div>

          <div className="space-y-1 flex-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {isFinished
                ? "Website Generated!"
                : error
                ? "Generation Interrupted"
                : "Adding pages to your site"}
            </h2>
            <p className="text-sm font-medium text-muted-foreground">
              {websiteName ? `${websiteName} • ` : ""}
              {statusMessage}
            </p>
          </div>
        </div>

        {/* Progress Display */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-foreground">
              {currentPages} of {totalPages} pages generated
            </span>
            <span className="text-muted-foreground font-mono font-semibold">
              {percentage}%
            </span>
          </div>

          {/* Progress Bar matching Screenshot 1 */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                error
                  ? "bg-destructive"
                  : isFinished
                  ? "bg-emerald-600"
                  : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
        </div>

        {/* Helper Note matching Screenshot 1 */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          {error ? (
            <div className="space-y-2 text-destructive">
              <p className="font-semibold">{error}</p>
              <p className="text-muted-foreground">
                You can retry generating, or check your BYOK API key and settings.
              </p>
            </div>
          ) : (
            <p>
              Don&apos;t close this tab. Pages generate in parallel — a full site typically
              takes 30–60 seconds.
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {error && (
            <>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button size="sm" onClick={startStream} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Retry Generation
              </Button>
            </>
          )}

          {isFinished && (
            <Button
              size="sm"
              onClick={() => {
                if (onClose) onClose();
                if (onComplete) onComplete();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              View Website
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
