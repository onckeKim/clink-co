"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { StoreSettings } from "@/types/settings";
import type { DeliveryMethodId } from "@/config/delivery";
import type { PaymentMethodId } from "@/lib/orders/types";
import { deliveryMethods } from "@/config/delivery";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toast";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";

const PAYMENT_METHOD_LABELS: Record<PaymentMethodId, string> = {
  test: "Test / demo payments",
  eft: "EFT (bank transfer)",
  payfast: "PayFast",
  ozow: "Ozow",
  yoco: "Yoco",
  peach: "Peach Payments",
};
const PAYMENT_METHOD_IDS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethodId[];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-sand p-5">
      <h2 className="font-display text-lg text-charcoal">{title}</h2>
      {description && <p className="mt-1 text-xs text-stone">{description}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

export function AdminSettingsView() {
  const [settings, setSettings] = React.useState<StoreSettings | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { settings?: StoreSettings } | null) => setSettings(data?.settings ?? null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save these settings.");
        return;
      }
      setSettings(data.settings);
      toast.success("Store settings updated.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDeliveryMethod = (id: DeliveryMethodId, checked: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      enabledDeliveryMethodIds: checked
        ? [...settings.enabledDeliveryMethodIds, id]
        : settings.enabledDeliveryMethodIds.filter((m) => m !== id),
    });
  };

  const togglePaymentMethod = (id: PaymentMethodId, checked: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      enabledPaymentMethodIds: checked
        ? [...settings.enabledPaymentMethodIds, id]
        : settings.enabledPaymentMethodIds.filter((m) => m !== id),
    });
  };

  if (!settings) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-charcoal">Store Settings</h1>
          <p className="mt-1.5 text-sm text-stone">Business details, delivery, payments and store-wide behaviour.</p>
        </div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save all changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Business">
          <div>
            <Label htmlFor="s-business-name">Business name</Label>
            <Input id="s-business-name" value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} />
          </div>
          <div>
            <Label>Logo</Label>
            <SingleImageUploader value={settings.logoUrl} onChange={(url) => setSettings({ ...settings, logoUrl: url })} folder="branding" label="Logo" />
          </div>
        </Section>

        <Section title="Contact details">
          <div>
            <Label htmlFor="s-contact-email">Contact email</Label>
            <Input id="s-contact-email" type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="s-contact-phone">Contact phone</Label>
            <Input id="s-contact-phone" value={settings.contactPhone} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} />
          </div>
        </Section>

        <Section title="Tax & delivery" description="Applied across the storefront and checkout.">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="s-tax">Tax rate (%)</Label>
              <Input id="s-tax" type="number" inputMode="decimal" value={settings.taxRatePercent} onChange={(e) => setSettings({ ...settings, taxRatePercent: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="s-free-delivery">Free-delivery threshold (ZAR)</Label>
              <Input id="s-free-delivery" type="number" inputMode="decimal" value={settings.freeDeliveryThreshold} onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>Delivery methods</Label>
            <div className="mt-1 flex flex-col gap-2">
              {deliveryMethods.map((method) => (
                <label key={method.id} className="flex items-center gap-2 text-sm text-charcoal">
                  <Checkbox
                    checked={settings.enabledDeliveryMethodIds.includes(method.id)}
                    onCheckedChange={(checked) => toggleDeliveryMethod(method.id, checked)}
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Payment methods" description="Still gated by that provider's own credentials being configured.">
          <div className="flex flex-col gap-2">
            {PAYMENT_METHOD_IDS.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm text-charcoal">
                <Checkbox
                  checked={settings.enabledPaymentMethodIds.includes(id)}
                  onCheckedChange={(checked) => togglePaymentMethod(id, checked)}
                />
                {PAYMENT_METHOD_LABELS[id]}
              </label>
            ))}
          </div>
        </Section>

        <Section title="Email sender">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="s-sender-name">Sender name</Label>
              <Input id="s-sender-name" value={settings.emailSenderName} onChange={(e) => setSettings({ ...settings, emailSenderName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-sender-local">Sender address (local part)</Label>
              <Input id="s-sender-local" value={settings.emailSenderLocalPart} onChange={(e) => setSettings({ ...settings, emailSenderLocalPart: e.target.value })} placeholder="orders" />
            </div>
          </div>
          <div>
            <Label htmlFor="s-order-notify">New-order notification email</Label>
            <Input id="s-order-notify" type="email" value={settings.orderNotificationEmail} onChange={(e) => setSettings({ ...settings, orderNotificationEmail: e.target.value })} />
          </div>
        </Section>

        <Section title="Social media profiles">
          <div>
            <Label htmlFor="s-instagram">Instagram</Label>
            <Input id="s-instagram" value={settings.social.instagram} onChange={(e) => setSettings({ ...settings, social: { ...settings.social, instagram: e.target.value } })} />
          </div>
          <div>
            <Label htmlFor="s-facebook">Facebook</Label>
            <Input id="s-facebook" value={settings.social.facebook} onChange={(e) => setSettings({ ...settings, social: { ...settings.social, facebook: e.target.value } })} />
          </div>
          <div>
            <Label htmlFor="s-tiktok">TikTok</Label>
            <Input id="s-tiktok" value={settings.social.tiktok} onChange={(e) => setSettings({ ...settings, social: { ...settings.social, tiktok: e.target.value } })} />
          </div>
          <div>
            <Label htmlFor="s-pinterest">Pinterest</Label>
            <Input id="s-pinterest" value={settings.social.pinterest} onChange={(e) => setSettings({ ...settings, social: { ...settings.social, pinterest: e.target.value } })} />
          </div>
          <div>
            <Label htmlFor="s-whatsapp">WhatsApp link</Label>
            <Input id="s-whatsapp" value={settings.social.whatsapp} onChange={(e) => setSettings({ ...settings, social: { ...settings.social, whatsapp: e.target.value } })} />
          </div>
        </Section>

        <Section title="Orders & returns">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="s-order-prefix">Order number prefix</Label>
              <Input id="s-order-prefix" value={settings.orderNumberPrefix} onChange={(e) => setSettings({ ...settings, orderNumberPrefix: e.target.value.toUpperCase() })} placeholder="CC" />
            </div>
            <div>
              <Label htmlFor="s-return-window">Return window (days)</Label>
              <Input id="s-return-window" type="number" inputMode="numeric" value={settings.returnWindowDays} onChange={(e) => setSettings({ ...settings, returnWindowDays: Number(e.target.value) })} />
            </div>
          </div>
        </Section>

        <Section title="Maintenance mode" description="Takes the storefront offline for everyone except signed-in admins.">
          <div className="flex items-center gap-3">
            <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })} id="s-maintenance" />
            <Label htmlFor="s-maintenance" className="mb-0 normal-case tracking-normal text-charcoal">
              Maintenance mode is {settings.maintenanceMode ? "on" : "off"}
            </Label>
          </div>
          <div>
            <Label htmlFor="s-maintenance-message">Holding page message</Label>
            <Textarea id="s-maintenance-message" value={settings.maintenanceMessage} onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })} />
          </div>
        </Section>

        <Section
          title="Abandoned cart emails"
          description="A reminder email sent to signed-in customers who leave items in their cart — only to customers who've opted into marketing emails, and never after they've completed an order."
        >
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.abandonedCartEnabled}
              onCheckedChange={(v) => setSettings({ ...settings, abandonedCartEnabled: v })}
              id="s-abandoned-cart-enabled"
            />
            <Label htmlFor="s-abandoned-cart-enabled" className="mb-0 normal-case tracking-normal text-charcoal">
              Abandoned cart emails are {settings.abandonedCartEnabled ? "on" : "off"}
            </Label>
          </div>
          <div>
            <Label htmlFor="s-abandoned-cart-delay">Send after (hours of inactivity)</Label>
            <Input
              id="s-abandoned-cart-delay"
              type="number"
              inputMode="numeric"
              min={1}
              max={168}
              value={settings.abandonedCartDelayHours}
              onChange={(e) => setSettings({ ...settings, abandonedCartDelayHours: Number(e.target.value) })}
              className="max-w-[160px]"
            />
          </div>
        </Section>
      </div>
    </form>
  );
}
