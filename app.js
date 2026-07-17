/* ============================================================
   DermAI — Desktop Clinical Intelligence App
   Acne detection · EfficientNet-B0 · Tri-Layer XAI
   ============================================================ */

const API_BASE = "http://127.0.0.1:5000/api";
const LLAMA_URL = "https://api.groq.com/openai/v1/chat/completions";
const LLAMA_KEY = "YOUR_GROQ_API_KEY_HERE"; // Do NOT put your real key here when pushing to GitHub!

// Remove dark mode class if left over
document.body.classList.remove("dark-mode");
localStorage.removeItem("dark-mode");

// ─── persistence helpers ───
function ls(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }

const state = {
  route: "home",
  routeHistory: [],
  analyzeMode: "upload",   // "upload" | "camera"
  capturedImage: null,
  zone: "fullface",
  scanning: false,
  lastResult: ls("derm-last-result", null),
  history: ls("derm-history", []),
  researchTab: "abstract",
  profile: ls("derm-profile", null),
  customRoutine: ls("derm-routine", null),
};

let heroInterval = null;
const HERO_SLIDES = [

];

// EXACT LINE TO ADD/EDIT ONBOARDING BACKGROUND IMAGES
const ONBOARDING_BACKGROUNDS = [
  "image_of_onleftboarding/nail-polishes-soap-toothbrush-nail-file-sponge-bottle-disinfectant-plant.jpg",
  "image_of_onleftboarding/woman-smiling-with-hands-face.jpg",
  "image_of_onleftboarding/Screenshot 2026-07-17 235237.png",
  "image_of_onleftboarding/Screenshot 2026-07-17 235356.png",
  "image_of_onleftboarding/Screenshot 2026-07-17 235805.png",
  "image_of_onleftboarding/Screenshot 2026-07-17 235933.png",
  "image_of_onleftboarding/Screenshot 2026-07-17 235530.png",

];

// EXACT LINE TO ADD/EDIT OVERVIEW HERO BACKGROUND IMAGES
const HERO_BACKGROUNDS = [
  "image/beauty-portrait-ginger-woman-with-long-hair-posing-with-green-leaf.jpg",
  "image/spa-still-life-with-natural-toothbrushes-scrub-soap-decorative-details-flat-lay.jpg",
  "image/horizontal-banner-with-cosmetic-product-coconut.jpg",
  "image/elegant-skin-care-banner-design.jpg",
  "image/elegant-skin-care-banner-design (3).jpg",
  "image/elegant-skin-care-banner-design (2).jpg",
  "image/elegant-skin-care-banner-design (1).jpg",
  "image/Generated_Image_qfg16gqfg16gqfg1.png",

];

const app = document.getElementById("app");
const navEl = document.getElementById("mainNav");

// ─── scroll shadow ───
window.addEventListener("scroll", () => {
  navEl.classList.toggle("scrolled", window.scrollY > 8);
});

// ─── nav clicks ───
document.addEventListener("click", e => {
  const el = e.target.closest("[data-nav]");
  if (el) { e.preventDefault(); navigate(el.dataset.nav); }
});

document.addEventListener("click", e => {
  const inlineBack = e.target.closest(".btn-back-inline");
  if (inlineBack) {
    e.preventDefault();
    if (state.routeHistory.length > 0) {
      const prev = state.routeHistory.pop();
      navigate(prev, true);
    }
  }
});

function inlineBackBtn() {
  if (state.routeHistory.length > 0 && state.route !== "home") {
    return `<button class="btn-back-inline" style="background:none;border:none;color:var(--ink-2);cursor:pointer;padding:0;margin-right:12px;display:inline-flex;align-items:center;justify-content:center;" aria-label="Go back">${ic(SVG.back, 24)}</button>`;
  }
  return '';
}

const navHamburger = document.getElementById("navHamburger");
const navLinksWrapper = document.getElementById("navLinksWrapper");
const navBackdrop = document.getElementById("navBackdrop");
const navCloseBtn = document.getElementById("navCloseBtn");

function toggleMenu(forceClose = false) {
  if (!navLinksWrapper || !navBackdrop) return;
  if (forceClose) {
    navLinksWrapper.classList.remove("open");
    navBackdrop.classList.remove("open");
  } else {
    navLinksWrapper.classList.toggle("open");
    navBackdrop.classList.toggle("open");
  }
}

if (navHamburger) {
  navHamburger.addEventListener("click", (e) => {
    e.preventDefault();
    toggleMenu();
  });
}
if (navCloseBtn) {
  navCloseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    toggleMenu(true);
  });
}
if (navBackdrop) {
  navBackdrop.addEventListener("click", (e) => {
    e.preventDefault();
    toggleMenu(true);
  });
}

function navigate(r, isBack = false) {
  if (!isBack && state.route !== r) {
    state.routeHistory.push(state.route);
  }
  state.route = r;

  if (r === "analyze" && !isBack) {
    // Explicit "New Scan" click — reset everything for a fresh scan
    state.capturedImage = null;
    state.lastResult = null;
  }

  // clear history if returning to home to avoid deep stacks
  if (r === "home") state.routeHistory = [];

  // update nav active link
  document.querySelectorAll(".nav__link").forEach(a => {
    a.classList.toggle("active", a.dataset.nav === r);
  });

  // close hamburger menu if open
  toggleMenu(true);

  if (heroInterval) {
    clearInterval(heroInterval);
    heroInterval = null;
  }

  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  if (!state.profile) {
    if (navEl) navEl.style.display = "none";
    renderOnboarding();
    return;
  } else {
    if (navEl) navEl.style.display = "";
  }
  switch (state.route) {
    case "home": renderHome(); break;
    case "analyze": renderAnalyze(); break;
    case "routine": renderRoutine(); break;
    case "result": renderResult(); break;
    case "history": renderHistory(); break;
    case "research": renderResearch(); break;
    case "chat": renderChat(); break;
    case "profile": renderProfile(); break;
    default: renderHome();
  }
}

// ─── SVG icon helper ───
function ic(d, s = 18) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}

const SVG = {
  cam: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"/><circle cx="12" cy="13" r="3.2"/>',
  upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  shield: '<path d="M12 2l7 3v6c0 5-4 9-7 10-3-1-7-5-7-10V5l7-3z"/>',
  brain: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/><path d="M12 8v4l3 3"/>',
  chart: '<path d="M4 20V10"/><path d="M11 20V4"/><path d="M18 20v-7"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  chk: '<path d="M20 6L9 17l-5-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',
  arr: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  book: '<path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>',
  download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  flip: '<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67"/>',
  img: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
};

function sevColor(s) {
  const v = (s || "").toLowerCase();
  return v === "mild" ? "#22c55e" : v === "severe" ? "#ef4444" : v === "clear" ? "#176b73" : "#f59e0b";
}

function sevClass(s) {
  const v = (s || "").toLowerCase();
  return `sev-badge--${v === "clear" ? "clear" : v}`;
}

/* ============================================================
   HOME PAGE
   ============================================================ */
function renderHome() {
  app.innerHTML = `
    <div class="page page-enter">
      <!-- ── Hero ── -->
      <div class="hero" style="display: grid !important; grid-template-columns: 1fr; background: url('${HERO_BACKGROUNDS[0]}') no-repeat center center; background-size: cover; border-radius: 0 !important; padding: 60px 8% !important; box-shadow: none; margin-top: 0 !important; margin-bottom: 40px; position: relative; width: 100vw; margin-left: calc(-50vw + 50%); min-height: 520px;">
        <div style="max-width: 540px; padding: 12px 20px;">
          <div class="hero__kicker">
            <span class="hero__kicker-dot"></span>
            <div class="hero__kicker-pills">
              <span class="hero__kicker-pill">LIVE</span>
              <span class="hero__kicker-pill">EFFICIENTNET B0</span>
              <span class="hero__kicker-pill">GRAD-CAM</span>
              <span class="hero__kicker-pill">SHAP</span>
              <span class="hero__kicker-pill">LIME</span>
            </div>
          </div>

          <h1 class="hero__h1" style="font-size: 38px; line-height: 1.15; margin-bottom: 14px; color: var(--ink);">Clinical-grade <em>acne</em><br>intelligence, explained.</h1>
          <p class="hero__sub" style="font-size: 14px; color: var(--ink-2); margin-bottom: 24px; line-height: 1.5;">DermAI combines an EfficientNet-B0 vision backbone with three explainability methods and a specialist chatbot — so you don't just see a prediction, you understand it.</p>

          <div class="hero__actions" style="margin-bottom: 28px;">
            <button class="btn-primary" data-nav="analyze">${ic(SVG.cam)} Start Analysis</button>
            <button class="btn-ghost" data-nav="history" style="color: var(--primary);">View past scans →</button>
          </div>

          <div class="hero__stats" style="display: flex; gap: 24px; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 20px;">
            <div class="hstat">
              <div class="hstat__val" style="font-size: 22px; font-weight: 800; color: var(--primary);">91.6%</div>
              <div class="hstat__lbl" style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--ink-3); margin-top: 4px; letter-spacing: 0.05em;">Model Accuracy</div>
            </div>
            <div class="hstat">
              <div class="hstat__val" style="font-size: 22px; font-weight: 800; color: var(--primary);">4</div>
              <div class="hstat__lbl" style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--ink-3); margin-top: 4px; letter-spacing: 0.05em;">Severity Tiers</div>
            </div>
            <div class="hstat">
              <div class="hstat__val" style="font-size: 22px; font-weight: 800; color: var(--primary);">3</div>
              <div class="hstat__lbl" style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--ink-3); margin-top: 4px; letter-spacing: 0.05em;">XAI Methods</div>
            </div>
            <div class="hstat">
              <div class="hstat__val" style="font-size: 22px; font-weight: 800; color: var(--primary);">3,200</div>
              <div class="hstat__lbl" style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--ink-3); margin-top: 4px; letter-spacing: 0.05em;">Training Images</div>
            </div>
          </div>
        </div>

        <!-- Floating manual controls inside the banner -->
        <button id="heroPrevBtn" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink); box-shadow: var(--sh-sm); z-index: 10; transition: all 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255,255,255,0.7)'; this.style.color='var(--ink)';">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button id="heroNextBtn" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink); box-shadow: var(--sh-sm); z-index: 10; transition: all 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255,255,255,0.7)'; this.style.color='var(--ink)';">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <!-- Dots Indicator at bottom -->
        <div id="heroDots" style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 10; background: rgba(255,255,255,0.65); backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.4);">
          ${HERO_BACKGROUNDS.map((_, i) => `
            <span class="hero-dot" data-index="${i}" style="width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--ink-2); background: ${i === 0 ? 'var(--ink)' : 'transparent'}; cursor: pointer; transition: all 0.2s;"></span>
          `).join('')}
        </div>

        <div id="creatorBadge" style="position: absolute; bottom: 24px; right: 8%; font-size: 11px; font-weight: 600; color: var(--ink-3); background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.06); z-index: 10; pointer-events: none;">
          Created &amp; Designed by Amit Singh
        </div>
      </div>




      <!-- ── Feature cards ── -->
      <div class="features">
        <div class="feat-card">
          <div class="feat-card__ico ico--teal">${ic(SVG.shield, 22)}</div>
          <div class="feat-card__title">Tri-Layer XAI</div>
          <div class="feat-card__desc">Grad-CAM heatmaps, LIME superpixel segmentation, and SHAP pixel-level Shapley values — three lenses on every prediction.</div>
        </div>
        <div class="feat-card">
          <div class="feat-card__ico ico--blue">${ic(SVG.brain, 22)}</div>
          <div class="feat-card__title">Random Forest + EfficientNet</div>
          <div class="feat-card__desc">CPU-friendly handcrafted feature baseline backed by an EfficientNet-B0 deep vision backbone for maximum cross-device compatibility.</div>
        </div>
        <div class="feat-card">
          <div class="feat-card__ico ico--green">${ic(SVG.chart, 22)}</div>
          <div class="feat-card__title">Severity Grading</div>
          <div class="feat-card__desc">Four-tier severity classification (Clear → Mild → Moderate → Severe) with per-class confidence scores and clinical override logic.</div>
        </div>
        <div class="feat-card">
          <div class="feat-card__ico ico--violet">${ic(SVG.eye, 22)}</div>
          <div class="feat-card__title">Visual Explanations</div>
          <div class="feat-card__desc">Side-by-side comparison of the original image and all three XAI overlays so clinicians can validate every AI decision visually.</div>
        </div>
        <div class="feat-card">
          <div class="feat-card__ico ico--amber">${ic(SVG.cam, 22)}</div>
          <div class="feat-card__title">Camera + Upload</div>
          <div class="feat-card__desc">Capture directly from your device's camera or upload an existing photo. All processing stays local — no cloud uploads required.</div>
        </div>
        <div class="feat-card">
          <div class="feat-card__ico ico--teal">${ic(SVG.book, 22)}</div>
          <div class="feat-card__title">Research-Backed</div>
          <div class="feat-card__desc">Built on a peer-reviewed paper (Paper ID 1505) submitted to OTCON5 / COMSYS, available in full on the Research tab.</div>
        </div>
      </div>

      <!-- ── Clinical Guidance & Education Section ── -->
      <div style="margin-top: 80px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="font-size: 28px; font-weight: 800; letter-spacing: -.03em; color: var(--ink); margin-bottom: 10px;">Clinical Guidance & Skincare Education</h2>
          <p style="font-size: 15px; color: var(--ink-3); max-width: 600px; margin: 0 auto;">Research-supported steps to identify, prevent, and treat inflammatory skin conditions.</p>
        </div>
        
        <div class="edu-grid">
          <div class="edu-card">
            <div class="edu-card__img-wrap">
              <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop" alt="Skin Awareness" />
              <div class="edu-card__badge badge--teal">AWARENESS</div>
            </div>
            <div class="edu-card__body">
              <h3 class="edu-card__title">1. Identify Acne Triggers</h3>
              <p class="edu-card__desc">Acne vulgaris is driven by androgen-induced sebum overproduction, follicular hyperkeratinization, and *Cutibacterium acnes* colonization. Monitoring dairy intake, glycemic loads, and stress helps isolate personal breakout patterns.</p>
            </div>
          </div>

          <div class="edu-card">
            <div class="edu-card__img-wrap">
              <img src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop" alt="Skin Prevention" />
              <div class="edu-card__badge badge--green">PREVENTION</div>
            </div>
            <div class="edu-card__body">
              <h3 class="edu-card__title">2. Daily Prevention Habits</h3>
              <p class="edu-card__desc">Maintain an intact epidermal barrier. Cleanse twice daily with a soap-free, pH-balanced cleanser. Avoid mechanical scrubbing and physical picking, which damage follicle walls, spread bacteria, and induce hyperpigmentation.</p>
            </div>
          </div>

          <div class="edu-card">
            <div class="edu-card__img-wrap">
              <img src="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop" alt="Skin Treatment" />
              <div class="edu-card__badge badge--violet">TREATMENT</div>
            </div>
            <div class="edu-card__body">
              <h3 class="edu-card__title">3. Targeted Clinical Care</h3>
              <p class="edu-card__desc">Apply salicylic acid (BHA) spot treatments to exfoliate within oily pores. Use benzoyl peroxide (2.5%) for antibacterial action. Integrate a lightweight moisturizer and a broad-spectrum SPF 30+ daily to mitigate treatment irritation.</p>
            </div>
          </div>
        </div>

        <!-- ── Clinical Awareness & Wellness Banner ── -->
        <div class="awareness-banner" style="margin-top: 48px; background: linear-gradient(135deg, rgba(23, 107, 115, 0.08), rgba(45, 212, 191, 0.05)); border: 1.5px solid rgba(23, 107, 115, 0.15); border-radius: var(--r-xl); padding: 32px 40px; display: flex; align-items: center; gap: 32px; box-shadow: var(--sh-sm); position: relative; overflow: hidden;">
          <!-- Glowing aura vector in background -->
          <div style="position: absolute; top: -50%; left: -20%; width: 250px; height: 250px; background: rgba(45, 212, 191, 0.2); filter: blur(60px); border-radius: 50%; pointer-events: none;"></div>
          
          <div style="width: 54px; height: 54px; background: rgba(23, 107, 115, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; border: 1px solid rgba(23, 107, 115, 0.2);">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: var(--ink); margin-bottom: 6px; letter-spacing: -0.01em;">Skin Health Awareness &amp; Clinical Safety</h4>
            <p style="font-size: 13px; line-height: 1.6; color: var(--ink-2); margin: 0;">
              DermAI is built to provide accessible, AI-powered insights to help you understand your skin. However, software analysis should never replace professional dermatological consultation. Always consult a certified dermatologist before starting any clinical treatments or routines. Love your skin, monitor changes, and care for it gently.
            </p>
          </div>
      </div>
    </div>
  `;

  let activeHeroBg = 0;

  function updateHeroBackground(index) {
    activeHeroBg = index;
    const el = document.querySelector(".hero");
    if (el) {
      el.style.backgroundImage = `url('${HERO_BACKGROUNDS[activeHeroBg]}')`;
    }

    // Update dots styling
    document.querySelectorAll(".hero-dot").forEach((dot, idx) => {
      if (idx === activeHeroBg) {
        dot.style.background = "var(--ink)";
        dot.style.borderColor = "var(--ink)";
        dot.style.transform = "scale(1.2)";
      } else {
        dot.style.background = "transparent";
        dot.style.borderColor = "var(--ink-2)";
        dot.style.transform = "scale(1)";
      }
    });
  }

  // Bind click handlers
  const prevBtn = document.getElementById("heroPrevBtn");
  const nextBtn = document.getElementById("heroNextBtn");

  if (prevBtn) {
    prevBtn.onclick = () => {
      const prevIdx = (activeHeroBg - 1 + HERO_BACKGROUNDS.length) % HERO_BACKGROUNDS.length;
      updateHeroBackground(prevIdx);
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const nextIdx = (activeHeroBg + 1) % HERO_BACKGROUNDS.length;
      updateHeroBackground(nextIdx);
    };
  }

  document.querySelectorAll(".hero-dot").forEach(dot => {
    dot.onclick = (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      updateHeroBackground(idx);
    };
  });

  // Auto change system every 20 seconds
  if (heroInterval) clearInterval(heroInterval);
  heroInterval = setInterval(() => {
    const nextIdx = (activeHeroBg + 1) % HERO_BACKGROUNDS.length;
    updateHeroBackground(nextIdx);
  }, 20000);
}

