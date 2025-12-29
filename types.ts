
export type UserRole = 'USER' | 'ADMIN' | 'MAIN_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type Category = 'Movie' | 'Series' | 'Anime';

export interface Movie {
  id: string;
  title: string;
  description: string;
  category: Category;
  thumbnail: string;
  videoUrl: string;
  rating: number;
  year: number;
  genres: string[];
  isTrending?: boolean;
}

export interface Download {
  id: string;
  movieId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'paused';
  title: string;
  thumbnail: string;
  size: string;
}

export interface LocalFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}
