export interface ICreateCategoryInput {
  title: string;
  subtitle: string;
  subcategories?: Array<{ title: string }>;
}

export interface IUpdateCategoryInput {
  title?: string;
  subtitle?: string;
  subcategories?: Array<{
    id: string;
    title: string;
  }>;
}

export interface ICategoryFilterRequest {
  searchTerm?: string;
}
