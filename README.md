# Convertisseur

Application de conversion d'unités. Backend **Node.js / Express**, frontend **React** avec des composants **Material UI**.

Les calculs sont faits en **arithmétique décimale à 50 chiffres** plutôt qu'en virgule flottante binaire : `0,1 + 0,2` donne exactement `0,3`, et `100 °C` donne exactement `212 °F`.

**19 catégories, 171 unités, 146 tests automatisés.**

---

## Installation et démarrage

### Prérequis

**Node.js 20 ou plus récent** et **Git**. Aucune base de données, aucun service externe, aucune clé d'API.

### Depuis un clone neuf

```bash
git clone https://github.com/abdoudou05/lab02-convertisseur.git
cd lab02-convertisseur
npm install
npm run dev
```

L'interface s'ouvre sur <http://localhost:5173>, l'API écoute sur <http://localhost:4000>.
Vite relaie les appels `/api` vers le serveur Node : aucune URL absolue n'est codée en dur.

### Un seul port, en production

```bash
npm run build
npm start
```

Le serveur Node sert alors le bundle et l'API sur <http://localhost:4000>.

### Tests

```bash
npm test              # les deux suites
npm run test:server   # moteur de conversion et API
npm run test:client   # utilitaires numériques de l'interface
```

146 tests (127 serveur, 19 client) couvrent les facteurs de conversion, les propriétés mathématiques du moteur, l'évaluateur d'expressions, la mise en forme, toutes les routes HTTP, les utilitaires numériques de l'interface et la correspondance entre les catégories du serveur et leurs icônes.

---

## Nouveautés du laboratoire 3

Le laboratoire 3 reprend l'application du laboratoire 2 et l'améliore à deux, en passant par des branches, des pull requests et des revues de code.

| Contribution | Branche | Pull request |
| --- | --- | --- |
| Catégorie **Accélération** et sous-titre calculé depuis le catalogue | `feature/categorie-acceleration` | #1 |
| **Icônes** des cinq catégories qui n'en avaient pas, et test de correspondance | `fix/icones-categories` | #2 |
| Mise à jour du README | `docs/readme-lab3` | #3 |

### Catégorie Accélération

- 8 unités, base m/s² : m/s², mGal, Gal, km/h/s, po/s², pi/s², mi/h/s et pesanteur normale g₀.
- Facteurs dérivés des constantes exactes existantes (`INCH_M`, `FOOT_M`, `MILE_M`, `G_N`), jamais recopiés.
- Le sous-titre de l'en-tête n'est plus codé en dur : le nombre de catégories et d'unités est calculé à partir du catalogue servi par l'API. Ajouter une catégorie côté serveur le met à jour tout seul.

### Icônes des catégories

- Force, Couple, Fréquence, Débit de données et Masse volumique affichaient l'icône générique : leur nom d'icône n'était pas associé côté client. Elles ont maintenant chacune la leur.
- La table de correspondance est sortie dans `client/src/components/categoryIcons.js`, un module sans JSX, pour être testable par `node --test`.
- `client/test/category-icons.test.js` échoue si une catégorie du serveur n'a pas d'icône, si une entrée n'est pas un composant React, ou si une icône n'est plus utilisée.

### Versions

| Tag | Contenu |
| --- | --- |
| `lab2-final` | Version remise au laboratoire 2 |
| `lab3-final` | Version finale du laboratoire 3, après fusion des trois pull requests |

---

## Ce que fait l'application

### Conversion

- **19 catégories** : longueur, masse, volume, température, superficie, vitesse, temps, pression, énergie, puissance, données numériques, angle, accélération, force, couple, fréquence, débit de données, masse volumique, consommation de carburant.
- **Conversion en direct** pendant la frappe, amortie et annulable, sans clignotement du résultat.
- **Tableau de toutes les unités** : la valeur saisie exprimée simultanément dans chaque unité de la catégorie.
- **Ordres de grandeur** : une règle logarithmique qui situe chaque unité les unes par rapport aux autres.
- **Écriture composée** : `1,75 m` se lit `5 pi 8,9 po`, `3 661 s` se lit `1 h 1 min 1 s`.
- **Fractions impériales** : le résultat approché au demi, quart, huitième jusqu'au soixante-quatrième.

