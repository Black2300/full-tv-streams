import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const streamUrl = searchParams.get("url");

  if (!streamUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get("range");
    const isExplicitM3U8 = streamUrl.toLowerCase().includes(".m3u8");

    // 1. If it might be an M3U8 playlist, inspect its content first
    if (isExplicitM3U8) {
      const res = await fetch(streamUrl, {
        headers: {
          "User-Agent": USER_AGENT,
        },
        redirect: "follow",
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Upstream error ${res.status}` },
          { status: res.status }
        );
      }

      const contentType = res.headers.get("content-type") || "";
      const arrayBuf = await res.arrayBuffer();
      const firstBytes = Buffer.from(arrayBuf.slice(0, 512)).toString("utf8");

      // Verify if it is really a text M3U8 playlist
      if (firstBytes.includes("#EXTM3U") || firstBytes.includes("#EXT-X-")) {
        const text = Buffer.from(arrayBuf).toString("utf8");
        const finalUrl = res.url || streamUrl;
        const finalOrigin = new URL(finalUrl).origin;
        const basePath = finalUrl.substring(0, finalUrl.lastIndexOf("/") + 1);

        // Rewrite all segment URLs to point back to /api/stream-proxy
        // This ensures zero CORS errors and zero Mixed Content (HTTP on HTTPS) errors on Vercel
        const rewritten = text
          .split("\n")
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) {
              return line;
            }

            let absoluteSegmentUrl = trimmed;
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
              absoluteSegmentUrl = trimmed;
            } else if (trimmed.startsWith("/")) {
              absoluteSegmentUrl = `${finalOrigin}${trimmed}`;
            } else {
              absoluteSegmentUrl = `${basePath}${trimmed}`;
            }

            return `/api/stream-proxy?url=${encodeURIComponent(absoluteSegmentUrl)}`;
          })
          .join("\n");

        return new NextResponse(rewritten, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }

      // If URL had .m3u8 but content is binary (e.g. MP4 stream), serve as binary video
      const buf = Buffer.from(arrayBuf);
      const headers = new Headers();
      headers.set("Content-Type", contentType || "video/mp4");
      headers.set("Content-Length", String(buf.byteLength));
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      headers.set("Accept-Ranges", "bytes");

      return new NextResponse(buf, {
        status: 200,
        headers,
      });
    }

    // 2. Binary Video Streaming (MP4, TS segments, MKV, etc.)
    // We clamp Range requests to 2MB chunks so:
    // - Vercel serverless executes in ~150ms without timing out
    // - Memory usage stays tiny (2MB)
    // - Exact Content-Length & Content-Range are returned (NO chunked transfer-encoding)
    // - HTML5 <video> can scrub and seek effortlessly
    const MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
    let activeRange = rangeHeader;

    if (activeRange) {
      const match = activeRange.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : undefined;

        if (end === undefined || end - start + 1 > MAX_CHUNK_SIZE) {
          const clampedEnd = start + MAX_CHUNK_SIZE - 1;
          activeRange = `bytes=${start}-${clampedEnd}`;
        }
      }
    } else if (!streamUrl.toLowerCase().includes(".ts")) {
      // For MP4 without range, request the first 2MB so video can read metadata
      activeRange = `bytes=0-${MAX_CHUNK_SIZE - 1}`;
    }

    const fetchHeaders: Record<string, string> = {
      "User-Agent": USER_AGENT,
    };
    if (activeRange) {
      fetchHeaders["Range"] = activeRange;
    }

    const res = await fetch(streamUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });

    if (!res.ok && res.status !== 206) {
      return NextResponse.json(
        { error: `Upstream returned status ${res.status}` },
        { status: res.status }
      );
    }

    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const contentType =
      res.headers.get("content-type") ||
      (streamUrl.toLowerCase().includes(".ts") ? "video/mp2t" : "video/mp4");

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Content-Length", String(buf.byteLength));
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.set("Accept-Ranges", "bytes");

    const contentRange = res.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    return new NextResponse(buf, {
      status: res.status === 206 || activeRange ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Stream proxy error:", err);
    return NextResponse.json(
      { error: "Proxy streaming error: " + (err.message || "Unknown error") },
      { status: 502 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const streamUrl = searchParams.get("url");

  if (!streamUrl) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const res = await fetch(streamUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": USER_AGENT,
      },
      redirect: "follow",
    });

    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Type",
      res.headers.get("content-type") ||
        (streamUrl.toLowerCase().includes(".ts") ? "video/mp2t" : "video/mp4")
    );
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Accept-Ranges", "bytes");
    if (res.headers.get("content-length")) {
      responseHeaders.set("Content-Length", res.headers.get("content-length")!);
    }

    return new NextResponse(null, {
      status: res.status || 200,
      headers: responseHeaders,
    });
  } catch (e) {
    return new NextResponse(null, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
