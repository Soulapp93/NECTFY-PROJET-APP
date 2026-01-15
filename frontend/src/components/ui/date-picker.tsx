import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type DatePickerProps = {
  id?: string;
  name?: string;
  value?: string; // yyyy-MM-dd
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "Choisir une date",
  required,
  disabled,
  className,
}: DatePickerProps) {
  const selected = toDate(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11 rounded-xl border-2 border-primary/30 bg-background hover:border-primary/50 hover:bg-primary/5 transition-all duration-200",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {selected ? format(selected, "PPP", { locale: fr }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-2 border-primary/20 rounded-xl shadow-xl" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (!d) return;
            onChange?.(format(d, "yyyy-MM-dd"));
          }}
          locale={fr}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>

      {/* Keep native form integration when used inside <form> */}
      {name ? (
        <input
          id={id}
          name={name}
          type="hidden"
          value={value || ""}
          required={required}
          readOnly
        />
      ) : null}
    </Popover>
  );
}
