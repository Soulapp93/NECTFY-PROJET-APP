import React from 'react';
import MobileResponsiveFileViewer from '@/components/ui/viewers/MobileResponsiveFileViewer';

interface ModuleFileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

const ModuleFileViewerModal: React.FC<ModuleFileViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}) => {
  return (
    <MobileResponsiveFileViewer
      fileUrl={fileUrl}
      fileName={fileName}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

export default ModuleFileViewerModal;
