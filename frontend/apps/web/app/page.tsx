import Link from "next/link";

export default function Home() {
  return (
    <main className="lp-root">

      {/* ── 1. HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge">🟢 Now delivering in Bodhan</div>
          <h1 className="lp-title">
            Order Groceries from<br />
            <span className="lp-title-accent">Panchavati Mega Mart</span>
          </h1>
          <p className="lp-subtitle">
            Fresh groceries delivered to your doorstep — right here in Bodhan.
          </p>
          <Link href="/shop" className="lp-cta-btn">
            Start Shopping →
          </Link>
        </div>
        <div className="lp-hero-img" aria-hidden="true">
          <div className="lp-grocery-visual">
            <span className="lp-food-emoji" style={{ animationDelay: "0s" }}>🥦</span>
            <span className="lp-food-emoji" style={{ animationDelay: "0.3s" }}>🥛</span>
            <span className="lp-food-emoji" style={{ animationDelay: "0.6s" }}>🍅</span>
            <span className="lp-food-emoji" style={{ animationDelay: "0.9s" }}>🌾</span>
            <span className="lp-food-emoji" style={{ animationDelay: "1.2s" }}>🧹</span>
            <span className="lp-food-emoji" style={{ animationDelay: "1.5s" }}>🧅</span>
          </div>
        </div>
      </section>

      {/* ── 2. CATEGORIES ── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-section-label">Browse by category</p>
          <h2 className="lp-section-title">Everything you need, in one place</h2>
          <div className="lp-cats-grid">
            {[
              { icon: "🥬", name: "Vegetables", desc: "Farm-fresh daily arrivals" },
              { icon: "🥛", name: "Dairy", desc: "Milk, curd, paneer & more" },
              { icon: "🌾", name: "Staples", desc: "Rice, dal, flour & oils" },
              { icon: "🧹", name: "Household", desc: "Cleaning & daily essentials" },
            ].map((cat) => (
              <Link href="/shop" key={cat.name} className="lp-cat-card">
                <span className="lp-cat-icon">{cat.icon}</span>
                <div>
                  <div className="lp-cat-name">{cat.name}</div>
                  <div className="lp-cat-desc">{cat.desc}</div>
                </div>
                <span className="lp-cat-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. DELIVERY INFO ── */}
      <section className="lp-delivery-section">
        <div className="lp-section-inner">
          <div className="lp-delivery-grid">
            <div className="lp-delivery-text">
              <p className="lp-section-label">Delivery</p>
              <h2 className="lp-section-title" style={{ marginBottom: "16px" }}>
                Delivered to your door<br />in Bodhan
              </h2>
              <ul className="lp-delivery-list">
                <li>✅ Delivery available across Bodhan</li>
                <li>✅ Same-day delivery on most orders</li>
                <li>✅ Real-time order tracking</li>
                <li>✅ Minimum order amount: Rs. 200</li>
              </ul>
              <Link href="/shop" className="lp-cta-btn" style={{ marginTop: "24px", display: "inline-flex" }}>
                Order Now
              </Link>
            </div>
            <div className="lp-delivery-card">
              <div className="lp-dc-header">
                <span className="lp-dc-icon">📦</span>
                <div>
                  <div className="lp-dc-title">Your order is on its way!</div>
                  <div className="lp-dc-sub">Estimated: ~25 minutes</div>
                </div>
              </div>
              <div className="lp-dc-progress">
                <div className="lp-dc-step lp-dc-done">✓ Order placed</div>
                <div className="lp-dc-line lp-dc-line-done" />
                <div className="lp-dc-step lp-dc-done">✓ Packed</div>
                <div className="lp-dc-line lp-dc-line-done" />
                <div className="lp-dc-step lp-dc-active">🚴 On the way</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. AI FEATURE ── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-ai-card">
            <div className="lp-ai-left">
              <span className="lp-ai-spark">✨</span>
              <p className="lp-section-label" style={{ color: "#7c3aed", marginBottom: "8px" }}>AI Grocery Generator</p>
              <h2 className="lp-section-title" style={{ marginBottom: "12px", fontSize: "clamp(22px,3vw,34px)" }}>
                Tell us what you want to cook — we'll add everything to your cart
              </h2>
              <p className="lp-ai-sub">
                Just type a dish like "dal tadka for 4" and our AI instantly adds all the ingredients you need. No more forgetting items!
              </p>
              <Link href="/ai" className="lp-ai-btn">
                Try AI Grocery →
              </Link>
            </div>
            <div className="lp-ai-right">
              <div className="lp-ai-demo">
                <div className="lp-ai-bubble">Make dal tadka for 4 people 🍲</div>
                <div className="lp-ai-tags">
                  {["Toor Dal", "Tomatoes", "Onion", "Garlic", "Ghee", "Turmeric", "Red Chilli"].map(t => (
                    <span key={t} className="lp-ai-tag">{t}</span>
                  ))}
                </div>
                <div className="lp-ai-added">✓ 7 items added to cart</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. TRUST SECTION ── */}
      <section className="lp-trust-section">
        <div className="lp-section-inner">
          <p className="lp-section-label" style={{ textAlign: "center" }}>Why shop with us</p>
          <h2 className="lp-section-title" style={{ textAlign: "center" }}>
            Bodhan's most trusted grocery store
          </h2>
          <div className="lp-trust-grid">
            {[
              { icon: "🏪", title: "Local store you trust", desc: "Panchavati Mega Mart has been serving Bodhan for years. Your neighbour's favourite grocery store." },
              { icon: "💰", title: "Best prices in town", desc: "We match local market prices. No hidden charges, no surprise fees — just honest prices." },
              { icon: "🥬", title: "Fresh products daily", desc: "Vegetables sourced fresh every morning. Dairy products delivered directly from local suppliers." },
            ].map((item) => (
              <div key={item.title} className="lp-trust-card">
                <span className="lp-trust-icon">{item.icon}</span>
                <h3 className="lp-trust-title">{item.title}</h3>
                <p className="lp-trust-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="lp-footer-cta">
        <div className="lp-fca-inner">
          <h2 className="lp-fca-title">Ready to order?</h2>
          <p className="lp-fca-sub">Join hundreds of families in Bodhan who order from Panchavati Mega Mart every week.</p>
          <Link href="/shop" className="lp-cta-btn lp-cta-white">
            Browse Products →
          </Link>
        </div>
      </section>

    </main>
  );
}
