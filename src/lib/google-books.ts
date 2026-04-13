import type { Book } from "@/types/book";

interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  imageLinks?: {
    extraLarge?: string;
    large?: string;
    medium?: string;
    small?: string;
    thumbnail?: string;
    smallThumbnail?: string;
  };
  pageCount?: number;
  industryIdentifiers?: Array<{
    type?: string;
    identifier?: string;
  }>;
}

interface GoogleBooksItem {
  id: string;
  volumeInfo?: GoogleBooksVolumeInfo;
}

interface GoogleBooksResponse {
  items?: GoogleBooksItem[];
}

function getIsbnFromVolumeInfo(volumeInfo?: GoogleBooksVolumeInfo): string | null {
  const identifiers = volumeInfo?.industryIdentifiers ?? [];
  const isbn13 = identifiers.find((id) => id.type === "ISBN_13")?.identifier;
  if (isbn13) return isbn13;

  const isbn10 = identifiers.find((id) => id.type === "ISBN_10")?.identifier;
  return isbn10 ?? null;
}

function mapGoogleBookToBook(item: GoogleBooksItem): Book {
  const volumeInfo = item.volumeInfo;
  const imageLinks = volumeInfo?.imageLinks;
  const rawCoverUrl =
    imageLinks?.thumbnail ??
    imageLinks?.smallThumbnail ??
    imageLinks?.small ??
    imageLinks?.medium ??
    imageLinks?.large ??
    imageLinks?.extraLarge ??
    null;

  return {
    id: item.id,
    googleBooksId: item.id,
    isbn: getIsbnFromVolumeInfo(volumeInfo),
    title: volumeInfo?.title ?? "Untitled",
    author: volumeInfo?.authors?.join(", ") ?? null,
    coverImageUrl: normalizeGoogleCoverUrl(rawCoverUrl),
    pageCount: volumeInfo?.pageCount ?? null,
  };
}

function normalizeGoogleCoverUrl(url: string | null): string | null {
  if (!url) return null;

  // Google Books often returns http thumbnails; force https for reliability.
  const secureUrl = url.replace(/^http:\/\//i, "https://");

  // Improve quality a bit while keeping Google-hosted endpoint.
  return secureUrl
    .replace(/zoom=\d+/i, "zoom=2")
    .replace(/&edge=curl/gi, "");
}

function isLikelyIsbn(query: string): boolean {
  const normalized = query.replace(/[-\s]/g, "");
  return /^(?:\d{10}|\d{13}|\d{9}X)$/i.test(normalized);
}

export async function searchGoogleBooks(query: string): Promise<Book[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const q = isLikelyIsbn(trimmedQuery)
    ? `isbn:${trimmedQuery.replace(/[-\s]/g, "")}`
    : `intitle:${trimmedQuery}`;

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", "20");
  if (apiKey) url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`Google Books API request failed: ${response.status}`);
  }

  const data = (await response.json()) as GoogleBooksResponse;
  return (data.items ?? []).map(mapGoogleBookToBook);
}
