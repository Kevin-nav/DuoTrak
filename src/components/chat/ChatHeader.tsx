"use client";

import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";

interface ChatHeaderProps {
    partnerName: string;
    partnerAvatar?: string;
    partnerInitials?: string;
    isOnline?: boolean;
    isTyping?: boolean;
    lastSeen?: Date;
    onClose?: () => void;
    onCall?: () => void;
    onVideoCall?: () => void;
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
    onCall,
    onVideoCall,
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
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            {/* Back button (mobile) */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors sm:hidden"
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
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {partnerInitials || partnerName.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Online indicator */}
                <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                />
            </div>

            {/* Name and status */}
            <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                    {partnerName}
                </h2>
                <p
                    className={`text-xs truncate ${isTyping
                            ? "text-green-500 dark:text-green-400"
                            : isOnline
                                ? "text-green-500 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                        }`}
                >
                    {getStatusText()}
                </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
                {/* Voice call - future feature */}
                {onCall && (
                    <button
                        onClick={onCall}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    >
                        <Phone className="h-5 w-5" />
                    </button>
                )}

                {/* Video call - future feature */}
                {onVideoCall && (
                    <button
                        onClick={onVideoCall}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    >
                        <Video className="h-5 w-5" />
                    </button>
                )}

                {/* Menu */}
                {onMenu && (
                    <button
                        onClick={onMenu}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <MoreVertical className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