### Calcul

Le champ de valeur accepte une **expression arithmétique complète**, pas seulement un nombre :

```
(12+8)*3,5        →  70
sqrt(2)*100       →  141,421
2^10              →  1024
1 234,5 + 0,5     →  1235
```

Opérateurs `+ - * / ^`, parenthèses, signe unaire, constantes `pi` et `e`, fonctions `sqrt cbrt abs ln log exp sin cos tan round floor ceil`.
L'évaluation se fait par découpage en jetons puis algorithme *shunting-yard* : **ni `eval`, ni `Function`**, aucune exécution de code.

Les priorités suivent la convention mathématique : `-2^2` vaut `-4`, et `2^3^2` vaut `512`.

Les flèches **haut** et **bas** ajustent la valeur sans quitter le clavier : d'une unité, de dix avec `Maj`, d'un dixième avec `Alt`. Le calcul se fait sur des entiers mis à l'échelle, donc `0,3` moins `0,1` donne bien `0,2` et non `0,19999999999999998`. Une expression n'est pas incrémentée : les flèches y gardent leur comportement habituel.

### Saisie bilingue

`1 234,56` et `1,234.56` donnent le même nombre. Les espaces insécables et fines insécables sont acceptés comme séparateurs de milliers.

### Réglages

Un panneau complet, persisté dans le navigateur :

| Réglage | Valeurs |
| --- | --- |
| Thème | système, clair, sombre |
| Accentuation | 6 teintes, toutes conformes AA dans les deux modes |
| Densité | compacte, normale, aérée |
| Précision | 0 à 20, en chiffres significatifs ou en décimales |
| Notation | automatique, développée, scientifique, ingénieur |
| Arrondi | 6 modes, dont pair et troncature |
| Fractions | désactivées, ou 1/2 à 1/64 |
| Séparateurs de milliers | activés ou non |
| Panneaux | facteur, écriture composée, ordres de grandeur, tableau, historique |
| Comportement | raccourcis clavier, animations, taille de l'historique |

### Outils

- **Conversion par lot** : on colle une colonne de valeurs, on obtient la colonne convertie, exportable en CSV. Les lignes fautives sont signalées sans faire échouer le reste.
- **Table de référence** : une suite régulière (départ, pas, nombre de lignes), prête à imprimer ou à exporter.
- **Unités personnalisées** : définissez vos propres unités par un facteur. Elles restent dans votre navigateur et voyagent avec chaque requête ; le serveur n'en conserve aucune.
- **Historique et favoris** : les conversions récentes sont mémorisées, les paires d'unités peuvent être épinglées.
- **Partage par lien** : l'état complet d'une conversion tient dans une URL.
- **Copie multiformat** : la valeur seule, avec son unité, l'égalité complète, les données JSON, ou le lien.

### Raccourcis clavier

| Touche | Action |
| --- | --- |
| `Ctrl` `K` | Recherche rapide |
| `S` | Inverser les unités |
| `C` | Copier le résultat |
| `/` | Aller au champ de saisie |
| `↑` `↓` | Ajuster la valeur (`Maj` par 10, `Alt` par 0,1) |
| `,` | Ouvrir les réglages |
| `?` | Afficher les raccourcis |
| `Échap` | Fermer |

Les touches simples n'agissent que hors des champs de saisie.

---

## Architecture

