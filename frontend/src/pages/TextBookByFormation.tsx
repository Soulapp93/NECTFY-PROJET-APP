import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { textBookService } from '@/services/textBookService';
import { formationService } from '@/services/formationService';
import { useToast } from '@/hooks/use-toast';

const TextBookByFormation: React.FC = () => {
  const { formationId } = useParams<{ formationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTextBook = async () => {
      if (!formationId) {
        navigate('/formations');
        return;
      }

      try {
        setLoading(true);
        
        // Try to find existing text book for this formation
        const textBooks = await textBookService.getTextBooks();
        const existingTextBook = textBooks?.find(tb => tb.formation_id === formationId);
        
        if (existingTextBook) {
          // Redirect to existing text book with context
          const urlParams = new URLSearchParams(window.location.search);
          const from = urlParams.get('from') || 'formations';
          const contextFormationId = urlParams.get('formationId') || formationId;
          navigate(`/cahier-texte/${existingTextBook.id}?from=${from}&formationId=${contextFormationId}`);
        } else {
          // Show message that no text book exists
          toast({
            title: "Aucun cahier de texte",
            description: "Aucun cahier de texte n'a été créé pour cette formation. Veuillez contacter l'administration.",
            variant: "destructive",
          });
          navigate(`/formations/${formationId}`);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du cahier de texte:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier l'existence du cahier de texte.",
          variant: "destructive",
        });
        navigate(`/formations/${formationId}`);
      } finally {
        setLoading(false);
      }
    };

    checkTextBook();
  }, [formationId, navigate, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Vérification du cahier de texte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto text-center">
      <h2 className="text-xl font-semibold mb-4">Redirection en cours...</h2>
      <Button onClick={() => navigate('/formations')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux formations
      </Button>
    </div>
  );
};

export default TextBookByFormation;