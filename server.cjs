/**
 * Passenger / LiteSpeed (lsnode) entry point for cPanel "Setup Node.js App".
 *
 * The host launches this file and provides the port via process.env.PORT. It starts
 * the already-built Next.js app in production mode (run `npm run build` first).
 * CommonJS (.cjs) on purpose so it works regardless of package.json "type": "module".
 */
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
