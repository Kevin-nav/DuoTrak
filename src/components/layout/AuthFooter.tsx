import React from 'react';
import Link from 'next/link';

const AuthFooter = () => {
  return (
    <footer className="w-full py-6 px-4 bg-pearl-gray/50 text-center text-sm text-stone-gray mt-auto">
      <div className="max-w-sm mx-auto">
        <p>&copy; {new Date().getFullYear()} DuoTrak. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;
