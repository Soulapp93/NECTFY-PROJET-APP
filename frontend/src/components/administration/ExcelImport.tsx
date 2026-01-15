
import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/services/userService';
import * as XLSX from 'xlsx';

interface ExcelImportProps {
  onImport: (users: Omit<User, 'id' | 'created_at' | 'updated_at'>[], formationIds?: string[]) => Promise<void>;
  onClose: () => void;
  preselectedRole?: 'Étudiant' | 'Formateur';
}

const ExcelImport: React.FC<ExcelImportProps> = ({ onImport, onClose, preselectedRole }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      try {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Mapper les données Excel vers notre format
        const mappedData = jsonData.map((row: any) => ({
          first_name: row['Prénom'] || row['prénom'] || row['First Name'] || row['first_name'] || '',
          last_name: row['Nom'] || row['nom'] || row['Last Name'] || row['last_name'] || '',
          email: row['Email'] || row['email'] || '',
          role: preselectedRole || row['Rôle'] || row['Role'] || row['role'] || 'Étudiant',
          status: 'En attente',
          formationIds: row['Formation(s)'] || row['Formations'] || row['formations'] || ''
        }));

        // Valider les données
        const validData = mappedData.filter(user => 
          user.first_name && user.last_name && user.email
        );

        if (validData.length === 0) {
          setError('Aucune donnée valide trouvée dans le fichier. Vérifiez que les colonnes sont correctement nommées.');
        } else {
          setPreviewData(validData);
        }
      } catch (err) {
        setError('Erreur lors de la lecture du fichier Excel. Veuillez vérifier le format du fichier.');
      }
    }
  };

  const handleImport = async () => {
    if (!previewData.length) return;

    try {
      setImporting(true);
      
      // Préparer les données utilisateurs (on ignore la colonne Formation(s) pour l'instant)
      const usersWithFormations = previewData.map((user: any) => {
        const { formationIds, ...userData } = user;
        return userData;
      });
      
      await onImport(usersWithFormations as Omit<User, 'id' | 'created_at' | 'updated_at'>[]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };
  const downloadTemplate = () => {
    // Créer un template Excel selon le rôle
    let template;
    let fileName;

    if (preselectedRole === 'Étudiant') {
      template = [
        {
          'Prénom': 'Jean',
          'Nom': 'Dupont',
          'Email': 'jean.dupont@exemple.com',
          'Formation(s)': 'Formation Web, Formation Mobile'
        },
        {
          'Prénom': 'Marie',
          'Nom': 'Martin', 
          'Email': 'marie.martin@exemple.com',
          'Formation(s)': 'Formation Web'
        },
        {
          'Prénom': 'Sophie',
          'Nom': 'Bernard',
          'Email': 'sophie.bernard@exemple.com',
          'Formation(s)': 'Formation Design'
        },
        {
          'Prénom': 'Lucas',
          'Nom': 'Petit',
          'Email': 'lucas.petit@exemple.com',
          'Formation(s)': 'Formation Mobile, Formation Design'
        }
      ];
      fileName = 'Modele_Import_Etudiants.xlsx';
    } else if (preselectedRole === 'Formateur') {
      template = [
        {
          'Prénom': 'Pierre',
          'Nom': 'Dupont',
          'Email': 'pierre.dupont@exemple.com',
          'Formation(s)': 'Formation Web, Formation Mobile'
        },
        {
          'Prénom': 'Marc',
          'Nom': 'Lefebvre',
          'Email': 'marc.lefebvre@exemple.com',
          'Formation(s)': 'Formation Design'
        },
        {
          'Prénom': 'Sophie',
          'Nom': 'Bernard',
          'Email': 'sophie.bernard@exemple.com',
          'Formation(s)': 'Formation Web'
        },
        {
          'Prénom': 'Anne',
          'Nom': 'Moreau',
          'Email': 'anne.moreau@exemple.com',
          'Formation(s)': 'Formation Mobile, Formation Design'
        }
      ];
      fileName = 'Modele_Import_Formateurs.xlsx';
    } else {
      template = [
        {
          'Prénom': 'Jean',
          'Nom': 'Dupont',
          'Email': 'jean.dupont@exemple.com',
          'Rôle': 'Étudiant',
          'Formation(s)': 'Formation Web'
        },
        {
          'Prénom': 'Pierre',
          'Nom': 'Durand',
          'Email': 'pierre.durand@exemple.com',
          'Rôle': 'Formateur',
          'Formation(s)': 'Formation Mobile'
        }
      ];
      fileName = 'Modele_Import_Utilisateurs.xlsx';
    }

    // Créer la feuille Excel
    const ws = XLSX.utils.json_to_sheet(template);
    
    // Définir la largeur des colonnes pour une meilleure lisibilité
    const hasRoleColumn = !preselectedRole;
    ws['!cols'] = hasRoleColumn ? [
      { wch: 18 }, // Prénom
      { wch: 18 }, // Nom
      { wch: 35 }, // Email
      { wch: 15 }, // Rôle
      { wch: 45 }  // Formation(s)
    ] : [
      { wch: 18 }, // Prénom
      { wch: 18 }, // Nom
      { wch: 35 }, // Email
      { wch: 50 }  // Formation(s)
    ];

    // Appliquer un style professionnel aux en-têtes (première ligne)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      // Appliquer le style aux en-têtes
      ws[cellAddress].s = {
        fill: {
          fgColor: { rgb: "4472C4" } // Bleu professionnel Excel
        },
        font: {
          bold: true,
          color: { rgb: "FFFFFF" },
          sz: 11,
          name: "Calibri"
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: false
        },
        border: {
          top: { style: "thin", color: { rgb: "FFFFFF" } },
          bottom: { style: "thin", color: { rgb: "FFFFFF" } },
          left: { style: "thin", color: { rgb: "FFFFFF" } },
          right: { style: "thin", color: { rgb: "FFFFFF" } }
        }
      };
    }

    // Appliquer des styles aux cellules de données
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          font: {
            sz: 11,
            name: "Calibri",
            color: { rgb: "000000" }
          },
          alignment: {
            horizontal: "left",
            vertical: "center",
            wrapText: false
          },
          border: {
            top: { style: "thin", color: { rgb: "D3D3D3" } },
            bottom: { style: "thin", color: { rgb: "D3D3D3" } },
            left: { style: "thin", color: { rgb: "D3D3D3" } },
            right: { style: "thin", color: { rgb: "D3D3D3" } }
          }
        };
      }
    }

    // Créer le classeur et ajouter la feuille
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    
    // Télécharger le fichier avec support des styles
    XLSX.writeFile(wb, fileName, { cellStyles: true, bookType: 'xlsx' });
  };

  const triggerFileSelect = () => {
    const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-primary/20">
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <h2 className="text-xl font-semibold text-foreground">
          Import Excel des {preselectedRole === 'Étudiant' ? 'étudiants' : preselectedRole === 'Formateur' ? 'formateurs' : 'utilisateurs'}
        </h2>
        <p className="text-muted-foreground mt-1">
          Importez plusieurs {preselectedRole === 'Étudiant' ? 'étudiants' : preselectedRole === 'Formateur' ? 'formateurs' : 'utilisateurs'} à partir d'un fichier Excel
        </p>
      </div>

        <div className="p-6">
          {!file ? (
            <div className="text-center py-8">
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 bg-primary/5 hover:bg-primary/10 transition-colors">
                <FileText className="h-12 w-12 text-primary/60 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Sélectionnez un fichier Excel
                </h3>
                <p className="text-muted-foreground mb-4">
                  Formats acceptés : .xlsx, .xls
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="flex items-center gap-2 rounded-xl border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le modèle
                  </Button>
                  <Button
                    onClick={triggerFileSelect}
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <Upload className="h-4 w-4" />
                    Sélectionner un fichier
                  </Button>
                  <input
                    id="excel-file-input"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Instructions d'utilisation */}
              <div className="mt-6 text-left bg-primary/5 p-4 rounded-xl border-2 border-primary/20">
                <h4 className="font-medium text-primary mb-2">Instructions :</h4>
                <ul className="text-sm text-primary/80 space-y-1">
                  <li>• Les colonnes requises sont : Prénom, Nom, Email{!preselectedRole && ', Rôle'}, Formation(s)</li>
                  <li>• Dans la colonne "Formation(s)", séparez les formations par des virgules</li>
                  <li>• Exemple : "Formation Web, Formation Mobile, Formation Design"</li>
                  {preselectedRole && (
                    <li>• Le rôle sera automatiquement défini comme "{preselectedRole}"</li>
                  )}
                  <li>• Téléchargez le modèle Excel pré-formaté pour commencer</li>
                  <li>• Ne modifiez pas la mise en forme du fichier, utilisez-le tel quel</li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-primary/5 border-2 border-primary/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">{file.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setPreviewData([]);
                      setError(null);
                    }}
                    className="ml-auto rounded-xl border-2 border-primary/30 hover:border-primary/50"
                  >
                    Changer de fichier
                  </Button>
                </div>
              </div>

              {previewData.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Aperçu des données ({previewData.length} {preselectedRole === 'Étudiant' ? 'étudiants' : preselectedRole === 'Formateur' ? 'formateurs' : 'utilisateurs'})
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border border-2 border-primary/20 rounded-xl overflow-hidden">
                       <thead className="bg-muted/50">
                         <tr>
                           <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                             Prénom
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                             Nom
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                             Email
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                             Rôle
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                             Formations
                           </th>
                         </tr>
                       </thead>
                       <tbody className="bg-background divide-y divide-border">
                         {previewData.slice(0, 10).map((user: any, index) => (
                           <tr key={index} className="hover:bg-muted/30 transition-colors">
                             <td className="px-4 py-3 text-sm text-foreground">{user.first_name}</td>
                             <td className="px-4 py-3 text-sm text-foreground">{user.last_name}</td>
                             <td className="px-4 py-3 text-sm text-foreground">{user.email}</td>
                             <td className="px-4 py-3 text-sm text-foreground">{user.role}</td>
                             <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate" title={user.formationIds}>
                               {user.formationIds || '-'}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                    {previewData.length > 10 && (
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        ... et {previewData.length - 10} utilisateurs de plus
                      </p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={importing}
            className="rounded-xl border-2 border-primary/30 hover:border-primary/50"
          >
            Annuler
          </Button>
          {file && previewData.length > 0 && (
            <Button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 rounded-xl"
            >
              {importing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Importer {previewData.length} utilisateurs
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelImport;
