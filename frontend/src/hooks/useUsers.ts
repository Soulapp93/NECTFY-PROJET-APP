
import { useState, useEffect } from 'react';
import { userService, User, CreateUserData } from '@/services/userService';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData, formationIds: string[] = [], tutorData?: any) => {
    try {
      setLoading(true);
      const newUser = await userService.createUser(userData, formationIds, tutorData);
      setUsers(prev => [newUser, ...prev]);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, userData: Partial<CreateUserData>, formationIds?: string[]) => {
    try {
      setLoading(true);
      const updatedUser = await userService.updateUser(id, userData, formationIds);
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'utilisateur');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserFormations = async (userId: string) => {
    return userService.getUserFormations(userId);
  };

  const deleteUser = async (id: string) => {
    try {
      setLoading(true);
      await userService.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'utilisateur');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkCreateUsers = async (usersData: CreateUserData[]) => {
    try {
      setLoading(true);
      const newUsers = await userService.bulkCreateUsers(usersData);
      setUsers(prev => [...newUsers, ...prev]);
      return newUsers;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import des utilisateurs');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    bulkCreateUsers,
    getUserFormations,
    refetch: fetchUsers
  };
};
