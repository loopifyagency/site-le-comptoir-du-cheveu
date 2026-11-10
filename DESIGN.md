# Design — Le Comptoir Du Cheveu

Surface : site vitrine (mode Persuade). Action principale : prendre rendez-vous (Planity ou téléphone).

## Thèse

Le salon est un comptoir de bistrot, le site en est le zinc : ardoise noire, craie blanche, tickets de papier.
Refus : le salon « élégant » (serif fin, beige, pastel). Rustique, atypique, noir et blanc.

## Monde visuel

- **Fil rouge** : le pointillé (points de conduite des menus, ligne de coupe, perforations, bords de boutons, focus).
- **Ardoise** : fond noir texturé (`assets/img/slate.jpg`), notes à la craie en Covered By Your Grace.
- **Papier** : ticket de caisse et tirages photo (`assets/img/paper.jpg`), scotch semi-transparent.
- **Mur clair** : plâtre (`assets/img/plaster.jpg`) pour les sections « carte », « avis » et « rendez-vous », bord en dents de scie (ciseaux cranteurs).
- **Couleur** : aucune dans l'interface. La seule couleur est celle des cheveux, révélée sur les photos au survol.

## Jetons

| Rôle | Nom | Valeur |
|---|---|---|
| Fond, texte sur clair | ardoise | `#0d0d0c` |
| Surfaces relevées | charbon | `#1a1a18` |
| Filets, douilles | fumée | `#33322e` |
| Texte secondaire sur sombre (6,7:1) | cendre | `#9b988f` |
| Papier du ticket, tirages | papier | `#e7e3d8` |
| Blanc, texte sur sombre | craie | `#f4f1e9` |
| Texte secondaire sur clair (6,2:1) | encre douce | `#5b5952` |

Typographies : Holtwood One SC (titres, majuscules, très grandes tailles), Libre Franklin 400/700 (texte, 17 px, interligne 1,6), Covered By Your Grace (notes manuscrites), Special Elite (ticket, données).

Mouvement : courbes `expo.out` / `expo.inOut` / `power3`, jamais linéaires hors scrub ; priorité à `transform` et `opacity` ; états de départ posés par JavaScript (le contenu reste visible si le script échoue) ; `prefers-reduced-motion` respecté.

## Signatures

1. Préchargeur : des ciseaux coupent le pointillé, l'écran s'ouvre en deux.
2. Hero : la lampe de comptoir révèle des notes à la craie cachées sur l'ardoise.
3. La carte : ardoises en défilement horizontal piloté par le scroll.
4. Le ticket de caisse qui s'imprime, chiffres comptés.
5. Galerie : noir et blanc jusqu'à ce que la couleur revienne au survol.
