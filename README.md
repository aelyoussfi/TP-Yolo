# TP YOLOv8 : Entraînement sur données custom

## 📋 Prérequis

- Python 3.10+
- Node.js 18+ (pour l'outil d'annotation)
- Un navigateur web récent

## 🚀 Installation

```bash
git clone <url-du-repo>
cd yolo_training
```

### Installer les dépendances Python

```bash
pip install ultralytics opencv-python matplotlib pillow
```

---

## 📝 Étape 1 : Préparer vos images

1. Rassemblez vos images (`.jpg`, `.jpeg`, `.png`, `.webp`) dans un dossier
2. Visez au minimum **50-100 images par classe** pour de bons résultats

---

## 🏷️ Étape 2 : Annoter vos images avec YOLO Data Tool

L'outil d'annotation se trouve dans le dossier `YOLO_data_tool/`.

### Lancer l'outil

```bash
cd YOLO_data_tool
npm install
npm run dev
```

Ouvrez l'URL affichée (par défaut http://localhost:5173) dans votre navigateur.

### Utiliser l'outil

1. **Charger vos images** : cliquez sur le bouton pour importer vos images
2. **Créer vos classes** : ajoutez les classes d'objets à détecter (ex : "chat", "chien")
3. **Annoter** : sélectionnez une classe, puis dessinez des rectangles (bounding boxes) autour des objets sur chaque image
4. **Naviguer** : passez d'une image à l'autre avec les flèches
5. **Exporter** : une fois toutes les images annotées, exportez le dataset au format YOLO (fichier ZIP)

### Résultat de l'export

L'export produit un ZIP contenant :
```
images/       ← vos images
labels/       ← fichiers .txt (annotations au format YOLO)
classes.txt   ← liste des classes
```

---

## 📂 Étape 3 : Préparer le dataset

1. Décompressez le ZIP exporté dans le dossier `yolo_dataset/` :
   ```
   yolo_training/
   ├── yolo_dataset/
   │   ├── images/      ← toutes vos images
   │   ├── labels/      ← tous vos labels (.txt)
   │   └── classes.txt  ← liste des classes
   ```

2. Vérifiez que chaque image a un fichier `.txt` correspondant dans `labels/`

---

## 🏋️ Étape 4 : Entraîner le modèle

1. Ouvrez le notebook **`ECM_TP_YOLO_custom.ipynb`**
2. Exécutez les cellules dans l'ordre :
   - **Installation** des dépendances
   - **Import** des librairies
   - **Découpage automatique** train/validation (80%/20%)
   - **Vérification** des annotations
   - **Création** du fichier `data.yaml`
   - **Chargement** du modèle YOLOv8
   - **Lancement** de l'entraînement
   - **Visualisation** des courbes d'apprentissage
   - **Évaluation** et **détection** sur de nouvelles images

### Paramètres d'entraînement à ajuster

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| `epochs`  | Nombre d'époques | 100 |
| `imgsz`   | Taille des images | 640 |
| `batch`   | Taille du batch | 2 (augmenter si GPU disponible) |

---

## 💡 Conseils

- **Plus de données = meilleurs résultats.** 10 images ne suffisent pas, visez 50+ par classe.
- Vérifiez vos annotations visuellement avant d'entraîner (cellule 9 du notebook).
- Si les détections sont faibles, augmentez le nombre d'époques ou essayez un modèle plus gros (`yolov8s.pt`, `yolov8m.pt`).
- Sur Google Colab, vous pouvez utiliser un GPU gratuit pour accélérer l'entraînement.

---

## 📁 Structure du projet

```
yolo_training/
├── ECM_TP_YOLO_custom.ipynb   ← Notebook d'entraînement
├── YOLO_data_tool/             ← Outil d'annotation web
├── yolo_dataset/               ← Vos données brutes (images + labels)
├── photos brutes/              ← Photos originales
├── .gitignore
└── README.md
```

Les fichiers suivants sont **générés automatiquement** par le notebook et ignorés par git :
- `yolo_split/` — dataset découpé train/val
- `runs/` — résultats d'entraînement
- `data.yaml` — config générée
- `*.pt` — poids des modèles
