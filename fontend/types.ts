
export type ToolCategory = 'Frontend' | 'Backend' | 'DevOps' | 'Utility' | 'String' | 'AI';

export interface Tool {
  id: string;
  name: string;
  description: string;
  categories: ToolCategory[]; // Changed from single category to array
  url: string; // Internal route or external link
  iconName: string;
  isInternal: boolean;
  isExternal?: boolean;
  isEnable?: boolean; // Control visibility on dashboard
  order?: number; // Display order on dashboard
}

export interface HttpRequestState {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: { key: string; value: string }[];
  params: { key: string; value: string }[];
  body: string;
  bodyType: 'json' | 'xml' | 'text';
}

export interface HttpResponseState {
  status: number | null;
  statusText: string | null;
  data: any | null;
  time: number | null;
  size: string | null;
  loading: boolean;
  error: string | null;
}

export type Theme = 'light' | 'dark';