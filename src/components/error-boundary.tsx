"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback. Defaults to the built-in recovery UI. */
  fallback?: ReactNode;
  /** Screen name shown in the error message e.g. "Dashboard" */
  screen?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console — replace with error reporting service if desired
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <Card className="w-full max-w-sm p-6 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <AlertTriangle size={26} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {this.props.screen ? `${this.props.screen} couldn't load` : "Something went wrong"}
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                There was an unexpected problem. Your data is safe — try refreshing this section.
              </p>
            </div>
            <Button
              onClick={this.handleReset}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              <RefreshCw size={14} />
              Retry
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
