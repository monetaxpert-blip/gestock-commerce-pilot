# Gestock Commerce Pilot

Agis comme un Chief Product Officer (CPO), architecte logiciel SaaS et expert en conception de solutions de gestion commerciale (ERP/POS). Tu dois concevoir l'architecture fonctionnelle de GESTOCK avec une approche professionnelle, rigoureuse et évolutive.

## 1. PRÉSENTATION DU PROJET

GESTOCK est un SaaS de gestion commerciale destiné à tous les types de commerces : boutiques de vêtements, chaussures, cosmétiques, alimentation, électronique, magasins généralistes, grossistes et distributeurs.

Marché initial : Sénégal et Afrique francophone.

Devise principale : FCFA.
Langue : français.
Plateforme cible : application web responsive (ordinateur, tablette et mobile).
Outil de développement prévu : Lovable.
Backend envisagé : Supabase.

GESTOCK doit permettre à un commerçant de piloter simplement son activité commerciale depuis un espace personnel indépendant.

## 2. PÉRIMÈTRE FONCTIONNEL

La plateforme repose sur cinq modules métier :

**A. PRODUITS**
- Création et modification des produits.
- Catégories et sous-catégories.
- Images, références et descriptions.
- Prix d'achat et prix de vente.
- Gestion des variantes : tailles, couleurs, modèles, formats.
- Gestion de plusieurs tarifs : détail, demi-gros et gros.

**B. STOCK**
- Quantités disponibles.
- Entrées et sorties.
- Historique des mouvements.
- Ajustements et inventaires.
- Alertes de stock faible et rupture.
- Gestion des variantes individuellement.

**C. VENTES**
- Enregistrement des ventes.
- Vente au détail, demi-gros et gros.
- Sélection des produits et variantes.
- Gestion des quantités et remises.
- Association facultative d'un client.
- Paiements complets et partiels.
- Historique et reçus.

**D. BÉNÉFICES**
- Calcul automatique des marges.
- Marge par produit et par vente.
- Résultats journaliers, hebdomadaires et mensuels.
- Comparaison des performances.
- Identification des produits les plus rentables.
- Distinction entre chiffre d'affaires, encaissements et bénéfice.

**E. CLIENTS ET COMMANDES**
- Fiches clients.
- Historique des achats.
- Création et suivi des commandes.
- Commandes en attente, confirmées, préparées, livrées ou annulées.
- Gestion des acomptes et soldes restants.
- Suivi des créances clients.

Le tableau de bord, les notifications et les paramètres complètent ces cinq modules.

## 3. MODÈLE D'UTILISATION

Chaque commerçant possède son propre espace indépendant.

Prévoir une architecture multi-tenant permettant une isolation stricte des données entre les boutiques.

Anticiper la possibilité d'ajouter des employés et des permissions ultérieurement, sans complexifier le MVP.

## 4. PARCOURS UTILISATEUR

Définis précisément les parcours suivants :

- Inscription et authentification.
- Création et configuration d'une boutique.
- Activation d'un essai gratuit de 14 jours.
- Première création de produit.
- Enregistrement d'un approvisionnement.
- Réalisation d'une vente.
- Mise à jour automatique du stock.
- Calcul automatique de la marge.
- Création d'une commande client.
- Enregistrement d'un acompte et d'un règlement.
- Consultation des résultats commerciaux.

## 5. RÈGLES MÉTIER OBLIGATOIRES

Définis les règles garantissant la cohérence entre les modules.

Exemples :
- Une vente validée diminue automatiquement le stock.
- Une annulation autorisée rétablit les quantités correspondantes.
- Un paiement partiel ne doit pas être confondu avec le montant total de la vente.
- Une commande ne doit pas diminuer le stock avant la sortie effective des marchandises, sauf règle explicitement définie de réservation.
- Les bénéfices doivent être calculés à partir du coût d'achat applicable au moment de la vente.
- Les changements de prix ne doivent pas modifier rétroactivement les anciennes ventes.
- Chaque mouvement de stock doit être traçable.
- Une même opération ne doit jamais être enregistrée deux fois à cause d'une double validation.
- Les calculs doivent gérer les retours, remises et paiements partiels.

## 6. ADAPTABILITÉ AUX COMMERCES

GESTOCK doit gérer les produits simples et les produits à variantes.

Prévoir différentes unités de mesure : pièce, carton, kilogramme, litre, paquet, etc.

L'architecture doit pouvoir s'adapter à plusieurs secteurs sans créer une application différente pour chaque commerce.

## 7. LIVRABLES ATTENDUS

Produis un document de conception structuré comprenant :

1. Vision et positionnement fonctionnel.
2. Périmètre précis du MVP.
3. Arborescence complète de navigation.
4. Description détaillée de chaque module.
5. Liste des écrans et leur rôle.
6. Parcours utilisateurs.
7. Règles métier détaillées.
8. Relations et interactions entre les modules.
9. Indicateurs et formules de calcul.
10. Cas particuliers et erreurs à anticiper.
11. Fonctionnalités reportées aux versions ultérieures.

Pour chaque fonctionnalité, précise son objectif, son comportement attendu, ses données nécessaires et ses interactions avec les autres modules.

## 8. CONSIGNES IMPORTANTES

- Ne commence pas à développer l'application.
- Ne crée aucune table ni migration pour le moment.
- Ne génère pas d'interface provisoire.
- Ne simule aucune fonctionnalité.
- Ne rajoute pas de modules ERP inutiles comme la comptabilité générale ou la gestion complète des ressources humaines.
- Ne suppose pas qu'un produit est nécessairement vendu à l'unité.
- N'invente pas de règles métier sans les signaler.
- Identifie les ambiguïtés et propose des décisions argumentées.

Nous voulons une architecture professionnelle, cohérente, réaliste et directement exploitable pour les étapes suivantes du développement.

**Ta première mission est de livrer cette conception et d'attendre notre validation avant toute implémentation.**

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/823a6997-aab0-4107-82b7-459091e3a79f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
