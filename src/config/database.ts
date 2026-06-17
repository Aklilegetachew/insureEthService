import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from './env.js';
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
export * from '../database/enums.js';

export namespace Orm {
  export type InputJsonValue = unknown;
  export type JsonValue = unknown;
  export type InsuranceProductWhereInput = Record<string, unknown>;
  export type InsuranceProductCreateInput = Record<string, unknown>;
  export type InsuranceProductUpdateInput = Record<string, unknown>;

  export class Decimal {
    private readonly value: number;

    constructor(value: string | number | Decimal | null | undefined) {
      this.value = value instanceof Decimal ? value.value : Number(value ?? 0);
    }

    equals(value: string | number | Decimal | null | undefined) {
      return this.value === Number(value instanceof Decimal ? value.value : value ?? 0);
    }

    toString() {
      return String(this.value);
    }

    valueOf() {
      return this.value;
    }
  }

  export class KnownRequestError extends Error {
    constructor(
      message: string,
      public readonly code: string,
    ) {
      super(message);
    }
  }
}

export type CustomerProfileModel = CustomerProfile;
export type UserModel = User;

export const dataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [User, CustomerProfile, Document, InsuranceProduct, Quotation, Policy, Claim, Payment],
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export const initializeDatabase = async () => {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
};

export const closeDatabase = async () => {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
};
