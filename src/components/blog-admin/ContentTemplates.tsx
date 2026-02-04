import React, { useState } from 'react';
import {
  Layout, Image, Type, Square, Circle, Triangle,
  Palette, Sparkles, Download, Copy, Layers, Grid,
  Smartphone, Monitor, Instagram, Linkedin, Video,
  ChevronLeft, ChevronRight, Plus, Trash2, Loader2, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Template {
  id: string;
  name: string;
  type: 'article' | 'carousel' | 'story' | 'post' | 'video';
  platform: 'blog' | 'linkedin' | 'instagram' | 'tiktok' | 'all';
  aspectRatio: string;
  slides?: number;
  preview: string;
  colors: string[];
}

const templates: Template[] = [
  // Article Templates
  {
    id: 'article-modern',
    name: 'Article Moderne',
    type: 'article',
    platform: 'blog',
    aspectRatio: '16:9',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    colors: ['#667eea', '#764ba2', '#ffffff']
  },
  {
    id: 'article-minimal',
    name: 'Article Minimaliste',
    type: 'article',
    platform: 'blog',
    aspectRatio: '16:9',
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    colors: ['#1a1a2e', '#16213e', '#eaeaea']
  },
  {
    id: 'article-vibrant',
    name: 'Article Vibrant',
    type: 'article',
    platform: 'blog',
    aspectRatio: '16:9',
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    colors: ['#f093fb', '#f5576c', '#ffffff']
  },
  // LinkedIn Carousel Templates
  {
    id: 'linkedin-carousel-pro',
    name: 'Carousel Pro',
    type: 'carousel',
    platform: 'linkedin',
    aspectRatio: '1:1',
    slides: 10,
    preview: 'linear-gradient(135deg, #0077b5 0%, #004182 100%)',
    colors: ['#0077b5', '#004182', '#ffffff']
  },
  {
    id: 'linkedin-carousel-tips',
    name: 'Carousel Tips',
    type: 'carousel',
    platform: 'linkedin',
    aspectRatio: '1:1',
    slides: 8,
    preview: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    colors: ['#00c6ff', '#0072ff', '#ffffff']
  },
  {
    id: 'linkedin-carousel-story',
    name: 'Carousel Storytelling',
    type: 'carousel',
    platform: 'linkedin',
    aspectRatio: '1:1',
    slides: 6,
    preview: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    colors: ['#232526', '#414345', '#f5f5f5']
  },
  // Instagram Templates
  {
    id: 'instagram-carousel',
    name: 'Carousel Instagram',
    type: 'carousel',
    platform: 'instagram',
    aspectRatio: '1:1',
    slides: 10,
    preview: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    colors: ['#e6683c', '#dc2743', '#ffffff']
  },
  {
    id: 'instagram-story',
    name: 'Story Instagram',
    type: 'story',
    platform: 'instagram',
    aspectRatio: '9:16',
    preview: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    colors: ['#833ab4', '#fd1d1d', '#fcb045']
  },
  {
    id: 'instagram-post',
    name: 'Post Instagram',
    type: 'post',
    platform: 'instagram',
    aspectRatio: '1:1',
    preview: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
    colors: ['#ee0979', '#ff6a00', '#ffffff']
  },
  // TikTok Templates
  {
    id: 'tiktok-cover',
    name: 'Couverture TikTok',
    type: 'video',
    platform: 'tiktok',
    aspectRatio: '9:16',
    preview: 'linear-gradient(135deg, #000000 0%, #25f4ee 50%, #fe2c55 100%)',
    colors: ['#000000', '#25f4ee', '#fe2c55']
  },
  {
    id: 'tiktok-thumbnail',
    name: 'Miniature TikTok',
    type: 'post',
    platform: 'tiktok',
    aspectRatio: '9:16',
    preview: 'linear-gradient(135deg, #1a1a1a 0%, #fe2c55 100%)',
    colors: ['#1a1a1a', '#fe2c55', '#ffffff']
  }
];

const colorPresets = [
  { name: 'Océan', colors: ['#667eea', '#764ba2', '#ffffff'] },
  { name: 'Sunset', colors: ['#f093fb', '#f5576c', '#ffffff'] },
  { name: 'Forest', colors: ['#11998e', '#38ef7d', '#ffffff'] },
  { name: 'Fire', colors: ['#f12711', '#f5af19', '#ffffff'] },
  { name: 'Night', colors: ['#232526', '#414345', '#f5f5f5'] },
  { name: 'LinkedIn', colors: ['#0077b5', '#004182', '#ffffff'] },
  { name: 'Instagram', colors: ['#833ab4', '#fd1d1d', '#fcb045'] },
  { name: 'TikTok', colors: ['#000000', '#25f4ee', '#fe2c55'] },
];

interface CarouselSlide {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface ContentTemplatesProps {
  onInsertContent?: (content: string) => void;
  articleTitle?: string;
  articleContent?: string;
}

export const ContentTemplates: React.FC<ContentTemplatesProps> = ({
  onInsertContent,
  articleTitle = '',
  articleContent = ''
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [slides, setSlides] = useState<CarouselSlide[]>([
    { id: '1', title: 'Slide 1', content: '' }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [customColors, setCustomColors] = useState<string[]>(['#667eea', '#764ba2', '#ffffff']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');

  const filteredTemplates = selectedPlatform === 'all' 
    ? templates 
    : templates.filter(t => t.platform === selectedPlatform || t.platform === 'all');

  const addSlide = () => {
    const newSlide: CarouselSlide = {
      id: String(Date.now()),
      title: `Slide ${slides.length + 1}`,
      content: ''
    };
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
  };

  const removeSlide = (index: number) => {
    if (slides.length > 1) {
      const newSlides = slides.filter((_, i) => i !== index);
      setSlides(newSlides);
      setCurrentSlide(Math.min(currentSlide, newSlides.length - 1));
    }
  };

  const updateSlide = (index: number, field: 'title' | 'content', value: string) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSlides(newSlides);
  };

  const generateAIContent = async (type: 'carousel' | 'caption' | 'image') => {
    if (!selectedTemplate) {
      toast.error('Sélectionnez d\'abord un template');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('blog-ai', {
        body: {
          action: type === 'carousel' ? 'generate-carousel' : type === 'caption' ? 'generate-caption' : 'generate-image',
          data: {
            title: articleTitle || 'Mon contenu',
            content: articleContent,
            platform: selectedTemplate.platform,
            templateType: selectedTemplate.type,
            slidesCount: slides.length,
            style: `Professional, engaging, ${selectedTemplate.platform} optimized`
          }
        }
      });

      if (error) throw error;

      if (type === 'carousel' && data?.slides) {
        const newSlides = data.slides.map((slide: any, index: number) => ({
          id: String(Date.now() + index),
          title: slide.title || `Slide ${index + 1}`,
          content: slide.content || ''
        }));
        setSlides(newSlides);
        toast.success('Contenu généré avec succès !');
      } else if (type === 'caption' && data?.caption) {
        setGeneratedContent(data.caption);
        toast.success('Caption générée !');
      } else if (type === 'image' && data?.imageUrl) {
        const newSlides = [...slides];
        newSlides[currentSlide] = { ...newSlides[currentSlide], imageUrl: data.imageUrl };
        setSlides(newSlides);
        toast.success('Image générée !');
      }
    } catch (error) {
      console.error('Generation error:', error);
      // Fallback with demo content
      if (type === 'carousel') {
        const demoSlides = [
          { id: '1', title: '🎯 Le Problème', content: 'Identifiez un problème commun que votre audience rencontre' },
          { id: '2', title: '💡 La Solution', content: 'Présentez votre solution unique' },
          { id: '3', title: '✨ Les Bénéfices', content: 'Listez 3-5 avantages clés' },
          { id: '4', title: '📊 Les Résultats', content: 'Montrez des chiffres ou témoignages' },
          { id: '5', title: '🚀 Call to Action', content: 'Invitez à passer à l\'action' }
        ];
        setSlides(demoSlides);
        toast.success('Template de contenu généré !');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getPreviewStyle = (template: Template) => ({
    background: template.preview,
    aspectRatio: template.aspectRatio.replace(':', '/'),
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'tiktok': return <Video className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const exportContent = () => {
    if (!selectedTemplate) return;
    
    const content = slides.map((slide, i) => 
      `=== Slide ${i + 1} ===\n${slide.title}\n${slide.content}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(content);
    toast.success('Contenu copié dans le presse-papiers !');
  };

  return (
    <div className="space-y-6">
      {/* Platform Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Label className="text-sm font-medium">Plateforme:</Label>
        <div className="flex gap-1">
          {['all', 'blog', 'linkedin', 'instagram', 'tiktok'].map((platform) => (
            <Button
              key={platform}
              variant={selectedPlatform === platform ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPlatform(platform)}
              className="gap-1"
            >
              {platform === 'all' && <Grid className="h-3 w-3" />}
              {platform === 'blog' && <Monitor className="h-3 w-3" />}
              {platform === 'linkedin' && <Linkedin className="h-3 w-3" />}
              {platform === 'instagram' && <Instagram className="h-3 w-3" />}
              {platform === 'tiktok' && <Video className="h-3 w-3" />}
              <span className="capitalize">{platform === 'all' ? 'Tous' : platform}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => {
              setSelectedTemplate(template);
              setCustomColors(template.colors);
            }}
          >
            <CardContent className="p-3">
              <div
                className="rounded-lg mb-2 flex items-center justify-center text-white font-bold text-xs"
                style={{ ...getPreviewStyle(template), minHeight: '80px' }}
              >
                <div className="text-center p-2">
                  <div className="mb-1">{getPlatformIcon(template.platform)}</div>
                  {template.slides && <span>{template.slides} slides</span>}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{template.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {template.platform}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {template.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Editor Panel */}
      {selectedTemplate && (
        <Card className="mt-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getPlatformIcon(selectedTemplate.platform)}
                {selectedTemplate.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAIContent('carousel')}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Générer IA
                </Button>
                <Button variant="outline" size="sm" onClick={exportContent}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content">
              <TabsList className="mb-4">
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="preview">Aperçu</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                {/* Slides Navigation */}
                {(selectedTemplate.type === 'carousel' || selectedTemplate.type === 'story') && (
                  <div className="flex items-center gap-2 pb-4 border-b overflow-x-auto">
                    {slides.map((slide, index) => (
                      <Button
                        key={slide.id}
                        variant={currentSlide === index ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentSlide(index)}
                        className="relative group min-w-[80px]"
                      >
                        {index + 1}
                        {slides.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSlide(index);
                            }}
                            className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full hidden group-hover:flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        )}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={addSlide}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Slide Editor */}
                <div className="space-y-4">
                  <div>
                    <Label>Titre</Label>
                    <Input
                      value={slides[currentSlide]?.title || ''}
                      onChange={(e) => updateSlide(currentSlide, 'title', e.target.value)}
                      placeholder="Titre de la slide..."
                    />
                  </div>
                  <div>
                    <Label>Contenu</Label>
                    <Textarea
                      value={slides[currentSlide]?.content || ''}
                      onChange={(e) => updateSlide(currentSlide, 'content', e.target.value)}
                      placeholder="Contenu..."
                      rows={4}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateAIContent('image')}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Générer une image IA pour cette slide
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-4">
                {/* Color Presets */}
                <div>
                  <Label className="mb-2 block">Palettes de couleurs</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setCustomColors(preset.colors)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          JSON.stringify(customColors) === JSON.stringify(preset.colors)
                            ? 'border-primary'
                            : 'border-transparent hover:border-muted'
                        }`}
                      >
                        <div className="flex gap-1 mb-1">
                          {preset.colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="text-xs">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div>
                  <Label className="mb-2 block">Couleurs personnalisées</Label>
                  <div className="flex gap-4">
                    {customColors.map((color, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...customColors];
                            newColors[i] = e.target.value;
                            setCustomColors(newColors);
                          }}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={color}
                          onChange={(e) => {
                            const newColors = [...customColors];
                            newColors[i] = e.target.value;
                            setCustomColors(newColors);
                          }}
                          className="w-24 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                {/* Live Preview */}
                <div className="flex justify-center">
                  <div
                    className="rounded-xl overflow-hidden shadow-2xl relative"
                    style={{
                      background: `linear-gradient(135deg, ${customColors[0]} 0%, ${customColors[1]} 100%)`,
                      width: selectedTemplate.aspectRatio === '9:16' ? '280px' : '400px',
                      aspectRatio: selectedTemplate.aspectRatio.replace(':', '/'),
                    }}
                  >
                    {/* Slide Navigation */}
                    {slides.length > 1 && (
                      <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white"
                          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                          disabled={currentSlide === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white"
                          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                          disabled={currentSlide === slides.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center" style={{ color: customColors[2] }}>
                      {slides[currentSlide]?.imageUrl && (
                        <img
                          src={slides[currentSlide].imageUrl}
                          alt="Slide"
                          className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                      )}
                      <div className="relative z-10">
                        <h3 className="text-xl md:text-2xl font-bold mb-3">
                          {slides[currentSlide]?.title || 'Titre'}
                        </h3>
                        <p className="text-sm md:text-base opacity-90">
                          {slides[currentSlide]?.content || 'Contenu de la slide...'}
                        </p>
                      </div>
                    </div>

                    {/* Slide Indicators */}
                    {slides.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {slides.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === currentSlide ? 'bg-white w-4' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Platform Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/30 text-white border-0">
                        {getPlatformIcon(selectedTemplate.platform)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Export Actions */}
                <div className="flex justify-center gap-2">
                  <Button onClick={exportContent}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter le contenu
                  </Button>
                  {onInsertContent && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const content = slides.map((slide, i) => 
                          `<div class="carousel-slide" style="background: linear-gradient(135deg, ${customColors[0]}, ${customColors[1]}); color: ${customColors[2]}; padding: 2rem; border-radius: 12px; margin: 1rem 0;">
                            <h3>${slide.title}</h3>
                            <p>${slide.content}</p>
                          </div>`
                        ).join('');
                        onInsertContent(content);
                        toast.success('Contenu inséré dans l\'article !');
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Insérer dans l'article
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentTemplates;
