export interface Sahabi {
  id: number;
  name: string;
  gender: 'male' | 'female';
  is_prophet: string; // "True" or "False" from JSON
  title: string;
}

export interface Relationship {
  source_id: number;
  target_id: number;
  type: string;
  category: 'sons' | 'daughters' | 'uncles' | 'others';
}

export interface GraphData {
  nodes: Sahabi[];
  links: Relationship[];
}
