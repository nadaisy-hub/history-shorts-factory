"use client";

import { Check } from "lucide-react";
import { PIPELINE_STEPS, type ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Stepper({ status }: { status: ProjectStatus }) {
  const currentStepIndex = PIPELINE_STEPS.findIndex((step) =>
    step.statuses.includes(status)
  );

  return (
    <div className="flex items-center gap-1 w-full">
      {PIPELINE_STEPS.map((step, i) => {
        const isCompleted = i < currentStepIndex || status === 'published';
        const isCurrent = i === currentStepIndex;
        const isReview = isCurrent && status.endsWith('_review');

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1 gap-1.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all",
                  isCompleted && "bg-primary text-primary-foreground border-primary",
                  isCurrent && !isReview && "border-purple-500 bg-purple-500/20 text-purple-400 animate-pulse",
                  isCurrent && isReview && "border-amber-500 bg-amber-500/20 text-amber-400",
                  !isCompleted && !isCurrent && "border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent && isReview ? (
                  "●"
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-1 mt-[-1.25rem]",
                  i < currentStepIndex ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
