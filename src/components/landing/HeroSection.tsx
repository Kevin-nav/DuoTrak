'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import HeroIllustration from './HeroIllustration';

export default function HeroSection() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
        <div className="mr-auto place-self-center lg:col-span-7">
          <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            Welcome to <span className="text-primary-blue">DuoTrak</span>
          </h1>
          <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
            Your Ambition, Amplified. DuoTrak is a dedicated success system that transforms solitary goals into a shared, unstoppable mission with a dedicated accountability partner.
          </p>
          <div className="flex items-center space-x-4">
            <Link href="/signup">
              <Button size="lg" className="bg-primary-blue text-white hover:bg-primary-blue/90">
                Get Started for Free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
        <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
