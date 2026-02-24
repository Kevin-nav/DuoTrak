"use client"

import { motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { UserRead } from "@/schemas/user";
import { Settings, Bell, Shield, HelpCircle, LogOut, Edit3, Camera, ChevronRight, User, Upload, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from "firebase/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import FullPageSpinner from "./ui/FullPageSpinner"
import { useAction, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { avatarLibrary } from "@/lib/avatars"
import { cn } from "@/lib/utils"
import { processAvatarVariants, validateImage, formatFileSize } from "@/lib/imageUtils"
import { useRouter } from "next/navigation"

export default function ProfileContent() {
  const router = useRouter()
  const { userDetails, isLoading, refetchUserDetails, signOut } = useUser()
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState(userDetails?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPasswordForReauth, setCurrentPasswordForReauth] = useState("")
  const [nickname, setNickname] = useState("")

  // Avatar State
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convex Mutations & Actions
  const uploadProfilePicture = useAction(api.users.uploadProfilePicture) as any;
  const updateUser = useMutation(api.users.update);

  useEffect(() => {
    if (userDetails) {
      setNewEmail(userDetails.email)
      // You might need to adjust your API to return the user's own nickname for their partner
      // For now, we'll initialize it as empty or from a placeholder
      setNickname(userDetails.nickname || "")
    }
  }, [userDetails])

  // --- Avatar Logic ---
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  if (isLoading || !userDetails) {
    return <FullPageSpinner />
  }

  const {
    full_name,
    email,
    profile_picture_url,
    partner_profile_picture_url,
    current_streak,
    longest_streak,
    total_tasks_completed,
    goals_conquered,
    notifications_enabled,
  } = userDetails

  const handleNicknameSave = async () => {
    try {
      await updateUser({ nickname })
      refetchUserDetails()
      toast.success("Nickname updated successfully!")
    } catch (error) {
      toast.error("Failed to update nickname.")
      console.error("Failed to update nickname:", error)
    }
  }

  const handleEmailSave = async () => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) {
      toast.error("No authenticated user found.")
      return
    }
    if (!currentPasswordForReauth) {
      toast.error("Please enter your current password to confirm.")
      return
    }
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPasswordForReauth)
      await reauthenticateWithCredential(user, credential)
      await updateEmail(user, newEmail)
      await updateUser({ email: newEmail })
      setIsEmailDialogOpen(false)
      refetchUserDetails()
      toast.success("Email updated successfully!")
      setCurrentPasswordForReauth("")
    } catch (error: any) {
      console.error("Failed to update email:", error)
      let errorMessage = "Failed to update email."
      if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid current password."
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use by another account."
      }
      toast.error(errorMessage)
    }
  }

  const handlePasswordSave = async () => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) {
      toast.error("No authenticated user found.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.")
      return
    }
    if (!currentPassword) {
      toast.error("Please enter your current password.")
      return
    }
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setIsPasswordDialogOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password updated successfully!")
    } catch (error: any) {
      console.error("Failed to update password:", error)
      let errorMessage = "Failed to update password."
      if (error.code === "auth/weak-password") {
        errorMessage = "The new password is too weak."
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid current password."
      }
      toast.error(errorMessage)
    }
  }

  const handleNotificationsToggle = async (enabled: boolean) => {
    try {
      await updateUser({ notifications_enabled: enabled })
      refetchUserDetails()
      toast.success("Notification settings updated!")
    } catch (error) {
      toast.error("Failed to update notification settings.")
      console.error("Failed to update notification settings:", error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate immediately on selection
      const validation = validateImage(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSaveAvatar = async (presetUrl?: string) => {
    setIsUploading(true);
    try {
      if (presetUrl) {
        // Preset avatars - just update the URL
        await updateUser({
          profile_picture_url: presetUrl,
          profile_picture_storage_id: null as any,
        });
        toast.success("Avatar updated!");
        setIsAvatarDialogOpen(false);
      } else if (selectedFile) {
        // Custom upload - process and upload to R2
        toast.info("Processing image...");

        // Process into multiple square variants (original/xl/lg/md/sm)
        const processed = await processAvatarVariants(selectedFile);

        console.log(
          `Image processed: ${formatFileSize(processed.originalSize)} → ${formatFileSize(processed.totalProcessedSize)}`
        );

        // Upload to R2 via Convex action
        const result = await uploadProfilePicture({
          variants: {
            original: processed.variants.original.base64,
            xl: processed.variants.xl.base64,
            lg: processed.variants.lg.base64,
            md: processed.variants.md.base64,
            sm: processed.variants.sm.base64,
          },
          contentType: "image/webp",
        });

        if (result.success) {
          toast.success("Profile picture uploaded!");
          setIsAvatarDialogOpen(false);
          setSelectedFile(null);
        } else {
          throw new Error("Upload failed");
        }
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Failed to update avatar.");
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Profile Header */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-[var(--theme-primary)]">
                <AvatarImage src={profile_picture_url || "/placeholder.svg"} className="object-cover" />
                <AvatarFallback className="text-2xl font-bold bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                  {full_name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-foreground)]">
                  <DialogHeader>
                    <DialogTitle className="text-[var(--theme-foreground)]">Choose Your Avatar</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Presets */}
                    <div>
                      <h4 className="mb-3 text-sm font-medium text-[var(--theme-secondary)]">Choose from library</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {avatarLibrary.map((avatarUrl) => (
                          <button
                            key={avatarUrl}
                            onClick={() => handleSaveAvatar(avatarUrl)}
                            className="rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                            disabled={isUploading}
                          >
                            <img
                              src={avatarUrl}
                              alt="Avatar option"
                              className="h-16 w-16 rounded-full border border-[var(--theme-border)] object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Upload */}
                    <div>
                      <h4 className="mb-3 text-sm font-medium text-[var(--theme-secondary)]">Or upload your own</h4>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-foreground)] hover:bg-[var(--theme-muted)]"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {selectedFile ? "Change File" : "Select Image"}
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </div>
                      {selectedFile && previewUrl && (
                        <div className="mt-4 flex flex-col items-center gap-4">
                          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--theme-primary)]">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button onClick={() => handleSaveAvatar()} disabled={isUploading} className="bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-secondary)]">
                            {isUploading ? "Uploading..." : "Confirm Upload"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">{full_name}</h1>
                <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-foreground)]">
                    <DialogHeader>
                      <DialogTitle className="text-[var(--theme-foreground)]">Change Email Address</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--theme-foreground)]">
                          New Email Address
                        </label>
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email address"
                          className="border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--theme-foreground)]">
                          Current Password (for verification)
                        </label>
                        <Input
                          type="password"
                          value={currentPasswordForReauth}
                          onChange={(e) => setCurrentPasswordForReauth(e.target.value)}
                          placeholder="Enter your current password"
                          className="border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]"
                        />
                      </div>
                      <div className="flex space-x-2 justify-end">
                        <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)} className="border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-foreground)] hover:bg-[var(--theme-muted)]">
                          Cancel
                        </Button>
                        <Button onClick={handleEmailSave} className="bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-secondary)]">Save Changes</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-[var(--theme-secondary)] mb-3">{email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="secondary" className="bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                  🔥 {current_streak} Day Streak
                </Badge>
                <Badge variant="secondary" className="bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                  🎯 {goals_conquered} Goals Completed
                </Badge>
                {userDetails.partner_id && (
                  <Badge variant="secondary" className="bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                    👥 Partnered
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Snapshot */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-foreground)]">Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--theme-primary)]">{current_streak}</div>
              <div className="text-sm text-[var(--theme-secondary)]">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--theme-primary)]">{longest_streak}</div>
              <div className="text-sm text-[var(--theme-secondary)]">Longest Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--theme-primary)]">{total_tasks_completed}</div>
              <div className="text-sm text-[var(--theme-secondary)]">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--theme-primary)]">{goals_conquered}</div>
              <div className="text-sm text-[var(--theme-secondary)]">Goals Conquered</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings & Preferences */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-foreground)] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--theme-primary)]" />
            Settings & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--theme-muted)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--theme-accent)]">
                <Bell className="w-5 h-5 text-[var(--theme-primary)]" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--theme-foreground)]">Notifications</h3>
                <p className="text-sm text-[var(--theme-secondary)]">Manage your notification preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={notifications_enabled ?? undefined} onCheckedChange={handleNotificationsToggle} />
            </div>
          </div>

          <Separator />

          {/* Change Password */}
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--theme-muted)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--theme-accent)]">
                <Shield className="w-5 h-5 text-[var(--theme-primary)]" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--theme-foreground)]">Password</h3>
                <p className="text-sm text-[var(--theme-secondary)]">Change your password</p>
              </div>
            </div>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </DialogTrigger>
              <DialogContent className="border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-foreground)]">
                <DialogHeader>
                  <DialogTitle className="text-[var(--theme-foreground)]">Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--theme-foreground)]">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--theme-foreground)]">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--theme-foreground)]">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]"
                    />
                  </div>
                  <div className="flex space-x-2 justify-end">
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-foreground)] hover:bg-[var(--theme-muted)]">
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordSave}
                      disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                      className="bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-secondary)] disabled:opacity-60"
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          {/* Nickname */}
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--theme-muted)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--theme-accent)]">
                <User className="w-5 h-5 text-[var(--theme-primary)]" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--theme-foreground)]">Nickname</h3>
                <p className="text-sm text-[var(--theme-secondary)]">Set a nickname for your partner to see</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                className="w-48 border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]"
                placeholder="e.g., Alex"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={handleNicknameSave} className="border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-foreground)] hover:bg-[var(--theme-muted)]">
                Save
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {userDetails.partner_id && (
        <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--theme-foreground)]">Partner Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={partner_profile_picture_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                  {userDetails.partner_nickname // Prefer nickname if available
                    ? userDetails.partner_nickname.split(" ").map((n: string) => n[0]).join("")
                    : userDetails.partner_full_name // Fallback to full name initials
                      ? userDetails.partner_full_name.split(" ").map((n: string) => n[0]).join("")
                      : "P"} {/* Default fallback */}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium text-[var(--theme-foreground)]">
                  {userDetails.partner_nickname || userDetails.partner_full_name || "Your Partner"}
                </h3>
                <p className="text-sm text-[var(--theme-secondary)]">Connected partner</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/partner")}
                className="border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-foreground)] hover:bg-[var(--theme-muted)]"
              >
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="pt-4"
      >
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 bg-transparent"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </motion.div>
    </motion.div>
  )
}
