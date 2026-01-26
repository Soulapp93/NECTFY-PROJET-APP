import * as React from "react"
import { format, isValid } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  value?: string // Format: ISO 8601 with timezone
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  minDate?: Date
  showTimezone?: boolean
}

// Timezone used for scheduling (France)
const TIMEZONE = 'Europe/Paris'

// Generate hours options
const hoursOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString().padStart(2, '0'),
  label: i.toString().padStart(2, '0') + 'h'
}))

// Generate minutes options (every 5 minutes)
const minutesOptions = Array.from({ length: 60 }, (_, i) => ({
  value: i.toString().padStart(2, "0"),
  label: i.toString().padStart(2, "0"),
}))

// Get the timezone offset string for Europe/Paris (e.g., UTC+1 / UTC+2)
const getTimezoneOffsetLabel = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIMEZONE,
    timeZoneName: "shortOffset",
  })
  const parts = formatter.formatToParts(date)
  const offsetPart = parts.find((p) => p.type === "timeZoneName")
  return offsetPart?.value || "UTC+1"
}

// Parse offset label like "UTC+1", "UTC+01:00", "UTC+2" to minutes
const parseUtcOffsetToMinutes = (offsetLabel: string): number => {
  // Expected: "UTC+1", "UTC+01:00", "UTC-05:00", etc.
  const m = offsetLabel.match(/UTC([+-])(\d{1,2})(?::?(\d{2}))?/) // minutes optional
  if (!m) return 60 // safe fallback for France winter time
  const sign = m[1] === "-" ? -1 : 1
  const hours = Number(m[2] || 0)
  const minutes = Number(m[3] || 0)
  return sign * (hours * 60 + minutes)
}

// Convert Europe/Paris date+time selection to an UTC ISO string.
// IMPORTANT: Do NOT rely on the browser's local timezone.
const toISOWithTimezone = (date: Date, hour: string, minute: string): string => {
  const year = date.getFullYear()
  const monthIndex = date.getMonth() // 0-based
  const day = date.getDate()

  // We start from the selected wall-clock time as if it was UTC…
  const naiveUtcMs = Date.UTC(year, monthIndex, day, Number(hour), Number(minute), 0)
  const naiveUtcDate = new Date(naiveUtcMs)

  // …then we retrieve the Paris offset for that instant and subtract it.
  // This yields the real UTC instant corresponding to the Paris wall-clock time.
  const offsetLabel = getTimezoneOffsetLabel(naiveUtcDate)
  const offsetMinutes = parseUtcOffsetToMinutes(offsetLabel)
  const realUtcMs = naiveUtcMs - offsetMinutes * 60 * 1000
  return new Date(realUtcMs).toISOString()
}

// Parse ISO date and extract Paris local time
const parseToParisTime = (isoString: string): { date: Date; hour: string; minute: string } | null => {
  try {
    const utcDate = new Date(isoString)
    if (!isValid(utcDate)) return null
    
    const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    const parts = parisFormatter.formatToParts(utcDate)
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || ''
    
    const year = parseInt(getPart('year'))
    const month = parseInt(getPart('month')) - 1
    const day = parseInt(getPart('day'))
    const hour = getPart('hour').padStart(2, '0')
    const minute = getPart('minute').padStart(2, '0')
    
    return {
      date: new Date(year, month, day),
      hour,
      minute,
    }
  } catch {
    return null
  }
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  className,
  disabled,
  id,
  minDate,
  showTimezone = true
}: DateTimePickerProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [selectedHour, setSelectedHour] = React.useState<string>('09')
  const [selectedMinute, setSelectedMinute] = React.useState<string>('00')

  const timezoneOffset = React.useMemo(() => getTimezoneOffsetLabel(new Date()), [])

  React.useEffect(() => {
    if (value) {
      const parsed = parseToParisTime(value)
      if (parsed) {
        setSelectedDate(parsed.date)
        setSelectedHour(parsed.hour)
        setSelectedMinute(parsed.minute)
      }
    }
  }, [value])

  const updateValue = (date: Date | undefined, hour: string, minute: string) => {
    if (date) {
      const isoValue = toISOWithTimezone(date, hour, minute)
      onChange?.(isoValue)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      updateValue(date, selectedHour, selectedMinute)
      setCalendarOpen(false)
    }
  }

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour)
    updateValue(selectedDate, hour, selectedMinute)
  }

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute)
    updateValue(selectedDate, selectedHour, minute)
  }

  const displayDate = selectedDate && isValid(selectedDate)
    ? format(selectedDate, "d MMMM yyyy", { locale: fr })
    : undefined

  return (
    <div className={cn("space-y-3", className)}>
      {/* Date Picker */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4 text-primary" />
          Date d'envoi
        </label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal h-11",
                !displayDate && "text-muted-foreground"
              )}
            >
              {displayDate || <span>{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => minDate ? date < minDate : false}
              initialFocus
              locale={fr}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Picker - Simplified with dropdowns */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          Heure d'envoi
        </label>
        <div className="flex items-center gap-2">
          <Select
            value={selectedHour}
            onValueChange={handleHourChange}
            disabled={disabled}
          >
            <SelectTrigger className="flex-1 h-11">
              <SelectValue placeholder="Heure" />
            </SelectTrigger>
            <SelectContent 
              className="max-h-[280px] overflow-y-auto"
              position="popper"
              sideOffset={4}
            >
              {hoursOptions.map((hour) => (
                <SelectItem key={hour.value} value={hour.value}>
                  {hour.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-lg font-semibold text-muted-foreground">:</span>
          
          <Select
            value={selectedMinute}
            onValueChange={handleMinuteChange}
            disabled={disabled}
          >
            <SelectTrigger className="flex-1 h-11">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent 
              className="max-h-[280px] overflow-y-auto"
              position="popper"
              sideOffset={4}
            >
              {minutesOptions.map((minute) => (
                <SelectItem key={minute.value} value={minute.value}>
                  {minute.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timezone indicator */}
      {showTimezone && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          <Globe className="h-3.5 w-3.5" />
          <span>Fuseau horaire : <strong className="text-foreground">{TIMEZONE}</strong> ({timezoneOffset})</span>
        </div>
      )}

      {/* Summary */}
      {selectedDate && isValid(selectedDate) && (
        <div className="text-sm text-center py-2 px-3 bg-primary/10 rounded-md text-primary font-medium">
          Envoi prévu le {displayDate} à {selectedHour}:{selectedMinute}
        </div>
      )}
    </div>
  )
}