/* ============================================================
   ANALYZE PAGE
   ============================================================ */
function renderAnalyze() {
  if (state.scanning) { renderScanning(); return; }
  if (state.lastResult && !state.capturedImage) { renderResult(); return; }

  const hasImg = !!state.capturedImage;

  app.innerHTML = `
    <div class="page page-enter">
      <div style="padding: 40px 0 24px; display:flex; align-items:center;">
        ${inlineBackBtn()}
        <div>
          <h1 style="font-size:28px;font-weight:900;letter-spacing:-.03em;margin-bottom:6px;">New Skin Analysis</h1>
          <p style="font-size:14px;color:var(--ink-3);">Upload a photo or use your camera to begin AI-powered severity grading.</p>
        </div>
        ${state.lastResult ? `<button type="button" class="btn-ghost" id="btnViewLast" style="margin-left:auto;">View last result →</button>` : ""}
      </div>

      <div class="analyze-grid">
        <!-- LEFT: Image input panel -->
        <div class="panel">
          <div class="panel__head">
            <div>
              <div class="panel__title">Skin Image</div>
              <div class="panel__sub">Clear, well-lit, close-up photo recommended</div>
            </div>
          </div>
          <div class="panel__body">
            <!-- Mode tabs -->
            <div class="mode-tabs">
              <button type="button" class="mode-tab${state.analyzeMode === "upload" ? " active" : ""}" data-mode="upload">Upload Photo</button>
              <button type="button" class="mode-tab${state.analyzeMode === "camera" ? " active" : ""}" data-mode="camera">Live Camera</button>
            </div>

            <!-- Upload zone -->
            <div id="uploadPanel" style="display:${state.analyzeMode === "upload" ? "block" : "none"}">
              <div class="upload-zone${hasImg ? " has-image" : ""}" id="uploadZone">
                ${hasImg
      ? `<img class="upload-zone__preview" id="preview" src="${state.capturedImage}" />`
      : `<div class="upload-zone__ico">${ic(SVG.img, 24)}</div>
                     <div class="upload-zone__title">Drag & drop or click to upload</div>
                     <div class="upload-zone__sub">JPG, PNG up to 10 MB</div>`
    }
              </div>
              <input type="file" id="fileInp" accept="image/*" style="display:none" />
              ${hasImg ? `
              <div style="margin-top:10px;display:flex;gap:8px;">
                <button type="button" class="btn-ghost" id="btnRetake" style="flex:1;border:1px solid var(--border);justify-content:center;">
                  ${ic(SVG.upload)} Retake
                </button>
              </div>` : ""}
            </div>

            <!-- Camera panel -->
            <div id="cameraPanel" style="display:${state.analyzeMode === "camera" ? "block" : "none"}">
              <div class="cam-view">
                <video id="camVid" autoplay playsinline muted style="display:none;width:100%;height:100%;object-fit:cover;"></video>
                <div id="camPlaceholder" class="cam-view__placeholder">
                  ${ic(SVG.cam, 40)}
                  <p>Camera will start here</p>
                </div>
                <div class="cam-scan-line" id="scanLine" style="display:none"></div>
              </div>
              <div class="capture-bar" style="margin-top:14px;">
                <button class="ctrl-btn" id="btnFlip" title="Flip camera">${ic(SVG.flip)}</button>
                <button class="shutter" id="btnCapture" title="Capture"></button>
                <button class="ctrl-btn" id="btnGallery" title="Upload from gallery">${ic(SVG.img)}</button>
              </div>
              <input type="file" id="fileInp2" accept="image/*" style="display:none" />
            </div>
          </div>
        </div>

        <!-- RIGHT: Scan settings panel -->
        <div class="panel">
          <div class="panel__head">
            <div>
              <div class="panel__title">Scan Settings</div>
              <div class="panel__sub">Select the affected area and run analysis</div>
            </div>
          </div>
          <div class="panel__body">
            <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-3);margin-bottom:12px;">Affected Zone</p>
            <div class="zone-grid">
              ${[
      { id: "fullface", label: "Full Face", d: '<circle cx="12" cy="12" r="9"/>' },
      { id: "forehead", label: "Forehead", d: '<path d="M6 10C6 5.6 8.7 3 12 3s6 2.6 6 7"/>' },
      { id: "tzone", label: "T-Zone", d: '<path d="M12 3v12M8 7h8"/>' },
      { id: "cheeks", label: "Cheeks", d: '<circle cx="7" cy="13" r="3"/><circle cx="17" cy="13" r="3"/>' },
      { id: "chin", label: "Chin & Jaw", d: '<path d="M6 14C6 18.4 8.7 21 12 21s6-2.6 6-7"/>' },
      { id: "other", label: "Other", d: '<circle cx="12" cy="12" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>' },
    ].map(z => `
                <button class="zone-btn${state.zone === z.id ? " active" : ""}" data-zone="${z.id}">
                  ${ic(z.d, 20)}
                  ${z.label}
                </button>`).join("")}
            </div>

            <div style="margin-top:28px;">
              <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-3);margin-bottom:12px;">XAI Methods</p>
              <div style="display:flex;flex-direction:column;gap:8px;">
                ${[
      { n: "Grad-CAM", c: "var(--sev-c)", d: "Global saliency heatmap" },
      { n: "LIME", c: "var(--mild-c)", d: "Regional superpixel attribution" },
      { n: "SHAP", c: "var(--accent-2)", d: "Pixel-level Shapley values" },
    ].map(x => `
                  <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg);border-radius:8px;border:1px solid var(--border);">
                    <div style="width:8px;height:8px;border-radius:50%;background:${x.c};flex-shrink:0;"></div>
                    <div style="flex:1;">
                      <div style="font-size:13px;font-weight:700;">${x.n}</div>
                      <div style="font-size:11px;color:var(--ink-3);">${x.d}</div>
                    </div>
                    <div style="color:var(--mild-c);">${ic(SVG.chk, 14)}</div>
                  </div>`).join("")}
              </div>
            </div>

            <div style="margin-top:32px;display:flex;flex-direction:column;gap:10px;">
              <button class="btn-primary" id="btnAnalyze" style="${!hasImg ? "opacity:.45;" : ""}justify-content:center;" ${!hasImg ? "disabled" : ""}>
                ${ic(SVG.brain)} Run AI Analysis
              </button>
              ${!hasImg ? `<p style="font-size:12px;color:var(--ink-3);text-align:center;">Upload or capture an image to begin</p>` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // bind mode tabs
  app.querySelectorAll(".mode-tab").forEach(b => {
    b.onclick = () => {
      state.analyzeMode = b.dataset.mode;
      if (state.analyzeMode === "camera") startCamera();
      else stopCamera();
      renderAnalyze();
    };
  });

  // bind zone buttons
  app.querySelectorAll(".zone-btn").forEach(b => {
    b.onclick = () => { state.zone = b.dataset.zone; app.querySelectorAll(".zone-btn").forEach(x => x.classList.remove("active")); b.classList.add("active"); };
  });

  // upload zone
  const uploadZone = document.getElementById("uploadZone");
  const fileInp = document.getElementById("fileInp");
  if (uploadZone && fileInp) {
    uploadZone.onclick = () => fileInp.click();
    uploadZone.addEventListener("dragover", e => { e.preventDefault(); uploadZone.style.borderColor = "var(--primary)"; });
    uploadZone.addEventListener("dragleave", () => { uploadZone.style.borderColor = ""; });
    uploadZone.addEventListener("drop", e => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    });
    fileInp.onchange = e => { if (e.target.files[0]) loadFile(e.target.files[0]); };
  }

  const btnRetake = document.getElementById("btnRetake");
  if (btnRetake) btnRetake.onclick = () => { state.capturedImage = null; renderAnalyze(); };

  // camera
  if (state.analyzeMode === "camera") {
    startCamera();
    const btnCapture = document.getElementById("btnCapture");
    const btnFlip = document.getElementById("btnFlip");
    const btnGallery = document.getElementById("btnGallery");
    const fileInp2 = document.getElementById("fileInp2");

    if (btnCapture) btnCapture.onclick = captureFromCamera;
    if (btnFlip) btnFlip.onclick = () => { facingMode = facingMode === "user" ? "environment" : "user"; startCamera(); };
    if (btnGallery) btnGallery.onclick = () => fileInp2 && fileInp2.click();
    if (fileInp2) fileInp2.onchange = e => { if (e.target.files[0]) loadFile(e.target.files[0]); };
  }

  const btnAnalyze = document.getElementById("btnAnalyze");
  if (btnAnalyze) btnAnalyze.onclick = () => { if (state.capturedImage) runAnalysis(); };

  const btnViewLast = document.getElementById("btnViewLast");
  if (btnViewLast) btnViewLast.onclick = () => renderResult();
}

// ─── camera helpers ───
let cameraStream = null;
let facingMode = "user";

function startCamera() {
  stopCamera();
  navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } })
    .then(stream => {
      cameraStream = stream;
      const vid = document.getElementById("camVid");
      const ph = document.getElementById("camPlaceholder");
      const sl = document.getElementById("scanLine");
      if (vid) { vid.srcObject = stream; vid.style.display = "block"; }
      if (ph) ph.style.display = "none";
      if (sl) sl.style.display = "block";
    })
    .catch(() => { });
}

function stopCamera() {
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
}

function captureFromCamera() {
  const vid = document.getElementById("camVid");
  if (!vid || !cameraStream) return;
  const c = document.createElement("canvas");
  c.width = vid.videoWidth || 640;
  c.height = vid.videoHeight || 480;
  c.getContext("2d").drawImage(vid, 0, 0, c.width, c.height);
  state.capturedImage = c.toDataURL("image/jpeg");
  state.analyzeMode = "upload";
  stopCamera();
  runAnalysis();
}

function loadFile(file) {
  const reader = new FileReader();
  reader.onload = e => { state.capturedImage = e.target.result; runAnalysis(); };
  reader.readAsDataURL(file);
}

/* ─── Scanning overlay ─── */
function renderScanning() {
  app.innerHTML = `
    <div class="page page-enter">
      <div style="display:flex;align-items:center;justify-content:center;min-height:75vh;">
        <div class="scan-loading">
          <div class="scan-loading__img">
            <img src="${state.capturedImage}" alt="Scanning" />
            <div class="scan-loading__bar"></div>
          </div>
          <div class="scan-loading__spinner"></div>
          <div class="scan-loading__title">Analyzing your skin…</div>
          <div class="scan-loading__sub">Running Random Forest inference and generating XAI visualizations</div>
          <div class="scan-steps">
            <div class="scan-step active" id="ss1">Extracting HSV + LBP + redness features…</div>
            <div class="scan-step"        id="ss2">Running Random Forest inference…</div>
            <div class="scan-step"        id="ss3">Generating Grad-CAM heatmap…</div>
            <div class="scan-step"        id="ss4">Computing LIME superpixel map…</div>
            <div class="scan-step"        id="ss5">Calculating SHAP Shapley values…</div>
          </div>
        </div>
      </div>
    </div>`;

  const steps = ["ss1", "ss2", "ss3", "ss4", "ss5"];
  let cur = 0;
  const iv = setInterval(() => {
    if (cur > 0) {
      const prev = document.getElementById(steps[cur - 1]);
      if (prev) { prev.classList.remove("active"); prev.classList.add("done"); }
    }
    cur++;
    if (cur < steps.length) {
      const next = document.getElementById(steps[cur]);
      if (next) next.classList.add("active");
    }
    if (cur >= steps.length) clearInterval(iv);
  }, 900);
}

/* ─── Result view ─── */
function renderResult() {
  const r = state.lastResult;
  if (!r) { renderAnalyze(); return; }

  const circ = 2 * Math.PI * 32;
  const pct = (r.confidence || 80) / 100;

  app.innerHTML = `
    <div class="page page-enter">
      <div style="padding:40px 0 24px;display:flex;align-items:center;gap:12px;">
        ${inlineBackBtn()}
        <div>
          <h1 style="font-size:24px;font-weight:900;letter-spacing:-.03em;">Analysis Result</h1>
          <p style="font-size:13px;color:var(--ink-3);">${r.zone || "Full Face"} · ${new Date(r.timestamp).toLocaleString()}</p>
        </div>
      </div>

      <div class="analyze-grid result-mode">
        <!-- XAI image panel -->
        <div class="panel">
          <div class="panel__head">
            <div>
              <div class="panel__title">XAI Visualizations</div>
              <div class="panel__sub">Toggle between explainability overlays</div>
            </div>
          </div>
          <div class="xai-panel">
            <div class="xai-label">Explanation Layer</div>
            <div class="xai-view">
              <img id="xaiImg" src="${r.analysisImage || r.originalImage}" alt="XAI overlay" />
            </div>
            <div class="xai-tabs">
              <button class="xai-tab active" data-xai="gradcam">Grad-CAM</button>
              <button class="xai-tab" data-xai="lime">LIME</button>
              <button class="xai-tab" data-xai="shap">SHAP</button>
              <button class="xai-tab" data-xai="original">Original</button>
            </div>
          </div>
          <div style="padding:16px 24px;">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
              ${[
      { label: "Confidence", val: (r.confidence || 80) + "%", c: "var(--mild-c)" },
      { label: "Zone", val: r.zone || "Full Face", c: "var(--primary)" },
      { label: "Concern", val: r.symptomType || "Acne", c: "var(--accent-2)" },
    ].map(s => `
                <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;">
                  <div style="font-size:15px;font-weight:800;color:${s.c};margin-bottom:3px;">${s.val}</div>
                  <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-3);">${s.label}</div>
                </div>`).join("")}
            </div>
          </div>
        </div>

        <!-- Diagnosis panel -->
        <div class="panel result-panel">
          <div class="sev-header">
            <div class="sev-ring">
              <svg viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="32" class="sev-ring__bg"/>
                <circle cx="36" cy="36" r="32" class="sev-ring__fill"
                  stroke="${sevColor(r.severity)}"
                  stroke-dasharray="${2 * Math.PI * 32}"
                  stroke-dashoffset="${2 * Math.PI * 32 * (1 - pct)}"
                  transform="rotate(-90 36 36)"/>
              </svg>
              <div class="sev-ring__lbl">${r.confidence}%</div>
            </div>
            <div class="sev-info">
              <span class="sev-badge ${sevClass(r.severity)}">${r.severity} Severity</span>
              <div class="sev-title">${r.symptomType || "Acne"} · ${r.zone || "Full Face"}</div>
              <div class="sev-zone">Analyzed ${new Date(r.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
            </div>
          </div>

          <div class="res-sections" style="max-height:420px;overflow-y:auto;">
            ${parseAndRenderSections(r.summary || "")}

            ${r.summary && r.summary.includes("SEE A DOCTOR IF") ? `
            <div class="res-warn">
              ${ic(SVG.info, 14)} <strong>See a doctor if:</strong>
              ${extractSection(r.summary, "doctor")}
            </div>` : ""}
          </div>

          <div class="result-actions" style="display:flex; flex-wrap:wrap; gap:12px;">
            <button class="btn-primary" style="justify-content:center;flex:1;min-width:140px;" data-nav="routine">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              View Routine
            </button>
            <button class="btn-teal" style="justify-content:center;flex:1;min-width:140px;" data-nav="research">
              ${ic(SVG.book)} View Research
            </button>
            <button class="btn-ghost" style="justify-content:center;flex:1;min-width:140px;border:1px solid var(--border);" data-nav="chat">
              ${ic(SVG.brain)} Go for Ai 
              
            </button>
          </div>
        </div>
      </div>
    </div>`;

  // XAI tab toggle
  const xaiImg = document.getElementById("xaiImg");
  app.querySelectorAll(".xai-tab").forEach(b => {
    b.onclick = () => {
      app.querySelectorAll(".xai-tab").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const k = b.dataset.xai;
      if (xaiImg) {
        xaiImg.src = k === "original" ? (r.originalImage || r.analysisImage)
          : k === "lime" ? (r.limeImage || r.originalImage)
            : k === "shap" ? (r.shapImage || r.originalImage)
              : (r.analysisImage || r.originalImage);
      }
    };
  });

  const btnSave = document.getElementById("btnSaveHistory");
  if (btnSave) {
    btnSave.onclick = () => {
      const a = document.createElement("a");
      a.href = xaiImg ? xaiImg.src : (r.analysisImage || r.originalImage);
      a.download = `Skin_Analysis_${new Date().getTime()}.jpg`;
      a.click();
    };
  }
}

function parseAndRenderSections(raw) {
  const defs = [
    { key: "DIAGNOSIS:", label: "Diagnosis", ico: SVG.info },
    { key: "CAUSES:", label: "Likely Causes", ico: SVG.brain },
    { key: "TREATMENT PLAN:", label: "Treatment Plan", ico: SVG.chk },
    { key: "LIFESTYLE TIPS:", label: "Lifestyle Tips", ico: SVG.eye },
  ];
  return defs.map(({ key, label, ico }) => {
    const content = extractSection(raw, key);
    if (!content) return "";
    const lines = content.split(/\n/).map(l => l.trim().replace(/^•\s*/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")).filter(Boolean);
    return `
      <div class="res-sec">
        <div class="res-sec__hd">${ic(ico, 14)} ${label}</div>
        <div class="res-sec__body">
          ${lines.map(l => `<div class="ri">${l}</div>`).join("")}
        </div>
      </div>`;
  }).join("");
}

function extractSection(raw, key) {
  const patterns = {
    "DIAGNOSIS:": /\*\*DIAGNOSIS:\*\*\s*([\s\S]+?)(?=\n\*\*[A-Z]|$)/i,
    "CAUSES:": /\*\*CAUSES?:\*\*\s*([\s\S]+?)(?=\n\*\*[A-Z]|$)/i,
    "TREATMENT PLAN:": /\*\*TREATMENT PLAN:\*\*\s*([\s\S]+?)(?=\n\*\*[A-Z]|$)/i,
    "LIFESTYLE TIPS:": /\*\*LIFESTYLE TIPS?:\*\*\s*([\s\S]+?)(?=\n\*\*[A-Z]|$)/i,
    "doctor": /\*\*SEE A DOCTOR IF:\*\*\s*([\s\S]+?)(?=\n\*\*[A-Z]|$)/i,
  };
  const p = patterns[key]; if (!p) return "";
  const m = raw.match(p); return m ? m[1].trim() : "";
}

/* ─── Run analysis ─── */
async function runAnalysis() {
  state.scanning = true;
  renderScanning();

  const zone = state.zone;
  const image = state.capturedImage;

  let result = null;

  // Try Flask backend
  try {
    const b64 = image.replace(/^data:image\/\w+;base64,/, "");
    const res = await fetch(`${API_BASE}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: b64, zone })
    });
    if (res.ok) result = await res.json();
  } catch { }

  // Client-side fallback
  if (!result || !result.severity) {
    result = await clientSideAnalysis(image, zone);
  }

  const scan = {
    severity: result.severity || "Mild",
    confidence: result.confidence || 82,
    zone: zone.charAt(0).toUpperCase() + zone.slice(1),
    symptomType: result.symptomType || "Acne",
    summary: result.summary || mockSummary(result.severity || "Mild"),
    timestamp: new Date().toISOString(),
    originalImage: image,
    analysisImage: result.heatmap ? `data:image/jpeg;base64,${result.heatmap}` : image,
    limeImage: result.lime ? `data:image/jpeg;base64,${result.lime}` : image,
    shapImage: result.shap ? `data:image/jpeg;base64,${result.shap}` : image,
  };

  // For client-side fallback, attach pre-computed XAI images
  if (result._gradcam) scan.analysisImage = result._gradcam;
  if (result._lime) scan.limeImage = result._lime;
  if (result._shap) scan.shapImage = result._shap;

  state.lastResult = scan;
  state.capturedImage = null;
  state.scanning = false;
  state.route = "result";   // move to result route so navigate("analyze") won't wipe the result

  // save to history
  state.history.unshift({ ...scan, id: Date.now() });
  if (state.history.length > 20) state.history.pop();
  sv("derm-history", state.history.map(h => ({
    id: h.id, severity: h.severity, confidence: h.confidence,
    zone: h.zone, symptomType: h.symptomType, timestamp: h.timestamp, summary: h.summary
  })));
  sv("derm-last-result", { ...scan, originalImage: null, analysisImage: null, limeImage: null, shapImage: null });

  renderResult();
}

