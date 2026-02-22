"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import {
  Clock,
  Users,
  Target,
  Share2,
  Copy,
  Lightbulb,
  Heart,
  Trophy,
  CheckCircle,
  Plus,
  X,
  Sparkles,
  Bell,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useInvitation } from "@/contexts/invitation-context"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { differenceInHours } from 'date-fns';
import SocialShareDrawer from "@/components/invitation/SocialShareDrawer"
import { useUser } from "@/contexts/UserContext"

const successTips = [
  {
    icon: Target,
    title: "Start Small",
    description: "Begin with achievable goals to build momentum and confidence together.",
  },
  {
    icon: Heart,
    title: "Celebrate Together",
    description: "Acknowledge every win, no matter how small. Celebration strengthens bonds.",
  },
  {
    icon: Users,
    title: "Communicate Openly",
    description: "Share your struggles and victories. Transparency builds trust and support.",
  },
  {
    icon: Trophy,
    title: "Stay Consistent",
    description: "Small daily actions compound into remarkable results over time.",
  },
  {
    icon: Sparkles,
    title: "Make it Fun",
    description: "Add playfulness to your goals. Enjoyment increases long-term commitment.",
  },
]

const goalCategories = [
  { id: "health", label: "Health & Fitness", icon: "💪", color: "bg-red-100 text-red-700" },
  { id: "relationship", label: "Relationship", icon: "❤️", color: "bg-pink-100 text-pink-700" },
  { id: "learning", label: "Learning", icon: "📚", color: "bg-blue-100 text-blue-700" },
  { id: "career", label: "Career", icon: "💼", color: "bg-purple-100 text-purple-700" },
  { id: "home", label: "Home & Life", icon: "🏠", color: "bg-green-100 text-green-700" },
  { id: "creative", label: "Creative", icon: "🎨", color: "bg-yellow-100 text-yellow-700" },
]

