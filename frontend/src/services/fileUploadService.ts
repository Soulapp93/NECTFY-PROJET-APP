
import { supabase } from '@/integrations/supabase/client';

export const fileUploadService = {
  async uploadFile(file: File, bucket: string = 'module-files', userId?: string): Promise<string> {
    try {
      console.log('Uploading file:', file.name, 'to bucket:', bucket);
      
      const fileExt = file.name.split('.').pop();
      let fileName: string;
      
      if (bucket === 'avatars' && userId) {
        // Pour les avatars, utiliser la structure userId/filename
        fileName = `${userId}/avatar.${fileExt}`;
      } else {
        fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      }
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: bucket === 'avatars', // Permettre l'écrasement pour les avatars
          contentType: file.type
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Erreur de téléchargement: ${error.message}`);
      }
      
      console.log('File uploaded successfully:', data);
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('File upload service error:', error);
      throw error;
    }
  },

  async deleteFile(filePath: string, bucket: string = 'module-files') {
    try {
      const fileName = this.getFileName(filePath);
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Erreur de suppression: ${error.message}`);
      }
    } catch (error) {
      console.error('File delete service error:', error);
      throw error;
    }
  },

  getFileName(url: string): string {
    if (!url) return 'fichier';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'fichier';
  }
};
