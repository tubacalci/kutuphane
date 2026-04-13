import { NextResponse } from "next/server";
import { searchGoogleBooks } from "@/lib/google-books";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  try {
    const books = await searchGoogleBooks(query);
    return NextResponse.json({ books });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search books.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
