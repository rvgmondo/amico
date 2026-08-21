import { getPayload } from "payload";

import config from "../payload.config";

/**
 * Provisions the first admin account for local development.
 * Default credentials are for DEV ONLY, change them (or create a real user in
 * the admin UI) before any deployment. Idempotent: does nothing if users exist.
 *
 * Run: npm run seed:admin
 */
const run = async () => {
  const payload = await getPayload({ config });

  const { totalDocs } = await payload.count({ collection: "users" });
  if (totalDocs > 0) {
    payload.logger.info(`Users already exist (${totalDocs}); skipping.`);
    process.exit(0);
  }

  const email = process.env.ADMIN_EMAIL || "admin@amicomotors.co.za";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const user = await payload.create({
    collection: "users",
    data: { email, password, name: "Amico Admin", roles: ["admin"] },
  });

  payload.logger.info(`Created admin user: ${user.email}`);
  payload.logger.info("DEV credentials, change before deploying.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
