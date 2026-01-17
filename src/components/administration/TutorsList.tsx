import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Users, 
  Building2, 
  Mail, 
  Phone,
  Edit2,
  Trash2,
  UserPlus
} from 'lucide-react';
import { useTutors } from '@/hooks/useTutors';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { TutorModal } from './TutorModal';
import { AssignStudentModal } from './AssignStudentModal';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tutor } from '@/services/tutorService';

export const TutorsList: React.FC = () => {
  const { tutors, loading, createTutor, updateTutor, deleteTutor } = useTutors();
  const { userId } = useCurrentUser();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);

  const establishmentId = "550e8400-e29b-41d4-a716-446655440000"; // À remplacer par l'ID réel

  const filteredTutors = tutors.filter(tutor =>
    tutor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTutor = () => {
    setSelectedTutor(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditTutor = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteTutor = (tutor: Tutor) => {
    setTutorToDelete(tutor);
  };

  const confirmDelete = async () => {
    if (tutorToDelete) {
      await deleteTutor(tutorToDelete.id);
      setTutorToDelete(null);
    }
  };

  const handleAssignStudent = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsAssignModalOpen(true);
  };

  const handleSave = async (tutorData: any) => {
    if (modalMode === 'create') {
      await createTutor(tutorData);
    } else if (selectedTutor) {
      await updateTutor(selectedTutor.id, tutorData);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher un tuteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={handleCreateTutor} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Tuteur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutors.map((tutor) => (
          <Card key={tutor.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {tutor.first_name} {tutor.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {tutor.position || 'Tuteur'}
                  </p>
                </div>
                <Badge variant={tutor.is_activated ? 'default' : 'secondary'}>
                  {tutor.is_activated ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{tutor.company_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{tutor.email}</span>
              </div>
              
              {tutor.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{tutor.phone}</span>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditTutor(tutor)}
                  className="flex-1 gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  Modifier
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAssignStudent(tutor)}
                  className="flex-1 gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  Assigner
                </Button>
              </div>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteTutor(tutor)}
                className="w-full gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Supprimer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTutors.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun tuteur trouvé</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Aucun tuteur ne correspond à votre recherche.' : 'Commencez par créer votre premier tuteur.'}
          </p>
        </div>
      )}

      <TutorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        tutor={selectedTutor}
        mode={modalMode}
        establishmentId={establishmentId}
      />

      <AssignStudentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        tutor={selectedTutor}
      />

      <AlertDialog open={!!tutorToDelete} onOpenChange={() => setTutorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le tuteur {tutorToDelete?.first_name} {tutorToDelete?.last_name} ?
              Cette action est irréversible et supprimera également toutes les assignations associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};