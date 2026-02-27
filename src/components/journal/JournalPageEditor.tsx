"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft, CheckCircle2, Circle, GripVertical, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateJournalTask,
  useJournalPage,
  useJournalPageTasks,
  useReplaceJournalPageBlocks,
  useToggleJournalTaskStatus,
  useUpdateJournalTask,
} from "@/hooks/useJournal";
import { useGoals } from "@/hooks/useGoals";
import { AnimatePresence, Reorder, motion, useReducedMotion } from "framer-motion";
import { useUser } from "@/contexts/UserContext";

type BlockInput = {
  id: string;
  type: "paragraph" | "heading" | "todo" | "quote" | "callout";
  content: string;
  checked?: boolean;
  autoFormat?: boolean;
};

type CommandType = BlockInput["type"];

type SuggestionState = {
  kind: "command" | "mention";
  blockId: string;
  query: string;
  start: number;
  end: number;
} | null;

type MentionOption = {
  label: string;
  value: string;
};

const BLOCK_TYPES: CommandType[] = ["paragraph", "heading", "todo", "quote", "callout"];
const easing = [0.22, 1, 0.36, 1] as const;

const createBlock = (type: CommandType, content = "", checked = false): BlockInput => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  type,
  content,
  checked,
  autoFormat: true,
});

type AutoFormatTransform = {
  content: string;
  removedPrefixLength: number;
  type?: BlockInput["type"];
  checked?: boolean;
};

