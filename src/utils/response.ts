// Utility functions for standardized API responses

export const successResponse = <T>(data: T, message?: string) => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message: string, errors?: unknown) => ({
  success: false,
  message,
  errors,
});

