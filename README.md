# A.v.s.s.r. Vamsi Lakshman | Houdini Generalist & TD Portfolio

A premium, high-performance portfolio workstation designed specifically for Houdini Technical Directors and VFX Generalists. Built with a 50/50 split-screen checkerboard layout, smooth scroll-snapping viewports, custom 2D canvas WebGL Matrix rain background, and fully responsive ergonomics across mobile, tablet, and widescreen setups.

## 🛠️ Technology Stack
- **Core Engine**: HTML5 / CSS3 / Vanilla JavaScript (ES Modules)
- **Bundler & Server**: [Vite](https://vite.dev/)
- **Visuals**: HTML5 Canvas, WebGL, custom particle simulation backgrounds
- **Styling**: Modern CSS variables, glassmorphism filters, HSL palettes, and responsive `clamp()` layout values

---

## 📂 Project Structure
```text
├── .github/workflows/
│   └── deploy.yml          # Automated GitHub Pages deployment pipeline
├── src/
│   ├── main.js             # Form submittals & HUD animations script
│   ├── style.css           # Premium workstation CSS layout
│   └── webgl.js            # Custom 2D canvas matrix rain loop
├── index.html              # Main application frame
├── vite.config.js          # Vite build adjustments for GitHub Pages
└── package.json            # Scripts and runtime dependencies
```

---

## 🚀 How to Deploy to GitHub Pages

This workspace is fully optimized for GitHub Pages out-of-the-box using GitHub Actions. Follow these simple steps to host your portfolio online:

### 1. Initialize Git and Push to GitHub
Open your terminal inside this folder and run:
```bash
git init
git add .
git commit -m "Initialize Houdini Workstation Portfolio"
git branch -M main
# Replace with your actual GitHub repository URL
git remote add origin https://github.com/your-username/your-repository-name.git
git push -u origin main
```

### 2. Enable GitHub Actions Deployment
1. Go to your repository on GitHub.
2. Click on **Settings** (gear icon) -> **Pages** in the left sidebar.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions** from the dropdown menu.
4. That's it! GitHub Actions will run the `.github/workflows/deploy.yml` pipeline automatically, build the project using Vite, and host it live.

---

## ⚙️ Local Development
To run the project locally and edit content:
```bash
# Install dependencies
npm install

# Run the dev server
npm run dev

# Compile the production bundle
npm run build
```