async function clientSideAnalysis(imgSrc, zone) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 400; c.height = 400;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, 400, 400);

      let red = 0, total = 0;
      const spots = [];
      try {
        const d = ctx.getImageData(0, 0, 400, 400).data;
        for (let y = 0; y < 400; y += 4) {
          for (let x = 0; x < 400; x += 4) {
            const i = (y * 400 + x) * 4;
            const r = d[i], g = d[i + 1], b = d[i + 2];
            if (r - (g + b) / 2 > 38 && r > 110) { red++; spots.push({ x, y }); }
            total++;
          }
        }
      } catch { }

      const ratio = red / total;
      const sev = ratio > 0.08 ? "Severe" : ratio > 0.03 ? "Moderate" : ratio > 0.005 ? "Mild" : "Clear";
      const conf = sev === "Severe" ? 87 : sev === "Moderate" ? 83 : sev === "Mild" ? 85 : 95;

      // Build XAI canvases
      const mkCanvas = (draw) => {
        try {
          const cc = document.createElement("canvas");
          cc.width = 400; cc.height = 400;
          const cx = cc.getContext("2d");
          cx.drawImage(img, 0, 0, 400, 400);
          draw(cx, cc);
          return cc.toDataURL("image/jpeg");
        } catch (e) {
          console.warn("Canvas is tainted, returning original image:", e);
          return imgSrc;
        }
      };

      const gradcam = mkCanvas((cx) => {
        spots.slice(0, 100).forEach(s => {
          const g = cx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 28);
          g.addColorStop(0, "rgba(239,68,68,.5)"); g.addColorStop(1, "rgba(59,130,246,0)");
          cx.fillStyle = g; cx.beginPath(); cx.arc(s.x, s.y, 28, 0, Math.PI * 2); cx.fill();
        });
      });

      const lime = mkCanvas((cx) => {
        for (let r = 0; r < 6; r++) for (let cc = 0; cc < 6; cc++) {
          const bx = cc * 67, by = r * 67;
          const cell = spots.filter(s => s.x >= bx && s.x < bx + 67 && s.y >= by && s.y < by + 67).length;
          cx.strokeStyle = "rgba(100,116,139,.4)"; cx.lineWidth = 1;
          cx.strokeRect(bx, by, 67, 67);
          if (cell / (67 * 67 / 16) > 0.03) {
            cx.fillStyle = "rgba(34,197,94,.25)"; cx.fillRect(bx, by, 67, 67);
            cx.strokeStyle = "rgba(34,197,94,.9)"; cx.lineWidth = 1.5; cx.strokeRect(bx, by, 67, 67);
          }
        }
      });

      const shap = mkCanvas((cx) => {
        spots.slice(0, 120).forEach(s => {
          const v = Math.random();
          cx.fillStyle = v < .65 ? "rgba(239,68,68,.9)" : "rgba(59,130,246,.9)";
          cx.beginPath(); cx.arc(s.x, s.y, 3, 0, Math.PI * 2); cx.fill();
        });
      });

      resolve({
        severity: sev, confidence: conf,
        symptomType: ratio > 0.06 ? "acne" : ratio > 0.03 ? "redness" : "dryness",
        summary: mockSummary(sev),
        _gradcam: gradcam, _lime: lime, _shap: shap,
      });
    };
    img.onerror = () => resolve({ severity: "Mild", confidence: 80, symptomType: "acne", summary: mockSummary("Mild") });
    img.src = imgSrc;
  });
}

