import { ApiResponse } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { productService } from './product.service.js';
import type { ProductQuery } from './product.types.js';

export const productController = {
  listProducts: asyncHandler(async (req, res) => {
    const products = await productService.listProducts(req.query as ProductQuery, req.user);

    res.status(200).json(
      ApiResponse.success({
        message: 'Products retrieved successfully',
        data: { products },
      }),
    );
  }),

  getProductById: asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id as string, req.user);

    res.status(200).json(
      ApiResponse.success({
        message: 'Product retrieved successfully',
        data: { product },
      }),
    );
  }),

  createProduct: asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);

    res.status(201).json(
      ApiResponse.success({
        message: 'Product created successfully',
        data: { product },
      }),
    );
  }),

  updateProduct: asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id as string, req.body);

    res.status(200).json(
      ApiResponse.success({
        message: 'Product updated successfully',
        data: { product },
      }),
    );
  }),

  deleteProduct: asyncHandler(async (req, res) => {
    const product = await productService.deleteProduct(req.params.id as string);

    res.status(200).json(
      ApiResponse.success({
        message: 'Product deleted successfully',
        data: { product },
      }),
    );
  }),
};
