export const maxDuration = 60;

// Generated 3D files live on provider storage that sends no CORS headers, so the
// browser can't load them directly. Stream them through here, from known hosts only.
const HOSTS = [/(^|\.)storage\.googleapis\.com$/, /(^|\.)meshy\.ai$/, /(^|\.)cloudfront\.net$/];

export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("u");
  let target: URL;
  try {
    target = new URL(src ?? "");
  } catch {
    return Response.json({ error: "bad url" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !HOSTS.some((h) => h.test(target.hostname))) {
    return Response.json({ error: "host not allowed" }, { status: 400 });
  }
  const upstream = await fetch(target, { redirect: "follow" });
  if (!upstream.ok || !upstream.body) return Response.json({ error: `upstream ${upstream.status}` }, { status: 502 });
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "model/gltf-binary",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
