import { safeGet } from "@/lib/storage";
import { useEffect, useState } from "react";
import { MessageSquare, Send, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { submitFeedback } from "@/lib/repo/feedback";
import { parseStudent, STUDENT_KEY } from "@/lib/student";
import {
  emptyFeedback,
  FEEDBACK_CATEGORIES,
  FEEDBACK_EVENT,
  validateFeedback,
  type FeedbackDraft,
  type FeedbackRequest,
} from "@/lib/feedback";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: FeedbackRequest;
}

export function FeedbackDialog({ open, onOpenChange, initial = {} }: Props) {
  const [draft, setDraft] = useState<FeedbackDraft>(emptyFeedback(initial.page));
  const [errors, setErrors] = useState<Partial<Record<"rating" | "category" | "message", string>>>(
    {},
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft({
        ...emptyFeedback(initial.page ?? ""),
        category: initial.category ?? "",
        message: initial.message ?? "",
      });
      setErrors({});
    }
  }, [open, initial.category, initial.message, initial.page]);

  async function submit() {
    const found = validateFeedback(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const profile = parseStudent(safeGet(STUDENT_KEY));
    const instituteId = initial.instituteId ?? profile?.instituteId ?? "rpi";
    const { data } = await supabase.auth.getSession();
    setSaving(true);
    try {
      await submitFeedback(data.session?.user?.id ?? null, instituteId, draft);
      toast.success("Feedback sent — ধন্যবাদ!", { description: "Admin দেখতে পাবেন" });
      onOpenChange(false);
    } catch {
      toast.error("Feedback পাঠানো যায় ni — offline থাকলে পরে চেষ্টা করুন");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" /> Feedback
          </DialogTitle>
          <DialogDescription className="font-bangla">
            ২০ সেকেন্ডে মতামত দিন — admin দ্রুত দেখতে পাবেন।
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="mb-1.5 text-xs font-semibold">Rating / রেটিং</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star`}
                onClick={() => setDraft({ ...draft, rating: n })}
                className="rounded-lg p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`size-7 ${n <= draft.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          {errors.rating && <p className="mt-1 text-[11px] text-destructive">{errors.rating}</p>}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold">Category / বিষয়</p>
          <div className="grid grid-cols-2 gap-1.5">
            {FEEDBACK_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setDraft({ ...draft, category: c.id })}
                className={`rounded-xl border px-2 py-2 text-left text-[11px] font-medium transition-colors ${
                  draft.category === c.id
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="mt-1 text-[11px] text-destructive">{errors.category}</p>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold">Message / বার্তা</p>
          <Textarea
            value={draft.message}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            placeholder="কী ভুল বা কী চাইছেন এক লাইনে লিখুন…"
            rows={3}
            maxLength={1000}
          />
          {errors.message && <p className="mt-1 text-[11px] text-destructive">{errors.message}</p>}
        </div>

        <Button variant="emerald" className="w-full" onClick={submit} disabled={saving}>
          <Send className="size-4" /> {saving ? "Sending…" : "Send feedback"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/** Mounted once at the app root; listens for openFeedback() from anywhere. */
export function FeedbackHost() {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<FeedbackRequest>({});

  useEffect(() => {
    const handler = (e: Event) => {
      setRequest((e as CustomEvent<FeedbackRequest>).detail ?? {});
      setOpen(true);
    };
    window.addEventListener(FEEDBACK_EVENT, handler);
    return () => window.removeEventListener(FEEDBACK_EVENT, handler);
  }, []);

  return <FeedbackDialog open={open} onOpenChange={setOpen} initial={request} />;
}
