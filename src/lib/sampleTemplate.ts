export const SAMPLE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Acme Co — Build Better Products</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #111; background: #fff; line-height: 1.6; }

    /* ── Nav ── */
    nav {
      position: sticky; top: 0; z-index: 100;
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 48px; height: 72px;
      background: rgba(255,255,255,0.96); backdrop-filter: blur(10px);
      border-bottom: 1px solid #f0f0f0;
    }
    .nav-logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #0a0a0a; }
    .nav-links { display: flex; gap: 32px; list-style: none; }
    .nav-links a { text-decoration: none; color: #555; font-size: 14px; font-weight: 500; }
    .nav-links a:hover { color: #000; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 10px 22px; border-radius: 8px; font-size: 14px; font-weight: 600;
      cursor: pointer; text-decoration: none; border: none; transition: all 0.15s;
    }
    .btn-primary { background: #111; color: #fff; }
    .btn-primary:hover { background: #333; }
    .btn-outline { background: transparent; color: #111; border: 1.5px solid #ddd; }
    .btn-outline:hover { border-color: #111; }
    .btn-lg { padding: 14px 32px; font-size: 16px; border-radius: 10px; }

    /* ── Hero ── */
    .hero {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 120px 24px 80px;
      background: linear-gradient(155deg, #f9fafb 0%, #eef2ff 100%);
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 16px; background: #eef2ff; color: #6366f1;
      border-radius: 100px; font-size: 13px; font-weight: 600; margin-bottom: 28px;
    }
    .hero h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: clamp(40px, 7vw, 72px); font-weight: 900;
      line-height: 1.05; letter-spacing: -2px;
      max-width: 840px; color: #0a0a0a;
    }
    .hero h1 em { font-style: italic; color: #6366f1; }
    .hero-sub {
      font-size: 18px; color: #555; max-width: 520px;
      margin: 24px auto 40px; line-height: 1.75;
    }
    .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .hero-visual {
      margin-top: 64px; width: 100%; max-width: 900px; height: 380px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.85); font-size: 17px; font-weight: 500;
      box-shadow: 0 40px 80px -20px rgba(99,102,241,0.35);
    }

    /* ── Social proof ── */
    .logos-bar { text-align: center; padding: 40px 24px; border-bottom: 1px solid #f0f0f0; }
    .logos-bar p { font-size: 12px; color: #aaa; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; }
    .logos { display: flex; justify-content: center; align-items: center; gap: 48px; flex-wrap: wrap; }
    .logo-item { font-size: 18px; font-weight: 800; color: #ccc; letter-spacing: -0.5px; }

    /* ── Features ── */
    .section { padding: 96px 48px; max-width: 1160px; margin: 0 auto; }
    .section-eyebrow { font-size: 12px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; }
    .section-heading {
      font-size: clamp(28px, 4vw, 42px); font-weight: 800;
      letter-spacing: -1px; color: #0a0a0a; max-width: 560px; line-height: 1.15; margin-bottom: 56px;
    }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
    .feature-card {
      padding: 28px; background: #fafafa;
      border-radius: 14px; border: 1px solid #f0f0f0;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .feature-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
    .feature-icon {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #eef2ff, #e0e7ff);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      font-size: 20px; margin-bottom: 16px;
    }
    .feature-card h3 { font-size: 16px; font-weight: 700; color: #0a0a0a; margin-bottom: 8px; }
    .feature-card p { font-size: 14px; color: #666; line-height: 1.65; }

    /* ── Stats ── */
    .stats { background: #0a0a0a; color: #fff; padding: 80px 48px; text-align: center; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 48px; max-width: 760px; margin: 0 auto; }
    .stat-number { font-size: 52px; font-weight: 800; letter-spacing: -2px; }
    .stat-label { font-size: 14px; color: #777; margin-top: 6px; }

    /* ── Testimonials ── */
    .testimonials { padding: 96px 48px; background: #f9fafb; }
    .testimonials-inner { max-width: 1100px; margin: 0 auto; }
    .testi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 56px; }
    .testi-card {
      background: #fff; border-radius: 14px; padding: 28px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04);
    }
    .stars { color: #f59e0b; font-size: 15px; margin-bottom: 12px; }
    .testi-card blockquote { font-size: 14px; color: #444; line-height: 1.7; margin-bottom: 20px; font-style: italic; }
    .testi-author { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 800; color: #fff; flex-shrink: 0;
    }
    .author-name { font-size: 14px; font-weight: 700; color: #111; }
    .author-role { font-size: 12px; color: #999; }

    /* ── CTA ── */
    .cta {
      padding: 120px 24px; text-align: center;
      background: linear-gradient(155deg, #eef2ff 0%, #f9fafb 100%);
    }
    .cta h2 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: clamp(32px, 5vw, 56px); font-weight: 900;
      letter-spacing: -1.5px; color: #0a0a0a;
      max-width: 600px; margin: 0 auto 20px; line-height: 1.1;
    }
    .cta p { font-size: 17px; color: #666; margin-bottom: 40px; }

    /* ── Footer ── */
    footer {
      padding: 36px 48px; border-top: 1px solid #f0f0f0;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
    }
    .footer-logo { font-size: 16px; font-weight: 800; color: #0a0a0a; }
    .footer-links { display: flex; gap: 24px; list-style: none; }
    .footer-links a { text-decoration: none; color: #999; font-size: 13px; }
    .footer-copy { font-size: 13px; color: #bbb; }
  </style>
</head>
<body>

  <!-- Navigation -->
  <nav>
    <div class="nav-logo">Acme Co</div>
    <ul class="nav-links">
      <li><a href="#">Product</a></li>
      <li><a href="#">Pricing</a></li>
      <li><a href="#">Blog</a></li>
      <li><a href="#">Docs</a></li>
    </ul>
    <div style="display:flex;gap:8px;">
      <a href="#" class="btn btn-outline">Log in</a>
      <a href="#" class="btn btn-primary">Get started</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="hero">
    <div class="hero-badge">✦ Now in public beta</div>
    <h1>Build better products,<br><em>ship faster</em></h1>
    <p class="hero-sub">The all-in-one platform that helps teams design, collaborate, and ship products customers love — without the friction.</p>
    <div class="hero-cta">
      <a href="#" class="btn btn-primary btn-lg">Start for free →</a>
      <a href="#" class="btn btn-outline btn-lg">Watch demo</a>
    </div>
    <div class="hero-visual">Your product screenshot goes here</div>
  </section>

  <!-- Logos -->
  <div class="logos-bar">
    <p>Trusted by teams at</p>
    <div class="logos">
      <span class="logo-item">Stripe</span>
      <span class="logo-item">Notion</span>
      <span class="logo-item">Linear</span>
      <span class="logo-item">Vercel</span>
      <span class="logo-item">Figma</span>
    </div>
  </div>

  <!-- Features -->
  <section class="section">
    <p class="section-eyebrow">Features</p>
    <h2 class="section-heading">Everything you need to move fast</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Lightning fast</h3>
        <p>Blazing performance out of the box. No configuration required — just ship and iterate.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Secure by default</h3>
        <p>Enterprise-grade security with end-to-end encryption and SOC 2 Type II compliance.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <h3>Beautiful design</h3>
        <p>Thoughtfully crafted components that look stunning out of the box, fully customisable.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔧</div>
        <h3>Fully customisable</h3>
        <p>Every pixel is yours to configure. Build your product your way, without any limits.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Built-in analytics</h3>
        <p>Deep insights into how users interact with your product, available in real time.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🚀</div>
        <h3>One-click deploy</h3>
        <p>Push to production in seconds. Automatic rollbacks if anything goes wrong.</p>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <div class="stats">
    <div class="stats-grid">
      <div><div class="stat-number">50K+</div><div class="stat-label">Happy teams</div></div>
      <div><div class="stat-number">99.9%</div><div class="stat-label">Uptime SLA</div></div>
      <div><div class="stat-number">10×</div><div class="stat-label">Faster shipping</div></div>
      <div><div class="stat-number">4.9★</div><div class="stat-label">Average rating</div></div>
    </div>
  </div>

  <!-- Testimonials -->
  <section class="testimonials">
    <div class="testimonials-inner">
      <p class="section-eyebrow">Testimonials</p>
      <h2 class="section-heading" style="max-width:100%;">What our customers say</h2>
      <div class="testi-grid">
        <div class="testi-card">
          <div class="stars">★★★★★</div>
          <blockquote>"Acme Co completely changed how our team ships. We went from two-week cycles to daily deploys. Absolutely incredible."</blockquote>
          <div class="testi-author">
            <div class="avatar" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">S</div>
            <div><div class="author-name">Sarah Chen</div><div class="author-role">CTO at Buildspace</div></div>
          </div>
        </div>
        <div class="testi-card">
          <div class="stars">★★★★★</div>
          <blockquote>"The best product investment we've made in years. ROI was visible within the first week of switching over."</blockquote>
          <div class="testi-author">
            <div class="avatar" style="background:linear-gradient(135deg,#f59e0b,#ef4444);">M</div>
            <div><div class="author-name">Marcus Rivera</div><div class="author-role">Head of Product at Pulse</div></div>
          </div>
        </div>
        <div class="testi-card">
          <div class="stars">★★★★★</div>
          <blockquote>"I've tried every tool out there. Nothing comes close to the simplicity and raw power Acme Co delivers."</blockquote>
          <div class="testi-author">
            <div class="avatar" style="background:linear-gradient(135deg,#10b981,#0ea5e9);">A</div>
            <div><div class="author-name">Aisha Okonkwo</div><div class="author-role">Founder at Flowly</div></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta">
    <h2>Ready to start building?</h2>
    <p>Join 50,000+ teams shipping better products with Acme Co.</p>
    <a href="#" class="btn btn-primary btn-lg">Get started for free →</a>
  </section>

  <!-- Footer -->
  <footer>
    <div class="footer-logo">Acme Co</div>
    <ul class="footer-links">
      <li><a href="#">Privacy</a></li>
      <li><a href="#">Terms</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
    <p class="footer-copy">© 2025 Acme Co. All rights reserved.</p>
  </footer>

</body>
</html>`
