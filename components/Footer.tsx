
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-maroon-800 rounded flex items-center justify-center text-white font-bold text-lg">T</div>
              <span className="text-xl font-bold text-maroon-800 tracking-tight">TITAN CLUB</span>
            </div>
            <p className="text-gray-500 max-w-sm mb-4">
              The premier parent organization for campus excellence, innovation, and leadership. Empowering students to lead the future.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-maroon-800 transition-colors"><i className="fa-brands fa-facebook text-xl"></i></a>
              <a href="#" className="text-gray-400 hover:text-maroon-800 transition-colors"><i className="fa-brands fa-instagram text-xl"></i></a>
              <a href="#" className="text-gray-400 hover:text-maroon-800 transition-colors"><i className="fa-brands fa-linkedin text-xl"></i></a>
              <a href="#" className="text-gray-400 hover:text-maroon-800 transition-colors"><i className="fa-brands fa-x-twitter text-xl"></i></a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-500 hover:text-maroon-800 text-sm transition-colors">Home</a></li>
              <li><a href="#" className="text-gray-500 hover:text-maroon-800 text-sm transition-colors">Clubs</a></li>
              <li><a href="#" className="text-gray-500 hover:text-maroon-800 text-sm transition-colors">Activities</a></li>
              <li><a href="#" className="text-gray-500 hover:text-maroon-800 text-sm transition-colors">Career Hub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-500 hover:text-maroon-800 text-sm transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-500 hover:text-maroon-800 text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-maroon-800 text-sm transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-xs">
            &copy; {new Date().getFullYear()} Titan Club. All rights reserved. Designed for Excellence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
