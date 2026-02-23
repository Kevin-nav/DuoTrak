"use client";

import { useMemo } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export type JournalSpaceType = "private" | "shared";

export function useJournalHome(spaceType: JournalSpaceType) {
  const data = useQuery((api as any).journal.getHome, { spaceType, limit: 1 }) as
    | { space: any; entries: any[]; message: string | null }
    | undefined;

  return {
    space: data?.space ?? null,
    entries: data?.entries ?? [],
    message: data?.message ?? null,
    isLoading: data === undefined,
  };
}

export function useJournalEntries(spaceType: JournalSpaceType) {
  const { results, status, loadMore } = usePaginatedQuery(
    (api as any).journal.getEntriesPage,
    { spaceType },
    { initialNumItems: 12 }
  ) as {
    results: any[];
    status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
    loadMore: (count: number) => void;
  };

  return {
    entries: results ?? [],
    loadMore,
    hasMore: status === "CanLoadMore",
    isLoading: status === "LoadingFirstPage",
    isLoadingMore: status === "LoadingMore",
  };
}

export function useEnsureJournalSpaces() {
  const ensure = useMutation((api as any).journal.ensureSpaces);
  return async () => ensure({});
}

export function useCreateJournalEntry() {
  const mutation = useMutation((api as any).journal.createEntry);
  return (payload: {
    spaceType: JournalSpaceType;
    title: string;
    body: string;
    mood?: string;
    tags?: string[];
  }) => mutation(payload);
}

export function useJournalPages(spaceType: JournalSpaceType) {
  const data = useQuery((api as any).journal.listPages, { spaceType }) as any[] | undefined;
  return {
    pages: data ?? [],
    isLoading: data === undefined,
  };
}

export function useCreateJournalPage() {
  const mutation = useMutation((api as any).journal.createPage);
  return (payload: { spaceType: JournalSpaceType; title: string; icon?: string }) => mutation(payload);
}

export function useJournalPage(pageId: string) {
  const data = useQuery((api as any).journal.getPageWithBlocks, pageId ? ({ pageId } as any) : "skip") as
    | { page: any; blocks: any[] }
    | undefined;
  return {
    page: data?.page ?? null,
    blocks: data?.blocks ?? [],
    isLoading: data === undefined,
  };
}

export function useReplaceJournalPageBlocks() {
  const mutation = useMutation((api as any).journal.replacePageBlocks);
  return (payload: {
    pageId: string;
    blocks: Array<{
      type: string;
      content?: string;
      checked?: boolean;
      meta_json?: string;
    }>;
  }) => mutation(payload as any);
}

export function useUpdateJournalEntry() {
  const mutation = useMutation((api as any).journal.updateEntry);
  return (payload: {
    entryId: string;
    title?: string;
    body?: string;
    mood?: string;
    tags?: string[];
  }) => mutation(payload as any);
}

export function useSharePrivateEntry() {
  const mutation = useMutation((api as any).journal.sharePrivateEntry);
  return (entryId: string) => mutation({ entryId } as any);
}

export function useJournalSearch(params: {
  q: string;
  spaceType?: "all" | JournalSpaceType;
  tag?: string;
  dateFrom?: number;
  dateTo?: number;
}) {
  const canSearch = params.q.trim().length >= 2;
  const data = useQuery(
    (api as any).journal.search,
    canSearch
      ? {
          q: params.q,
          spaceType: params.spaceType ?? "all",
          tag: params.tag || undefined,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          limit: 50,
        }
      : "skip"
  ) as { results: any[]; total: number } | undefined;

  return useMemo(
    () => ({
      results: data?.results ?? [],
      total: data?.total ?? 0,
      isLoading: canSearch && data === undefined,
    }),
    [canSearch, data]
  );
}
