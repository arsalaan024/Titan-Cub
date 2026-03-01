
import React from 'react';

const AboutView: React.FC = () => {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-maroon-800 font-bold uppercase tracking-widest text-sm">Our Legacy</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-4 mb-8">Titan Club: The Heart of Student Excellence</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Founded in 2010, Titan Club serves as the central governing body for all specialized student clubs at the university. We bridge the gap between academic theory and practical industry application by fostering a culture of peer-led learning and professional development.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Our parent organization ensures every student has access to high-quality resources, mentorship, and opportunities to lead, innovate, and excel.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-maroon-800 rounded-full flex items-center justify-center text-white">
                  <i className="fa-solid fa-eye"></i>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">Our Vision</h4>
                  <p className="text-gray-600">To be the global benchmark for student-led innovation and leadership development.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-maroon-800 rounded-full flex items-center justify-center text-white">
                  <i className="fa-solid fa-bullseye"></i>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">Our Mission</h4>
                  <p className="text-gray-600">Empowering every member with the technical skills, creative mindset, and networking opportunities required to thrive in a dynamic world.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img 
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" 
              className="w-full h-80 object-cover rounded-2xl shadow-lg"
              alt="Team"
            />
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" 
              className="w-full h-80 object-cover rounded-2xl shadow-lg mt-8"
              alt="Collaboration"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
