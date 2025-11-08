import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Swiss Legal Assistant",
  description:
    "Learn how Swiss Legal Assistant collects, uses, and safeguards your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 text-gray-900">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
          Privacy Policy
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Your Privacy Matters to Us
        </h1>
        <p className="text-base text-gray-600">
          This Privacy Policy explains how Swiss Legal Assistant (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) collects, uses, discloses, and safeguards your
          information when you use our platform. Please read it carefully. If you
          do not agree with the terms, you should discontinue use of the service.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Information We Collect</h2>
        <p>
          We collect the information you provide directly when creating an
          account, completing your profile, submitting legal inquiries, or
          communicating with our support team. This may include your name, email
          address, phone number, location, and the details of the legal matters
          you share. We also automatically collect usage data such as IP address,
          device information, and interaction data to improve the platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
        <p>
          We use collected data to provide and personalize the service, match you
          with suitable legal professionals, maintain platform security, and
          comply with legal obligations. Aggregated and anonymized usage data may
          be used to enhance features, develop new functionality, and improve
          overall performance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">How We Share Information</h2>
        <p>
          We share personal information only when necessary to operate the
          platform, such as with vetted legal partners who sign confidentiality
          agreements, service providers that support our infrastructure, or when
          required by law. We do not sell your personal information. Any third
          parties receiving your data must protect it according to contractual
          and legal obligations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Data Retention and Security</h2>
        <p>
          We retain personal data only as long as necessary to deliver the
          service and fulfill our obligations. We implement administrative,
          technical, and physical safeguards to protect your data against loss,
          misuse, unauthorized access, disclosure, alteration, or destruction.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Your Rights</h2>
        <p>
          Depending on your jurisdiction, you may have rights to access, correct,
          delete, or restrict the processing of your personal data, as well as
          request data portability and object to automated decision-making. You
          can manage many of these preferences in your account settings or by
          contacting us directly.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">International Transfers</h2>
        <p>
          Swiss Legal Assistant primarily processes data within Switzerland and
          the European Union. When we transfer data outside these regions, we use
          appropriate safeguards, such as Standard Contractual Clauses, to ensure
          your information receives equivalent protection.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Children&apos;s Privacy</h2>
        <p>
          Our services are not directed to individuals under the age of 18. We do
          not knowingly collect personal information from children. If we become
          aware that we have collected data from a minor without parental consent,
          we will take steps to delete that information promptly.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy to reflect changes in law, our
          services, or operational practices. We will notify you of material
          changes through the platform or via email, and the updated policy will
          include a revised effective date.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Contact Us</h2>
        <p>
          If you have questions or requests related to your personal data, email
          us at&nbsp;
          <a
            href="mailto:privacy@swisslegalassistant.com"
            className="font-medium text-sky-600 underline"
          >
            privacy@swisslegalassistant.com
          </a>{" "}
          or submit a request through our support portal.
        </p>
      </section>

     
    </div>
  );
}

