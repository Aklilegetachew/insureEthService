import type { EntityManager, EntityTarget, FindOptionsOrder } from 'typeorm';
import { QueryFailedError } from 'typeorm';

import { dataSource, initializeDatabase, Orm } from './database.js';
import {
  Claim,
  CustomerProfile,
  Document,
  InsuranceProduct,
  Payment,
  Policy,
  Quotation,
  User,
} from '../database/entities.js';

type ModelName =
  | 'user'
  | 'customerProfile'
  | 'document'
  | 'insuranceProduct'
  | 'quotation'
  | 'policy'
  | 'claim'
  | 'payment';

type QueryArgs = {
  where?: Record<string, unknown> | undefined;
  select?: Record<string, unknown> | undefined;
  include?: Record<string, unknown> | undefined;
  orderBy?: Record<string, 'asc' | 'desc'> | undefined;
  take?: number | undefined;
  data?: Record<string, unknown> | undefined;
  by?: string[] | undefined;
  _count?: Record<string, boolean> | undefined;
  _sum?: Record<string, boolean> | undefined;
};

type OrmClientCompat = Record<ModelName, TypeOrmModel> & {
  $transaction: <T>(callback: (client: OrmClientCompat) => Promise<T>) => Promise<T>;
  $disconnect: () => Promise<void>;
};

const modelTargets: Record<ModelName, EntityTarget<object>> = {
  user: User,
  customerProfile: CustomerProfile,
  document: Document,
  insuranceProduct: InsuranceProduct,
  quotation: Quotation,
  policy: Policy,
  claim: Claim,
  payment: Payment,
};

const modelRelations: Record<ModelName, string[]> = {
  user: ['customerProfile'],
  customerProfile: ['user'],
  document: ['uploadedBy'],
  insuranceProduct: [],
  quotation: ['customer', 'product', 'policy'],
  policy: ['customer', 'product', 'quotation'],
  claim: ['customer', 'policy'],
  payment: ['customer', 'policy'],
};

const uniqueKeys: Partial<Record<ModelName, string[]>> = {
  user: ['id', 'email', 'phone'],
  customerProfile: ['id', 'userId', 'nationalId'],
  document: ['id'],
  insuranceProduct: ['id', 'code'],
  quotation: ['id', 'quotationNumber'],
  policy: ['id', 'policyNumber', 'quotationId'],
  claim: ['id', 'claimNumber'],
  payment: ['id', 'paymentReference'],
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);

const normalizeValue = (value: unknown) => {
  if (value instanceof Orm.Decimal) {
    return value.toString();
  }

  return value;
};

const normalizeData = (data: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, normalizeValue(value)]),
  );

const getPathValue = (row: Record<string, unknown>, key: string): unknown => row[key];

const compareScalar = (actual: unknown, expected: unknown): boolean => {
  if (expected instanceof Date || actual instanceof Date) {
    return new Date(actual as string | number | Date).getTime() === new Date(expected as string | number | Date).getTime();
  }

  return actual === expected;
};

const matchesCondition = (actual: unknown, condition: unknown): boolean => {
  if (!isPlainObject(condition) || condition instanceof Orm.Decimal) {
    return compareScalar(actual, normalizeValue(condition));
  }

  if ('is' in condition) {
    return matchesWhere(actual, condition.is as Record<string, unknown>);
  }

  if ('in' in condition) {
    return Array.isArray(condition.in) && condition.in.includes(actual);
  }

  if ('not' in condition) {
    return !matchesCondition(actual, condition.not);
  }

  if ('equals' in condition) {
    const expected = condition.equals;
    if (condition.mode === 'insensitive' && typeof actual === 'string' && typeof expected === 'string') {
      return actual.toLowerCase() === expected.toLowerCase();
    }

    return compareScalar(actual, expected);
  }

  if ('contains' in condition) {
    const expected = String(condition.contains ?? '');
    const actualValue = String(actual ?? '');
    return condition.mode === 'insensitive'
      ? actualValue.toLowerCase().includes(expected.toLowerCase())
      : actualValue.includes(expected);
  }

  const actualDate = actual instanceof Date ? actual : new Date(actual as string | number | Date);
  if ('gte' in condition && actualDate < new Date(condition.gte as string | number | Date)) return false;
  if ('gt' in condition && actualDate <= new Date(condition.gt as string | number | Date)) return false;
  if ('lte' in condition && actualDate > new Date(condition.lte as string | number | Date)) return false;
  if ('lt' in condition && actualDate >= new Date(condition.lt as string | number | Date)) return false;

  return matchesWhere(actual, condition);
};

