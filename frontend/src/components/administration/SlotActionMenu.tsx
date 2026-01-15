import React from 'react';
import { MoreVertical, Edit, Copy, Trash2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScheduleSlot } from '@/services/scheduleService';

interface SlotActionMenuProps {
  slot: ScheduleSlot;
  onEdit: (slot: ScheduleSlot) => void;
  onDuplicate: (slot: ScheduleSlot) => void;
  onDelete: (slot: ScheduleSlot) => void;
}

const SlotActionMenu = ({ slot, onEdit, onDuplicate, onDelete }: SlotActionMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(slot)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(slot)}>
          <Copy className="h-4 w-4 mr-2" />
          Dupliquer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(slot)} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SlotActionMenu;