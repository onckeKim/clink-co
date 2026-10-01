import type { SVGProps } from "react";

/**
 * lucide-react no longer ships brand/social marks, so these are
 * hand-drawn to match its stroke-based icon style (1.5px round stroke).
 */
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v3.5H8V21h3.5v-7.5h3l.5-3.5h-3.5V7.8c0-.9.5-1.3 1.4-1.3H15V3Z" />
    </svg>
  );
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="M10.5 9.5v5l4.3-2.5-4.3-2.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3v10.8a2.9 2.9 0 1 1-2.2-2.8" />
      <path d="M14 3c.4 2.2 2 3.9 4.2 4.2" strokeLinecap="round" />
    </svg>
  );
}

export function PinterestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 18c.8-2.4 1.6-5.2 2.1-7.2a2.3 2.3 0 0 1 4.5.7c0 2-1.1 3.8-2.9 3.8-.7 0-1.3-.3-1.6-.9" />
      <path d="M11.6 10.8c-.2-1.4.8-2.8 2.4-2.8" strokeLinecap="round" />
    </svg>
  );
}

export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17.5 5.5 21l3.6-1.4A8 8 0 1 0 6 13.5" strokeLinejoin="round" />
      <path d="M9.2 9.7c-.2 1 .6 2.7 1.4 3.5.8.8 2.5 1.7 3.5 1.4.4-.1.9-.7 1-1.1.1-.3 0-.4-.2-.6l-1.4-.9c-.2-.1-.3-.1-.5 0l-.5.5c-.2.2-.4.2-.6 0-.5-.3-1-.8-1.4-1.4-.2-.2-.2-.4 0-.6l.5-.5c.1-.2.2-.3 0-.5l-.9-1.4c-.1-.2-.3-.3-.6-.2-.4.1-1 .6-1.1 1Z" />
    </svg>
  );
}
