import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Palette,
  Clock,
  Bell,
  Eye,
  Calendar,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduleSettings {
  theme: 'auto' | 'light' | 'dark';
  defaultView: 'day' | 'week' | 'month' | 'list';
  startHour: number;
  endHour: number;
  showWeekends: boolean;
  showHours: boolean;
  enableNotifications: boolean;
  autoRefresh: boolean;
  compactMode: boolean;
  colorScheme: 'default' | 'modern' | 'pastel' | 'vibrant';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ScheduleSettings;
  onSettingsChange: (settings: ScheduleSettings) => void;
}

const colorSchemes = {
  default: { name: 'Par défaut', colors: ['bg-blue-500', 'bg-green-500', 'bg-pink-500', 'bg-purple-500'] },
  modern: { name: 'Moderne', colors: ['bg-slate-600', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500'] },
  pastel: { name: 'Pastel', colors: ['bg-blue-300', 'bg-green-300', 'bg-pink-300', 'bg-purple-300'] },
  vibrant: { name: 'Vibrant', colors: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500'] }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<ScheduleSettings>(settings);
  const { toast } = useToast();

  const handleSave = () => {
    onSettingsChange(localSettings);
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos préférences ont été mises à jour avec succès",
    });
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: ScheduleSettings = {
      theme: 'auto',
      defaultView: 'week',
      startHour: 8,
      endHour: 18,
      showWeekends: true,
      showHours: true,
      enableNotifications: true,
      autoRefresh: false,
      compactMode: false,
      colorScheme: 'default'
    };
    setLocalSettings(defaultSettings);
    toast({
      title: "Paramètres réinitialisés",
      description: "Les paramètres par défaut ont été restaurés",
    });
  };

  const updateSetting = <K extends keyof ScheduleSettings>(
    key: K,
    value: ScheduleSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Paramètres de l'emploi du temps</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Apparence */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Apparence</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thème</Label>
                <Select 
                  value={localSettings.theme} 
                  onValueChange={(value: any) => updateSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatique</SelectItem>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Schéma de couleurs</Label>
                <Select 
                  value={localSettings.colorScheme} 
                  onValueChange={(value: any) => updateSetting('colorScheme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(colorSchemes).map(([key, scheme]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <span>{scheme.name}</span>
                          <div className="flex space-x-1">
                            {scheme.colors.map((color, index) => (
                              <div key={index} className={`w-3 h-3 ${color} rounded-full`} />
                            ))}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mode compact</Label>
                <p className="text-sm text-muted-foreground">Affichage plus dense</p>
              </div>
              <Switch
                checked={localSettings.compactMode}
                onCheckedChange={(checked) => updateSetting('compactMode', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Affichage */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Affichage</h3>
            </div>

            <div className="space-y-2">
              <Label>Vue par défaut</Label>
              <Select 
                value={localSettings.defaultView} 
                onValueChange={(value: any) => updateSetting('defaultView', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Jour</SelectItem>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                  <SelectItem value="list">Liste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heure de début</Label>
                <Select 
                  value={localSettings.startHour.toString()} 
                  onValueChange={(value) => updateSetting('startHour', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Heure de fin</Label>
                <Select 
                  value={localSettings.endHour.toString()} 
                  onValueChange={(value) => updateSetting('endHour', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Afficher les week-ends</Label>
                <p className="text-sm text-muted-foreground">Inclure samedi et dimanche</p>
              </div>
              <Switch
                checked={localSettings.showWeekends}
                onCheckedChange={(checked) => updateSetting('showWeekends', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Afficher les heures</Label>
                <p className="text-sm text-muted-foreground">Grille horaire visible</p>
              </div>
              <Switch
                checked={localSettings.showHours}
                onCheckedChange={(checked) => updateSetting('showHours', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Notifications</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Activer les notifications</Label>
                <p className="text-sm text-muted-foreground">Rappels pour les cours</p>
              </div>
              <Switch
                checked={localSettings.enableNotifications}
                onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Actualisation automatique</Label>
                <p className="text-sm text-muted-foreground">Synchronisation en temps réel</p>
              </div>
              <Switch
                checked={localSettings.autoRefresh}
                onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Réinitialiser
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};