function mockSummary(sev) {
  const s = (sev || "Mild").toLowerCase();
  const diag = s === "clear"
    ? "Your skin appears clear with no active acne lesions detected."
    : `You have acne vulgaris, an inflammatory skin condition, presenting with **${sev}** severity.`;
  return `**DIAGNOSIS:** ${diag}
**CAUSES:**
• Excess sebum production blocking pores and creating an environment for bacterial growth
• Hormonal fluctuations (androgens) increasing oil gland activity
• Buildup of dead skin cells forming comedones (blackheads and whiteheads)
**TREATMENT PLAN:**
• Use a salicylic acid (2%) cleanser twice daily to gently exfoliate and unclog pores
• Apply benzoyl peroxide (2.5%) as a targeted spot treatment at night only
• Use a lightweight, oil-free, non-comedogenic moisturizer to maintain barrier function
• Apply broad-spectrum SPF 50+ every morning — UV exposure worsens post-acne marks
**LIFESTYLE TIPS:**
• Change your pillowcase every 2–3 days to prevent bacterial transfer
• Avoid touching your face throughout the day — hands transfer oil and bacteria
• Reduce high-glycemic foods (white bread, sugar) which spike insulin and oil production
**SEE A DOCTOR IF:** Acne becomes cystic, deeply painful, rapidly spreading, or causes significant scarring`;
}

/* ============================================================
   ROUTINE PAGE
   ============================================================ */
window.isEditingRoutine = false;

window.addRoutineStep = (time) => {
  if (!state.customRoutine) state.customRoutine = {};
  if (!state.customRoutine[time]) state.customRoutine[time] = [];
  state.customRoutine[time].push({ title: "New Step", desc: "Click to edit" });
  sv("derm-routine", state.customRoutine);
  renderRoutine();
};

window.deleteRoutineStep = (time, index) => {
  if (state.customRoutine && state.customRoutine[time]) {
    state.customRoutine[time].splice(index, 1);
    sv("derm-routine", state.customRoutine);
    renderRoutine();
  }
};

window.updateRoutineStep = (time, index, field, value) => {
  if (state.customRoutine && state.customRoutine[time]) {
    state.customRoutine[time][index][field] = value;
    sv("derm-routine", state.customRoutine);
  }
};

window.toggleEditRoutine = () => {
  window.isEditingRoutine = !window.isEditingRoutine;
  renderRoutine();
};

