export interface Sahabi {
  id: number;
  name: string;
  gender: 'male' | 'female';
  is_prophet: string; // "True" or "False" from JSON
  title: string;
  bio: string;
  node_type?: 'Sahabi' | 'Battle';
  tribe?: string;
  clan?: string;
  birth_year?: number;
  death_year?: number;
}

export interface Relationship {
  source_id: number;
  target_id: number;
  type: string;
  category: 'sons' | 'daughters' | 'uncles' | 'others' | 'battles';
}

export interface GraphData {
  nodes: Sahabi[];
  links: Relationship[];
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy: any;
  }
}
