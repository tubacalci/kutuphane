"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseClient } from "@/lib/supabase";
import type { UserBookStatus } from "@/types/book";

type LibraryBook = {
  userBookId: string;
  status: UserBookStatus;
  currentPage: number;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  pageCount: number | null;
};

const STATUSES: Array<{ key: UserBookStatus; label: string }> = [
  { key: "to-read", label: "To-Read" },
  { key: "reading", label: "Reading" },
  { key: "finished", label: "Finished" },
];

export default function LibraryPage() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UserBookStatus>("to-read");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UserBookStatus>("to-read");
  const [updatePage, setUpdatePage] = useState("0");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadLibrary = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBooks([]);
        setFeedback("Please sign in to view your library.");
        return;
      }
      console.log("[Library] Loading for user:", user.id);

      const { data, error } = await supabase
        .from("user_books")
        .select(
          "id,status,current_page,books:book_id(title,author,cover_image_url,page_count)"
        )
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      console.log("[Library] Query result:", { count: data?.length ?? 0, error });
      if (error) throw error;

      const mapped: LibraryBook[] = (data ?? []).flatMap((item: any) => { // item'a :any ekledik
       const related = Array.isArray(item.books) ? item.books[0] : item.books;
        if (!related) return [];

        return [
          {
            userBookId: item.id,
            status: item.status,
            currentPage: item.current_page,
            title: related.title,
            author: related.author,
            coverImageUrl: related.cover_image_url,
            pageCount: related.page_count,
          },
        ];
      });

      setBooks(mapped);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Failed to load library books."
      );
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLibrary();
  }, []);

  const filteredBooks = useMemo(
    () => books.filter((book) => book.status === activeTab),
    [activeTab, books]
  );

  const openUpdateForm = (book: LibraryBook) => {
    setExpandedId(book.userBookId);
    setUpdateStatus(book.status);
    setUpdatePage(String(book.currentPage));
    setFeedback(null);
  };

  const saveProgress = async (userBookId: string) => {
    setIsUpdating(true);
    setFeedback(null);
    try {
      const currentPage = Number(updatePage);
      if (Number.isNaN(currentPage) || currentPage < 0) {
        throw new Error("Current page must be zero or greater.");
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("user_books")
        .update({
          status: updateStatus,
          current_page: currentPage,
        })
        .eq("id", userBookId);
      if (error) throw error;

      setBooks((prev) =>
        prev.map((book) =>
          book.userBookId === userBookId
            ? { ...book, status: updateStatus, currentPage }
            : book
        )
      );
      setExpandedId(null);
      setFeedback("Book progress updated.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not update progress."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My Library</h1>
        <p className="text-sm text-muted-foreground">
          Track your books by reading status and update progress anytime.
        </p>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as UserBookStatus)}
        className="space-y-4"
      >
        <TabsList>
          {STATUSES.map((status) => (
            <TabsTrigger key={status.key} value={status.key}>
              {status.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUSES.map((status) => (
          <TabsContent key={status.key} value={status.key} className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your library...
              </div>
            ) : filteredBooks.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  No books in this section yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredBooks.map((book) => (
                  <Card key={book.userBookId}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex gap-3">
                        <div className="w-20 shrink-0">
                          {book.coverImageUrl ? (
                            <Image
                              src={book.coverImageUrl}
                              alt={book.title}
                              width={128}
                              height={176}
                              className="h-28 w-full rounded-md border object-cover"
                            />
                          ) : (
                            <div className="flex h-28 w-full items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                              No cover
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h2 className="line-clamp-2 text-sm font-semibold">{book.title}</h2>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {book.author ?? "Unknown author"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Current page: {book.currentPage}
                            {book.pageCount ? ` / ${book.pageCount}` : ""}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUpdateForm(book)}
                      >
                        Update Progress
                      </Button>

                      {expandedId === book.userBookId && (
                        <div className="space-y-2 rounded-md border p-3">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <select
                              value={updateStatus}
                              onChange={(event) =>
                                setUpdateStatus(event.target.value as UserBookStatus)
                              }
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                            >
                              {STATUSES.map((item) => (
                                <option key={item.key} value={item.key}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                            <Input
                              type="number"
                              min={0}
                              value={updatePage}
                              onChange={(event) => setUpdatePage(event.target.value)}
                              placeholder="Current page"
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => saveProgress(book.userBookId)}
                              disabled={isUpdating}
                            >
                              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
    </main>
  );
}
