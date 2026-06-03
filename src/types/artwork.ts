export type TypeOfWork = 'Paper Picture' | 'Drawing' | 'Photograph' | 'Painting' | 'Print' | string;

export type ArtworkStatus = 'Private Collection' | 'On Exhibition' | '';

export interface Dimensions {
  width: number;
  height: number;
  depth?: number;
  unit: 'in' | 'cm';
}

export interface Artwork {
  id: string;
  title: string;
  year: number;
  typeOfWork: TypeOfWork;
  show?: string; // The exhibition where it was shown (optional)
  status?: ArtworkStatus;
  subject?: string[]; // e.g., ['boats', 'water']
  imageUrl: string;
  dimensions: Dimensions;
  medium: string;
  price?: number; // Optional pricing
  order: number; // For manual sorting
  isPrint?: boolean;
  printLink?: string;
}
