"use client";

import { useRef, useState } from "react";

// Type declarations for Web Speech API
declare global {
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: Global interface required
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { Bot, Loader, Mic, MicOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  generateActionSuggestion,
  type TaskSuggestion,
} from "@/lib/ai/task-recognition";
import {
  type ExecutionResult,
  simulateAIExecution,
} from "@/lib/ai/todo-executor";
import { cn } from "@/lib/utils";

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  aiSuggestion?: TaskSuggestion;
  assignedToAI?: boolean;
  aiResult?: ExecutionResult;
  isProcessing?: boolean;
  processingProgress?: number;
  processingStatus?: string;
  createdAt: Date;
};

export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  // Voice recognition setup
  const startListening = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewTodo(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: TodoItem = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date(),
      };

      // Check if AI can help with this task
      const { suggestion } = generateActionSuggestion(newTodo.trim());
      if (suggestion) {
        todo.aiSuggestion = suggestion;
      }

      setTodos([...todos, todo]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const assignToAI = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo || !todo.aiSuggestion) {
      return;
    }

    // Mark as processing
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              assignedToAI: true,
              isProcessing: true,
              processingProgress: 0,
              processingStatus: "Starting AI analysis...",
            }
          : t
      )
    );

    try {
      // Execute the task with AI
      const result = await simulateAIExecution(
        todo.text,
        todo.aiSuggestion,
        (progress, status) => {
          setTodos((prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    processingProgress: progress,
                    processingStatus: status,
                  }
                : t
            )
          );
        }
      );

      // Update with results
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                isProcessing: false,
                aiResult: result,
                completed: result.success,
                aiSuggestion: undefined,
              }
            : t
        )
      );
    } catch (err) {
      console.error("Failed to execute AI task:", err);
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                isProcessing: false,
                aiResult: {
                  success: false,
                  message: "Failed to process task",
                },
              }
            : t
        )
      );
    }
  };

  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <section className="mt-10">
      <div className="rounded-[32px] border border-[#2F241B] bg-gradient-to-b from-[#18120D] to-[#120D09] px-6 py-6 shadow-[0_30px_52px_rgba(0,0,0,0.45)]">
        <header className="text-center">
          <h3 className="font-medium text-[#8F7F71] text-sm">To-do list</h3>
          <p className="mt-1 text-[#6F6155] text-xs">
            Jot down anything you want Bellhop to pick up and track the progress
            below.
          </p>
        </header>

        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            addTodo();
          }}
        >
          <label className="sr-only" htmlFor="legacy-todo-input">
            Add a task for Bellhop
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <textarea
              aria-label="Describe a task for Bellhop"
              className="flex-1 resize-none rounded-2xl border border-[#3A2A20] bg-[#0C0806] px-4 py-3 text-[#F4E3CE] text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF922C]/40"
              id="legacy-todo-input"
              onChange={(event) => setNewTodo(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  addTodo();
                }
              }}
              placeholder="e.g. Update Halloween weekend pricing clamp"
              rows={3}
              value={newTodo}
            />
            <div className="flex shrink-0 flex-col gap-2 sm:w-32">
              <Button
                className={cn(
                  "rounded-full border border-[#3A2A20] bg-[#0C0806] text-[#C2B3A6] transition",
                  isListening &&
                    "border-rose-500 bg-rose-500 text-white hover:bg-rose-600"
                )}
                onClick={(event) => {
                  event.preventDefault();
                  isListening ? stopListening() : startListening();
                }}
                type="button"
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <button
                className="rounded-full bg-[#FF922C] px-5 py-2 font-semibold text-sm text-white shadow-[0_18px_30px_rgba(255,146,44,0.45)] transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF922C]/40"
                type="submit"
              >
                Send
              </button>
            </div>
          </div>
          <p className="text-[#8F7E6E] text-xs">
            Bellhop automatically grabs new items and keeps you posted here.
          </p>
        </form>

        <div className="mt-6 space-y-3">
          {todos.map((todo) => (
            <div className="space-y-2" key={todo.id}>
              <div className="flex items-start gap-3 rounded-[24px] border border-[#2F241B] bg-[#14100C] p-4">
                <Checkbox
                  checked={todo.completed}
                  className="mt-1"
                  onCheckedChange={() => toggleTodo(todo.id)}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[#F4E9DA] text-sm",
                      todo.completed && "text-[#7A6C60] line-through"
                    )}
                  >
                    {todo.text}
                  </p>

                  {todo.isProcessing && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-[#8F7F71] text-sm">
                        <Loader className="h-3 w-3 animate-spin" />
                        <span>{todo.processingStatus}</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-[#2D221B]">
                        <div
                          className="h-1 rounded-full bg-[#FF922C] transition-all duration-300"
                          style={{
                            width: `${todo.processingProgress || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {todo.assignedToAI && !todo.isProcessing && (
                    <div className="mt-2 flex items-center gap-2 text-[#8F7F71] text-xs">
                      <Bot className="h-3 w-3" />
                      <span>Completed by Bellhop</span>
                    </div>
                  )}

                  {todo.aiResult && !todo.isProcessing && (
                    <div className="mt-3 space-y-2">
                      {todo.aiResult.success ? (
                        <div className="rounded-2xl border border-[#2D2119] bg-[#1B140F] p-3 text-[#F1E4D4] text-xs">
                          <div className="mb-2 flex items-center gap-1 font-medium text-[#FFB46A]">
                            <span>✓</span>
                            Task completed successfully
                          </div>
                          {todo.aiResult.data?.reason && (
                            <p className="text-[#B9A998]">
                              Reason: {todo.aiResult.data.reason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[#3C1E1E] bg-[#1F1111] p-3 text-[#E6B1B1] text-xs">
                          <div className="flex items-center gap-1 font-medium">
                            <span>✗</span>
                            {todo.aiResult.message}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  className="text-[#9B8C80] hover:bg-[#3C2E23] hover:text-[#F4E9DA]"
                  disabled={todo.isProcessing}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    deleteTodo(todo.id);
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {todo.aiSuggestion && !todo.assignedToAI && !todo.isProcessing ? (
                <div className="ml-7 rounded-2xl border border-[#2F241B] bg-[#18110C] p-3 text-[#C8B8AA] text-xs">
                  <div className="flex items-start gap-2">
                    <Bot className="mt-0.5 h-3 w-3 text-[#8F7F71]" />
                    <div className="space-y-2">
                      <p>{todo.aiSuggestion.message}</p>
                      <Button
                        className="h-7 rounded-full border border-[#3A2A1F] bg-[#24170F] px-3 text-[#F4E9DA] hover:bg-[#2F2015]"
                        onClick={() => assignToAI(todo.id)}
                        size="sm"
                        variant="outline"
                      >
                        Let AI handle this
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {todos.length === 0 && (
            <p className="rounded-[28px] border border-[#2F241B] border-dashed px-6 py-10 text-center text-[#756657] text-sm">
              No tasks yet. Add one above to get started!
            </p>
          )}

          {completedTodos.length > 0 && (
            <div className="border-[#2F241B] border-t pt-4">
              <p className="text-[#8F7F71] text-xs">
                Completed ({completedTodos.length})
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
