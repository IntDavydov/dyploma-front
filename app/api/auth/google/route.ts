import { NextResponse } from "next/server";

function decodeGoogleCredentialPayload(credential: string): Record<string, unknown> | null {
  const parts = credential.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { credential } = await req.json();
    
    // In a real app, verify the Google JWT. Here we just mock success.
    if (!credential) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const payload = decodeGoogleCredentialPayload(credential);
    const sub = typeof payload?.sub === "string" ? payload.sub : "usr_123";
    const name = typeof payload?.name === "string" ? payload.name : "Orion Trader";
    const email = typeof payload?.email === "string" ? payload.email : "orion@example.com";
    const picture =
      typeof payload?.picture === "string"
        ? payload.picture
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sub)}`;

    return NextResponse.json({
      token: `mock-jwt-token-${sub}`,
      user: {
        id: sub,
        name,
        email,
        picture,
        balance: 100000,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
