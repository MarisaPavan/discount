// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").CartOperation} CartOperation
 */

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const discountPercentage = 10;

  const operations = input.cart.lines.reduce(
    /** @param {CartOperation[]} acc */
    (acc, cartLine) => {
      console.log('-----------------------------------------');
      console.log('Hitted :')
      console.log('-----------------------------------------');
      const updateOperation = buildDiscountOperation(cartLine, discountPercentage);

      if (updateOperation) {
        return [...acc, { update: updateOperation }];
      }

      return acc;
    },
    []
  );

  return operations.length > 0 ? { operations } : NO_CHANGES;
}

/**
 * Builds a cart update operation with a 10% discount applied to the price.
 *
 * @param {RunInput['cart']['lines'][number]} cartLine
 * @param {number} discountPercentage
 */
function buildDiscountOperation({ id: cartLineId, merchandise, cost }, discountPercentage) {
  if (merchandise.__typename === "ProductVariant") {
    const originalPrice = cost.amountPerQuantity.amount;
    const discountedPrice = (originalPrice - (originalPrice * discountPercentage) / 100).toFixed(2);

    return {
      cartLineId,
      price: {
        adjustment: {
          fixedPricePerUnit: {
            amount: discountedPrice,
          },
        },
      },
    };
  }

  return null;
}
