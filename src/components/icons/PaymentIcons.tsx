import type { ReactNode, SVGProps } from "react";

/**
 * Simplified, monochrome payment-method marks (not exact brand logos) that
 * sit quietly in the footer to signal accepted payment types. Swap for
 * official brand SVGs if pixel-accurate logos are required before launch.
 */
function Badge({
  label,
  children,
  ...props
}: SVGProps<SVGSVGElement> & { label: string; children?: ReactNode }) {
  return (
    <svg
      viewBox="0 0 40 26"
      role="img"
      aria-label={label}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      {...props}
    >
      <rect x="0.6" y="0.6" width="38.8" height="24.8" rx="5" />
      {children}
    </svg>
  );
}

export function VisaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge label="Visa" {...props}>
      <text x="20" y="17" textAnchor="middle" fontSize="9" fontStyle="italic" fontWeight="700" stroke="none" fill="currentColor">
        VISA
      </text>
    </Badge>
  );
}

export function MastercardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge label="Mastercard" {...props}>
      <circle cx="17" cy="13" r="6.5" />
      <circle cx="23" cy="13" r="6.5" />
    </Badge>
  );
}

export function AmexIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge label="American Express" {...props}>
      <text x="20" y="17" textAnchor="middle" fontSize="7.5" fontWeight="700" stroke="none" fill="currentColor">
        AMEX
      </text>
    </Badge>
  );
}

export function PayPalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge label="PayPal" {...props}>
      <path
        d="M14 8.5h4.6c2 0 3.3 1.2 3 3-.3 2.2-2 3.3-4 3.3h-1.8l-.6 3.2h-2L14 8.5Z"
        fill="none"
      />
      <path d="M16.5 9.7h4.6c2 0 3.3 1.2 3 3-.3 2.2-2 3.3-4 3.3h-1.8" stroke="currentColor" fill="none" />
    </Badge>
  );
}

export function ApplePayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge label="Apple Pay" {...props}>
      <text x="20" y="17" textAnchor="middle" fontSize="8" fontWeight="600" stroke="none" fill="currentColor">
        Pay
      </text>
      <path
        d="M11.5 9.2c.4-.5.7-1.1.6-1.8-.6 0-1.3.4-1.7.9-.4.4-.7 1.1-.6 1.7.7.1 1.3-.3 1.7-.8Z"
        fill="currentColor"
        stroke="none"
      />
    </Badge>
  );
}

export function GooglePayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge label="Google Pay" {...props}>
      <text x="20" y="17" textAnchor="middle" fontSize="7.5" fontWeight="600" stroke="none" fill="currentColor">
        G Pay
      </text>
    </Badge>
  );
}

export const paymentIcons = [
  { label: "Visa", Icon: VisaIcon },
  { label: "Mastercard", Icon: MastercardIcon },
  { label: "American Express", Icon: AmexIcon },
  { label: "PayPal", Icon: PayPalIcon },
  { label: "Apple Pay", Icon: ApplePayIcon },
  { label: "Google Pay", Icon: GooglePayIcon },
];
