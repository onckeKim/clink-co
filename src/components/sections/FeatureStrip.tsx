import { Truck, Lock, Gem, RotateCcw } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/utils";

const features = [
  {
    icon: Truck,
    label: `Free delivery over ${formatPrice(siteConfig.freeDeliveryThreshold)}`,
  },
  { icon: Lock, label: "Secure online payment" },
  { icon: Gem, label: "Quality, carefully selected" },
  { icon: RotateCcw, label: `Easy returns within ${siteConfig.returnWindowDays} days` },
];

export function FeatureStrip() {
  return (
    <div className="bg-charcoal text-warm-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-6 sm:px-8 lg:grid-cols-4">
        {features.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0 text-warm-white/80" strokeWidth={1.5} />
            <span className="text-xs font-medium sm:text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
