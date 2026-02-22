'use client';

import Link from 'next/link';
import { Target } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-landing-espresso text-landing-cream pt-20 pb-10">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-landing-espresso-light/30 pb-16">

          <div className="md:col-span-5 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <Target className="h-8 w-8 text-landing-terracotta group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-3xl font-black tracking-tighter uppercase group-hover:text-landing-terracotta transition-colors duration-300">
                DuoTrak
              </span>
            </Link>
            <p className="text-landing-cream/60 font-medium max-w-sm text-lg">
              Real accountability with a real partner. Set goals, prove your progress, grow together.
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-bold text-sm tracking-widest text-landing-cream/40 uppercase mb-6">Navigate</h3>
            <ul className="space-y-4 font-bold uppercase tracking-wide">
              <li><a href="#features" className="hover:text-landing-terracotta transition-colors flex items-center gap-2"><span className="w-2 h-[2px] bg-landing-espresso-light inline-block"></span>Features</a></li>
              <li><a href="#how-it-works" className="hover:text-landing-terracotta transition-colors flex items-center gap-2"><span className="w-2 h-[2px] bg-landing-espresso-light inline-block"></span>How It Works</a></li>
              <li><Link href="/login" className="hover:text-landing-terracotta transition-colors flex items-center gap-2"><span className="w-2 h-[2px] bg-landing-espresso-light inline-block"></span>Log In</Link></li>
              <li><Link href="/signup" className="hover:text-landing-terracotta transition-colors flex items-center gap-2"><span className="w-2 h-[2px] bg-landing-espresso-light inline-block"></span>Sign Up</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 flex flex-col md:items-end">
            <h3 className="font-bold text-sm tracking-widest text-landing-cream/40 uppercase mb-6">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" aria-label="X (Twitter)" className="bg-landing-espresso-light/30 p-4 hover:bg-landing-terracotta hover:text-white transition-colors duration-300 rounded-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="#" aria-label="GitHub" className="bg-landing-espresso-light/30 p-4 hover:bg-landing-terracotta hover:text-white transition-colors duration-300 rounded-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="bg-landing-espresso-light/30 p-4 hover:bg-landing-terracotta hover:text-white transition-colors duration-300 rounded-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-mono tracking-widest text-landing-cream/30 uppercase">
          <p>&copy; {new Date().getFullYear()} DuoTrak. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex gap-6">
            <Link href="/privacy" className="hover:text-landing-cream transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-landing-cream transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
