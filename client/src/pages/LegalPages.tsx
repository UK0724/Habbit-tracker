import { ReactNode } from "react";
import { Link } from "react-router-dom";

// Public pages linked from the Google Play listing; reachable without signing in.
export const CONTACT_EMAIL = "learnverse02@gmail.com";
// Must match the retention set on the /aws/lambda/pulse-*-api log groups.
const LOG_RETENTION_DAYS = 30;

const LegalLayout = ({ title, children }: { title: string; children: ReactNode }) => (
  <main className="mx-auto max-w-2xl px-4 py-10 text-content">
    <Link to="/" className="text-sm font-semibold text-accent">
      ← Pulse
    </Link>
    <h1 className="mt-4 text-2xl font-bold">{title}</h1>
    <div className="mt-6 space-y-4 text-sm leading-6 text-content-2 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-content [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  </main>
);

export const PrivacyPage = () => (
  <LegalLayout title="Privacy Policy">
    <p>Last updated: 28 September 2026</p>
    <p>
      Pulse is a habit and expense tracker available on the web and Android.
      This policy explains what data Pulse stores and how it is used.
    </p>
    <h2>Data we collect</h2>
    <ul>
      <li>Account: your email address, a securely hashed password and your timezone.</li>
      <li>
        Profile photo (optional): a small photo you upload, stored with your
        account and deleted with it.
      </li>
      <li>
        Content you create: habits, habit logs and notes, expenses and budgets,
        and progress such as XP, gems, streaks and achievements.
      </li>
      <li>
        Notifications: if you enable reminders, a push-notification address for
        your device or browser.
      </li>
      <li>
        Server logs: for security and troubleshooting, our servers record each
        request&apos;s IP address, time, requested address, response status and
        browser or device type. Error logs may include your internal account ID.
        Logs do not contain your password or the content of your entries.
      </li>
    </ul>
    <h2>How we use it</h2>
    <p>
      Your data is used only to provide the app&apos;s features: syncing your
      data across devices, calculating streaks and progress, and sending the
      reminders you turn on. Pulse has no advertising, does not sell your data
      and does not share it with third parties for their own purposes.
    </p>
    <h2>Storage and security</h2>
    <p>
      Data is sent over HTTPS and stored on Amazon Web Services and MongoDB
      Atlas servers in Mumbai, India. Passwords are never stored in plain text.
    </p>
    <h2>Retention and deletion</h2>
    <p>
      Your data is kept while your account exists. You can permanently delete
      your account and all associated data at any time; see{" "}
      <Link to="/delete-account" className="text-accent underline">
        Delete your account
      </Link>
      . Deletion takes effect immediately. Server logs are kept separately
      for up to {LOG_RETENTION_DAYS} days and then deleted automatically; they
      are not removed when you delete your account.
    </p>
    <h2>Children</h2>
    <p>Pulse is not directed at children under 13.</p>
    <h2>Contact</h2>
    <p>
      Questions or requests: <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    </p>
  </LegalLayout>
);

export const DeleteAccountInfoPage = () => (
  <LegalLayout title="Delete your Pulse account">
    <p>You can permanently delete your Pulse account yourself, from the app or the web.</p>
    <h2>In the Android app</h2>
    <ul>
      <li>Open Pulse and go to the Profile tab.</li>
      <li>Tap Delete Account, enter your password and confirm.</li>
    </ul>
    <h2>On the web</h2>
    <ul>
      <li>
        <Link to="/login" className="text-accent underline">Sign in</Link>, then open Settings.
      </li>
      <li>Under Delete account, enter your password and confirm.</li>
    </ul>
    <h2>What is deleted</h2>
    <p>
      Your account, email address, profile photo, habits, logs, expenses, budgets, progress,
      achievements, notification subscriptions and all other data associated
      with your account are deleted immediately and cannot be recovered.
    </p>
    <h2>What is kept</h2>
    <p>
      Server request logs (IP address, time, requested address and device type,
      and sometimes your internal account ID) are kept for up to{" "}
      {LOG_RETENTION_DAYS} days for security and troubleshooting, then deleted
      automatically. They do not contain your email address, password or entries.
    </p>
    <p>
      Can&apos;t sign in? Email{" "}
      <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
      from your account&apos;s email address and we will delete it for you.
    </p>
  </LegalLayout>
);
