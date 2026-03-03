
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRoles } from '../types';
import { useUser } from '@clerk/clerk-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user: clerkUser } = useUser();

  // Avatar component — shows Clerk photo or a person silhouette
  const Avatar = ({ size = 'w-9 h-9' }: { size?: string }) => (
    <div className={`${size} rounded-full overflow-hidden bg-[#800000] flex items-center justify-center ring-2 ring-[#800000]/30 hover:ring-[#800000] transition-all`}>
      {clerkUser?.imageUrl ? (
        <img src={clerkUser.imageUrl} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      )}
    </div>
  );

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Team Members', path: '/team' },
    { name: 'Clubs', path: '/clubs' },
    { name: 'Activities', path: '/activities' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Achievements', path: '/achievements' },
    { name: 'Career', path: '/career' },
    { name: 'Games', path: '/games' },
    { name: 'Community Chat', path: '/community-chat' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-maroon-800 rounded-md flex items-center justify-center text-white font-bold text-xl">T</div>
              <span className="text-xl font-bold text-maroon-800 tracking-tight hidden md:block">TITAN CLUB</span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.path) ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}
              >
                {link.name}
              </Link>
            ))}
            {user?.role === UserRoles.SUPER_ADMIN && (
              <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}>
                Oversight
              </Link>
            )}

            {/* Profile avatar — shows photo or person icon */}
            <Link to="/profile" className="ml-4" title={user ? user.name : 'Profile'}>
              <Avatar />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Mobile profile icon */}
            <Link to="/profile">
              <Avatar size="w-8 h-8" />
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-maroon-800 hover:bg-gray-100 focus:outline-none">
              <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 absolute top-16 left-0 right-0 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.path) ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}>
                {link.name}
              </Link>
            ))}
            {user?.role === UserRoles.SUPER_ADMIN && (
              <Link to="/dashboard" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard') ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}>
                Oversight
              </Link>
            )}
            <Link to="/profile" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/profile') ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}>
              {user ? 'My Profile' : 'Login / Profile'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
