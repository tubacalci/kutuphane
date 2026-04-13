export type UserBookStatus = "to-read" | "reading" | "finished";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Book {
  id: string;
  googleBooksId: string | null;
  isbn: string | null;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  pageCount: number | null;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: UserBookStatus;
  currentPage: number;
  rating: number | null;
}

export interface ReadingGroup {
  id: string;
  name: string;
  createdBy: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
}
