import React from 'react';
import Footer from '@/components/layout/Footer';
import { FileText, User, Copyright, Ban, XCircle, Mail } from 'lucide-react';

const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
    <h2 className="flex items-center text-2xl font-bold text-gray-900 dark:text-white mb-4">
      {icon}
      {title}
    </h2>
    <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
      {children}
    </div>
  </div>
);

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          <Section title="Introduction" icon={<FileText className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>Welcome to DuoTrak! These Terms of Service govern your use of our application and services. By using DuoTrak, you agree to these terms in full. If you disagree with these terms or any part of these terms, you must not use our application.</p>
          </Section>

          <Section title="User Accounts" icon={<User className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
          </Section>

          <Section title="Content Ownership" icon={<Copyright className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>You retain ownership of all content you submit, post, or display on or through the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content in any and all media or distribution methods.</p>
          </Section>

          <Section title="Prohibited Activities" icon={<Ban className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>You agree not to engage in any of the following prohibited activities: (i) copying, distributing, or disclosing any part of the Service in any medium; (ii) using any automated system to access the Service; (iii) transmitting spam, chain letters, or other unsolicited email.</p>
          </Section>

          <Section title="Termination" icon={<XCircle className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </Section>
          
          <Section title="Contact Us" icon={<Mail className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@duotrak.com" className="text-primary-blue hover:underline">support@duotrak.com</a>.</p>
          </Section>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default TermsPage;
