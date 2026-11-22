import { initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const config: FirebaseOptions = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] ?? "",
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] ?? "",
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"] ?? "",
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"] ?? "",
  appId: import.meta.env["VITE_FIREBASE_APP_ID"] ?? "",
};

const VAPID_KEY = import.meta.env["VITE_FIREBASE_VAPID_KEY"] ?? "";

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId);

const app = firebaseConfigured ? initializeApp(config) : null;
const auth = app ? getAuth(app) : null;
const provider = new GoogleAuthProvider();

export interface GoogleAccount {
  uid: string;
  email: string;
  name: string;
  photo: string;
}

export function watchGoogleAuth(callback: (user: GoogleAccount | null) => void): () => void {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (user: User | null) => {
    callback(
      user
        ? {
            uid: user.uid,
            email: user.email ?? "",
            name: user.displayName ?? "",
            photo: user.photoURL ?? "",
          }
        : null,
    );
  });
}

export async function signInWithGoogle(): Promise<GoogleAccount> {
  if (!auth) throw new Error("Firebase config missing — add VITE_FIREBASE_* values first");
  const result = await signInWithPopup(auth, provider);
  return {
    uid: result.user.uid,
    email: result.user.email ?? "",
    name: result.user.displayName ?? "",
    photo: result.user.photoURL ?? "",
  };
}

export async function signOutGoogle(): Promise<void> {
  if (auth) await firebaseSignOut(auth);
}

export async function enablePush(): Promise<string | null> {
  if (!app || !VAPID_KEY || !(await isSupported())) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(app);
  return getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
}

export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string }) => void,
): () => void {
  if (!app) return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    callback({
      ...(payload.notification?.title ? { title: payload.notification.title } : {}),
      ...(payload.notification?.body ? { body: payload.notification.body } : {}),
    });
  });
}
