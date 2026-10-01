"use client";

import * as React from "react";
import { Tabs } from "@/components/ui/Tabs";
import { HeroSlidesTab } from "@/components/admin/content/HeroSlidesTab";
import { BannersTab } from "@/components/admin/content/BannersTab";
import { HomepageSectionsTab } from "@/components/admin/content/HomepageSectionsTab";
import { EditorialTab } from "@/components/admin/content/EditorialTab";
import { AboutPageTab } from "@/components/admin/content/AboutPageTab";
import { FaqsTab } from "@/components/admin/content/FaqsTab";
import { JournalTab } from "@/components/admin/content/JournalTab";
import { PoliciesTab } from "@/components/admin/content/PoliciesTab";
import { NewsletterTab } from "@/components/admin/content/NewsletterTab";

const TABS = [
  { id: "hero", label: "Hero Slides" },
  { id: "banners", label: "Banners" },
  { id: "homepage", label: "Homepage Sections" },
  { id: "editorial", label: "Editorial" },
  { id: "about", label: "About Page" },
  { id: "faqs", label: "FAQs" },
  { id: "journal", label: "Journal" },
  { id: "policies", label: "Policies" },
  { id: "newsletter", label: "Newsletter" },
];

export function AdminContentView() {
  const [tab, setTab] = React.useState("hero");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Content</h1>
        <p className="mt-1.5 text-sm text-stone">Homepage, editorial, journal and policy content.</p>
      </div>

      <Tabs items={TABS} value={tab} onChange={setTab} className="flex-wrap" />

      {tab === "hero" && <HeroSlidesTab />}
      {tab === "banners" && <BannersTab />}
      {tab === "homepage" && <HomepageSectionsTab />}
      {tab === "editorial" && <EditorialTab />}
      {tab === "about" && <AboutPageTab />}
      {tab === "faqs" && <FaqsTab />}
      {tab === "journal" && <JournalTab />}
      {tab === "policies" && <PoliciesTab />}
      {tab === "newsletter" && <NewsletterTab />}
    </div>
  );
}
