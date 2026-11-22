import { supabase } from "@/integrations/supabase/client";

/**
 * Google sign-in is handled by Lovable Cloud (Supabase Auth). The old Firebase
 * module name is kept so the student UI does not need a rename.
 */
export const firebaseConfigured = true;

export interface GoogleAccount {
  uid: string;
  email: string;
  name: string;
  photo: string;
}

function toAccount(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): GoogleAccount {
  const meta = user.user_metadata ?? {};
  const name =
    typeof meta["full_name"] === "string"
      ? meta["full_name"]
      : typeof meta["name"] === "string"
        ? meta["name"]
        : "";
  const photo = typeof meta["avatar_url"] === "string" ? meta["avatar_url"] : "";
  return { uid: user.id, email: user.email ?? "", name, photo };
}

export function watchGoogleAuth(callback: (user: GoogleAccount | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? toAccount(session.user) : null);
  });
  void supabase.auth.getUser().then(({ data: { user } }) => {
    callback(user ? toAccount(user) : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithGoogle(): Promise<GoogleAccount> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/student` },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Google redirect URL pawa jay ni");
  window.location.assign(data.url);
  return { uid: "", email: "", name: "", photo: "" };
}

export async function signOutGoogle(): Promise<void> {
  await supabase.auth.signOut();
}

/** Push notifications need Firebase Cloud Messaging credentials. Not configured yet. */
export async function enablePush(): Promise<string | null> {
  const token = window.localStorage.getItem("sohoj-rasta-fcm-token");
  return token ?? null;
}

export function onForegroundMessage(
  _callback: (payload: { title?: string; body?: string }) => void,
): () => void {
  return () => {};
}
