import React from 'react';
import { 
  FileText, 
  Target, 
  CheckSquare, 
  Users, 
  Clock, 
  Shield,
  Smartphone,
  BarChart3,
  Zap,
  Calendar,
  AlertTriangle,
  Cpu,
  Database,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const SpecificationDocument = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* En-tête du document */}
      <div className="text-center space-y-4 border-b pb-8">
        <div className="flex items-center justify-center mb-4">
          <FileText className="h-12 w-12 text-primary mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Cahier des Charges
            </h1>
            <p className="text-xl text-muted-foreground">
              Modernisation du Système d'Émargement Numérique
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold">Version:</span> 1.0
          </div>
          <div>
            <span className="font-semibold">Date:</span> {new Date().toLocaleDateString('fr-FR')}
          </div>
          <div>
            <span className="font-semibold">Statut:</span> 
            <Badge className="ml-2">Brouillon</Badge>
          </div>
        </div>
      </div>

      {/* 1. Contexte et Objectifs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            1. Contexte et Objectifs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Contexte</h4>
            <p className="text-sm text-muted-foreground">
              Le système d'émargement actuel présente des limitations en termes d'efficacité, 
              de traçabilité et d'expérience utilisateur. Ce projet vise à moderniser et 
              automatiser les processus d'émargement pour les formations.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Objectifs Principaux</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Réduire le temps d'émargement de 75%</li>
              <li>Éliminer les erreurs manuelles</li>
              <li>Améliorer la traçabilité et la conformité</li>
              <li>Moderniser l'interface utilisateur</li>
              <li>Automatiser les workflows de validation</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Bénéfices Attendus</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <Clock className="h-4 w-4 text-green-600 mb-1" />
                <div className="text-xs font-medium">Gain de Temps</div>
                <div className="text-xs text-muted-foreground">75% de réduction</div>
              </div>
              <div className="p-3 border rounded-lg">
                <Shield className="h-4 w-4 text-blue-600 mb-1" />
                <div className="text-xs font-medium">Sécurité</div>
                <div className="text-xs text-muted-foreground">Traçabilité complète</div>
              </div>
              <div className="p-3 border rounded-lg">
                <Users className="h-4 w-4 text-purple-600 mb-1" />
                <div className="text-xs font-medium">Satisfaction</div>
                <div className="text-xs text-muted-foreground">UX optimisée</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Analyse de l'Existant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            2. Analyse de l'Existant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600">Points Forts</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Base de données structurée</li>
                <li>Gestion des rôles utilisateurs</li>
                <li>Interface existante fonctionnelle</li>
                <li>Intégration avec les formations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-red-600">Points d'Amélioration</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Interface peu intuitive</li>
                <li>Processus manuel chronophage</li>
                <li>Manque d'automatisation</li>
                <li>Analytics limitées</li>
                <li>Pas d'optimisation mobile</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Exigences Fonctionnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            3. Exigences Fonctionnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* 3.1 Gestion des Sessions */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              3.1 Gestion des Sessions d'Émargement
            </h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-001</Badge>
                <span className="text-sm">Création automatique des feuilles d'émargement depuis le planning</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-002</Badge>
                <span className="text-sm">Ouverture/fermeture programmée des sessions selon les horaires</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-003</Badge>
                <span className="text-sm">Gestion des retards avec seuil de tolérance configurable</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-004</Badge>
                <span className="text-sm">Validation en cascade : étudiant → formateur → administration</span>
              </div>
            </div>
          </div>

          {/* 3.2 Interface Utilisateur */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Smartphone className="h-4 w-4 mr-2" />
              3.2 Interface Utilisateur
            </h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-005</Badge>
                <span className="text-sm">Interface mobile-first responsive et intuitive</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-006</Badge>
                <span className="text-sm">QR Code unique par session pour émargement rapide</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-007</Badge>
                <span className="text-sm">Signature numérique avec pad tactile</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-008</Badge>
                <span className="text-sm">Dashboard temps réel avec statuts visuels</span>
              </div>
            </div>
          </div>

          {/* 3.3 Automatisation */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              3.3 Automatisation et Notifications
            </h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-009</Badge>
                <span className="text-sm">Notifications push 10min avant le début des cours</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-010</Badge>
                <span className="text-sm">Génération automatique des rapports PDF</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-011</Badge>
                <span className="text-sm">Workflow automatisé de validation selon les règles métier</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-012</Badge>
                <span className="text-sm">Détection automatique des anomalies (doublons, incohérences)</span>
              </div>
            </div>
          </div>

          {/* 3.4 Analytics */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              3.4 Analytics et Reporting
            </h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-013</Badge>
                <span className="text-sm">Statistiques de présence par formation, étudiant, période</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-014</Badge>
                <span className="text-sm">Graphiques interactifs et tableaux de bord personnalisables</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-015</Badge>
                <span className="text-sm">Export des données (PDF, Excel, CSV) avec filtres avancés</span>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="outline" className="text-xs">F-016</Badge>
                <span className="text-sm">Alertes automatiques pour absentéisme récurrent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Exigences Techniques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="h-5 w-5 mr-2" />
            4. Exigences Techniques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Architecture</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Architecture modulaire et scalable</li>
                <li>API REST avec authentification JWT</li>
                <li>Base de données relationnelle (PostgreSQL)</li>
                <li>Cache Redis pour les performances</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Performance</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Temps de réponse &lt; 200ms</li>
                <li>Support de 500+ utilisateurs simultanés</li>
                <li>Disponibilité 99.9%</li>
                <li>Sauvegarde temps réel</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Sécurité</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Chiffrement des données sensibles</li>
                <li>Audit trail complet</li>
                <li>Authentification multi-facteurs (optionnel)</li>
                <li>Conformité RGPD</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Compatibilité</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Navigateurs modernes (Chrome, Firefox, Safari, Edge)</li>
                <li>Support mobile (iOS, Android)</li>
                <li>Progressive Web App (PWA)</li>
                <li>Mode offline pour émargement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Spécifications UI/UX */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            5. Spécifications UI/UX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">Principes de Design</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium text-sm mb-2">Mobile-First</h5>
                <p className="text-xs text-muted-foreground">
                  Interface optimisée pour les appareils mobiles avec adaptabilité desktop
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium text-sm mb-2">Simplicité</h5>
                <p className="text-xs text-muted-foreground">
                  Actions en 3 clics maximum, interface intuitive sans formation
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium text-sm mb-2">Accessibilité</h5>
                <p className="text-xs text-muted-foreground">
                  Conformité WCAG 2.1 AA, support des lecteurs d'écran
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Wireframes Principaux</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• <strong>Dashboard Formateur:</strong> Vue d'ensemble des sessions, actions rapides</div>
              <div>• <strong>Émargement Étudiant:</strong> Scan QR code, signature, confirmation</div>
              <div>• <strong>Interface Admin:</strong> Gestion globale, analytics, paramétrage</div>
              <div>• <strong>Écran Mobile:</strong> Interface tactile optimisée, gestes intuitifs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Planning et Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            6. Planning de Déploiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Phase 1 - Foundation (2 semaines)</h4>
                  <Badge variant="secondary">Quick Wins</Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• QR Code émargement</li>
                  <li>• Interface mobile responsive</li>
                  <li>• Notifications push basiques</li>
                  <li>• Amélioration UX existante</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Phase 2 - Automation (4 semaines)</h4>
                  <Badge variant="secondary">Core Features</Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dashboard analytics temps réel</li>
                  <li>• Workflow automatisé</li>
                  <li>• Géolocalisation optionnelle</li>
                  <li>• Système de validation en cascade</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Phase 3 - Intelligence (6 semaines)</h4>
                  <Badge variant="secondary">Advanced</Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• IA prédictive d'absentéisme</li>
                  <li>• Biométrie avancée (optionnel)</li>
                  <li>• Analytics avancées et ML</li>
                  <li>• Intégrations externes</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Critères d'Acceptation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            7. Critères d'Acceptation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Critères Fonctionnels</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-3 w-3 text-green-600" />
                  <span>Émargement en &lt;30 secondes via QR code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-3 w-3 text-green-600" />
                  <span>Dashboard temps réel opérationnel</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-3 w-3 text-green-600" />
                  <span>Génération automatique des rapports</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-3 w-3 text-green-600" />
                  <span>Interface mobile fonctionnelle</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Critères Techniques</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-3 w-3 text-green-600" />
                  <span>Temps de réponse &lt;200ms</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-3 w-3 text-green-600" />
                  <span>Support 500+ utilisateurs simultanés</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-3 w-3 text-green-600" />
                  <span>Disponibilité 99.9%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-3 w-3 text-green-600" />
                  <span>Tests automatisés &gt;90% couverture</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 8. Risques et Mitigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            8. Analyse des Risques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                risk: "Résistance au changement des utilisateurs",
                impact: "Élevé",
                probability: "Moyen", 
                mitigation: "Formation progressive, accompagnement, phase pilote"
              },
              {
                risk: "Performance insuffisante en pic de charge",
                impact: "Élevé",
                probability: "Faible",
                mitigation: "Tests de charge, architecture scalable, monitoring"
              },
              {
                risk: "Problèmes de connectivité mobile",
                impact: "Moyen",
                probability: "Moyen",
                mitigation: "Mode offline, synchronisation différée, cache local"
              },
              {
                risk: "Faille de sécurité des données",
                impact: "Critique",
                probability: "Faible",
                mitigation: "Audit sécurité, chiffrement, tests de pénétration"
              }
            ].map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-sm">{item.risk}</h5>
                  <div className="flex space-x-2">
                    <Badge variant={item.impact === 'Critique' ? 'destructive' : item.impact === 'Élevé' ? 'default' : 'secondary'}>
                      {item.impact}
                    </Badge>
                    <Badge variant="outline">{item.probability}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Mitigation:</strong> {item.mitigation}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 9. Budget et Ressources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            9. Estimation Budget et Ressources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Ressources Humaines</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Chef de Projet</span>
                  <Badge variant="outline">1 personne / 12 semaines</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Développeur Full-Stack Senior</span>
                  <Badge variant="outline">1 personne / 10 semaines</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">UX/UI Designer</span>
                  <Badge variant="outline">1 personne / 4 semaines</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Testeur QA</span>
                  <Badge variant="outline">1 personne / 6 semaines</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Infrastructure Technique</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Serveurs Cloud (dev/prod)</span>
                  <Badge variant="outline">500€/mois</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Licences logicielles</span>
                  <Badge variant="outline">2000€</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Audit sécurité</span>
                  <Badge variant="outline">5000€</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Formation utilisateurs</span>
                  <Badge variant="outline">3000€</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation et signatures */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-primary">Validation du Cahier des Charges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Direction</h4>
              <div className="h-16 border-2 border-dashed border-gray-300 rounded mb-2"></div>
              <p className="text-xs text-muted-foreground">Signature et date</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">DSI</h4>
              <div className="h-16 border-2 border-dashed border-gray-300 rounded mb-2"></div>
              <p className="text-xs text-muted-foreground">Signature et date</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Équipe Projet</h4>
              <div className="h-16 border-2 border-dashed border-gray-300 rounded mb-2"></div>
              <p className="text-xs text-muted-foreground">Signature et date</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecificationDocument;