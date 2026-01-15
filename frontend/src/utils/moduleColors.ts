// Système de couleurs cohérent pour les modules
export const getModuleColor = (moduleName: string): string => {
  const colors = [
    '#8B5CF6', // Purple
    '#EF4444', // Red  
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#8B5A2B', // Brown
    '#64748B'  // Slate
  ];
  
  // Créer un hash simple du nom du module pour une couleur cohérente
  let hash = 0;
  for (let i = 0; i < moduleName.length; i++) {
    const char = moduleName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Extraire le nom du module depuis les notes (format: "Module - Formateur (Classe)")
export const extractModuleName = (notes: string): string => {
  // Si les notes contiennent un tiret, prendre la partie avant le tiret comme nom du module
  const parts = notes.split(' - ');
  return parts[0].trim();
};