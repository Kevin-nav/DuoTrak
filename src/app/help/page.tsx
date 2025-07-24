import React from 'react';
import Footer from '@/components/layout/Footer';
import { Info, HelpCircle, BookOpen, Mail, ChevronDown } from 'lucide-react';

const FaqItem = ({ question, children }: { question: string, children: React.ReactNode }) => (
  <details className="group bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg cursor-pointer">
    <summary className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-200">
      {question}
      <ChevronDown className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
    </summary>
    <div className="mt-3 text-gray-600 dark:text-gray-400">
      {children}
    </div>
  </details>
);

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">How can we help?</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Your guide to getting the most out of DuoTrak.</p>
        </div>
        
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
            <h2 className="flex items-center text-2xl font-bold text-gray-900 dark:text-white mb-4">
              <Info className="w-6 h-6 mr-3 text-primary-blue" />
              About DuoTrak
            </h2>
            <p className="text-gray-600 dark:text-gray-300">DuoTrak is a collaborative goal-tracking application designed to help partners stay aligned and motivated. By sharing progress and celebrating milestones together, you and your partner can achieve your goals more effectively.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
            <h2 className="flex items-center text-2xl font-bold text-gray-900 dark:text-white mb-4">
              <BookOpen className="w-6 h-6 mr-3 text-primary-blue" />
              How to Use DuoTrak
            </h2>
            <p className="text-gray-600 dark:text-gray-300">Getting started is simple. Invite your partner, set your shared goals, and begin tracking your progress. Update your tasks, leave encouraging notes, and watch your collective progress grow. The dashboard gives you a clear overview of where you both stand.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
            <h2 className="flex items-center text-2xl font-bold text-gray-900 dark:text-white mb-4">
              <HelpCircle className="w-6 h-6 mr-3 text-primary-blue" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <FaqItem question="Can I use DuoTrak by myself?">
                <p>DuoTrak is designed for partners, but you can use it solo by not inviting a partner. However, the core experience is built around collaboration.</p>
              </FaqItem>
              <FaqItem question="How do I invite a partner?">
                <p>Navigate to the 'Partner' page from the main navigation. You will find an option to send an invitation to your partner's email address.</p>
              </FaqItem>
            </div>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-white mb-3">
              <Mail className="w-6 h-6 mr-3 text-primary-blue" />
              Still have questions?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">We're here to help! Please feel free to reach out to our support team.</p>
            <a href="mailto:support@duotrak.com" className="inline-block bg-primary-blue text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300">
              Contact Support
            </a>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default HelpPage;
