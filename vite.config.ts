import { defineConfig } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// NOTE: @tanstack/devtools-vite's devtools() plugin is intentionally NOT
// included. Root cause (found via systematic-debugging, see filix-bugs.md):
// its browser-console-forwarding bridge mirrors client console output
// (including React's hydration-mismatch dumps) into a server-side
// console.error/write call. Under this project's `nohup ... > logfile 2>&1 &`
// execution on Windows/Git Bash, that particular synchronous write can throw
// an unhandled 'error' event on the underlying SyncWriteStream, which Node
// treats as fatal and exits — killing the whole dev server, not just logging
// a warning. Every link on the site then "stops working" because nothing is
// listening on the port anymore. Do not re-add this plugin without also
// fixing how stdout is captured (e.g. run_in_background instead of a shell
// redirect), or the crash returns.
// nitro() wires the SSR build to a real hosting adapter (Vercel serverless
// function, Node server, etc). Without it, `vite build` emits a bare
// dist/server/server.js that nothing invokes — Vercel's zero-config "vite"
// framework preset then deploys dist/client as a static site (JS/CSS chunks
// only, no per-route HTML), so every real route 404s. Nitro auto-detects the
// `VERCEL` build-machine env var and picks the vercel preset with no extra
// config needed.
const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact()],
})

export default config
