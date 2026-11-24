import { Recipe } from '@/types/recipe';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const CACHE_KEY = 'recetario_api_cache';

// Convierte el objeto crudo de la API a nuestra interfaz limpia
function mapMealToRecipe(meal: Record<string, string | null>): Recipe {
  const ingredients: string[] = [];

  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (ing) {
      ingredients.push(measure ? `${measure} ${ing}` : ing);
    }
  }

  const rawInstructions = meal.strInstructions || '';
  const instructions = rawInstructions
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter((step) => step.length > 0);

  return {
    id: meal.idMeal || '',
    title: meal.strMeal || 'Sin título',
    category: meal.strCategory || 'General',
    area: meal.strArea || 'Internacional',
    image: meal.strMealThumb || '',
    ingredients,
    instructions,
  };
}

// Buscar recetas por nombre (o traer iniciales si query está vacío)
export async function searchRecipes(query: string = ''): Promise<{ recipes: Recipe[]; offline: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Error en la respuesta de la API');

    const data = await res.json();
    const meals = data.meals || [];
    const mapped = meals.map(mapMealToRecipe);

    // Guardar en caché local para uso offline
    if (typeof window !== 'undefined' && mapped.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
    }

    return { recipes: mapped, offline: false };
  } catch {
    // Si no hay internet, leer del respaldo en localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: Recipe[] = JSON.parse(cached);
        const filtered = query
          ? parsed.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
          : parsed;
        return { recipes: filtered, offline: true };
      }
    }
    return { recipes: [], offline: true };
  }
}

// Obtener categorías disponibles desde la API
export async function getCategories(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/list.php?c=list`);
    const data = await res.json();
    return (data.meals || []).map((c: { strCategory: string }) => c.strCategory);
  } catch {
    return [];
  }
}

// Obtener una receta por su ID
export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const res = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    const data = await res.json();
    if (!data.meals || data.meals.length === 0) return null;
    return mapMealToRecipe(data.meals[0]);
  } catch {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: Recipe[] = JSON.parse(cached);
        return parsed.find((r) => r.id === id) || null;
      }
    }
    return null;
  }
}