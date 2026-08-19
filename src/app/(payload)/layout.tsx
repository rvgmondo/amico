/* THIS FILE WAS GENERATED FOR PAYLOAD.
 * It renders the admin panel's own <html> root. Because the app uses multiple
 * root layouts (a (payload) group and a (frontend) group), there is intentionally
 * no top-level src/app/layout.tsx. Do not add one.
 */
import type { ServerFunctionClient } from "payload";

import config from "@payload-config";
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import React from "react";

import { importMap } from "./admin/importMap.js";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
