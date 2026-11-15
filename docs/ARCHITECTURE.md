# GESTOCK — Fondations d'architecture

Version 0.1 — 15 novembre 2026  
Document de cadrage produit et architecture logique du MVP. Ceci n'est ni une migration SQL ni une implémentation.

## 1. Décisions structurantes

- SaaS de gestion commerciale pour boutiques, commerçants, grossistes et distributeurs au Sénégal et en Afrique francophone.
- Périmètre strict : produits, stock, ventes, bénéfices/marges, commandes et clients. Pas de comptabilité générale, paie, RH ou ERP étendu.
- Français, FCFA par défaut, interface responsive ordinateur/tablette/mobile.
- Un espace indépendant par commerçant (tenant), avec isolation stricte des données.
- Essai gratuit de 14 jours envisagé, puis abonnement. Les règles de restriction seront validées avant implémentation.
- Socle observé : React 19, TypeScript, Vite, TanStack Start/Router, TanStack Query, Tailwind CSS v4, Radix/shadcn et Vitest. Supabase est envisagé mais n'est pas encore configuré dans le dépôt audité.

## 2. Principes non négociables

1. Isolation des boutiques côté serveur et base de données : l'interface seule ne protège rien.
2. Traçabilité de chaque entrée, sortie, ajustement, vente, annulation et retour.
3. Historique fiable : une vente conserve les prix, remises et coûts utilisés à sa validation.
4. Opérations atomiques : validation de vente et sortie de stock réussissent ou échouent ensemble.
5. Idempotence : double clic, retry ou répétition réseau ne créent pas de doublons.
6. Distinguer chiffre d'affaires, encaissements, marge brute et bénéfice net. Ne pas afficher de bénéfice net sans données de charges.
7. Aucun bouton décoratif ni fonctionnalité simulée.
8. Préparer les rôles d'équipe sans construire prématurément un système complexe.

## 3. Architecture fonctionnelle

### Boutique et accès
- Une boutique est le tenant principal.
- Prévoir les appartenances utilisateur-boutique et un rôle, même si le MVP démarre avec le propriétaire administrateur.
- Toute requête métier est limitée aux boutiques auxquelles l'utilisateur appartient.
- Les autorisations sont vérifiées côté serveur et en base, jamais uniquement dans le navigateur.

### Produits et variantes
- Produit : nom, référence, description, catégorie, image, statut.
- Produit simple : une unité stockable. Produit à variantes : déclinaisons (taille, couleur, modèle, format), chacune avec référence éventuelle et stock propre.
- Tarifs possibles : détail, demi-gros, gros. Un tarif non configuré n'est jamais inventé.
- Le coût courant sert aux nouvelles entrées ; chaque vente conserve un coût unitaire historique.
- Unités configurables : pièce, carton, kg, litre, paquet, etc. Les conversions nécessitent un facteur explicite.

### Stock
- Stock suivi par produit simple ou variante.
- Journal immuable des mouvements : boutique, article, type, quantité signée, date, motif, référence métier et auteur.
- Types initiaux : stock initial, entrée/approvisionnement, vente, retour client, ajustement positif/négatif, annulation compensatoire.
- Choisir une seule source de vérité : journal de mouvements ou solde transactionnel réconcilié avec ce journal.
- Inventaire : les écarts validés créent des mouvements d'ajustement, sans réécrire l'historique.
- Seuil d'alerte configurable par article stockable.

### Ventes et paiements
- Vente avec numéro, statut, date, client facultatif, lignes, total, remise, montant payé et reste dû.
- Chaque ligne conserve libellé/SKU, variante, quantité, prix vendu, remise allouée et coût unitaire retenu.
- Brouillon sans impact stock ; validation avec sortie de stock atomique.
- Une annulation après validation ne supprime pas le document : elle crée une opération compensatoire.
- Paiements séparés : montant, date, moyen, référence et auteur. Paiements partiels autorisés.
- Retours et remboursements doivent être explicites, jamais assimilés à une suppression de paiement.

