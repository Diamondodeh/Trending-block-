
import { Movie } from './types';

export const INITIAL_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'DUNE: PART TWO',
    description: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
    category: 'Movie',
    thumbnail: 'https://picsum.photos/seed/dune/800/450',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    rating: 4.8,
    year: 2024,
    genres: ['Action', 'Sci-Fi'],
    isTrending: true,
  },
  {
    id: '2',
    title: 'THE BOYS: SEASON 4',
    description: 'The world is on the brink. Victoria Neuman is closer than ever to the Oval Office and under the muscly thumb of Homelander.',
    category: 'Series',
    thumbnail: 'https://picsum.photos/seed/boys/800/450',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    rating: 4.7,
    year: 2024,
    genres: ['Action', 'Drama'],
    isTrending: true,
  },
  {
    id: '3',
    title: 'OPPENHEIMER',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    category: 'Movie',
    thumbnail: 'https://picsum.photos/seed/oppen/800/450',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    rating: 4.9,
    year: 2023,
    genres: ['History', 'Drama'],
  },
  {
    id: '4',
    title: 'JUJUTSU KAISEN',
    description: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself.',
    category: 'Anime',
    thumbnail: 'https://picsum.photos/seed/jjk/800/450',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    rating: 4.9,
    year: 2023,
    genres: ['Anime', 'Action'],
    isTrending: true,
  }
];

export const GENRES = ['Action', 'Anime', 'Series', 'Drama', 'Sci-Fi', 'History', 'Comedy'];
export const YEARS = [2024, 2023, 2022, 2021, 2020];
export const QUALITIES = ['4K', '1080p', '720p', '360p'];
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
