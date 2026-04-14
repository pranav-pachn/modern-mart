import Link from "next/link";

const features = [
  {
    icon: "🌿",
    title: "Farm-Fresh Produce",
    desc: "Handpicked fruits, vegetables, and dairy sourced directly from local farms — delivered the same day.",
    color: "from-emerald-400/20 to-teal-400/10",
    border: "border-emerald-200/60",
  },
  {
    icon: "✨",
    title: "AI Grocery Generator",
    desc: "Tell us what you're cooking. Our AI builds your complete grocery list in seconds — no guesswork.",
    color: "from-violet-400/20 to-purple-400/10",
    border: "border-violet-200/60",
  },
  {
    icon: "⚡",
    title: "Lightning-Fast Delivery",
    desc: "Order before noon, receive by 6 PM. We cover every corner of Bodhan with zero delivery hassle.",
    color: "from-amber-400/20 to-orange-400/10",
    border: "border-amber-200/60",
  },
];

const steps = [
  { num: "01", title: "Browse or describe", desc: "Search the shop or let AI generate your grocery list from a recipe or meal plan." },
  { num: "02", title: "Add to cart & pay", desc: "Choose cash on delivery or pay online instantly — 100% secure checkout." },
  { num: "03", title: "Sit back & relax", desc: "We pack and deliver your order fresh to your doorstep, on time, every time." },
];

const testimonials = [
  { name: "Meera K.", role: "Working professional", quote: "I used to spend 45 minutes at the market every weekend. Now I order in 3 minutes and get everything delivered fresh.", avatar: "M" },
  { name: "Ravi S.", role: "Home chef", quote: "The AI grocery list feature is a game-changer. I type my recipe and my full shopping list appears instantly.", avatar: "R" },
  { name: "Anitha P.", role: "Mother of two", quote: "Quality is consistently excellent. The produce is always fresh and the delivery is always on time.", avatar: "A" },
];

export default function LandingPage() {
  return (
    <div className="landing-root">
      {/* ───────────── HERO ───────────── */}
      <section className="hero-section">
        <div className="hero-blobs">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Now delivering across Bodhan
          </div>

          <h1 className="hero-title">
            Groceries,{" "}
            <span className="hero-title-accent">fresh & fast</span>
            <br />
            right to your door.
          </h1>

          <p className="hero-sub">
            Panchavati Mart brings you farm-fresh produce, daily essentials,
            and AI-powered grocery lists — all delivered in Bodhan.
          </p>

          <div className="hero-actions">
            <Link href="/shop" className="btn-primary">
              Shop Now
              <span className="btn-arrow">→</span>
            </Link>
            <Link href="/login" className="btn-secondary">
              <span className="google-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              </span>
              Sign in with Google
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">500+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">2h</span>
              <span className="stat-label">Avg delivery</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">4.9★</span>
              <span className="stat-label">Rating</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card card-main">
            <div className="vc-header">
              <span className="vc-emoji">🛒</span>
              <div>
                <p className="vc-title">Your Cart</p>
                <p className="vc-sub">3 items · Rs. 245</p>
              </div>
            </div>
            {[
              { e: "🍅", n: "Fresh Tomatoes", p: "Rs. 45" },
              { e: "🥛", n: "Amul Taaza Milk", p: "Rs. 58" },
              { e: "🍞", n: "Whole Wheat Bread", p: "Rs. 38" },
            ].map((item) => (
              <div key={item.n} className="vc-item">
                <span className="vc-item-emoji">{item.e}</span>
                <span className="vc-item-name">{item.n}</span>
                <span className="vc-item-price">{item.p}</span>
              </div>
            ))}
            <div className="vc-checkout">Checkout →</div>
          </div>

          <div className="visual-card card-ai">
            <span className="ai-spark">✨</span>
            <p className="ai-label">AI Grocery Generator</p>
            <p className="ai-query">"Make dal tadka for 4..."</p>
            <div className="ai-tags">
              {["Toor dal", "Tomatoes", "Onion", "Ghee", "Spices"].map((t) => (
                <span key={t} className="ai-tag">{t}</span>
              ))}
            </div>
          </div>

          <div className="visual-card card-delivery">
            <span className="del-icon">🚴</span>
            <div>
              <p className="del-title">On the way!</p>
              <p className="del-sub">Arrives in ~25 min</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── FEATURES ───────────── */}
      <section className="section features-section">
        <div className="section-label">Why Panchavati Mart</div>
        <h2 className="section-title">Everything you need,<br />nothing you don't.</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className={`feature-card bg-gradient-to-br ${f.color} border ${f.border}`}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="section how-section">
        <div className="section-label">Simple Process</div>
        <h2 className="section-title">3 steps to fresh groceries.</h2>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              {i < steps.length - 1 && <div className="step-connector" />}
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── TESTIMONIALS ───────────── */}
      <section className="section testimonials-section">
        <div className="section-label">Loved in Bodhan</div>
        <h2 className="section-title">Real customers, real stories.</h2>
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <div key={t.name} className="testimonial-card">
              <div className="quote-icon">"</div>
              <p className="testimonial-quote">{t.quote}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.avatar}</div>
                <div>
                  <p className="author-name">{t.name}</p>
                  <p className="author-role">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div className="cta-content">
          <h2 className="cta-title">Ready for fresh groceries<br />delivered to your door?</h2>
          <p className="cta-sub">Join hundreds of happy families in Bodhan. Sign in to get started.</p>
          <div className="cta-actions">
            <Link href="/login" className="btn-primary btn-lg">
              Get Started — It&apos;s Free
              <span className="btn-arrow">→</span>
            </Link>
            <Link href="/shop" className="btn-ghost">
              Browse without signing in
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🛒</span>
            <span className="footer-name">Panchavati Mart</span>
          </div>
          <p className="footer-tagline">Fresh groceries, delivered in Bodhan.</p>
          <div className="footer-links">
            <Link href="/shop">Shop</Link>
            <Link href="/ai">AI Generator</Link>
            <Link href="/cart">Cart</Link>
          </div>
          <p className="footer-copy">© 2025 Panchavati Mart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
