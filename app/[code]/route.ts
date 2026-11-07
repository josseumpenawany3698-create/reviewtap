
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;

    if (!/^\d+$/.test(code)) {
      return new NextResponse("Kode produk tidak valid.", {
        status: 400,
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new NextResponse("Konfigurasi Supabase tidak tersedia.", {
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: reviewUrl, error } = await supabase.rpc(
      "get_review_url",
      { p_code: code }
    );

    if (error) {
      console.error("Redirect error:", error.message);
      return new NextResponse("Gagal mengambil URL Google Review.", {
        status: 500,
      });
    }

    if (!reviewUrl) {
      return new NextResponse(
        "Produk belum diaktivasi atau tidak ditemukan.",
        { status: 404 }
      );
    }

    const destination = new URL(reviewUrl);

    if (
      destination.protocol !== "https:" ||
      destination.hostname !== "search.google.com" ||
      destination.pathname !== "/local/writereview"
    ) {
      return new NextResponse("URL Google Review tidak valid.", {
        status: 400,
      });
    }

    return NextResponse.redirect(destination, 302);
  } catch (error) {
    console.error("REVIEWTAP redirect error:", error);

    return new NextResponse("Terjadi kesalahan pada REVIEWTAP.", {
      status: 500,
    });
  }
}
