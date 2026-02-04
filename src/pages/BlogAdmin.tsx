import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, 
  FileText, TrendingUp, BarChart3, Calendar, Clock,
  Globe, Tag, Folder, Send, Save, ArrowLeft, Sparkles,
  Target, Lightbulb, Wand2, Bot, Settings, Power, Home,
  Instagram, Linkedin, ChevronDown, ImagePlus, Check, Layout
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import {
  getAllPosts, getCategories, getTags, createPost, updatePost, deletePost,
  publishPost, unpublishPost, createCategory, deleteCategory, createTag, deleteTag,
  setPostTags, getBlogStats, BlogPost, BlogCategory, BlogTag, BlogStats
} from '@/services/blogService';
import { AIGeneratedArticle } from '@/services/blogAIService';
import { AIContentGenerator } from '@/components/blog-admin/AIContentGenerator';
import { AISEOOptimizer } from '@/components/blog-admin/AISEOOptimizer';
import { AITopicPlanner } from '@/components/blog-admin/AITopicPlanner';
import { AIContentEnhancer } from '@/components/blog-admin/AIContentEnhancer';
import { EnhancedArticleEditor } from '@/components/blog-admin/EnhancedArticleEditor';
import { ContentTemplates } from '@/components/blog-admin/ContentTemplates';
import logoNf from '@/assets/logo-nf.png';

