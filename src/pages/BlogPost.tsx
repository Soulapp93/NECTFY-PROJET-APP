import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Clock, Calendar, ArrowRight, Share2, User, ChevronRight, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getPostBySlug, trackPageView, trackScrollDepth, trackTimeOnPage, BlogPost as BlogPostType, getPublishedPosts } from '@/services/blogService';
import logoNf from '@/assets/logo-nf.png';
import ArticleCoverImage from '@/components/blog/ArticleCoverImage';

const BlogHeader = () => (
  <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <img src={logoNf} alt="Nectforma" className="h-8" />
        <span className="font-semibold text-lg">Nectforma</span>
      </Link>
      <nav className="hidden md:flex items-center gap-6">
        <Link to="/blog" className="text-sm font-medium text-primary transition-colors">Blog</Link>
        <Link to="/solutions" className="text-sm font-medium hover:text-primary transition-colors">Solutions</Link>
        <Link to="/fonctionnalites" className="text-sm font-medium hover:text-primary transition-colors">Fonctionnalités</Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link to="/auth">
          <Button size="sm" variant="outline" className="hidden sm:inline-flex">Connexion</Button>
        </Link>
        <Link to="/auth">
          <Button size="sm">Essai gratuit</Button>
        </Link>
      </div>
    </div>
  </header>
);

const TableOfContents = ({ content }: { content: string }) => {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
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
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-20% 0% -35% 0%' }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="bg-card rounded-2xl border border-primary/15 p-5">
      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Sommaire</h4>
      <ul className="space-y-0.5">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? 'pl-3' : ''}>
            <a
              href={`#${heading.id}`}
              className={`block py-1.5 text-sm border-l-2 pl-3 transition-colors leading-snug ${
                activeId === heading.id
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/40'
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

const SocialShareButtons = ({ title, url }: { title: string; url: string }) => {
  const shareUrls = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success('Lien copié !');
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => window.open(shareUrls.linkedin, '_blank')} className="w-9 h-9 rounded-full bg-[#0077B5] text-white flex items-center justify-center hover:opacity-80 transition-opacity" title="LinkedIn">
        <span className="text-sm font-bold">in</span>
      </button>
      <button onClick={() => window.open(shareUrls.facebook, '_blank')} className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity" title="Facebook">
        <span className="text-sm font-bold">f</span>
      </button>
      <button onClick={() => window.open(shareUrls.twitter, '_blank')} className="w-9 h-9 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity" title="Twitter">
        <span className="text-sm font-bold">𝕏</span>
      </button>
      <button onClick={copyLink} className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-opacity" title="Copier le lien">
        <Share2 className="h-4 w-4" />
      </button>
    </div>
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
          <Link key={post.id} to={`/blog/${post.slug}`} className="group">
            <ArticleCoverImage title={post.title} size="card" className="aspect-video rounded-xl" />
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary" />
              Lire l'article
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
      if (post) {
        const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
        trackTimeOnPage(post.id, timeSpent);
        trackScrollDepth(post.id, maxScroll.current);
      }
    };
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
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
      if (!data) { navigate('/blog', { replace: true }); return; }
      setPost(data);
      trackPageView(data.id);
      startTime.current = Date.now();
    } catch (error) {
      console.error('Error loading post:', error);
      navigate('/blog', { replace: true });
    } finally {
      setLoading(false);
    }
  };

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
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-2/3 mb-8" />
          <Skeleton className="aspect-video w-full rounded-xl mb-8" />
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
    <div className="min-h-screen bg-primary/5">
      <title>{post.seo_title || post.title} | Blog Nectforma</title>
      <meta name="description" content={post.seo_description || post.excerpt || ''} />
      <meta property="og:title" content={post.seo_title || post.title} />
      <meta property="og:description" content={post.seo_description || post.excerpt || ''} />
      <meta property="og:image" content={post.cover_image_url || ''} />
      <meta property="og:type" content="article" />
      {post.canonical_url && <link rel="canonical" href={post.canonical_url} />}

      <BlogHeader />

      {/* Breadcrumb bar */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            {post.category && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link to={`/blog?category=${post.category.slug}`} className="hover:text-foreground transition-colors">
                  {post.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground truncate max-w-[300px]">{post.title}</span>
          </nav>
        </div>
      </div>

      <article className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8 max-w-6xl mx-auto">
          
          {/* Left Sidebar: TOC + Social — Digiforma style */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <TableOfContents content={post.content} />
              <div className="bg-card rounded-2xl border border-primary/15 p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Partager</h4>
                <SocialShareButtons title={post.title} url={currentUrl} />
              </div>
            </div>
          </aside>

          {/* Main Content — Framed */}
          <div className="min-w-0">
            <div className="bg-background rounded-2xl border-2 border-primary/30 shadow-lg shadow-primary/5 overflow-hidden">
              
              {/* Header area inside frame */}
              <div className="p-6 md:p-10 pb-0 md:pb-0">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {post.category && (
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                      {post.category.name}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-foreground">
                  {post.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Équipe Nectforma</span>
                  </div>
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(post.published_at), 'd MMMM yyyy', { locale: fr })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.read_time_minutes} min
                  </span>
                </div>
              </div>

              {/* Branded Cover Image — Digiforma-style with title */}
              <div className="px-6 md:px-10 mb-8">
                <ArticleCoverImage 
                  title={post.title} 
                  size="hero" 
                  className="aspect-[16/7] rounded-xl shadow-md" 
                />
              </div>

              {/* Mobile social share */}
              <div className="lg:hidden px-6 md:px-10 mb-6">
                <SocialShareButtons title={post.title} url={currentUrl} />
              </div>

              {/* Content */}
              <div className="px-6 md:px-10 pb-8 md:pb-10">
                <div 
                  ref={contentRef}
                  className="prose prose-lg max-w-none dark:prose-invert 
                    prose-headings:scroll-mt-20
                    prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-8 prose-h1:mb-4
                    prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-primary
                    prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-primary/80
                    prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-4
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-xl prose-img:shadow-md prose-img:my-8 prose-img:border-2 prose-img:border-primary/10
                    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-primary/90
                    prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                    prose-pre:bg-muted prose-pre:border prose-pre:rounded-xl
                    prose-ul:text-foreground/80 prose-ol:text-foreground/80
                    prose-li:mb-2
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-table:border prose-table:rounded-lg prose-table:overflow-hidden
                    prose-th:bg-muted prose-th:p-3 prose-th:text-left
                    prose-td:p-3 prose-td:border-t
                    [&_.carousel-slide]:rounded-xl [&_.carousel-slide]:shadow-lg
                    [&_div[style*='background']]:rounded-xl [&_div[style*='background']]:my-4"
                  dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
                />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-primary/10">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
                          <Badge variant="outline" className="hover:bg-primary/10 border-primary/20 transition-colors">
                            #{tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Author Card */}
            <div className="mt-8 p-6 rounded-2xl bg-background border-2 border-primary/20 flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Équipe Nectforma</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Passionnés par l'innovation pédagogique, nous partageons nos conseils et bonnes pratiques pour la gestion des formations.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button className="w-7 h-7 rounded-full bg-[#0077B5] text-white flex items-center justify-center text-xs hover:opacity-80">in</button>
                </div>
              </div>
            </div>

            {/* Related */}
            <RelatedPosts currentSlug={post.slug} />
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t bg-background py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="flex items-center gap-2 justify-center mb-4">
            <img src={logoNf} alt="Nectforma" className="h-8" />
            <span className="font-semibold text-lg">Nectforma</span>
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
