import { build } from "esbuild";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const result = await build({
  entryPoints: ["tests/browser-harness.tsx"],
  bundle: true,
  write: false,
  format: "iife",
  define: { "process.env.NODE_ENV": '"development"' },
});
const js = result.outputFiles[0].text;
createServer(async (req, res) => {
  if (req.url === "/app.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(js);
  } else if (req.url === "/styles.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(await readFile("styles.css"));
  } else {
    res.setHeader("Content-Type", "text/html");
    res.end(
      `<!doctype html><html><head><link rel="stylesheet" href="/styles.css"><style>body {margin:0;--font-monospace:monospace;--background-primary:#202124;--background-secondary:#292a2d;--text-normal:#eee;--text-muted:#aaa;--background-modifier-border:#444;--interactive-accent:#9c85fa;--text-on-accent:#15121e;--text-error:#ff8888;--text-accent:#b6a5fa}button,input,select,textarea {background:#303134;color:#eee;border:1px solid #666}#root{height:100vh}button{font-family:system-ui}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>`,
    );
  }
}).listen(4173, "127.0.0.1");
