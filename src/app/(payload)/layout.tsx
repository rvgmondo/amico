/* THIS FILE WAS GENERATED FOR PAYLOAD.
 * It renders the admin panel's own <html> root. Because the app uses multiple
 * root layouts (a (payload) group and a (frontend) group), there is intentionally
 * no top-level src/app/layout.tsx. Do not add one.
 */
import type { ServerFunctionClient } from "payload";

import config from "@payload-config";
import "@payloadcms/next/css";
// The Amico Motors look on the admin. Loaded only here; see custom.scss.
import "./custom.scss";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { Montserrat, Open_Sans } from "next/font/google";
import React from "react";

import { importMap } from "./admin/importMap.js";

// The public site's fonts, self-hosted by next/font so the admin's CSP (font-src 'self') allows them.
const montserrat = Montserrat({ subsets: ["latin"], variable: "--am-font-display", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--am-font-body", display: "swap" });

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
    <div className={`am-admin-fonts ${montserrat.variable} ${openSans.variable}`}>{children}</div>
  </RootLayout>
);

export default Layout;
