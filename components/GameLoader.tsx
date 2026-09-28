"use client";

import dynamic from "next/dynamic";

// The game reads drafts from localStorage and runs sandboxes, so it renders only in the browser.
const GameLoader = dynamic(() => import("./GameClient"), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-muted">Loading challenge…</div>,
});

export default GameLoader;
