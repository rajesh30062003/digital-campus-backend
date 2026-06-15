import { Model } from "mongoose";

interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: { path: string; select?: string }[];
}

interface PaginateResult<T> {
  data: { [key: string]: T[] };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const paginate = async <T>(
  model: Model<T>,
  filter: Record<string, unknown>,
  options: PaginateOptions = {}
): Promise<PaginateResult<T>> => {
  const { page = 1, limit = 20, sort = { createdAt: -1 }, populate = [] } = options;
  const skip = (page - 1) * limit;

  let query = model.find(filter).sort(sort).skip(skip).limit(limit);
  populate.forEach((p) => {
    query = query.populate(p.path, p.select) as typeof query;
  });

  const [docs, total] = await Promise.all([query.exec(), model.countDocuments(filter)]);
  const totalPages = Math.ceil(total / limit);

  const modelName = model.modelName.toLowerCase() + "s";

  return {
    data: { [modelName]: docs },
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};
