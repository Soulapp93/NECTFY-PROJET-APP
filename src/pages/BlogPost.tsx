import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Clock, Calendar, ArrowLeft, Share2, Twitter, Linkedin, 
  Facebook, Link2, Check, ChevronRight, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getPostBySlug, trackPageView, trackScrollDepth, trackTimeOnPage, BlogPost as BlogPostType, getPublishedPosts } from '@/services/blogService';
import logoNf from '@/assets/logo-nf.png';

const BlogHeader = () => (
  <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <img src={logoNf} alt="Nectforma" className="h-8" />
        <span className="font-semibold text-lg">Nectforma</span>
      </Link>
      <nav className="hidden md:flex items-center gap-6">
        <Link to="/blog" className="text-sm font-medium hover:text-primary transition-colors">
          Blog
        </Link>
        <Link to="/solutions" className="text-sm font-medium hover:text-primary transition-colors">
          Solutions
        </Link>
      </nav>
      <Link to="/auth">
        <Button variant="default" size="sm">
          Se connecter
        </Button>
      </Link>
    </div>
  </header>
);

const TableOfContents = ({ content }: { content: string }) => {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Parse headings from content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const h2s = doc.querySelectorAll('h2, h3');
    
    const items = Array.from(h2s).map((h, i) => ({
      id: `heading-${i}`,
      text: h.textContent || '',
      level: parseInt(h.tagName[1])
    }));
    
    setHeadings(items);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -35% 0%' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="sticky top-24 hidden lg:block">
      <h4 className="font-semibold mb-4 text-sm">Sommaire</h4>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li 
            key={heading.id}
            className={`${heading.level === 3 ? 'pl-4' : ''}`}
          >
            <a
              href={`#${heading.id}`}
              className={`block py-1 border-l-2 pl-3 transition-colors ${
                activeId === heading.id
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const ShareButtons = ({ title, url }: { title: string; url: string }) => {
  const [copied, setCopied] = useState(false);

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Partager
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.open(shareUrls.twitter, '_blank')}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(shareUrls.linkedin, '_blank')}>
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(shareUrls.facebook, '_blank')}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
          Copier le lien
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const RelatedPosts = ({ currentSlug }: { currentSlug: string }) => {
  const [posts, setPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    getPublishedPosts(4).then(data => {
      setPosts(data.filter(p => p.slug !== currentSlug).slice(0, 3));
    });
  }, [currentSlug]);

  if (posts.length === 0) return null;

  return (
    <section className="border-t pt-12 mt-12">
      <h3 className="text-2xl font-bold mb-6">Articles similaires</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map(post => (
          <Link 
            key={post.id} 
            to={`/blog/${post.slug}`}
            className="group"
          >
            <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
              {post.cover_image_url && (
                <img 
                  src={post.cover_image_url} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>
            <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {post.read_time_minutes} min de lecture
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());
  const maxScroll = useRef(0);

  useEffect(() => {
    if (!slug) return;
    
    loadPost();
    
    return () => {
      // Track time on page when leaving
      if (post) {
        const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
        trackTimeOnPage(post.id, timeSpent);
        trackScrollDepth(post.id, maxScroll.current);
      }
    };
  }, [slug]);

  useEffect(() => {
    // Track scroll depth
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      maxScroll.current = Math.max(maxScroll.current, scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadPost = async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      const data = await getPostBySlug(slug);
      if (!data) {
        navigate('/blog', { replace: true });
        return;
      }
      setPost(data);
      
      // Track page view
      trackPageView(data.id);
      startTime.current = Date.now();
    } catch (error) {
      console.error('Error loading post:', error);
      navigate('/blog', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // Process content to add IDs to headings
  const processContent = (html: string) => {
    let headingIndex = 0;
    return html.replace(/<(h[23])([^>]*)>/gi, (match, tag, attrs) => {
      const id = `heading-${headingIndex++}`;
      return `<${tag}${attrs} id="${id}">`;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BlogHeader />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-2/3 mb-8" />
          <Skeleton className="aspect-video w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <title>{post.seo_title || post.title} | Blog Nectforma</title>
      <meta name="description" content={post.seo_description || post.excerpt || ''} />
      <meta name="keywords" content={post.seo_keywords?.join(', ') || ''} />
      <meta property="og:title" content={post.seo_title || post.title} />
      <meta property="og:description" content={post.seo_description || post.excerpt || ''} />
      <meta property="og:image" content={post.cover_image_url || ''} />
      <meta property="og:type" content="article" />
      <meta property="article:published_time" content={post.published_at || ''} />
      <meta name="twitter:card" content="summary_large_image" />
      {post.canonical_url && <link rel="canonical" href={post.canonical_url} />}

      <BlogHeader />

      <article className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/blog" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Blog
          </Link>
          {post.category && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link 
                to={`/blog?category=${post.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {post.category.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid lg:grid-cols-[1fr_250px] gap-12 max-w-6xl mx-auto">
          <div>
            {/* Header */}
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {post.category && (
                  <Badge 
                    variant="secondary"
                    style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
                  >
                    {post.category.name}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.read_time_minutes} min de lecture
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">
                  {post.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Équipe Nectforma</p>
                    {post.published_at && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.published_at), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
                <ShareButtons title={post.title} url={currentUrl} />
              </div>
            </header>

            {/* Cover Image */}
            {post.cover_image_url && (
              <div className="aspect-video rounded-xl overflow-hidden mb-8 shadow-lg">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div 
              ref={contentRef}
              className="prose prose-lg max-w-none dark:prose-invert 
                prose-headings:scroll-mt-20
                prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-8 prose-h1:mb-4
                prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                prose-pre:bg-muted prose-pre:border prose-pre:rounded-xl prose-pre:overflow-x-auto
                prose-ul:text-foreground/80 prose-ol:text-foreground/80
                prose-li:mb-2
                prose-strong:text-foreground prose-strong:font-semibold
                prose-table:border prose-table:rounded-lg prose-table:overflow-hidden
                prose-th:bg-muted prose-th:p-3 prose-th:text-left
                prose-td:p-3 prose-td:border-t
                [&_.carousel-slide]:rounded-xl [&_.carousel-slide]:shadow-lg [&_.carousel-slide]:overflow-hidden
                [&_div[style*='background']]:rounded-xl [&_div[style*='background']]:my-4"
              dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
                      <Badge variant="outline" className="hover:bg-muted transition-colors">
                        #{tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Posts */}
            <RelatedPosts currentSlug={post.slug} />
          </div>

          {/* Table of Contents */}
          <aside className="hidden lg:block">
            <TableOfContents content={post.content} />
          </aside>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="flex items-center gap-2 justify-center mb-4">
            <img src={logoNf} alt="Nectforma" className="h-8" />
            <span className="font-semibold">Nectforma</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nectforma. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPostPage;
