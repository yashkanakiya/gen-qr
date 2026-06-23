<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      <!-- Gradient header bar -->
      <div class="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      <div class="p-8 prose prose-blue max-w-none">
        <h1
          class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
        >
          Privacy Policy
        </h1>
        <p><strong>Last updated:</strong> June 19, 2026</p>

        <p>
          At Gen QR ("we", "our", "us"), we value your privacy. This Privacy Policy explains how we
          collect, use, disclose, and safeguard your information when you use our Service. By using
          the Service, you consent to the practices described in this policy.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>
            <strong>Personal Information:</strong> When you register, we collect your name, email
            address, and password (hashed). We may also collect billing information if you subscribe
            to a paid plan.
          </li>
          <li>
            <strong>Usage Data:</strong> We automatically collect information about your
            interactions with the Service, such as IP address, browser type, pages visited, and time
            spent.
          </li>
          <li>
            <strong>Content:</strong> The QR codes and associated URLs you create are stored to
            provide the Service.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide, maintain, and improve the Service.</li>
          <li>To personalise your experience and send you service-related communications.</li>
          <li>To monitor usage and analyse trends for improving security and performance.</li>
          <li>To comply with legal obligations in India.</li>
        </ul>

        <h2>3. Disclosure of Information</h2>
        <p>We do not sell or rent your personal information. We may share your information:</p>
        <ul>
          <li>
            With trusted third‑party service providers (e.g., hosting, analytics) who assist in
            operating the Service.
          </li>
          <li>
            If required by law or to protect the rights, property, or safety of Gen QR, our users,
            or others.
          </li>
          <li>With your consent, for any other purpose.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement reasonable administrative, technical, and physical safeguards to protect your
          information. However, no method of transmission over the Internet is 100% secure, and we
          cannot guarantee absolute security.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your personal information for as long as your account is active or as needed to
          provide you with the Service. We may retain and use your information to comply with our
          legal obligations, resolve disputes, and enforce our agreements.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          Under Indian law (including the Information Technology Act, 2000 and the upcoming Digital
          Personal Data Protection Act), you have the right to:
        </p>
        <ul>
          <li>Access and update your personal information.</li>
          <li>Request deletion of your account and data.</li>
          <li>Withdraw consent at any time (where consent is the basis for processing).</li>
        </ul>
        <p>To exercise these rights, please <router-link to="/contact">contact us</router-link>.</p>

        <h2>7. Cookies and Tracking</h2>
        <p>
          We use cookies and similar technologies to enhance your experience, analyse usage, and for
          authentication. You can manage your cookie preferences in your browser settings.
        </p>

        <h2>8. Third‑Party Links</h2>
        <p>
          The Service may contain links to third‑party websites. We are not responsible for the
          privacy practices of those sites. We encourage you to review their privacy policies.
        </p>

        <h2>9. Children's Privacy</h2>
        <p>
          The Service is not intended for children under 18. We do not knowingly collect personal
          information from minors.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of changes by
          posting the new policy on this page. Your continued use of the Service after any changes
          indicates your acceptance of the updated policy.
        </p>

        <h2>11. Contact</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy, please
          <router-link to="/contact">contact us</router-link>.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose {
  max-width: 100%;
}
.prose h2 {
  margin-top: 1.5em;
}
</style>
