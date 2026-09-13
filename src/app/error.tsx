"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled runtime error captured by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-border bg-card text-card-foreground rounded-lg p-6 shadow-xs text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected application error occurred. You can retry the operation or return to your dashboard.
          </p>
          {error?.message && (
            <p className="text-[11px] font-mono bg-muted p-2 rounded text-destructive/80 mt-2 break-all text-left">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Button onClick={() => reset()} size="sm" className="gap-1.5 font-medium">
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
          >
            <Home className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
