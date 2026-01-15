import React from 'react';
import MobileResponsiveFileViewer from './viewers/MobileResponsiveFileViewer';

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
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

export default DocumentViewer;