"use client";

import { useEffect } from "react";
import { initAnalytics, trackPageView } from "./firebase";

export default function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics().then(() => {
      trackPageView(window.location.pathname);
    });
  }, []);

  return null;
}
