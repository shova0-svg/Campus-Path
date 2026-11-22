import { db } from "./client";

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
}

export async function savePushSubscription(
  userId: string,
  sub: PushSubscriptionRow,
): Promise<void> {
  const { error } = await db.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      user_agent: sub.userAgent.slice(0, 300),
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const { error } = await db.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}

export function subscriptionToRow(sub: PushSubscription): PushSubscriptionRow {
  const json = sub.toJSON();
  const keys = json.keys ?? {};
  return {
    endpoint: sub.endpoint,
    p256dh: keys["p256dh"] ?? "",
    auth: keys["auth"] ?? "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
}
