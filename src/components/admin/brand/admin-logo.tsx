/* eslint-disable @next/next/no-img-element */

/**
 * Amico Motors' marks in the admin, adapted from the Rynet and Verboten admins: the mascot as the
 * small icon (the menu and the corner Payload reserves for it), and the full logo on the sign-in
 * screen. Plain <img> on purpose: the admin draws these on every screen. Styling in
 * src/app/(payload)/custom.scss.
 */

export function AdminIcon() {
  return <img src="/brand/mascot.png" alt="" width={32} height={32} className="am-admin-icon" />;
}

export function AdminLogo() {
  return <img className="am-admin-logo" src="/brand/logo.png" alt="Amico Motors" width={220} height={116} />;
}

const INTRO = {
  en: { title: "The office", lead: "Your cars, enquiries and the website, in one place." },
  af: { title: "Die kantoor", lead: "Julle karre, navrae en die webblad, op een plek." },
};

/** Above the sign-in form. Payload's sign-in screen has no heading, so this is its h1. */
export function LoginIntro({ i18n }: { i18n?: { language?: string } }) {
  const t = INTRO[i18n?.language === "af" ? "af" : "en"];
  return (
    <div className="am-admin-login-intro">
      <h1 className="am-admin-login-intro__title">{t.title}</h1>
      <p className="am-admin-login-intro__lead">{t.lead}</p>
    </div>
  );
}