const matchesWhere = (row: unknown, where?: Record<string, unknown>): boolean => {
  if (!where) return true;
  if (!isPlainObject(row)) return false;

  return Object.entries(where).every(([key, expected]) => {
    if (key === 'OR') {
      return Array.isArray(expected) && expected.some((item) => matchesWhere(row, item as Record<string, unknown>));
    }

    if (key === 'AND') {
      return Array.isArray(expected) && expected.every((item) => matchesWhere(row, item as Record<string, unknown>));
    }

    return matchesCondition(getPathValue(row, key), expected);
  });
};

const collectRelations = (
  modelName: ModelName,
  args?: Pick<QueryArgs, 'include' | 'select' | 'where'>,
) => {
  const relations = new Set<string>();
  const allowedRelations = new Set(modelRelations[modelName]);

  const addRelationKeys = (input?: Record<string, unknown>) => {
    if (!input) return;

    Object.entries(input).forEach(([key, value]) => {
      if (allowedRelations.has(key)) {
        relations.add(key);
      }

      if (key === 'OR' || key === 'AND') {
        (value as Record<string, unknown>[] | undefined)?.forEach((item) => addRelationKeys(item));
      }
    });
  };

  addRelationKeys(args?.include);
  addRelationKeys(args?.select);
  addRelationKeys(args?.where);

  return Array.from(relations);
};

const applySelect = (row: unknown, select?: Record<string, unknown>, include?: Record<string, unknown>): unknown => {
  if (!row || (!select && !include)) return row;
  if (!isPlainObject(row)) return row;

  if (include) {
    const output = { ...row };
    Object.entries(include).forEach(([key, value]) => {
      if (isPlainObject(value) && isPlainObject(value.select)) {
        output[key] = applySelect(output[key], value.select);
      }
    });
    return output;
  }

  const output: Record<string, unknown> = {};
  Object.entries(select ?? {}).forEach(([key, value]) => {
    if (value === true) {
      output[key] = row[key];
      return;
    }

    if (isPlainObject(value) && isPlainObject(value.select)) {
      output[key] = applySelect(row[key], value.select);
    }
  });

  return output;
};

const toOrder = (orderBy?: Record<string, 'asc' | 'desc'>): FindOptionsOrder<object> | undefined => {
  if (!orderBy) return undefined;

  return Object.fromEntries(
    Object.entries(orderBy).map(([key, direction]) => [key, direction.toUpperCase()]),
  ) as FindOptionsOrder<object>;
};

const toUniqueWhere = (modelName: ModelName, where?: Record<string, unknown>) => {
  if (!where) return where;

  const allowed = uniqueKeys[modelName] ?? ['id'];
  const entry = Object.entries(where).find(([key]) => allowed.includes(key));
  return entry ? { [entry[0]]: entry[1] } : where;
};

const ormError = (error: unknown): never => {
  if (error instanceof QueryFailedError) {
    const driverError = error.driverError as { code?: string };
    if (driverError.code === '23505') {
      throw new Orm.KnownRequestError('Unique constraint failed', 'P2002');
    }
    if (driverError.code === '23503') {
      throw new Orm.KnownRequestError('Foreign key constraint failed', 'P2003');
    }
    if (driverError.code === '23502') {
      throw new Orm.KnownRequestError('Required value missing', 'P2011');
    }
  }

  throw error;
};

class TypeOrmModel {
  constructor(
    private readonly modelName: ModelName,
    private readonly manager: EntityManager,
  ) {}

  private get repository() {
    return this.manager.getRepository(modelTargets[this.modelName]);
  }

  async findMany(args: QueryArgs = {}): Promise<any[]> {
    await initializeDatabase();
    const findOptions = {
      relations: collectRelations(this.modelName, args),
      ...(args.orderBy ? { order: toOrder(args.orderBy) as FindOptionsOrder<object> } : {}),
    };
    const rows = await this.repository.find(findOptions as Parameters<typeof this.repository.find>[0]);
    const filtered = rows.filter((row) => matchesWhere(row, args.where));
    const sliced = args.take ? filtered.slice(0, args.take) : filtered;
    return sliced.map((row) => applySelect(row, args.select, args.include));
  }

  async findFirst(args: QueryArgs = {}): Promise<any | null> {
    const rows = await this.findMany({ ...args, take: 1 });
    return rows[0] ?? null;
  }

