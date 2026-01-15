import React from 'react';
import ProductionFileViewer from './ProductionFileViewer';

interface MobileResponsiveFileViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const MobileResponsiveFileViewer: React.FC<MobileResponsiveFileViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  return (
    <ProductionFileViewer
      fileUrl={fileUrl}
      fileName={fileName}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

export default MobileResponsiveFileViewer;

