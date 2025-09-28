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

import { Bot, Mic, MicOff, Plus, Trash2, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { generateActionSuggestion, type TaskSuggestion } from "@/lib/ai/task-recognition";
import { simulateAIExecution, type ExecutionResult } from "@/lib/ai/todo-executor";

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
    const todo = todos.find(t => t.id === id);
    if (!todo || !todo.aiSuggestion) {
      return;
    }

    // Mark as processing
    setTodos(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              assignedToAI: true,
              isProcessing: true,
              processingProgress: 0,
              processingStatus: 'Starting AI analysis...'
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
          setTodos(prev =>
            prev.map(t =>
              t.id === id
                ? { ...t, processingProgress: progress, processingStatus: status }
                : t
            )
          );
        }
      );

      // Update with results
      setTodos(prev =>
        prev.map(t =>
          t.id === id
            ? {
                ...t,
                isProcessing: false,
                aiResult: result,
                completed: result.success,
                aiSuggestion: undefined
              }
            : t
        )
      );
    } catch (err) {
      console.error('Failed to execute AI task:', err);
      setTodos(prev =>
        prev.map(t =>
          t.id === id
            ? {
                ...t,
                isProcessing: false,
                aiResult: {
                  success: false,
                  message: 'Failed to process task'
                }
              }
            : t
        )
      );
    }
  };

  const pendingTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
      <div
        className="flex w-full cursor-pointer items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg lg:text-xl">
            📋 Tasks & Actions
          </h2>
          {pendingTodos.length > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-1 font-medium text-white text-xs">
              {pendingTodos.length}
            </span>
          )}
        </div>
        <div className="text-rose-600 hover:text-rose-700 px-3 py-1 text-sm font-medium">
          {isExpanded ? "−" : "+"}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-4">
          {/* Add new todo input */}
          <div className="flex gap-2">
            <Input
              className="flex-1"
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="Add a new task..."
              value={newTodo}
            />
            <Button
              className={cn(
                "transition-colors",
                isListening && "border-rose-500 bg-rose-500 text-white"
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
            <Button onClick={addTodo} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Todo list */}
          <div className="space-y-3">
            {todos.map((todo) => (
              <div className="space-y-2" key={todo.id}>
                <div className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:border-neutral-300">
                  <Checkbox
                    checked={todo.completed}
                    className="mt-1"
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm lg:text-base",
                        todo.completed && "text-neutral-500 line-through"
                      )}
                    >
                      {todo.text}
                    </p>

                    {todo.isProcessing && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader className="h-3 w-3 animate-spin" />
                          <span>{todo.processingStatus}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div
                            className="bg-primary h-1 rounded-full transition-all duration-300"
                            style={{ width: `${todo.processingProgress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {todo.assignedToAI && !todo.isProcessing && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Bot className="h-3 w-3" />
                        <span>Completed by AI</span>
                      </div>
                    )}

                    {todo.aiResult && !todo.isProcessing && (
                      <div className="mt-3 space-y-2">
                        {todo.aiResult.success ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-green-700 font-medium mb-2">
                              <span className="text-green-600">✓</span>
                              Task completed successfully
                            </div>

                            {todo.aiResult.data && (
                              <div className="bg-muted/50 rounded-md p-3 space-y-1 text-xs">
                                {todo.aiResult.data.dateRange && (
                                  <div className="font-medium text-foreground">
                                    📅 {todo.aiResult.data.dateRange}
                                  </div>
                                )}
                                {todo.aiResult.data.currentRate && todo.aiResult.data.newRate && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span>Previous rate:</span>
                                      <span className="font-mono">${todo.aiResult.data.currentRate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>New rate:</span>
                                      <span className="font-mono font-medium">${todo.aiResult.data.newRate}</span>
                                    </div>
                                    <div className="flex justify-between text-green-700">
                                      <span>Change:</span>
                                      <span className="font-mono">
                                        {todo.aiResult.data.adjustment > 0 ? '+' : ''}{todo.aiResult.data.adjustment}%
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {todo.aiResult.data.reason && (
                                  <div className="text-muted-foreground mt-2">
                                    Reason: {todo.aiResult.data.reason}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-red-700 font-medium">
                              <span className="text-red-600">✗</span>
                              {todo.aiResult.message}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteTodo(todo.id);
                    }}
                    size="icon"
                    variant="ghost"
                    disabled={todo.isProcessing}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* AI Suggestion */}
                {todo.aiSuggestion && !todo.assignedToAI && !todo.isProcessing && (
                  <div className="ml-6 mt-2 rounded-md border bg-muted/30 p-3">
                    <div className="flex items-start gap-2">
                      <Bot className="mt-0.5 h-3 w-3 text-muted-foreground" />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {todo.aiSuggestion.message}
                        </p>

                        <Button
                          onClick={() => assignToAI(todo.id)}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                        >
                          Let AI handle this
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {todos.length === 0 && (
              <p className="py-8 text-center text-neutral-500 text-sm">
                No tasks yet. Add one above to get started!
              </p>
            )}
          </div>

          {completedTodos.length > 0 && (
            <div className="border-neutral-200 border-t pt-4">
              <p className="mb-2 text-neutral-500 text-sm">
                Completed ({completedTodos.length})
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