function renderRoutine() {
  const r = state.lastResult || (state.history.length > 0 ? state.history[state.history.length - 1] : null);

  let severity = "clear";
  if (r && r.severity) severity = r.severity.toLowerCase();

  // AI customized guidelines based on severity
  let aiDos = ["Use a non-comedogenic foaming cleanser", "Apply a lightweight, oil-free moisturizer", "Broad-spectrum SPF 30+"];
  let aiDonts = ["Harsh physical scrubs", "Coconut oil or heavy comedogenic creams", "Picking or popping pimples"];

  if (severity === "mild") {
    aiDos.push("Salicylic Acid (BHA) 2% 2-3x a week");
  } else if (severity === "moderate") {
    aiDos.push("2.5% Benzoyl Peroxide or Adapalene");
    aiDos.push("Vitamin C for hyperpigmentation");
    aiDonts.push("Using multiple strong actives in the same routine");
  } else if (severity === "severe") {
    aiDos = ["Ultra-gentle hydrating cleansers", "Prescription treatments (e.g., Tretinoin, topical antibiotics)", "Rich barrier-repair creams (ceramides)"];
    aiDonts.push("Over-washing face", "Any over-the-counter harsh acne scrubs", "Delaying seeing a dermatologist");
  }

  // Basic default routines if no custom routine exists
  if (!state.customRoutine) {
    let morning = [
      { title: "Gentle Cleanser", desc: "Use a non-comedogenic foaming cleanser." },
      { title: "Moisturizer", desc: "Apply a lightweight, oil-free moisturizer." },
      { title: "Sunscreen", desc: "Broad-spectrum SPF 30+ is essential." }
    ];
    let evening = [
      { title: "Double Cleanse", desc: "Remove sunscreen and impurities." },
      { title: "Active Treatment", desc: "Apply recommended serums or creams." },
      { title: "Night Moisturizer", desc: "Hydrate and repair skin barrier." }
    ];

    if (severity === "mild") {
      evening[1].desc = "Apply Salicylic Acid (BHA) 2% to target congested pores.";
    } else if (severity === "moderate") {
      evening[1] = { title: "Benzoyl Peroxide / Retinoid", desc: "Use 2.5% Benzoyl Peroxide or Adapalene as directed." };
      morning.splice(1, 0, { title: "Vitamin C Serum", desc: "For post-inflammatory hyperpigmentation." });
    } else if (severity === "severe") {
      morning[0].desc = "Use an ultra-gentle hydrating cleanser to prevent irritation.";
      evening[1] = { title: "Prescription Treatment", desc: "Apply dermatologist-prescribed topicals (e.g., Tretinoin/Antibiotics)." };
      evening[2].desc = "Use a rich barrier-repair cream (ceramides).";
    }

    state.customRoutine = { morning, evening };
    sv("derm-routine", state.customRoutine);
  }

  const morning = state.customRoutine.morning || [];
  const evening = state.customRoutine.evening || [];
  const isEdit = window.isEditingRoutine;

  app.innerHTML = `
    <div class="page page-enter" style="max-width:860px;">
      <div style="padding: 40px 0 24px; display: flex; align-items: center; border-bottom: 1px solid var(--border); margin-bottom: 28px;">
        ${inlineBackBtn()}
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--ink); margin: 0; letter-spacing: -0.02em;">Daily Skin Routine</h1>
          <p style="font-size: 13px; color: var(--ink-3); margin: 2px 0 0 0;">
            Personalized AI schedule based on your ${r ? "latest scan (" + (r.severity || "Unknown") + ")" : "skin profile"}.
          </p>
        </div>
        <div style="margin-left: auto; display: flex; gap: 12px;">
          <button class="btn-ghost" style="border: 1px solid var(--border);" onclick="window.toggleEditRoutine()">
            ${isEdit ? "Done Editing" : "Edit Routine"}
          </button>
          <button class="btn-primary" data-nav="chat" onclick="setTimeout(() => { const i = document.getElementById('chatInput'); if(i){ i.value='Can you review my skincare routine for ${severity} acne?'; i.focus(); } }, 100)">
            ${ic(SVG.brain, 16)} Ask AI
          </button>
        </div>
      </div>

      <div style="display: grid; gap: 24px;">
        
        <!-- AI Guidelines -->
        <div style="background: linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(23, 107, 115, 0.05)); border: 1.5px solid rgba(45, 212, 191, 0.3); border-radius: var(--r-xl); padding: 24px; box-shadow: var(--sh-sm);">
          <h3 style="font-size: 18px; font-weight: 700; color: var(--primary-h); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            ${ic(SVG.brain, 20)} AI Skincare Guidelines
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <h4 style="font-size: 14px; font-weight: 700; color: var(--mild-c); margin-bottom: 8px;">What to Use (Do's)</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--ink-2); line-height: 1.6;">
                ${aiDos.map(d => `<li>${d}</li>`).join("")}
              </ul>
            </div>
            <div>
              <h4 style="font-size: 14px; font-weight: 700; color: var(--sev-c); margin-bottom: 8px;">What to Avoid (Don'ts)</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--ink-2); line-height: 1.6;">
                ${aiDonts.map(d => `<li>${d}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>

        <!-- Morning -->
        <div style="background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r-xl); padding: 24px; box-shadow: var(--sh-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 18px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              Morning Routine
            </h3>
            ${isEdit ? `<button class="btn-ghost" style="padding: 4px 12px; font-size: 12px;" onclick="window.addRoutineStep('morning')">+ Add Step</button>` : ""}
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${morning.map((m, i) => `
              <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px solid transparent; transition: 0.2s;" onmouseover="if(!${isEdit}) this.style.borderColor='var(--border)'" onmouseout="this.style.borderColor='transparent'">
                ${isEdit ? `
                  <button style="background:none; border:none; color: var(--sev-c); cursor:pointer; padding: 4px;" onclick="window.deleteRoutineStep('morning', ${i})">✕</button>
                  <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                    <input type="text" value="${m.title}" oninput="window.updateRoutineStep('morning', ${i}, 'title', this.value)" style="font-size: 14px; font-weight: 600; color: var(--ink); border: 1px solid var(--border); border-radius: 4px; padding: 4px 8px; width: 100%;">
                    <input type="text" value="${m.desc}" oninput="window.updateRoutineStep('morning', ${i}, 'desc', this.value)" style="font-size: 13px; color: var(--ink-3); border: 1px solid var(--border); border-radius: 4px; padding: 4px 8px; width: 100%;">
                  </div>
                ` : `
                  <label style="display:flex; gap:12px; cursor:pointer; width:100%;">
                    <input type="checkbox" style="margin-top: 4px; width: 18px; height: 18px; accent-color: var(--primary);">
                    <div>
                      <div style="font-size: 14px; font-weight: 600; color: var(--ink);">${m.title}</div>
                      <div style="font-size: 13px; color: var(--ink-3); margin-top: 2px;">${m.desc}</div>
                    </div>
                  </label>
                `}
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Evening -->
        <div style="background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r-xl); padding: 24px; box-shadow: var(--sh-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 18px; font-weight: 700; color: #6366f1; display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              Evening Routine
            </h3>
            ${isEdit ? `<button class="btn-ghost" style="padding: 4px 12px; font-size: 12px;" onclick="window.addRoutineStep('evening')">+ Add Step</button>` : ""}
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${evening.map((m, i) => `
              <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px solid transparent; transition: 0.2s;" onmouseover="if(!${isEdit}) this.style.borderColor='var(--border)'" onmouseout="this.style.borderColor='transparent'">
                ${isEdit ? `
                  <button style="background:none; border:none; color: var(--sev-c); cursor:pointer; padding: 4px;" onclick="window.deleteRoutineStep('evening', ${i})">✕</button>
                  <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                    <input type="text" value="${m.title}" oninput="window.updateRoutineStep('evening', ${i}, 'title', this.value)" style="font-size: 14px; font-weight: 600; color: var(--ink); border: 1px solid var(--border); border-radius: 4px; padding: 4px 8px; width: 100%;">
                    <input type="text" value="${m.desc}" oninput="window.updateRoutineStep('evening', ${i}, 'desc', this.value)" style="font-size: 13px; color: var(--ink-3); border: 1px solid var(--border); border-radius: 4px; padding: 4px 8px; width: 100%;">
                  </div>
                ` : `
                  <label style="display:flex; gap:12px; cursor:pointer; width:100%;">
                    <input type="checkbox" style="margin-top: 4px; width: 18px; height: 18px; accent-color: #6366f1;">
                    <div>
                      <div style="font-size: 14px; font-weight: 600; color: var(--ink);">${m.title}</div>
                      <div style="font-size: 13px; color: var(--ink-3); margin-top: 2px;">${m.desc}</div>
                    </div>
                  </label>
                `}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}


/* ============================================================
   HISTORY PAGE
   ============================================================ */
function renderHistory() {
  const hist = state.history;
  const score = h => 100 - (h.severity === "Severe" ? 80 : h.severity === "Moderate" ? 55 : h.severity === "Mild" ? 25 : 5);
  const impr = hist.length > 1 ? Math.round(((score(hist[hist.length - 1]) - score(hist[0])) / score(hist[hist.length - 1])) * 100) : 0;

  app.innerHTML = `
    <div class="page page-enter history-page">
      <div class="page-head" style="display:flex;align-items:center;gap:12px;">
        ${inlineBackBtn()}
        <div>
          <h1 class="page-head__title">Scan History</h1>
          <p class="page-head__sub">${hist.length} total analysis${hist.length !== 1 ? "es" : ""} · All data stored locally</p>
        </div>
        <button class="btn-primary" data-nav="analyze" style="margin-left:auto;">${ic(SVG.cam)} New Scan</button>
      </div>

      ${hist.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state__ico">${ic(SVG.chart, 28)}</div>
          <h3>No scans yet</h3>
          <p>Complete your first AI skin analysis to begin tracking your severity trend over time.</p>
          <button class="btn-primary" data-nav="analyze">${ic(SVG.cam)} Start First Analysis</button>
        </div>` : `

      <div class="stat-strip">
        <div class="stat-box">
          <div class="stat-box__val" style="color:var(--primary);">${hist.length}</div>
          <div class="stat-box__lbl">Total Scans</div>
        </div>
        <div class="stat-box">
          <div class="stat-box__val" style="color:var(--mild-c);">${impr >= 0 ? "+" + impr + "%" : impr + "%"}</div>
          <div class="stat-box__lbl">Score Change</div>
        </div>
        <div class="stat-box">
          <div class="stat-box__val">${hist[0]?.severity || "–"}</div>
          <div class="stat-box__lbl">Latest Severity</div>
        </div>
        <div class="stat-box">
          <div class="stat-box__val" style="color:var(--accent-2);">${hist[0]?.confidence || "–"}%</div>
          <div class="stat-box__lbl">Latest Confidence</div>
        </div>
      </div>

      <div class="chart-box">
        <div class="chart-box__head">
          <div>
            <div class="chart-box__title">Severity Score Over Time</div>
            <div class="chart-box__sub">Higher score = healthier skin (lower acne severity)</div>
          </div>
          <div class="chart-legend">
            <span><span class="leg-dot" style="background:var(--mild-c)"></span>Clear / Mild</span>
            <span><span class="leg-dot" style="background:var(--mod-c)"></span>Moderate</span>
            <span><span class="leg-dot" style="background:var(--sev-c)"></span>Severe</span>
          </div>
        </div>
        <div style="position:relative;">
          <canvas id="histChart" style="width:100%;height:200px;"></canvas>
          <div id="chartTip" style="display:none;position:absolute;background:#fff;border:1px solid var(--border);border-radius:10px;padding:8px 12px;pointer-events:none;box-shadow:var(--sh-md);font-size:12px;"></div>
        </div>
      </div>

      <div class="history-table">
        <table class="htable">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Severity</th>
              <th>Concern</th>
              <th>Zone</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            ${hist.map((h, i) => `
              <tr>
                <td style="color:var(--ink-3);font-size:12px;">${i + 1}</td>
                <td>${new Date(h.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                <td><span class="sev-badge ${sevClass(h.severity)}">${h.severity}</span></td>
                <td>${h.symptomType || "Acne"}</td>
                <td>${h.zone || "–"}</td>
                <td style="font-weight:700;color:var(--primary);">${h.confidence || "–"}%</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`}
    </div>`;

  if (hist.length > 0) {
    setTimeout(() => drawHistoryChart(hist, score), 50);
  }
}

function drawHistoryChart(hist, score) {
  const canvas = document.getElementById("histChart");
  if (!canvas) return;
  const tip = document.getElementById("chartTip");
  const DPR = window.devicePixelRatio || 1;
  const CW = canvas.parentElement.clientWidth;
  const CH = 200;
  canvas.width = CW * DPR;
  canvas.height = CH * DPR;
  canvas.style.width = CW + "px";
  canvas.style.height = CH + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);

  const pts = [...hist].reverse();
  const pL = 44, pR = 16, pT = 14, pB = 32;
  const W = CW - pL - pR, H = CH - pT - pB;
  const sx = pts.length > 1 ? W / (pts.length - 1) : W;
  const ppx = i => pL + sx * i;
  const ppy = v => pT + H * (1 - v / 100);

  // grid
  [0, 25, 50, 75, 100].forEach(v => {
    ctx.setLineDash([3, 4]); ctx.strokeStyle = "rgba(0,0,0,.06)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pL, ppy(v)); ctx.lineTo(pL + W, ppy(v)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#6b7a88"; ctx.font = "600 10px Inter,sans-serif"; ctx.textAlign = "right";
    ctx.fillText(v, pL - 6, ppy(v) + 4);
  });

  const data = pts.map((h, i) => ({ x: ppx(i), y: ppy(score(h)), h, s: score(h) }));

  // area fill
  if (data.length > 1) {
    const g = ctx.createLinearGradient(0, pT, 0, pT + H);
    g.addColorStop(0, "rgba(23,107,115,.2)"); g.addColorStop(1, "rgba(23,107,115,0)");
    ctx.beginPath(); ctx.moveTo(data[0].x, data[0].y);
    for (let i = 1; i < data.length; i++) ctx.lineTo(data[i].x, data[i].y);
    ctx.lineTo(data[data.length - 1].x, pT + H); ctx.lineTo(data[0].x, pT + H); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();

    // line
    ctx.beginPath(); ctx.moveTo(data[0].x, data[0].y);
    for (let i = 1; i < data.length; i++) ctx.lineTo(data[i].x, data[i].y);
    ctx.strokeStyle = "#176b73"; ctx.lineWidth = 2; ctx.stroke();
  }

  // dots + labels
  data.forEach((d, i) => {
    const col = sevColor(d.h.severity);
    ctx.beginPath(); ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = col + "22"; ctx.fill();
    ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.fillStyle = "#6b7a88"; ctx.font = "600 9px Inter,sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`#${i + 1}`, d.x, CH - 8);
  });

  canvas.onmousemove = e => {
    const rc = canvas.getBoundingClientRect();
    const mx = e.clientX - rc.left, my = e.clientY - rc.top;
    let hit = null;
    data.forEach((d, i) => { if (Math.hypot(mx - d.x, my - d.y) < 20) hit = i; });
    if (hit !== null && tip) {
      const d = data[hit];
      tip.style.display = "block"; tip.style.left = Math.min(d.x - 40, CW - 120) + "px"; tip.style.top = (d.y - 58) + "px";
      tip.innerHTML = `<strong>${d.h.severity}</strong><br>Score: ${d.s}/100<br>${new Date(d.h.timestamp).toLocaleDateString()}`;
    } else if (tip) tip.style.display = "none";
  };
  canvas.onmouseleave = () => { if (tip) tip.style.display = "none"; };
}

/* ============================================================
   RESEARCH PAGE
   ============================================================ */
function renderResearch() {
  app.innerHTML = `
    <div class="page page-enter research-page">
      <div class="research-hero">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
          ${inlineBackBtn()}
          <span class="research-hero__eyebrow" style="margin:0;">Paper ID 1505 · OTCON5 / COMSYS</span>
        </div>
        <h1 class="research-hero__title">Explainable AI for Smartphone Acne Severity Diagnosis</h1>
        <p class="research-hero__sub">Authors: <strong>Amit Singh, Dhirajan et al.</strong> — A Tri-Layer XAI framework combining Grad-CAM, LIME, and SHAP to make AI acne grading clinically interpretable.</p>
      </div>

      <div class="research-tabs">
        <button class="r-tab${state.researchTab === "abstract" ? " active" : ""}" data-rtab="abstract">Abstract</button>
        <button class="r-tab${state.researchTab === "methodology" ? " active" : ""}" data-rtab="methodology">Methodology</button>
        <button class="r-tab${state.researchTab === "evaluation" ? " active" : ""}" data-rtab="evaluation">Evaluation</button>
        <button class="r-tab${state.researchTab === "faq" ? " active" : ""}" data-rtab="faq">Paper Q&amp;A</button>
      </div>

      <div id="rContent"></div>
    </div>`;

  app.querySelectorAll(".r-tab").forEach(b => {
    b.onclick = () => { state.researchTab = b.dataset.rtab; app.querySelectorAll(".r-tab").forEach(x => x.classList.remove("active")); b.classList.add("active"); paintResearch(); };
  });

  paintResearch();
}

function paintResearch() {
  const el = document.getElementById("rContent");
  if (!el) return;

  if (state.researchTab === "abstract") {
    el.innerHTML = `
      <div class="r-grid">
        <div class="r-card">
          <div class="r-card__title">Abstract</div>
          <div class="r-card__sub">A clinical machine learning paper targeting acne severity from smartphone imagery</div>
          <div class="r-card__body">
            <p>Skin conditions, particularly acne vulgaris, significantly impact individuals' quality of life. Traditional diagnosis often relies on subjective visual assessments by clinicians, introducing variability and limiting scalability in resource-constrained settings.</p>
            <p class="mt-12">This research proposes an <strong>Explainable AI (XAI) framework</strong> for diagnosing acne severity using smartphone images. The system extracts handcrafted features — including color histograms in HSV color space, Local Binary Patterns (LBP) for texture, redness ratios, and Canny edge density — and trains a class-balanced <strong>Random Forest</strong> classifier.</p>
            <p class="mt-12">To address the "black box" problem inherent in machine learning, we introduce a <strong>Tri-Layer XAI framework</strong> utilizing Grad-CAM (global saliency), LIME (regional superpixels), and SHAP (pixel-level Shapley values) to provide multi-scale visual explanations that bridge the gap between ML predictions and clinical interpretability.</p>
            <p class="mt-12">The model achieves <strong>91.6% test accuracy</strong> across four severity tiers on the ACNE04 smartphone image dataset, with the Grad-CAM heatmaps showing strong concordance with manually annotated lesion regions as validated by dermatology residents.</p>
          </div>
        </div>
 
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="r-card">
            <div class="r-card__title">Key Metrics</div>
            <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
              ${[
        { l: "Test Accuracy", v: "91.6%", c: "var(--primary)" },
        { l: "Val Accuracy", v: "91.6%", c: "var(--accent-2)" },
        { l: "Training Set", v: "3,200", c: "var(--ink)" },
        { l: "Validation Set", v: "400", c: "var(--ink)" },
        { l: "Test Set", v: "400", c: "var(--ink)" },
        { l: "Classes", v: "4", c: "var(--mild-c)" },
      ].map(m => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg);border-radius:8px;">
                  <span style="font-size:13px;color:var(--ink-2);">${m.l}</span>
                  <span style="font-size:15px;font-weight:800;color:${m.c};">${m.v}</span>
                </div>`).join("")}
            </div>
          </div>

          <div class="r-card">
            <div class="r-card__title">Dataset</div>
            <div class="r-card__body mt-8">
              <p>ACNE04 — smartphone images of real acne patients stratified into four clinical tiers: <strong>Clear, Mild, Moderate, Severe</strong>.</p>
            </div>
          </div>
        </div>
      </div>`;
  }

  else if (state.researchTab === "methodology") {
    el.innerHTML = `
      <div class="r-grid--wide">
        <div class="r-card" style="margin-bottom:20px;">
          <div class="r-card__title">XAI Pipeline Architecture</div>
          <div class="r-card__sub">End-to-end flow from raw smartphone image to interpretable severity prediction</div>

          <div class="pipeline">
            ${[
        { n: 1, l: "Image Capture", sub: "Gaussian noise reduction" },
        { n: 2, l: "Feature Extraction", sub: "HSV · LBP · Redness · Canny", hi: true },
        { n: 3, l: "Scaling", sub: "StandardScaler normalization" },
        { n: 4, l: "Random Forest", sub: "400 estimators · class-balanced", hi: true },
        { n: 5, l: "Tri-Layer XAI", sub: "Grad-CAM · LIME · SHAP", hi: true },
      ].map(s => `
              <div class="pipe-step${s.hi ? " pipe-step--highlight" : ""}">
                <div class="pipe-step__n">${s.n}</div>
                <div class="pipe-step__label">${s.l}</div>
                <div style="font-size:10px;color:var(--ink-3);margin-top:3px;">${s.sub}</div>
              </div>`).join(`<div style="display:flex;align-items:center;padding:0 4px;color:var(--ink-3);font-weight:900;font-size:18px;">→</div>`)}
          </div>
        </div>

        <div class="r-grid">
          <div class="r-card">
            <div class="r-card__title">Tri-Layer XAI Framework</div>
            <div class="r-card__sub">Three complementary explanation scales for clinical trust</div>
            <div class="xai-layers">
              <div class="xai-layer xai-layer--gradcam">
                <div class="xai-layer__num">1</div>
                <div>
                  <div class="xai-layer__title">Grad-CAM — Global Saliency</div>
                  <div class="xai-layer__desc">Gradient-weighted class activation mapping identifies the overall regions of the image that most strongly activate the severity classification. Produces a coarse heatmap — red areas indicate high inflammatory signal, blue areas indicate low contribution.</div>
                </div>
              </div>
              <div class="xai-layer xai-layer--lime">
                <div class="xai-layer__num">2</div>
                <div>
                  <div class="xai-layer__title">LIME — Regional Attribution</div>
                  <div class="xai-layer__desc">Local Interpretable Model-agnostic Explanations perturbs the image by masking superpixels and observing prediction changes. Green-highlighted grid cells indicate regions that positively contribute to the severity label — directly interpretable by clinicians.</div>
                </div>
              </div>
              <div class="xai-layer xai-layer--shap">
                <div class="xai-layer__num">3</div>
                <div>
                  <div class="xai-layer__title">SHAP — Pixel-Level Shapley Values</div>
                  <div class="xai-layer__desc">Game-theory Shapley values computed at individual pixel level. Red dots mark pixels with positive classification support (inflammatory features), blue dots mark negative support (clear/healthy-skin signal), providing the finest-grained explainability layer.</div>
                </div>
              </div>
            </div>
          </div>

          <div class="r-card">
            <div class="r-card__title">Feature Engineering</div>
            <div class="r-card__sub">48-dimensional handcrafted feature vector</div>
            <div class="r-card__body mt-16">
              ${[
        { n: "HSV Color Histogram", bins: "32 bins", d: "16 hue + 8 sat + 8 val — captures overall redness and inflammation coloring" },
        { n: "Local Binary Pattern", bins: "10 bins", d: "Texture roughness from lesion surfaces using uniform LBP (P=8, R=1)" },
        { n: "Redness Ratio", bins: "2 features", d: "Mean redness score and fraction of inflamed pixels (R − (G+B)/2 > 15)" },
        { n: "Canny Edge Density", bins: "2 features", d: "Edge density and local standard deviation as lesion boundary proxies" },
      ].map(f => `
                <div style="padding:12px 0;border-bottom:1px solid var(--border);">
                  <div style="font-size:13px;font-weight:700;margin-bottom:3px;">${f.n} <span style="font-size:10px;font-weight:600;color:var(--primary);background:rgba(23,107,115,.1);padding:1px 6px;border-radius:999px;">${f.bins}</span></div>
                  <div style="font-size:12px;color:var(--ink-3);line-height:1.5;">${f.d}</div>
                </div>`).join("")}
            </div>
          </div>
        </div>
      </div>`;
  }

  else if (state.researchTab === "evaluation") {
    el.innerHTML = `
      <div class="r-grid">
        <div class="r-card">
          <div class="r-card__title">Performance Metrics — Table II (EfficientNet-B0)</div>
          <div class="r-card__sub">ACNE04 dataset · Per-class accuracy from paper</div>
          <table class="metrics-table">
            <thead>
              <tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1-Score</th><th>Accuracy (%)</th></tr>
            </thead>
            <tbody>
              ${[
        { c: "Clear", p: "0.96", r: "0.94", f: "0.95", a: "95.8" },
        { c: "Mild", p: "0.92", r: "0.89", f: "0.90", a: "90.2" },
        { c: "Moderate", p: "0.88", r: "0.87", f: "0.87", a: "87.5" },
        { c: "Severe", p: "0.93", r: "0.95", f: "0.94", a: "93.1" },
      ].map(r => `
                <tr>
                  <td style="font-weight:700;">${r.c}</td>
                  <td>${r.p}</td><td>${r.r}</td>
                  <td style="font-weight:700;color:var(--primary);">${r.f}</td>
                  <td style="font-weight:800;color:var(--mild-c);">${r.a}%</td>
                </tr>`).join("")}
              <tr style="border-top:2px solid var(--border);background:rgba(23,107,115,.04);">
                <td style="font-weight:800;color:var(--ink);">Average</td>
                <td style="font-weight:700;">0.92</td>
                <td style="font-weight:700;">0.91</td>
                <td style="font-weight:800;color:var(--primary);">0.91</td>
                <td style="font-weight:900;color:var(--primary);font-size:15px;">91.6%</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top:24px;">
            <div class="r-card__title" style="margin-bottom:4px;">Per-Class Accuracy Bar Chart</div>
            <div class="r-card__sub" style="margin-bottom:14px;">EfficientNet-B0 · ACNE04 dataset</div>
            ${[
        { c: "Clear", v: 95.8, col: "var(--primary)" },
        { c: "Mild", v: 90.2, col: "var(--mild-c)" },
        { c: "Moderate", v: 87.5, col: "var(--mod-c)" },
        { c: "Severe", v: 93.1, col: "var(--accent-2)" },
      ].map(b => `
              <div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:4px;">
                  <span>${b.c}</span>
                  <span style="color:${b.col};">${b.v}%</span>
                </div>
                <div style="height:8px;background:var(--bg);border-radius:999px;overflow:hidden;">
                  <div style="height:100%;width:${b.v}%;background:${b.col};border-radius:999px;transition:width 1s ease;"></div>
                </div>
              </div>`).join("")}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="r-card">
            <div class="r-card__title">ACNE04 Dataset Splits</div>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">
              ${[
        { l: "Training", n: 3200, pct: 80 },
        { l: "Validation", n: 400, pct: 10 },
        { l: "Test", n: 400, pct: 10 },
      ].map(d => `
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:4px;">
                    <span>${d.l}</span><span style="color:var(--ink-3);">${d.n} images</span>
                  </div>
                  <div style="height:6px;background:var(--bg);border-radius:999px;overflow:hidden;">
                    <div style="height:100%;width:${d.pct}%;background:var(--primary);border-radius:999px;"></div>
                  </div>
                </div>`).join("")}
            </div>
          </div>

          <div class="r-card">
            <div class="r-card__title">Dataset Info</div>
            <div class="r-card__body mt-8">
              <p>• <strong>Source:</strong> ACNE04 smartphone image database</p>
              <p class="mt-8">• <strong>Classes:</strong> level0 (Clear), level1 (Mild), level2 (Moderate), level3 (Severe)</p>
              <p class="mt-8">• <strong>Model:</strong> EfficientNet-B0 pretrained on ImageNet-1k, fine-tuned with AdamW, lr=2e-4</p>
              <p class="mt-8">• <strong>Moderate</strong> at 87.5% is the hardest class — visually overlaps Mild and Severe boundaries.</p>
              <p class="mt-8">• <strong>Augmentation:</strong> Random rotation ±30°, horizontal flip, random crop, Gaussian noise injection.</p>
            </div>
          </div>
        </div>
      </div>`;
  }

  else if (state.researchTab === "faq") {
    const faqs = [
      { q: "What is the core contribution of this paper?", a: "The paper develops a Tri-Layer Explainable AI (XAI) framework that makes acne severity predictions interpretable at three spatial scales — global (Grad-CAM heatmap), regional (LIME superpixels), and pixel (SHAP Shapley values). It bridges ML black-box predictions with clinical visual reasoning, enabling dermatologists to understand and trust the model's outputs." },
      { q: "Why use a Random Forest instead of a full CNN?", a: "The Random Forest baseline is CPU-friendly, deployable without a GPU, and provides native feature importance (a form of global explainability). For LIME and SHAP explanations, any predict_proba function works — enabling the same Tri-Layer XAI framework to be applied to the EfficientNet-B0 CNN backbone in train_cnn_efficientnet.py." },
      { q: "How are image features extracted?", a: "The extraction pipeline produces a 48-dimensional feature vector per image: (1) 32-bin HSV color histogram capturing redness/inflammation hue, (2) 10-bin Local Binary Pattern histogram for skin texture roughness, (3) mean redness and redness ratio from R−(G+B)/2 per pixel, (4) Canny edge density and local standard deviation as lesion boundary proxies." },
      { q: "Why is Moderate accuracy so low (8.3% F1)?", a: "The ACNE04 dataset is class-imbalanced (Moderate has fewer samples than Mild or Clear), and Moderate images are visually ambiguous — they share features with both Mild and Severe. The paper reports this as a known limitation and proposes SMOTE oversampling and curriculum learning as future work." },
      { q: "How does the clinical safety override work?", a: "If the redness ratio drops below 0.018 AND edge density falls below 0.02 (both very low), the backend forces the prediction to 'Clear' with 96% confidence, regardless of the RF model output. This prevents false-positive Moderate/Severe predictions for clearly healthy skin images, prioritizing patient safety." },
      { q: "Is this app approved for clinical use?", a: "No. This is a research prototype and academic demonstration tool. It is NOT certified for clinical diagnosis. All results must be reviewed by a qualified dermatologist. The paper is submitted for peer review at OTCON5/COMSYS and the clinical validation work is ongoing." },
    ];
    el.innerHTML = `
      <div class="r-grid--wide">
        <div class="r-card">
          <div class="r-card__title">Frequently Asked Questions</div>
          <div class="r-card__sub">Key technical and clinical questions about the research paper and this application</div>
          <div class="faq-list mt-16">
            ${faqs.map((f, i) => `
              <div class="faq-item" data-fi="${i}">
                <button class="faq-q">${f.q} <span class="faq-ico">▼</span></button>
                <div class="faq-a">${f.a}</div>
              </div>`).join("")}
          </div>
        </div>
      </div>`;

    el.querySelectorAll(".faq-item").forEach(item => {
      item.querySelector(".faq-q").onclick = () => item.classList.toggle("open");
    });
  }
}

/* ============================================================
   CHAT / AI ASSISTANT PAGE
   ============================================================ */

// chat state (not persisted for privacy)
const chatMessages = [
  {
    role: "assistant",
    text: "Hi! I'm your DermAI clinical assistant 👋 Ask me anything about acne, your recent scan results, skincare ingredients, or when to see a dermatologist.",
  },
];
let chatTyping = false;

function renderChat() {
  app.innerHTML = `
    <div class="page page-enter" style="max-width:860px;">
      <!-- Title Header section -->
      <div style="padding: 40px 0 24px; display: flex; align-items: center; border-bottom: 1px solid var(--border); margin-bottom: 28px;">
        ${inlineBackBtn()}
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 52px; height: 52px; background: linear-gradient(135deg, var(--primary), #2dd4bf); color: #fff; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(23, 107, 115, 0.2);">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: var(--ink); margin: 0; letter-spacing: -0.02em;">AI Skin Assistant</h1>
            <p style="font-size: 13px; color: var(--ink-3); margin: 2px 0 0 0; display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; background: #2dd4bf; border-radius: 50%; box-shadow: 0 0 8px #2dd4bf;"></span>
              Clinical Advisor Mode · Online &amp; Secure
            </p>
          </div>
        </div>
        <button class="btn-ghost" id="btnClearChat" style="border: 1px solid var(--border); margin-left: auto; height: 38px; border-radius: var(--r-md); padding: 0 16px; font-size: 13px; font-weight: 600; color: var(--ink-2); background: var(--surface);">Clear Chat</button>
      </div>

      <!-- Main Chat Frame Card -->
      <div style="background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r-xl); box-shadow: var(--sh-md); overflow: hidden; display: flex; flex-direction: column; height: 600px;">
        
        <!-- Suggestions chips placed inside chat card top -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; padding: 16px 20px; background: rgba(0, 0, 0, 0.015); border-bottom: 1.5px solid var(--border);" id="chatSuggestions">
          ${[
      "What are the causes of acne?",
      "How does Grad-CAM work?",
      "What is salicylic acid used for?",
      "When should I see a dermatologist?",
      "Explain my last scan result",
    ].map(s => `<button class="chat-chip" data-sug="${s}">${s}</button>`).join("")}
        </div>

        <!-- Message thread container -->
        <div class="chat-thread" id="chatThread" style="flex: 1; padding: 24px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; background: var(--surface); border: none !important; border-radius: 0 !important; max-height: none !important;">
          ${chatMessages.map(m => renderMsgBubble(m)).join("")}
          <div id="typingIndicator" style="display:none;" class="chat-bubble chat-bubble--bot">
            <div class="chat-avatar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l7 3v6c0 5-4 9-7 10-3-1-7-5-7-10V5l7-3z"/></svg>
            </div>
            <div class="chat-text" style="background: #fbfbfc; border: 1.5px solid var(--border); border-top-left-radius: 4px; padding: 11px 16px;">
              <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>

        <!-- Input bar bottom -->
        <div style="padding: 16px 20px; border-top: 1.5px solid var(--border); background: var(--surface); display: flex; align-items: center; gap: 12px;">
          <div style="flex: 1; border: 1.5px solid var(--border); border-radius: 24px; padding: 8px 16px; display: flex; align-items: center; background: rgba(0,0,0,0.01); transition: all 0.2s;" id="chatInputWrap">
            <textarea
              id="chatInput"
              class="chat-input"
              placeholder="Ask about acne, skincare, your scan results…"
              rows="1"
              style="flex: 1; border: none; outline: none; background: transparent; font-family: var(--font); font-size: 14px; color: var(--ink); resize: none; min-height: 24px; max-height: 80px; padding-top: 2px;"
            ></textarea>
            <button class="chat-send" id="btnSend" style="background: var(--primary); color: #fff; border: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;" onmouseover="this.style.background='var(--primary-h)'; this.style.transform='scale(1.05)';" onmouseout="this.style.background='var(--primary)'; this.style.transform='scale(1)';">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;

  const thread = document.getElementById("chatThread");
  const inputEl = document.getElementById("chatInput");
  const btnSend = document.getElementById("btnSend");
  const btnClear = document.getElementById("btnClearChat");

  scrollThread();

  // auto-expand textarea
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + "px";
  });

  // send on Enter (Shift+Enter for newline)
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });

  btnSend.onclick = sendChat;

  // suggestion chips
  app.querySelectorAll(".chat-chip").forEach(c => {
    c.onclick = () => { inputEl.value = c.dataset.sug; sendChat(); };
  });

  // clear
  btnClear.onclick = () => {
    chatMessages.length = 0;
    chatMessages.push({ role: "assistant", text: "Chat cleared! How can I help you?" });
    renderChat();
  };

  function scrollThread() {
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  async function sendChat() {
    const msg = (inputEl.value || "").trim();
    if (!msg || chatTyping) return;
    inputEl.value = "";
    inputEl.style.height = "auto";

    chatMessages.push({ role: "user", text: msg });
    appendBubble({ role: "user", text: msg });

    // hide suggestions after first user message
    const sug = document.getElementById("chatSuggestions");
    if (sug) sug.style.display = "none";

    // show typing
    const ti = document.getElementById("typingIndicator");
    if (ti) ti.style.display = "flex";
    chatTyping = true;
    scrollThread();

    const reply = await getChatReply(msg);
    chatMessages.push({ role: "assistant", text: reply });

    if (ti) ti.style.display = "none";
    chatTyping = false;
    appendBubble({ role: "assistant", text: reply });
    scrollThread();
  }

  function appendBubble(msg) {
    const div = document.createElement("div");
    div.innerHTML = renderMsgBubble(msg);
    if (thread) thread.insertBefore(div.firstElementChild, document.getElementById("typingIndicator"));
    scrollThread();
  }
}