```
lab02-convertisseur/
├── server/                      Backend Node.js / Express
│   ├── src/
│   │   ├── index.js             Démarrage et arrêt propre
│   │   ├── app.js               Application Express
│   │   ├── messages.js          Messages d'erreur bilingues
│   │   ├── middleware/          Gestion d'erreurs et 404
│   │   ├── routes/              Routes de l'API
│   │   └── units/
│   │       ├── constants.js     Constantes exactes (BIPM, NIST, accord de 1959)
│   │       ├── definitions.js   12 catégories fondamentales
│   │       ├── categories-extended.js  7 catégories additionnelles
│   │       ├── composites.js    Préréglages d'écriture composée
│   │       ├── convert.js       Moteur de conversion
│   │       ├── format.js        Notation, arrondi, fractions, composition
│   │       ├── expression.js    Évaluateur d'expressions
│   │       └── catalogue.js     Sérialisation localisée
│   └── test/                    127 tests (node:test)
│
└── client/                      Frontend React + Material UI
    ├── src/
    │   ├── main.jsx             Racine, thème, réglages
    │   ├── App.jsx              Orchestration
    │   ├── theme.js             Charte visuelle
    │   ├── settings.js          Modèle de réglages
    │   ├── api/                 Client HTTP
    │   ├── hooks/               Catalogue, conversion, stockage local
    │   ├── i18n/                Chaînes françaises et anglaises
    │   ├── utils/               Mise en forme locale des nombres
    │   └── components/          16 composants et categoryIcons.js
    └── test/                    19 tests (node:test)
```

### Modèle de données

Chaque catégorie déclare une unité de **base** et exprime toutes ses unités par rapport à elle.

```
kind: 'affine'       base = valeur × factor + offset
kind: 'reciprocal'   direct  : base = valeur × factor
                     inverse : base = constant ÷ valeur
```

Le modèle affine couvre le cas linéaire (`offset = 0`) **et** les échelles de température, qui ont un décalage réel. Le modèle réciproque couvre la consommation de carburant, où doubler les mpg divise par deux les L/100 km.

### Exactitude des facteurs

Les constantes de base sont exactes par définition internationale, et les facteurs dérivés sont **calculés** à partir d'elles plutôt que recopiés :

```js
export const INCH_M  = D('0.0254');          // exact, accord de 1959
export const FOOT_M  = INCH_M.times(12);     // 0,3048
export const YARD_M  = FOOT_M.times(3);      // 0,9144
export const MILE_M  = YARD_M.times(1760);   // 1609,344
```

Aucune décimale n'est saisie deux fois, donc aucune faute de frappe n'est possible sur un facteur dérivé.

L'application distingue les valeurs que d'autres convertisseurs confondent : le **torr** (exactement 1/760 atm) et le **mmHg** (exactement 133,322387415 Pa) ; les préfixes **décimaux** (ko) et **binaires** (Kio) ; le gallon **US** et le gallon **impérial** ; le cheval-vapeur **impérial** et **métrique**.

### Nombres et précision

L'API renvoie les résultats sous forme de **chaînes canoniques**, jamais de `Number`. Convertir en `Number` pour appeler `Intl.NumberFormat` perdrait des chiffres sur les grandes valeurs. La convention locale (virgule décimale, espaces de milliers) est appliquée côté client directement sur la chaîne.

---

## API

Toutes les routes acceptent `?lang=fr` ou `?lang=en` ; les messages d'erreur suivent la langue demandée.

| Méthode | Route | Rôle |
| --- | --- | --- |
| `GET` | `/api/health` | État du service |
| `GET` | `/api/categories` | Catalogue complet et capacités de mise en forme |
| `GET` | `/api/categories/:id` | Une catégorie |
| `POST` | `/api/convert` | Conversion |
| `GET` | `/api/convert` | Conversion partageable par URL |
| `POST` | `/api/convert/batch` | Conversion d'une liste de valeurs |
| `GET` | `/api/table` | Table de référence |
| `GET` | `/api/ratio` | Facteur seul |

### Exemple

```bash
curl -s "http://localhost:4000/api/convert?category=length&from=ft&to=m&value=100&precision=6"
```

```json
{
  "category": "length",
  "from": "ft",
  "to": "m",
  "precision": 6,
  "input": { "text": "100", "number": 100, "expression": null },
  "result": { "text": "30.48", "exponential": false, "raw": "30.48", "number": 30.48 },
  "composite": { "id": "ft_in", "parts": [{ "unit": "ft", "value": "100" }] },
  "ratio": { "text": "0.3048" },
  "warnings": []
}
```

### Erreurs

```json
{ "error": { "code": "INVALID_VALUE", "message": "« 1.2.3 » n'est pas un nombre valide." } }
```

Les erreurs métier portent un **code stable** ; la traduction est faite au bord HTTP, jamais dans le moteur. Une catégorie ou une unité inconnue renvoie `404`, une saisie invalide `400`, et aucune pile n'est exposée.

