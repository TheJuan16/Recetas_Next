'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Heart, ChefHat, Compass, X, WifiOff, Globe, CheckCircle2, Trash2 } from 'lucide-react';
import { Recipe } from '@/types/recipe';
import { searchRecipes, getCategories } from '@/lib/recipesApi';

interface ToastData {
  message: string;
  type: 'add' | 'remove';
}

export default function RecipeApp() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todas']);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'explore' | 'favorites'>('explore');
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [favorites, setFavorites] = useState<Recipe[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('recetario_fav_recipes');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    getCategories().then((cats) => {
      if (cats.length > 0) setCategories(['Todas', ...cats]);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const { recipes: results, offline } = await searchRecipes(search);
      setRecipes(results);
      setIsOffline(offline);
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const showToast = (message: string, type: 'add' | 'remove') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const toggleFavorite = (e: React.MouseEvent, recipe: Recipe) => {
    e.preventDefault();
    e.stopPropagation();

    const exists = favorites.some((item) => item.id === recipe.id);
    const updated = exists
      ? favorites.filter((item) => item.id !== recipe.id)
      : [...favorites, recipe];

    setFavorites(updated);
    localStorage.setItem('recetario_fav_recipes', JSON.stringify(updated));

    if (exists) {
      showToast(`"${recipe.title}" se quitó de favoritos`, 'remove');
    } else {
      showToast(`"${recipe.title}" se agregó a favoritos`, 'add');
    }
  };

  const baseList = activeTab === 'explore' ? recipes : favorites;
  const displayedRecipes = baseList.filter(
    (r) => selectedCategory === 'Todas' || r.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 pt-4 pb-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-orange-600 text-white p-2 rounded-xl shadow-sm">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Mi Recetario</h1>
                <p className="text-xs text-stone-500">
                  {activeTab === 'explore' ? 'TheMealDB API' : `${favorites.length} guardadas`}
                </p>
              </div>
            </div>

            {isOffline && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
                <WifiOff className="w-3.5 h-3.5" /> Modo Offline
              </span>
            )}
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar receta (ej. chicken, pasta, beef)..."
              className="w-full bg-stone-100 text-sm rounded-xl pl-10 pr-9 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categorías */}
          <div className="flex gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid de Recetas */}
      <main className="max-w-5xl mx-auto px-4 pt-5">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-64 animate-pulse border border-stone-200" />
            ))}
          </div>
        ) : displayedRecipes.length === 0 ? (
          <div className="text-center py-16 text-stone-500 text-sm">
            {activeTab === 'favorites'
              ? 'Aún no tienes recetas en favoritos.'
              : 'No se encontraron recetas para esta búsqueda.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRecipes.map((recipe) => {
              const isFav = favorites.some((f) => f.id === recipe.id);
              return (
                <Link
                  key={recipe.id}
                  href={`/receta/${recipe.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-md transition flex flex-col"
                >
                  <div className="relative h-44 w-full bg-stone-200 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-stone-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      {recipe.category}
                    </span>

                    {/* Botón de corazón en la esquina superior derecha */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, recipe)}
                      aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      className="absolute top-3 right-3 z-10 bg-white/95 hover:bg-white backdrop-blur-sm p-2.5 rounded-full shadow-md active:scale-90 transition cursor-pointer"
                    >
                      <Heart
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isFav
                            ? 'fill-red-500 text-red-500 scale-110'
                            : 'text-stone-600 hover:text-red-500'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h2 className="font-bold text-base text-stone-900 group-hover:text-orange-600 transition line-clamp-1">
                      {recipe.title}
                    </h2>
                    <div className="flex items-center justify-between text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-orange-600" />
                        Cocina {recipe.area}
                      </span>
                      <span className="text-orange-600 font-medium">
                        {recipe.ingredients.length} ingredientes
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Notificación Toast flotante */}
      {toast && (
        <div className="fixed bottom-20 inset-x-4 z-50 flex justify-center pointer-events-none">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-white text-xs sm:text-sm font-medium max-w-md transition-all ${
              toast.type === 'add' ? 'bg-stone-900' : 'bg-red-600'
            }`}
          >
            {toast.type === 'add' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Trash2 className="w-4 h-4 text-white shrink-0" />
            )}
            <span className="line-clamp-1">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Barra inferior */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200 px-6 py-2">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl cursor-pointer ${
              activeTab === 'explore' ? 'text-orange-600' : 'text-stone-400'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Explorar</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl relative cursor-pointer ${
              activeTab === 'favorites' ? 'text-orange-600' : 'text-stone-400'
            }`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-orange-600' : ''}`} />
            <span className="text-[11px] font-semibold">Favoritos</span>
            {favorites.length > 0 && (
              <span className="absolute top-0.5 right-3 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}