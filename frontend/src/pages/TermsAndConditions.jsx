import React from "react";
import { useEffect } from "react";

const TermsAndConditions = () => {
  useEffect(() => {
    document.title = "Zelbi | Terms and Conditions";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-20 mt-4">
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-bold text-white">
            Terms and Conditions
          </h1>
          <p className="mt-3 text-gray-400">
            Last Updated: July 9, 2026
          </p>
        </div>

        <div className="space-y-10 text-gray-300 leading-8">

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              1. Acceptance of Terms
            </h2>

            <p>
              By accessing or using Zelbi, you agree to be bound by these Terms
              and Conditions. If you do not agree, please discontinue using the
              platform immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              2. Eligibility
            </h2>

            <p>
              You must be at least 18 years old and legally capable of entering
              into binding agreements to use this platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              3. Platform Services
            </h2>

            <p>
              Zelbi provides AI-powered financial insights, educational content,
              analytics, and investment-related tools. The information is
              provided for informational purposes only.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              4. Investment Disclaimer
            </h2>

            <p>
              Zelbi does not provide financial, legal, or investment advice.
              All investment decisions are your sole responsibility.
            </p>

            <p className="mt-3">
              Investing involves risk, including the possible loss of capital.
              Past performance does not guarantee future results.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              5. User Accounts
            </h2>

            <ul className="list-disc ml-6 space-y-2">
              <li>Provide accurate information.</li>
              <li>Keep your password secure.</li>
              <li>You are responsible for all account activity.</li>
              <li>Notify us immediately of unauthorized access.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              6. Acceptable Use
            </h2>

            <p>You agree not to:</p>

            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Use the platform for unlawful purposes.</li>
              <li>Attempt unauthorized access.</li>
              <li>Distribute malware.</li>
              <li>Reverse engineer the platform.</li>
              <li>Disrupt or interfere with our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              7. AI Generated Content
            </h2>

            <p>
              AI-generated responses may contain inaccuracies. Users should
              independently verify any financial or investment information before
              making decisions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              8. Intellectual Property
            </h2>

            <p>
              All trademarks, software, content, graphics, and branding belong
              to Zelbi or its licensors and may not be copied or redistributed
              without permission.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              9. Limitation of Liability
            </h2>

            <p>
              Zelbi shall not be liable for any direct, indirect, incidental, or
              consequential damages resulting from the use of the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              10. Termination
            </h2>

            <p>
              We reserve the right to suspend or terminate accounts that violate
              these Terms or misuse the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              11. Changes to Terms
            </h2>

            <p>
              We may update these Terms at any time. Continued use of Zelbi
              constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              12. Contact
            </h2>

            <p>
              If you have questions regarding these Terms, please contact us at:
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

export default TermsAndConditions;