### Commandes clients
- Une commande est distincte d'une vente et d'un encaissement.
- Statuts proposés : brouillon, en attente, confirmée, en préparation, prête, partiellement livrée, livrée, annulée.
- Lignes avec produit/variante, quantité, prix convenu et remise.
- Acomptes et règlements suivis séparément.
- Par défaut, une commande ne diminue pas le stock. Une réservation est une règle distincte à valider.
- La livraison partielle ou totale déclenche la sortie de stock correspondante.

### Clients
- Fiche minimale : nom/raison sociale, téléphone, email/adresse facultatifs, notes.
- Historique des ventes/commandes, achats, paiements et solde dû.
- Une vente comptoir peut être enregistrée sans client.

### Marges et tableau de bord
- CA net : somme des ventes validées, après remises et corrections liées aux retours.
- Encaissements : paiements effectivement reçus sur la période, distincts du CA.
- Coût des marchandises vendues : quantité × coût unitaire figé, corrigé des retours.
- Marge brute : CA net moins coût des marchandises vendues.
- Bénéfice net : hors périmètre tant que les charges ne sont pas saisies et rattachées selon une règle définie. Employer « marge brute » ou « résultat commercial estimé ».
- Indicateurs : ventes, encaissements, marge brute, panier moyen, produits les plus vendus, stock faible, commandes à traiter et soldes clients.
- Les périodes suivent le fuseau horaire de la boutique.

## 4. Modèle de données logique proposé

Ce modèle est conceptuel et doit être validé avec Lovable avant toute création de tables.

| Entité | Rôle |
|---|---|
| profiles | Profil applicatif lié à l'utilisateur authentifié |
| shops | Espace indépendant du commerçant |
| shop_memberships | Appartenance utilisateur-boutique et rôle |
| subscriptions | Essai, statut d'abonnement et période d'accès |
| categories | Catégories et sous-catégories |
| products | Fiches produits |
| product_variants | Déclinaisons stockables |
| stock_items | Unité stockable : produit simple ou variante |
| stock_movements | Journal des mouvements de stock |
| stock_thresholds | Seuils d'alerte |
| customers | Fiches clients |
| sales | En-têtes de ventes |
| sale_items | Lignes de vente et snapshots historiques |
| payments | Paiements liés à une vente ou commande |
| orders | Commandes clients |
| order_items | Lignes de commande |
| audit_events | Journal des actions sensibles |

Contraintes :
- Toutes les tables métier portent un identifiant de boutique explicite pour faciliter RLS et les requêtes.
- Les clés étrangères et contraintes uniques incluent le périmètre boutique lorsque nécessaire.
- Références produits, ventes et commandes uniques dans une boutique, pas nécessairement globalement.
- Montants en décimal exact, jamais en flottant binaire ; précision et arrondis FCFA à décider.
- Quantités décimales uniquement pour les unités fractionnables.
- Horodatages cohérents et affichage dans le fuseau de la boutique.
- Archivage plutôt que suppression physique des entités liées à un historique.
- Les documents validés et mouvements ne sont pas supprimés par les actions ordinaires.
- Les lignes conservent les snapshots permettant de restituer l'historique même si le produit change ou est archivé.

## 5. Navigation MVP

1. Tableau de bord
2. Produits
3. Stock
4. Ventes
5. Bénéfices / Marges
6. Commandes
7. Clients
8. Notifications
9. Paramètres de la boutique

Sur mobile, navigation compacte et actions principales accessibles.

## 6. Parcours critiques

- Première utilisation : inscription, authentification, création boutique, paramètres essentiels, activation de l'essai, premier produit, stock initial.
- Approvisionnement : article/variante, quantité/unité, coût, référence facultative, validation, mouvement d'entrée.
- Vente : articles, prix/remise, client facultatif, contrôle du stock, validation atomique, sortie stock, paiement total/partiel, reçu.
- Commande : client, lignes, prix, acompte, confirmation, préparation, livraison, sortie stock au moment de la remise effective, suivi du solde.
- Retour/annulation : document source, quantités, motif, contrôle des quantités déjà retournées, mouvement compensatoire et remboursement/avoir si applicable.

