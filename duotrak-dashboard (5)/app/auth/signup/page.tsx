"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface InvitationContext {
  inviterName: string
  inviterAvatar?: string
  goalTitle?: string
}

// Safe string utility functions
const safeString = (value: any): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  return String(value)
}

const getInitials = (name: any): string => {
  try {
    const safeName = safeString(name).trim()
    if (!safeName) return "?"

    const words = safeName.split(/\s+/).filter((word) => word.length > 0)
    if (words.length === 0) return "?"

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
  } catch (error) {
    console.error("Error generating initials:", error)
    return "?"
  }
}

const validateEmail = (email: string): boolean => {
  try {
    const safeEmail = safeString(email).trim()
    if (!safeEmail) return false

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(safeEmail)
  } catch (error) {
    console.error("Error validating email:", error)
    return false
  }
}

const calculatePasswordStrength = (password: string): number => {
  try {
    const safePassword = safeString(password)
    if (!safePassword) return 0

    let strength = 0
    if (safePassword.length >= 8) strength += 25
    if (/[A-Z]/.test(safePassword)) strength += 25
    if (/[0-9]/.test(safePassword)) strength += 25
    if (/[^A-Za-z0-9]/.test(safePassword)) strength += 25
    return strength
  } catch (error) {
    console.error("Error calculating password strength:", error)
    return 0
  }
}

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams.get("invitation")

  const [invitationContext, setInvitationContext] = useState<InvitationContext | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => {
    // Load invitation context if coming from invitation
    if (invitationToken) {
      try {
        const storedData = sessionStorage.getItem("invitation_data")
        if (storedData) {
          const data = JSON.parse(storedData)
          setInvitationContext({
            inviterName: safeString(data.inviterName) || "Someone",
            inviterAvatar: safeString(data.inviterAvatar),
            goalTitle: safeString(data.goalTitle),
          })
        }
      } catch (error) {
        console.error("Error loading invitation context:", error)
        // Continue without invitation context
      }
    }
  }, [invitationToken])

  const handleInputChange = (field: string, value: string) => {
    const safeValue = safeString(value)
    setFormData((prev) => ({ ...prev, [field]: safeValue }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    // Calculate password strength
    if (field === "password") {
      setPasswordStrength(calculatePasswordStrength(safeValue))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const safeName = safeString(formData.name).trim()
    const safeEmail = safeString(formData.email).trim()
    const safePassword = safeString(formData.password)
    const safeConfirmPassword = safeString(formData.confirmPassword)

    if (!safeName) {
      newErrors.name = "Name is required"
    }

    if (!safeEmail) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(safeEmail)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!safePassword) {
      newErrors.password = "Password is required"
    } else if (safePassword.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (safePassword !== safeConfirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // If invitation context exists, proceed to partnership confirmation
      if (invitationContext) {
        router.push("/auth/partnership-confirmation")
      } else {
        router.push("/onboarding")
      }
    } catch (error) {
      console.error("Signup failed:", error)
      setErrors({ general: "Signup failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    try {
      // Simulate Google OAuth
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (invitationContext) {
        router.push("/auth/partnership-confirmation")
      } else {
        router.push("/onboarding")
      }
    } catch (error) {
      console.error("Google signup failed:", error)
      setErrors({ general: "Google signup failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "bg-red-500"
    if (passwordStrength < 50) return "bg-orange-500"
    if (passwordStrength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Weak"
    if (passwordStrength < 50) return "Fair"
    if (passwordStrength < 75) return "Good"
    return "Strong"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Invitation Context Banner */}
        {invitationContext && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={invitationContext.inviterAvatar || "/placeholder.svg?height=40&width=40&text=Avatar"}
                      alt={invitationContext.inviterName}
                    />
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {getInitials(invitationContext.inviterName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{invitationContext.inviterName} is waiting!</p>
                    {invitationContext.goalTitle && (
                      <p className="text-xs text-gray-600">{invitationContext.goalTitle}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Partnership
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Signup Card */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="bg-white shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {invitationContext ? "Join DuoTrak" : "Create Account"}
              </CardTitle>
              <p className="text-gray-600">
                {invitationContext
                  ? "Complete your account to start your partnership"
                  : "Start your goal achievement journey"}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Google Signup */}
              <Button
                onClick={handleGoogleSignup}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="w-full border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
                      </div>
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-green-500 text-sm mt-1 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Passwords match!
                    </p>
                  )}
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <span>{invitationContext ? "Join Partnership" : "Create Account"}</span>
                  )}
                </Button>
              </form>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => router.push(`/auth/login${invitationToken ? `?invitation=${invitationToken}` : ""}`)}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
