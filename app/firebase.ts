"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAnalytics,
  logEvent,
  isSupported,
  type Analytics,
} from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyApOR81fTczF-cyTs6q9Jb7C-_qcJq_7GU",
  authDomain: "toollo-org.firebaseapp.com",
  projectId: "toollo-org",
  storageBucket: "toollo-org.firebasestorage.app",
  messagingSenderId: "665548341893",
  appId: "1:665548341893:web:f9865c9cfb5427f6af9fec",
  measurementId: "G-M0C81BK6VM",
};

let app: FirebaseApp | undefined;
let analytics: Analytics | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analytics) return analytics;

  try {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(getFirebaseApp());
      return analytics;
    }
  } catch {
    console.warn("Firebase Analytics not supported");
  }
  return null;
}

export async function trackPageView(path: string): Promise<void> {
  const a = await initAnalytics();
  if (a) {
    logEvent(a, "page_view", { page_path: path });
  }
}

export async function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  const a = await initAnalytics();
  if (a) {
    logEvent(a, name, params);
  }
}
