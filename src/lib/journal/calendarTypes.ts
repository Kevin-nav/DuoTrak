export type JournalCalendarItemType = "entry" | "task";
export type JournalTaskStatus = "todo" | "in_progress" | "done";

export type JournalCalendarSpaceType = "private" | "shared";

export type JournalEntryCalendarItem = {
  itemType: "entry";
  id: string;
  spaceId: string;
  spaceType: JournalCalendarSpaceType;
  title: string;
  entryDate: number;
  createdBy: string;
  updatedAt: number;
};

export type JournalTaskItem = {
  itemType: "task";
  id: string;
  spaceId: string;
  spaceType: JournalCalendarSpaceType;
  pageId?: string;
  title: string;
  status: JournalTaskStatus;
  dueDate?: number;
  assigneeUserId?: string;
  isArchived: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
};

export type JournalCalendarItem = JournalEntryCalendarItem | JournalTaskItem;

export type JournalCalendarQueryParams = {
  startDate: number;
  endDate: number;
  spaceType?: JournalCalendarSpaceType;
  includeEntries?: boolean;
  includeTasks?: boolean;
  assigneeFilter?: "all" | "me" | "partner";
};
