// game/utils.js

/**
 * Shuffles an array in place.
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  /**
   * Creates a random assortment of base ingredients.
   * @param {string[]} ingredientList - The list of possible ingredients.
   * @param {number} count - The total number of ingredients to generate.
   * @returns {Object} An object representing the counts of each ingredient, e.g., { Carbon: 2, Silicon: 3 }
   */
  function createRandomIngredientAssortment(ingredientList, count) {
    const assortment = {};
    ingredientList.forEach(ing => assortment[ing] = 0);
  
    for (let i = 0; i < count; i++) {
      const randomIngredient = ingredientList[Math.floor(Math.random() * ingredientList.length)];
      assortment[randomIngredient]++;
    }
    return assortment;
  }
  
  module.exports = {
    shuffleArray,
    createRandomIngredientAssortment,
  };