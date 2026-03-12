
import React from 'react';

const HelpCenterView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-gray-800">
      <h1 className="text-4xl font-black mb-8 uppercase tracking-tighter">Help Center</h1>
      
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">How do I join a club?</h3>
              <p className="text-gray-600">Navigate to the Clubs section, explore the available sub-clubs, and click the "Request to Join" button on the club detail page.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">How can I post achievements?</h3>
              <p className="text-gray-600">Go to your Profile or the Achievements section to share your latest success stories with the community.</p>
            </div>
          </div>
        </section>

        <section className="bg-maroon-50 p-8 rounded-3xl border border-maroon-100">
          <h2 className="text-2xl font-bold mb-4 text-maroon-900">Need more help?</h2>
          <p className="text-maroon-800 mb-6 font-medium">If you can't find what you're looking for, feel free to reach out to our support team.</p>
          <div className="flex flex-col sm:flex-row gap-6">
             <div className="flex items-center gap-3">
               <i className="fa-solid fa-phone text-maroon-600"></i>
               <span className="font-bold">+91 91724 51723</span>
             </div>
             <div className="flex items-center gap-3">
               <i className="fa-solid fa-envelope text-maroon-600"></i>
               <span className="font-bold">khanarsalaan891@gmail.com</span>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpCenterView;
