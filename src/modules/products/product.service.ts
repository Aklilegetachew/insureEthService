import { Prisma, UserRole } from '@prisma/client';

import { AppError } from '../../utils/app-error.js';
import type { SafeUser } from '../auth/auth.types.js';
import { productRepository } from './product.repository.js';
import type { CreateProductInput, ProductQuery, UpdateProductInput } from './product.types.js';

const canViewAllProducts = (user?: SafeUser) => Boolean(user && user.role !== UserRole.CUSTOMER);

const getActiveOnly = (user?: SafeUser) => !canViewAllProducts(user);

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError('Product code already exists', 409);
    }

    if (error.code === 'P2025') {
      throw new AppError('Product not found', 404);
    }
  }

  throw error;
};

export const productService = {
  listProducts(query: ProductQuery, user?: SafeUser) {
    return productRepository.findMany(query, getActiveOnly(user));
  },

  async getProductById(id: string, user?: SafeUser) {
    const product = await productRepository.findById(id, getActiveOnly(user));

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  },

  async createProduct(input: CreateProductInput) {
    const existingProduct = await productRepository.findByCode(input.code);

    if (existingProduct) {
      throw new AppError('Product code already exists', 409);
    }

    try {
      return await productRepository.create(input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updateProduct(id: string, input: UpdateProductInput) {
    try {
      return await productRepository.update(id, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async deleteProduct(id: string) {
    try {
      return await productRepository.delete(id);
    } catch (error) {
      handlePrismaError(error);
    }
  },
};
