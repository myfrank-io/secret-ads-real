import { NextResponse } from "next/server";
import { getWallet } from "@/lib/store";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Connecteur Secret Ads — portefeuille utilisateur.
 *
 * GET /api/wallet?uid=usr_xxx
 * Renvoie le solde serveur accumulé par cet utilisateur via le connecteur
 * (toutes plateformes confondues).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid || !/^[\w-]{1,64}$/.test(uid)) {
    return NextResponse.json(
      { ok: false, error: "Paramètre uid requis ([A-Za-z0-9_-], max 64)." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { ok: true, uid, wallet: getWallet(uid) },
    { headers: CORS_HEADERS }
  );
}
