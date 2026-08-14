const calculateAvailableStock = (totalCount, reservedQuantity) => {
  return totalCount - reservedQuantity;
};

module.exports = { calculateAvailableStock };
