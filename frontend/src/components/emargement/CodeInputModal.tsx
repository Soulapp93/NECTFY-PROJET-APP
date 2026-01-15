import React, { useState } from 'react';
import { Hash, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface CodeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeSubmitted: (code: string) => void;
}

const CodeInputModal: React.FC<CodeInputModalProps> = ({
  isOpen,
  onClose,
  onCodeSubmitted
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast.error('Le code doit contenir 6 chiffres');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulation de vérification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Code de démonstration valide
      if (code === '123456') {
        onCodeSubmitted(code);
        toast.success('Code valide - Émargement effectué !');
        onClose();
      } else {
        toast.error('Code invalide ou expiré');
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification du code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Seulement les chiffres
    if (value.length <= 6) {
      setCode(value);
    }
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Saisir le code d'émargement
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Code numérique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Saisissez le code à 6 chiffres affiché par votre formateur
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={handleCodeChange}
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  autoComplete="off"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="flex gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 border-b-2 ${
                          i < code.length 
                            ? 'border-primary' 
                            : 'border-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={code.length !== 6 || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    'Vérification...'
                  ) : (
                    <>
                      Valider
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Clavier numérique rapide */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (code.length < 6) {
                      setCode(code + num);
                    }
                  }}
                  disabled={code.length >= 6}
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCode('')}
                disabled={code.length === 0}
              >
                Effacer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (code.length < 6) {
                    setCode(code + '0');
                  }
                }}
                disabled={code.length >= 6}
              >
                0
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCode(code.slice(0, -1))}
                disabled={code.length === 0}
              >
                ←
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Code de démonstration : <span className="font-mono">123456</span>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default CodeInputModal;