export default function InteractiveWaitingRoom() {
  const { invitationToken, goalDrafts, addGoalDraft, removeGoalDraft } = useInvitation()
  const router = useRouter()

  const [currentTip, setCurrentTip] = useState(0)
  const [showGoalDraft, setShowGoalDraft] = useState(false)
  const [invitationLink, setInvitationLink] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [isNudging, setIsNudging] = useState(false);
  const [showShareDrawer, setShowShareDrawer] = useState(false);
  const { userDetails } = useUser();

  // Goal draft form
  const [goalDraft, setGoalDraft] = useState({
    title: "",
    description: "",
    category: "health",
    frequency: "daily",
  })

  // Use Convex query for pending invitation status
  const invitation = useQuery(api.invitations.getPendingSentInvitation);

  useEffect(() => {
    if (invitation?.token) {
      setInvitationLink(`https://duotrak.org/invite/${invitation.token}`)
    }
  }, [invitation]);

  const [timeRemaining, setTimeRemaining] = useState("");

  // Derive partner status from the invitation data
  // Logic: 
  // - If invitation exists and status is 'pending' -> check if viewed_at is set
  // - If invitation is gone or status is 'accepted' -> completed
  const partnerStatus = useMemo(() => {
    if (!invitation) return "loading";

    if (invitation.status === 'accepted') return "completed";

    // If we have an invitation and it's pending
    if (invitation.status === 'pending') {
      if (invitation.viewedAt) return "viewing";
      return "not-viewed";
    }

    return "not-viewed";
  }, [invitation]);


  const canNudge = useMemo(() => {
    if (!invitation?.lastNudgedAt) return true;
    const hoursSinceLastNudge = differenceInHours(new Date(), new Date(invitation.lastNudgedAt));
    return hoursSinceLastNudge >= 24;
  }, [invitation?.lastNudgedAt]);

  useEffect(() => {
    if (invitation?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(invitation.expiresAt!).getTime();
        const distance = expiry - now;

        if (distance < 0) {
          clearInterval(interval);
          setTimeRemaining("Expired");
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [invitation]);

  useEffect(() => {
    if (userDetails?.partnership_status === 'active' || invitation?.status === 'accepted') {
      toast.success("Your partner has accepted the invitation! Redirecting...")
      router.push('/dashboard')
    }
  }, [userDetails?.partnership_status, invitation?.status, router])

  // Rotate tips every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % successTips.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleNudge = async () => {
    if (!invitation?.id || !canNudge) return;
    setIsNudging(true);
    try {
      // Still using API client for nudge as it triggers emails/notifications
      // We could move this to a Convex action later
      await apiClient.nudgePartner(invitation.id as unknown as string);
      toast.success("Reminder sent!", { description: "Your partner has been gently nudged." });
    } catch (error: any) {
      toast.error("Failed to send nudge", { description: error.message });
    } finally {
      setIsNudging(false);
    }
  };

  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const handleSaveGoalDraft = () => {
    if (goalDraft.title.trim() && goalDraft.description.trim()) {
      addGoalDraft(goalDraft)
      setGoalDraft({ title: "", description: "", category: "health", frequency: "daily" })
      setShowGoalDraft(false)
    }
  }

  const getStatusMessage = () => {
    switch (partnerStatus) {
      case "not-viewed":
        return "Waiting for your partner to view the invitation..."
      case "viewing":
        return "🎉 Your partner is viewing the invitation!"
      case "completed":
        return "🚀 Your partner has joined! Redirecting..."
      default:
        return "Waiting for your partner..."
    }
  }

  const getStatusColor = () => {
    switch (partnerStatus) {
      case "not-viewed":
        return "text-gray-600"
      case "viewing":
        return "text-blue-600"
      case "completed":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-landing-clay/70 bg-landing-cream/60 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-landing-terracotta text-white">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-landing-espresso">Waiting for your partner</h2>
          <p className="text-sm text-landing-espresso-light">Your invitation is sent. You can prep while they accept.</p>
        </div>
      </div>

        {/* Status Card */}
        <Card className="border-landing-clay/70 bg-white">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex items-center justify-center w-10 h-10">
                  <div
                    className={`w-4 h-4 rounded-full ${partnerStatus === "not-viewed"
                      ? "bg-gray-400"
                      : partnerStatus === "viewing"
                        ? "bg-blue-500 animate-pulse"
                        : "bg-green-500"
                      }`}
                  />
                  {partnerStatus !== "not-viewed" && partnerStatus !== "loading" && (
                    <div
                      className={`absolute w-4 h-4 rounded-full animate-ping ${partnerStatus === "viewing"
                        ? "bg-blue-400"
                        : "bg-green-400"
                        }`}
                    />
                  )}
                </div>
                <div>
                  <p className={`font-medium ${getStatusColor()}`}>{getStatusMessage()}</p>
                  <p className="text-sm text-landing-espresso-light">Invitation expires in: {timeRemaining}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-landing-espresso">{timeRemaining.split(' ')[0]}</p>
                <p className="text-sm text-landing-espresso-light">{timeRemaining.split(' ')[1] || '...'}</p>
              </div>

              <div className="flex-grow flex justify-end">
                <Button onClick={handleNudge} disabled={isNudging || !canNudge || partnerStatus === 'completed'}>
                  {isNudging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                  {canNudge ? 'Send a Reminder' : 'Reminder Sent'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Success Tips */}
            <Card className="border-landing-clay/70">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span>Success Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTip}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-landing-terracotta">
                        {(() => {
                          const Icon = successTips[currentTip].icon;
                          return <Icon className="w-5 h-5 text-white" />;
                        })()}
                      </div>
                            <h3 className="font-semibold text-landing-espresso">{successTips[currentTip].title}</h3>
                    </div>
                    <p className="ml-13 text-landing-espresso-light">{successTips[currentTip].description}</p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center mt-4 space-x-1">
                  {successTips.map((_, index) => (
                    <div
                      key={index}
                        className={`h-2 w-2 rounded-full transition-colors ${index === currentTip ? "bg-landing-terracotta" : "bg-landing-clay"
                        }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Goal Drafts */}
            <Card className="border-landing-clay/70">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <span>Goal Drafts</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowGoalDraft(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Draft
                  </Button>
                </div>
                <p className="text-xs text-gray-500 pt-1 italic">Your partner will see these drafts and can choose one to start with.</p>
              </CardHeader>
              <CardContent>
                {goalDrafts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No goal drafts yet</p>
                    <p className="text-sm">Start planning your first shared goal!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goalDrafts.map((draft, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{draft.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{draft.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {goalCategories.find((c) => c.id === draft.category)?.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {draft.frequency}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeGoalDraft(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Share Invitation */}
            <Card className="border-2 border-dashed border-landing-clay bg-landing-cream/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="w-5 h-5 text-purple-500" />
                  <span>Share Invitation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Create beautiful shareable cards with QR codes for WhatsApp, Instagram, Snapchat, and more!
                </p>

                <Button
                  onClick={() => setShowShareDrawer(true)}
                    className="w-full bg-landing-espresso text-landing-cream hover:bg-landing-terracotta"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share with Friends
                </Button>

                <div className="flex space-x-2">
                  <Input value={invitationLink} readOnly className="flex-1 text-xs" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyInvitationLink}
                    className={linkCopied ? "bg-green-50 border-green-200" : ""}
                  >
                    {linkCopied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Partnership Stats */}
            <Card className="border-landing-clay/70">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Partnership Benefits</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">65%</p>
                    <p className="text-xs text-gray-600">Higher Success Rate</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">3x</p>
                    <p className="text-xs text-gray-600">More Motivation</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">89%</p>
                    <p className="text-xs text-gray-600">Stay Consistent</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <p className="text-2xl font-bold text-pink-600">2x</p>
                    <p className="text-xs text-gray-600">Faster Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Goal Draft Modal */}
        <AnimatePresence>
          {showGoalDraft && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowGoalDraft(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Draft a Goal</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowGoalDraft(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                    <Input
                      value={goalDraft.title}
                      onChange={(e) => setGoalDraft((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="What do you want to achieve?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <Textarea
                      value={goalDraft.description}
                      onChange={(e) => setGoalDraft((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Why is this goal important?"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {goalCategories.map((category) => (
                        <Button
                          key={category.id}
                          variant={goalDraft.category === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGoalDraft((prev) => ({ ...prev, category: category.id }))}
                          className="justify-start"
                        >
                          <span className="mr-2">{category.icon}</span>
                          <span className="text-xs">{category.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowGoalDraft(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveGoalDraft}
                      disabled={!goalDraft.title.trim() || !goalDraft.description.trim()}
                    >
                      Save Draft
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Share Drawer */}
        <SocialShareDrawer
          isOpen={showShareDrawer}
          onClose={() => setShowShareDrawer(false)}
          inviterName={userDetails?.full_name || 'Your friend'}
          inviterAvatar={userDetails?.profile_picture_url ?? undefined}
          invitationLink={invitationLink}
          goalDrafts={goalDrafts}
        />
    </div>
  )
}
