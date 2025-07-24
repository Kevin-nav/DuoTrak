'use client';

import Link from 'next/link';
import { DuoTrakLogo, XIcon, GithubIcon, LinkedInIcon } from '@/components/ui/icons';

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          {/* Logo and Brand */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <DuoTrakLogo className="h-8 w-8 text-primary-blue" />
              <span className="text-2xl font-bold">DuoTrak</span>
            </Link>
            <p className="text-slate-400 text-sm max-w-xs">
              The accountability partner you can count on. Turn your goals into reality.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Navigate</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-primary-blue transition-colors">Features</a></li>
              <li><a href="#contact" className="hover:text-primary-blue transition-colors">Contact</a></li>
              <li><Link href="/login" className="hover:text-primary-blue transition-colors">Sign In</Link></li>
              <li><Link href="/signup" className="hover:text-primary-blue transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-bold text-lg mb-4">Connect With Us</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="#" className="hover:text-primary-blue transition-colors"><XIcon className="h-6 w-6" /></a>
              <a href="#" className="hover:text-primary-blue transition-colors"><GithubIcon className="h-6 w-6" /></a>
              <a href="#" className="hover:text-primary-blue transition-colors"><LinkedInIcon className="h-6 w-6" /></a>
            </div>
          </div>

        </div>
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} DuoTrak. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
