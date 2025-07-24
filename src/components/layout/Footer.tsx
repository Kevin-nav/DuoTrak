import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="w-full mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center space-x-6 mb-4">
          <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/help" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            Help
          </Link>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">&copy; {new Date().getFullYear()} DuoTrak. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
