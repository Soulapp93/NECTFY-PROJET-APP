import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AIRequest {
  action: 
    | 'generate-article'
    | 'optimize-seo'
    | 'suggest-topics'
    | 'rewrite-content'
    | 'generate-social'
    | 'analyze-performance'
    | 'suggest-schedule'
    | 'generate-image-prompt'
    | 'translate'
    | 'summarize'
    | 'generate-carousel'
    | 'generate-image';
  payload: Record<string, unknown>;
}

const SYSTEM_PROMPTS = {
  'generate-article': `Tu es un expert en rédaction de contenu SEO pour Nectforma, une plateforme SaaS de gestion de formation. 

Ton style d'écriture:
- Éducatif et professionnel
- Orienté SaaS et EdTech
- Engageant avec des CTAs clairs
- Optimisé pour le référencement

Tu dois TOUJOURS répondre en JSON valide avec cette structure exacte:
{
  "title": "Titre optimisé SEO (max 60 chars)",
  "seo_title": "Meta title pour Google (max 60 chars)",
  "seo_description": "Meta description (max 160 chars)",
  "slug": "url-slug-optimise",
  "excerpt": "Résumé accrocheur (max 200 chars)",
  "outline": [
    {"level": "h2", "text": "Sous-titre 1"},
    {"level": "h3", "text": "Sous-sous-titre"}
  ],
  "content": "<article complet en HTML avec h2, h3, p, ul, li, strong, em>",
  "faq": [
    {"question": "Question 1?", "answer": "Réponse 1"}
  ],
  "suggested_tags": ["tag1", "tag2"],
  "suggested_category": "Nom de catégorie",
  "estimated_read_time": 5,
  "cta": {
    "text": "Texte du bouton CTA",
    "description": "Description avant le CTA"
  },
  "seo_keywords": ["keyword1", "keyword2", "keyword3"]
}`,

  'optimize-seo': `Tu es un expert SEO spécialisé dans le SaaS EdTech. Analyse le contenu fourni et donne des recommandations détaillées.

Réponds TOUJOURS en JSON avec cette structure:
{
  "score": 85,
  "title_analysis": {
    "current_score": 70,
    "suggestions": ["suggestion 1", "suggestion 2"],
    "improved_title": "Nouveau titre optimisé"
  },
  "meta_analysis": {
    "description_score": 80,
    "improved_description": "Nouvelle meta description",
    "keywords_density": {"keyword": 2.5}
  },
  "content_analysis": {
    "readability_score": 75,
    "flesch_score": 60,
    "word_count": 1500,
    "heading_structure": "correct|needs_improvement",
    "keyword_stuffing": false,
    "suggestions": ["amélioration 1"]
  },
  "internal_linking": {
    "suggestions": ["Lier vers article X", "Mentionner formation Y"]
  },
  "schema_markup": {
    "type": "Article",
    "json_ld": {}
  },
  "improvements": [
    {"priority": "high", "action": "Action à faire", "impact": "Impact attendu"}
  ]
}`,

  'suggest-topics': `Tu es un stratège de contenu spécialisé EdTech/SaaS. Tu dois suggérer des idées d'articles pertinentes pour Nectforma (gestion de formation, émargement, alternance).

Réponds en JSON:
{
  "trending_topics": [
    {
      "title": "Titre proposé",
      "description": "Pourquoi ce sujet est pertinent",
      "target_keywords": ["keyword1", "keyword2"],
      "difficulty": "easy|medium|hard",
      "estimated_traffic": "high|medium|low",
      "content_type": "guide|tutorial|news|case-study|comparison"
    }
  ],
  "content_clusters": [
    {
      "pillar_topic": "Sujet pilier",
      "subtopics": ["sous-sujet 1", "sous-sujet 2"]
    }
  ],
  "content_calendar": [
    {
      "week": 1,
      "topic": "Sujet de la semaine",
      "type": "Type d'article",
      "priority": "high|medium|low"
    }
  ],
  "competitor_gaps": ["Sujet non couvert par la concurrence"]
}`,

  'rewrite-content': `Tu es un rédacteur expert. Améliore le contenu fourni selon les instructions.

Réponds en JSON:
{
  "rewritten_content": "<contenu HTML amélioré>",
  "changes_made": ["modification 1", "modification 2"],
  "readability_improvement": "+15%",
  "word_count_change": "+200 mots"
}`,

  'generate-social': `Tu es un community manager expert. Génère des posts pour les réseaux sociaux à partir de l'article.

Réponds en JSON:
{
  "linkedin": {
    "post": "Texte du post LinkedIn (max 3000 chars)",
    "hashtags": ["#hashtag1", "#hashtag2"]
  },
  "twitter": {
    "thread": ["Tweet 1 (max 280 chars)", "Tweet 2"],
    "single": "Version tweet unique"
  },
  "facebook": {
    "post": "Texte du post Facebook"
  },
  "instagram": {
    "caption": "Légende Instagram",
    "hashtags": ["#tag1", "#tag2"]
  },
  "newsletter": {
    "subject": "Objet de l'email",
    "preview_text": "Texte de prévisualisation",
    "intro": "Introduction de la newsletter"
  }
}`,

  'analyze-performance': `Tu es un analyste de contenu. Analyse les métriques fournies et donne des recommandations.

Réponds en JSON:
{
  "overall_score": 75,
  "engagement_analysis": {
    "strengths": ["point fort 1"],
    "weaknesses": ["point faible 1"]
  },
  "recommendations": [
    {
      "action": "Action recommandée",
      "priority": "high|medium|low",
      "expected_impact": "Impact attendu"
    }
  ],
  "ab_test_suggestions": [
    {
      "element": "title|cta|image",
      "variant_a": "Version A",
      "variant_b": "Version B"
    }
  ],
  "update_suggestions": [
    {
      "section": "Section à mettre à jour",
      "reason": "Pourquoi",
      "new_content": "Nouveau contenu suggéré"
    }
  ]
}`,

  'suggest-schedule': `Tu es un expert en stratégie de publication. Suggère les meilleurs moments pour publier.

Réponds en JSON:
{
  "best_publish_times": [
    {
      "day": "mardi",
      "time": "10:00",
      "reason": "Pic d'engagement B2B"
    }
  ],
  "recommended_frequency": "2 articles par semaine",
  "avoid_dates": ["dates à éviter"],
  "content_spacing": {
    "min_days_between": 3,
    "reason": "Éviter la cannibalisation"
  }
}`,

  'generate-image-prompt': `Tu es un directeur artistique. Génère des prompts pour créer des images de blog.

Réponds en JSON:
{
  "cover_image": {
    "prompt": "Prompt détaillé pour l'image de couverture",
    "alt_text": "Texte alternatif SEO",
    "suggested_filename": "nom-fichier-optimise-seo.jpg"
  },
  "illustrations": [
    {
      "purpose": "Illustration pour section X",
      "prompt": "Prompt pour cette illustration",
      "alt_text": "Alt text"
    }
  ],
  "style_guide": {
    "colors": ["#primary", "#secondary"],
    "mood": "professionnel et moderne",
    "avoid": ["éléments à éviter"]
  }
}`,

  'translate': `Tu es un traducteur professionnel spécialisé dans le contenu B2B/SaaS.

Réponds en JSON:
{
  "translated_title": "Titre traduit",
  "translated_content": "<contenu HTML traduit>",
  "translated_excerpt": "Extrait traduit",
  "translated_seo": {
    "title": "Meta title traduit",
    "description": "Meta description traduite",
    "keywords": ["mot-clé traduit"]
  },
  "cultural_adaptations": ["adaptation culturelle effectuée"]
}`,

  'summarize': `Tu es un expert en synthèse de contenu.

Réponds en JSON:
{
  "summary": "Résumé court (50 mots)",
  "key_points": ["Point clé 1", "Point clé 2"],
  "executive_summary": "Résumé exécutif (100 mots)",
  "tl_dr": "Version ultra-courte (20 mots)"
}`,

  'generate-carousel': `Tu es un expert en création de contenu visuel pour les réseaux sociaux (LinkedIn, Instagram, TikTok).

Tu dois générer des slides de carrousel engageants et visuellement attrayants.

Réponds TOUJOURS en JSON avec cette structure exacte:
{
  "slides": [
    {
      "title": "Titre accrocheur de la slide (max 50 chars)",
      "subtitle": "Sous-titre ou tagline (max 80 chars)",
      "content": "Contenu principal de la slide (max 150 chars)",
      "bullet_points": ["Point 1", "Point 2", "Point 3"],
      "cta": "Call-to-action si applicable",
      "image_prompt": "Prompt pour générer une image de fond pertinente",
      "slide_type": "intro|content|stats|quote|cta|conclusion"
    }
  ],
  "carousel_title": "Titre global du carrousel",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "caption": "Légende pour accompagner le carrousel",
  "platform_tips": {
    "linkedin": "Conseil spécifique LinkedIn",
    "instagram": "Conseil spécifique Instagram",
    "tiktok": "Conseil spécifique TikTok"
  },
  "color_suggestion": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex"
  }
}`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as Record<string, unknown>;

    const action = body.action as AIRequest['action'];
    const payload = (body.payload ?? body.data ?? {}) as Record<string, unknown>;

    console.log(`Blog AI action: ${action}`);
    console.log('Blog AI body keys:', Object.keys(body || {}));
    console.log('Blog AI payload keys:', Object.keys(payload || {}));

    // Handle image generation separately (uses image model)
    if (action === 'generate-image') {
      const prompt = (payload.prompt || payload.title || 'Professional blog image') as string;
      const style = (payload.style || 'professional, modern, clean design') as string;
      
      console.log('Generating image with prompt:', prompt);
      
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          messages: [
            { role: 'user', content: `Generate a blog cover image: ${prompt}. Style: ${style}. Ultra high resolution, 16:9 aspect ratio.` }
          ],
          modalities: ['image', 'text'],
        }),
      });

      if (!imageResponse.ok) {
        const errText = await imageResponse.text();
        console.error('Image generation error:', imageResponse.status, errText);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la génération de l\'image' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const imageData = await imageResponse.json();
      console.log('Image API response structure:', JSON.stringify({
        hasChoices: !!imageData.choices,
        hasImages: !!imageData.choices?.[0]?.message?.images,
        imagesLength: imageData.choices?.[0]?.message?.images?.length,
      }));
      
      let imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageUrl) {
        imageUrl = imageData.data?.[0]?.url || imageData.data?.[0]?.b64_json;
      }

      if (!imageUrl) {
        console.error('No image in AI response');
        return new Response(
          JSON.stringify({ error: 'Aucune image générée' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If it's base64, upload to storage and return public URL
      if (imageUrl.startsWith('data:')) {
        try {
          const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          );

          // Extract base64 data
          const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
          if (!base64Match) throw new Error('Invalid base64 format');
          
          const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
          const base64Data = base64Match[2];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          const fileName = `blog-images/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
          
          const { error: uploadError } = await supabaseAdmin.storage
            .from('blog-assets')
            .upload(fileName, binaryData, {
              contentType: `image/${base64Match[1]}`,
              upsert: false,
            });

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            // Fallback: return base64 directly
            return new Response(
              JSON.stringify({ success: true, imageUrl }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data: publicUrlData } = supabaseAdmin.storage
            .from('blog-assets')
            .getPublicUrl(fileName);

          console.log('Image uploaded to storage:', publicUrlData.publicUrl);
          
          return new Response(
            JSON.stringify({ success: true, imageUrl: publicUrlData.publicUrl }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (uploadErr) {
          console.error('Upload failed, returning base64:', uploadErr);
          return new Response(
            JSON.stringify({ success: true, imageUrl }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ success: true, imageUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[action];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build user message based on action
    let userMessage = '';
    
    switch (action) {
      case 'generate-article':
        userMessage = `Génère un article de blog complet avec ces paramètres:
- Sujet: ${payload.topic}
- Audience cible: ${payload.audience || 'Responsables formation, RH, dirigeants de centres de formation'}
- Ton: ${payload.tone || 'Professionnel et éducatif'}
- Longueur: ${payload.length || 'Moyen (1000-1500 mots)'}
- Langue: ${payload.language || 'Français'}
- Mots-clés cibles: ${(payload.keywords as string[])?.join(', ') || 'gestion formation, digitalisation'}
- Catégorie: ${payload.category || 'Formation professionnelle'}

Instructions supplémentaires: ${payload.instructions || 'Aucune'}`;
        break;

      case 'optimize-seo':
        userMessage = `Analyse et optimise le SEO de cet article:

Titre actuel: ${payload.title}
Meta description actuelle: ${payload.seo_description || 'Non définie'}
Mots-clés actuels: ${(payload.seo_keywords as string[])?.join(', ') || 'Aucun'}

Contenu:
${payload.content}

Donne un score SEO de 0 à 100 et des recommandations détaillées.`;
        break;

      case 'suggest-topics':
        userMessage = `Suggère des idées d'articles pour Nectforma.

Contexte:
- Niche: SaaS de gestion de formation professionnelle
- Fonctionnalités clés: émargement digital, emploi du temps, cahier de texte, messagerie, gestion alternance
- Audience: centres de formation, CFA, organismes de formation, RH entreprises
- Articles existants: ${(payload.existing_topics as string[])?.join(', ') || 'Aucun'}
- Période: ${payload.period || '3 mois'}
- Nombre d'idées souhaitées: ${payload.count || 10}

Instructions: ${payload.instructions || 'Focus sur des sujets à fort potentiel SEO'}`;
        break;

      case 'rewrite-content':
        userMessage = `Réécris ce contenu selon ces instructions:

Mode: ${payload.mode || 'improve'} (improve/shorten/expand/simplify)
Ton souhaité: ${payload.tone || 'Professionnel'}
Longueur cible: ${payload.target_length || 'Identique'}

Contenu original:
${payload.content}

Instructions spécifiques: ${payload.instructions || 'Améliore la clarté et l\'engagement'}`;
        break;

      case 'generate-social':
        userMessage = `Génère des posts pour les réseaux sociaux à partir de cet article:

Titre: ${payload.title}
Extrait: ${payload.excerpt}
Contenu: ${payload.content}
URL: ${payload.url || 'https://nectforma.com/blog/[slug]'}

Plateformes: ${(payload.platforms as string[])?.join(', ') || 'LinkedIn, Twitter, Facebook'}`;
        break;

      case 'analyze-performance':
        userMessage = `Analyse les performances de cet article et suggère des améliorations:

Titre: ${payload.title}
Métriques:
- Vues: ${payload.views || 0}
- Temps moyen sur page: ${payload.avg_time || 'N/A'}
- Taux de rebond: ${payload.bounce_rate || 'N/A'}
- Profondeur de scroll: ${payload.scroll_depth || 'N/A'}
- Position Google moyenne: ${payload.avg_position || 'N/A'}

Contenu actuel:
${payload.content}

Date de publication: ${payload.published_at || 'N/A'}`;
        break;

      case 'suggest-schedule':
        userMessage = `Suggère le meilleur moment pour publier cet article:

Type de contenu: ${payload.content_type || 'Article de blog'}
Catégorie: ${payload.category || 'Formation professionnelle'}
Audience cible: ${payload.audience || 'B2B - Formation professionnelle'}
Fréquence de publication actuelle: ${payload.current_frequency || 'Non définie'}
Dernière publication: ${payload.last_publish_date || 'N/A'}
Articles programmés: ${(payload.scheduled_posts as string[])?.join(', ') || 'Aucun'}`;
        break;

      case 'generate-image-prompt':
        userMessage = `Génère des prompts pour créer des images pour cet article:

Titre: ${payload.title}
Sujet: ${payload.topic || payload.title}
Ton: ${payload.tone || 'Professionnel et moderne'}
Catégorie: ${payload.category || 'Formation professionnelle'}

Style souhaité: ${payload.style || 'Moderne, professionnel, tech-friendly'}`;
        break;

      case 'translate':
        userMessage = `Traduis cet article en ${payload.target_language || 'Anglais'}:

Titre: ${payload.title}
Extrait: ${payload.excerpt}
Contenu:
${payload.content}

SEO actuel:
- Meta title: ${payload.seo_title}
- Meta description: ${payload.seo_description}
- Keywords: ${(payload.seo_keywords as string[])?.join(', ')}

Adapte le contenu culturellement si nécessaire.`;
        break;

      case 'summarize':
        userMessage = `Résume cet article:

Titre: ${payload.title}
Contenu:
${payload.content}

Format souhaité: ${payload.format || 'Tous les formats'}`;
        break;

      case 'generate-carousel': {
        const slideCountRaw = (payload.slideCount ?? payload.slidesCount ?? payload.slide_count ?? payload.slides_count ?? 5) as unknown;
        const slideCount = typeof slideCountRaw === 'number' ? slideCountRaw : Number(slideCountRaw) || 5;

        userMessage = `Génère un carrousel de ${slideCount} slides pour les réseaux sociaux.

Sujet/Thème: ${payload.topic || payload.title || 'Contenu professionnel'}
Plateforme cible: ${payload.platform || 'LinkedIn'}
Ton: ${payload.tone || 'Professionnel et engageant'}
Audience: ${payload.audience || 'Professionnels B2B'}
Style: ${payload.style || 'Moderne et épuré'}

${payload.content ? `Contenu de base:\n${payload.content}` : ''}

Instructions supplémentaires: ${payload.instructions || 'Crée des slides percutantes avec des titres accrocheurs et du contenu concis'}`;
        break;
      }

      default:
        userMessage = JSON.stringify(payload);
    }

    console.log('Calling Lovable AI Gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez plus tard.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits AI épuisés. Veuillez recharger votre compte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erreur du service AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Réponse AI vide' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsedResult;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      parsedResult = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return raw content if not valid JSON
      parsedResult = { raw_content: content };
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Blog AI error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
