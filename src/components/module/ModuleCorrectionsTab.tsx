import React, { useState, useEffect } from 'react';
import { Edit, CheckCircle, Clock, FileText, Eye, FolderOpen, ChevronDown, ChevronRight, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment, AssignmentSubmission } from '@/services/assignmentService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import CorrectionModal from './CorrectionModal';
import StudentCorrectionViewModal from './StudentCorrectionViewModal';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ModuleCorrectionsTabProps {
  moduleId: string;
}

interface AssignmentWithSubmissions {
  assignment: Assignment;
  submissions: AssignmentSubmission[];
}

const ModuleCorrectionsTab: React.FC<ModuleCorrectionsTabProps> = ({ moduleId }) => {
  const [assignmentsWithSubmissions, setAssignmentsWithSubmissions] = useState<AssignmentWithSubmissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCorrectionModal, setShowCorrectionModal] = useState<AssignmentSubmission | null>(null);
  const [showStudentModal, setShowStudentModal] = useState<{ submission: AssignmentSubmission; title: string } | null>(null);
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());
  
  const { userId, userRole, loading: userLoading } = useCurrentUser();

  const isFormateur = userRole === 'Formateur';
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const canViewCorrections = isFormateur || isAdmin;
  const isEtudiant = userRole === 'Étudiant';

  const canCorrectSubmission = (assignment: Assignment) => {
    if ((isFormateur || isAdmin) && assignment.created_by && assignment.created_by === userId) return true;
    return false;
  };

  const fetchData = async () => {
    if (!userId) return;
    
    try {
      const assignments = await assignmentService.getModuleAssignments(moduleId);
      
      const result: AssignmentWithSubmissions[] = [];
      
      for (const assignment of assignments) {
        const submissions = await assignmentService.getAssignmentSubmissions(assignment.id);
        
        let filteredSubmissions = submissions;
        
        if (isEtudiant) {
          filteredSubmissions = submissions.filter(s => 
            s.student_id === userId && 
            s.correction?.published_at !== null
          );
        }
        
        if (filteredSubmissions.length > 0 || canViewCorrections) {
          result.push({
            assignment,
            submissions: filteredSubmissions
          });
        }
      }
      
      setAssignmentsWithSubmissions(result);
      
      if (canViewCorrections) {
        setExpandedAssignments(new Set(result.map(r => r.assignment.id)));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des corrections:', error);
      toast.error('Erreur lors du chargement des corrections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && userId && userRole) {
      fetchData();
    }
  }, [moduleId, userId, userRole, userLoading]);

  const toggleAssignment = (assignmentId: string) => {
    setExpandedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const handleCorrectionSuccess = () => {
    fetchData();
    setShowCorrectionModal(null);
    toast.success('Correction sauvegardée avec succès');
  };

  const getStatusBadge = (submission: AssignmentSubmission) => {
    if (submission.correction?.is_corrected) {
      if (submission.correction.published_at) {
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">
            <Award className="h-3 w-3 mr-1" />
            Publié ({submission.correction.score}/{submission.correction.max_score})
          </Badge>
        );
      } else {
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Corrigé
          </Badge>
        );
      }
    } else {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          Non corrigé
        </Badge>
      );
    }
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Vue Étudiant
  if (isEtudiant) {
    const myCorrections = assignmentsWithSubmissions
      .flatMap(aws => aws.submissions.map(s => ({ ...s, assignmentTitle: aws.assignment.title })));

    if (myCorrections.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucune correction disponible</h3>
          <p className="text-muted-foreground">
            Vos corrections apparaîtront ici une fois publiées par le formateur.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Mes corrections</h2>
        </div>
        
        <div className="space-y-3">
          {myCorrections.map((submission) => {
            const correction = submission.correction;
            if (!correction) return null;
            
            return (
              <Card key={submission.id} className="overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-2 truncate">
                        {submission.assignmentTitle}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          Rendu le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                        </span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                          <Award className="h-3 w-3 mr-1" />
                          {correction.score ?? '-'}/{correction.max_score ?? '-'}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowStudentModal({ 
                        submission, 
                        title: submission.assignmentTitle 
                      })}
                      className="flex-shrink-0"
                    >
                      <Eye className="h-4 w-4 mr-1.5" />
                      Voir correction
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {showStudentModal && (
          <StudentCorrectionViewModal
            submission={showStudentModal.submission}
            assignmentTitle={showStudentModal.title}
            onClose={() => setShowStudentModal(null)}
          />
        )}
      </div>
    );
  }

  // Vue Formateur/Admin
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Edit className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Corrections des devoirs</h2>
      </div>

      {assignmentsWithSubmissions.length > 0 ? (
        <div className="space-y-4">
          {assignmentsWithSubmissions.map(({ assignment, submissions }) => {
            const isExpanded = expandedAssignments.has(assignment.id);
            const correctedCount = submissions.filter(s => s.correction?.is_corrected).length;
            const publishedCount = submissions.filter(s => s.correction?.published_at).length;
            
            return (
              <Card key={assignment.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleAssignment(assignment.id)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                          <FolderOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{assignment.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <span>{submissions.length} soumission{submissions.length > 1 ? 's' : ''}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span className="text-emerald-600">{correctedCount} corrigée{correctedCount > 1 ? 's' : ''}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span className="text-primary">{publishedCount} publiée{publishedCount > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-border">
                      {submissions.length > 0 ? (
                        <div className="divide-y divide-border/50">
                          {submissions.map((submission) => (
                            <div key={submission.id} className="p-4 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <Avatar className="h-10 w-10 border-2 border-primary/20 flex-shrink-0">
                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-medium text-sm">
                                      {submission.student?.first_name?.[0]}{submission.student?.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground truncate">
                                      {submission.student?.first_name} {submission.student?.last_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Rendu le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {getStatusBadge(submission)}
                                  
                                  {canCorrectSubmission(assignment) && (
                                    <Button 
                                      size="sm" 
                                      variant={submission.correction?.is_corrected ? 'outline' : 'default'}
                                      onClick={() => setShowCorrectionModal(submission)}
                                      className={!submission.correction?.is_corrected ? 'bg-gradient-to-r from-primary to-primary/90' : ''}
                                    >
                                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                                      {submission.correction?.is_corrected ? 'Modifier' : 'Corriger'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Aucune soumission pour ce devoir</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
            <Edit className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucun devoir à corriger</h3>
          <p className="text-muted-foreground">Les soumissions des étudiants apparaîtront ici.</p>
        </div>
      )}

      {showCorrectionModal && (
        <CorrectionModal
          submission={showCorrectionModal}
          onClose={() => setShowCorrectionModal(null)}
          onSuccess={handleCorrectionSuccess}
        />
      )}
    </div>
  );
};

export default ModuleCorrectionsTab;
