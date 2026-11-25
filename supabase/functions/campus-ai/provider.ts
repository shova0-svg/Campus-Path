/** Small swappable provider wrapper: OpenRouter behind one call() function. */

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  name?: string;
  toolCallId?: string;
};

export type ToolDef = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type ToolCall = { id: string; name: string; args: Record<string, unknown> };
export type ProviderResult = {
  content: string;
  toolCalls: ToolCall[];
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
};

export const AI_BUSY_MESSAGE =
  "AI এখন ব্যস্ত — কিছুক্ষণ পরে আবার চেষ্টা করুন / AI is busy right now — please try again later.";

export class ProviderBusyError extends Error {}
export class ProviderError extends Error {
  constructor(public status: number) {
    super(`Provider error ${status}`);
  }
}

export function parseProviderResponse(data: unknown): ProviderResult {
  const message = ((data as { choices?: { message?: Record<string, unknown> }[] })?.choices?.[0]
    ?.message ?? {}) as {
    content?: string | null;
    tool_calls?: { id?: string; function?: { name?: string; arguments?: string } }[];
  };
  const toolCalls: ToolCall[] = (message.tool_calls ?? [])
    .filter((call) => call.function?.name)
    .map((call, i) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function?.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      return { id: call.id ?? `call_${i}`, name: call.function!.name!, args };
    });
  const usage = (
    data as {
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    }
  )?.usage;
  return {
    content: (message.content ?? "").trim(),
    toolCalls,
    ...(usage
      ? {
          usage: {
            promptTokens: usage.prompt_tokens ?? 0,
            completionTokens: usage.completion_tokens ?? 0,
            totalTokens: usage.total_tokens ?? 0,
          },
        }
      : {}),
  };
}

export async function callProvider(opts: {
  baseUrl: string;
  key: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  tools: ToolDef[];
  maxTokens: number;
  timeoutMs: number;
}): Promise<ProviderResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${opts.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${opts.key}`,
        "HTTP-Referer": "https://campus-path-chi.vercel.app",
        "X-Title": "Campus Path",
      },
      body: JSON.stringify({
        model: opts.model,
        messages: [
          { role: "system", content: opts.system },
          ...opts.messages.map((m) => ({
            role: m.role,
            content: m.content ?? "",
            ...(m.role === "tool" ? { tool_call_id: m.toolCallId ?? "" } : {}),
          })),
        ],
        tools: opts.tools,
        tool_choice: "auto",
        max_tokens: opts.maxTokens,
        temperature: 0.2,
      }),
    });
  } catch {
    throw new ProviderError(0);
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 429) throw new ProviderBusyError();
  if (!response.ok) throw new ProviderError(response.status);
  return parseProviderResponse(await response.json());
}
