# GESTOCK — Décisions produit recommandées

Version 0.1 — 15 novembre 2026  
Statut : recommandations de cadrage à valider avant la conception du schéma de base de données.

Ce document tranche les ambiguïtés du MVP avec des choix simples, sûrs et adaptés aux petits commerces. Les choix sont volontairement conservateurs : ils privilégient la fiabilité des stocks et des chiffres plutôt que la multiplication des options.

## D-001 — Méthode de valorisation du stock

**Décision recommandée : coût moyen pondéré (CMP) mobile.**

À chaque entrée de stock valorisée, recalculer le coût moyen de l'article stockable selon la quantité et la valeur disponibles avant l'entrée, plus la nouvelle entrée. Une vente consomme le coût moyen en vigueur au moment de sa validation ; ce coût est copié sur la ligne de vente et devient immuable.

- Une entrée gratuite, un coût nul ou une correction de coût doit suivre une règle explicite et être auditée.
- Les retours de vente réintègrent le coût historique de la vente d'origine, pas le coût moyen courant.
- Les ajustements d'inventaire ne doivent pas inventer une valeur d'achat ; ils demandent un motif et, si nécessaire, un coût documenté.
- Les calculs sont faits côté serveur/base avec précision décimale exacte.

**Pourquoi :** méthode plus simple à expliquer et à maintenir que FIFO pour un premier produit multi-secteurs. FIFO pourra être ajouté plus tard si des clients le demandent.

## D-002 — Stock négatif

**Décision : interdit par défaut.**

La validation d'une vente ou d'une livraison est refusée si la quantité disponible est insuffisante. Le contrôle doit être transactionnel afin d'éviter que deux ventes simultanées consomment le même dernier article.

Une autorisation exceptionnelle de stock négatif n'est pas incluse au MVP. Elle pourra être étudiée plus tard avec des permissions, une traçabilité et un impact clair sur la valorisation.

## D-003 — Commandes et réservation

**Décision : une commande ne réserve pas automatiquement le stock.**

La commande représente un engagement commercial, mais le stock ne diminue qu'au moment où les marchandises sont effectivement sorties (livraison/remise). Le MVP affiche donc la quantité physique disponible ; il ne prétend pas afficher une quantité « disponible à la vente » diminuée des commandes ouvertes.

La réservation pourra être ajoutée ultérieurement comme action explicite, avec date d'expiration et libération automatique/manuelle.

## D-004 — Approvisionnements

**Décision : entrée de stock simple avec coût unitaire et fournisseur facultatif.**

Le MVP permet d'enregistrer une entrée : article/variante, quantité, unité, coût unitaire, date, note/référence et fournisseur facultatif. Il n'inclut pas encore un cycle complet de commande fournisseur, factures fournisseurs, échéances ou comptes fournisseurs.

Chaque entrée validée crée un mouvement de stock et met à jour le CMP. Une correction se fait par mouvement compensatoire, jamais par modification silencieuse de l'entrée d'origine.

## D-005 — Retours et marchandises endommagées

**Décision : retour soumis à inspection.**

À l'enregistrement d'un retour, l'utilisateur choisit l'état :
- **Remettre en stock :** article contrôlé et revendable ; crée une entrée de stock au coût historique de la vente.
- **Endommagé / non revendable :** n'augmente pas le stock vendable ; crée une trace de retour et une perte/zone non vendable à modéliser.
- **À contrôler :** retour en attente ; ne rejoint pas le stock vendable avant décision.

La quantité retournée ne peut jamais dépasser la quantité vendue moins les quantités déjà retournées. Le remboursement ou l'avoir est un événement financier distinct du mouvement physique.

## D-006 — Tarifs détail, demi-gros et gros

**Décision : tarifs configurés par produit, sans seuil global imposé.**

Un produit peut définir un prix détail, un prix demi-gros et un prix gros, avec un seuil de quantité propre à chaque niveau. Le commerçant choisit le niveau au moment de la vente ; l'application peut suggérer le niveau selon la quantité, mais ne doit pas appliquer un tarif inférieur sans l'indiquer clairement.