---

## Direction artistique

Le registre visuel est celui d'un **instrument de mesure** : trois familles typographiques avec un rôle strict.

- **Instrument Serif** pour les titres, la voix éditoriale.
- **Inter** pour l'interface, la lisibilité.
- **JetBrains Mono** en chiffres tabulaires pour tous les nombres, afin que les colonnes de valeurs s'alignent au pixel près.

Le fond est un papier chaud plutôt qu'un blanc pur, une trame de mesure très discrète le parcourt, et une règle graduée sépare l'en-tête du contenu.

L'accessibilité est traitée comme une contrainte, pas comme une option : anneau de focus unique et visible, `aria-live` sur le résultat, motif ARIA `tablist` complet sur la barre de catégories, information jamais portée par la seule couleur, `prefers-reduced-motion` respecté, et navigation entièrement possible au clavier.

---

## Choix techniques notables

**Pourquoi decimal.js plutôt que les nombres natifs.** En binaire, `(100 °C → °F)` produit `211.99999999999997`. Arrondir à l'affichage masquerait le problème sans le régler. L'arithmétique décimale le supprime à la source.

**Pourquoi un évaluateur d'expressions maison.** `eval` exécuterait du code arbitraire. Un analyseur en deux passes (jetons puis *shunting-yard*) ne peut produire qu'un nombre, et les garde-fous de taille bornent le coût.

**Pourquoi les unités personnalisées ne sont pas acceptées partout.** Une unité personnalisée n'est décrite que par un facteur. Cela suffit sur une échelle linéaire, mais pas sur une échelle avec décalage (température) ni sur un rapport inverse (consommation). Plutôt que de calculer faux en silence, l'API refuse.

**Pourquoi la barre de catégories est écrite à la main.** La variante défilante de `<Tabs>` ramenait l'onglet actif hors de vue au montage. La barre maison se replie sur plusieurs lignes dès qu'il y a la place, et ne défile que sur petit écran.

**Pourquoi le clavier de la recherche rapide écoute `window`.** Material UI ne transmet pas `onKeyDown` jusqu'à l'élément `<input>`, et `Dialog` remplace celle posée sur sa racine. Une écoute globale, active uniquement pendant l'ouverture, fonctionne quel que soit l'élément qui a le focus.

---

## Licence

Travail scolaire réalisé dans le cadre du cours *Exploration de nouvelles technologies*, Cégep de Sherbrooke.

## Déploiement en production (Projet 1, Azure)

L'application est hébergée sur une VM Linux Azure, derrière NGINX avec un certificat Let's Encrypt :
**<https://convertisseur.abdou.contact>**

| Élément | Fichier |
| --- | --- |
| Provisionnement de la VM (script SSH, et variante cloud-init) | `deploy/provision-vm.sh`, `deploy/cloud-init.yaml` |
| Service systemd (démarrage automatique) | `deploy/convertisseur.service` |
| Site NGINX (reverse proxy) | `deploy/nginx-convertisseur.conf` |
| Script de déploiement exécuté sur la VM | `deploy/remote-deploy.sh` |
| Pipeline GitHub Actions | `.github/workflows/ci-cd.yml` |

À chaque push sur `main`, GitHub Actions installe les dépendances, exécute les tests, construit l'interface, copie l'archive sur la VM par SSH, bascule vers la nouvelle version et vérifie que `https://convertisseur.abdou.contact/health` annonce bien le nouveau commit. En cas d'échec, la VM revient automatiquement à la version précédente.

Secrets GitHub utilisés : `VM_HOST`, `VM_USER`, `VM_SSH_KEY`, `VM_KNOWN_HOSTS`. Aucune clé privée n'est dans le dépôt.

### Observabilité

- `GET /health` (et `/api/health`) : statut, révision déployée, uptime, mémoire, horodatage.
- Journal applicatif : une ligne par requête (horodatage, niveau, méthode, chemin, statut, durée, IP réelle du client), lisible avec `journalctl -u convertisseur -f`.
- Vérification rapide de disponibilité : `curl -fsS https://convertisseur.abdou.contact/health` (code de sortie 0 = en ligne).
