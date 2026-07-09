import React from "react";
import { useEffect } from "react";



const PrivacyPolicy = () => {

  useEffect(() => {
    document.title = "Zelbi | Privacy Policy";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-20 mt-4">
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-bold text-white">
            Privacy Policy
          </h1>
          <p className="mt-3 text-gray-400">
            Last Updated: July 9, 2026
          </p>
        </div>

        <div className="space-y-10 text-gray-300 leading-8">

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              1. Introduction
            </h2>

            <p>
              Zelbi values your privacy. This Privacy Policy explains how we
              collect, use, store, and protect your personal information when
              you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">              2. Information We Collect
            </h2>

            <ul className="list-disc ml-6 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Profile information</li>
              <li>Account credentials (encrypted)</li>
              <li>Usage and analytics data</li>
              <li>Device and browser information</li>
              <li>IP address</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">              3. How We Use Your Information
            </h2>

            <ul className="list-disc ml-6 space-y-2">
              <li>Create and manage your account.</li>
              <li>Provide AI-powered investment insights.</li>
              <li>Improve our products and services.</li>
              <li>Respond to support requests.</li>
              <li>Detect fraud and secure the platform.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">              4. AI Services
            </h2>

            <p>
              If you interact with our AI assistant, your prompts may be
              processed to generate responses. Please avoid sharing highly
              sensitive personal or financial information in AI conversations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">              5. Cookies
            </h2>

            <p>
              We use cookies and similar technologies to remember preferences,
              improve performance, and analyze website usage.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              6. Data Security
            </h2>

            <p>
              We implement industry-standard security measures to protect your
              information. However, no internet transmission or storage system
              is completely secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              7. Third-Party Services
            </h2>

            <p>
              We may use trusted third-party providers such as authentication,
              analytics, payment processors, cloud hosting, and AI service
              providers to operate our platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              8. Your Rights
            </h2>

            <ul className="list-disc ml-6 space-y-2">
              <li>Access your personal information.</li>
              <li>Update inaccurate information.</li>
              <li>Request deletion of your account.</li>
              <li>Request a copy of your personal data.</li>
              <li>Contact us regarding privacy concerns.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              9. Children's Privacy
            </h2>

            <p>
              Zelbi is not intended for individuals under 18 years of age. We
              do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              10. Changes to This Policy
            </h2>

            <p>
              We may update this Privacy Policy periodically. Any changes will
              be posted on this page with the updated revision date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              11. Contact Us
            </h2>

            <p>
              If you have questions about this Privacy Policy, please contact us
              at:
            </p>

            <p className="mt-2">
              Email: support@zelbi.ai
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;