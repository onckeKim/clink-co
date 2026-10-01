import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const CHECKOUT_STEP_LABELS = ["Customer", "Delivery", "Shipping", "Billing", "Payment", "Review"];

export function CheckoutProgress({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="hidden items-center sm:flex">
        {CHECKOUT_STEP_LABELS.map((label, i) => {
          const state = i < currentStep ? "done" : i === currentStep ? "current" : "upcoming";
          const isLast = i === CHECKOUT_STEP_LABELS.length - 1;
          return (
            <li key={label} className={cn("flex items-center", !isLast && "flex-1")}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    state === "done" && "bg-charcoal text-warm-white",
                    state === "current" && "border-2 border-charcoal text-charcoal",
                    state === "upcoming" && "border border-sand text-stone",
                  )}
                >
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn("text-xs font-medium", state === "upcoming" ? "text-stone" : "text-charcoal")}>
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className={cn("mx-3 h-px flex-1", state === "done" ? "bg-charcoal" : "bg-sand")} />
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-xs font-medium text-stone sm:hidden">
        Step {currentStep + 1} of {CHECKOUT_STEP_LABELS.length}:{" "}
        <span className="text-charcoal">{CHECKOUT_STEP_LABELS[currentStep]}</span>
      </p>
    </nav>
  );
}
