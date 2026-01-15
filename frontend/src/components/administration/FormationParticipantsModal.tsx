
import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface FormationParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  formationTitle: string;
  formationColor?: string;
}

interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_photo_url?: string;
}

const FormationParticipantsModal: React.FC<FormationParticipantsModalProps> = ({
  isOpen,
  onClose,
  formationId,
  formationTitle,
  formationColor = '#8B5CF6'
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && formationId) {
      fetchParticipants();
    }
  }, [isOpen, formationId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_formation_assignments')
        .select(`
          id,
          user:users(
            id,
            first_name,
            last_name,
            email,
            phone,
            profile_photo_url
          )
        `)
        .eq('formation_id', formationId);

      if (error) throw error;

      const formattedParticipants = data?.map(item => ({
        id: item.user.id,
        first_name: item.user.first_name,
        last_name: item.user.last_name,
        email: item.user.email,
        phone: item.user.phone,
        profile_photo_url: item.user.profile_photo_url
      })) || [];

      setParticipants(formattedParticipants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des participants');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-primary/20">
        {/* Header avec couleur de la formation */}
        <div 
          className="px-6 py-5 text-white relative overflow-hidden"
          style={{ backgroundColor: formationColor }}
        >
          {/* Motifs décoratifs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Participants</h2>
              <p className="text-white/80 text-sm mt-1">{formationTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg text-muted-foreground">Chargement des participants...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-destructive mb-4">{error}</div>
              <button
                onClick={fetchParticipants}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucun participant</h3>
              <p className="text-muted-foreground">Cette formation n'a pas encore d'étudiants inscrits.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium text-foreground">
                    {participants.length} participant{participants.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {participants.map((participant) => (
                  <div 
                    key={participant.id} 
                    className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors bg-muted/10"
                  >
                    <div className="flex items-center">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 border-2 shadow-sm" style={{ borderColor: formationColor }}>
                          <AvatarImage src={participant.profile_photo_url || ''} alt={`${participant.first_name} ${participant.last_name}`} />
                          <AvatarFallback 
                            className="font-semibold text-sm text-white"
                            style={{ backgroundColor: formationColor }}
                          >
                            {participant.first_name.charAt(0)}{participant.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {participant.first_name} {participant.last_name}
                          </h4>
                          <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4 mt-1">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1 text-primary/70" />
                              {participant.email}
                            </div>
                            {participant.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1 text-primary/70" />
                                {participant.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormationParticipantsModal;
