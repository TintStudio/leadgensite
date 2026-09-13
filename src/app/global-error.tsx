"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-border bg-card rounded-lg p-6 shadow-xs text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Critical System Error</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A layout-level exception occurred. Please reload the application.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Button onClick={() => reset()} size="sm" className="gap-1.5 font-medium">
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Application
            </Button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
