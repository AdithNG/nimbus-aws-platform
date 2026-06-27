"use client";

import { Zap, Github, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/60">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 text-white">
            <Zap className="size-3" fill="currentColor" />
          </span>
          <span>
            <span className="font-medium text-foreground">Nimbus</span> · Autonomous
            AWS Email &amp; Admin Platform
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            SES · IAM · S3 · CloudTrail
          </span>
          <span className="hidden sm:inline">© {new Date().getFullYear()} Nimbus Labs</span>
          <a
            href="#"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            onClick={(e) => e.preventDefault()}
          >
            <Github className="size-3.5" />
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
