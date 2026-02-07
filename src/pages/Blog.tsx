import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowRight, BookOpen } from 'lucide-react';
import ArticleCoverImage from '@/components/blog/ArticleCoverImage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublishedPosts, getCategories, BlogPost, BlogCategory } from '@/services/blogService';
import logoNf from '@/assets/logo-nf.png';

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
        <Link to="/pourquoi-nous" className="text-sm font-medium hover:text-primary transition-colors">À propos</Link>
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

const BlogFooter = () => (
  <footer className="border-t bg-muted/30 py-12 mt-16">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src={logoNf} alt="Nectforma" className="h-8" />
            <span className="font-semibold">Nectforma</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            La plateforme de gestion pour les établissements d'enseignement supérieur.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Produit</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</Link></li>
            <li><Link to="/solutions" className="hover:text-foreground transition-colors">Solutions</Link></li>
            <li><Link to="/pourquoi-nous" className="hover:text-foreground transition-colors">Pourquoi nous</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Ressources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
            <li><Link to="/documentation" className="hover:text-foreground transition-colors">Documentation</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Légal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link></li>
            <li><Link to="/politique-confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Nectforma. Tous droits réservés.
      </div>
    </div>
  </footer>
);

const ArticleCard = ({ post }: { post: BlogPost }) => (
  <div className="group bg-card rounded-2xl border-2 border-primary/20 overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300">
    <ArticleCoverImage title={post.title} size="card" className="aspect-[4/3]" />
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        {post.category && (
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {post.category.name}
          </span>
        )}
        {post.category && post.published_at && (
          <span className="text-xs text-muted-foreground">•</span>
        )}
        {post.published_at && (
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {format(new Date(post.published_at), 'dd/MM/yyyy', { locale: fr })}
          </span>
        )}
      </div>
      <Link to={`/blog/${post.slug}`}>
        <h3 className="font-semibold text-foreground leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
      </Link>
      {post.excerpt && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
      )}
      <Link 
        to={`/blog/${post.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        Lire l'article
      </Link>
    </div>
  </div>
);

const FeaturedCard = ({ post }: { post: BlogPost }) => (
  <div className="group bg-card rounded-2xl border-2 border-primary/20 overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col md:flex-row">
    <ArticleCoverImage title={post.title} size="hero" className="md:w-1/2 aspect-video md:aspect-auto min-h-[200px]" />
    <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-3">
        {post.category && (
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {post.category.name}
          </span>
        )}
        {post.published_at && (
          <>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {format(new Date(post.published_at), 'dd/MM/yyyy', { locale: fr })}
            </span>
          </>
        )}
      </div>
      <Link to={`/blog/${post.slug}`}>
        <h2 className="text-xl md:text-2xl font-bold mb-3 leading-tight group-hover:text-primary transition-colors">
          {post.title}
        </h2>
      </Link>
      {post.excerpt && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>
      )}
      <Link 
        to={`/blog/${post.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        Lire l'article
      </Link>
    </div>
  </div>
);

const PopularPostItem = ({ post }: { post: BlogPost }) => (
  <div className="border-b border-border/30 pb-4 last:border-0 last:pb-0">
    <div className="flex items-center gap-2 mb-1">
      {post.category && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {post.category.name}
        </span>
      )}
      {post.published_at && (
        <>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(post.published_at), 'dd/MM/yyyy', { locale: fr })}
          </span>
        </>
      )}
    </div>
    <Link to={`/blog/${post.slug}`}>
      <h4 className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 mb-1">
        {post.title}
      </h4>
    </Link>
    <Link 
      to={`/blog/${post.slug}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      <ArrowRight className="h-3 w-3" />
      Lire l'article
    </Link>
  </div>
);

const PostCardSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
    <Skeleton className="aspect-[4/3]" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

const Blog = () => {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsData, categoriesData] = await Promise.all([
        getPublishedPosts(50, 0),
        getCategories()
      ]);
      
      const filteredPosts = selectedCategory
        ? postsData.filter(p => p.category?.slug === selectedCategory)
        : postsData;
      
      setPosts(filteredPosts);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredPost = posts[0];
  const gridPosts = posts.slice(1, visibleCount + 1);
  const popularPosts = [...posts].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 4);
  const hasMore = posts.length > visibleCount + 1;

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />
      
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-primary/90 via-primary to-primary/80 py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            Blog Nectforma
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Toute l'actualité sur la galaxie Nectforma
          </p>
        </div>
      </section>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <section className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !selectedCategory 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Tous
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.slug 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid lg:grid-cols-[1fr_280px] gap-10">
              <div className="space-y-8">
                <Skeleton className="h-64 rounded-2xl" />
                <div className="grid md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64 rounded-2xl" />
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Aucun article</h2>
              <p className="text-muted-foreground">
                {selectedCategory 
                  ? "Aucun article dans cette catégorie pour le moment."
                  : "Le blog est en cours de préparation. Revenez bientôt !"}
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_280px] gap-10">
              {/* Left: Articles */}
              <div className="space-y-8">
                {/* Featured Article */}
                {featuredPost && !selectedCategory && (
                  <FeaturedCard post={featuredPost} />
                )}

                {/* Articles Grid */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {(selectedCategory ? posts : gridPosts).map(post => (
                    <ArticleCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && !selectedCategory && (
                  <div className="text-center pt-4">
                    <Button 
                      onClick={() => setVisibleCount(prev => prev + 9)}
                      className="rounded-full px-8"
                    >
                      Voir plus d'articles
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Sidebar - Only popular articles */}
              <aside className="space-y-6 hidden lg:block">
                {popularPosts.length > 0 && (
                  <div className="bg-card rounded-2xl border-2 border-primary/20 p-6">
                    <h3 className="text-primary font-bold text-lg mb-5">Articles les + lus</h3>
                    <div className="space-y-4">
                      {popularPosts.map(post => (
                        <PopularPostItem key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Prêt à transformer votre gestion ?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Découvrez comment Nectforma peut simplifier la gestion de votre établissement.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">Commencer gratuitement</Button>
            </Link>
            <Link to="/fonctionnalites">
              <Button size="lg" variant="outline">Voir les fonctionnalités</Button>
            </Link>
          </div>
        </div>
      </section>

      <BlogFooter />
    </div>
  );
};

export default Blog;
