"use client";

import { useMemo, useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useJournalSearch } from "@/hooks/useJournal";
import { format } from "date-fns";

export default function JournalSearch() {
  const [query, setQuery] = useState("");
  const [spaceType, setSpaceType] = useState<"all" | "private" | "shared">("all");
  const [tag, setTag] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(
    () => ({
      q: query,
      spaceType,
      tag: tag || undefined,
      dateFrom: fromDate ? new Date(fromDate).getTime() : undefined,
      dateTo: toDate ? new Date(toDate).getTime() : undefined,
    }),
    [query, spaceType, tag, fromDate, toDate]
  );

  const { results, total, isLoading } = useJournalSearch(params);

  return (
    <section className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-landing-espresso-light" />
          <h2 className="text-base font-bold text-landing-espresso">Search journals</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((current) => !current)}
          className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2 py-1 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream sm:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      <div className="space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search text in journals..."
          className="w-full rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
        />
        <div className={`${showFilters || query.trim().length > 0 ? "grid" : "hidden"} grid-cols-1 gap-2 sm:grid sm:grid-cols-4`}>
            <select
              value={spaceType}
              onChange={(e) => setSpaceType(e.target.value as any)}
              className="rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none"
            >
              <option value="all">All spaces</option>
              <option value="private">Private</option>
              <option value="shared">Shared</option>
            </select>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag filter"
              className="rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none"
            />
          </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-landing-espresso-light">
        <Filter className="h-3.5 w-3.5" />
        {isLoading ? "Searching..." : `${total} result${total === 1 ? "" : "s"}`}
      </div>

      {query.trim().length >= 2 ? (
        <div className="mt-3 space-y-2">
          {results.map((result) => (
            <div key={result._id} className="rounded-xl border border-landing-clay bg-landing-cream p-3">
              <div className="flex flex-col items-start justify-between gap-1.5 sm:flex-row sm:gap-2">
                <p className="text-sm font-semibold text-landing-espresso">{result.title}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-landing-espresso-light">
                  {result.space_type}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-landing-espresso-light">{result.body}</p>
              <p className="mt-2 text-[11px] text-landing-espresso-light">
                {format(new Date(result.entry_date || result.created_at), "MMM d, yyyy")} by {result.author_name}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
