"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { useConsentStore } from "@/store/consent-store";
import { useMounted } from "@/lib/hooks/use-mounted";

export function CookieBanner() {
  const mounted = useMounted();
  const hasDecided = useConsentStore((state) => state.hasDecided);
  const acceptAll = useConsentStore((state) => state.acceptAll);
  const rejectNonEssential = useConsentStore((state) => state.rejectNonEssential);
  const savePreferences = useConsentStore((state) => state.savePreferences);
  const storedAnalytics = useConsentStore((state) => state.analytics);
  const storedMarketing = useConsentStore((state) => state.marketing);

  const [preferencesOpen, setPreferencesOpen] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(storedAnalytics);
  const [marketing, setMarketing] = React.useState(storedMarketing);

  const openPreferences = () => {
    setAnalytics(storedAnalytics);
    setMarketing(storedMarketing);
    setPreferencesOpen(true);
  };

  const showBanner = mounted && !hasDecided;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Cookie preferences"
            className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-md"
          >
            <div className="rounded-3xl border border-sand/70 bg-warm-white p-6 shadow-lifted">
              <div className="flex items-start gap-3">
                <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-stone" />
                <p className="text-sm leading-relaxed text-charcoal">
                  We use cookies to keep the site running smoothly and, with your permission, to
                  understand how it&apos;s used and personalise what we show you. Read our{" "}
                  <Link href="/privacy" className="link-underline font-medium">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" onClick={acceptAll}>
                  Accept all
                </Button>
                <Button size="sm" variant="secondary" onClick={rejectNonEssential}>
                  Reject non-essential
                </Button>
                <Button size="sm" variant="ghost" onClick={openPreferences}>
                  Manage preferences
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        title="Cookie preferences"
      >
        <p className="text-sm leading-relaxed text-stone">
          Choose which categories of cookies you&apos;re comfortable with. You can update this at any
          time from the link in our footer.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <PreferenceRow
            id="cookie-essential"
            title="Essential"
            description="Required for the site, cart and checkout to function. Always on."
            checked
            disabled
            onCheckedChange={() => {}}
          />
          <PreferenceRow
            id="cookie-analytics"
            title="Analytics"
            description="Helps us understand how the site is used so we can improve it."
            checked={analytics}
            onCheckedChange={setAnalytics}
          />
          <PreferenceRow
            id="cookie-marketing"
            title="Marketing"
            description="Lets us tailor offers and remind you about pieces you've viewed."
            checked={marketing}
            onCheckedChange={setMarketing}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              savePreferences({ analytics, marketing });
              setPreferencesOpen(false);
            }}
          >
            Save preferences
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              acceptAll();
              setPreferencesOpen(false);
            }}
          >
            Accept all
          </Button>
        </div>
      </Modal>
    </>
  );
}

function PreferenceRow({
  id,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-charcoal">
          {title}
        </label>
        <p id={`${id}-desc`} className="mt-0.5 text-xs leading-relaxed text-stone">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={title}
        aria-describedby={`${id}-desc`}
      />
    </div>
  );
}
