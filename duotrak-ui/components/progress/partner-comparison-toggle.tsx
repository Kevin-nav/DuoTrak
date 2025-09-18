"use client"

import { Users } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface PartnerComparisonToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
  partnerName?: string
}

export default function PartnerComparisonToggle({ 
  enabled, 
  onToggle, 
  disabled = false,
  partnerName = "Partner"
}: PartnerComparisonToggleProps) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg">
      <Users className="w-4 h-4 text-[var(--theme-primary)]" />
      <Label 
        htmlFor="partner-comparison" 
        className="text-sm font-medium text-[var(--theme-foreground)] cursor-pointer"
      >
        Compare with {partnerName}
      </Label>
      <Switch
        id="partner-comparison"
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  )
}
