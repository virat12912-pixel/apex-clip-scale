import { CheckCircle, Clock, Eye, DollarSign } from "lucide-react";

interface FinalSubmissionTimelineProps {
  status: "submitted" | "under_review" | "approved" | "rejected" | "paid";
}

const steps = [
  { key: "submitted", label: "Submitted", icon: CheckCircle },
  { key: "under_review", label: "Reviewed", icon: Eye },
  { key: "approved", label: "Approved", icon: CheckCircle },
  { key: "paid", label: "Paid", icon: DollarSign },
];

const statusOrder = ["submitted", "under_review", "approved", "paid"];

export function FinalSubmissionTimeline({ status }: FinalSubmissionTimelineProps) {
  const currentIdx = status === "rejected" ? 1 : statusOrder.indexOf(status);

  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => {
        const isCompleted = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const isRejected = status === "rejected" && i === 1;

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {/* Connector line */}
            {i > 0 && (
              <div className={`absolute top-4 -left-1/2 w-full h-0.5 ${isCompleted ? "bg-primary" : "bg-border/30"}`} />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isRejected
                ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/30"
                : isCompleted
                  ? isCurrent
                    ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                    : "bg-primary/10 text-primary"
                  : "bg-secondary/30 text-muted-foreground/40"
            }`}>
              {isRejected ? (
                <span className="text-xs font-bold">✗</span>
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            <span className={`text-[10px] mt-1.5 font-medium ${
              isRejected ? "text-red-400" : isCompleted ? "text-foreground" : "text-muted-foreground/40"
            }`}>
              {isRejected ? "Rejected" : step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
