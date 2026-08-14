export const calculateAvailableStock = (totalCount: number, reservedQuantity: number): number => {
  return totalCount - reservedQuantity;
};
