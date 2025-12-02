import type express from 'express';
import logger from '../utils/logger';
import { tryDecodeBase64 } from '../utils/utils';

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string;
  image_url: string;
  source_url: string;
}

interface RecipesResponse {
  recipes: Recipe[];
}

const searchRecipes = (): express.RequestHandler => {
  const handler: express.RequestHandler = async (req, res, next) => {
    try {
      // Validate ingredients parameter
      const ingredients = req.query.ingredients as string | undefined;
      
      if (!ingredients) {
        res.status(400).json({ error: 'Ingredients parameter is required' });
        return;
      }

      if (typeof ingredients !== 'string' || ingredients.trim().length === 0) {
        res.status(400).json({ error: 'Ingredients parameter must be a non-empty string' });
        return;
      }

      // Get API key from environment variable
      const apiKey = tryDecodeBase64(process.env.SPOONACULAR_API_KEY || '');
      
      if (!apiKey) {
        logger.error('SPOONACULAR_API_KEY environment variable is not set');
        res.status(500).json({ error: 'Failed to retrieve recipes from the API' });
        return;
      }

      // Call Spoonacular API to search recipes by ingredients
      const searchUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=10&apiKey=${apiKey}`;
      
      logger.info(`Searching recipes with ingredients: ${ingredients}`);
      
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        logger.error(`Spoonacular API search request failed with status: ${searchResponse.status}`);
        res.status(500).json({ error: 'Failed to retrieve recipes from the API' });
        return;
      }

      const searchResults = await searchResponse.json();
      
      if (!Array.isArray(searchResults)) {
        logger.error('Unexpected response format from Spoonacular API');
        res.status(500).json({ error: 'Failed to retrieve recipes from the API' });
        return;
      }

      // Fetch detailed information for each recipe
      const recipes: Recipe[] = [];
      
      for (const result of searchResults) {
        try {
          const recipeId = result.id;
          const detailUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;
          
          const detailResponse = await fetch(detailUrl);
          
          if (!detailResponse.ok) {
            logger.warn(`Failed to fetch details for recipe ${recipeId}`);
            continue;
          }

          const recipeDetail = await detailResponse.json();
          
          // Extract ingredients
          const ingredientsList: string[] = [];
          if (Array.isArray(recipeDetail.extendedIngredients)) {
            for (const ingredient of recipeDetail.extendedIngredients) {
              if (ingredient.original) {
                ingredientsList.push(ingredient.original);
              }
            }
          }

          // Extract instructions
          let instructions = '';
          if (recipeDetail.instructions) {
            instructions = recipeDetail.instructions;
          } else if (Array.isArray(recipeDetail.analyzedInstructions) && recipeDetail.analyzedInstructions.length > 0) {
            const steps = recipeDetail.analyzedInstructions[0].steps;
            if (Array.isArray(steps)) {
              instructions = steps.map((step: any) => `${step.number}. ${step.step}`).join(' ');
            }
          }

          const recipe: Recipe = {
            title: recipeDetail.title || '',
            ingredients: ingredientsList,
            instructions: instructions,
            image_url: recipeDetail.image || '',
            source_url: recipeDetail.sourceUrl || recipeDetail.spoonacularSourceUrl || '',
          };

          recipes.push(recipe);
        } catch (error) {
          logger.error(`Error processing recipe details: ${error}`);
          // Continue with next recipe
        }
      }

      const response: RecipesResponse = {
        recipes: recipes,
      };

      logger.info(`Successfully retrieved ${recipes.length} recipes`);
      res.status(200).json(response);
      return;
    } catch (e) {
      logger.error(`Error in searchRecipes handler: ${e}`);
      next(e);
    }
  };
  return handler;
};

export default searchRecipes;
