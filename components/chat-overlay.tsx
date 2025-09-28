"use client";

import { useEffect, useState } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { BellIcon } from "@/components/icons";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { VisibilityType } from "@/components/visibility-selector";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ChatOverlayProps = {
  chatId: string;
  initialChatModel: string;
  initialMessages: ChatMessage[];
  initialVisibilityType: VisibilityType;
  isReadonly?: boolean;
  autoResume?: boolean;
};

export function ChatOverlay({
  chatId,
  initialChatModel,
  initialMessages,
  initialVisibilityType,
  isReadonly = false,
  autoResume = false,
}: ChatOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKickoff = () => {
      setIsOpen(true);
    };

    window.addEventListener("bellhop:kickoff", handleKickoff as EventListener);

    return () => {
      window.removeEventListener(
        "bellhop:kickoff",
        handleKickoff as EventListener
      );
    };
  }, []);

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close chat overlay"
          className="fixed inset-0 z-40 cursor-default bg-black/20 backdrop-blur-sm transition"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      )}

      <div className="pointer-events-none fixed right-5 bottom-8 z-[70] flex h-full flex-col items-end gap-4">
        <div
          aria-hidden={!isOpen}
          className={cn(
            "pointer-events-none invisible transform transition-all duration-200 ease-out",
            isOpen && "pointer-events-auto visible translate-y-0 opacity-100",
            !isOpen && "translate-y-2 opacity-0"
          )}
        >
          <SidebarProvider defaultOpen={false}>
            <div className="relative flex h-[min(70vh,640px)] w-[min(420px,calc(100vw-3rem))] flex-col items-end overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl max-sm:h-[calc(100vh-5rem)] max-sm:w-[calc(100vw-2rem)] dark:border-neutral-800 dark:bg-neutral-950">
              <button
                aria-label="Hide chat"
                className="absolute top-4 right-4 z-10 rounded-full border border-transparent bg-white/80 px-2 py-1 font-medium text-neutral-500 text-sm shadow-sm transition hover:bg-white hover:text-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-300 dark:hover:bg-neutral-900"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
              <Chat
                autoResume={autoResume}
                id={chatId}
                initialChatModel={initialChatModel}
                initialMessages={initialMessages}
                initialVisibilityType={initialVisibilityType}
                isReadonly={isReadonly}
                variant="overlay"
              />
              <DataStreamHandler />
            </div>
          </SidebarProvider>
        </div>
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? "Hide Copilot chat" : "Open Copilot chat"}
          className="pointer-events-auto fixed right-4 bottom-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-[0_12px_24px_-12px_rgba(15,15,15,0.6)] transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
        >
          <BellIcon />
        </button>
      </div>
    </>
  );
}
