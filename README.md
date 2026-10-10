# Obsidian ASCIIFlow — local fork

Draw and revise text diagrams inside Obsidian. Diagrams remain ordinary `asciiflow` code blocks in your Markdown notes.

## Start a drawing

Run **ASCIIFlow: Insert ASCII diagram** from the command palette. It inserts a block at the cursor and opens the editor. To edit an existing diagram:

- In Reading view, click **Edit drawing** for a modal or **Open in pane** to keep the note visible alongside it.
- In the note editor, put the cursor inside a diagram and run **ASCIIFlow: Edit ASCII diagram at cursor**.

You can also write a block manually:

````markdown
```asciiflow
┌────────────┐
│ Start here │
└────────────┘
```
````

## Drawing controls

| Action                                      | How                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Select, Box, Line, Arrow, Text, Draw, Erase | Toolbar or V, B, L, A, T, F, E when not typing a label                                                                                |
| Place accurately                            | Hover highlights the target cell; Draw previews its character                                                                         |
| Connect shapes                              | Lines merge into corners, tees and crossings automatically                                                                            |
| Change a connector bend                     | Hold Shift while dragging                                                                                                             |
| Multiple connector bends                    | Enable **Waypoints**, click successive points, hover the final endpoint and press Enter; Escape cancels                               |
| Label a diagram                             | Double-click, or select Text and click; Enter keeps the starting column                                                               |
| Center a label                              | Select a box including its border, then **Center label**                                                                              |
| Move a selection                            | Drag inside it, or use arrow keys; Shift nudges ten cells                                                                             |
| Duplicate                                   | Cmd/Ctrl-drag, or Cmd/Ctrl+D / **Duplicate** then position and click/Enter. Escape cancels; Alt+arrow keys copy while nudging         |
| Paste                                       | Cmd/Ctrl+V, move the floating preview, then click or Enter; Escape cancels. Red cells indicate existing content that will be replaced |
| Resize a box                                | Select its exact bounds; drag a corner handle. Resizing refuses to crop labels                                                        |
| Move arrow endpoints                        | Select a simple arrow's exact bounds; drag an endpoint handle                                                                         |
| Erase                                       | Drag with Erase; select a 1-, 3-, or 5-cell brush                                                                                     |
| Pick a character                            | Alt-click existing text with Draw selected                                                                                            |
| Pan                                         | Scroll, Space-drag on the canvas, or middle-button drag                                                                               |
| Zoom                                        | Pinch, Cmd/Ctrl-scroll, or +/− controls                                                                                               |
| Fit drawing                                 | **Fit** or 0                                                                                                                          |
| View plain text                             | **Preview** shows selectable text with the note's monospace spacing                                                                   |
| Help                                        | **Help** or ?                                                                                                                         |

The grid grows to the right and downward when you draw. Freehand and eraser strokes interpolate between pointer events. Undo groups nearby typing into a single step and restores the label cursor. Selection paste replaces the whole rectangle, including spaces.

## Save and recover

- **Save** / Cmd/Ctrl+S saves without closing. **Save & close** / Cmd/Ctrl+Shift+S does both.
- Closing a modal with changes offers Save, Discard, or Keep editing.
- Unsaved drafts are stored in this plugin's `data.json`, with a short debounce and a flush on editor teardown. Reopening the unchanged diagram restores its draft.
- Closing a pane using Obsidian's own tab-close button keeps its draft; it does not display the modal's confirmation dialog.
- **ASCIIFlow: Recover latest drawing draft** creates a separate recovery note. Use this if the original diagram was moved, removed, or changed.
- Saving merges changes to an unchanged, uniquely identifiable diagram while preserving edits elsewhere in the note. Conflicting or ambiguous diagrams are rejected, with your drawing kept available.
- **Copy drawing** copies the entire diagram. **Export .txt** downloads a standalone text file. **Clear** asks first and can be undone.

## Use your local fork

Requires Node.js 20 or newer:

```bash
npm ci
npm test
npm run build
```

Set your vault path, then copy the build:

```bash
VAULT_PATH="/absolute/path/to/your/vault"
mkdir -p "$VAULT_PATH/.obsidian/plugins/asciiflow"
cp main.js manifest.json styles.css "$VAULT_PATH/.obsidian/plugins/asciiflow/"
```

Disable an existing ASCIIFlow installation before copying. This fork uses the same plugin ID, `asciiflow`. Restart Obsidian and enable ASCIIFlow under **Settings → Community plugins**. If your vault uses a custom configuration folder, substitute it for `.obsidian`.

After changes, rebuild, copy the files again, and toggle the plugin off/on. `npm run dev` watches and rebuilds source files in the repository; it does not install or reload the plugin automatically. Keep the vault's `data.json` when updating so recovery drafts survive.

## Development and validation

- `npm test`: model and DOM interaction regression tests, including note merging, conflicts, undo/redo, drawing tools, resize handles, labels, clipboard, waypoints, zoom mapping, drafts, and close/save behavior.
- `npm run typecheck`: TypeScript checking.
- `npm run build`: typecheck and bundle the plugin.
- `npm run format`: format source and test files.
- `npx playwright install chromium`, then `npm run test:browser`: browser interaction tests against the standalone editor harness.

The DOM tests mock canvas rendering and Obsidian is not present in that harness. Browser tests require a separate browser download. Validate the installed plugin in Obsidian before relying on it for important diagrams.

### Current boundaries

- Resize handles recognize rectangular boxes and simple, unbranched arrows from their characters. Complex drawings remain editable through rectangular selection; no hidden shape metadata is stored. Attached connectors are not automatically rerouted when a box moves or resizes.
- Keep blocks at the top level of notes; up to three spaces of indentation are supported. Nested list and blockquote blocks are rejected by the save validator.
- Reopening a workspace pane after restarting Obsidian shows an instruction to reopen a diagram; recovery drafts persist separately.
- Full desktop, mobile, and pop-out-window behavior needs an Obsidian smoke test. Keyboard shortcuts are designed for desktop; touch supports basic drawing and erasing.

## Architecture

- `src/main.tsx`: Obsidian commands, modal/pane lifecycle, draft persistence, note saves.
- `src/ui/AsciiFlowApp.tsx`: editor controls, keyboard/clipboard handling, save and recovery UI.
- `src/model/`: sparse grid, text serialization, line joining, shape recognition and note merging.
- `src/tools/`: drawing tools, selection, labels and undo history.
- `src/input/`: pointer, pan/zoom and coordinate mapping.
- `src/renderer/`: canvas drawing, hover, selection and overwrite previews.

MIT license. Based on [xvusrmqj/obsidian-asciiflow](https://github.com/xvusrmqj/obsidian-asciiflow).
