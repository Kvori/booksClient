import { $host } from ".";

export interface Book {
    id: number;
    isbn: string;
    title: string;
    author: string[];
    publisher: string;
    image: string;
    likes: number;
    reviewsCount: number;
    reviews: {
        author: string;
        text: string;
    }[];
}

export interface GetBooksListProps {
    page: string;
    language: string;
    seed: string;
    likesCount: string;
    reviewsCount: string;
}

export interface BooksResponse {
    books: Book[];
    nextPage: number;
    hasMore: boolean;
}

export const getBooksList = async (
    props: GetBooksListProps
  ): Promise<{ books: Book[]; hasMore: boolean }> => {
    const response = await $host.get(`api/books/data`, {
      params: props,
    });
  
    const books = response.data.books;
    const hasMore = response.data.hasMore
  
    return {
      books,
      hasMore
    };
  };