Si un niveau de prix ou son seuil n'est pas configuré, il est indisponible. Les prix appliqués sont figés sur les lignes de vente.

## D-007 — Unités et conversions

**Décision : unités libres parmi une liste de départ, conversions explicites par produit.**

Liste initiale suggérée : pièce, paquet, carton, lot, kilogramme, gramme, litre, millilitre, mètre et sac. Cette liste doit être ajustable sans migration lourde.

Une conversion n'existe que si le commerçant définit un facteur exact pour le produit concerné (ex. 1 carton = 12 pièces). Les ventes, entrées et inventaires sont convertis vers une unité de stock de référence. Pas de conversion automatique entre unités incompatibles.

## D-008 — Moyens de paiement

**Décision : espèces, mobile money, virement, carte et autre.**

Le moyen « mobile money » ne présume d'aucun fournisseur. Le commerçant peut ajouter une référence facultative (transaction, reçu ou note). GESTOCK ne collecte ni ne conserve de données de carte bancaire sensibles. L'intégration d'un prestataire de paiement en ligne est hors périmètre du MVP.

## D-009 — Fin de l'essai gratuit

**Décision : lecture seule après expiration, données conservées.**

Après 14 jours, si aucun abonnement actif n'est enregistré :
- consultation des données existantes autorisée ;
- création/modification/validation de produits, mouvements, ventes et commandes désactivée ;
- export des données essentielles autorisé ;
- aucune suppression automatique des données ;
- accès réactivé après confirmation d'un abonnement valide.

L'essai commence à la création effective de la boutique et ne peut pas être relancé par simple modification du profil. Les dates et changements de statut sont contrôlés côté serveur. Les règles exactes de paiement et de facturation restent à définir avant intégration.

## D-010 — Nombre de boutiques par compte

**Décision : une boutique active par compte au lancement, modèle de données prêt pour plusieurs boutiques.**

Cela réduit la complexité de l'onboarding et des abonnements. Le modèle d'appartenance utilisateur-boutique est conservé pour permettre ensuite plusieurs boutiques et des employés avec rôles sans refonte majeure.

## D-011 — Fuseau horaire et devise

**Décision : FCFA/XOF et Africa/Dakar par défaut, paramètres modifiables par boutique.**

Enregistrer les horodatages de manière cohérente côté serveur et interpréter les périodes de reporting selon le fuseau horaire de la boutique. Stocker les montants en décimal exact et ne jamais mélanger les montants de devises différentes dans un même indicateur. L'affichage FCFA peut omettre les décimales, mais les règles d'arrondi doivent être centralisées et documentées.

## D-012 — Définition des indicateurs

- **Ventes / CA net :** ventes validées, nettes des remises et retours selon la date de l'opération retenue.
- **Encaissements :** paiements reçus durant la période, même si la vente d'origine est antérieure.
- **Reste à payer :** total dû sur les documents moins les paiements et avoirs imputés.
- **Marge brute :** CA net moins coût des marchandises vendues, avec coût historique figé.
- **Bénéfice net :** non affiché au MVP ; il nécessite des charges d'exploitation structurées et une règle de rattachement.
- Les tableaux de bord doivent préciser la période et la définition de chaque indicateur. Aucun total ne doit mélanger commandes non livrées et ventes réalisées.

## Conséquences techniques communes

- Toutes les opérations de validation et de mouvement de stock sont transactionnelles et protégées contre la concurrence.
- Les documents validés sont immuables ; les corrections passent par des opérations compensatoires.
- Les montants et quantités sont calculés côté serveur/base, jamais acceptés comme vérité depuis le navigateur.
- Les journaux de stock, paiements et audit doivent conserver l'auteur, la date, le motif et la référence source.
- Les politiques d'accès doivent isoler strictement les boutiques.
- Les tests métier doivent couvrir les cas limites de ces décisions avant toute mise en production.

## Ordre de validation

Avant le schéma, confirmer en priorité : D-001 CMP, D-003 réservation des commandes, D-005 retours, D-009 fin d'essai et D-010 multi-boutiques. Les autres décisions sont réversibles avec un coût faible si elles sont prises avant l'implémentation.
