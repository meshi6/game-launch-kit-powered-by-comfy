import { NextResponse, type NextRequest } from "next/server";

/**
 * Gate every API route behind LAUNCH_PASSCODE (when it's set), so a public
 * demo link can't burn the workspace's Comfy credits.
 */
export function proxy(req: NextRequest) {
  const code = process.env.LAUNCH_PASSCODE?.trim();
  if (!code) return NextResponse.next();
  const sent = req.headers.get("x-launch-pass") ?? req.nextUrl.searchParams.get("pass");
  if (sent?.trim().toLowerCase() === code.toLowerCase()) return NextResponse.next();
  return NextResponse.json({ error: "PASSCODE" }, { status: 401 });
}

export const config = { matcher: "/api/:path*" };
