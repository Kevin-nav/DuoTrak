'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
    Share2,
    Copy,
    Download,
    MessageCircle,
    Mail,
    X,
    Check,
    Instagram,
    Twitter,
    Facebook,
    QrCode,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ShareableInviteCard from './ShareableInviteCard';

interface GoalDraft {
    title: string;
    description: string;
    category: string;
}

interface SocialShareDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    inviterName: string;
    inviterAvatar?: string;
    invitationLink: string;
    goalDrafts?: GoalDraft[];
}

// Platform share configurations
const SHARE_PLATFORMS = [
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: MessageCircle,
        color: 'bg-green-500 hover:bg-green-600',
        action: 'share',
    },
    {
        id: 'instagram',
        name: 'Instagram',
        icon: Instagram,
        color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90',
        action: 'download', // Instagram requires saving image first
    },
    {
        id: 'snapchat',
        name: 'Snapchat',
        icon: QrCode, // Using QrCode as placeholder
        color: 'bg-yellow-400 hover:bg-yellow-500',
        action: 'download',
    },
    {
        id: 'twitter',
        name: 'Twitter/X',
        icon: Twitter,
        color: 'bg-black hover:bg-gray-800',
        action: 'share',
    },
    {
        id: 'facebook',
        name: 'Messenger',
        icon: Facebook,
        color: 'bg-blue-600 hover:bg-blue-700',
        action: 'share',
    },
    {
        id: 'sms',
        name: 'iMessage/SMS',
        icon: MessageCircle,
        color: 'bg-green-600 hover:bg-green-700',
        action: 'share',
    },
];

export default function SocialShareDrawer({
    isOpen,
    onClose,
    inviterName,
    inviterAvatar,
    invitationLink,
    goalDrafts = [],
}: SocialShareDrawerProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [cardVariant, setCardVariant] = useState<'square' | 'story' | 'wide'>('square');

    const shareMessage = `Hey! I want to achieve some goals together on DuoTrak. Let's hold each other accountable! 🎯🔥`;

    const generateCardImage = useCallback(async (): Promise<string | null> => {
        if (!cardRef.current) return null;

        setIsGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                quality: 0.95,
                pixelRatio: 2,
                cacheBust: true,
            });
            return dataUrl;
        } catch (error) {
            console.error('Failed to generate card image:', error);
            toast.error('Failed to generate image');
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const downloadCard = useCallback(async () => {
        const dataUrl = await generateCardImage();
        if (!dataUrl) return;

        const link = document.createElement('a');
        link.download = `duotrak-invite-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        toast.success('Card downloaded!', { description: 'Share it on your favorite platform' });
    }, [generateCardImage]);

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(invitationLink);
            setLinkCopied(true);
            toast.success('Link copied!');
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy link');
        }
    }, [invitationLink]);

    const handleShare = useCallback(
        async (platformId: string) => {
            const encodedMessage = encodeURIComponent(shareMessage);
            const encodedLink = encodeURIComponent(invitationLink);

            switch (platformId) {
                case 'whatsapp':
                    window.open(
                        `https://wa.me/?text=${encodedMessage}%20${encodedLink}`,
                        '_blank'
                    );
                    break;
                case 'twitter':
                    window.open(
                        `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
                        '_blank'
                    );
                    break;
                case 'facebook':
                    window.open(
                        `https://www.facebook.com/dialog/send?link=${encodedLink}&app_id=YOUR_APP_ID&redirect_uri=${encodedLink}`,
                        '_blank'
                    );
                    break;
                case 'sms':
                    window.open(`sms:?body=${encodedMessage}%20${encodedLink}`);
                    break;
                case 'instagram':
                case 'snapchat':
                    await downloadCard();
                    toast.info('Card downloaded!', {
                        description: 'Now share it to your Instagram/Snapchat story',
                    });
                    break;
                default:
                    await copyLink();
            }
        },
        [invitationLink, shareMessage, downloadCard, copyLink]
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            {/* Handle bar */}
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Share Invitation</h2>
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Card Preview */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700">Preview Card</span>
                                    <div className="flex gap-2">
                                        {(['square', 'story', 'wide'] as const).map((v) => (
                                            <button
                                                key={v}
                                                onClick={() => setCardVariant(v)}
                                                className={`px-3 py-1 text-xs rounded-full transition-colors ${cardVariant === v
                                                        ? 'bg-purple-100 text-purple-700 font-medium'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {v.charAt(0).toUpperCase() + v.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-center overflow-x-auto py-4">
                                    <div className="transform scale-[0.6] origin-top">
                                        <ShareableInviteCard
                                            ref={cardRef}
                                            inviterName={inviterName}
                                            inviterAvatar={inviterAvatar}
                                            invitationLink={invitationLink}
                                            goalDrafts={goalDrafts}
                                            variant={cardVariant}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <Button
                                    variant="outline"
                                    onClick={copyLink}
                                    className="h-12 flex items-center gap-2"
                                >
                                    {linkCopied ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    {linkCopied ? 'Copied!' : 'Copy Link'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={downloadCard}
                                    disabled={isGenerating}
                                    className="h-12 flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    Download Card
                                </Button>
                            </div>

                            {/* Share Platforms */}
                            <div className="mb-6">
                                <span className="text-sm font-medium text-gray-700 mb-3 block">
                                    Share on
                                </span>
                                <div className="grid grid-cols-3 gap-3">
                                    {SHARE_PLATFORMS.map((platform) => (
                                        <motion.button
                                            key={platform.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleShare(platform.id)}
                                            className={`${platform.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all`}
                                        >
                                            <platform.icon className="w-6 h-6" />
                                            <span className="text-xs font-medium">{platform.name}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Email option */}
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    const subject = encodeURIComponent("Let's achieve goals together on DuoTrak!");
                                    const body = encodeURIComponent(
                                        `${shareMessage}\n\nJoin me here: ${invitationLink}`
                                    );
                                    window.open(`mailto:?subject=${subject}&body=${body}`);
                                }}
                                className="w-full h-12 flex items-center justify-center gap-2 text-gray-600"
                            >
                                <Mail className="w-4 h-4" />
                                Send via Email
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
