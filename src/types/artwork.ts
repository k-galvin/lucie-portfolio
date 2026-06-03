export type TypeOfWork = 'Paper Picture' | 'Drawing' | 'Photograph' | 'Painting' | 'Print' | string;

export type Availability = 'Available' | 'Sold' | 'Private Collection' | 'On Exhibition' | '';

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
  show: string; // The exhibition where it was shown, or 'Independent'
  availability: Availability;
  subject?: string; // e.g., 'boat', 'ocean', 'garden', 'people'
  imageUrl: string;
  dimensions: Dimensions;
  medium: string;
  price?: number; // Optional pricing
  order: number; // For manual sorting
  isPrint?: boolean;
  printLink?: string;
}
