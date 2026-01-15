import React, { useState, useEffect } from 'react';
import { MessageCircle, Users as UsersIcon } from 'lucide-react';
import { useChatGroups } from '@/hooks/useChatGroups';
import ChatRoom from '@/components/chat/ChatRoom';

const Groupes = () => {
  const { groups, loading } = useChatGroups();
  const establishmentGroup = groups.find(g => g.group_type === 'establishment');

  console.log('📍 Groupes page - loading:', loading, 'groups:', groups.length, 'establishment group:', establishmentGroup);

  // Sélectionner automatiquement le groupe établissement quand il est disponible
  useEffect(() => {
    if (establishmentGroup && !loading) {
      console.log('✅ Establishment group found:', establishmentGroup);
    }
  }, [establishmentGroup, loading]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-primary/10 bg-gradient-to-r from-card via-card/95 to-card/90 backdrop-blur-md shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-xl ring-4 ring-primary/20">
              <UsersIcon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Groupe Établissement
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Communiquez avec tous les membres de l'établissement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-gradient-to-b from-transparent to-muted/10">
            <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <UsersIcon className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground font-medium">Chargement du groupe...</p>
            </div>
          </div>
        ) : establishmentGroup ? (
          <ChatRoom
            groupId={establishmentGroup.id}
            groupName={establishmentGroup.name}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-b from-transparent to-muted/10">
            <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg max-w-md">
              <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
                <MessageCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Aucun groupe établissement
              </h3>
              <p className="text-muted-foreground">
                Le groupe établissement n'a pas encore été créé
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groupes;
