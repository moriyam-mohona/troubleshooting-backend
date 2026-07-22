export interface ICreateSupportInput {
  message: string;
}

export interface ISupportFilterRequest {
  searchTerm?: string;
}

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
}
