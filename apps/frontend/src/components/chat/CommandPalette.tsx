import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Search, Bot, User, Loader2, X, Clock } from "lucide-react";
import { sendChatMessage, ChatHistoryTurn } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toggle Command Palette on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (isLoading) {
      abortRef.current?.abort();
      setIsLoading(false);
      stopTimer();
    }
  }, [isLoading]);

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    stopTimer();
    // Add a cancelled message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "ai",
        content: "_Query cancelled by user._",
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);
    startTimer();

    // Create a fresh AbortController for this request
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history: ChatHistoryTurn[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await sendChatMessage(
        userMessage.content,
        history,
        controller.signal
      );
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: result.response,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      if (error?.name === "AbortError") return; // cancelled, message already added
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `⚠️ **Error:** ${error.message ?? "Unknown error communicating with the AI."}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      stopTimer();
      abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#130537]/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Palette Modal */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full max-w-2xl bg-[#f5f5f0] pointer-events-auto shadow-[12px_12px_0px_rgba(0,0,0,0.3)] flex flex-col max-h-[80vh]"
              style={{ border: "3px solid #130537" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 bg-[#130537] text-white flex-shrink-0">
                <Command className="h-5 w-5 text-[#a3e635]" />
                <h2 className="text-sm font-bold tracking-widest uppercase">
                  G-TEN Intelligence Search
                </h2>
                <div className="ml-auto flex items-center gap-3">
                  {messages.length > 0 && !isLoading && (
                    <button
                      onClick={() => setMessages([])}
                      className="text-xs text-white/40 hover:text-white/80 font-mono transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <span className="text-xs text-white/50 font-mono">
                    ESC to close
                  </span>
                </div>
              </div>

              {/* Chat Log */}
              {(messages.length > 0 || isLoading) && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 border-b-2 border-[#130537]/20 min-h-[200px]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === "ai"
                          ? "bg-white p-3 border-2 border-[#130537]"
                          : "pl-2"
                      }`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {msg.role === "user" ? (
                          <div className="bg-[#130537] text-white p-1 rounded-sm">
                            <User className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="bg-[#a3e635] text-[#130537] p-1 border-2 border-[#130537]">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden text-sm">
                        {msg.role === "user" ? (
                          <p className="font-bold text-[#130537]">
                            {msg.content}
                          </p>
                        ) : (
                          <div className="text-[#130537]/90 leading-relaxed text-sm space-y-2">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-base font-bold text-[#130537] border-b-2 border-[#a3e635] pb-1 mb-2">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-sm font-bold text-[#130537] border-b border-[#130537]/20 pb-1 mb-2 mt-3">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-sm font-semibold text-[#130537] mt-2 mb-1">
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="text-sm text-[#130537]/90 my-1 leading-relaxed">
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside space-y-1 my-1 pl-2">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside space-y-1 my-1 pl-2">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="text-sm text-[#130537]/90">
                                    {children}
                                  </li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-bold text-[#130537]">
                                    {children}
                                  </strong>
                                ),
                                code: ({ children }) => (
                                  <code className="bg-[#130537]/10 px-1 py-0.5 rounded text-xs font-mono text-[#130537]">
                                    {children}
                                  </code>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-3 rounded border border-[#130537]/20">
                                    <table className="w-full text-xs border-collapse">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-[#130537] text-white">
                                    {children}
                                  </thead>
                                ),
                                tbody: ({ children }) => (
                                  <tbody className="divide-y divide-[#130537]/10">
                                    {children}
                                  </tbody>
                                ),
                                tr: ({ children }) => (
                                  <tr className="even:bg-[#130537]/5">
                                    {children}
                                  </tr>
                                ),
                                th: ({ children }) => (
                                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-3 py-2 text-[#130537]/90">
                                    {children}
                                  </td>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-[#a3e635] pl-3 italic text-[#130537]/70 my-2">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator with timer + cancel */}
                  {isLoading && (
                    <div className="flex gap-3 bg-white p-3 border-2 border-[#130537]">
                      <div className="mt-1 flex-shrink-0">
                        <div className="bg-[#a3e635] text-[#130537] p-1 border-2 border-[#130537]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-mono font-bold text-[#130537]">
                            Executing Graph-RAG Query...
                          </p>
                          <p className="text-xs text-[#130537]/50 mt-0.5 font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {elapsedSeconds}s elapsed
                            {elapsedSeconds > 15 && " — LLM is processing, please wait..."}
                          </p>
                        </div>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider border-2 border-[#130537] text-[#130537] hover:bg-[#130537] hover:text-white transition-colors flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Input Area */}
              <form
                onSubmit={handleSubmit}
                className="p-2 bg-white relative flex-shrink-0"
              >
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#130537]/40" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask the Graph Database... (e.g. Find all accounts linked to Smurfing)"
                  className="w-full bg-transparent py-4 pl-12 pr-4 text-base font-bold text-[#130537] placeholder-[#130537]/40 focus:outline-none"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
