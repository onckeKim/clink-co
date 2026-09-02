import { Truck, ShieldCheck, PackageOpen, MessageCircleQuestion } from "lucide-react";

const features = [
  { icon: Truck, label: "Free shipping over $75" },
  { icon: ShieldCheck, label: "Lifetime breakage guarantee" },
  { icon: PackageOpen, label: "Complimentary gift wrapping" },
  { icon: MessageCircleQuestion, label: "Support seven days a week" },
];

export function FeatureStrip() {
  return (
    <div className="bg-ink text-ivory">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-6 sm:px-8 lg:grid-cols-4">
        {features.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0 text-ivory/80" strokeWidth={1.5} />
            <span className="text-xs font-medium sm:text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
