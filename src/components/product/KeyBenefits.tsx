import { CheckCircle2 } from "lucide-react";

export function KeyBenefits({ benefits }: { benefits: string[] }) {
  if (benefits.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone">Key benefits</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-sm leading-relaxed text-stone">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
}
