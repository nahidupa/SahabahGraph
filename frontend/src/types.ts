export interface Sahabi {
  id: number;
  name_ar?: string;
  name_en: string;
  kunyah?: string;
  laqab?: string;
  gender: 'male' | 'female';
  is_prophet: string; // "True" or "False" from JSON
  node_type?: 'Sahabi' | 'Battle';
  prominence?: string;
  biography_short?: string;
  biography_source?: string;
  tribe?: string;
  clan?: string;
  birth_year_hijri?: number;
  death_year_hijri?: number;
}

export interface Relationship {
  source_id: number;
  target_id: number;
  type: string;
  category: 'family' | 'mentorship' | 'battles' | 'others';
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
