import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getDatabaseStatus() {
  try {
    const client = await clientPromise;

    await client.db().admin().ping();

    return {
      connected: true,
      database: client.db().databaseName,
      error: "",
    };
  } catch (error) {
    console.error("MongoDB connection check failed", error);

    return {
      connected: false,
      database: "",
      error: "Unable to connect to MongoDB.",
    };
  }
}

export default async function HomePage() {
  const status = await getDatabaseStatus();

  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: "48px 24px", maxWidth: 900, margin: "0 auto" }}>
      <p style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", color: "#0f766e", fontWeight: 700 }}>
        Supermart Backend
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.05, margin: "12px 0 16px", color: "#111827" }}>
        Backend root is live
      </h1>
      <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#4b5563", maxWidth: 700 }}>
        This endpoint now serves a real page instead of a 404 and checks MongoDB on every request.
      </p>

      <section
        style={{
          marginTop: 32,
          border: "1px solid #e5e7eb",
          borderRadius: 20,
          padding: 24,
          background: "#ffffff",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 12px", fontSize: "1.25rem", color: "#111827" }}>Database status</h2>
        <p style={{ margin: 0, fontSize: "1rem", color: status.connected ? "#047857" : "#b91c1c", fontWeight: 700 }}>
          {status.connected ? `Connected to ${status.database}` : status.error}
        </p>
        <p style={{ margin: "10px 0 0", color: "#6b7280" }}>
          Health endpoint: <a href="/api/health/db">/api/health/db</a>
        </p>
        <p style={{ margin: "8px 0 0", color: "#6b7280" }}>
          API endpoints: <a href="/api/products">/api/products</a> and <a href="/api/orders">/api/orders</a>
        </p>
      </section>
    </main>
  );
}