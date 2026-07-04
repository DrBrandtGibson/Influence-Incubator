/**
 * Telemetry init — Sentry (error tracking) + PostHog (product analytics).
 *
 * Both are opt-in via env vars. If either DSN/key is absent, that provider
 * silently no-ops. Safe to import in every environment.
 *
 * Env vars (frontend/.env):
 *   REACT_APP_SENTRY_DSN            (leave blank to disable Sentry)
 *   REACT_APP_SENTRY_ENVIRONMENT    (defaults to "production")
 *   REACT_APP_POSTHOG_KEY           (leave blank to disable PostHog)
 *   REACT_APP_POSTHOG_HOST          (defaults to "https://us.i.posthog.com")
 *
 * Use `track(event, props)` from anywhere to log a product event.
 * Use `identify(userId, traits)` after login to link telemetry to the user.
 */
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY;
const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST || "https://us.i.posthog.com";

// ---------- Sentry ----------
if (SENTRY_DSN) {
    try {
        Sentry.init({
            dsn: SENTRY_DSN,
            environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || "production",
            integrations: [Sentry.browserTracingIntegration()],
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 0.1,
        });
    } catch (e) {
        console.warn("Sentry init failed:", e);
    }
}

// ---------- PostHog ----------
let _phReady = false;
if (POSTHOG_KEY) {
    try {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: "identified_only", // don't create profiles for anonymous visitors
            capture_pageview: true,
            capture_pageleave: true,
        });
        _phReady = true;
    } catch (e) {
        console.warn("PostHog init failed:", e);
    }
}

export function track(eventName, props = {}) {
    if (!_phReady) return;
    try {
        posthog.capture(eventName, props);
    } catch (e) {
        console.warn("PostHog track failed:", e);
    }
}

export function identify(userId, traits = {}) {
    if (!_phReady || !userId) return;
    try {
        posthog.identify(userId, traits);
    } catch (e) {
        console.warn("PostHog identify failed:", e);
    }
    if (SENTRY_DSN) {
        try {
            Sentry.setUser({ id: userId, email: traits.email });
        } catch {
            /* */
        }
    }
}

export function reset() {
    if (_phReady) {
        try { posthog.reset(); } catch { /* */ }
    }
    if (SENTRY_DSN) {
        try { Sentry.setUser(null); } catch { /* */ }
    }
}

// Attach useful lifecycle hooks
if (typeof window !== "undefined") {
    window.addEventListener("error", (ev) => {
        if (SENTRY_DSN) Sentry.captureException(ev.error || new Error(ev.message));
    });
    window.addEventListener("unhandledrejection", (ev) => {
        if (SENTRY_DSN) Sentry.captureException(ev.reason || new Error("Unhandled promise rejection"));
    });
}
