import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const streamUrl = searchParams.get("url");

  if (!streamUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const isM3U8 = streamUrl.includes(".m3u8");
    const rangeHeader = request.headers.get("range");

    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const res = await fetch(streamUrl, {
      headers: fetchHeaders,
    });

    if (!res.ok && res.status !== 206) {
      return NextResponse.json(
        { error: `Stream upstream returned status ${res.status}` },
        { status: res.status }
      );
    }

    // For HLS playlists (.m3u8), rewrite relative /hls/ paths to absolute URLs
    if (isM3U8 || res.headers.get("content-type")?.includes("mpegurl")) {
      const text = await res.text();
      const origin = new URL(streamUrl).origin;

      // Replace lines starting with /hls/ to point directly to origin
      const rewritten = text
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("/hls/")) {
            return `${origin}${trimmed}`;
          }
          if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("#")) {
            return `${origin}${trimmed}`;
          }
          return line;
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

    // For video streams (MP4/TS), stream the response directly with range support
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", res.headers.get("content-type") || "video/mp4");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.set("Accept-Ranges", "bytes");

    if (res.headers.get("content-length")) {
      responseHeaders.set("Content-Length", res.headers.get("content-length")!);
    }
    if (res.headers.get("content-range")) {
      responseHeaders.set("Content-Range", res.headers.get("content-range")!);
    }

    return new NextResponse(res.body, {
      status: res.status, // 200 or 206
      headers: responseHeaders,
    });
  } catch (err: any) {
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", res.headers.get("content-type") || "video/mp4");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Accept-Ranges", "bytes");
    if (res.headers.get("content-length")) {
      responseHeaders.set("Content-Length", res.headers.get("content-length")!);
    }

    return new NextResponse(null, {
      status: res.status,
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
