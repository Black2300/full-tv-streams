import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const streamUrl = searchParams.get("url");

  if (!streamUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const isM3U8 = streamUrl.includes(".m3u8");

    // For HLS playlists (.m3u8), we can fetch and rewrite segment URLs if necessary
    const res = await fetch(streamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: streamUrl,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Stream upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    if (isM3U8) {
      let content = await res.text();
      // If it's a playlist, return text with HLS content-type
      return new NextResponse(content, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    }

    // For other streams, redirect or pipe
    return NextResponse.redirect(streamUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
