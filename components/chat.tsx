"use client";

import { FormEvent, useMemo, useState } from "react";

import type { AppUsage } from "@/lib/usage";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import type { VisibilityType } from "./visibility-selector";

type SimpleMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type ChatProps = {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
};

function extractTextFromParts(parts: unknown): string | null {
  if (!Array.isArray(parts)) {
    return null;
  }

  const textParts = parts
    .map((part: any) => {
      if (part && typeof part === "object") {
        if (part.type === "text" && typeof part.text === "string") {
          return part.text;
        }
        if (part.type === "tool-invocation" && part.state === "result") {
          if (typeof part.result === "string") {
            return part.result;
          }
          if (part.result) {
            try {
              return JSON.stringify(part.result);
            } catch {
              return String(part.result);
            }
          }
        }
      }
      return null;
    })
    .filter((value: string | null): value is string => Boolean(value));

  if (textParts.length === 0) {
    return null;
  }

  return textParts.join("\n");
}

function convertToSimpleMessage(message: ChatMessage): SimpleMessage | null {
  if (message.role !== "user" && message.role !== "assistant") {
    return null;
  }

  const textFromParts = extractTextFromParts((message as any).parts);
  const textFromContent = extractTextFromParts((message as any).content);
  const text = textFromParts ?? textFromContent ?? "[content unavailable]";

  return {
    id: message.id ?? generateUUID(),
    role: message.role,
    text,
  };
}

export function Chat({
  id,
  initialMessages,
  isReadonly,
  autoResume,
  initialChatModel,
  initialVisibilityType,
  initialLastContext,
}: ChatProps) {
  void id;
  void autoResume;
  void initialChatModel;
  void initialVisibilityType;
  void initialLastContext;

  const initial = useMemo(() => {
    return initialMessages
      .map((message) => convertToSimpleMessage(message))
      .filter((message): message is SimpleMessage => Boolean(message));
  }, [initialMessages]);

  const [messages, setMessages] = useState<SimpleMessage[]>(initial);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isReadonly) {
      return;
    }

    setError(null);
    setInput("");
    const userMessage: SimpleMessage = {
      id: generateUUID(),
      role: "user",
      text: trimmed,
    };
    setMessages((current) => [...current, userMessage]);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as
          | { error?: string }
          | undefined;
        const message = data?.error ?? "Request failed";
        setError(message);
        setMessages((current) => [
          ...current,
          { id: generateUUID(), role: "assistant", text: message },
        ]);
        return;
      }

      const data = (await response.json()) as { message: string | null };
      const text = data.message ?? "";
      const assistantMessage: SimpleMessage = {
        id: generateUUID(),
        role: "assistant",
        text,
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred";
      setError(message);
      setMessages((current) => [
        ...current,
        { id: generateUUID(), role: "assistant", text: message },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "border-primary/40 bg-primary/5"
                  : "border-secondary/40 bg-secondary/10"
              }`}
            >
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {message.role === "user" ? "You" : "Assistant"}
              </div>
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Ask the assistant a question to get started.
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t bg-background p-4 shadow-[0_-1px_0_rgba(0,0,0,0.05)]"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="chat-input">
            Message
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              isReadonly
                ? "Chat is read-only"
                : "Send a message to the assistant"
            }
            disabled={isSubmitting || isReadonly}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={isSubmitting || isReadonly || input.trim().length === 0}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
