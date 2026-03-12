
import React from 'react';

const PrivacyPolicyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-gray-800">
      <h1 className="text-4xl font-black mb-8 uppercase tracking-tighter">Privacy Policy</h1>
      
      <div className="space-y-8 leading-relaxed font-medium">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Data Collection</h2>
          <p>
            Titan Club Portal collects information necessary to provide a personalized experience. This includes basic profile information from your registration via Clerk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Usage of Information</h2>
          <p>
            Your data is used to manage club memberships, track game progress, and allow for community interactions. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Security</h2>
          <p>
            We take industry-standard measures to protect your data, including secure authentication via Clerk and encrypted database storage with Turso.
          </p>
        </section>

        <p className="pt-8 border-t border-gray-100 text-sm text-gray-500 italic">
          Last updated: March 12, 2026
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyView;