  async findUnique(args: QueryArgs = {}): Promise<any | null> {
    return this.findFirst({
      ...args,
      where: toUniqueWhere(this.modelName, args.where),
    });
  }

  async count(args: QueryArgs = {}): Promise<number> {
    const rows = await this.findMany({ where: args.where });
    return rows.length;
  }

  async aggregate(args: QueryArgs = {}): Promise<any> {
    const rows = await this.findMany({ where: args.where }) as Record<string, unknown>[];
    const sums = Object.fromEntries(
      Object.entries(args._sum ?? {}).map(([key]) => [
        key,
        rows.reduce((total, row) => total + Number(row[key] ?? 0), 0),
      ]),
    );

    return { _sum: sums };
  }

  async groupBy(args: QueryArgs = {}): Promise<any[]> {
    const rows = await this.findMany({ where: args.where }) as Record<string, unknown>[];
    const by = args.by ?? [];
    const groups = new Map<string, Record<string, unknown>[]>();

    rows.forEach((row) => {
      const key = JSON.stringify(by.map((field) => row[field]));
      groups.set(key, [...(groups.get(key) ?? []), row]);
    });

    return Array.from(groups.entries()).map(([key, groupRows]) => {
      const values = JSON.parse(key) as unknown[];
      const group = Object.fromEntries(by.map((field, index) => [field, values[index]]));
      const firstCountKey = Object.keys(args._count ?? {})[0];
      return {
        ...group,
        _count: firstCountKey ? { [firstCountKey]: groupRows.length } : undefined,
      };
    });
  }

  async create(args: QueryArgs): Promise<any> {
    await initializeDatabase();
    try {
      const data = normalizeData(args.data ?? {});

      if (this.modelName === 'user' && isPlainObject(data.customerProfile)) {
        const profileCreate = isPlainObject(data.customerProfile.create)
          ? normalizeData(data.customerProfile.create)
          : {};
        delete data.customerProfile;

        const user = await this.repository.save(this.repository.create(data));
        await this.manager.getRepository(CustomerProfile).save({ ...profileCreate, userId: (user as User).id });
        return this.findUnique({ where: { id: (user as User).id }, select: args.select, include: args.include });
      }

      const row = await this.repository.save(this.repository.create(data));
      return this.findUnique({ where: { id: (row as { id: string }).id }, select: args.select, include: args.include });
    } catch (error) {
      ormError(error);
    }
  }

  async update(args: QueryArgs): Promise<any> {
    await initializeDatabase();
    try {
      const existing = await this.findUnique({ where: args.where }) as { id?: string } | null;
      if (!existing?.id) {
        throw new Orm.KnownRequestError('Record not found', 'P2025');
      }

      await this.repository.update({ id: existing.id }, normalizeData(args.data ?? {}));
      return this.findUnique({ where: { id: existing.id }, select: args.select, include: args.include });
    } catch (error) {
      ormError(error);
    }
  }

  async delete(args: QueryArgs): Promise<any> {
    await initializeDatabase();
    const row = await this.findUnique({ where: args.where, select: args.select, include: args.include }) as { id?: string } | null;
    if (!row?.id) {
      throw new Orm.KnownRequestError('Record not found', 'P2025');
    }

    await this.repository.delete({ id: row.id });
    return row;
  }

  async deleteMany(): Promise<{ count: number }> {
    await initializeDatabase();
    await this.repository.createQueryBuilder().delete().execute();
    return { count: 0 };
  }
}

const createClient = (manager: EntityManager): OrmClientCompat => ({
  user: new TypeOrmModel('user', manager),
  customerProfile: new TypeOrmModel('customerProfile', manager),
  document: new TypeOrmModel('document', manager),
  insuranceProduct: new TypeOrmModel('insuranceProduct', manager),
  quotation: new TypeOrmModel('quotation', manager),
  policy: new TypeOrmModel('policy', manager),
  claim: new TypeOrmModel('claim', manager),
  payment: new TypeOrmModel('payment', manager),
  $transaction: async <T>(callback: (client: ReturnType<typeof createClient>) => Promise<T>) => {
    await initializeDatabase();
    return dataSource.transaction((transactionManager) => callback(createClient(transactionManager)));
  },
  $disconnect: () => (dataSource.isInitialized ? dataSource.destroy() : Promise.resolve()),
});

export const orm = createClient(dataSource.manager);
