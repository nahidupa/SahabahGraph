export interface Sahabi {
  id: number;
  name: string;
  gender: 'male' | 'female' | 'n/a';
  is_prophet: string;
  title: string;
  type?: 'person' | 'event';
}

export interface Relationship {
  source_id: number;
  target_id: number;
  type: string;
  category: 'sons' | 'daughters' | 'uncles' | 'others' | 'events';
}

export interface GraphData {
  nodes: Sahabi[];
  links: Relationship[];
}
