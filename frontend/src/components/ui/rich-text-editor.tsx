import React, { useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic, Underline, List, ListOrdered, Type, AlignLeft, AlignCenter, AlignRight, Link, Palette, Undo, Redo, Quote, Code, Strikethrough, Subscript, Superscript } from 'lucide-react';

// Configure DOMPurify with safe defaults - only allow formatting, no scripts/iframes
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup', 
                  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 
                  'pre', 'code', 'a', 'span', 'div', 'font'],
  ALLOWED_ATTR: ['href', 'target', 'style', 'color', 'face', 'size'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
  ALLOW_DATA_ATTR: false,
};

// Export sanitize function for use in other components
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Tapez votre texte ici...",
  rows = 8
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');

  const execCommand = (command: string, value?: string) => {
    // Focus the editor first
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    // Execute the command
    const success = document.execCommand(command, false, value);
    
    // Update the content
    if (editorRef.current && success) {
      onChange(editorRef.current.innerHTML);
    }
    
    return success;
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatText = (format: string) => {
    // Ensure editor is focused before executing commands
    if (editorRef.current) {
      editorRef.current.focus();
    }

    let success = false;
    
    switch (format) {
      case 'bold':
        success = execCommand('bold');
        break;
      case 'italic':
        success = execCommand('italic');
        break;
      case 'underline':
        success = execCommand('underline');
        break;
      case 'strikethrough':
        success = execCommand('strikeThrough');
        break;
      case 'subscript':
        // Remove superscript first, then apply subscript
        execCommand('superscript');
        success = execCommand('subscript');
        break;
      case 'superscript':
        // Remove subscript first, then apply superscript
        execCommand('subscript');
        success = execCommand('superscript');
        break;
      case 'bullet':
        success = execCommand('insertUnorderedList');
        break;
      case 'number':
        success = execCommand('insertOrderedList');
        break;
      case 'indent':
        success = execCommand('indent');
        break;
      case 'outdent':
        success = execCommand('outdent');
        break;
      case 'alignLeft':
        success = execCommand('justifyLeft');
        break;
      case 'alignCenter':
        success = execCommand('justifyCenter');
        break;
      case 'alignRight':
        success = execCommand('justifyRight');
        break;
      case 'justifyFull':
        success = execCommand('justifyFull');
        break;
      case 'blockquote':
        // For blockquote, we'll wrap selected content manually
        if (editorRef.current) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedContent = range.extractContents();
            const blockquote = document.createElement('blockquote');
            blockquote.style.borderLeft = '4px solid #ccc';
            blockquote.style.paddingLeft = '16px';
            blockquote.style.margin = '16px 0';
            blockquote.style.fontStyle = 'italic';
            blockquote.appendChild(selectedContent);
            range.insertNode(blockquote);
            success = true;
          }
        }
        break;
      case 'code':
        // For code blocks, we'll wrap selected content manually
        if (editorRef.current) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedContent = range.extractContents();
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            pre.style.backgroundColor = '#f4f4f4';
            pre.style.padding = '12px';
            pre.style.borderRadius = '4px';
            pre.style.fontFamily = 'monospace';
            pre.style.fontSize = '14px';
            pre.style.overflow = 'auto';
            code.appendChild(selectedContent);
            pre.appendChild(code);
            range.insertNode(pre);
            success = true;
          }
        }
        break;
      case 'h1':
        success = execCommand('formatBlock', '<h1>');
        break;
      case 'h2':
        success = execCommand('formatBlock', '<h2>');
        break;
      case 'h3':
        success = execCommand('formatBlock', '<h3>');
        break;
      case 'h4':
        success = execCommand('formatBlock', '<h4>');
        break;
      case 'normal':
        success = execCommand('formatBlock', '<div>');
        break;
      case 'undo':
        success = execCommand('undo');
        break;
      case 'redo':
        success = execCommand('redo');
        break;
      default:
        console.warn(`Format "${format}" not supported`);
    }

    // Force update if command was successful
    if (success && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url && editorRef.current) {
      editorRef.current.focus();
      const success = execCommand('createLink', url);
      if (!success) {
        // Fallback method for creating links
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = range.toString() || url;
          const link = document.createElement('a');
          link.href = url;
          link.textContent = selectedText;
          link.target = '_blank';
          range.deleteContents();
          range.insertNode(link);
        }
      }
    }
  };

  const changeTextColor = (color: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      execCommand('foreColor', color);
      setCurrentColor(color);
    }
  };

  const changeBackgroundColor = (color: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      execCommand('backColor', color);
    }
  };

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  // Convert HTML to plain text for storage if needed
  const getPlainText = () => {
    if (editorRef.current) {
      return editorRef.current.innerText;
    }
    return '';
  };

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('undo')}
          title="Annuler (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('redo')}
          title="Refaire (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Style dropdown */}
        <Select 
          defaultValue="normal" 
          onValueChange={formatText}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="h1">Titre 1</SelectItem>
            <SelectItem value="h2">Titre 2</SelectItem>
            <SelectItem value="h3">Titre 3</SelectItem>
            <SelectItem value="h4">Titre 4</SelectItem>
            <SelectItem value="blockquote">Citation</SelectItem>
            <SelectItem value="code">Code</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Text formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          title="Gras (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          title="Italique (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('underline')}
          title="Souligné (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('strikethrough')}
          title="Barré"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Text color */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Couleur du texte"
          >
            <Palette className="h-4 w-4" />
          </Button>
          {showColorPicker && (
            <div className="absolute top-8 left-0 z-50 bg-background border rounded-md p-2 shadow-lg">
              <div className="grid grid-cols-6 gap-1 mb-2">
                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#000080', '#800000'].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      changeTextColor(color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => changeTextColor(e.target.value)}
                className="w-full h-8"
              />
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('alignLeft')}
          title="Aligner à gauche"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('alignCenter')}
          title="Centrer"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('alignRight')}
          title="Aligner à droite"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bullet')}
          title="Liste à puces"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('number')}
          title="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Additional tools */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          title="Insérer un lien"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('subscript')}
          title="Indice"
        >
          <Subscript className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('superscript')}
          title="Exposant"
        >
          <Superscript className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Preview toggle */}
        <Button
          type="button"
          variant={isPreview ? "default" : "ghost"}
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
          title="Aperçu"
        >
          <Type className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      {isPreview ? (
        <div 
          className="p-3 min-h-[200px] prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
        />
      ) : (
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onFocus={() => {
              // Enable design mode for better compatibility
              document.designMode = 'on';
              setTimeout(() => {
                document.designMode = 'off';
              }, 0);
            }}
            className="p-3 min-h-[200px] outline-none prose prose-sm max-w-none focus:bg-muted/10"
            style={{ minHeight: `${rows * 1.5}rem` }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
            suppressContentEditableWarning={true}
            onKeyDown={(e) => {
              // Handle keyboard shortcuts
              if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                  case 'b':
                    e.preventDefault();
                    formatText('bold');
                    break;
                  case 'i':
                    e.preventDefault();
                    formatText('italic');
                    break;
                  case 'u':
                    e.preventDefault();
                    formatText('underline');
                    break;
                  case 'z':
                    e.preventDefault();
                    formatText('undo');
                    break;
                  case 'y':
                    e.preventDefault();
                    formatText('redo');
                    break;
                }
              }
            }}
          />
          
          {!value && (
            <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
      )}
    </div>
  );
};