"use client";

import { FormEvent, useMemo, useState } from "react";

import type { AppUsage } from "@/lib/usage";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import type { VisibilityType } from "./visibility-selector";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
  variant = "full",
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
  variant?: "full" | "overlay";
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        return {
          body: {
            id: request.id,
            message: request.messages.at(-1),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        // Check if it's a credit card error
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
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

  const containerClassName =
    variant === "overlay"
      ? "overscroll-behavior-contain flex h-full min-h-0 min-w-0 touch-pan-y flex-col bg-background"
      : "overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background";

  return (
    <>
      <div className={containerClassName}>
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          votes={votes}
        />

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              usage={usage}
            />
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
