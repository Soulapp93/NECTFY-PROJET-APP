import React, { useState } from 'react';
import { Bell, CheckCheck, Clock, Calendar, MessageSquare, FileText, PartyPopper, AlertCircle, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationBell = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
    setIsDialogOpen(true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'schedule_published':
      case 'schedule_update':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'event':
        return <PartyPopper className="h-4 w-4 text-purple-500" />;
      case 'assignment':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'reminder':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-background hover:bg-muted/50';
    switch (type) {
      case 'schedule_published':
      case 'schedule_update':
        return 'bg-blue-50/80 dark:bg-blue-950/30 hover:bg-blue-100/80 dark:hover:bg-blue-900/40';
      case 'message':
        return 'bg-green-50/80 dark:bg-green-950/30 hover:bg-green-100/80 dark:hover:bg-green-900/40';
      case 'event':
        return 'bg-purple-50/80 dark:bg-purple-950/30 hover:bg-purple-100/80 dark:hover:bg-purple-900/40';
      case 'assignment':
        return 'bg-orange-50/80 dark:bg-orange-950/30 hover:bg-orange-100/80 dark:hover:bg-orange-900/40';
      case 'reminder':
        return 'bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/40';
      default:
        return 'bg-primary/5 hover:bg-primary/10';
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0 hover:bg-primary/10">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-lg">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-96 p-0 shadow-xl border-primary/20 bg-card rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                <Bell className="h-4 w-4 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="h-5 px-2 text-[10px] font-bold bg-primary/10 text-primary border border-primary/30">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Tout lire
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[380px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                <p className="text-sm">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Bell className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-sm font-medium">Aucune notification</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Vous êtes à jour !</p>
              </div>
            ) : (
              <div className="py-2 px-2 space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-3 py-3 cursor-pointer transition-all duration-200 rounded-xl border ${
                      notification.is_read 
                        ? 'bg-background hover:bg-muted/50 border-transparent hover:border-border/50' 
                        : 'bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 border-primary/20 shadow-sm'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${
                        notification.is_read 
                          ? 'bg-muted' 
                          : 'bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${!notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-primary mt-1 shadow-sm shadow-primary/50" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock className="h-3 w-3 text-primary/50" />
                          <p className="text-[10px] text-muted-foreground">
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

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-9 text-xs text-primary hover:text-primary hover:bg-primary/10 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Voir toutes les notifications
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {selectedNotification && getNotificationIcon(selectedNotification.type)}
              </div>
              <DialogTitle className="text-base leading-tight">
                {selectedNotification?.title}
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="mt-2">
            {/* Message content */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedNotification?.message}
              </p>
            </div>
            
            {/* Timestamp */}
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {selectedNotification && format(new Date(selectedNotification.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationBell;
