"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import JournalComposer from "@/components/journal/JournalComposer";
import JournalEntriesList from "@/components/journal/JournalEntriesList";
import JournalSearch from "@/components/journal/JournalSearch";
import JournalPagesPanel from "@/components/journal/JournalPagesPanel";
import {
  JournalSpaceType,
  useCreateJournalEntry,
  useCreateJournalPage,
  useEnsureJournalSpaces,
  useJournalHome,
  useJournalPages,
  useSharePrivateEntry,
} from "@/hooks/useJournal";
import { BookOpenText, Lock, Users } from "lucide-react";

const tabs: Array<{ id: JournalSpaceType; label: string; icon: any }> = [
  { id: "shared", label: "Shared Journal", icon: Users },
  { id: "private", label: "My Private Journal", icon: Lock },
];

export default function JournalHome() {
  const [activeTab, setActiveTab] = useState<JournalSpaceType>("shared");
  const ensureSpaces = useEnsureJournalSpaces();
  const { entries, message, isLoading } = useJournalHome(activeTab);
  const { pages } = useJournalPages(activeTab);
  const createEntry = useCreateJournalEntry();
  const createPage = useCreateJournalPage();
  const sharePrivateEntry = useSharePrivateEntry();

  useEffect(() => {
    ensureSpaces().catch(() => {
      toast.error("Could not initialize journal spaces.");
    });
  }, [ensureSpaces]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <section className="rounded-2xl border border-landing-clay bg-white/95 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-landing-espresso">
                <BookOpenText className="h-5 w-5" />
                Journal
              </h1>
              <p className="mt-1 text-sm text-landing-espresso-light">
                Long-form journaling with shared and private spaces, plus searchable history.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-landing-espresso text-landing-cream"
                      : "border border-landing-clay text-landing-espresso-light hover:bg-landing-cream"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <JournalSearch />

        <JournalPagesPanel
          spaceType={activeTab}
          pages={pages}
          onCreatePage={async (payload) => {
            try {
              await createPage(payload);
              toast.success("Page created.");
            } catch (error: any) {
              toast.error(error?.message || "Could not create page.");
              throw error;
            }
          }}
        />

        <JournalComposer
          spaceType={activeTab}
          onCreate={async (payload) => {
            try {
              await createEntry(payload);
              toast.success("Entry saved.");
            } catch (error: any) {
              toast.error(error?.message || "Failed to save entry.");
              throw error;
            }
          }}
        />

        {isLoading ? (
          <div className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light">
            Loading journal entries...
          </div>
        ) : null}

        {!isLoading && message ? (
          <div className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light">
            {message}
          </div>
        ) : null}

        {!isLoading && !message ? (
          <JournalEntriesList
            entries={entries}
            activeSpaceType={activeTab}
            onSharePrivateEntry={async (entryId) => {
              try {
                await sharePrivateEntry(entryId);
                toast.success("Entry shared with partner.");
              } catch (error: any) {
                toast.error(error?.message || "Could not share entry.");
              }
            }}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
