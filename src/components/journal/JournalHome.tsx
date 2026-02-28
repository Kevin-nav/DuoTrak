"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import JournalComposer from "@/components/journal/JournalComposer";
import JournalEntriesList from "@/components/journal/JournalEntriesList";
import JournalSearch from "@/components/journal/JournalSearch";
import JournalPagesPanel from "@/components/journal/JournalPagesPanel";
import JournalCalendarPanel from "@/components/journal/JournalCalendarPanel";
import JournalDuoPulse from "@/components/journal/JournalDuoPulse";
import JournalDuoPrompt from "@/components/journal/JournalDuoPrompt";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  JournalSpaceType,
  useCreateJournalEntry,
  useCreateJournalPage,
  useJournalEntries,
  useEnsureJournalSpaces,
  useJournalHome,
  useJournalPages,
  useSharePrivateEntry,
} from "@/hooks/useJournal";
import { BookOpenText, Calendar, FileText, Loader2, Lock, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const tabs: Array<{ id: JournalSpaceType; label: string; icon: any }> = [
  { id: "shared", label: "Shared Journal", icon: Users },
  { id: "private", label: "My Private Journal", icon: Lock },
];

export default function JournalHome() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<JournalSpaceType>("shared");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const ensureSpaces = useEnsureJournalSpaces();
  const { message, isLoading: isMetaLoading } = useJournalHome(activeTab);
  const { entries, loadMore, hasMore, isLoading: isEntriesLoading, isLoadingMore } = useJournalEntries(activeTab);
  const { pages } = useJournalPages(activeTab);
  const createEntry = useCreateJournalEntry();
  const createPage = useCreateJournalPage();
  const sharePrivateEntry = useSharePrivateEntry();

  useEffect(() => {
    ensureSpaces().catch(() => {
      toast.error("Could not initialize journal spaces.");
    });
  }, [ensureSpaces]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || isEntriesLoading || isLoadingMore || !!message) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries[0];
        if (hit?.isIntersecting) {
          loadMore(12);
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isEntriesLoading, isLoadingMore, loadMore, message]);

  return (
    <DashboardLayout maxWidthClass="max-w-[1600px] px-2 sm:px-4">
      <div className="flex min-h-[calc(100dvh-9rem)] flex-col gap-4 overflow-x-hidden">
        {/* Header Section */}
        <motion.section
          initial={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-landing-clay bg-white/95 p-3 shadow-sm sm:p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-landing-espresso sm:text-xl">
                <BookOpenText className="h-4 w-4 sm:h-5 sm:w-5" />
                Journal Workspace
              </h1>
              <p className="mt-1 text-xs text-landing-espresso-light sm:text-sm">
                Reflective thinking and duo collaboration in a unified space.
              </p>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <FileText className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Workspace Pages</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4">
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
                      onOpenPage={(pageId) => router.push(`/journal/pages/${pageId}`)}
                    />
                  </div>
                </DrawerContent>
              </Drawer>

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Journal Insights</DrawerTitle>
                  </DrawerHeader>
                  <div className="space-y-6 overflow-y-auto p-4 pb-12">
                    <JournalCalendarPanel spaceType={activeTab} />
                    <div className="border-t border-landing-clay pt-6">
                      <JournalDuoPulse />
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className={`w-full rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${isActive
                      ? "bg-landing-espresso text-landing-cream"
                      : "border border-landing-clay text-landing-espresso-light hover:bg-landing-cream"
                    }`}
                >
                  <span className="inline-flex items-center gap-1.5 sm:gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="sm:hidden">{tab.id === "shared" ? "Shared" : "Private"}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Main Content Area */}
        <div className="min-h-0 flex-1">
          {/* Desktop Layout: 3 Columns */}
          <div className="hidden h-full lg:block">
            <ResizablePanelGroup direction="horizontal" className="h-full items-stretch">
              {/* Left Sidebar: Pages */}
              <ResizablePanel defaultSize={20} minSize={16} maxSize={30} className="hidden min-w-0 lg:block">
                <div className="h-full min-w-0 overflow-x-hidden overflow-y-auto pr-4">
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
                    onOpenPage={(pageId) => router.push(`/journal/pages/${pageId}`)}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="hidden lg:flex" />

              {/* Center Column: Feed */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex h-full flex-col gap-4 overflow-y-auto px-1 pb-10">
                  <JournalSearch />

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

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeTab}
                      initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-4"
                    >
                      {isMetaLoading || isEntriesLoading ? (
                        <div className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light">
                          Loading journal entries...
                        </div>
                      ) : null}

                      {!isEntriesLoading && !isMetaLoading && message ? (
                        <div className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light">
                          {message}
                        </div>
                      ) : null}

                      {!isEntriesLoading && !isMetaLoading && !message ? (
                        <>
                          {activeTab === "shared" && (
                            <div className="mb-6">
                              <JournalDuoPrompt />
                            </div>
                          )}
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
                          {entries.length > 0 ? (
                            <div className="space-y-2">
                              <div ref={loadMoreRef} className="h-1 w-full" aria-hidden />
                              <div className="rounded-xl border border-landing-clay bg-white px-3 py-2 text-center text-xs text-landing-espresso-light">
                                {isLoadingMore ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Loading more entries...
                                  </span>
                                ) : hasMore ? (
                                  "Scroll to load more entries"
                                ) : (
                                  "You have reached the end of your journal history."
                                )}
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="hidden lg:flex" />

              {/* Right Sidebar: Calendar & Pulse */}
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40} className="hidden lg:block">
                <div className="flex h-full flex-col gap-6 overflow-y-auto pl-4">
                  <JournalCalendarPanel spaceType={activeTab} />

                  <div className="border-t border-landing-clay pt-6">
                    <JournalDuoPulse />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Mobile Layout: Stacked Feed only */}
          <div className="h-full overflow-y-auto pb-20 lg:hidden">
            <div className="flex flex-col gap-4">
              <JournalSearch />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {isMetaLoading || isEntriesLoading ? (
                    <div className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light">
                      Loading journal entries...
                    </div>
                  ) : null}

                  {!isEntriesLoading && !isMetaLoading && message ? (
                    <div className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light">
                      {message}
                    </div>
                  ) : null}

                  {activeTab === "shared" && (
                    <div className="px-1">
                      <JournalDuoPrompt />
                    </div>
                  )}
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
                  {entries.length > 0 ? <div ref={loadMoreRef} className="h-1 w-full" aria-hidden /> : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-30 sm:right-6 lg:hidden">
        <Drawer open={isComposerOpen} onOpenChange={setIsComposerOpen}>
          <DrawerTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full bg-landing-espresso shadow-xl ring-2 ring-white">
              <Plus className="h-6 w-6 text-landing-cream" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>New {activeTab === "shared" ? "Shared" : "Private"} Entry</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto p-4 pb-12">
              <JournalComposer
                spaceType={activeTab}
                onCreate={async (payload) => {
                  try {
                    await createEntry(payload);
                    toast.success("Entry saved.");
                    setIsComposerOpen(false);
                  } catch (error: any) {
                    toast.error(error?.message || "Failed to save entry.");
                    throw error;
                  }
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </DashboardLayout>
  );
}
