import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const minutes = ['00', '15', '30', '45']

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

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setSelectedHour(h || '')
      setSelectedMinute(m || '00')
    }
  }, [value])

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour)
    const newTime = `${hour}:${selectedMinute || '00'}`
    onChange?.(newTime)
  }

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute)
    if (selectedHour) {
      const newTime = `${selectedHour}:${minute}`
      onChange?.(newTime)
      setOpen(false)
    }
  }

  const displayValue = value 
    ? value.slice(0, 5) 
    : undefined

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
        <div className="flex pointer-events-auto bg-popover rounded-lg border shadow-lg">
          {/* Hours */}
          <div className="border-r border-border">
            <div className="px-4 py-2 text-xs font-semibold text-center border-b border-border bg-muted/50 text-muted-foreground">
              Heure
            </div>
            <ScrollArea className="h-[180px] w-[70px]">
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
            <ScrollArea className="h-[180px] w-[70px]">
              <div className="p-1 space-y-0.5">
                {minutes.map((minute) => (
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
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
