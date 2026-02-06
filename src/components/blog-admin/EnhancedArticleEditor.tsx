import React, { useState, useRef, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link2, Image, Palette, Type, Quote, Code, Heading1, Heading2, Heading3,
  Sparkles, Loader2, Undo, Redo, ImagePlus, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  title?: string;
}

// Preset color palette
const colorPalette = [
  { name: 'Primary', value: 'hsl(var(--primary))' },
  { name: 'Secondary', value: 'hsl(var(--secondary))' },
  { name: 'Accent', value: 'hsl(var(--accent))' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

// Font size options
const fontSizes = [
  { label: 'Petit', value: '0.875rem' },
  { label: 'Normal', value: '1rem' },
  { label: 'Moyen', value: '1.125rem' },
  { label: 'Grand', value: '1.25rem' },
  { label: 'Très grand', value: '1.5rem' },
];

export const EnhancedArticleEditor: React.FC<EnhancedArticleEditorProps> = ({
  content,
  onChange,
  title
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Execute document command
  const execCommand = useCallback((command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Trigger onChange with updated content
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Format text with heading
  const formatHeading = (level: 'h1' | 'h2' | 'h3' | 'p') => {
    execCommand('formatBlock', level);
  };

  // Apply text color
  const applyColor = (color: string) => {
    execCommand('foreColor', color);
  };

  // Apply background color
  const applyBgColor = (color: string) => {
    execCommand('backColor', color);
  };

  // Insert link
  const insertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  // Insert image from URL
  const insertImage = (url: string) => {
    if (editorRef.current) {
      const img = `<img src="${url}" alt="Article image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;" />`;
      document.execCommand('insertHTML', false, img);
      onChange(editorRef.current.innerHTML);
    }
  };

  // Generate AI image based on prompt
  const generateAIImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Veuillez entrer une description pour l\'image');
      return;
    }

    setIsGeneratingImage(true);
    try {
      // Use the blog-ai edge function for image generation
      const { data, error } = await supabase.functions.invoke('blog-ai', {
        body: {
          action: 'generate-image',
          data: {
            prompt: imagePrompt,
            title: title || 'Article',
            style: 'professional, modern, clean design'
          }
        }
      });

      if (error) throw error;

      const imageUrl = data?.imageUrl || data?.data?.imageUrl;
      if (imageUrl) {
        insertImage(imageUrl);
        toast.success('Image générée et insérée !');
        setImagePrompt('');
        setShowImageGenerator(false);
      } else {
        // Fallback: Insert a placeholder with the prompt description
        const placeholderDiv = `
          <div style="background: linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--accent)/0.1)); 
                      padding: 2rem; border-radius: 12px; text-align: center; margin: 1rem 0;">
            <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground));">
              🎨 Image suggérée: ${imagePrompt}
            </p>
          </div>
        `;
        document.execCommand('insertHTML', false, placeholderDiv);
        onChange(editorRef.current?.innerHTML || content);
        toast.info('Placeholder d\'image ajouté. Vous pouvez le remplacer par une vraie image.');
        setImagePrompt('');
        setShowImageGenerator(false);
      }
    } catch (error) {
      console.error('Image generation error:', error);
      // Insert placeholder anyway
      const placeholderDiv = `
        <div style="background: linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--accent)/0.1)); 
                    padding: 2rem; border-radius: 12px; text-align: center; margin: 1rem 0; border: 2px dashed hsl(var(--border));">
          <p style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">🖼️ Image à ajouter</p>
          <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground));">
            ${imagePrompt}
          </p>
        </div>
      `;
      document.execCommand('insertHTML', false, placeholderDiv);
      onChange(editorRef.current?.innerHTML || content);
      setImagePrompt('');
      setShowImageGenerator(false);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle content change
  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Insert styled block
  const insertStyledBlock = (type: 'quote' | 'callout' | 'code') => {
    let html = '';
    switch (type) {
      case 'quote':
        html = `<blockquote style="border-left: 4px solid hsl(var(--primary)); padding-left: 1rem; margin: 1rem 0; font-style: italic; color: hsl(var(--muted-foreground));">Votre citation ici...</blockquote>`;
        break;
      case 'callout':
        html = `<div style="background: hsl(var(--primary)/0.1); border-left: 4px solid hsl(var(--primary)); padding: 1rem; border-radius: 0 8px 8px 0; margin: 1rem 0;">
          <strong>💡 Note importante</strong>
          <p>Votre message ici...</p>
        </div>`;
        break;
      case 'code':
        html = `<pre style="background: hsl(var(--muted)); padding: 1rem; border-radius: 8px; overflow-x: auto; font-family: monospace;"><code>// Votre code ici</code></pre>`;
        break;
    }
    document.execCommand('insertHTML', false, html);
    onChange(editorRef.current?.innerHTML || content);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* Text formatting */}
            <div className="flex items-center border-r pr-2 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('bold')}
                title="Gras"
                className="h-8 w-8"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('italic')}
                title="Italique"
                className="h-8 w-8"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('underline')}
                title="Souligné"
                className="h-8 w-8"
              >
                <Underline className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('strikeThrough')}
                title="Barré"
                className="h-8 w-8"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </div>

            {/* Headings */}
            <div className="flex items-center border-r pr-2 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => formatHeading('h1')}
                title="Titre 1"
                className="h-8 w-8"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => formatHeading('h2')}
                title="Titre 2"
                className="h-8 w-8"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => formatHeading('h3')}
                title="Titre 3"
                className="h-8 w-8"
              >
                <Heading3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => formatHeading('p')}
                title="Paragraphe"
                className="h-8 w-8"
              >
                <Type className="h-4 w-4" />
              </Button>
            </div>

            {/* Alignment */}
            <div className="flex items-center border-r pr-2 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('justifyLeft')}
                title="Aligner à gauche"
                className="h-8 w-8"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('justifyCenter')}
                title="Centrer"
                className="h-8 w-8"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('justifyRight')}
                title="Aligner à droite"
                className="h-8 w-8"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('justifyFull')}
                title="Justifier"
                className="h-8 w-8"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </div>

            {/* Lists */}
            <div className="flex items-center border-r pr-2 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('insertUnorderedList')}
                title="Liste à puces"
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('insertOrderedList')}
                title="Liste numérotée"
                className="h-8 w-8"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            {/* Colors */}
            <div className="flex items-center border-r pr-2 mr-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" title="Couleur du texte" className="h-8 w-8">
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold">Couleur du texte</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {colorPalette.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => applyColor(color.value)}
                          className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                          style={{ background: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <Label className="text-xs font-semibold mt-4">Surlignage</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {colorPalette.slice(4).map((color) => (
                        <button
                          key={`bg-${color.value}`}
                          onClick={() => applyBgColor(color.value + '40')}
                          className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                          style={{ background: color.value + '40' }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Special blocks */}
            <div className="flex items-center border-r pr-2 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => insertStyledBlock('quote')}
                title="Citation"
                className="h-8 w-8"
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => insertStyledBlock('code')}
                title="Bloc de code"
                className="h-8 w-8"
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>

            {/* Links & Images */}
            <div className="flex items-center border-r pr-2 mr-2">
              <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" title="Insérer un lien" className="h-8 w-8">
                    <Link2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <Label>URL du lien</Label>
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <Button onClick={insertLink} size="sm" className="w-full">
                      Insérer le lien
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" title="Insérer une image" className="h-8 w-8">
                    <Image className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <Label>URL de l'image</Label>
                    <Input
                      placeholder="https://..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          insertImage((e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Appuyez sur Entrée pour insérer
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* AI Image Generator */}
            <div className="flex items-center">
              <Popover open={showImageGenerator} onOpenChange={setShowImageGenerator}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Image IA
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ImagePlus className="h-5 w-5 text-primary" />
                      <Label className="font-semibold">Générer une image IA</Label>
                    </div>
                    <Textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Décrivez l'image souhaitée... Ex: Une illustration moderne montrant la digitalisation des formations avec des éléments tech"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setImagePrompt(`Image professionnelle pour un article sur: ${title || 'la formation professionnelle'}`)}
                        variant="outline"
                        size="sm"
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Auto-suggestion
                      </Button>
                    </div>
                    <Button
                      onClick={generateAIImage}
                      disabled={isGeneratingImage || !imagePrompt.trim()}
                      className="w-full"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Générer l'image
                        </>
                      )}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('undo')}
                title="Annuler"
                className="h-8 w-8"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => execCommand('redo')}
                title="Rétablir"
                className="h-8 w-8"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        className="min-h-[400px] p-6 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 prose prose-sm max-w-none"
        style={{ lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Quick insert buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => insertStyledBlock('callout')}
        >
          💡 Note importante
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const html = `<div style="display: flex; gap: 1rem; margin: 1rem 0;">
              <div style="flex: 1; background: hsl(var(--muted)); padding: 1rem; border-radius: 8px;">
                <h4>Colonne 1</h4>
                <p>Contenu...</p>
              </div>
              <div style="flex: 1; background: hsl(var(--muted)); padding: 1rem; border-radius: 8px;">
                <h4>Colonne 2</h4>
                <p>Contenu...</p>
              </div>
            </div>`;
            document.execCommand('insertHTML', false, html);
            onChange(editorRef.current?.innerHTML || content);
          }}
        >
          📐 2 colonnes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const html = `<hr style="border: none; border-top: 2px solid hsl(var(--border)); margin: 2rem 0;" />`;
            document.execCommand('insertHTML', false, html);
            onChange(editorRef.current?.innerHTML || content);
          }}
        >
          ── Séparateur
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const html = `<div style="background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))); color: white; padding: 1.5rem; border-radius: 12px; text-align: center; margin: 1rem 0;">
              <h3 style="margin: 0; color: white;">Appel à l'action</h3>
              <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Votre message incitatif ici</p>
            </div>`;
            document.execCommand('insertHTML', false, html);
            onChange(editorRef.current?.innerHTML || content);
          }}
        >
          🎯 CTA Block
        </Button>
      </div>
    </div>
  );
};
