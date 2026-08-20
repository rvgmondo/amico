/**
 * Passenger / LiteSpeed (lsnode) entry point for cPanel "Setup Node.js App".
 *
 * The host launches this file and provides the port via process.env.PORT. It starts
 * the already-built Next.js app in production mode (run `npm run build` first, or
 * upload the prebuilt .next). CommonJS (.cjs) on purpose so it works regardless of
 * package.json "type": "module".
 */

// Cap thread pools BEFORE anything loads. On shared hosts (CloudLinux LVE) the
// process limit is low, but libraries like the SQLite client (Rust/tokio) and sharp
// default to one thread per CPU core, and shared boxes report dozens of cores. These
// caps keep the app well under the limit. Any value already set by the host wins.
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "4";
process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || "2";
process.env.VIPS_CONCURRENCY = process.env.VIPS_CONCURRENCY || "1";
process.env.NEXT_TELEMETRY_DISABLED = process.env.NEXT_TELEMETRY_DISABLED || "1";

const { createServer } = require("http");
const next = require("next");

// Make relative paths (e.g. the SQLite `file:./amico.db`) resolve to the app root,
// no matter what working directory the host starts this process in.
process.chdir(__dirname);

const port = process.env.PORT || 3000;
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Amico Motors ready on port ${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start Next.js:", err);
    process.exit(1);
  });
