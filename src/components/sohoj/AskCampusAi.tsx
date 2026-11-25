import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bot,
  Copy,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useConnectivity } from "@/hooks/use-connectivity";
import { submitFeedback } from "@/lib/repo/feedback";
import { supabase } from "@/integrations/supabase/client";
import { safeDeepLink } from "../../../supabase/functions/campus-ai/shared";

type ChatLine = {
  role: "user" | "assistant";
  content: string;
  sources?: { screen: string; lastUpdated: string | null }[];
  deepLink?: string;
  mode?: "campus" | "general" | "mixed";
  vote?: "up" | "down";
};

const SUGGESTIONS = ["আজকের রুটিন কী?", "কালের ক্লাস আপডেট?", "নোটিশ দেখাও", "শপে কী আছে?"];

const API_URL = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const ANON_KEY = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
const AI_ENABLED = import.meta.env["VITE_AI_ENABLED"] !== "false";

/** Minimal safe rendering: bold, inline code, lists and fenced code. No HTML injection. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="rounded bg-muted px-1 font-mono text-[10px]">
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

function renderSafe(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  text.split(/```/).forEach((block, bi) => {
    if (bi % 2 === 1) {
      nodes.push(
        <pre
          key={`code-${bi}`}
          className="my-1 overflow-x-auto rounded-lg bg-muted p-2 font-mono text-[10px]"
        >
          <code>{block.trim()}</code>
        </pre>,
      );
      return;
    }
    const list: string[] = [];
    const flush = () => {
      if (!list.length) return;
      nodes.push(
        <ul key={`list-${bi}-${nodes.length}`} className="my-1 list-disc pl-4">
          {list.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      list.length = 0;
    };
    block.split("\n").forEach((line, li) => {
      const match = line.match(/^\s*[-*]\s+(.*)$/);
      if (match) {
        list.push(match[1] ?? "");
        return;
      }
      flush();
      if (!line.trim()) return;
      nodes.push(<p key={`p-${bi}-${li}`}>{renderInline(line)}</p>);
    });
    flush();
  });
  return nodes;
}

export function AskCampusAi({ instituteId }: { instituteId: string }) {
  const { user } = useAuth();
  const { online } = useConnectivity();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [reporting, setReporting] = useState<number | null>(null);
  const [reportText, setReportText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!AI_ENABLED || !user) return null;

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy || !online) return;
    setNotice("");
    setInput("");
    const history: ChatLine[] = [...lines.slice(-5), { role: "user", content: text }];
    setLines(history);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token || !API_URL || !ANON_KEY) throw new Error("configuration");
      const response = await fetch(`${API_URL}/functions/v1/campus-ai`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          setNotice(
            "দৈনিক সীমা শেষ — কাল আবার চেষ্টা করুন / Daily limit reached — try again tomorrow.",
          );
          return;
        }
        if (response.status === 503) {
          setNotice("AI সেবা এখন বন্ধ / AI service is disabled right now.");
          return;
        }
        throw new Error("request failed");
      }
      const sources = Array.isArray(payload.sources)
        ? (payload.sources as ChatLine["sources"])
        : undefined;
      const deepLink = safeDeepLink(payload.deepLink);
      setLines((prev) => [
        ...prev,
        {
          role: "assistant",
          content: String(payload.answer ?? ""),
          ...(sources ? { sources } : {}),
          ...(deepLink ? { deepLink } : {}),
          mode:
            payload.mode === "campus" || payload.mode === "general" || payload.mode === "mixed"
              ? payload.mode
              : undefined,
        },
      ]);
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        setNotice(
          "উত্তর আনতে সমস্যা হয়েছে — আবার চেষ্টা করুন / Couldn't get an answer — please retry.",
        );
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setBusy(false);
    setNotice("বাতিল করা হয়েছে / Cancelled.");
  }

  async function sendFeedback(index: number, vote: "up" | "down", message = "") {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, vote } : l)));
    try {
      await submitFeedback(user?.id ?? null, instituteId, {
        rating: vote === "up" ? 5 : 1,
        category: vote === "up" ? "idea" : "bug",
        message: message || `Campus AI answer ${vote === "up" ? "helpful" : "not helpful"}`,
        page: "campus-ai",
      });
      toast.success("মতামত পাঠানো হয়েছে / Feedback sent");
    } catch {
      toast.error("মতামত পাঠানো যায় ni / Could not send feedback");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!online}
        aria-label="Ask Campus AI"
        title={online ? "Ask Campus AI" : "Offline — AI unavailable"}
        className="fixed bottom-[calc(6.6rem+env(safe-area-inset-bottom))] right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-[var(--shadow-float)] transition-transform active:scale-95 disabled:opacity-50"
      >
        {online ? <Sparkles className="size-4" /> : <Bot className="size-4" />}
        Ask AI
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="fixed bottom-0 left-0 top-auto flex h-[80dvh] max-h-[80dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-t-3xl border-t bg-background p-0">
          <DialogHeader className="flex-row items-center justify-between border-b border-border px-4 py-3 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="size-4 text-emerald" /> Ask Campus AI / ক্যাম্পাস এআই
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <p className="rounded-xl bg-primary-soft p-2.5 text-[10px] text-primary">
              Answers come only from Campus Path data. Verify before relying on it. / সব উত্তর শুধু
              Campus Path ডাটা থেকে — নিশ্চিত হয়ে নিন।
            </p>
            {lines.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void ask(s)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:border-emerald hover:text-emerald"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {lines.map((line, i) => (
              <div
                key={i}
                className={`flex ${line.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs ${line.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}
                >
                  {line.mode && (
                    <span className="mb-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[9px] font-bold text-primary">
                      {line.mode === "campus"
                        ? "Campus data / ক্যাম্পাস ডেটা"
                        : line.mode === "general"
                          ? "General AI / সাধারণ AI"
                          : "Campus + General / দুটোই"}
                    </span>
                  )}
                  <div className="space-y-1 leading-relaxed">{renderSafe(line.content)}</div>
                  <button
                    type="button"
                    aria-label="Copy answer"
                    onClick={() =>
                      void navigator.clipboard
                        ?.writeText(line.content)
                        .then(() => toast.success("Copied / কপি হয়েছে"))
                    }
                    className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground underline"
                  >
                    <Copy className="size-3" /> Copy / কপি
                  </button>
                  {line.role === "assistant" && (
                    <>
                      {line.sources && line.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {line.sources.map((s, j) => (
                            <span
                              key={j}
                              className="rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground"
                            >
                              {s.screen}
                              {s.lastUpdated ? ` · ${s.lastUpdated.slice(0, 10)}` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      {line.deepLink && (
                        <Link
                          to={line.deepLink as never}
                          className="mt-2 inline-block text-[10px] font-bold text-primary underline"
                        >
                          Open in Campus Path / অ্যাপে খুলুন →
                        </Link>
                      )}
                      <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                        <button
                          type="button"
                          aria-label="Helpful answer"
                          onClick={() => void sendFeedback(i, "up")}
                        >
                          <ThumbsUp
                            className={`size-3.5 ${line.vote === "up" ? "text-emerald" : "text-muted-foreground"}`}
                          />
                        </button>
                        <button
                          type="button"
                          aria-label="Not helpful"
                          onClick={() => void sendFeedback(i, "down")}
                        >
                          <ThumbsDown
                            className={`size-3.5 ${line.vote === "down" ? "text-destructive" : "text-muted-foreground"}`}
                          />
                        </button>
                        <button
                          type="button"
                          className="text-[10px] text-muted-foreground underline"
                          onClick={() => {
                            setReporting(i);
                            setReportText("");
                          }}
                        >
                          Report wrong answer / ভুল উত্তর জানান
                        </button>
                      </div>
                      {reporting === i && (
                        <div className="mt-2 space-y-1">
                          <textarea
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            rows={2}
                            aria-label="Report reason"
                            placeholder="কী ভুল ছিল?"
                            className="w-full rounded-lg border border-input bg-background p-2 text-[11px]"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              void sendFeedback(i, "down", reportText || "Wrong answer");
                              setReporting(null);
                            }}
                          >
                            Send / পাঠান
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Bot className="size-4 animate-pulse" /> চিন্তা করছি… / Thinking…
              </p>
            )}
            {notice && <p className="text-[11px] text-destructive">{notice}</p>}
            {!online && (
              <p className="rounded-xl bg-muted p-2 text-[11px] text-muted-foreground">
                অফলাইন — সংযোগ ফিরলে আবার চেষ্টা করুন / Offline — retry when connected.
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!online}
              placeholder="প্রশ্ন লিখুন / Ask a question…"
              aria-label="AI question"
              className="h-11 flex-1 rounded-xl"
            />
            {busy ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Cancel"
                onClick={cancel}
              >
                <Square />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                aria-label="Send"
                disabled={!online || !input.trim()}
              >
                <Send />
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
