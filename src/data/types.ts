export type AppCategory = 'erp' | 'microsoft365' | 'portals' | 'tools';

export interface AppLink {
  id: string;
  name: string;
  description: string;
  url: string;
  category: AppCategory;
  featured: boolean;
  company?: string;
  logo?: string;
  badge?: 'nuevo';
}

export type ResourceType = 'manual' | 'template' | 'folder' | 'link';

export interface Resource {
  id: string;
  name: string;
  description: string;
  url: string;
  type: ResourceType;
}

export interface Contact {
  name: string;
  role: string;
  department: string;
  company: string;
  phone: string;
  email: string;
  extension?: string;
}

export interface Company {
  id: string;
  name: string;
  segment: string;
  description: string;
  slogan: string;
  color: string;
  url?: string;
}

export interface SearchItem {
  id: string;
  name: string;
  description: string;
  url: string;
  section: string;
}
