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

import { Bot, Mic, MicOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type BellhopSuggestion = {
  summary: string;
  starterQuery: string;
};

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  aiSuggestion?: BellhopSuggestion;
  createdAt: Date;
};

export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
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

  const fetchBellhopSuggestion = async (
    text: string
  ): Promise<BellhopSuggestion | null> => {
    try {
      const response = await fetch("/api/todos/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error("Bellhop suggestion request failed", response.status);
        return null;
      }

      const data: {
        canHandle: boolean;
        summary?: string;
        starterQuery?: string;
      } = await response.json();

      if (data.canHandle && data.summary && data.starterQuery) {
        return {
          summary: data.summary,
          starterQuery: data.starterQuery,
        };
      }

      return null;
    } catch (error) {
      console.error("Unable to evaluate to-do with Bellhop", error);
      return null;
    }
  };

  const addTodo = async () => {
    const trimmed = newTodo.trim();
    if (!trimmed) {
      return;
    }

    const todo: TodoItem = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
      createdAt: new Date(),
    };

    setTodos((prev) => [...prev, todo]);
    setNewTodo("");

    const suggestion = await fetchBellhopSuggestion(trimmed);
    if (!suggestion) {
      return;
    }

    setTodos((prev) =>
      prev.map((item) =>
        item.id === todo.id ? { ...item, aiSuggestion: suggestion } : item
      )
    );
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const pendingTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/8 via-white/6 to-white/10 ring-1 ring-white/10 backdrop-blur-xl">
      <button
        className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-6 text-left sm:p-8"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-neutral-50 text-xl">
            📋 To-Do List
          </h2>
          {pendingTodos.length > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-1 font-medium text-white text-xs">
              {pendingTodos.length}
            </span>
          )}
        </div>
        <div className="px-3 py-1 font-medium text-neutral-300 text-sm transition-colors hover:text-neutral-50">
          {isExpanded ? "−" : "+"}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-4 px-6 pb-6 sm:px-8 sm:pb-8">
          {/* Add new todo input */}
          <div className="flex gap-3">
            <Input
              className="flex-1 border-white/10 bg-white/5 text-neutral-50 placeholder:text-neutral-400 focus:border-white/20 focus:ring-white/10"
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addTodo();
                }
              }}
              placeholder="Add a new task..."
              value={newTodo}
            />
            <Button
              className={cn(
                "transition-colors",
                isListening
                  ? "border-rose-500 bg-rose-500 text-white hover:bg-rose-600"
                  : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-neutral-50"
              )}
              onClick={isListening ? stopListening : startListening}
              size="icon"
              variant="outline"
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              className="border-white/10 bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-neutral-50"
              onClick={() => {
                void addTodo();
              }}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Todo list */}
          <div className="space-y-3">
            {todos.map((todo) => (
              <div className="space-y-2" key={todo.id}>
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-white/20 hover:bg-white/10">
                  <Checkbox
                    checked={todo.completed}
                    className="mt-1"
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-neutral-50 text-sm lg:text-base",
                        todo.completed && "text-neutral-400 line-through"
                      )}
                    >
                      {todo.text}
                    </p>
                  </div>
                  <Button
                    className="text-neutral-400 hover:bg-rose-400/10 hover:text-rose-400"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteTodo(todo.id);
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {todo.aiSuggestion && (
                  <div className="mt-2 ml-6 rounded-md border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start gap-2">
                      <Bot className="mt-0.5 h-3 w-3 text-neutral-400" />
                      <div className="flex-1 space-y-2">
                        <p className="text-neutral-300 text-sm">
                          {todo.aiSuggestion.summary}
                        </p>

                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                className="h-7 border-white/10 bg-white/5 text-neutral-300 text-xs hover:bg-white/10 hover:text-neutral-50"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                }}
                                size="sm"
                                variant="outline"
                              >
                                Have Bellhop hop to it
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-center text-xs">
                              {todo.aiSuggestion.starterQuery}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {todos.length === 0 && (
              <p className="py-8 text-center text-neutral-400 text-sm">
                No tasks yet. Add one above to get started!
              </p>
            )}
          </div>

          {completedTodos.length > 0 && (
            <div className="border-white/10 border-t pt-4">
              <p className="mb-2 text-neutral-400 text-sm">
                Completed ({completedTodos.length})
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
