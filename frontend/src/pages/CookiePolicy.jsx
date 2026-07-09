import { useEffect } from "react";

export default function CookiePolicy() {
  useEffect(() => {
    document.title = "Zelbi | Cookie Policy";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-6">

        {/* Header */}
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-bold text-white">
            Cookie Policy
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
              Welcome to <span className="font-semibold text-white">Zelbi</span>.
              This Cookie Policy explains how we use cookies and similar
              technologies when you visit our website or use our services.
            </p>

            <p className="mt-4">
              By continuing to use Zelbi, you agree to the use of cookies as
              described in this policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              2. What Are Cookies?
            </h2>

            <p>
              Cookies are small text files stored on your device when you visit
              a website. They help websites remember information about your
              visit, making your experience faster, more secure, and more
              personalized.
            </p>
          </section>

          <section>
            <h2 className="mb-6 text-2xl font-semibold text-[#3affa3]">
              3. Cookies We Use
            </h2>

            <div className="space-y-6">

              <div className="rounded-lg border border-white/10 bg-[#111111] p-5">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Essential Cookies
                </h3>

                <p>
                  These cookies are required for Zelbi to function properly.
                  They enable secure login, authentication, account access,
                  security protection, and session management.
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111111] p-5">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Functional Cookies
                </h3>

                <p>
                  These cookies remember your preferences such as settings,
                  language, and user experience improvements.
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111111] p-5">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Analytics Cookies
                </h3>

                <p>
                  Analytics cookies help us understand how visitors use Zelbi.
                  They allow us to improve website performance, fix issues, and
                  enhance the overall user experience.
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111111] p-5">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  AI Assistant Cookies
                </h3>

                <p>
                  These cookies support AI Assistant functionality by
                  maintaining your session and remembering preferences that
                  improve your AI experience.
                </p>
              </div>

            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              4. Third-Party Services
            </h2>

            <p>
              Zelbi may use trusted third-party services such as authentication,
              payment processing, analytics, or cloud infrastructure providers.
              These services may place their own cookies according to their
              respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              5. Managing Cookies
            </h2>

            <p>
              Most web browsers allow you to control cookies through their
              settings. You may choose to delete or block cookies at any time.
              However, disabling essential cookies may affect certain features
              of Zelbi.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              6. Changes to This Policy
            </h2>

            <p>
              We may update this Cookie Policy from time to time. Any changes
              will be posted on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-[#3affa3]">
              7. Contact Us
            </h2>

            <p>
              If you have any questions regarding this Cookie Policy, please
              contact the Zelbi support team through our Contact page.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}