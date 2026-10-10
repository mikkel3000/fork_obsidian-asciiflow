import React from "react";
import { createRoot } from "react-dom/client";
import { AsciiFlowApp, EditorHandle } from "../src/ui/AsciiFlowApp";
const state = window as unknown as {
  saved?: string;
  draft?: string | null;
  closed?: boolean;
  editor?: EditorHandle;
  failSave?: boolean;
  initial?: string;
};
createRoot(document.getElementById("root")!).render(
  <AsciiFlowApp
    initialText={new URLSearchParams(location.search).get("initial") ?? ""}
    onReady={(handle) => {
      state.editor = handle;
    }}
    onSave={async (text) => {
      if (state.failSave) throw new Error("Simulated save failure");
      state.saved = text;
    }}
    onDraft={(text) => {
      state.draft = text;
    }}
    onCancel={() => {
      state.closed = true;
    }}
  />,
);
