'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { setAuthCookie } from '@/lib/auth';

// A self-contained auth form for the modal
const AuthForm = ({ isLogin }: { isLogin: boolean }) => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthCookie();
    router.push('/dashboard');
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {!isLogin && <Input type="text" placeholder="Full Name" required />}
      <Input type="email" placeholder="Email Address" required />
      <Input type="password" placeholder="Password" required />
      <Button type="submit" className="w-full">
        {isLogin ? 'Log In & Accept' : 'Sign Up & Accept'}
      </Button>
    </form>
  );
};

export default function InviteAcceptancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const openModal = (login: boolean) => {
    setIsLogin(login);
    setIsModalOpen(true);
  };

  const handleAccept = () => {
    openModal(false);
  };

  return (
    <div className="text-center animate-fadeInUp">
      <div className="w-24 h-24 bg-accent-light-blue rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">💌</div>
      <h1 className="text-2xl font-bold text-charcoal mb-2">You're Invited!</h1>
      <p className="text-base text-stone-gray mb-8">Chris wants to team up with you on DuoTrak.</p>

      <div className="mx-auto max-w-lg space-y-4">
        <Button onClick={handleAccept} className="w-full">Accept & Sign Up</Button>
        <Button onClick={() => openModal(true)} variant="secondary" className="w-full">I Already Have an Account</Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-4">
          <h2 className="text-xl font-bold text-charcoal mb-4 text-center">
            {isLogin ? 'Log In to Join' : 'Create an Account to Join'}
          </h2>
          <AuthForm isLogin={isLogin} />
        </div>
      </Modal>
    </div>
  );
}
