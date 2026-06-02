export interface Sahabi {
  id: number;
  name_ar?: string;
  name_bn?: string;
  name_de?: string;
  name_en: string;
  kunyah?: string;
  laqab?: string;
  gender: 'male' | 'female';
  is_prophet: boolean;
  node_type?: 'Sahabi' | 'Battle' | 'PoliticalFigure';
  prominence?: string;
  biography_short?: string;
  biography_bn?: string;
  biography_de?: string;
  biography_source?: string;
  tribe?: string;
  clan?: string;
  birth_year_hijri?: number;
  death_year_hijri?: number;
  has_parents?: boolean;
  has_children?: boolean;
  has_spouses?: boolean;
  has_siblings?: boolean;
  has_uncles?: boolean;
  has_cousins?: boolean;
  has_companions?: boolean;
  has_teachers?: boolean;
  has_students?: boolean;
  has_battles?: boolean;
  has_participants?: boolean;
}

export interface Relationship {
  source: number;
  target: number;
  type: string;
  category: 'family' | 'mentorship' | 'battles' | 'others' | 'governance';
}

export interface GraphData {
  nodes: Sahabi[];
  links: Relationship[];
}

export interface PoliticalCity {
  id: string;
  name_ar: string;
  name_en: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

export interface GovernorTerm {
  id: string;
  city_id: string;
  governor_name?: string;
  governor_id?: number;
  caliph_name: string;
  caliph_id?: number;
  start_year_ce: number;
  end_year_ce: number;
  start_year_hijri: number;
  end_year_hijri: number;
  termination: string;
  notes?: string;
  source_ref?: string;
  vacancy?: boolean;
}

export interface PoliticalData {
  cities: PoliticalCity[];
  terms: GovernorTerm[];
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy: any;
  }
}