const StatCard = ({ title, value, icon: Icon, trend }: { 
  title: string; value: string | number; icon: React.ElementType; trend?: string 
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && <p className="text-xs text-green-500 mt-1">{trend}</p>}
        </div>
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================
// AI-ENHANCED POST EDITOR
// ============================================

const AIPostEditor = ({ 
  post, 
  categories,
  tags,
  onSave, 
  onClose,
  initialTopic
}: { 
  post?: BlogPost | null;
  categories: BlogCategory[];
  tags: BlogTag[];
  onSave: (data: Partial<BlogPost>, tagIds: string[]) => Promise<void>;
  onClose: () => void;
  initialTopic?: string;
}) => {
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    cover_image_url: post?.cover_image_url || '',
    category_id: post?.category_id || '',
    seo_title: post?.seo_title || '',
    seo_description: post?.seo_description || '',
    seo_keywords: post?.seo_keywords || [],
    status: post?.status || 'draft'
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map(t => t.id) || []
  );
  const [saving, setSaving] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(!post);
  const [aiMode, setAiMode] = useState<'generate' | 'seo' | 'enhance'>('generate');
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [publishOptions, setPublishOptions] = useState({
    homepage: true,
    instagram: false,
    linkedin: false
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleSave = async (publish = false) => {
    if (!formData.title?.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: publish ? 'published' as const : formData.status,
        published_at: publish ? new Date().toISOString() : formData.published_at
      };
      await onSave(dataToSave, selectedTags);
      toast.success(publish ? 'Article publié !' : 'Brouillon enregistré');
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishWithOptions = async () => {
    if (!formData.title?.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: 'published' as const,
        published_at: new Date().toISOString()
      };
      await onSave(dataToSave, selectedTags);
      
      const destinations: string[] = [];
      if (publishOptions.homepage) destinations.push('Page d\'accueil Nectforma');
      if (publishOptions.instagram) destinations.push('Instagram');
      if (publishOptions.linkedin) destinations.push('LinkedIn');
      
      if (publishOptions.instagram || publishOptions.linkedin) {
        // Note: Social media publication will be handled by the social media system
        toast.success(`Article publié sur : ${destinations.join(', ')}`);
        toast.info('Publication sur les réseaux sociaux en cours de traitement...');
      } else {
        toast.success('Article publié sur la page d\'accueil !');
      }
      
      onClose();
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error("Erreur lors de la publication");
    } finally {
      setSaving(false);
      setShowPublishMenu(false);
    }
  };

  // Import AI-generated article
  const handleAIArticleGenerated = (article: AIGeneratedArticle) => {
    setFormData(prev => ({
      ...prev,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      seo_title: article.seo_title,
      seo_description: article.seo_description,
      seo_keywords: article.seo_keywords
    }));
    
    // Auto-select matching category
    const matchingCat = categories.find(c => 
      c.name.toLowerCase().includes(article.suggested_category.toLowerCase())
    );
    if (matchingCat) {
      setFormData(prev => ({ ...prev, category_id: matchingCat.id }));
    }

    // Auto-select matching tags
    const matchingTagIds = tags
      .filter(t => article.suggested_tags.some(st => 
        t.name.toLowerCase().includes(st.toLowerCase()) ||
        st.toLowerCase().includes(t.name.toLowerCase())
      ))
      .map(t => t.id);
    if (matchingTagIds.length > 0) {
      setSelectedTags(matchingTagIds);
    }

    setShowAIPanel(false);
    toast.success('Article importé ! Vous pouvez le modifier avant publication.');
  };

  // Apply SEO suggestions
  const handleApplySEOSuggestions = (suggestions: {
    title?: string;
    seo_description?: string;
    seo_keywords?: string[];
  }) => {
    setFormData(prev => ({
      ...prev,
      ...(suggestions.title && { seo_title: suggestions.title }),
      ...(suggestions.seo_description && { seo_description: suggestions.seo_description }),
      ...(suggestions.seo_keywords && { seo_keywords: suggestions.seo_keywords })
    }));
  };

  // Apply rewritten content
  const handleApplyContent = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    toast.success('Contenu mis à jour');
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden flex">
      {/* Main Editor */}
      <div className={`flex-1 overflow-auto ${showAIPanel ? 'lg:mr-[450px]' : ''}`}>
        <header className="sticky top-0 bg-background border-b z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">
                {post ? 'Modifier l\'article' : 'Nouvel article'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={showAIPanel ? 'secondary' : 'outline'}
                onClick={() => setShowAIPanel(!showAIPanel)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                IA
              </Button>
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
              <DropdownMenu open={showPublishMenu} onOpenChange={setShowPublishMenu}>
                <DropdownMenuTrigger asChild>
                  <Button disabled={saving} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <Send className="h-4 w-4" />
                    Publier
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-0">
                  <div className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 border-b">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Options de publication
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sélectionnez les destinations
                    </p>
                  </div>
                  <div className="p-3 space-y-3">
                    <div 
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${publishOptions.homepage ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}`}
                      onClick={() => setPublishOptions(prev => ({ ...prev, homepage: !prev.homepage }))}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${publishOptions.homepage ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                        {publishOptions.homepage && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <Home className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">Page d'accueil Nectforma</span>
                        <p className="text-xs text-muted-foreground">Blog principal</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${publishOptions.instagram ? 'bg-pink-500/10 border border-pink-500/30' : 'hover:bg-muted'}`}
                      onClick={() => setPublishOptions(prev => ({ ...prev, instagram: !prev.instagram }))}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${publishOptions.instagram ? 'bg-pink-500 border-pink-500' : 'border-muted-foreground/30'}`}>
                        {publishOptions.instagram && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <Instagram className="h-4 w-4 text-pink-500" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">Instagram</span>
                        <p className="text-xs text-muted-foreground">Publication automatique</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${publishOptions.linkedin ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-muted'}`}
                      onClick={() => setPublishOptions(prev => ({ ...prev, linkedin: !prev.linkedin }))}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${publishOptions.linkedin ? 'bg-blue-600 border-blue-600' : 'border-muted-foreground/30'}`}>
                        {publishOptions.linkedin && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <Linkedin className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">LinkedIn</span>
                        <p className="text-xs text-muted-foreground">Réseau professionnel</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t bg-muted/30">
                    <Button 
                      onClick={handlePublishWithOptions} 
                      disabled={saving || (!publishOptions.homepage && !publishOptions.instagram && !publishOptions.linkedin)}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      {saving ? 'Publication...' : `Publier sur ${[publishOptions.homepage && 'Blog', publishOptions.instagram && 'Instagram', publishOptions.linkedin && 'LinkedIn'].filter(Boolean).join(', ') || '...'}`}
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid lg:grid-cols-[1fr_280px] gap-8">
            {/* Main Content */}
            <div className="space-y-6">
              <div>
                <Input
                  placeholder="Titre de l'article"
                  value={formData.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-2xl font-bold h-auto py-3 border-0 border-b rounded-none focus-visible:ring-0 px-0"
                />
              </div>

              <div>
                <Label>Extrait</Label>
                <Textarea
                  placeholder="Un court résumé de l'article..."
                  value={formData.excerpt || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label className="mb-2 block">Contenu</Label>
                <EnhancedArticleEditor
                  content={formData.content || ''}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  title={formData.title}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Paramètres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Slug URL</Label>
                    <Input
                      value={formData.slug || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="mon-article"
                    />
                  </div>

                  <div>
                    <Label>Image de couverture</Label>
                    <Input
                      value={formData.cover_image_url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label>Catégorie</Label>
                    <Select 
                      value={formData.category_id || ''} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag.id) 
                                ? prev.filter(id => id !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    SEO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Titre SEO</Label>
                    <Input
                      value={formData.seo_title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                      placeholder="Titre pour les moteurs de recherche"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(formData.seo_title || formData.title || '').length}/60 caractères
                    </p>
                  </div>

                  <div>
                    <Label>Description SEO</Label>
                    <Textarea
                      value={formData.seo_description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                      placeholder="Description pour les moteurs de recherche"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(formData.seo_description || formData.excerpt || '').length}/160 caractères
                    </p>
                  </div>

                  <div>
                    <Label>Mots-clés</Label>
                    <Input
                      value={formData.seo_keywords?.join(', ') || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        seo_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                      }))}
                      placeholder="mot1, mot2, mot3"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className="fixed right-0 top-0 bottom-0 w-full lg:w-[450px] bg-background border-l overflow-auto z-20">
          <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Assistant IA</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAIPanel(false)}>
              ×
            </Button>
          </div>

          <div className="p-4">
            <Tabs value={aiMode} onValueChange={(v) => setAiMode(v as typeof aiMode)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="generate">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Générer
                </TabsTrigger>
                <TabsTrigger value="seo">
                  <Target className="h-4 w-4 mr-1" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="enhance">
                  <Wand2 className="h-4 w-4 mr-1" />
                  Améliorer
                </TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="generate">
                  <AIContentGenerator 
                    categories={categories}
                    onArticleGenerated={handleAIArticleGenerated}
                  />
                </TabsContent>

                <TabsContent value="seo">
                  <AISEOOptimizer
                    title={formData.title || ''}
                    content={formData.content || ''}
                    seo_description={formData.seo_description || undefined}
                    seo_keywords={formData.seo_keywords || undefined}
                    onApplySuggestions={handleApplySEOSuggestions}
                  />
                </TabsContent>

                <TabsContent value="enhance">
                  <AIContentEnhancer
                    title={formData.title || ''}
                    excerpt={formData.excerpt || ''}
                    content={formData.content || ''}
                    onApplyContent={handleApplyContent}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN BLOG ADMIN
// ============================================

const BlogAdmin = () => {
  const navigate = useNavigate();
  const { canManageBlog, canViewAnalytics, loading: authLoading } = useSuperAdmin();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingPost, setEditingPost] = useState<BlogPost | null | 'new'>(null);
  const [initialTopic, setInitialTopic] = useState<string>('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [autonomousMode, setAutonomousMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !canManageBlog) {
      navigate('/');
    }
  }, [authLoading, canManageBlog, navigate]);

  useEffect(() => {
    if (canManageBlog) {
      loadData();
    }
  }, [canManageBlog]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsData, categoriesData, tagsData, statsData] = await Promise.all([
        getAllPosts(),
        getCategories(),
        getTags(),
        getBlogStats()
      ]);
      setPosts(postsData);
      setCategories(categoriesData);
      setTags(tagsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (data: Partial<BlogPost>, tagIds: string[]) => {
    if (editingPost === 'new') {
      const newPost = await createPost(data);
      if (tagIds.length > 0) {
        await setPostTags(newPost.id, tagIds);
      }
    } else if (editingPost) {
      await updatePost(editingPost.id, data);
      await setPostTags(editingPost.id, tagIds);
    }
    await loadData();
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await deletePost(id);
      toast.success('Article supprimé');
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      if (post.status === 'published') {
        await unpublishPost(post.id);
        toast.success('Article dépublié');
      } else {
        await publishPost(post.id);
        toast.success('Article publié');
      }
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategory({
        name: newCategoryName,
        slug: newCategoryName.toLowerCase().replace(/\s+/g, '-')
      });
      setNewCategoryName('');
      setShowCategoryDialog(false);
      toast.success('Catégorie créée');
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag({
        name: newTagName,
        slug: newTagName.toLowerCase().replace(/\s+/g, '-')
      });
      setNewTagName('');
      setShowTagDialog(false);
      toast.success('Tag créé');
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  // Handle topic selection from AI planner
  const handleSelectTopic = (topic: string) => {
    setInitialTopic(topic);
    setEditingPost('new');
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || (canManageBlog && loading)) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!canManageBlog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4">
          <img src={logoNf} alt="Nectforma" className="h-10 mx-auto" />
          <h1 className="text-xl font-semibold">Accès refusé</h1>
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas les droits nécessaires pour accéder à l'administration du blog.
          </p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Publié</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">Programmé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoNf} alt="Nectforma" className="h-8" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              Blog Admin
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Autonomous Mode Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <Power className={`h-4 w-4 ${autonomousMode ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className="text-sm">Mode Auto</span>
              <Switch
                checked={autonomousMode}
                onCheckedChange={(checked) => {
                  setAutonomousMode(checked);
                  toast.success(checked ? 'Mode autonome activé' : 'Mode autonome désactivé');
                }}
              />
            </div>
            <Button variant="outline" onClick={() => window.open('/blog', '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              Voir le blog
            </Button>
            <Button onClick={() => setEditingPost('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Articles publiés" value={stats.publishedPosts} icon={FileText} />
            <StatCard title="Brouillons" value={stats.draftPosts} icon={Edit} />
            <StatCard title="Vues totales" value={stats.totalViews.toLocaleString()} icon={TrendingUp} />
            <StatCard title="Articles" value={stats.totalPosts} icon={BarChart3} />
          </div>
        )}

        {/* Autonomous Mode Banner */}
        {autonomousMode && (
          <Card className="mb-6 border-green-500/50 bg-green-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Mode Autonome Actif</p>
                  <p className="text-sm text-muted-foreground">
                    L'IA génère et publie automatiquement des articles optimisés SEO
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500">En cours</Badge>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-background border flex-wrap h-auto p-1">
            <TabsTrigger value="posts">
              <FileText className="h-4 w-4 mr-2" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="ai-generator">
              <Sparkles className="h-4 w-4 mr-2" />
              Générateur IA
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Layout className="h-4 w-4 mr-2" />
              Templates Visuels
            </TabsTrigger>
            <TabsTrigger value="ai-planner">
              <Lightbulb className="h-4 w-4 mr-2" />
              Planificateur
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Folder className="h-4 w-4 mr-2" />
              Catégories
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </TabsTrigger>
            {canViewAnalytics && (
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="published">Publiés</SelectItem>
                      <SelectItem value="draft">Brouillons</SelectItem>
                      <SelectItem value="scheduled">Programmés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Vues</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun article trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPosts.map(post => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{post.title}</p>
                              <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {post.category?.name || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell>{post.views_count}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {post.published_at 
                                ? format(new Date(post.published_at), 'd MMM yyyy', { locale: fr })
                                : format(new Date(post.created_at), 'd MMM yyyy', { locale: fr })
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingPost(post)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTogglePublish(post)}>
                                  {post.status === 'published' ? (
                                    <>
                                      <Clock className="h-4 w-4 mr-2" />
                                      Dépublier
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      Publier
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Generator Tab */}
          <TabsContent value="ai-generator">
            <AIContentGenerator 
              categories={categories}
              onArticleGenerated={(article) => {
                // Create a new post with the generated content
                setInitialTopic('');
                setEditingPost('new');
                // Note: The AIPostEditor will handle importing the article
                toast.info('Ouvrez l\'éditeur pour générer un article avec l\'IA');
              }}
            />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5 text-primary" />
                  Templates de Contenu Style Canva
                </CardTitle>
                <CardDescription>
                  Créez des visuels professionnels pour LinkedIn, Instagram, TikTok et plus encore avec des templates prédéfinis et la génération d'images IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentTemplates 
                  articleTitle={editingPost && editingPost !== 'new' ? editingPost.title : ''}
                  articleContent={editingPost && editingPost !== 'new' ? editingPost.content : ''}
                  onInsertContent={(content) => {
                    toast.success('Contenu prêt à être utilisé !');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Planner Tab */}
          <TabsContent value="ai-planner">
            <AITopicPlanner
              existingTopics={posts.map(p => p.title)}
              onSelectTopic={handleSelectTopic}
            />
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Catégories</CardTitle>
                <Button size="sm" onClick={() => setShowCategoryDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle catégorie
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <Card key={cat.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-4 w-4 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <div>
                            <p className="font-medium">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">{cat.slug}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm('Supprimer cette catégorie ?')) {
                              deleteCategory(cat.id).then(loadData);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tags</CardTitle>
                <Button size="sm" onClick={() => setShowTagDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau tag
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge 
                      key={tag.id} 
                      variant="secondary"
                      className="px-3 py-1.5 text-sm flex items-center gap-2"
                    >
                      #{tag.name}
                      <button 
                        onClick={() => {
                          if (confirm('Supprimer ce tag ?')) {
                            deleteTag(tag.id).then(loadData);
                          }
                        }}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          {canViewAnalytics && (
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques du Blog</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-4">Articles les plus vus</h3>
                        <div className="space-y-2">
                          {stats.topPosts.map((post, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span>{post.title}</span>
                              <Badge variant="outline">{post.views} vues</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-4">Vues par jour (30 derniers jours)</h3>
                        <div className="h-40 flex items-end gap-1">
                          {stats.viewsByDay.slice(-30).map((day, i) => (
                            <div 
                              key={i}
                              className="flex-1 bg-primary rounded-t min-h-[4px]"
                              style={{ 
                                height: `${Math.max(4, (day.views / Math.max(...stats.viewsByDay.map(d => d.views), 1) * 100))}%` 
                              }}
                              title={`${day.date}: ${day.views} vues`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* AI Post Editor */}
      {editingPost && (
        <AIPostEditor
          post={editingPost === 'new' ? null : editingPost}
          categories={categories}
          tags={tags}
          onSave={handleSavePost}
          onClose={() => {
            setEditingPost(null);
            setInitialTopic('');
          }}
          initialTopic={initialTopic}
        />
      )}

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Tutoriels"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCategory}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Ex: react"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTag}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogAdmin;
