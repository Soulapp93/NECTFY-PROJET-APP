import React, { useState, useEffect } from 'react';
import { Plus, FileText, Users, Calendar, Edit, Trash2, Upload, CheckCircle, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment, AssignmentSubmission } from '@/services/assignmentService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import CreateAssignmentModal from './CreateAssignmentModal';
import AssignmentSubmissionsModal from './AssignmentSubmissionsModal';
import SubmitAssignmentModal from './SubmitAssignmentModal';
import StudentCorrectionViewModal from './StudentCorrectionViewModal';
import { toast } from 'sonner';

interface ModuleAssignmentsTabProps {
  moduleId: string;
}

const ModuleAssignmentsTab: React.FC<ModuleAssignmentsTabProps> = ({ moduleId }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Assignment | null>(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState<Assignment | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<Assignment | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState<{ assignment: Assignment; submission: AssignmentSubmission } | null>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, AssignmentSubmission | null>>({});

  const { userId, userRole, loading: userLoading } = useCurrentUser();

  // Définir les permissions basées sur le rôle
  const isFormateur = userRole === 'Formateur';
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const canCreateAssignment = isFormateur || isAdmin;
  const isEtudiant = userRole === 'Étudiant';

  // Fonction pour vérifier si l'utilisateur peut modifier un devoir
  const canEditAssignment = (assignment: Assignment) => {
    // Admin/Formateur: gestion uniquement sur ses propres devoirs
    if ((isFormateur || isAdmin) && assignment.created_by && assignment.created_by === userId) return true;
    return false;
  };

  const fetchAssignments = async () => {
    try {
      const data = await assignmentService.getModuleAssignments(moduleId);
      setAssignments(data || []);

      // Pour les étudiants, récupérer leurs soumissions
      if (isEtudiant && userId && data) {
        const submissionsMap: Record<string, AssignmentSubmission | null> = {};
        for (const assignment of data) {
          const submissions = await assignmentService.getAssignmentSubmissions(assignment.id);
          const mySubmission = submissions.find(s => s.student_id === userId);
          submissionsMap[assignment.id] = mySubmission || null;
        }
        setStudentSubmissions(submissionsMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des devoirs:', error);
      toast.error('Erreur lors du chargement des devoirs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) {
      fetchAssignments();
    }
  }, [moduleId, userLoading, userId, userRole]);

  const handleCreateSuccess = () => {
    fetchAssignments();
    setShowCreateModal(false);
    toast.success('Devoir créé avec succès');
  };

  const handleEditSuccess = () => {
    fetchAssignments();
    setShowEditModal(null);
    toast.success('Devoir modifié avec succès');
  };

  const handleSubmitSuccess = () => {
    fetchAssignments();
    setShowSubmitModal(null);
    toast.success('Devoir rendu avec succès');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce devoir ?')) {
      try {
        await assignmentService.deleteAssignment(id);
        fetchAssignments();
        toast.success('Devoir supprimé');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = studentSubmissions[assignmentId];
    if (!submission) return null;
    
    const correction = submission.correction;
    if (correction?.published_at) {
      return { 
        status: 'corrected', 
        label: `Note: ${correction.score}/${correction.max_score}`,
        color: 'bg-green-100 text-green-800',
        submission
      };
    }
    if (correction?.is_corrected) {
      return { 
        status: 'pending_publication', 
        label: 'Correction en cours',
        color: 'bg-blue-100 text-blue-800',
        submission
      };
    }
    return { 
      status: 'submitted', 
      label: 'Devoir rendu',
      color: 'bg-amber-100 text-amber-800',
      submission
    };
  };

  if (loading || userLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Devoirs & Évaluations</h2>
        
        {canCreateAssignment && (
          <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Créer un devoir
          </Button>
        )}
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const submissionStatus = isEtudiant ? getSubmissionStatus(assignment.id) : null;
            const hasSubmitted = !!submissionStatus;
            const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
            
            return (
              <div 
                key={assignment.id} 
                className="bg-card border border-primary/10 rounded-xl p-4 sm:p-5 hover:shadow-lg hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                      {assignment.is_published && (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                          Publié
                        </span>
                      )}
                      {/* Statut de soumission pour étudiant */}
                      {isEtudiant && submissionStatus && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${submissionStatus.color}`}>
                          {submissionStatus.label}
                        </span>
                      )}
                    </div>
                    
                    {assignment.description && (
                      <p className="text-gray-600 text-sm mb-3">{assignment.description}</p>
                    )}
                    
                    <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        {assignment.assignment_type}
                      </span>
                      {assignment.due_date && (
                        <span className={`flex items-center ${isOverdue && !hasSubmitted ? 'text-red-600' : ''}`}>
                          <Calendar className="h-4 w-4 mr-1" />
                          Échéance: {new Date(assignment.due_date).toLocaleDateString()}
                          {isOverdue && !hasSubmitted && ' (Dépassée)'}
                        </span>
                      )}
                      <span>{assignment.max_points} points</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {/* === BOUTONS ÉTUDIANT === */}
                    {isEtudiant && (
                      <>
                        {!hasSubmitted ? (
                          // Bouton Rendre le devoir
                          <Button 
                            size="sm"
                            onClick={() => setShowSubmitModal(assignment)}
                            disabled={isOverdue}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Rendre mon devoir
                          </Button>
                        ) : (
                          // Bouton voir ma correction
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowCorrectionModal({ 
                              assignment, 
                              submission: submissionStatus!.submission 
                            })}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {submissionStatus?.status === 'corrected' ? 'Voir ma correction' : 'Voir ma soumission'}
                          </Button>
                        )}
                      </>
                    )}

                    {/* === BOUTONS FORMATEUR/ADMIN === */}
                    {canCreateAssignment && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowSubmissionsModal(assignment)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Voir soumissions
                        </Button>
                        
                        {/* Boutons Modifier/Supprimer - uniquement si l'utilisateur peut modifier ce devoir */}
                        {canEditAssignment(assignment) && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setShowEditModal(assignment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 sm:py-12">
          <div className="inline-block p-6 rounded-2xl bg-muted/30 mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucun devoir</h3>
          <p className="text-muted-foreground">
            {canCreateAssignment 
              ? "Créez votre premier devoir pour cette formation."
              : "Aucun devoir n'a encore été publié pour ce module."}
          </p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateAssignmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          moduleId={moduleId}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditModal && (
        <CreateAssignmentModal
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          moduleId={moduleId}
          onSuccess={handleEditSuccess}
          editAssignment={showEditModal}
        />
      )}

      {showSubmissionsModal && (
        <AssignmentSubmissionsModal
          assignment={showSubmissionsModal}
          onClose={() => setShowSubmissionsModal(null)}
        />
      )}

      {showSubmitModal && (
        <SubmitAssignmentModal
          assignment={showSubmitModal}
          onClose={() => setShowSubmitModal(null)}
          onSuccess={handleSubmitSuccess}
        />
      )}

      {showCorrectionModal && (
        <StudentCorrectionViewModal
          submission={showCorrectionModal.submission}
          assignmentTitle={showCorrectionModal.assignment.title}
          onClose={() => setShowCorrectionModal(null)}
        />
      )}
    </div>
  );
};

export default ModuleAssignmentsTab;
