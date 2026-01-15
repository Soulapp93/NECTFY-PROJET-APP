import { supabase } from '@/integrations/supabase/client';

export interface TextBook {
  id: string;
  formation_id: string;
  academic_year: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  formations?: {
    title: string;
    color?: string;
  };
}

export interface TextBookEntry {
  id: string;
  text_book_id: string;
  date: string;
  start_time: string;
  end_time: string;
  subject_matter: string;
  content?: string;
  homework?: string;
  instructor_id?: string;
  created_at: string;
  updated_at: string;
  files?: TextBookEntryFile[];
}

export interface TextBookEntryFile {
  id: string;
  text_book_entry_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  content_type?: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export const textBookService = {
  async createTextBook(data: { formation_id: string; academic_year: string; created_by?: string }) {
    console.log('Création de cahier de texte:', data);
    
    const { data: textBook, error } = await supabase
      .from('text_books')
      .insert([data])
      .select(`
        *,
        formations (
          title,
          color
        )
      `)
      .single();

    if (error) {
      console.error('Erreur lors de la création du cahier de texte:', error);
      throw new Error(`Erreur lors de la création du cahier de texte: ${error.message}`);
    }

    console.log('Cahier de texte créé:', textBook);
    return textBook;
  },

  async getTextBooks() {
    console.log('Récupération des cahiers de texte...');
    
    const { data, error } = await supabase
      .from('text_books')
      .select(`
        *,
        formations (
          title,
          color
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des cahiers de texte:', error);
      throw new Error(`Erreur lors de la récupération des cahiers de texte: ${error.message}`);
    }

    console.log('Cahiers de texte récupérés:', data);
    return data;
  },

  async getTextBookByFormationId(formationId: string) {
    console.log('Récupération du cahier de texte pour la formation:', formationId);
    
    const { data, error } = await supabase
      .from('text_books')
      .select(`
        *,
        formations (
          title,
          color
        )
      `)
      .eq('formation_id', formationId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du cahier de texte:', error);
      throw new Error(`Erreur lors de la récupération du cahier de texte: ${error.message}`);
    }

    console.log('Cahier de texte récupéré:', data);
    return data;
  },

  async getTextBookEntries(textBookId: string) {
    console.log('Récupération des entrées du cahier de texte:', textBookId);
    
    const { data, error } = await supabase
      .from('text_book_entries')
      .select(`
        *,
        files:text_book_entry_files(*)
      `)
      .eq('text_book_id', textBookId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des entrées:', error);
      throw new Error(`Erreur lors de la récupération des entrées: ${error.message}`);
    }

    console.log('Entrées récupérées:', data);
    return data;
  },

  async createTextBookEntry(data: Omit<TextBookEntry, 'id' | 'created_at' | 'updated_at' | 'files'>) {
    console.log('Création d\'entrée de cahier de texte:', data);
    
    const { data: entry, error } = await supabase
      .from('text_book_entries')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'entrée:', error);
      throw new Error(`Erreur lors de la création de l'entrée: ${error.message}`);
    }

    console.log('Entrée créée:', entry);
    return entry;
  },

  async uploadEntryFiles(entryId: string, files: File[]) {
    console.log('Upload de fichiers pour l\'entrée:', entryId, files.length, 'fichiers');
    
    const uploadedFiles: TextBookEntryFile[] = [];
    
    for (const file of files) {
      try {
        // Upload file to storage
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('module-files')
          .upload(`text-book-entries/${entryId}/${fileName}`, file);

        if (uploadError) {
          console.error('Erreur upload storage:', uploadError);
          throw new Error(`Erreur upload: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('module-files')
          .getPublicUrl(uploadData.path);

        // Save file info to database
        const { data: fileData, error: dbError } = await supabase
          .from('text_book_entry_files')
          .insert([{
            text_book_entry_id: entryId,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            content_type: file.type || undefined,
          }])
          .select()
          .single();

        if (dbError) {
          console.error('Erreur sauvegarde DB:', dbError);
          throw new Error(`Erreur sauvegarde: ${dbError.message}`);
        }

        uploadedFiles.push(fileData);
      } catch (error) {
        console.error('Erreur upload fichier:', file.name, error);
        throw error;
      }
    }

    console.log('Fichiers uploadés:', uploadedFiles);
    return uploadedFiles;
  },

  async updateTextBookEntry(entryId: string, data: Partial<Omit<TextBookEntry, 'id' | 'created_at' | 'updated_at' | 'files'>>) {
    console.log('Modification d\'entrée de cahier de texte:', entryId, data);
    
    const { data: entry, error } = await supabase
      .from('text_book_entries')
      .update(data)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la modification de l\'entrée:', error);
      throw new Error(`Erreur lors de la modification de l'entrée: ${error.message}`);
    }

    console.log('Entrée modifiée:', entry);
    return entry;
  },

  async deleteTextBookEntry(entryId: string) {
    console.log('Suppression d\'entrée de cahier de texte:', entryId);
    
    const { error } = await supabase
      .from('text_book_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'entrée:', error);
      throw new Error(`Erreur lors de la suppression de l'entrée: ${error.message}`);
    }

    console.log('Entrée supprimée avec succès');
  },

  async deleteEntryFile(fileId: string) {
    console.log('Suppression du fichier:', fileId);
    
    const { error } = await supabase
      .from('text_book_entry_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw new Error(`Erreur lors de la suppression du fichier: ${error.message}`);
    }

    console.log('Fichier supprimé avec succès');
  },

  async archiveTextBook(textBookId: string) {
    console.log('Archivage du cahier de texte:', textBookId);
    
    // Pour l'instant, nous simulons l'archivage
    // En production, vous devriez ajouter un champ status ou archived dans la table
    const { error } = await supabase
      .from('text_books')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', textBookId);

    if (error) {
      console.error('Erreur lors de l\'archivage:', error);
      throw new Error(`Erreur lors de l'archivage: ${error.message}`);
    }

    console.log('Cahier de texte archivé avec succès');
  }
};