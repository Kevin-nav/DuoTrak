"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MoreVertical } from "lucide-react";

interface ChatHeaderProps {
    partnerName: string;
    partnerAvatar?: string;
    partnerInitials?: string;
    isOnline?: boolean;
    isTyping?: boolean;
    lastSeen?: Date;
    onClose?: () => void;
    onMenu?: () => void;
}

export default function ChatHeader({
    partnerName,
    partnerAvatar,
    partnerInitials,
    isOnline = false,
    isTyping = false,
    lastSeen,
    onClose,
    onMenu,
}: ChatHeaderProps) {
    // Format last seen
    const getStatusText = () => {
        if (isTyping) return "typing...";
        if (isOnline) return "online";
        if (lastSeen) {
            const distance = formatDistanceToNow(lastSeen, { addSuffix: true });
            return `last seen ${distance}`;
        }
        return "offline";
    };

    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-landing-cream border-b border-landing-clay flex-shrink-0">
            {/* Back button (mobile) */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1.5 -ml-1.5 text-landing-espresso-light hover:text-landing-espresso hover:bg-white rounded-full transition-colors sm:hidden"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
            )}

            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {partnerAvatar ? (
                    <img
                        src={partnerAvatar}
                        alt={partnerName}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-landing-terracotta to-landing-espresso-light rounded-full flex items-center justify-center text-white font-semibold">
                        {partnerInitials || partnerName.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Online indicator */}
                <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-landing-cream ${isOnline ? "bg-landing-sage" : "bg-landing-espresso-light/50"
                        }`}
                />
            </div>

            {/* Name and status */}
            <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-landing-espresso truncate">
                    {partnerName}
                </h2>
                <p
                    className={`text-xs truncate ${isTyping
                            ? "text-landing-sage"
                            : isOnline
                                ? "text-landing-sage"
                                : "text-landing-espresso-light"
                        }`}
                >
                    {getStatusText()}
                </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
                {/* Menu */}
                {onMenu && (
                    <button
                        onClick={onMenu}
                        className="p-2 text-landing-espresso-light hover:text-landing-espresso hover:bg-white rounded-full transition-colors"
                    >
                        <MoreVertical className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
