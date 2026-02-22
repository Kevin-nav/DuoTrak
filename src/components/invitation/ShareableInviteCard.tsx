'use client';

import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Target, Heart, Sparkles, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInviteHostLabel } from '@/lib/invites/url';

interface GoalDraft {
    title: string;
    description: string;
    category: string;
}

interface ShareableInviteCardProps {
    inviterName: string;
    inviterAvatar?: string;
    invitationLink: string;
    goalDrafts?: GoalDraft[];
    variant?: 'square' | 'story' | 'wide';
}

const categoryIcons: { [key: string]: React.ElementType } = {
    health: Target,
    fitness: Target,
    learning: Sparkles,
    relationship: Heart,
    career: Sparkles,
    home: Heart,
    creative: Sparkles,
};

const categoryColors: { [key: string]: string } = {
    health: 'text-red-500',
    fitness: 'text-red-500',
    learning: 'text-blue-500',
    relationship: 'text-pink-500',
    career: 'text-purple-500',
    home: 'text-green-500',
    creative: 'text-orange-500',
};

const getInitials = (name: string): string => {
    if (!name) return '?';
    return name
        .split(' ')
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase();
};

const ShareableInviteCard = forwardRef<HTMLDivElement, ShareableInviteCardProps>(
    ({ inviterName, inviterAvatar, invitationLink, goalDrafts = [], variant = 'square' }, ref) => {
        const displayGoals = goalDrafts.slice(0, 2);

        // Variant-specific styling
        const variantStyles = {
            square: 'w-[400px] h-[400px]',
            story: 'w-[360px] h-[640px]',
            wide: 'w-[600px] h-[315px]',
        };

        const isStory = variant === 'story';

        return (
            <div
                ref={ref}
                className={`${variantStyles[variant]} relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-1`}
            >
                {/* Inner card */}
                <div className="h-full w-full rounded-[22px] bg-white p-6 flex flex-col">
                    {/* Header with branding */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-gray-900">DuoTrak</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Partner Invite
                        </span>
                    </div>

                    {/* Main content */}
                    <div className={`flex-1 flex ${isStory ? 'flex-col' : 'flex-row'} items-center gap-6`}>
                        {/* Inviter info */}
                        <div className={`${isStory ? 'text-center' : 'text-left'} ${isStory ? '' : 'flex-1'}`}>
                            <Avatar className="w-20 h-20 mx-auto mb-3 ring-4 ring-purple-100 shadow-lg">
                                <AvatarImage src={inviterAvatar} alt={inviterName} />
                                <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xl font-bold">
                                    {getInitials(inviterName)}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">{inviterName}</h2>
                            <p className="text-sm text-gray-600 mb-4">wants to achieve goals with you!</p>

                            {/* Goal previews */}
                            {displayGoals.length > 0 && (
                                <div className={`space-y-2 ${isStory ? 'mb-6' : ''}`}>
                                    {displayGoals.map((goal, index) => {
                                        const Icon = categoryIcons[goal.category] || Target;
                                        const color = categoryColors[goal.category] || 'text-blue-500';
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                                            >
                                                <Icon className={`w-4 h-4 ${color}`} />
                                                <span className="text-sm font-medium text-gray-800 truncate">
                                                    {goal.title}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* QR Code section */}
                        <div className={`${isStory ? 'mt-auto' : ''} flex flex-col items-center`}>
                            <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
                                <QRCodeSVG
                                    value={invitationLink}
                                    size={isStory ? 120 : 100}
                                    level="M"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#4f46e5"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">Scan to join</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Free forever
                            </span>
                            <span>🔥 Partner streaks</span>
                        </div>
                        <span className="text-xs font-medium text-purple-600">{getInviteHostLabel()}</span>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>
        );
    }
);

ShareableInviteCard.displayName = 'ShareableInviteCard';

export default ShareableInviteCard;
