"use client"

import { useState } from "react"
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface DateRange {
  start: Date | null
  end: Date | null
  label: string
}

interface DateRangeFilterProps {
  currentRange: DateRange
  onRangeChange: (range: DateRange) => void
  disabled?: boolean
}

export default function DateRangeFilter({ 
  currentRange, 
  onRangeChange, 
  disabled = false 
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customMode, setCustomMode] = useState(false)
  const [tempStart, setTempStart] = useState<Date | undefined>()
  const [tempEnd, setTempEnd] = useState<Date | undefined>()

  const presets = [
    {
      label: "Last 7 Days",
      getValue: () => ({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
        label: "Last 7 Days"
      })
    },
    {
      label: "Last 30 Days", 
      getValue: () => ({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        label: "Last 30 Days"
      })
    },
    {
      label: "Last 90 Days",
      getValue: () => ({
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date(),
        label: "Last 90 Days"
      })
    },
    {
      label: "This Month",
      getValue: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        return {
          start,
          end: new Date(),
          label: "This Month"
        }
      }
    }
  ]

  const handlePresetSelect = (preset: any) => {
    const range = preset.getValue()
    onRangeChange(range)
    setIsOpen(false)
    setCustomMode(false)
  }

  const handleCustomRange = () => {
    if (tempStart && tempEnd) {
      onRangeChange({
        start: tempStart,
        end: tempEnd,
        label: `${tempStart.toLocaleDateString()} - ${tempEnd.toLocaleDateString()}`
      })
      setIsOpen(false)
      setCustomMode(false)
      setTempStart(undefined)
      setTempEnd(undefined)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled}
          className="flex items-center space-x-2 min-w-[160px] justify-between"
        >
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{currentRange.label}</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        {!customMode ? (
          <div className="p-4 space-y-2">
            <h4 className="font-medium text-sm text-[var(--theme-foreground)] mb-3">
              Select Date Range
            </h4>
            
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
            
            <div className="border-t pt-2 mt-3">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCustomMode(true)}
              >
                Custom Range...
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-[var(--theme-foreground)]">
                Custom Date Range
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomMode(false)
                  setTempStart(undefined)
                  setTempEnd(undefined)
                }}
              >
                Back
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--theme-secondary)] mb-1 block">
                  Start Date
                </label>
                <CalendarComponent
                  mode="single"
                  selected={tempStart}
                  onSelect={setTempStart}
                  className="rounded-md border"
                />
              </div>
              
              {tempStart && (
                <div>
                  <label className="text-xs text-[var(--theme-secondary)] mb-1 block">
                    End Date
                  </label>
                  <CalendarComponent
                    mode="single"
                    selected={tempEnd}
                    onSelect={setTempEnd}
                    disabled={(date) => date < tempStart}
                    className="rounded-md border"
                  />
                </div>
              )}
            </div>
            
            {tempStart && tempEnd && (
              <Button 
                onClick={handleCustomRange}
                className="w-full"
              >
                Apply Range
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
