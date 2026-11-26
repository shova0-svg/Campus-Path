export type ChatErrorCode =
  | "limit"
  | "busy"
  | "offline"
  | "timeout"
  | "disabled"
  | "unauthenticated"
  | "cancelled"
  | "generic";

const MESSAGES: Record<ChatErrorCode, { bn: string; en: string }> = {
  limit: {
    bn: "দৈনিক প্রশ্নের সীমা শেষ — কাল আবার চেষ্টা করুন।",
    en: "Daily question limit reached — try again tomorrow.",
  },
  busy: {
    bn: "AI এখন ব্যস্ত — কিছুক্ষণ পরে আবার চেষ্টা করুন।",
    en: "AI is busy right now — please try again shortly.",
  },
  offline: {
    bn: "ইন্টারনেট সংযোগ নেই — সংযোগ ফিরলে আবার চেষ্টা করুন।",
    en: "No internet connection — retry when you are online.",
  },
  timeout: {
    bn: "উত্তর আনতে অনেকক্ষণ লেগেছে — আবার চেষ্টা করুন।",
    en: "The answer took too long — please retry.",
  },
  disabled: {
    bn: "AI সেবা এখন বন্ধ আছে।",
    en: "AI service is disabled right now.",
  },
  unauthenticated: {
    bn: "সেশন শেষ হয়েছে — আবার লগইন করুন।",
    en: "Your session expired — please sign in again.",
  },
  cancelled: {
    bn: "বাতিল করা হয়েছে।",
    en: "Cancelled.",
  },
  generic: {
    bn: "উত্তর আনতে সমস্যা হয়েছে — আবার চেষ্টা করুন।",
    en: "Couldn't get an answer — please retry.",
  },
};

export function chatErrorMessage(code: ChatErrorCode, requestId?: string): string {
  const message = MESSAGES[code] ?? MESSAGES.generic;
  const ref = requestId ? ` Ref: ${requestId}` : "";
  return `${message.bn} ${message.en}${ref}`.trim();
}

export function codeFromHttp(status: number, bodyCode?: string): ChatErrorCode {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "disabled";
  if (status === 429) return "limit";
  if (status === 503) return "busy";
  if (
    bodyCode === "limit" ||
    bodyCode === "busy" ||
    bodyCode === "disabled" ||
    bodyCode === "unauthenticated"
  )
    return bodyCode;
  return "generic";
}
