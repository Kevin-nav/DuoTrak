'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex h-full flex-col justify-between rounded-2xl border border-landing-clay/50 bg-white p-5 shadow-sm transition-all duration-300 hover:border-landing-terracotta/40 hover:bg-landing-cream sm:p-7">
      <div>
        <h3 className="mb-3 text-lg font-bold uppercase tracking-widest text-landing-espresso transition-colors group-hover:text-landing-terracotta sm:text-xl">
          {title}
        </h3>
        <p className="text-landing-espresso-light font-medium mb-8">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-6 border-t border-landing-clay/40">
        <span className="font-mono text-xs text-landing-espresso sm:text-sm">{email}</span>
        <button
          onClick={handleCopy}
          className="bg-landing-sand text-landing-espresso hover:bg-landing-terracotta hover:text-white p-3 transition-colors duration-300 rounded-sm"
          aria-label="Copy email"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-4 right-4 bg-landing-sage text-white text-xs font-bold px-2 py-1 uppercase tracking-widest rounded-sm"
        >
          Copied!
        </motion.div>
      )}
    </div>
  );
};

export default function ContactSection() {
  const contactDetails: ContactCardProps[] = [
    {
      title: 'Support',
      description: 'Have a question or running into an issue? We\'re happy to help.',
      email: 'info@duotrak.org',
    },
    {
      title: 'Partnerships',
      description: 'Interested in working together or integrating with DuoTrak? Let\'s talk.',
      email: 'admin@duotrak.org',
    },
    {
      title: 'Say Hello',
      description: 'Just want to chat, give feedback, or share your DuoTrak story? We\'d love to hear from you.',
      email: 'charlene@duotrak.org',
    },
  ];

  return (
    <section id="contact" className="relative border-t border-landing-clay bg-white py-20 sm:py-24 md:py-28">
      <div className="absolute top-0 right-0 w-[30vw] h-[30vw] bg-landing-terracotta/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 border-l-4 border-landing-terracotta pl-4 sm:mb-14 sm:pl-6 md:mb-16 md:pl-10"
        >
          <h2 className="text-3xl font-black uppercase tracking-tighter text-landing-espresso sm:text-4xl md:text-6xl">Get in Touch</h2>
          <p className="mt-3 max-w-xl text-base font-medium text-landing-espresso-light sm:mt-4 sm:text-lg">
            Questions? Feedback? We&apos;re real people and we&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
          {contactDetails.map((contact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ContactCard {...contact} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
