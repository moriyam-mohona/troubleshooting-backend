export interface ICreateCategoryInput {
  title: string;
  subtitle: string;
  subcategories?: Array<{ title: string }>;
}

export interface IUpdateCategoryInput {
  title?: string;
  subtitle?: string;
}

export interface ICategoryFilterRequest {
  searchTerm?: string;
}
