import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Clock, User, BookOpen, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { notificationService } from '@/services/notificationService';

interface MissingEntry {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  module_name: string;
  instructor_name: string;
  instructor_id: string;
  formation_title: string;
}

interface MissingTextBookEntriesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFormationId?: string;
}

const MissingTextBookEntriesModal: React.FC<MissingTextBookEntriesModalProps> = ({
  isOpen,
  onOpenChange,
  selectedFormationId
}) => {
  const [missingEntries, setMissingEntries] = useState<MissingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const fetchMissingEntries = async () => {
    setLoading(true);
    try {
      const now = new Date();
      
      // Récupérer les créneaux passés
      let slotsQuery = supabase
        .from('schedule_slots')
        .select(`
          id,
          date,
          start_time,
          end_time,
          instructor_id,
          room,
          formation_modules!schedule_slots_module_id_fkey(
            title
          ),
          schedules!inner(
            id,
            formation_id,
            formations!inner(title)
          ),
          users!schedule_slots_instructor_id_fkey(
            first_name,
            last_name
          )
        `)
        .lt('date', now.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (selectedFormationId) {
        slotsQuery = slotsQuery.eq('schedules.formation_id', selectedFormationId);
      }

      const { data: slots, error: slotsError } = await slotsQuery;
      
      if (slotsError) throw slotsError;

      // Récupérer les entrées de cahier de texte existantes
      let entriesQuery = supabase
        .from('text_book_entries')
        .select(`
          date,
          text_books!inner(
            formation_id
          )
        `);

      if (selectedFormationId) {
        entriesQuery = entriesQuery.eq('text_books.formation_id', selectedFormationId);
      }

      const { data: entries, error: entriesError } = await entriesQuery;
      
      if (entriesError) throw entriesError;

      // Créer un Set des dates avec entrées pour comparaison rapide
      const entryDates = new Set(
        entries?.map(entry => entry.date) || []
      );

      // Filtrer les créneaux sans entrées correspondantes
      const missing = slots?.filter(slot => !entryDates.has(slot.date))
        .map(slot => ({
          id: slot.id,
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          module_name: slot.formation_modules?.title || 'Module non défini',
          instructor_name: slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur non défini',
          instructor_id: slot.instructor_id,
          formation_title: slot.schedules?.formations?.title || 'Formation non définie'
        })) || [];

      setMissingEntries(missing);
    } catch (error) {
      console.error('Erreur lors du chargement des entrées manquantes:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (entry: MissingEntry) => {
    if (!entry.instructor_id) {
      toast.error('Aucun formateur associé à ce cours');
      return;
    }

    setSendingReminder(entry.id);
    try {
      const message = `Bonjour,

Vous n'avez pas encore saisi l'entrée dans le cahier de texte pour le cours suivant :

📅 Date: ${new Date(entry.date).toLocaleDateString('fr-FR')}
🕐 Horaires: ${entry.start_time.substring(0, 5)} - ${entry.end_time.substring(0, 5)}
📚 Module: ${entry.module_name}
🎓 Formation: ${entry.formation_title}

Merci de compléter cette entrée dès que possible.

Cordialement,
L'administration`;

      await notificationService.notifyUser(
        entry.instructor_id,
        'Rappel: Cahier de texte manquant',
        message,
        'textbook_reminder',
        {
          module: entry.module_name,
          date: entry.date,
          formation: entry.formation_title
        }
      );

      toast.success(`Rappel envoyé à ${entry.instructor_name}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      toast.error('Erreur lors de l\'envoi du rappel');
    } finally {
      setSendingReminder(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMissingEntries();
    }
  }, [isOpen, selectedFormationId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Entrées de cahier de texte manquantes
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        ) : missingEntries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Aucune entrée manquante détectée</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {missingEntries.length} entrée{missingEntries.length > 1 ? 's' : ''} de cahier de texte manquante{missingEntries.length > 1 ? 's' : ''}
            </div>
            
            {missingEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDate(entry.date)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.module_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{entry.instructor_name}</span>
                      </div>
                      
                      {!selectedFormationId && (
                        <Badge variant="outline" className="w-fit">
                          {entry.formation_title}
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => sendReminder(entry)}
                      disabled={sendingReminder === entry.id}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendingReminder === entry.id ? 'Envoi...' : 'Envoyer un rappel'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MissingTextBookEntriesModal;