/**
 * Passenger entry point for cPanel "Setup Node.js App".
 *
 * cPanel/Passenger launches this file and provides the port to listen on via
 * process.env.PORT. It starts the already-built Next.js app in production mode
 * (so run `npm run build` on the server first). CommonJS on purpose (.cjs) so it
 * works regardless of the package.json "type": "module" setting.
 */
const { createServer } = require("http");
const next = require("next");

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
