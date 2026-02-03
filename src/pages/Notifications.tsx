import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  Calendar, 
  MessageSquare, 
  FileText, 
  ClipboardList,
  Trash2,
  Filter,
  Search,
  BookOpen,
  Users,
  GraduationCap,
  AlertCircle,
  Check,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notificationService';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'correction':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'attendance':
      case 'attendance_open':
      case 'attendance_reminder':
        return <ClipboardList className="h-5 w-5 text-purple-500" />;
      case 'schedule_published':
      case 'schedule_update':
      case 'schedule_slot_created':
      case 'schedule_slot_cancelled':
        return <Calendar className="h-5 w-5 text-cyan-500" />;
      case 'formation':
        return <GraduationCap className="h-5 w-5 text-indigo-500" />;
      case 'event':
        return <Users className="h-5 w-5 text-pink-500" />;
      case 'reminder':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'message': return 'Message';
      case 'assignment': return 'Devoir';
      case 'correction': return 'Correction';
      case 'attendance':
      case 'attendance_open':
      case 'attendance_reminder':
        return 'Émargement';
      case 'schedule_published':
      case 'schedule_update':
      case 'schedule_slot_created':
      case 'schedule_slot_cancelled':
        return 'Emploi du temps';
      case 'formation': return 'Formation';
      case 'event': return 'Événement';
      case 'reminder': return 'Rappel';
      default: return 'Général';
    }
  };

  const getNotificationBgClass = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-card hover:bg-muted/50';
    
    switch (type) {
      case 'message':
        return 'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/80 dark:hover:bg-blue-900/40';
      case 'assignment':
        return 'bg-orange-50/70 dark:bg-orange-950/30 hover:bg-orange-100/80 dark:hover:bg-orange-900/40';
      case 'correction':
        return 'bg-green-50/70 dark:bg-green-950/30 hover:bg-green-100/80 dark:hover:bg-green-900/40';
      case 'attendance':
      case 'attendance_open':
      case 'attendance_reminder':
        return 'bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100/80 dark:hover:bg-purple-900/40';
      case 'schedule_published':
      case 'schedule_update':
      case 'schedule_slot_created':
      case 'schedule_slot_cancelled':
        return 'bg-cyan-50/70 dark:bg-cyan-950/30 hover:bg-cyan-100/80 dark:hover:bg-cyan-900/40';
      case 'formation':
        return 'bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40';
      default:
        return 'bg-primary/5 hover:bg-primary/10';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
    setIsDetailOpen(true);
  };

  const handleNavigateToAction = (notification: Notification) => {
    const actionUrl = notification.metadata?.action_url;
    if (actionUrl) {
      setIsDetailOpen(false);
      // IMPORTANT: si c'est une URL absolue (https://...), react-router la transforme en route "/https://..." => 404
      if (/^https?:\/\//i.test(actionUrl)) {
        window.location.assign(actionUrl);
        return;
      }
      navigate(actionUrl);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      toast.success('Notification supprimée');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleClearReadNotifications = async () => {
    try {
      const { data: { user } } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
      if (user) {
        await notificationService.deleteAllReadNotifications(user.id);
        toast.success('Notifications lues supprimées');
        refetch();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    // Filtre par onglet
    if (activeTab === 'unread' && notification.is_read) return false;
    
    // Filtre par type
    if (typeFilter !== 'all') {
      const typeGroups: Record<string, string[]> = {
        'message': ['message'],
        'assignment': ['assignment', 'correction'],
        'attendance': ['attendance', 'attendance_open', 'attendance_reminder'],
        'schedule': ['schedule_published', 'schedule_update', 'schedule_slot_created', 'schedule_slot_cancelled'],
        'formation': ['formation'],
        'event': ['event'],
      };
      
      if (typeGroups[typeFilter] && !typeGroups[typeFilter].includes(notification.type)) {
        return false;
      }
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const notificationTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'message', label: 'Messages' },
    { value: 'assignment', label: 'Devoirs' },
    { value: 'attendance', label: 'Émargement' },
    { value: 'schedule', label: 'Emploi du temps' },
    { value: 'formation', label: 'Formations' },
    { value: 'event', label: 'Événements' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">Notifications</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                  {unreadCount > 0 
                    ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` 
                    : 'Aucune nouvelle notification'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Tout marquer comme lu</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="all" className="gap-2">
            <Bell className="h-4 w-4" />
            Toutes ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Non lues ({unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
              <CardTitle className="text-sm font-medium">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </CardTitle>
              
              {notifications.some(n => n.is_read) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Supprimer les lues
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer les notifications lues ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action supprimera définitivement toutes vos notifications déjà lues.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearReadNotifications}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardHeader>
            
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 py-12 text-muted-foreground">
                  <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                  <p className="text-sm">Chargement...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 py-12 text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Bell className="h-8 w-8 text-primary/40" />
                  </div>
                  <p className="text-sm font-medium">Aucune notification</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {searchQuery || typeFilter !== 'all' 
                      ? 'Essayez de modifier vos filtres'
                      : 'Vous êtes à jour !'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-4 cursor-pointer transition-all duration-200 ${getNotificationBgClass(notification.type, notification.is_read)}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ${
                          notification.is_read 
                            ? 'bg-muted' 
                            : 'bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm leading-tight ${!notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                                  {notification.title}
                                </p>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {getNotificationTypeLabel(notification.type)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.is_read && (
                                <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-2">
                            <Clock className="h-3 w-3 text-primary/50" />
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: fr
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                selectedNotification?.is_read 
                  ? 'bg-muted' 
                  : 'bg-gradient-to-br from-primary/20 to-primary/10'
              }`}>
                {selectedNotification && getNotificationIcon(selectedNotification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base leading-tight">
                  {selectedNotification?.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {selectedNotification && getNotificationTypeLabel(selectedNotification.type)}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Message */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedNotification?.message}
              </p>
            </div>
            
            {/* Metadata */}
            {selectedNotification?.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1">
                {selectedNotification.metadata.date && (
                  <p>Date: {new Date(selectedNotification.metadata.date).toLocaleDateString('fr-FR')}</p>
                )}
                {selectedNotification.metadata.start_time && selectedNotification.metadata.end_time && (
                  <p>Horaire: {selectedNotification.metadata.start_time} - {selectedNotification.metadata.end_time}</p>
                )}
              </div>
            )}
            
            {/* Timestamp */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {selectedNotification && format(
                  new Date(selectedNotification.created_at), 
                  "d MMMM yyyy 'à' HH:mm", 
                  { locale: fr }
                )}
              </span>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                if (selectedNotification) {
                  handleDeleteNotification(selectedNotification.id);
                  setIsDetailOpen(false);
                }
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
            
            {selectedNotification?.metadata?.action_url && (
              <Button onClick={() => handleNavigateToAction(selectedNotification)}>
                Voir les détails
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default Notifications;
