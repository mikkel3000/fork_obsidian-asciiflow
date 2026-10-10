import {
  ItemView,
  MarkdownPostProcessorContext,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  Scope,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { mergeCodeBlock, replaceCodeBlock } from "./model/CodeBlock";
import { drawingPreviewText } from "./model/Serializer";
import { AsciiFlowApp, EditorHandle } from "./ui/AsciiFlowApp";

const VIEW_TYPE = "asciiflow-editor";
type Draft = { text: string; path: string; source: string; start: number };
type Session = {
  key: string;
  file: TFile;
  original: string;
  source: string;
  start: number;
  end: number;
};

class AsciiFlowModal extends Modal {
  private root: Root | null = null;
  private editor: EditorHandle | null = null;
  private force = false;
  constructor(
    private plugin: AsciiFlowPlugin,
    private session: Session,
  ) {
    super(plugin.app);
    // Replace the default modal scope so Escape can never invoke close().
    this.scope = new Scope(plugin.app.scope);
    this.scope.register([], "Escape", () => {
      this.editor?.resetTool();
      return false;
    });
  }
  onOpen() {
    this.modalEl.addClass("asciiflow-modal");
    this.root = createRoot(this.contentEl);
    this.root.render(
      this.plugin.editor(
        this.session,
        () => {
          this.force = true;
          this.close();
        },
        (handle) => {
          this.editor = handle;
        },
      ),
    );
  }
  close() {
    if (!this.force && this.editor) this.editor.requestClose();
    else super.close();
  }
  closeForUnload() {
    this.force = true;
    this.close();
  }
  onClose() {
    this.root?.unmount();
    this.root = null;
    this.plugin.release(this.session);
    this.plugin.modals.delete(this);
  }
}
class AsciiFlowView extends ItemView {
  private root: Root | null = null;
  constructor(
    leaf: WorkspaceLeaf,
    private plugin: AsciiFlowPlugin,
    public session?: Session,
  ) {
    super(leaf);
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return this.session
      ? `Diagram · ${this.session.file.basename}`
      : "ASCIIFlow";
  }
  getIcon() {
    return "pencil-ruler";
  }
  async onOpen() {
    this.contentEl.addClass("asciiflow-pane");
    if (!this.session) {
      this.contentEl.setText("Open a diagram using its Open in pane button.");
      return;
    }
    this.root = createRoot(this.contentEl);
    this.root.render(
      this.plugin.editor(this.session, () => this.leaf.detach()),
    );
  }
  async onClose() {
    this.root?.unmount();
    this.root = null;
    if (this.session) this.plugin.release(this.session);
  }
}
export default class AsciiFlowPlugin extends Plugin {
  readonly modals = new Set<AsciiFlowModal>();
  private drafts: Record<string, Draft> = {};
  private pendingViews = new Map<WorkspaceLeaf, Session>();
  private sessions = new Set<string>();
  private dataQueue: Promise<void> = Promise.resolve();
  async onload() {
    const data = await this.loadData();
    this.drafts = data?.drafts ?? {};
    this.registerView(
      VIEW_TYPE,
      (leaf) => new AsciiFlowView(leaf, this, this.pendingViews.get(leaf)),
    );
    this.registerMarkdownCodeBlockProcessor("asciiflow", (source, el, ctx) =>
      this.renderBlock(source, el, ctx),
    );
    this.addCommand({
      id: "insert-diagram",
      name: "Insert ASCII diagram",
      editorCallback: async (editor, view) => {
        if (!view.file) return;
        const pos = editor.getCursor(),
          prefix = pos.ch > 0 ? "\n" : "";
        const block = prefix + "```asciiflow\n\n```\n";
        editor.replaceRange(block, pos);
        editor.setCursor({ line: pos.line + (prefix ? 2 : 1), ch: 0 });
        const original = editor.getValue(),
          start = pos.line + (prefix ? 1 : 0);
        // Flush the editor before opening the drawing so the session matches disk.
        await view.save();
        this.openSession(
          this.session(view.file, original, start, start + 2, ""),
          false,
        );
      },
    });
    this.addCommand({
      id: "edit-diagram",
      name: "Edit ASCII diagram at cursor",
      editorCheckCallback: (checking, editor, view) => {
        if (!view.file) return false;
        const cursor = editor.getCursor().line;
        let start = cursor;
        while (
          start >= 0 &&
          !/^ {0,3}(`{3,}|~{3,})asciiflow\s*$/.test(editor.getLine(start))
        )
          start--;
        if (start < 0) return false;
        const fence = /(`{3,}|~{3,})/.exec(editor.getLine(start))![1];
        let end = start + 1;
        const close = new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`);
        while (end < editor.lineCount() && !close.test(editor.getLine(end)))
          end++;
        if (end >= editor.lineCount() || cursor > end) return false;
        if (!checking) {
          const indent = /^ */.exec(editor.getLine(start))![0];
          const source = editor
            .getRange({ line: start + 1, ch: 0 }, { line: end, ch: 0 })
            .replace(/\n$/, "")
            .split("\n")
            .map((line) =>
              line.startsWith(indent) ? line.slice(indent.length) : line,
            )
            .join("\n");
          void view
            .save()
            .then(() =>
              this.openSession(
                this.session(view.file!, editor.getValue(), start, end, source),
                false,
              ),
            )
            .catch(
              (error) =>
                new Notice(
                  error instanceof Error
                    ? error.message
                    : "Could not open the diagram.",
                ),
            );
        }
        return true;
      },
    });
    this.addCommand({
      id: "recover-draft",
      name: "Recover latest drawing draft",
      callback: async () => {
        const draft = Object.values(this.drafts).at(-1);
        if (!draft) {
          new Notice("No unsaved drawing drafts.");
          return;
        }
        const leaf = this.app.workspace.getLeaf("tab");
        const path = await this.uniqueRecoveryPath();
        const fence = "`".repeat(
          Math.max(
            3,
            ...(draft.text.match(/`+/g) ?? []).map((s) => s.length + 1),
          ),
        );
        const file = await this.app.vault.create(
          path,
          `# Recovered ASCIIFlow drawing\n\n${fence}asciiflow\n${draft.text}\n${fence}\n`,
        );
        await leaf.openFile(file);
      },
    });
  }
  onunload() {
    for (const modal of this.modals) modal.closeForUnload();
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE))
      leaf.detach();
  }
  private async uniqueRecoveryPath() {
    let i = 1;
    while (this.app.vault.getAbstractFileByPath(`Recovered drawing ${i}.md`))
      i++;
    return `Recovered drawing ${i}.md`;
  }
  private session(
    file: TFile,
    original: string,
    start: number,
    end: number,
    source: string,
  ): Session {
    replaceCodeBlock(original, start, end, source, source);
    return { key: `${file.path}:${start}`, file, original, start, end, source };
  }
  release(session: Session) {
    this.sessions.delete(session.key);
  }
  private openSession(session: Session, pane: boolean) {
    if (this.sessions.has(session.key)) {
      new Notice("This diagram is already open in an ASCIIFlow editor.");
      return;
    }
    this.sessions.add(session.key);
    if (!pane) {
      const modal = new AsciiFlowModal(this, session);
      this.modals.add(modal);
      modal.open();
      return;
    }
    const leaf = this.app.workspace.getLeaf("split");
    this.pendingViews.set(leaf, session);
    void leaf
      .setViewState({ type: VIEW_TYPE, active: true })
      .then(() => this.app.workspace.revealLeaf(leaf))
      .catch(() => {
        this.release(session);
        new Notice("Could not open the drawing pane.");
      })
      .finally(() => this.pendingViews.delete(leaf));
  }
  editor(
    session: Session,
    onCancel: () => void,
    onReady?: (handle: EditorHandle) => void,
  ) {
    const normalize = (value: string) =>
      value.replace(/\r\n/g, "\n").replace(/\n$/, "");
    let draft: Draft | undefined = this.drafts[session.key];
    if (!draft) {
      const candidates = Object.entries(this.drafts).filter(
        ([, d]) =>
          d.path === session.file.path &&
          normalize(d.source) === normalize(session.source),
      );
      if (candidates.length === 1) {
        const [key, value] = candidates[0];
        draft = value;
        delete this.drafts[key];
        this.drafts[session.key] = value;
      }
    }
    if (draft && normalize(draft.source) !== normalize(session.source)) {
      this.drafts[`${session.key}:recovery:${Date.now()}`] = draft;
      delete this.drafts[session.key];
      draft = undefined;
      new Notice(
        "An older draft was kept separately because this diagram changed. Use Recover latest drawing draft to retrieve it.",
      );
    }
    const saveDraft = (text: string | null) => {
      if (text === null) delete this.drafts[session.key];
      else
        this.drafts[session.key] = {
          text,
          path: session.file.path,
          source: session.source,
          start: session.start,
        };
      const snapshot = JSON.parse(JSON.stringify({ drafts: this.drafts }));
      this.dataQueue = this.dataQueue
        .catch(() => {})
        .then(() => this.saveData(snapshot))
        .catch(() => {
          new Notice(
            "Could not store the recovery draft. Save or copy your drawing before closing.",
          );
        });
    };
    return (
      <AsciiFlowApp
        initialText={session.source}
        draft={
          draft && normalize(draft.source) === normalize(session.source)
            ? draft.text
            : undefined
        }
        onDraft={saveDraft}
        onReady={onReady}
        onCancel={onCancel}
        onSave={async (content) => {
          // Flush an open note editor before merging to preserve its unsaved text.
          for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
            const view = leaf.view;
            if (
              view instanceof MarkdownView &&
              view.file?.path === session.file.path
            )
              await view.save();
          }
          let result: ReturnType<typeof mergeCodeBlock> | undefined;
          await this.app.vault.process(session.file, (current) => {
            result = mergeCodeBlock(
              current,
              session.original,
              session.start,
              session.end,
              session.source,
              content,
            );
            return result.text;
          });
          if (result) {
            session.original = result.text;
            session.start = result.start;
            session.end = result.end;
            session.source = content;
          }
        }}
      />
    );
  }
  private renderBlock(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    const container = el.createDiv({ cls: "asciiflow-preview" });
    const bar = container.createDiv({ cls: "asciiflow-preview-actions" });
    for (const pane of [false, true]) {
      const button = bar.createEl("button", {
        text: pane ? "Open in pane" : "Edit drawing",
      });
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath),
            section = ctx.getSectionInfo(container);
          if (!(file instanceof TFile) || !section)
            throw new Error("Reopen the note to locate this diagram.");
          const original = await this.app.vault.read(file);
          this.openSession(
            this.session(
              file,
              original,
              section.lineStart,
              section.lineEnd,
              source,
            ),
            pane,
          );
        } catch (e) {
          new Notice(
            e instanceof Error ? e.message : "Could not open drawing.",
          );
        } finally {
          button.disabled = false;
        }
      });
    }
    container
      .createEl("pre")
      .setText(
        drawingPreviewText(source) ||
          "Empty diagram — click Edit drawing to start.",
      );
  }
}
