'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MailIcon, CopyIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

interface ContactCardProps {
  title: string;
  email: string;
  description: string;
}

const ContactCard: React.FC<ContactCardProps> = ({ title, email, description }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="relative group p-6 border rounded-lg bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-primary-blue/10 rounded-full mb-4">
          <MailIcon className="w-6 h-6 text-primary-blue" />
        </div>
        <h3 className="text-xl font-semibold text-charcoal mb-2">{title}</h3>
        <p className="text-slate-500 mb-4">{description}</p>
        <p className="text-primary-blue font-mono text-sm">{email}</p>
      </div>
      <motion.div
        className="absolute inset-0 bg-black/50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button onClick={handleCopy} variant="secondary" size="sm">
          <CopyIcon className="w-4 h-4 mr-2" />
          {copied ? 'Copied!' : 'Copy Email'}
        </Button>
      </motion.div>
    </div>
  );
};

export default function ContactSection() {
  const contactDetails: ContactCardProps[] = [
    {
      title: 'General Inquiry',
      description: 'For all general questions about DuoTrak, we are here to help.',
      email: 'info@duotrak.org',
    },
    {
      title: 'Admin & High-Level Support',
      description: 'For direct contact with the DuoTrak administration for serious matters.',
      email: 'admin@duotrak.org',
    },
    {
      title: 'Personal Support - Charlene',
      description: 'For specific support cases, you can reach out to Charlene directly.',
      email: 'charlene@duotrak.org',
    },
  ];

  return (
    <section id="contact" className="py-20 bg-slate-100">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold text-charcoal mb-4">Get in Touch</h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-12">
          Have questions or feedback? We'd love to hear from you. Reach out to the right team below.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contactDetails.map((contact, index) => (
            <ContactCard key={index} {...contact} />
          ))}
        </div>
      </div>
    </section>
  );
}
