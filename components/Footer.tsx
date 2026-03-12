import React from 'react';
import { Link } from 'react-router-dom';

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
            <p className="text-gray-500 max-w-sm mb-4 font-medium">
              The premier parent organization for campus excellence, innovation, and leadership. Empowering students to lead the future.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-maroon-800 transition-colors"><i className="fa-brands fa-facebook text-xl"></i></a>
              <a href="https://www.instagram.com/titans_tcoer/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-maroon-800 transition-colors"><i className="fa-brands fa-instagram text-xl"></i></a>
              <a href="#" className="text-gray-400 hover:text-maroon-800 transition-colors"><i className="fa-brands fa-linkedin text-xl"></i></a>
              <a href="#" className="text-gray-400 hover:text-maroon-800 transition-colors"><i className="fa-brands fa-x-twitter text-xl"></i></a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-500 hover:text-maroon-800 text-sm font-bold transition-colors">Home</Link></li>
              <li><Link to="/clubs" className="text-gray-500 hover:text-maroon-800 text-sm font-bold transition-colors">Clubs</Link></li>
              <li><Link to="/activities" className="text-gray-500 hover:text-maroon-800 text-sm font-bold transition-colors">Activities</Link></li>
              <li><Link to="/career" className="text-gray-500 hover:text-maroon-800 text-sm font-bold transition-colors">Career Hub</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link to="/help-center" className="text-gray-500 hover:text-maroon-800 text-sm font-bold transition-colors">Help Center</Link></li>
              <li><Link to="/privacy-policy" className="text-gray-500 hover:text-maroon-800 text-sm font-bold transition-colors">Privacy Policy</Link></li>
              <li className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Contact Us</p>
                <div className="space-y-1">
                  <a href="tel:+919172451723" className="block text-gray-500 hover:text-maroon-800 text-xs font-bold transition-colors">+91 91724 51723</a>
                  <a href="mailto:khanarsalaan891@gmail.com" className="block text-gray-500 hover:text-maroon-800 text-xs font-bold transition-colors truncate">khanarsalaan891@gmail.com</a>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} Titan Club. All rights reserved. Designed for Excellence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
