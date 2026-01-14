import React, { useMemo, useState } from 'react';
import { Plus, Search, Filter, Upload, Download, MoreVertical, Edit, Trash2, Mail, X, ChevronDown, KeyRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingState } from '@/components/ui/loading-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { useUsers } from '@/hooks/useUsers';
import { useAllUserFormations } from '@/hooks/useAllUserFormations';
import { useUserTutors } from '@/hooks/useUserTutors';
import { User, CreateUserData } from '@/services/userService';
import { invitationService } from '@/services/invitationService';
import SimplifiedUserModal from './SimplifiedUserModal';
import UserDetailModal from './UserDetailModal';
import ExcelImport from './ExcelImport';
import ChangeRoleModal from './ChangeRoleModal';
import SendMessageModal from './SendMessageModal';
import ExportUsersModal from './ExportUsersModal';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const EnhancedUsersList: React.FC = () => {
  const { users, loading, error, createUser, updateUser, deleteUser, bulkCreateUsers, getUserFormations: getUserFormationsFromHook, refetch } = useUsers();
  const { getUserTutors } = useUserTutors();
  const userIds = useMemo(() => users.map((u) => u.id).filter(Boolean), [users]);
  const { getUserFormations, refetch: refetchFormations } = useAllUserFormations(userIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isStudentExcelImportOpen, setIsStudentExcelImportOpen] = useState(false);
  const [isInstructorExcelImportOpen, setIsInstructorExcelImportOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [preselectedRole, setPreselectedRole] = useState<'Admin' | 'Formateur' | 'Étudiant' | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === '' || selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === '' || selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = (role?: 'Admin' | 'Formateur' | 'Étudiant') => {
    setSelectedUser(null);
    setModalMode('create');
    setPreselectedRole(role || null);
    setIsUserModalOpen(true);
  };

  const handleCreateInstructor = () => {
    handleCreateUser('Formateur');
  };

  const handleCreateAdmin = () => {
    handleCreateUser('Admin');
  };

  const handleCreateStudent = () => {
    handleCreateUser('Étudiant');
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalMode('edit');
    setPreselectedRole(null);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      await deleteUser(userId);
    }
  };

  const handleSaveUser = async (userData: CreateUserData, formationIds: string[], tutorData?: any) => {
    if (modalMode === 'create') {
      const created = await createUser(userData, formationIds, tutorData);
      // garantir la synchro de la table (et des relations)
      await refetch();
      await refetchFormations();
      return created;
    } else if (selectedUser) {
      const updated = await updateUser(selectedUser.id!, userData, formationIds);
      await refetch();
      await refetchFormations();
      return updated;
    }
    throw new Error('Mode invalide');
  };

  const loadUserFormations = async (userId: string): Promise<string[]> => {
    return await getUserFormationsFromHook(userId);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailModalOpen(true);
  };

  const handleExcelImport = async (usersData: CreateUserData[]) => {
    await bulkCreateUsers(usersData);
  };
  const exportUsers = () => {
    const exportData = filteredUsers.map(user => {
      const userFormations = getUserFormations(user.id!);
      const formationsText = userFormations
        .map(assignment => `${assignment.formation.title} (${assignment.formation.level})`)
        .join(', ');

      return {
        'Prénom': user.first_name,
        'Nom': user.last_name,
        'Email': user.email,
        'Rôle': user.role,
        'Formations': formationsText || 'Aucune formation',
        'Statut': user.status,
        'Date de création': user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    
    const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const isValidEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    // Bloque explicitement les emails avec virgule (cas fréquent de faute de frappe)
    if (normalized.includes(',')) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  };

  const sendInvitation = async (user: User) => {
    const email = user.email.trim().toLowerCase();

    if (!isValidEmail(email)) {
      toast.error(`Email invalide: ${user.email}`);
      return;
    }

    try {
      // Retrouver une invitation en attente pour cet email
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select('id')
        .eq('email', email)
        .eq('status', 'pending' as any)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (invitationError) throw invitationError;

      if (!invitation?.id) {
        toast.error("Aucune invitation en attente trouvée pour cet utilisateur");
        return;
      }

      const result = await invitationService.resendInvitation(invitation.id);

      if (result.success) {
        toast.success(`Invitation renvoyée à ${email}`);
      } else {
        toast.error(result.error || "Erreur lors du renvoi de l'invitation");
      }
    } catch (err: any) {
      console.error("Erreur lors du renvoi de l'invitation:", err);
      toast.error(err?.message || "Erreur lors du renvoi de l'invitation");
    }
  };

  // Helper function to send activation link
  const sendActivationLink = async (email: string, accessToken: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.id) {
      toast.info("Ce compte n'est pas encore activé. Envoi du lien d'activation...");
      try {
        const activationResponse = await supabase.functions.invoke('send-user-activation', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: { userId: user.id },
        });
        
        if (activationResponse.error || activationResponse.data?.error) {
          throw new Error(activationResponse.data?.error || activationResponse.error?.message);
        }
        
        toast.success(`Lien d'activation envoyé à ${email}`);
      } catch (activationError: any) {
        console.error("Erreur lors de l'envoi du lien d'activation:", activationError);
        toast.error(activationError?.message || "Impossible d'envoyer le lien d'activation. Veuillez réessayer.");
      }
    } else {
      toast.error("Utilisateur non trouvé");
    }
  };

  const handleResetPassword = async (emailRaw: string) => {
    const email = emailRaw.trim().toLowerCase();

    if (!isValidEmail(email)) {
      toast.error(`Email invalide: ${emailRaw}`);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Session expirée : reconnectez-vous puis réessayez.');
      }

      const redirectUrl = `${window.location.origin}/reset-password`;

      const response = await supabase.functions.invoke('send-password-reset', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { email, redirectUrl },
      });

      const data = response.data;
      const error = response.error;

      // Handle 409 - account not activated, need to resend activation
      // Check both data and error for activation required signal
      const isNotActivated = 
        data?.action === 'resend_invitation' || 
        data?.error === 'Compte non activé' ||
        error?.message?.includes('non-2xx');

      if (isNotActivated) {
        await sendActivationLink(email, session.access_token);
        return;
      }

      if (error) throw error;

      // si la fonction renvoie une erreur applicative dans le body
      if ((data as any)?.error) throw new Error((data as any).error);

      toast.success(`Lien de réinitialisation NECTFY envoyé à ${email}`);
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du lien:", error);
      
      // Also check in catch block for 409/non-activated scenario
      if (error?.message?.includes('non-2xx') || error?.message?.includes('409')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await sendActivationLink(email, session.access_token);
          return;
        }
      }
      
      toast.error(error?.message || "Erreur lors de l'envoi du lien de réinitialisation");
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      await updateUser(userId, { ...user, role: newRole as any });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id!));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleCancelSelection = () => {
    setSelectedUsers([]);
    setBulkAction('');
  };

  const handleApplyBulkAction = async () => {
    if (!bulkAction) {
      toast.error('Veuillez choisir une action');
      return;
    }

    const selectedUserData = users.filter(user => selectedUsers.includes(user.id!));

    switch (bulkAction) {
      case 'activate':
        // Logique pour activer les utilisateurs
        for (const user of selectedUserData) {
          await updateUser(user.id!, { ...user, status: 'Actif' as any });
        }
        toast.success(`${selectedUsers.length} utilisateur(s) activé(s)`);
        break;
      
      case 'deactivate':
        // Logique pour désactiver les utilisateurs
        for (const user of selectedUserData) {
          await updateUser(user.id!, { ...user, status: 'Inactif' as any });
        }
        toast.success(`${selectedUsers.length} utilisateur(s) désactivé(s)`);
        break;
      
      case 'change-role':
        setIsChangeRoleModalOpen(true);
        return; // Don't cancel selection yet
      
      case 'send-email':
        setIsSendMessageModalOpen(true);
        return; // Don't cancel selection yet
      
      case 'reset-password':
        for (const user of selectedUserData) {
          await handleResetPassword(user.email);
        }
        toast.success(`Lien de réinitialisation envoyé à ${selectedUsers.length} utilisateur(s)`);
        break;
      
      case 'export':
        setIsExportModalOpen(true);
        return; // Don't cancel selection yet
      
      case 'delete':
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedUsers.length} utilisateur(s) ?`)) {
          for (const userId of selectedUsers) {
            await deleteUser(userId);
          }
          toast.success(`${selectedUsers.length} utilisateur(s) supprimé(s)`);
        }
        break;
    }

    handleCancelSelection();
  };

  if (loading && users.length === 0) {
    return <LoadingState message="Chargement des utilisateurs..." />;
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-8">
        <div className="text-center">
          <div className="text-destructive mb-2">Erreur</div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length;
  const isSomeSelected = selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length;

  return (
    <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20">
      {/* Bandeau de sélection */}
      {selectedUsers.length > 0 && (
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <Checkbox 
                  checked={true}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
                />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-muted-foreground">
                  Choisissez une action à appliquer à la sélection
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] justify-between">
                    {bulkAction === 'activate' && 'Activer les utilisateurs'}
                    {bulkAction === 'deactivate' && 'Désactiver les utilisateurs'}
                    {bulkAction === 'change-role' && 'Modifier le rôle'}
                    {bulkAction === 'send-email' && 'Envoyer un email'}
                    {bulkAction === 'reset-password' && 'Réinitialiser mot de passe'}
                    {bulkAction === 'export' && 'Exporter la sélection'}
                    {bulkAction === 'delete' && 'Supprimer les utilisateurs'}
                    {!bulkAction && 'Choisir une action'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px]">
                  <DropdownMenuItem onClick={() => setBulkAction('activate')}>
                    Activer les utilisateurs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction('deactivate')}>
                    Désactiver les utilisateurs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction('change-role')}>
                    Modifier le rôle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction('send-email')}>
                    Envoyer un email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction('reset-password')}>
                    Réinitialiser mot de passe
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction('export')}>
                    Exporter la sélection
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setBulkAction('delete')}
                    className="text-destructive focus:text-destructive"
                  >
                    Supprimer les utilisateurs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={handleApplyBulkAction} variant="default">
                Appliquer
              </Button>
              
              <Button onClick={handleCancelSelection} variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="p-3 sm:p-4 lg:p-6 border-b border-primary/10">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                Gestion des utilisateurs
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Action buttons - responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
            <Button
              onClick={exportUsers}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-full border-2 border-primary text-primary hover:bg-primary/10"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Exporter</span>
            </Button>
            <Button
              onClick={() => setIsInstructorExcelImportOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-full border-2 border-primary text-primary hover:bg-primary/10"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Importer Formateurs</span>
              <span className="sm:hidden">Form.</span>
            </Button>
            <Button
              onClick={() => setIsStudentExcelImportOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-full border-2 border-green-500 text-green-600 hover:bg-green-50"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Importer Étudiants</span>
              <span className="sm:hidden">Étud.</span>
            </Button>
            <Button
              onClick={handleCreateAdmin}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-full border-2 border-slate-400 text-slate-600 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Ajouter Admin</span>
              <span className="sm:hidden">Admin</span>
            </Button>
            <Button
              onClick={handleCreateInstructor}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Ajouter Formateur</span>
              <span className="sm:hidden">Form.</span>
            </Button>
            <Button
              onClick={handleCreateStudent}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Ajouter Étudiant</span>
              <span className="sm:hidden">Étud.</span>
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col gap-3 mt-4 sm:mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm border-2 border-primary/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm border-2 border-primary/30 rounded-xl">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="Admin">Administrateur</SelectItem>
                <SelectItem value="Formateur">Formateur</SelectItem>
                <SelectItem value="Étudiant">Étudiant</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm border-2 border-primary/30 rounded-xl">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Inactif">Inactif</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Sélectionner tous les utilisateurs"
                  className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
              <TableHead>Nom & Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Formations</TableHead>
              <TableHead>Tuteurs</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {filteredUsers.map((user) => {
              const userFormations = getUserFormations(user.id!);
              const userTutorsList = getUserTutors(user.id!);
              const isSelected = selectedUsers.includes(user.id!);
              
              return (
                <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectUser(user.id!, checked as boolean)}
                      aria-label={`Sélectionner ${user.first_name} ${user.last_name}`}
                    />
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {user.profile_photo_url ? (
                          <img 
                            src={user.profile_photo_url} 
                            alt={`Photo de profil de ${user.first_name} ${user.last_name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-primary">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {user.first_name} {user.last_name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    <div className="text-sm text-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    {<RoleBadge role={user.role} />}
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    <div className="max-w-xs">
                      {user.role === 'Admin' ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : userFormations.length > 0 ? (
                        <div className="space-y-1">
                          {userFormations.slice(0, 2).map((assignment) => (
                            <div key={assignment.id} className="text-xs bg-info/10 text-info px-2 py-1 rounded-full inline-block mr-1">
                              {assignment.formation.title}
                            </div>
                          ))}
                          {userFormations.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{userFormations.length - 2} autre{userFormations.length - 2 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucune formation</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    <div className="max-w-xs">
                      {user.role === 'Étudiant' && userTutorsList.length > 0 ? (
                        <div className="space-y-1">
                          {userTutorsList.slice(0, 2).map((tutor, index) => (
                            <div key={index} className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full inline-block mr-1">
                              {tutor.tutor_first_name} {tutor.tutor_last_name}
                            </div>
                          ))}
                          {userTutorsList.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{userTutorsList.length - 2} autre{userTutorsList.length - 2 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {user.role === 'Étudiant' ? 'Aucun tuteur' : '-'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    {<StatusBadge status={user.status} type="user" />}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {user.status === 'En attente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendInvitation(user)}
                          className="h-8 w-8 p-0"
                          title="Renvoyer l'invitation"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetPassword(user.email)}
                        className="h-8 w-8 p-0"
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 p-0"
                        title="Modifier l'utilisateur"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id!)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Aucun utilisateur trouvé</div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SimplifiedUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        mode={modalMode}
        preselectedRole={preselectedRole}
        loadUserFormations={loadUserFormations}
      />

      <UserDetailModal
        isOpen={isUserDetailModalOpen}
        onClose={() => setIsUserDetailModalOpen(false)}
        user={selectedUser}
      />

      {isExcelImportOpen && (
        <ExcelImport
          onImport={handleExcelImport}
          onClose={() => setIsExcelImportOpen(false)}
        />
      )}

      {isInstructorExcelImportOpen && (
        <ExcelImport
          onImport={handleExcelImport}
          onClose={() => setIsInstructorExcelImportOpen(false)}
          preselectedRole="Formateur"
        />
      )}

      {isStudentExcelImportOpen && (
        <ExcelImport
          onImport={handleExcelImport}
          onClose={() => setIsStudentExcelImportOpen(false)}
          preselectedRole="Étudiant"
        />
      )}

      <ChangeRoleModal
        isOpen={isChangeRoleModalOpen}
        onClose={() => {
          setIsChangeRoleModalOpen(false);
          handleCancelSelection();
        }}
        selectedUsers={users.filter(u => selectedUsers.includes(u.id!)).map(u => ({
          id: u.id!,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          role: u.role
        }))}
        onSave={handleChangeRole}
      />

      <SendMessageModal
        isOpen={isSendMessageModalOpen}
        onClose={() => {
          setIsSendMessageModalOpen(false);
          handleCancelSelection();
        }}
        recipients={users.filter(u => selectedUsers.includes(u.id!)).map(u => ({
          id: u.id!,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name
        }))}
      />

      <ExportUsersModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          handleCancelSelection();
        }}
        users={users.filter(u => selectedUsers.includes(u.id!)).map(u => {
          const userFormations = getUserFormations(u.id!);
          const formationsText = userFormations
            .map(assignment => `${assignment.formation.title} (${assignment.formation.level})`)
            .join(', ');
          
          return {
            id: u.id!,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            role: u.role,
            status: u.status,
            created_at: u.created_at,
            formations: formationsText || 'Aucune formation'
          };
        })}
      />
    </div>
  );
};

export default EnhancedUsersList;
