"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Camera, Edit3, Flame } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import MouseGlowEffect from "./mouse-glow-effect"
import { useUser } from "@/contexts/UserContext"
import { apiFetch, apiFetchWithFile } from "@/lib/api"
import { toast } from "sonner"

interface ProfileHeaderProps {
  username: string
  profilePicture: string
  bio: string
  currentStreak: number
}

export default function ProfileHeader({ username, profilePicture: initialProfilePicture, bio, currentStreak }: ProfileHeaderProps) {
  const { userDetails, refetchUserDetails } = useUser()
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [currentBio, setCurrentBio] = useState(bio)
  const [tempBio, setTempBio] = useState(bio)
  const [isProfilePictureDialogOpen, setIsProfilePictureDialogOpen] = useState(false)
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    setCurrentBio(bio)
    setTempBio(bio)
    setProfilePicture(initialProfilePicture)
  }, [bio, initialProfilePicture])

  const handleSaveBio = async () => {
    try {
      await apiFetch("/api/v1/users/me", {
        method: "PUT",
        body: JSON.stringify({ bio: tempBio }),
      })
      setCurrentBio(tempBio)
      setIsEditingBio(false)
      refetchUserDetails() // Refresh user data in context
      toast.success("Bio updated successfully!")
    } catch (error) {
      console.error("Failed to update bio:", error)
      toast.error("Failed to update bio.")
    }
  }

  const handleCancelBio = () => {
    setTempBio(currentBio)
    setIsEditingBio(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log("File selected:", file)
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  const handleSaveProfilePicture = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const updatedUser = await apiFetchWithFile("/api/v1/users/me/profile-picture", formData);

      if (updatedUser && updatedUser.profile_picture_url) {
        setProfilePicture(updatedUser.profile_picture_url);
        toast.success("Profile picture updated successfully!");
      }
      
      setIsProfilePictureDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      refetchUserDetails(); // This is key to update the global state

    } catch (error) {
      console.error("Failed to update profile picture:", error);
      toast.error("Failed to update profile picture. Please try again.");
    }
  }

  const handleCancelProfilePictureChange = () => {
    setIsProfilePictureDialogOpen(false)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleRemoveProfilePicture = async () => {
    try {
      const updatedUser = await apiFetch("/api/v1/users/me/profile-picture", {
        method: "DELETE",
      });

      if (updatedUser) {
        setProfilePicture(""); // Set to empty string or a placeholder
        toast.success("Profile picture removed successfully!");
      }
      
      setIsProfilePictureDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      refetchUserDetails();

    } catch (error) {
      console.error("Failed to remove profile picture:", error);
      toast.error("Failed to remove profile picture. Please try again.");
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-cool-gray dark:border-gray-700"
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Profile Picture */}
        <div className="relative">
          <MouseGlowEffect glowColor="#19A1E5" intensity="medium">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} className="relative">
              <Dialog open={isProfilePictureDialogOpen} onOpenChange={setIsProfilePictureDialogOpen}>
                <DialogTrigger asChild>
                  <button className="relative group">
                    <img
                      src={profilePicture || "/placeholder.svg"}
                      alt={`${username}'s profile`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary-blue shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Profile Picture</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <img
                        src={previewUrl || profilePicture || "/placeholder.svg"}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-cool-gray dark:border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="profile-upload"
                        className="block text-sm font-medium text-charcoal dark:text-gray-200"
                      >
                        Choose new picture
                      </label>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-stone-gray dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-blue file:text-white hover:file:bg-primary-blue-hover"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        {profilePicture && (
                          <Button variant="destructive" size="sm" onClick={handleRemoveProfilePicture}>
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={handleCancelProfilePictureChange}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfilePicture} disabled={!selectedFile}>
                          Confirm
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          </MouseGlowEffect>
        </div>

        {/* Username */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-charcoal dark:text-gray-100 text-center"
        >
          {username}
        </motion.h1>

        {/* Bio Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md"
        >
          {!isEditingBio ? (
            <MouseGlowEffect glowColor="#19A1E5" intensity="low">
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsEditingBio(true)}
                className="w-full p-4 bg-pearl-gray dark:bg-gray-700 rounded-xl border border-cool-gray dark:border-gray-600 hover:border-primary-blue dark:hover:border-primary-blue transition-colors group"
              >
                <div className="flex items-center justify-center space-x-2">
                  <p className="text-stone-gray dark:text-gray-300 text-center italic">
                    {currentBio || "Add a personal motto or description..."}
                  </p>
                  <Edit3 className="w-4 h-4 text-stone-gray dark:text-gray-400 group-hover:text-primary-blue transition-colors" />
                </div>
              </motion.button>
            </MouseGlowEffect>
          ) : (
            <div className="space-y-3">
              <Input
                value={tempBio}
                onChange={(e) => setTempBio(e.target.value)}
                placeholder="Add a personal motto or description..."
                className="text-center"
                maxLength={100}
                autoFocus
              />
              <div className="flex space-x-2 justify-center">
                <Button onClick={handleSaveBio} size="sm" className="bg-primary-blue hover:bg-primary-blue-hover">
                  Save
                </Button>
                <Button onClick={handleCancelBio} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-stone-gray dark:text-gray-400 text-center">{tempBio.length}/100 characters</p>
            </div>
          )}
        </motion.div>

        {/* Current Streak Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="bg-gradient-to-r from-primary-blue to-accent-light-blue rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-center space-x-3">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <Flame className="w-8 h-8 text-orange-300" />
            </motion.div>
            <div className="text-center">
              <p className="text-3xl font-black">{currentStreak}</p>
              <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                {currentStreak === 1 ? "Day Streak!" : "Days Streak!"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
