
import React, { useState } from 'react';
import { Save, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

interface SettingsState {
  videoQuality: string;
  audioQuality: string;
  autoRecord: boolean;
  allowScreenShare: boolean;
  chatEnabled: boolean;
  waitingRoom: boolean;
  muteOnEntry: boolean;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    videoQuality: '1080p',
    audioQuality: 'high',
    autoRecord: true,
    allowScreenShare: false,
    chatEnabled: true,
    waitingRoom: true,
    muteOnEntry: true
  });

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos paramètres ont été mis à jour avec succès.",
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Video Conference Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Paramètres de vidéoconférence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="videoQuality">Qualité vidéo</Label>
              <Select 
                value={settings.videoQuality}
                onValueChange={(value) => handleSettingChange('videoQuality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">HD (720p)</SelectItem>
                  <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                  <SelectItem value="4k">4K (2160p)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audioQuality">Qualité audio</Label>
              <Select 
                value={settings.audioQuality}
                onValueChange={(value) => handleSettingChange('audioQuality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">Haute qualité</SelectItem>
                  <SelectItem value="studio">Qualité studio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="autoRecord"
                checked={settings.autoRecord}
                onCheckedChange={(checked) => handleSettingChange('autoRecord', checked)}
              />
              <Label htmlFor="autoRecord">Activer l'enregistrement automatique</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="allowScreenShare"
                checked={settings.allowScreenShare}
                onCheckedChange={(checked) => handleSettingChange('allowScreenShare', checked)}
              />
              <Label htmlFor="allowScreenShare">Autoriser le partage d'écran pour les participants</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="chatEnabled"
                checked={settings.chatEnabled}
                onCheckedChange={(checked) => handleSettingChange('chatEnabled', checked)}
              />
              <Label htmlFor="chatEnabled">Chat activé pendant les cours</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="waitingRoom"
                checked={settings.waitingRoom}
                onCheckedChange={(checked) => handleSettingChange('waitingRoom', checked)}
              />
              <Label htmlFor="waitingRoom">Salle d'attente activée</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="muteOnEntry"
                checked={settings.muteOnEntry}
                onCheckedChange={(checked) => handleSettingChange('muteOnEntry', checked)}
              />
              <Label htmlFor="muteOnEntry">Couper le micro à l'entrée</Label>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
};

export default Settings;
