import * as React from "react"
import { format, isValid } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, X } from "lucide-react"
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
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  minDate?: Date
  showTimezone?: boolean
}

// Simple and reliable: Build UTC ISO from Paris wall-clock time
const buildUtcIso = (year: number, month: number, day: number, hour: number, minute: number): string => {
  // Create a date string that we interpret as Paris time
  // Then convert to UTC by calculating the offset
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  
  // Get the Paris offset for this date
  const tempDate = new Date(dateStr + 'Z') // Parse as UTC first
  const parisFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  // Find offset by comparing UTC and Paris representation
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, 0)
  const testDate = new Date(utcMs)
  
  // Get Paris time for this UTC moment
  const parisParts = parisFormatter.formatToParts(testDate)
  const getP = (t: string) => parisParts.find(p => p.type === t)?.value || '0'
  const parisHour = parseInt(getP('hour'))
  const parisMinute = parseInt(getP('minute'))
  const parisDay = parseInt(getP('day'))
  
  // Calculate offset in minutes (Paris - UTC)
  let offsetMinutes = (parisHour - hour) * 60 + (parisMinute - minute)
  if (parisDay !== day) {
    offsetMinutes += parisDay > day ? 24 * 60 : -24 * 60
  }
  
  // The real UTC time is: selected Paris time - offset
  const realUtcMs = utcMs - offsetMinutes * 60 * 1000
  return new Date(realUtcMs).toISOString()
}

// Parse UTC ISO to Paris wall-clock components
const parseUtcToParisComponents = (isoString: string): { year: number; month: number; day: number; hour: number; minute: number } | null => {
  try {
    const utcDate = new Date(isoString)
    if (!isValid(utcDate)) return null
    
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    const parts = formatter.formatToParts(utcDate)
    const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
    
    return {
      year: parseInt(get('year')),
      month: parseInt(get('month')),
      day: parseInt(get('day')),
      hour: parseInt(get('hour')),
      minute: parseInt(get('minute'))
    }
  } catch {
    return null
  }
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Sélectionner date et heure",
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

  // Parse incoming value
  React.useEffect(() => {
    if (value) {
      const parsed = parseUtcToParisComponents(value)
      if (parsed) {
        setSelectedDate(new Date(parsed.year, parsed.month - 1, parsed.day))
        setSelectedHour(String(parsed.hour).padStart(2, '0'))
        setSelectedMinute(String(parsed.minute).padStart(2, '0'))
      }
    } else {
      setSelectedDate(undefined)
      setSelectedHour('09')
      setSelectedMinute('00')
    }
  }, [value])

  const emitChange = React.useCallback((date: Date | undefined, hour: string, minute: string) => {
    if (date && onChange) {
      const iso = buildUtcIso(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        parseInt(hour),
        parseInt(minute)
      )
      onChange(iso)
    }
  }, [onChange])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      emitChange(date, selectedHour, selectedMinute)
      setCalendarOpen(false)
    }
  }

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour)
    emitChange(selectedDate, hour, selectedMinute)
  }

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute)
    emitChange(selectedDate, selectedHour, minute)
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    setSelectedHour('09')
    setSelectedMinute('00')
    onChange?.('')
  }

  const displayText = selectedDate && isValid(selectedDate)
    ? `${format(selectedDate, "d MMM yyyy", { locale: fr })} à ${selectedHour}:${selectedMinute}`
    : null

  return (
    <div className={cn("space-y-4", className)}>
      {/* Combined Date + Time Selector */}
      <div className="flex flex-col gap-3">
        {/* Date Selection */}
        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                id={id}
                variant="outline"
                disabled={disabled}
                className={cn(
                  "flex-1 justify-start text-left font-normal h-11",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }) : placeholder}
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
          
          {selectedDate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-11 w-11 shrink-0"
              title="Effacer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Time Selection - Only show when date is selected */}
        {selectedDate && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={selectedHour} onValueChange={handleHourChange} disabled={disabled}>
              <SelectTrigger className="w-24 h-11">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[280px] overflow-y-auto">
                {Array.from({ length: 24 }, (_, i) => {
                  const val = String(i).padStart(2, '0')
                  return (
                    <SelectItem key={val} value={val}>
                      {val}h
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            
            <span className="text-lg font-bold text-muted-foreground">:</span>
            
            <Select value={selectedMinute} onValueChange={handleMinuteChange} disabled={disabled}>
              <SelectTrigger className="w-20 h-11">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[280px] overflow-y-auto">
                {Array.from({ length: 60 }, (_, i) => {
                  const val = String(i).padStart(2, '0')
                  return (
                    <SelectItem key={val} value={val}>
                      {val}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Summary with timezone */}
      {displayText && showTimezone && (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Envoi prévu : {displayText}
            </span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Europe/Paris
          </span>
        </div>
      )}
    </div>
  )
}
