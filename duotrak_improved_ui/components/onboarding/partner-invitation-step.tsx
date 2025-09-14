"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Users, Eye, Heart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface PartnerInvitationStepProps {
  data: {
    partnerEmail: string
    partnerName: string
  }
  updateData: (updates: any) => void
  onValidationChange: (isValid: boolean) => void
}

export default function PartnerInvitationStep({ data, updateData, onValidationChange }: PartnerInvitationStepProps) {
  const [partnerEmail, setPartnerEmail] = useState(data.partnerEmail || "")
  const [partnerName, setPartnerName] = useState(data.partnerName || "")
  const [customMessage, setCustomMessage] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [invitationSent, setInvitationSent] = useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const defaultMessage = `Hi ${partnerName || "there"}! 

I've started using DuoTrak to work on goals, and I'd love for you to be my accountability partner!

DuoTrak helps us support each other, track progress, and celebrate wins along the way.

Would you like to join me? 

Looking forward to achieving great things together! ❤️`

  useEffect(() => {
    const emailValid = validateEmail(partnerEmail)
    const nameValid = partnerName.trim().length >= 2
    setIsValidEmail(emailValid)
    onValidationChange(emailValid && nameValid)
  }, [partnerEmail, partnerName, onValidationChange])

  useEffect(() => {
    updateData({ partnerEmail, partnerName })
  }, [partnerEmail, partnerName, updateData])

  const handleSendInvitation = async () => {
    // Simulate sending invitation
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setInvitationSent(true)
    onValidationChange(true)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <Users className="w-8 h-8 text-blue-500" />
          <h2 className="text-3xl font-bold text-gray-900">Invite Your Partner</h2>
        </div>
        <p className="text-lg text-gray-600">
          DuoTrak requires a partner because shared accountability is the key to success.
          <br />
          Choose someone you trust who will support your journey.
        </p>
      </motion.div>

      {!invitationSent ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partner's Name *</label>
              <Input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="e.g., Alex" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partner's Email *</label>
              <Input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="alex@example.com"
                className={!isValidEmail && partnerEmail ? "border-red-300" : ""}
              />
              {!isValidEmail && partnerEmail && (
                <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personal Message (Optional)</label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal touch to your invitation..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank to use our default invitation message</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {showPreview ? "Hide Preview" : "Preview Email"}
            </Button>

            {isValidEmail && partnerName && (
              <Button
                onClick={handleSendInvitation}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Send Invitation
              </Button>
            )}
          </div>

          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    <span className="font-semibold">DuoTrak Invitation</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">You're invited to join DuoTrak!</h3>
                  <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed mb-6">
                    {customMessage || defaultMessage}
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    Accept Invitation & Join DuoTrak
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 rounded-xl p-6 border border-green-200 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Heart className="w-8 h-8 text-green-500" />
          </motion.div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">Invitation Sent!</h3>
          <p className="text-gray-600 mb-4">
            We've sent an invitation to <strong>{partnerName}</strong> at {partnerEmail}.
            <br />
            They'll receive an email with instructions to join you on DuoTrak.
          </p>

          <div className="bg-white rounded-lg p-4 mb-4 text-left">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              What happens next?
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">1.</span>
                {partnerName} will receive your invitation email
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">2.</span>
                Once they accept, you'll be connected as accountability partners
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">3.</span>
                You can then start creating and sharing goals together
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            Let's continue setting up your account while we wait for {partnerName} to join!
          </p>
        </motion.div>
      )}
    </div>
  )
}
