"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Barcode, BookOpen, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase";
import type { Book } from "@/types/book";

type SearchApiResponse = {
  books?: Book[];
  error?: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [addResult, setAddResult] = useState<string | null>(null);
  const [addResultType, setAddResultType] = useState<"success" | "error" | null>(null);
  const [showGoToLibrary, setShowGoToLibrary] = useState(false);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [imageErrorIds, setImageErrorIds] = useState<Set<string>>(new Set());
  const [alreadyInLibraryIds, setAlreadyInLibraryIds] = useState<Set<string>>(
    new Set()
  );

  const scannerRef = useRef<any>(null);

  const topResults = useMemo(() => books.slice(0, 5), [books]);

  const normalizeCoverUrl = (url: string | null) => {
    if (!url) return null;
    return url.replace(/^http:\/\//i, "https://");
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
    } catch {
      // Scanner might already be stopped.
    }
    try {
      await scannerRef.current.clear();
    } catch {
      // Container may already be cleared.
    }
    scannerRef.current = null;
  };

  const runSearch = async (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      setBooks([]);
      setSearchError(null);
      return;
    }

    setSearchError(null);
    setAddResult(null);
    setIsSearching(true);
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(trimmed)}`);
      const data = (await response.json()) as SearchApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Search failed.");
      }

      setBooks(data.books ?? []);
    } catch (error) {
      setBooks([]);
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runSearch(query);
  };

  const handleStartScanner = async () => {
    setScannerError(null);
    setAddResult(null);
    setIsScannerOpen(true);
    setIsScannerLoading(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await stopScanner();

      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 120 } },
        async (decodedText) => {
          setQuery(decodedText);
          await stopScanner();
          setIsScannerOpen(false);
          await runSearch(decodedText);
        },
        () => {
          // Ignore continuous decode failures while scanning.
        }
      );
    } catch (error) {
      setScannerError(
        error instanceof Error
          ? error.message
          : "Could not access camera for barcode scanning."
      );
      setIsScannerOpen(false);
      await stopScanner();
    } finally {
      setIsScannerLoading(false);
    }
  };

  const handleCloseScanner = async () => {
    setIsScannerOpen(false);
    await stopScanner();
  };

  const handleAddToLibrary = async (book: Book) => {
    setAddResult(null);
    setAddResultType(null);
    setShowGoToLibrary(false);
    setActiveBookId(book.id);
    setIsSaving(true);
    console.log("[AddToLibrary] Starting", book);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please sign in before adding books.");
      console.log("[AddToLibrary] Authenticated user:", user.id);

      // 1) Upsert into books first and get a stable UUID.
      const bookPayload = {
        google_books_id: book.googleBooksId,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        cover_image_url: normalizeCoverUrl(book.coverImageUrl),
        page_count: book.pageCount,
      };
      console.log("[AddToLibrary] Upserting into books:", bookPayload);

      let existingBookId: string | null = null;
      if (book.googleBooksId) {
        const { data, error } = await supabase
          .from("books")
          .upsert(bookPayload, { onConflict: "google_books_id" })
          .select("id")
          .single();
        if (error) throw error;
        existingBookId = data.id;
      } else if (book.isbn) {
        const { data, error } = await supabase
          .from("books")
          .upsert(bookPayload, { onConflict: "isbn" })
          .select("id")
          .single();
        if (error) throw error;
        existingBookId = data.id;
      } else {
        const { data, error } = await supabase
          .from("books")
          .insert(bookPayload)
          .select("id")
          .single();
        if (error) throw error;
        existingBookId = data.id;
      }

      if (!existingBookId) {
        throw new Error("Could not resolve a book ID from books upsert.");
      }
      console.log("[AddToLibrary] Resolved book_id:", existingBookId);

      // Pre-check to avoid duplicates & show a friendly message.
      const {
        data: existingUserBook,
        error: existingUserBookError,
      } = await supabase
        .from("user_books")
        .select("id")
        .eq("user_id", user.id)
        .eq("book_id", existingBookId)
        .maybeSingle();

      if (existingUserBookError) throw existingUserBookError;

      if (existingUserBook) {
        setAlreadyInLibraryIds((prev) => new Set(prev).add(book.id));
        setAddResultType("success");
        setAddResult("This book is already in your library.");
        setShowGoToLibrary(true);
        return;
      }

      const { error: userBooksError } = await supabase
        .from("user_books")
        .insert({
        user_id: user.id,
        book_id: existingBookId,
        status: "to-read",
        current_page: 0,
        });
      if (userBooksError) {
        const err = userBooksError as {
          code?: string | number;
          message?: string;
        };
        const code = err.code;
        const message = err.message;
        const combined = `${code ?? ""} ${message ?? ""}`.trim();

        // Postgres unique violation: 23505
        if (
          String(code) === "23505" ||
          String(combined).includes("23505") ||
          String(message ?? "").includes("23505")
        ) {
          console.warn(
            "[AddToLibrary] Book already exists in user_books (23505)."
          );
          setAlreadyInLibraryIds((prev) => new Set(prev).add(book.id));
          setAddResultType("success");
          setAddResult("This book is already in your library.");
          setShowGoToLibrary(true);
          return;
        }

        throw userBooksError;
      }

      console.log("[AddToLibrary] Successfully added to user_books");
      setAlreadyInLibraryIds((prev) => new Set(prev).add(book.id));
      setAddResultType("success");
      setAddResult("Book added to your library.");
      setShowGoToLibrary(true);
    } catch (error) {
      console.error("[AddToLibrary] Failed:", error);
      setAddResultType("error");
      setAddResult(
        error instanceof Error ? error.message : "Failed to add book to library."
      );
      setShowGoToLibrary(false);
    } finally {
      setIsSaving(false);
      setActiveBookId(null);
    }
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Search books</h1>
        <p className="text-sm text-muted-foreground">
          Search by title or ISBN, or scan a barcode to find the book quickly.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Find a book</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or ISBN"
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search
            </Button>
          </form>

          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleStartScanner}
            disabled={isScannerLoading}
          >
            {isScannerLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Barcode className="mr-2 h-4 w-4" />
            )}
            Scan Barcode
          </Button>

          {isScannerOpen && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Camera Scanner</p>
                <Button type="button" variant="outline" size="sm" onClick={handleCloseScanner}>
                  Close
                </Button>
              </div>
              <div id="barcode-reader" className="w-full overflow-hidden rounded-md" />
              <p className="text-xs text-muted-foreground">
                Point your camera at an ISBN barcode.
              </p>
            </div>
          )}

          {searchError && <p className="text-sm text-destructive">{searchError}</p>}
          {scannerError && <p className="text-sm text-destructive">{scannerError}</p>}
        </CardContent>
      </Card>

      {topResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {topResults.map((book) => (
                <div
                  key={book.id}
                  className="flex gap-3 rounded-lg border bg-card p-3 text-card-foreground"
                >
                  <div className="w-20 shrink-0">
                    {normalizeCoverUrl(book.coverImageUrl) &&
                    !imageErrorIds.has(book.id) ? (
                      <img
                        src={normalizeCoverUrl(book.coverImageUrl) ?? ""}
                        alt={book.title}
                        className="h-28 w-full rounded-md border object-cover"
                        onError={() => {
                          setImageErrorIds((prev) => new Set(prev).add(book.id));
                        }}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-md border bg-muted text-center">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <p className="line-clamp-2 px-2 text-[11px] text-muted-foreground">
                          {book.title}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <div className="space-y-1">
                      <h2 className="line-clamp-2 text-sm font-semibold">{book.title}</h2>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {book.author ?? "Unknown author"}
                      </p>
                      {book.isbn && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          ISBN: {book.isbn}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToLibrary(book)}
                      disabled={isSaving || alreadyInLibraryIds.has(book.id)}
                    >
                      {alreadyInLibraryIds.has(book.id) ? (
                        "Already in Library"
                      ) : (
                        <>
                          {isSaving && activeBookId === book.id && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Add to My Library
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {addResult && (
              <div className="mt-3 space-y-2">
                <p
                  className={`text-sm ${
                    addResultType === "error"
                      ? "text-destructive"
                      : "text-emerald-600"
                  }`}
                >
                  {addResult}
                </p>
                {showGoToLibrary && (
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/library">Go to My Library</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
