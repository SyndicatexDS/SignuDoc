import type { Metadata } from "next";
import Link from "next/link";

import { PublicDocumentShell } from "@/components/layout/public-document-shell";
import { requireHostedMode } from "@/lib/hosted-pages";
import { resolvePublicSupportAddress } from "@/lib/public-contact";

export const metadata: Metadata = {
  description:
    "Read how Blueprint collects, uses, shares, retains, and protects information for its e-signature service.",
  title: "Privacy Policy | Blueprint",
};

export default async function PrivacyPage() {
  await requireHostedMode();

  const privacyAddress = await resolvePublicSupportAddress();

  return (
    <PublicDocumentShell
      description="This Privacy Policy describes how Blueprint, operated by RustLabs.io, collects, uses, shares, retains, and protects information across our electronic signature platform."
      lastUpdated="November 21, 2026"
      title="Privacy Policy"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-(--fg)">
          1. Scope and Service Design
        </h2>
        <p>
          Blueprint is a modern electronic-signature and document management service
          provided by RustLabs.io (&quot;RustLabs&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
          This Privacy Policy applies to account holders, senders, signers, website visitors,
          and anyone interacting with Blueprint via{" "}
          <Link
            className="font-semibold text-(--accent-ink) underline decoration-[rgb(var(--accent-rgb)/0.35)] underline-offset-4"
            href="https://blueprint.rustlabs.io"
          >
            blueprint.rustlabs.io
          </Link>.
        </p>
        <p>
          We build Blueprint with privacy and tenant isolation at its core: each user&apos;s
          documents and envelopes are strictly compartmentalized and inaccessible to any
          other user on the platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-(--fg)">
          2. Information We Collect
        </h2>
        <p>We may collect and process the following categories of information:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Account information:</strong> Name, email address, password credentials
            (securely hashed), profile details, and authentication sessions.
          </li>
          <li>
            <strong>Document and workflow data:</strong> Uploaded PDF documents, document
            titles, field configurations, signing order, envelope statuses, and audit records.
          </li>
          <li>
            <strong>Signer and signature data:</strong> Signer names, email addresses, typed
            or drawn signature marks, timestamps, completion records, and decline notices.
          </li>
          <li>
            <strong>Audit trail and technical metadata:</strong> IP addresses, user agent strings,
            operating system and browser identifiers, access timestamps, verification hashes,
            and certificate cryptographic seals required for tamper-evident signature evidence.
          </li>
          <li>
            <strong>Communications and support data:</strong> Inquiries, feedback, and support
            messages sent to our team.
          </li>
          <li>
            <strong>Cookies and local storage:</strong> Secure session cookies, authentication tokens,
            and client-side cache entries (such as temporary draft previews) required for platform operation.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-(--fg)">
          3. How We Collect Information
        </h2>
        <p>We collect information:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Directly from you when you create an account, upload a document, or sign an envelope;</li>
          <li>From senders who invite you as a designated signer on a document;</li>
          <li>
            Automatically as you interact with the service, including generating audit log entries,
            cryptographic document seals, and transactional delivery records.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-(--fg)">
          4. How We Use Information
        </h2>
        <p>We process personal data for legitimate business purposes, including:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Providing, operating, and maintaining the Blueprint e-signature platform;</li>
          <li>Facilitating the preparation, delivery, execution, and verification of signed agreements;</li>
          <li>
            Generating legally binding audit trails and Certificates of Completion with tamper-evident
            cryptographic proof;
          </li>
          <li>Sending essential transactional notifications (such as signing invitations and completed copies);</li>
          <li>Preventing fraud, unauthorized access, and malicious activities;</li>
          <li>Complying with applicable legal, regulatory, and audit obligations.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-(--fg)">
          5. Data Sharing and Subprocessors
        </h2>
        <p>
          We do not sell, rent, or trade your personal information. We never use your documents
          or data for advertising.
        </p>
        <p>
          We only share information with vetted infrastructure and service providers necessary to
          operate the service (e.g., cloud hosting, database management, transactional email delivery,
          and security monitoring), or when required by law or binding court orders.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-(--fg)">
          6. Document Isolation and Security
        </h2>
        <p>
          <strong>Strict Multi-Tenant Isolation:</strong> Our system architecture enforces strict
          per-user and per-organization authorization boundaries. No user can view, download, or access
          documents or envelopes belonging to another user.
        </p>
        <p>
          <strong>Security Safeguards:</strong> We employ end-to-end transport layer security (TLS 1.3),
          robust encryption at rest, cryptographic document hashing, rate limiting, and continuous
          monitoring to safeguard all stored records.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-(--fg)">
          7. GDPR and International Privacy Rights
        </h2>
        <p>
          If you are an individual located in the European Economic Area (EEA), the United Kingdom,
          or another jurisdiction with comprehensive privacy laws (such as CCPA/CPRA in California),
          you have specific statutory rights:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
          <li>
            <strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your
            personal data, subject to legal retention obligations or active agreement audit records.
          </li>
          <li><strong>Right to Data Portability:</strong> Obtain your data in a structured, commonly used format.</li>
          <li><strong>Right to Object and Restrict Processing:</strong> Object to or restrict certain types of data processing.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-(--fg)">
          8. Data Retention
        </h2>
        <p>
          Unsent draft envelopes may be automatically pruned after 30 days of sender inactivity.
          Completed envelopes and signed packages remain accessible to authorized account holders
          for the lifecycle of their active account or in accordance with configurable retention policies.
          Audit log data is retained as necessary to maintain evidentiary integrity under electronic
          signature laws.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold tracking-[-0.02em] text-(--fg)">
          9. Contact Us
        </h2>
        <p>
          To exercise your privacy rights, request account deletion, or ask questions regarding this
          Privacy Policy, please contact our Data Protection and Privacy team at:
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <Link
            className="font-semibold text-(--accent-ink) underline decoration-[rgb(var(--accent-rgb)/0.35)] underline-offset-4"
            href={`mailto:${privacyAddress}`}
          >
            {privacyAddress}
          </Link>
          <br />
          <strong>Operator:</strong> RustLabs.io (
          <Link
            className="font-semibold text-(--accent-ink) underline decoration-[rgb(var(--accent-rgb)/0.35)] underline-offset-4"
            href="https://rustlabs.io"
          >
            https://rustlabs.io
          </Link>
          )
        </p>
      </section>
    </PublicDocumentShell>
  );
}