const parseAutoFormatTransform = (value: string): AutoFormatTransform | null => {
  const headingMatch = /^(#{1,3})\s+(\S[\s\S]*)$/.exec(value);
  if (headingMatch) {
    const [, hashes, content] = headingMatch;
    return {
      type: "heading",
      content,
      removedPrefixLength: hashes.length + 1,
    };
  }

  const quoteMatch = /^>\s+(\S[\s\S]*)$/.exec(value);
  if (quoteMatch) {
    const [, content] = quoteMatch;
    return {
      type: "quote",
      content,
      removedPrefixLength: value.length - content.length,
    };
  }

  const calloutMatch = /^!\s+(\S[\s\S]*)$/.exec(value);
  if (calloutMatch) {
    const [, content] = calloutMatch;
    return {
      type: "callout",
      content,
      removedPrefixLength: value.length - content.length,
    };
  }

  const taskWithPrefixMatch = /^[-*]\s+\[( |x|X)\]\s+(\S[\s\S]*)$/.exec(value);
  if (taskWithPrefixMatch) {
    const [, marker, content] = taskWithPrefixMatch;
    return {
      type: "todo",
      checked: marker.toLowerCase() === "x",
      content,
      removedPrefixLength: value.length - content.length,
    };
  }

  const bareTaskMatch = /^\[( |x|X)\]\s+(\S[\s\S]*)$/.exec(value);
  if (bareTaskMatch) {
    const [, marker, content] = bareTaskMatch;
    return {
      type: "todo",
      checked: marker.toLowerCase() === "x",
      content,
      removedPrefixLength: value.length - content.length,
    };
  }

  const looseTaskMatch = /^\[\]\s+(\S[\s\S]*)$/.exec(value);
  if (looseTaskMatch) {
    const [, content] = looseTaskMatch;
    return {
      type: "todo",
      checked: false,
      content,
      removedPrefixLength: value.length - content.length,
    };
  }

  const bulletMatch = /^[-*]\s+(\S[\s\S]*)$/.exec(value);
  if (bulletMatch) {
    const [, content] = bulletMatch;
    return {
      type: "todo",
      checked: false,
      content,
      removedPrefixLength: value.length - content.length,
    };
  }

  return null;
};

const toDateInput = (timestamp?: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDateInput = (value: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
};

export default function JournalPageEditor() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const { page, blocks, isLoading } = useJournalPage(pageId);
  const { tasks: pageTasks, spaceType: pageSpaceType, isLoading: isTasksLoading } = useJournalPageTasks(pageId);
  const replaceBlocks = useReplaceJournalPageBlocks();
  const createTask = useCreateJournalTask();
  const updateTask = useUpdateJournalTask();
  const toggleTaskStatus = useToggleJournalTaskStatus();
  const { data: goals = [] } = useGoals();
  const { userDetails } = useUser();
  const reduceMotion = useReducedMotion();

  const [draftBlocks, setDraftBlocks] = useState<BlockInput[]>([]);
  const [hasInitializedFromServer, setHasInitializedFromServer] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestionState>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState<string>("");
  const [taskStartsDone, setTaskStartsDone] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, { title: string; dueDate: string; assigneeUserId: string }>>({});
  const blockTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    setHasInitializedFromServer(false);
    setDraftBlocks([]);
    setSuggestion(null);
  }, [pageId]);

  useEffect(() => {
    if (hasInitializedFromServer) return;
    if (isLoading) return;

    if (blocks.length > 0) {
      setDraftBlocks(
        blocks.map((block: any) => ({
          id:
            typeof block._id === "string"
              ? block._id
              : typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
          type: block.type,
          content: block.content || "",
          checked: block.checked || false,
          autoFormat: true,
        }))
      );
    } else {
      setDraftBlocks([createBlock("paragraph")]);
    }
    setHasInitializedFromServer(true);
  }, [blocks, hasInitializedFromServer, isLoading]);

  useEffect(() => {
    if (taskAssignee) return;
    if (userDetails?._id) {
      setTaskAssignee(String(userDetails._id));
    }
  }, [taskAssignee, userDetails?._id]);

  useEffect(() => {
    const nextDrafts: Record<string, { title: string; dueDate: string; assigneeUserId: string }> = {};
    for (const task of pageTasks) {
      const id = String(task._id);
      nextDrafts[id] = {
        title: task.title || "",
        dueDate: toDateInput(task.due_date),
        assigneeUserId: task.assignee_user_id ? String(task.assignee_user_id) : "",
      };
    }
    setTaskDrafts(nextDrafts);
  }, [pageTasks]);

  const mentionOptions = useMemo<MentionOption[]>(() => {
    const options: MentionOption[] = [];
    for (const goal of goals) {
      options.push({
        label: `Goal: ${goal.name}`,
        value: `@goal:${goal.name}`,
      });
      for (const task of goal.tasks) {
        options.push({
          label: `Task: ${task.name}`,
          value: `@task:${task.name}`,
        });
      }
    }
    return options.slice(0, 50);
  }, [goals]);

  const updateBlock = (index: number, patch: Partial<BlockInput>) => {
    setDraftBlocks((current) => {
      const next = [...current];
      if (!next[index]) return current;
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addBlock = (type: BlockInput["type"]) => {
    setDraftBlocks((current) => [...current, createBlock(type)]);
  };

  const removeBlock = (index: number) => {
    setDraftBlocks((current) => {
      const next = current.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [createBlock("paragraph")];
    });
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    setDraftBlocks((current) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const deriveSuggestion = (index: number, content: string, cursor: number) => {
    const block = draftBlocks[index];
    if (!block) return;
    const beforeCursor = content.slice(0, cursor);

    const slashMatch = /(?:^|\s)\/([a-z]*)$/.exec(beforeCursor);
    if (slashMatch) {
      const query = slashMatch[1] || "";
      const end = cursor;
      const start = end - query.length - 1;
      setSuggestion({
        kind: "command",
        blockId: block.id,
        query,
        start,
        end,
      });
      return;
    }

    const mentionMatch = /(?:^|\s)@([a-zA-Z0-9:_-]*)$/.exec(beforeCursor);
    if (mentionMatch) {
      const query = mentionMatch[1] || "";
      const end = cursor;
      const start = end - query.length - 1;
      setSuggestion({
        kind: "mention",
        blockId: block.id,
        query,
        start,
        end,
      });
      return;
    }

    setSuggestion(null);
  };

  const setBlockCursorPosition = (blockId: string, position: number) => {
    requestAnimationFrame(() => {
      const target = blockTextareaRefs.current[blockId];
      if (!target) return;
      target.focus();
      target.setSelectionRange(position, position);
    });
  };

  const handleBlockContentChange = (index: number, event: ChangeEvent<HTMLTextAreaElement>) => {
    const block = draftBlocks[index];
    if (!block) return;

    const isComposing = (event.nativeEvent as any)?.isComposing === true;
    const rawContent = event.target.value;
    const rawCursor = event.target.selectionStart ?? rawContent.length;

    let nextContent = rawContent;
    let nextType = block.type;
    let nextChecked = block.checked;
    let nextCursor = rawCursor;
    let didAutoFormat = false;

    if (!isComposing && block.autoFormat !== false) {
      const transform = parseAutoFormatTransform(rawContent);
      if (transform) {
        nextContent = transform.content;
        nextType = transform.type ?? nextType;
        nextChecked = typeof transform.checked === "boolean" ? transform.checked : nextChecked;
        nextCursor = Math.max(0, rawCursor - transform.removedPrefixLength);
        didAutoFormat = true;
      }
    }

    updateBlock(index, {
      type: nextType,
      content: nextContent,
      checked: nextChecked,
    });

    deriveSuggestion(index, nextContent, nextCursor);

    if (didAutoFormat) {
      setSuggestion(null);
      setBlockCursorPosition(block.id, nextCursor);
    }
  };

  const applyCommand = (command: CommandType) => {
    if (!suggestion || suggestion.kind !== "command") return;
    const blockIndex = draftBlocks.findIndex((block) => block.id === suggestion.blockId);
    if (blockIndex < 0) return;
    const block = draftBlocks[blockIndex];
    const nextContent = `${block.content.slice(0, suggestion.start)}${block.content.slice(suggestion.end)}`.trimStart();
    updateBlock(blockIndex, { type: command, content: nextContent });
    setSuggestion(null);
  };

  const applyMention = (mentionValue: string) => {
    if (!suggestion || suggestion.kind !== "mention") return;
    const blockIndex = draftBlocks.findIndex((block) => block.id === suggestion.blockId);
    if (blockIndex < 0) return;
    const block = draftBlocks[blockIndex];
    const prefix = block.content.slice(0, suggestion.start);
    const suffix = block.content.slice(suggestion.end);
    const withSpacing = `${prefix}${mentionValue} ${suffix}`.replace(/\s{2,}/g, " ");
    updateBlock(blockIndex, { content: withSpacing });
    setSuggestion(null);
  };

  const filteredCommands = useMemo(
    () =>
      BLOCK_TYPES.filter((type) => type.toLowerCase().includes((suggestion?.query || "").toLowerCase())).slice(0, 6),
    [suggestion?.query]
  );

  const filteredMentions = useMemo(
    () =>
      mentionOptions
        .filter((option) => option.label.toLowerCase().includes((suggestion?.query || "").toLowerCase()))
        .slice(0, 8),
    [mentionOptions, suggestion?.query]
  );

  const assigneeOptions = useMemo(() => {
    const options: Array<{ label: string; value: string }> = [];
    if (userDetails?._id) {
      options.push({ label: "Me", value: String(userDetails._id) });
    }
    if (pageSpaceType === "shared" && userDetails?.partner_id) {
      options.push({
        label: userDetails.partner_nickname || userDetails.partner_full_name || "Partner",
        value: String(userDetails.partner_id),
      });
    }
    return options;
  }, [pageSpaceType, userDetails?._id, userDetails?.partner_full_name, userDetails?.partner_id, userDetails?.partner_nickname]);

  const updateTaskDraft = (taskId: string, patch: Partial<{ title: string; dueDate: string; assigneeUserId: string }>) => {
    setTaskDrafts((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? { title: "", dueDate: "", assigneeUserId: "" }),
        ...patch,
      },
    }));
  };

  const saveTaskPatch = async (
    taskId: string,
    patch: {
      title?: string;
      dueDate?: string;
      assigneeUserId?: string;
    }
  ) => {
    try {
      setSavingTaskId(taskId);
      await updateTask({
        taskId,
        title: patch.title,
        dueDate: patch.dueDate !== undefined ? fromDateInput(patch.dueDate) : undefined,
        assigneeUserId: patch.assigneeUserId || undefined,
      });
    } catch (error: any) {
      toast.error(error?.message || "Could not update task.");
    } finally {
      setSavingTaskId(null);
    }
  };

  const createPageTask = async () => {
    if (!taskTitle.trim()) return;
    if (!userDetails?._id) return;

    try {
      setIsCreatingTask(true);
      const nextAssignee =
        pageSpaceType === "shared"
          ? (taskAssignee || String(userDetails._id))
          : String(userDetails._id);

      const taskId = await createTask({
        spaceType: pageSpaceType || "private",
        title: taskTitle.trim(),
        dueDate: fromDateInput(taskDueDate),
        assigneeUserId: nextAssignee as any,
        pageId,
      });

      if (taskStartsDone && taskId) {
        await toggleTaskStatus(String(taskId), "done");
      }

      setTaskTitle("");
      setTaskDueDate("");
      setTaskStartsDone(false);
      setTaskAssignee(String(userDetails._id));
      toast.success("Task added to page.");
    } catch (error: any) {
      toast.error(error?.message || "Could not create task.");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const save = async () => {
    try {
      await replaceBlocks({
        pageId,
        blocks: draftBlocks.map((block) => ({
          type: block.type,
          content: block.content,
          checked: block.checked,
        })),
      });
      toast.success("Page saved.");
    } catch (error: any) {
      toast.error(error?.message || "Could not save page.");
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easing }}
        className="space-y-4"
      >
        <motion.section
          initial={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easing }}
          className="mb-3 rounded-2xl border border-landing-clay bg-white/95 p-3 shadow-sm sm:mb-4 sm:p-4"
        >
          <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[auto_1fr_auto] sm:gap-3">
            <motion.button
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => router.push("/journal")}
              className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream sm:px-2.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </motion.button>
            <motion.button
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={save}
              className="justify-self-end inline-flex items-center gap-1 rounded-lg bg-landing-espresso px-2.5 py-1.5 text-xs font-semibold text-landing-cream sm:px-3"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </motion.button>
            <h1 className="order-3 col-span-2 text-center text-base font-bold text-landing-espresso sm:order-none sm:col-span-1 sm:truncate sm:text-lg">
              {page?.title || "Journal Page"}
            </h1>
          </div>
        </motion.section>

        <motion.section
          initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easing }}
          className="space-y-3 rounded-2xl border border-landing-clay bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-landing-espresso sm:text-base">Page Tasks</h2>
            <span className="text-xs text-landing-espresso-light">
              {pageSpaceType === "shared" ? "Shared workspace" : "Private workspace"}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="rounded-lg border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
            />
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="rounded-lg border border-landing-clay px-2.5 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
            />
            {pageSpaceType === "shared" ? (
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="rounded-lg border border-landing-clay px-2.5 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
              >
                {assigneeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              onClick={() => setTaskStartsDone((current) => !current)}
              className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-semibold ${
                taskStartsDone
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-landing-clay text-landing-espresso-light hover:bg-landing-cream"
              }`}
            >
              {taskStartsDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              {taskStartsDone ? "Done" : "Todo"}
            </button>
            <button
              type="button"
              onClick={createPageTask}
              disabled={isCreatingTask || !taskTitle.trim() || !pageSpaceType}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-landing-espresso px-3 py-2 text-xs font-semibold text-landing-cream disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {isCreatingTask ? "Adding..." : "Add task"}
            </button>
          </div>

          {isTasksLoading ? (
            <p className="text-xs text-landing-espresso-light">Loading page tasks...</p>
          ) : pageTasks.length === 0 ? (
            <p className="text-xs text-landing-espresso-light">No tasks linked to this page yet.</p>
          ) : (
            <div className="space-y-2">
              {pageTasks.map((task) => {
                const taskId = String(task._id);
                const draft = taskDrafts[taskId] ?? {
                  title: task.title || "",
                  dueDate: toDateInput(task.due_date),
                  assigneeUserId: task.assignee_user_id ? String(task.assignee_user_id) : "",
                };
                const isDone = task.status === "done";
                return (
                  <div key={taskId} className="grid gap-2 rounded-xl border border-landing-clay bg-landing-cream p-2.5 sm:grid-cols-[1fr_auto_auto_auto]">
                    <input
                      value={draft.title}
                      onChange={(e) => updateTaskDraft(taskId, { title: e.target.value })}
                      onBlur={() => {
                        if ((task.title || "") !== draft.title) {
                          saveTaskPatch(taskId, { title: draft.title });
                        }
                      }}
                      className="rounded-md border border-landing-clay bg-white px-2.5 py-1.5 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
                    />
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(e) => updateTaskDraft(taskId, { dueDate: e.target.value })}
                      onBlur={() => {
                        const original = toDateInput(task.due_date);
                        if (original !== draft.dueDate) {
                          saveTaskPatch(taskId, { dueDate: draft.dueDate });
                        }
                      }}
                      className="rounded-md border border-landing-clay bg-white px-2 py-1.5 text-xs text-landing-espresso outline-none focus:border-landing-terracotta"
                    />
                    {pageSpaceType === "shared" ? (
                      <select
                        value={draft.assigneeUserId}
                        onChange={(e) => {
                          const next = e.target.value;
                          updateTaskDraft(taskId, { assigneeUserId: next });
                          saveTaskPatch(taskId, { assigneeUserId: next });
                        }}
                        className="rounded-md border border-landing-clay bg-white px-2 py-1.5 text-xs text-landing-espresso outline-none focus:border-landing-terracotta"
                      >
                        {assigneeOptions.map((option) => (
                          <option key={`${taskId}-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setSavingTaskId(taskId);
                          await toggleTaskStatus(taskId, isDone ? "todo" : "done");
                        } catch (error: any) {
                          toast.error(error?.message || "Could not update status.");
                        } finally {
                          setSavingTaskId(null);
                        }
                      }}
                      disabled={savingTaskId === taskId}
                      className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-semibold ${
                        isDone
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-landing-clay bg-white text-landing-espresso-light"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                      {isDone ? "Done" : "Todo"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        {isLoading ? (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light"
          >
            Loading page...
          </motion.div>
        ) : (
          <motion.section
            initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easing }}
            className="space-y-3 rounded-2xl border border-landing-clay bg-white p-4 shadow-sm"
          >
            <Reorder.Group axis="y" values={draftBlocks} onReorder={setDraftBlocks} className="space-y-3">
              {draftBlocks.map((block, index) => (
                <Reorder.Item
                  key={block.id}
                  value={block}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  className="rounded-xl border border-landing-clay bg-landing-cream p-3"
                  whileDrag={reduceMotion ? undefined : { scale: 1.01, boxShadow: "0 14px 30px rgba(0,0,0,0.12)" }}
                  layout
                >
                  <motion.div layout className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-landing-clay px-1.5 py-1 text-[11px] text-landing-espresso-light hover:bg-white touch-none sm:text-xs"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                      <select
                        value={block.type}
                        onChange={(e) => updateBlock(index, { type: e.target.value as BlockInput["type"] })}
                        className="min-w-0 flex-1 rounded-md border border-landing-clay px-2 py-1 text-[11px] text-landing-espresso sm:min-w-[9rem] sm:flex-none sm:text-xs"
                      >
                        <option value="paragraph">Paragraph</option>
                        <option value="heading">Heading</option>
                        <option value="todo">Todo</option>
                        <option value="quote">Quote</option>
                        <option value="callout">Callout</option>
                      </select>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-1 sm:flex sm:w-auto sm:items-center sm:justify-end sm:gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateBlock(index, { autoFormat: !(block.autoFormat ?? true) })}
                        className={`min-w-0 rounded-md border px-1.5 py-1 text-[11px] sm:px-2 sm:text-xs ${
                          block.autoFormat === false
                            ? "border-landing-clay bg-white text-landing-espresso-light hover:bg-landing-cream"
                            : "border-landing-terracotta bg-landing-terracotta/10 text-landing-espresso"
                        }`}
                        title="Toggle auto-format markdown shortcuts for this block"
                      >
                        {block.autoFormat === false ? "Raw" : "Auto"}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, index - 1)}
                        disabled={index === 0}
                        className="min-w-0 rounded-md border border-landing-clay px-1.5 py-1 text-[11px] text-landing-espresso-light hover:bg-white disabled:opacity-50 sm:px-2 sm:text-xs"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, index + 1)}
                        disabled={index === draftBlocks.length - 1}
                        className="min-w-0 rounded-md border border-landing-clay px-1.5 py-1 text-[11px] text-landing-espresso-light hover:bg-white disabled:opacity-50 sm:px-2 sm:text-xs"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        className="min-w-0 rounded-md border border-landing-clay px-1.5 py-1 text-[11px] text-landing-espresso-light hover:bg-white sm:px-2 sm:text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                  {block.type === "todo" ? (
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={!!block.checked}
                        onChange={(e) => updateBlock(index, { checked: e.target.checked })}
                        className="mt-1"
                      />
                      <textarea
                        ref={(node) => {
                          blockTextareaRefs.current[block.id] = node;
                        }}
                        value={block.content}
                        onChange={(e) => handleBlockContentChange(index, e)}
                        onBlur={() =>
                          setTimeout(() => setSuggestion((current) => (current?.blockId === block.id ? null : current)), 120)
                        }
                        rows={2}
                        placeholder="Todo block... type / for commands or @ to mention goals/tasks"
                        className="w-full rounded-lg border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none transition-all duration-200 focus:border-landing-terracotta focus:ring-2 focus:ring-landing-terracotta/20"
                      />
                    </div>
                  ) : (
                    <textarea
                      ref={(node) => {
                        blockTextareaRefs.current[block.id] = node;
                      }}
                      value={block.content}
                      onChange={(e) => handleBlockContentChange(index, e)}
                      onBlur={() =>
                        setTimeout(() => setSuggestion((current) => (current?.blockId === block.id ? null : current)), 120)
                      }
                      rows={block.type === "heading" ? 1 : 3}
                      placeholder={`${block.type} block... type / for commands or @ to mention goals/tasks`}
                      className={`w-full rounded-lg border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none transition-all duration-200 focus:border-landing-terracotta focus:ring-2 focus:ring-landing-terracotta/20 ${
                        block.type === "heading"
                          ? "text-base font-bold sm:text-lg"
                          : block.type === "quote"
                            ? "border-l-4 border-l-landing-terracotta bg-landing-cream/40 italic"
                            : block.type === "callout"
                              ? "bg-amber-50/70"
                              : ""
                      }`}
                    />
                  )}
                  <AnimatePresence>
                    {suggestion?.blockId === block.id && suggestion.kind === "command" && filteredCommands.length > 0 ? (
                      <motion.div
                        initial={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: easing }}
                        className="mt-2 rounded-lg border border-landing-clay bg-white p-2"
                      >
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-landing-espresso-light">
                          Slash Commands
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredCommands.map((command) => (
                            <motion.button
                              key={command}
                              type="button"
                              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyCommand(command);
                              }}
                              className="rounded-md border border-landing-clay px-2 py-1 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                            >
                              /{command}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                    {suggestion?.blockId === block.id && suggestion.kind === "mention" && filteredMentions.length > 0 ? (
                      <motion.div
                        initial={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: easing }}
                        className="mt-2 rounded-lg border border-landing-clay bg-white p-2"
                      >
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-landing-espresso-light">
                          Mentions
                        </p>
                        <div className="space-y-1">
                          {filteredMentions.map((mention) => (
                            <motion.button
                              key={`${mention.value}-${mention.label}`}
                              type="button"
                              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyMention(mention.value);
                              }}
                              className="block w-full rounded-md border border-landing-clay px-2 py-1 text-left text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                            >
                              {mention.label}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <motion.div layout className="flex flex-wrap gap-2">
              {BLOCK_TYPES.map((type) => (
                <motion.button
                  key={type}
                  type="button"
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => addBlock(type)}
                  className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {type}
                </motion.button>
              ))}
            </motion.div>
          </motion.section>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
