import React from 'react';
import MobileResponsiveFileViewer from '@/components/ui/viewers/MobileResponsiveFileViewer';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName
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

export default FileViewerModal;