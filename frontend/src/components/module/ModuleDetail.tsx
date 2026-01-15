
import React from 'react';
import { ArrowLeft, BookOpen, FileText, Edit, FolderOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import ModuleContentTab from './ModuleContentTab';
import ModuleAssignmentsTab from './ModuleAssignmentsTab';
import ModuleCorrectionsTab from './ModuleCorrectionsTab';
import ModuleDocumentsTab from './ModuleDocumentsTab';

interface ModuleDetailProps {
  module: {
    id: string;
    title: string;
    description?: string;
    duration_hours: number;
  };
  formationColor: string;
  onBack: () => void;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, formationColor, onBack }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header compact */}
      <div className="bg-card border-b border-border px-4 py-3">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center text-muted-foreground hover:text-foreground mb-3 -ml-2"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        
        {/* Module card header */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div 
            className="p-4"
            style={{ backgroundColor: formationColor }}
          >
            <h1 className="text-lg sm:text-xl font-bold text-white mb-1">{module.title}</h1>
            {module.description && (
              <p className="text-white/80 text-sm mb-2 line-clamp-2">{module.description}</p>
            )}
            <div className="flex items-center text-white/70 text-sm">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {module.duration_hours}h
            </div>
          </div>
        </Card>
      </div>

      {/* Content Tabs */}
      <div className="px-4 py-4">
        <Tabs defaultValue="content" className="space-y-4">
          {/* Tab buttons with rounded outline design - grid layout like reference */}
          <TabsList className="grid grid-cols-2 gap-3 bg-transparent h-auto p-0 w-full max-w-md mx-auto">
            <TabsTrigger 
              value="content"
              className="rounded-full border-2 border-[#8B5CF6] text-[#8B5CF6] bg-white hover:bg-purple-50 data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] px-4 py-3 text-sm font-medium transition-all"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Contenu
            </TabsTrigger>
            <TabsTrigger 
              value="assignments"
              className="rounded-full border-2 border-[#8B5CF6] text-[#8B5CF6] bg-white hover:bg-purple-50 data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] px-4 py-3 text-sm font-medium transition-all"
            >
              <FileText className="h-4 w-4 mr-2" />
              Devoirs
            </TabsTrigger>
            <TabsTrigger 
              value="corrections"
              className="rounded-full border-2 border-[#8B5CF6] text-[#8B5CF6] bg-white hover:bg-purple-50 data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] px-4 py-3 text-sm font-medium transition-all"
            >
              <Edit className="h-4 w-4 mr-2" />
              Corr.
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="rounded-full border-2 border-[#8B5CF6] text-[#8B5CF6] bg-white hover:bg-purple-50 data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] px-4 py-3 text-sm font-medium transition-all"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Docs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-4">
            <ModuleContentTab moduleId={module.id} />
          </TabsContent>

          <TabsContent value="assignments" className="mt-4">
            <ModuleAssignmentsTab moduleId={module.id} />
          </TabsContent>

          <TabsContent value="corrections" className="mt-4">
            <ModuleCorrectionsTab moduleId={module.id} />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <ModuleDocumentsTab moduleId={module.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModuleDetail;
