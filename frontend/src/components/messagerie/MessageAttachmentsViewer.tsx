import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, File, Image, Film, Music, Archive, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import MobileResponsiveFileViewer from '@/components/ui/viewers/MobileResponsiveFileViewer';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  content_type?: string;
}

interface MessageAttachmentsViewerProps {
  messageId: string;
}

const getFileIcon = (fileName: string, contentType?: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (contentType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return <Image className="h-4 w-4 text-green-500" />;
  }
  if (contentType?.startsWith('video/') || ['mp4', 'webm', 'avi', 'mov'].includes(ext || '')) {
    return <Film className="h-4 w-4 text-purple-500" />;
  }
  if (contentType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) {
    return <Music className="h-4 w-4 text-pink-500" />;
  }
  if (['pdf'].includes(ext || '')) {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return <Archive className="h-4 w-4 text-amber-500" />;
  }
  
  return <File className="h-4 w-4 text-muted-foreground" />;
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageAttachmentsViewer: React.FC<MessageAttachmentsViewerProps> = ({ messageId }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const { data, error } = await supabase
          .from('message_attachments')
          .select('*')
          .eq('message_id', messageId);

        if (error) throw error;
        setAttachments(data || []);
      } catch (error) {
        console.error('Error fetching attachments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [messageId]);

  const handleView = (attachment: Attachment) => {
    setSelectedFile(attachment);
    setViewerOpen(true);
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.file_url;
    link.download = attachment.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Pièces jointes ({attachments.length})
        </h4>
        <div className="grid gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg border border-border/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getFileIcon(attachment.file_name, attachment.content_type)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  {attachment.file_size && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(attachment)}
                  className="h-8 w-8 p-0"
                  title="Visualiser"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  className="h-8 w-8 p-0"
                  title="Télécharger"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedFile && (
        <MobileResponsiveFileViewer
          fileUrl={selectedFile.file_url}
          fileName={selectedFile.file_name}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
};

export default MessageAttachmentsViewer;