## 7. Sécurité et fiabilité

- Authentification par fournisseur fiable ; aucune clé secrète dans le navigateur ou le dépôt.
- RLS sur chaque table contenant des données de boutique.
- Politiques fondées sur une appartenance vérifiée, pas sur un shop_id librement fourni par le client.
- Validation vente, mouvement stock, annulation et livraison exécutés côté serveur/base dans une transaction contrôlée.
- Validation serveur des prix, quantités, droits, soldes et statuts ; totaux du navigateur non fiables.
- Journaliser les actions sensibles ; ne pas stocker de secrets ou données bancaires sensibles.
- Tests obligatoires avec deux comptes et deux boutiques, y compris accès direct par identifiant.
- Tester concurrence sur le dernier article, double soumission et retry réseau.
- Définir sauvegardes et restauration avant production.

## 8. Étapes de livraison

### Étape 0 — Fondations
Audit du dépôt, validation des règles métier, décisions ouvertes, stratégie de branches et conventions de tests. Aucun changement de schéma manuel.

### Étape 1 — Socle applicatif
Identité GESTOCK, routage, layout responsive, authentification, création de boutique, adhésions et isolation RLS. Essai de 14 jours après validation des règles commerciales.

### Étape 2 — Catalogue et stock
Catégories, produits simples/variantes, unités, stock initial, approvisionnements, mouvements, inventaire et alertes.

### Étape 3 — Ventes et paiements
Brouillon/validation, sorties atomiques, snapshots, paiements partiels, reçus, annulations et retours.

### Étape 4 — Clients et commandes
Fiches clients, commandes, acomptes, soldes, statuts et livraisons partielles.

### Étape 5 — Marges et pilotage
Indicateurs vérifiables, filtres temporels et exports utiles.

### Étape 6 — Durcissement et lancement
Tests E2E, sécurité multi-tenant, accessibilité, performance mobile, sauvegardes, monitoring et parcours abonnement.

## 9. Décisions à trancher avant le schéma

1. Coût de stock : coût moyen pondéré recommandé pour le MVP ou FIFO ? Le coût figé par vente est obligatoire.
2. Stock négatif : blocage par défaut recommandé ; autorisation exceptionnelle à décider.
3. Commandes : réserver à la confirmation ou décrémenter uniquement à la livraison ?
4. Approvisionnements : entrée de stock avec coût ou document fournisseur complet dès le MVP ?
5. Retours : retour en stock après contrôle, avec choix revendable/endommagé ?
6. Tarifs détail/demi-gros/gros : seuils de quantité configurables par produit ?
7. Unités et conversions indispensables au lancement ?
8. Moyens de paiement à proposer dès la première version ?
9. Après les 14 jours : lecture seule recommandée, export possible et données conservées, ou blocage complet ?
10. Un utilisateur peut-il gérer plusieurs boutiques dès le MVP, ou une seule boutique avec architecture extensible ?

## 10. Critères d'acceptation du MVP

- Créer une boutique et gérer produits/variantes.
- Tracer stock initial, entrées, sorties et ajustements.
- Une vente validée décrémente le bon stock une seule fois.
- Les prix et coûts historiques d'une vente restent inchangés.
- Paiements partiels et soldes exacts.
- Les commandes n'affectent le stock qu'au déclencheur choisi.
- Marges explicables et réconciliables avec les ventes.
- Client facultatif pour vente comptoir.
- Isolation stricte entre boutiques.
- Aucun parcours critique avec données fictives ou boutons inactifs.
- Tests couvrant règles métier, isolation et concurrence.

## Gouvernance technique

Le fichier AGENTS.md indique que Lovable gère les changements de schéma et les migrations. Aucune migration SQL ne sera donc ajoutée manuellement. Cette branche sert à préparer la documentation et les changements applicatifs non générés ; les changements de base seront demandés à Lovable.
