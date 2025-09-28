"use client";

// Theme palettes for this board (light/dark) documented in ref/theme-variants.md
import { CheckCircle2, CheckSquare, Loader2, Square } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type TaskEntry = {
  id: string;
  title: string;
  href?: string;
};

type TaskBoardProps = {
  initialUserTodos: TaskEntry[];
  initialBellhopTodos: TaskEntry[];
};

type UserTask = TaskEntry & {
  status: "pending" | "handoff";
  auto?: boolean;
};

type BellhopTask = TaskEntry & {
  status: "active" | "done";
};

const HANDOFF_DELAY_MS = 2200;
const COMPLETE_DELAY_MS = 2600;

export function TaskBoard({
  initialUserTodos,
  initialBellhopTodos,
}: TaskBoardProps) {
  const [userTasks, setUserTasks] = useState<UserTask[]>(
    initialUserTodos.map((task) => ({ ...task, status: "pending" }))
  );
  const [bellhopTasks, setBellhopTasks] = useState<BellhopTask[]>(
    initialBellhopTodos.map((task) => ({ ...task, status: "done" }))
  );
  const [draft, setDraft] = useState("");
  const textareaId = useId();

  const handoffTimers = useRef<Record<string, number>>({});
  const completionTimers = useRef<Record<string, number>>({});
  const tasksRef = useRef<UserTask[]>(userTasks);

  useEffect(() => {
    tasksRef.current = userTasks;
  }, [userTasks]);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(handoffTimers.current)) {
        window.clearTimeout(timer);
      }
      for (const timer of Object.values(completionTimers.current)) {
        window.clearTimeout(timer);
      }
    };
  }, []);
  const scheduleCompletion = useCallback((taskId: string) => {
    if (completionTimers.current[taskId]) {
      return;
    }
    completionTimers.current[taskId] = window.setTimeout(() => {
      setBellhopTasks((prev) =>
        prev.map((task) =>
          task.id === taskId && task.status === "active"
            ? { ...task, status: "done" }
            : task
        )
      );
      window.clearTimeout(completionTimers.current[taskId]);
      delete completionTimers.current[taskId];
    }, COMPLETE_DELAY_MS);
  }, []);

  const handoffTask = useCallback(
    (taskId: string) => {
      const existing = tasksRef.current.find((task) => task.id === taskId);
      if (!existing) {
        return;
      }

      if (handoffTimers.current[taskId]) {
        window.clearTimeout(handoffTimers.current[taskId]);
        delete handoffTimers.current[taskId];
      }

      setUserTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: "handoff" } : task
        )
      );

      window.setTimeout(() => {
        setUserTasks((prev) => prev.filter((task) => task.id !== taskId));
        setBellhopTasks((prev) => [
          {
            id: existing.id,
            title: existing.title,
            href: existing.href,
            status: "active",
          },
          ...prev,
        ]);
        scheduleCompletion(existing.id);
      }, 500);
    },
    [scheduleCompletion]
  );

  const scheduleAutoHandoff = useCallback(
    (task: UserTask) => {
      if (handoffTimers.current[task.id]) {
        window.clearTimeout(handoffTimers.current[task.id]);
      }
      handoffTimers.current[task.id] = window.setTimeout(() => {
        handoffTask(task.id);
      }, HANDOFF_DELAY_MS);
    },
    [handoffTask]
  );

  useEffect(() => {
    for (const task of bellhopTasks) {
      if (task.status === "active") {
        scheduleCompletion(task.id);
      }
    }
  }, [bellhopTasks, scheduleCompletion]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) {
      return;
    }
    const newTask: UserTask = {
      id: `user-task-${Date.now()}`,
      title: value,
      status: "pending",
      auto: true,
    };
    setUserTasks((prev) => [...prev, newTask]);
    setDraft("");
    scheduleAutoHandoff(newTask);
  };

  const renderUserTask = (task: UserTask) => {
    const isLink = Boolean(task.href);
    const Content = isLink ? Link : "div";
    return (
      <li
        className="flex items-center gap-4 rounded-[28px] border border-[#2F241B] bg-[#14100C] px-5 py-4 shadow-[0_20px_35px_rgba(0,0,0,0.35)]"
        key={task.id}
      >
        <button
          aria-label="Hand off to Bellhop"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border border-[#3B2C21] bg-[#1A140F] transition",
            task.status === "pending" && "hover:bg-[#211a14]"
          )}
          disabled={task.status !== "pending"}
          onClick={() => handoffTask(task.id)}
          type="button"
        >
          {task.status === "handoff" ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#FFB15A]" />
          ) : (
            <Square className="h-4 w-4 text-[#665445]" />
          )}
        </button>
        <Content
          {...(isLink ? { href: task.href } : {})}
          className="flex-1 text-left font-medium text-[#F4E9DA] text-sm"
        >
          {task.title}
        </Content>
        {task.status === "handoff" ? (
          <span className="text-[#8D7C6C] text-xs">Bellhop is on it…</span>
        ) : null}
      </li>
    );
  };

  const renderBellhopTask = (task: BellhopTask) => {
    const isLink = Boolean(task.href);
    const Content = isLink ? Link : "div";
    return (
      <li
        className="rounded-[28px] border border-transparent shadow-[0_25px_45px_rgba(0,0,0,0.45)]"
        key={task.id}
      >
        <Content
          {...(isLink ? { href: task.href } : {})}
          className={cn(
            "flex items-center gap-4 rounded-[28px] px-6 py-5",
            task.status === "done"
              ? "bg-gradient-to-b from-[#2C1A0D] to-[#311F12]"
              : "bg-gradient-to-b from-[#27170E] to-[#1F130C]"
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-white",
              task.status === "done"
                ? "bg-[#FF922C] shadow-[0_10px_24px_rgba(255,146,44,0.45)]"
                : "bg-[#3A2819] text-[#FFB15A]"
            )}
          >
            {task.status === "done" ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </span>
          <span className="flex-1 text-left font-medium text-[#F5D9B5] text-sm">
            {task.title}
          </span>
          {task.status === "active" ? (
            <span className="text-[#C38F60] text-xs">In progress…</span>
          ) : (
            <CheckCircle2 className="h-4 w-4 text-[#FFB46A]" />
          )}
        </Content>
      </li>
    );
  };

  return (
    <section className="mt-10 space-y-8">
      <div>
        <h3 className="text-center font-medium text-[#8F7F71] text-sm">
          Add a task
        </h3>
        <form
          className="mt-4 rounded-[28px] border border-[#2F241B] bg-gradient-to-b from-[#18120D] to-[#120D09] px-6 py-5 shadow-[0_22px_42px_rgba(0,0,0,0.45)]"
          onSubmit={handleSubmit}
        >
          <label
            className="block font-semibold text-[#F4E9DA] text-sm"
            htmlFor={textareaId}
          >
            Tell Bellhop what you need
          </label>
          <textarea
            aria-label="Describe a task for Bellhop"
            className="mt-3 w-full resize-none rounded-2xl border border-[#3A2A20] bg-[#0C0806] px-4 py-3 text-[#F4E3CE] text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF922C]/40"
            id={textareaId}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="e.g. Update Halloween weekend pricing clamp"
            rows={3}
            value={draft}
          />
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-[#8F7E6E] text-xs">
              New tasks appear in your list and Bellhop will scoop them up.
            </p>
            <button
              className="rounded-full bg-[#FF922C] px-5 py-2 font-semibold text-sm text-white shadow-[0_18px_30px_rgba(255,146,44,0.45)] transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF922C]/40"
              type="submit"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-center font-medium text-[#8F7F71] text-sm">
          Your to-dos
        </h3>
        {userTasks.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {userTasks.map((task) => renderUserTask(task))}
          </ul>
        ) : (
          <div className="mt-4 rounded-[28px] border border-[#2F241B] border-dashed px-6 py-10 text-center text-[#756657] text-sm">
            Nothing left for you right now
          </div>
        )}
      </div>

      <div>
        <h3 className="text-center font-medium text-[#8F7F71] text-sm">
          Bellhop’s ta-das
        </h3>
        {bellhopTasks.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {bellhopTasks.map((task) => renderBellhopTask(task))}
          </ul>
        ) : (
          <div className="mt-4 rounded-[28px] border border-[#3F2817] border-dashed px-6 py-10 text-center text-[#DCA66B] text-sm">
            Bellhop is all caught up
          </div>
        )}
      </div>
    </section>
  );
}

export { TaskBoard };
