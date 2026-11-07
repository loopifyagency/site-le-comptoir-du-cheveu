# Le Comptoir Du Cheveu

Site vitrine du salon de coiffure **Le Comptoir Du Cheveu** (5 rue de Siam, 29200 Brest).
Site statique : HTML, CSS et JavaScript, sans étape de build ni dépendance externe au chargement (librairies, polices et images sont dans le dépôt).

## Lancer le site

N'importe quel serveur statique convient :

```bash
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. (Passer par un serveur, pas par `file://`, pour que les polices se chargent.)

## Direction artistique

**Le site est un comptoir de bistrot.** Ardoise noire, craie blanche, tickets de papier. Rustique et atypique, strictement noir et blanc.

- **Fil rouge : le pointillé.** Points de conduite des menus (nom ········ prix), ligne de coupe du préchargeur, perforations, bords de boutons, soulignement des liens, focus clavier, barres de progression.
- **Palette (7 valeurs)** : `ardoise` #0d0d0c (fond), `charbon` #1a1a18 (surfaces), `fumée` #33322e (filets), `cendre` #9b988f (texte secondaire sur sombre), `papier` #e7e3d8 (ticket, tirages), `craie` #f4f1e9 (blanc), `encre douce` #5b5952 (texte secondaire sur clair). Aucune teinte de couleur dans l'interface.
- **Seule couleur du site : celle des cheveux.** Les photos sont en noir et blanc ; au survol (ou au centre de l'écran sur mobile), la teinte réelle revient.
- **Typographies** (auto-hébergées) : Holtwood One SC (caractères de bois d'affiche, titres géants), Libre Franklin (texte), Covered By Your Grace (notes à la craie), Special Elite (ticket de caisse).
- **Séparateurs** : bords en dents de scie (ciseaux cranteurs) entre sections sombres et claires, tickets découpés, bandes de scotch.

## Sections et mouvements

| Section | Mise en scène |
|---|---|
| Préchargeur | Des ciseaux coupent un pointillé de gauche à droite avec un compteur, puis l'écran s'ouvre en deux. |
| Hero | Titre lettre par lettre derrière un masque, parallax sur 4 couches (fond, mot fantôme, tirages photo, lampes), lampes suspendues qui se balancent et scintillent, **lampe de comptoir** : la lumière suit le curseur et révèle des notes à la craie cachées. |
| Marquee | Deux bandes qui se croisent ; vitesse et sens réagissent au scroll. |
| Savoir-faire | Section **pinnée** en 4 temps, rideau d'images, Ken Burns, rail pointillé qui se remplit. |
| La carte | **Défilement horizontal** piloté par le scroll : une ardoise par famille de prestations, inclinaison 3D avec reflet. |
| Le ticket | Un ticket de caisse qui s'imprime, chiffres qui comptent. |
| Galerie | Révélation en cercle, colonnes décalées, image qui bouge dans son cadre, couleur au survol. |
| Avis | Carrousel glissable (souris, tactile, flèches du clavier), boutons précédent/suivant, pause. |
| Bon à savoir | Accordéon animé. |
| Rendez-vous | Numéro cliquable géant et sceau tournant magnétique. |
| Nous trouver | Carte Google Maps, horaires avec le jour courant surligné, statut « ouvert / fermé » calculé à l'heure de Brest. |
| Pied de page | Nom géant révélé lettre par lettre. |

Aussi : en-tête qui se cache au scroll descendant, menu mobile plein écran, barre de progression de lecture, boutons magnétiques, curseur (écrans à pointeur précis uniquement), bouton « Appeler » flottant sur mobile.

## Accessibilité et robustesse

- `prefers-reduced-motion` : préchargeur réduit à un fondu, pas de défilement fluide ni d'épinglage, mises en page empilées, aucune animation d'entrée.
- Fonctionne **sans JavaScript** (contenu empilé, tout reste lisible et cliquable).
- Mobile et tablette : sections épinglées désactivées, la carte passe en pile verticale.
- Navigation clavier complète (focus en pointillé), lien d'évitement, titres hiérarchisés, textes alternatifs, carrousel avec pause (WCAG 2.2.2) et annonce de position, accordéon et menu avec `aria-expanded`.
- SEO : `title`, meta description, données structurées `HairSalon` (adresse, téléphone, horaires).

## Contenu

- **Repris du brief tel quel** : forfaits, durées, prix, mises en garde, horaires, numéro de téléphone, lien Planity, lien Google Maps, et les 5 avis (mot pour mot, y compris les fautes de frappe et les emojis).
- **Rédigé pour le site** : accroches, titres, textes de la section « savoir-faire », FAQ. Ils ne reprennent que des faits du brief ; rien n'a été inventé (pas de note, pas d'ancienneté, pas de nombre de clients).
- **Chiffres du ticket** (calculés sur les données) : 20 prestations à la carte, 5 jours d'ouverture, 9 h d'affilée du mardi au vendredi, forfait le plus doux dès 28 €.
- Les deux liens « réseaux sociaux » du brief étaient la même adresse Planity : un seul lien est affiché.

### Modifier les horaires

Les horaires apparaissent à quatre endroits : le tableau de la section « Nous trouver » et le pied de page (`index.html`), les données structurées (`index.html`, bloc JSON-LD) et l'objet `HOURS` en haut de `assets/js/main.js` (statut ouvert/fermé). La note « Mercredi 11 novembre (Armistice) » s'affiche automatiquement jusqu'au 11/11/2026 puis disparaît (voir `data-armistice` et `initStatus`).

## À fournir ou à décider

- **Photos en meilleure définition.** Les 5 photos reçues mesurent environ 200 × 270 px ; elles ont été agrandies ×3 et passées en noir et blanc avec du grain, ce qui les adoucit sans les rendre nettes. Le site les montre en petit format (tirages épinglés) pour cette raison. Avec des originaux de 1500 px de large ou plus, il suffit de remplacer les fichiers de `assets/img/` (`balayage`, `blond`, `chignon`, `vitrine`, `facade`, en versions couleur et `-bw`).
- **Vidéo du hero** : non réalisée (aucun outil de génération vidéo n'était disponible). Le hero fonctionne avec des photos ; si une vidéo 16:9 est fournie, elle se glisse dans `.hero__bg` (`autoplay muted loop playsinline`, image de secours déjà en place).
- **Nom de domaine** : une fois connu, ajouter `<link rel="canonical">`, `og:image`, `og:url` et les champs `url` et `image` des données structurées (ils nécessitent une URL absolue).
- **Mentions légales / politique de confidentialité** : à fournir par le salon ; non rédigées.
- **Google Maps** : l'iframe est chargée depuis `google.com/maps` (sans clé d'API). Un repli affichant l'adresse est présent derrière.

## Structure

```
index.html              page unique
assets/css/style.css    styles (jetons de design en tête de fichier)
assets/js/main.js       animations et interactions
assets/vendor/          GSAP 3.15.1 (ScrollTrigger, SplitText, Draggable), Lenis 1.3.27
assets/fonts/           polices (woff2, sous-ensemble latin)
assets/img/             photos traitées, textures (ardoise, plâtre, papier, grain), favicon
.claude/skills/         skills de design installés dans le projet
```

## Licences des composants

GSAP : licence standard GSAP (gratuite, plugins inclus). Lenis : MIT. Holtwood One SC, Libre Franklin, Covered By Your Grace : SIL OFL 1.1. Special Elite : Apache 2.0.
