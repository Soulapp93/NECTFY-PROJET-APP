import * as React from "react"
import { Clock, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const commonMinutes = ['00', '15', '30', '45']
const allMinutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

export function TimePicker({
  value,
  onChange,
  placeholder = "Heure",
  className,
  disabled,
  id
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedHour, setSelectedHour] = React.useState<string>('')
  const [selectedMinute, setSelectedMinute] = React.useState<string>('')
  const [showAllMinutes, setShowAllMinutes] = React.useState(false)
  const [manualInput, setManualInput] = React.useState('')
  const [isManualMode, setIsManualMode] = React.useState(false)

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setSelectedHour(h || '')
      setSelectedMinute(m || '00')
      setManualInput(value.slice(0, 5))
    }
  }, [value])

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour)
    const newTime = `${hour}:${selectedMinute || '00'}`
    onChange?.(newTime)
    setManualInput(newTime)
  }

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute)
    if (selectedHour) {
      const newTime = `${selectedHour}:${minute}`
      onChange?.(newTime)
      setManualInput(newTime)
      setOpen(false)
    }
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^0-9:]/g, '')
    
    // Auto-format: add colon after 2 digits
    if (input.length === 2 && !input.includes(':') && manualInput.length < input.length) {
      input = input + ':'
    }
    
    // Limit to HH:MM format
    if (input.length > 5) {
      input = input.slice(0, 5)
    }
    
    setManualInput(input)
  }

  const handleManualInputBlur = () => {
    validateAndApplyManualInput()
  }

  const handleManualInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      validateAndApplyManualInput()
      setIsManualMode(false)
      setOpen(false)
    }
    if (e.key === 'Escape') {
      setIsManualMode(false)
      if (value) {
        setManualInput(value.slice(0, 5))
      }
    }
  }

  const validateAndApplyManualInput = () => {
    const match = manualInput.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/)
    if (match) {
      const hour = match[1].padStart(2, '0')
      const minute = match[2]
      const newTime = `${hour}:${minute}`
      setSelectedHour(hour)
      setSelectedMinute(minute)
      onChange?.(newTime)
      setManualInput(newTime)
    } else if (manualInput.length === 0) {
      // Allow clearing
      setSelectedHour('')
      setSelectedMinute('')
    } else {
      // Reset to previous valid value
      if (value) {
        setManualInput(value.slice(0, 5))
      } else {
        setManualInput('')
      }
    }
  }

  const displayValue = value 
    ? value.slice(0, 5) 
    : undefined

  const minutesToShow = showAllMinutes ? allMinutes : commonMinutes

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11 bg-card",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{displayValue || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[100]" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="pointer-events-auto bg-popover rounded-lg border shadow-lg">
          {/* Manual input section */}
          <div className="p-3 border-b border-border">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Saisie manuelle (HH:MM)
            </label>
            <Input
              type="text"
              placeholder="Ex: 09:35"
              value={manualInput}
              onChange={handleManualInputChange}
              onBlur={handleManualInputBlur}
              onKeyDown={handleManualInputKeyDown}
              onFocus={() => setIsManualMode(true)}
              className="h-9 text-center font-mono text-base"
              maxLength={5}
            />
          </div>

          {/* Quick select section */}
          <div className="flex">
            {/* Hours */}
            <div className="border-r border-border">
              <div className="px-4 py-2 text-xs font-semibold text-center border-b border-border bg-muted/50 text-muted-foreground">
                Heure
              </div>
              <ScrollArea className="h-[200px] w-[70px]">
                <div className="p-1 space-y-0.5">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => handleHourSelect(hour)}
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-md transition-colors text-center",
                        selectedHour === hour 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* Minutes */}
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-center border-b border-border bg-muted/50 text-muted-foreground">
                Min
              </div>
              <ScrollArea className="h-[200px] w-[70px]">
                <div className="p-1 space-y-0.5">
                  {minutesToShow.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => handleMinuteSelect(minute)}
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-md transition-colors text-center",
                        selectedMinute === minute 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Toggle all minutes button */}
              <div className="p-1.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAllMinutes(!showAllMinutes)}
                  className="w-full px-2 py-1.5 text-xs rounded-md transition-colors bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
                >
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    showAllMinutes && "rotate-180"
                  )} />
                  {showAllMinutes ? 'Moins' : 'Toutes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