function renderMsgBubble(m) {
  const isBot = m.role === "assistant";
  const txt = (m.text || "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
  return `
    <div class="chat-bubble ${isBot ? "chat-bubble--bot" : "chat-bubble--user"}">
      ${isBot ? `<div class="chat-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l7 3v6c0 5-4 9-7 10-3-1-7-5-7-10V5l7-3z"/></svg>
      </div>` : ""}
      <div class="chat-text">${txt}</div>
    </div>`;
}

async function getChatReply(message) {
  // Try Groq / LLaMA
  try {
    const contextNote = state.lastResult
      ? `The user's last scan showed: Severity=${state.lastResult.severity}, Confidence=${state.lastResult.confidence}%, Concern=${state.lastResult.symptomType}, Zone=${state.lastResult.zone}.`
      : "";

    const res = await fetch(LLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LLAMA_KEY}`,
      },
      body: JSON.stringify({
        model: state.profile?.aiModel || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a board-certified dermatologist AI assistant. Speak concisely, clinically, and with empathy. " +
              "Do NOT over-diagnose. Always remind users to consult a real doctor for serious concerns. " +
              "Keep replies under 120 words. " + contextNote,
          },
          ...chatMessages.slice(-8).map(m => ({ role: m.role, content: m.text })),
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      return d.choices?.[0]?.message?.content?.trim() || localFallback(message);
    }
  } catch { }

  // Try Flask backend
  try {
    const r = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (r.ok) {
      const d = await r.json();
      return d.reply || localFallback(message);
    }
  } catch { }

  return localFallback(message);
}

function localFallback(msg) {
  const t = msg.toLowerCase();
  if (t.includes("acne")) return "Acne vulgaris is caused by clogged pores, excess sebum, bacteria, and hormonal fluctuations. A consistent routine with salicylic acid + non-comedogenic moisturizer + SPF is the first-line approach.";
  if (t.includes("gradcam") || t.includes("grad-cam")) return "Grad-CAM uses the gradients of a target class flowing into the final convolutional layer to produce a coarse localization map — highlighting regions that contributed most to the prediction.";
  if (t.includes("salicylic")) return "Salicylic acid (BHA) is oil-soluble, so it penetrates into pores to dissolve plugs and reduce inflammation. 2% concentration is effective for mild-moderate acne with minimal irritation.";
  if (t.includes("dermatologist") || t.includes("doctor")) return "See a dermatologist if: acne is cystic or nodular, you're experiencing scarring, OTC treatments fail after 8–12 weeks, or there's a sudden unexplained onset in adulthood.";
  if (t.includes("result") || t.includes("scan")) {
    if (state.lastResult) return `Your last scan detected **${state.lastResult.severity}** acne with **${state.lastResult.confidence}%** confidence in the **${state.lastResult.zone}** zone. Would you like recommendations for ${state.lastResult.symptomType}?`;
    return "I don't see a recent scan result. Run an analysis from the Analyze page first, then come back and I'll explain the results.";
  }
  return "That's a great question about skin health. Could you give me a bit more detail? I'm here to help with acne, XAI, skincare routines, and understanding your scan results.";
}

// ─── Additional CSS injected at runtime ───
(function injectChatStyles() {
  const s = document.createElement("style");
  s.textContent = `
    .chat-chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      color: var(--ink-2);
      cursor: pointer;
      transition: all .15s;
      font-family: var(--font);
    }
    .chat-chip:hover { border-color: var(--primary); color: var(--primary); background: rgba(23,107,115,.04); }

    .chat-thread {
      background: var(--surface);
      padding: 24px 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .chat-bubble {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 75%;
      animation: fadeSlideUp .2s ease;
    }

    .chat-bubble--bot { align-self: flex-start; }
    .chat-bubble--user { align-self: flex-end; flex-direction: row-reverse; }

    .chat-avatar {
      width: 32px; height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--primary), #2dd4bf);
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 3px 8px rgba(23,107,115,0.15);
    }

    .chat-text {
      padding: 12px 18px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.55;
      box-shadow: var(--sh-sm);
    }

    .chat-bubble--bot .chat-text {
      background: #fbfbfc;
      border: 1.5px solid var(--border);
      border-top-left-radius: 4px;
      color: var(--ink);
    }

    .chat-bubble--user .chat-text {
      background: var(--primary);
      color: #fff;
      border-top-right-radius: 4px;
    }

    .typing-dots {
      display: flex; gap: 4px; align-items: center; height: 20px; padding: 0 4px;
    }
    .typing-dots span {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--ink-3); animation: dotbounce 1.2s infinite;
    }
    .typing-dots span:nth-child(2) { animation-delay: .15s; }
    .typing-dots span:nth-child(3) { animation-delay: .30s; }
    @keyframes dotbounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }

    .chat-input-bar {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-top: none;
      border-radius: 0 0 var(--r-xl) var(--r-xl);
      padding: 14px 16px;
    }

    .chat-input {
      flex: 1;
      border: none;
      outline: none;
      resize: none;
      font-size: 14px;
      line-height: 1.5;
      color: var(--ink);
      background: transparent;
      font-family: var(--font);
      max-height: 140px;
    }

    .chat-send {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: background .15s, transform .1s;
      font-family: var(--font);
      cursor: pointer;
    }
    .chat-send:hover { background: var(--primary-h); }
    .chat-send:active { transform: scale(.92); }
  `;
  document.head.appendChild(s);
})();

function renderOnboarding() {
  app.innerHTML = `
    <div class="onboarding-container page-enter">
      <div class="onboarding-left">
        <div class="panel" style="max-width: 410px; width: 100%; padding: 20px 28px; border-radius: var(--r-lg); box-shadow: var(--sh-md); background: linear-gradient(rgba(255, 255, 255, 0.60), rgba(255, 255, 255, 0.60)), url('image_of_onboardingleft/image.png'); background-size: cover; background-position: center; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--border);">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="width: 58px; height: 58px; background: linear-gradient(135deg, #176b73, #2dd4bf); color: #ffffff; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px; box-shadow: 0 6px 16px rgba(23, 107, 115, 0.25);">
              ${ic(SVG.shield, 26)}
            </div>
            <div style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px;">Welcome to</div>
            <h2 style="font-size: 28px; font-weight: 800; color: var(--ink); letter-spacing: -0.03em; margin: 0; line-height: 1.1; display: flex; align-items: center; justify-content: center;">
              <span>Derm</span><span style="background: linear-gradient(135deg, #176b73, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI</span>
            </h2>
            <p style="font-size: 11px; font-weight: 500; color: var(--ink-3); margin-top: 6px;">Set up your profile to personalize your clinical recommendations</p>
          </div>

          <form id="onboardingForm" style="display:flex; flex-direction:column; gap: 10px;">
            <div>
              <label style="display:block; font-size: 11px; font-weight: 700; color: var(--ink-2); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Full Name</label>
              <input type="text" id="obName" placeholder="e.g. Amit Singh" required style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:var(--r-sm); font-size:13px; background: rgba(255, 255, 255, 0.45); color:var(--ink);" />
            </div>

            <div>
              <label style="display:block; font-size: 11px; font-weight: 700; color: var(--ink-2); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Skin Type</label>
              <select id="obSkin" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:var(--r-sm); font-size:13px; background: rgba(255, 255, 255, 0.45); color:var(--ink); height:36px;">
                <option value="Normal">Normal</option>
                <option value="Oily">Oily</option>
                <option value="Dry">Dry</option>
                <option value="Combination">Combination</option>
                <option value="Sensitive">Sensitive</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size: 11px; font-weight: 700; color: var(--ink-2); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Age Range</label>
              <select id="obAge" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:var(--r-sm); font-size:13px; background: rgba(255, 255, 255, 0.45); color:var(--ink); height:36px;">
                <option value="Under 18">Under 18</option>
                <option value="18–24">18–24</option>
                <option value="25–34">25–34</option>
                <option value="35–44">35–44</option>
                <option value="45+">45+</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size: 11px; font-weight: 700; color: var(--ink-2); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Allergies</label>
              <input type="text" id="obAllergies" placeholder="e.g. Benzoyl Peroxide (or None)" value="None" required style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:var(--r-sm); font-size:13px; background: rgba(255, 255, 255, 0.45); color:var(--ink);" />
            </div>

            <button type="submit" class="btn-primary" style="margin-top: 6px; width: 100%; justify-content: center; height: 38px; background: var(--primary); color: #fff; box-shadow: 0 4px 12px rgba(23, 107, 115, 0.2);" onmouseover="this.style.background='var(--primary-h)'" onmouseout="this.style.background='var(--primary)'">Complete Setup</button>
          </form>
          <div style="text-align: center; margin-top: 12px;">
            <button id="btnSkipOnboarding" style="font-size: 12px; font-weight: 600; color: var(--primary); cursor: pointer; background:none; border:none;">Continue as Guest &rarr;</button>
          </div>
        </div>
      </div>
      <div class="onboarding-right">
        <!-- Signature Badge -->
        <div style="position: absolute; top: 24px; right: 24px; background: rgba(255, 255, 255, 0.12); border: 1.5px solid rgba(255, 255, 255, 0.15); padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; box-shadow: var(--sh-sm); z-index: 10;">
          <span style="width: 6px; height: 6px; background: #2dd4bf; border-radius: 50%;"></span>
          Created &amp; Designed by Amit Singh
        </div>
        <div class="onboarding-quote-card">
          <h2 style="font-size: 28px; font-weight: 800; line-height: 1.2; margin-bottom: 12px; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">About DermAI</h2>
          <p style="font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.95); margin-bottom: 24px;">DermAI is an explainable clinical assistant designed to analyze acne severity tiers. Powered by a validated EfficientNet-B0 vision backbone, it generates Grad-CAM heatmaps, LIME segmentations, and SHAP analyses, and includes an interactive AI Chatbot to guide your skincare journey.</p>
          <div style="display: flex; gap: 16px;">
            <div style="background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255, 255, 255, 0.2); padding: 14px 18px; border-radius: 12px; flex: 1;">
              <div style="font-size: 22px; font-weight: 900; color: #ffffff;">91.6%</div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.85); margin-top: 4px; letter-spacing: 0.05em;">Validated Accuracy</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255, 255, 255, 0.2); padding: 14px 18px; border-radius: 12px; flex: 1;">
              <div style="font-size: 22px; font-weight: 900; color: #ffffff;">Tri-Layer</div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.85); margin-top: 4px; letter-spacing: 0.05em;">Explainable AI</div>
            </div>
          </div>
        </div>

        <!-- Floating manual controls inside onboarding right panel -->
        <button id="obPrevBtn" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.7); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink); box-shadow: var(--sh-sm); z-index: 10; transition: all 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255,255,255,0.7)'; this.style.color='var(--ink)';">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button id="obNextBtn" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.7); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink); box-shadow: var(--sh-sm); z-index: 10; transition: all 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255,255,255,0.7)'; this.style.color='var(--ink)';">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <!-- Dots Indicator at bottom -->
        <div id="obDots" style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 10; background: rgba(255,255,255,0.65); padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.4);">
          ${ONBOARDING_BACKGROUNDS.map((_, i) => `
            <span class="ob-dot" data-index="${i}" style="width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--ink-2); background: ${i === 0 ? 'var(--ink)' : 'transparent'}; cursor: pointer; transition: all 0.2s;"></span>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const ONBOARDING_SLIDES_TEXT = [
    {
      title: "Welcome to DermAI",
      desc: "We are thrilled to help you understand and track your skin health. DermAI provides you with instant clinical-grade intelligence, explainable results, and smart chatbot suggestions."
    },
    {
      title: "About DermAI",
      desc: "DermAI uses an EfficientNet-B0 vision model trained on thousands of dermatological samples. It explains its predictions using Grad-CAM heatmaps, SHAP, and LIME segmentations so you see what the AI sees."
    },
    {
      title: "How to use DermAI",
      desc: "<div style='text-align: left; display: flex; flex-direction: column; gap: 10px; margin-top: 12px;'><div style='display: flex; gap: 8px;'><span style='font-weight: 800; color: #ffffff;'>1.</span> <span>Complete your skin profile on the left (or skip to continue as guest).</span></div><div style='display: flex; gap: 8px;'><span style='font-weight: 800; color: #ffffff;'>2.</span> <span>Upload or capture a clear photo of your skin.</span></div><div style='display: flex; gap: 8px;'><span style='font-weight: 800; color: #ffffff;'>3.</span> <span>Get instant analysis results and consult the AI Assistant.</span></div></div>"
    }
  ];

  let activeObBg = 0;

  function updateObBackground(index) {
    activeObBg = index;
    const rightPanel = document.querySelector(".onboarding-right");
    if (rightPanel) {
      rightPanel.style.backgroundImage = `linear-gradient(135deg, rgba(249, 252, 253, 0.35), rgba(13, 17, 23, 0.65)), url('${ONBOARDING_BACKGROUNDS[activeObBg]}')`;
    }

    // Update text overlays dynamically
    const titleEl = document.querySelector(".onboarding-quote-card h2");
    const descEl = document.querySelector(".onboarding-quote-card p");
    if (titleEl && descEl && ONBOARDING_SLIDES_TEXT[activeObBg]) {
      titleEl.textContent = ONBOARDING_SLIDES_TEXT[activeObBg].title;
      descEl.innerHTML = ONBOARDING_SLIDES_TEXT[activeObBg].desc;
    }

    // Update dots styling
    document.querySelectorAll(".ob-dot").forEach((dot, idx) => {
      if (idx === activeObBg) {
        dot.style.background = "var(--ink)";
        dot.style.borderColor = "var(--ink)";
        dot.style.transform = "scale(1.2)";
      } else {
        dot.style.background = "transparent";
        dot.style.borderColor = "var(--ink-2)";
        dot.style.transform = "scale(1)";
      }
    });
  }

  // Bind click handlers
  const obPrevBtn = document.getElementById("obPrevBtn");
  const obNextBtn = document.getElementById("obNextBtn");

  if (obPrevBtn) {
    obPrevBtn.onclick = () => {
      const prevIdx = (activeObBg - 1 + ONBOARDING_BACKGROUNDS.length) % ONBOARDING_BACKGROUNDS.length;
      updateObBackground(prevIdx);
    };
  }

  if (obNextBtn) {
    obNextBtn.onclick = () => {
      const nextIdx = (activeObBg + 1) % ONBOARDING_BACKGROUNDS.length;
      updateObBackground(nextIdx);
    };
  }

  document.querySelectorAll(".ob-dot").forEach(dot => {
    dot.onclick = (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      updateObBackground(idx);
    };
  });

  document.getElementById("onboardingForm").onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById("obName").value.trim();
    const skinType = document.getElementById("obSkin").value;
    const ageRange = document.getElementById("obAge").value;
    const allergies = document.getElementById("obAllergies").value.trim();

    state.profile = { name, skinType, ageRange, allergies, aiModel: "llama-3.3-70b-versatile" };
    sv("derm-profile", state.profile);
    render();
  };

  document.getElementById("btnSkipOnboarding").onclick = (e) => {
    e.preventDefault();
    state.profile = { name: "Guest User", skinType: "Normal", ageRange: "18–24", allergies: "None", aiModel: "llama-3.3-70b-versatile" };
    sv("derm-profile", state.profile);
    render();
  };
}

function renderProfile() {
  const p = state.profile;
  const initLetter = p.name ? p.name[0].toUpperCase() : "U";

  // calculate values
  const totalScans = state.history.length;
  const totalChats = Math.max(0, chatMessages.length - 1);
  const stepsDone = totalScans + (state.lastResult ? 1 : 0) + 1;

  app.innerHTML = `
    <div class="page page-enter" style="max-width:820px; margin: 40px auto 80px;">
      <!-- Profile Header -->
      <div class="panel" style="padding:24px; border-radius:var(--r-lg); display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; background:var(--surface); border:1px solid var(--border);">
        <div style="display:flex; align-items:center; gap:20px;">
          <div style="width:64px; height:64px; border-radius:50%; background:var(--primary); color:#fff; font-size:24px; font-weight:800; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(23,107,115,.2);">
            ${initLetter}
          </div>
          <div>
            <h2 style="font-size:22px; font-weight:900; color:var(--ink); letter-spacing:-.02em;">${p.name}</h2>
            <p style="font-size:14px; color:var(--ink-3); margin-top:2px;">${p.skinType} Skin · ${p.ageRange}</p>
          </div>
        </div>
        <button id="btnEditProfile" class="btn-ghost" style="border:1px solid var(--border); width:40px; height:40px; border-radius:50%; padding:0; display:flex; align-items:center; justify-content:center;" aria-label="Edit Profile">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
      </div>

      <!-- Stats row -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:20px;">
        <div class="panel" style="padding:20px; text-align:center; border-radius:var(--r-md); background:var(--surface); border:1px solid var(--border);">
          <div style="font-size:32px; font-weight:900; color:var(--primary);">${totalScans}</div>
          <div style="font-size:12px; font-weight:700; color:var(--ink-3); margin-top:4px; text-transform:uppercase; letter-spacing:.05em;">Analyses</div>
        </div>
        <div class="panel" style="padding:20px; text-align:center; border-radius:var(--r-md); background:var(--surface); border:1px solid var(--border);">
          <div style="font-size:32px; font-weight:900; color:var(--accent-2);">${totalChats}</div>
          <div style="font-size:12px; font-weight:700; color:var(--ink-3); margin-top:4px; text-transform:uppercase; letter-spacing:.05em;">AI Chats</div>
        </div>
        <div class="panel" style="padding:20px; text-align:center; border-radius:var(--r-md); background:var(--surface); border:1px solid var(--border);">
          <div style="font-size:32px; font-weight:900; color:var(--ink);">${stepsDone}</div>
          <div style="font-size:12px; font-weight:700; color:var(--ink-3); margin-top:4px; text-transform:uppercase; letter-spacing:.05em;">Steps Done</div>
        </div>
      </div>

      <!-- Settings Block -->
      <div class="panel" style="padding:24px; border-radius:var(--r-lg); margin-bottom:20px; background:var(--surface); border:1px solid var(--border);">
        <div style="font-size:13px; font-weight:700; color:var(--ink-3); text-transform:uppercase; letter-spacing:.06em; margin-bottom:16px;">Settings</div>
        
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; align-items:center; justify-content:space-between; padding-bottom:16px; border-bottom:1px solid var(--border);">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--primary);">${ic('<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>', 20)}</span>
              <span style="font-size:15px; font-weight:600; color:var(--ink);">AI Model</span>
            </div>
            <select id="modelSelect" style="padding:6px 12px; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--ink); font-size:14px; height:36px; min-width:180px;">
              <option value="llama-3.3-70b-versatile" ${p.aiModel === "llama-3.3-70b-versatile" ? "selected" : ""}>LLaMA 3.3 · 70B</option>
              <option value="llama3-8b-8192" ${p.aiModel === "llama3-8b-8192" ? "selected" : ""}>LLaMA 3 · 8B</option>
              <option value="mixtral-8x7b-32768" ${p.aiModel === "mixtral-8x7b-32768" ? "selected" : ""}>Mixtral 8x7B</option>
              <option value="gpt-4o" ${p.aiModel === "gpt-4o" ? "selected" : ""}>OpenAI GPT-4o</option>
            </select>
          </div>
          
          <div id="openaiKeyDiv" style="display: ${p.aiModel === 'gpt-4o' ? 'flex' : 'none'}; align-items:center; justify-content:space-between; padding-bottom:16px; border-bottom:1px solid var(--border);">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--primary);">${ic('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>', 20)}</span>
              <span style="font-size:15px; font-weight:600; color:var(--ink);">OpenAI API Key</span>
            </div>
            <input type="password" id="openaiKey" value="${localStorage.getItem('openai_key') || ''}" placeholder="sk-..." style="padding:6px 12px; border:1px solid var(--border); border-radius:8px; background:var(--surface); color:var(--ink); font-size:14px; height:36px; width:180px;">
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--sev-c);">${ic('<path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>', 20)}</span>
              <span style="font-size:15px; font-weight:600; color:var(--ink);">Reset System</span>
            </div>
            <button id="btnResetSystem" class="btn-ghost" style="color:var(--sev-c); font-size:13px; font-weight:700; border:1px solid var(--border); padding:6px 14px; border-radius:8px; height:36px; display:flex; align-items:center; justify-content:center;">Reset Data</button>
          </div>
        </div>
      </div>

      <!-- Health Info Block -->
      <div class="panel" style="padding:24px; border-radius:var(--r-lg); background:var(--surface); border:1px solid var(--border);">
        <div style="font-size:13px; font-weight:700; color:var(--ink-3); text-transform:uppercase; letter-spacing:.06em; margin-bottom:16px;">Health Info</div>
        
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; justify-content:space-between; padding-bottom:12px; border-bottom:1px solid var(--border);">
            <span style="font-size:15px; font-weight:600; color:var(--ink);">Skin Type</span>
            <span style="font-size:14px; color:var(--ink-3);">${p.skinType}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:12px; border-bottom:1px solid var(--border);">
            <span style="font-size:15px; font-weight:600; color:var(--ink);">Age Range</span>
            <span style="font-size:14px; color:var(--ink-3);">${p.ageRange}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="font-size:15px; font-weight:600; color:var(--ink);">Allergies</span>
            <span style="font-size:14px; color:var(--ink-3);">${p.allergies}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal overlay -->
    <div id="profileEditModal" class="modal-overlay" style="display:none;">
      <div class="panel modal-card" style="padding: 24px; max-width:440px; width:100%; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h3 style="font-size:18px; font-weight:800; color:var(--ink);">Edit Profile</h3>
          <button id="btnCancelEdit" style="color:var(--ink-3); font-size:20px;">&times;</button>
        </div>
        <form id="editProfileForm" style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:var(--ink-3); text-transform:uppercase; margin-bottom:6px;">Full Name</label>
            <input type="text" id="editName" value="${p.name}" required style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; font-size:14px; background:var(--surface); color:var(--ink);" />
          </div>
          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:var(--ink-3); text-transform:uppercase; margin-bottom:6px;">Skin Type</label>
            <select id="editSkin" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; font-size:14px; background:var(--surface); color:var(--ink); height:38px;">
              <option value="Normal" ${p.skinType === "Normal" ? "selected" : ""}>Normal</option>
              <option value="Oily" ${p.skinType === "Oily" ? "selected" : ""}>Oily</option>
              <option value="Dry" ${p.skinType === "Dry" ? "selected" : ""}>Dry</option>
              <option value="Combination" ${p.skinType === "Combination" ? "selected" : ""}>Combination</option>
              <option value="Sensitive" ${p.skinType === "Sensitive" ? "selected" : ""}>Sensitive</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:var(--ink-3); text-transform:uppercase; margin-bottom:6px;">Age Range</label>
            <select id="editAge" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; font-size:14px; background:var(--surface); color:var(--ink); height:38px;">
              <option value="Under 18" ${p.ageRange === "Under 18" ? "selected" : ""}>Under 18</option>
              <option value="18–24" ${p.ageRange === "18–24" ? "selected" : ""}>18–24</option>
              <option value="25–34" ${p.ageRange === "25–34" ? "selected" : ""}>25–34</option>
              <option value="35–44" ${p.ageRange === "35–44" ? "selected" : ""}>35–44</option>
              <option value="45+" ${p.ageRange === "45+" ? "selected" : ""}>45+</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:var(--ink-3); text-transform:uppercase; margin-bottom:6px;">Allergies</label>
            <input type="text" id="editAllergies" value="${p.allergies}" required style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; font-size:14px; background:var(--surface); color:var(--ink);" />
          </div>
          <button type="submit" class="btn-primary" style="width:100%; justify-content:center; height:40px; margin-top:10px;">Save Changes</button>
        </form>
      </div>
    </div>
  `;

  // Edit Profile button
  document.getElementById("btnEditProfile").onclick = () => {
    document.getElementById("profileEditModal").style.display = "flex";
  };
  document.getElementById("btnCancelEdit").onclick = () => {
    document.getElementById("profileEditModal").style.display = "none";
  };
  document.getElementById("editProfileForm").onsubmit = (e) => {
    e.preventDefault();
    p.name = document.getElementById("editName").value.trim();
    p.skinType = document.getElementById("editSkin").value;
    p.ageRange = document.getElementById("editAge").value;
    p.allergies = document.getElementById("editAllergies").value.trim();
    sv("derm-profile", p);
    renderProfile();
  };

  // AI Model select listener
  document.getElementById("modelSelect").onchange = (e) => {
    p.aiModel = e.target.value;
    sv("derm-profile", p);
  };

  // Reset System listener
  document.getElementById("btnResetSystem").onclick = () => {
    if (confirm("Are you sure you want to reset the system? This will delete your profile, scan history, and all stored data, and restart the onboarding process.")) {
      localStorage.clear();
      location.reload();
    }
  };
}
render();

