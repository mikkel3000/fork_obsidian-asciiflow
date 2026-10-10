export type Figure = {
  id: string;
  name: string;
  category: string;
  tags: string;
  art: string;
};
// Original text templates bundled with the plugin; no network or external assets.
export const figures: Figure[] = [
  {
    id: "box",
    name: "Box",
    category: "Shapes",
    tags: "rectangle node container",
    art: "┌────────────┐\n│            │\n│            │\n└────────────┘",
  },
  {
    id: "rounded",
    name: "Rounded box",
    category: "Shapes",
    tags: "pill start end terminal",
    art: "╭────────────╮\n│            │\n╰────────────╯",
  },
  {
    id: "decision",
    name: "Decision",
    category: "Flowcharts",
    tags: "diamond condition if yes no",
    art: "      /\\\n     /  \\\n    /    \\\n   <  ?   >\n    \\    /\n     \\  /\n      \\/",
  },
  {
    id: "process",
    name: "Process",
    category: "Flowcharts",
    tags: "step action workflow",
    art: "┌────────────┐\n│  Process   │\n└────────────┘",
  },
  {
    id: "flow",
    name: "Two-step flow",
    category: "Flowcharts",
    tags: "workflow pipeline boxes arrow",
    art: "┌─────────┐    ┌─────────┐\n│  Input  ├───►│ Output  │\n└─────────┘    └─────────┘",
  },
  {
    id: "branch",
    name: "Branch",
    category: "Flowcharts",
    tags: "split fork parallel",
    art: "          ┌─────────┐\n      ┌──►│ Path A  │\n──────┤   └─────────┘\n      │   ┌─────────┐\n      └──►│ Path B  │\n          └─────────┘",
  },
  {
    id: "database",
    name: "Database",
    category: "Architecture",
    tags: "storage sql cylinder data",
    art: "   .----------.\n  (  Database  )\n  |`----------'|\n  |            |\n  |            |\n  '------------'",
  },
  {
    id: "server",
    name: "Server",
    category: "Architecture",
    tags: "host backend machine rack",
    art: "┌──────────────┐\n│    Server    │\n├──────────────┤\n│ [====]   ●   │\n│ [====]   ●   │\n└──────────────┘",
  },
  {
    id: "cloud",
    name: "Cloud",
    category: "Architecture",
    tags: "internet network service",
    art: "       .----.\n   .--(      )--.\n  (    Cloud     )\n   '------------'",
  },
  {
    id: "queue",
    name: "Queue",
    category: "Architecture",
    tags: "event message kafka buffer fifo",
    art: "      ┌───┬───┬───┬───┐\n─────►│ 4 │ 3 │ 2 │ 1 ├─────►\n      └───┴───┴───┴───┘",
  },
  {
    id: "user",
    name: "User",
    category: "Architecture",
    tags: "person actor human stick figure",
    art: "   O\n  /|\\\n  / \\",
  },
  {
    id: "browser",
    name: "Browser window",
    category: "Architecture",
    tags: "web frontend application ui",
    art: "┌──────────────────┐\n│ ● ● ●   Browser  │\n├──────────────────┤\n│                  │\n│                  │\n└──────────────────┘",
  },
  {
    id: "document",
    name: "Document",
    category: "Shapes",
    tags: "file page note text",
    art: "┌─────────┐\n│ ─────── │\n│ ─────── │\n│ ─────   │\n└─────────┘",
  },
  {
    id: "folder",
    name: "Folder",
    category: "Shapes",
    tags: "directory files",
    art: "┌──────┐\n│      └───────┐\n│             │\n└─────────────┘",
  },
  {
    id: "table",
    name: "Table",
    category: "Shapes",
    tags: "grid rows columns data",
    art: "┌────────┬────────┐\n│ Key    │ Value  │\n├────────┼────────┤\n│        │        │\n├────────┼────────┤\n│        │        │\n└────────┴────────┘",
  },
  {
    id: "arrow-right",
    name: "Right arrow",
    category: "Connectors",
    tags: "line east forward",
    art: "────────────►",
  },
  {
    id: "arrow-down",
    name: "Down arrow",
    category: "Connectors",
    tags: "line south vertical",
    art: "│\n│\n│\n▼",
  },
  {
    id: "arrow-bent",
    name: "Bent arrow",
    category: "Connectors",
    tags: "elbow corner turn",
    art: "──────┐\n      │\n      ▼",
  },
  {
    id: "bidirectional",
    name: "Two-way arrow",
    category: "Connectors",
    tags: "bidirectional request response",
    art: "◄────────────►",
  },
  {
    id: "tree",
    name: "Tree",
    category: "Architecture",
    tags: "hierarchy directory outline",
    art: "Root\n├── Branch A\n│   ├── Item 1\n│   └── Item 2\n└── Branch B",
  },
  {
    id: "client-server",
    name: "Client / server",
    category: "Architecture",
    tags: "request response frontend backend",
    art: "┌──────────┐          ┌──────────┐\n│  Client  ├─────────►│  Server  │\n│          │◄─────────┤          │\n└──────────┘          └──────────┘",
  },
  {
    id: "layers",
    name: "Three layers",
    category: "Architecture",
    tags: "stack architecture frontend backend database",
    art: "┌─────────────────┐\n│  Presentation   │\n├─────────────────┤\n│  Application    │\n├─────────────────┤\n│      Data       │\n└─────────────────┘",
  },
  {
    id: "cat",
    name: "Cat",
    category: "Characters",
    tags: "animal mascot pet",
    art: " /\\_/\\\n( o.o )\n > ^ <",
  },
  {
    id: "robot",
    name: "Robot",
    category: "Characters",
    tags: "bot agent mascot",
    art: "   ┌─┐\n┌──┴─┴──┐\n│ ◉   ◉ │\n│  ───  │\n└───────┘",
  },
];
export function searchFigures(query: string): Figure[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return figures.filter((f) =>
    words.every((word) =>
      `${f.name} ${f.category} ${f.tags}`.toLowerCase().includes(word),
    ),
  );
}
