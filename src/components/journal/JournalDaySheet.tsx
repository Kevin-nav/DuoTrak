"use client";

import { JournalCalendarItem } from "@/lib/journal/calendarTypes";
import { format } from "date-fns";
import { X } from "lucide-react";

type JournalDaySheetProps = {
  date: Date;
  items: JournalCalendarItem[];
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
};

export default function JournalDaySheet({ date, items, isMobile, isOpen, onClose }: JournalDaySheetProps) {
  const content = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-landing-espresso">{format(date, "EEEE, MMM d")}</h3>
        {isMobile ? (
          <button type="button" onClick={onClose} className="rounded-md border border-landing-clay p-1 text-landing-espresso-light">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-landing-espresso-light">No entries or todos for this day.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={`${item.itemType}-${item.id}`} className="rounded-lg border border-landing-clay bg-white p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    item.itemType === "entry"
                      ? "bg-landing-sand text-landing-espresso-light"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {item.itemType === "entry" ? "Entry" : "Todo"}
                </span>
                {item.itemType === "task" ? (
                  <span className="text-[11px] font-semibold text-landing-espresso-light">{item.status.replace("_", " ")}</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-landing-espresso">{item.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-40 bg-black/30">
        <button type="button" aria-label="Close day details" className="absolute inset-0" onClick={onClose} />
        <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-landing-clay bg-landing-cream p-4">
          {content}
        </div>
      </div>
    );
  }

  return <div className="rounded-xl border border-landing-clay bg-landing-cream p-3">{content}</div>;
}
