import React from 'react';
import Footer from '@/components/layout/Footer';
import { Shield, Database, Cog, Lock, CheckSquare, Mail } from 'lucide-react';

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

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          <Section title="Introduction" icon={<Shield className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>Your privacy is important to us. It is DuoTrak's policy to respect your privacy regarding any information we may collect from you across our application.</p>
          </Section>

          <Section title="Information We Collect" icon={<Database className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
          </Section>

          <Section title="How We Use Your Information" icon={<Cog className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>We use the information we collect to operate, maintain, and provide you the features and functionality of the Service, as well as to communicate directly with you, such as to send you email messages.</p>
          </Section>

          <Section title="Data Security" icon={<Lock className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>We take the security of your data seriously and use commercially acceptable means to protect your personal information. However, no method of transmission over the internet or method of electronic storage is 100% secure.</p>
          </Section>

          <Section title="Your Rights and Choices" icon={<CheckSquare className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services. You have the right to access, update, or delete the information we have on you.</p>
          </Section>

          <Section title="Contact Us" icon={<Mail className="w-6 h-6 mr-3 text-primary-blue" />}>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@duotrak.com" className="text-primary-blue hover:underline">support@duotrak.com</a>.</p>
          </Section>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
