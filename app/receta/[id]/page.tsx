'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, CheckCircle2, Circle, Heart, Sun, Trash2 } from 'lucide-react';
import { Recipe } from '@/types/recipe';
import { getRecipeById } from '@/lib/recipesApi';

interface ToastData {
  message: string;
  type: 'add' | 'remove';
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [keepAwake, setKeepAwake] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFav, setIsFav] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('recetario_fav_recipes');
    if (!saved) return false;
    try {
      const list: Recipe[] = JSON.parse(saved);
      return list.some((r) => r.id === id);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let active = true;
    getRecipeById(id).then((data) => {
      if (!active) return;
      setRecipe(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if (keepAwake && 'wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((wl) => {
          wakeLock = wl;
        })
        .catch(() => setKeepAwake(false));
    }
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [keepAwake]);

  const showToast = (message: string, type: 'add' | 'remove') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const handleHeartClick = () => {
    if (!recipe) return;

    if (isFav) {
      setConfirmRemove(true);
      return;
    }

    const saved = localStorage.getItem('recetario_fav_recipes');
    const list: Recipe[] = saved ? JSON.parse(saved) : [];
    const updated = [...list, recipe];
    localStorage.setItem('recetario_fav_recipes', JSON.stringify(updated));
    setIsFav(true);
    showToast('Se agregó a favoritos', 'add');
  };

  const confirmRemoveFavorite = () => {
    if (!recipe) return;
    const saved = localStorage.getItem('recetario_fav_recipes');
    const list: Recipe[] = saved ? JSON.parse(saved) : [];
    const updated = list.filter((r) => r.id !== recipe.id);
    localStorage.setItem('recetario_fav_recipes', JSON.stringify(updated));
    setIsFav(false);
    setConfirmRemove(false);
    showToast('Se quitó de favoritos', 'remove');
  };

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">
        Cargando receta...
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3">
        <p className="text-stone-600">No se pudo cargar la receta.</p>
        <Link href="/" className="text-orange-600 font-semibold hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <div className="relative h-64 sm:h-80 w-full bg-stone-800">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute top-4 inset-x-4 max-w-3xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="bg-white/95 backdrop-blur-md p-2.5 rounded-full text-stone-800 shadow-md active:scale-95 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={handleHeartClick}
            aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className="bg-white/95 backdrop-blur-md p-2.5 rounded-full shadow-md active:scale-90 transition cursor-pointer"
          >
            <Heart
              className={`w-5 h-5 transition-transform duration-200 ${
                isFav ? 'fill-red-500 text-red-500 scale-110' : 'text-stone-800'
              }`}
            />
          </button>
        </div>

        <div className="absolute bottom-4 inset-x-4 max-w-3xl mx-auto text-white">
          <span className="bg-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {recipe.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">{recipe.title}</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-5 space-y-6">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium text-stone-600">
            <Globe className="w-4 h-4 text-orange-600" /> Origen: {recipe.area}
          </span>
          <button
            onClick={() => setKeepAwake(!keepAwake)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer ${
              keepAwake ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'
            }`}
          >
            <Sun className="w-4 h-4" />
            {keepAwake ? 'Pantalla activa' : 'Modo cocina'}
          </button>
        </div>

        <section className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm">
          <h2 className="text-lg font-bold mb-3">Ingredientes</h2>
          <ul className="divide-y divide-stone-100">
            {recipe.ingredients.map((item, idx) => {
              const checked = checkedIngredients.includes(idx);
              return (
                <li
                  key={idx}
                  onClick={() => toggleIngredient(idx)}
                  className="py-3 flex items-center gap-3 cursor-pointer"
                >
                  {checked ? (
                    <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-300 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      checked ? 'line-through text-stone-400' : 'text-stone-700'
                    }`}
                  >
                    {item}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Preparación</h2>
          <div className="space-y-3">
            {recipe.instructions.map((step, idx) => {
              const done = completedSteps.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`p-3.5 rounded-xl border cursor-pointer flex gap-3.5 ${
                    done
                      ? 'bg-stone-50 border-stone-200 opacity-60'
                      : 'bg-orange-50/40 border-orange-100'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      done ? 'bg-stone-300 text-white' : 'bg-orange-600 text-white'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <p
                    className={`text-sm leading-relaxed ${
                      done ? 'line-through text-stone-500' : 'text-stone-800'
                    }`}
                  >
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modal de confirmación para quitar de favoritos */}
      {confirmRemove && (
        <div
          onClick={() => setConfirmRemove(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-stone-200"
          >
            <h3 className="text-base font-bold text-stone-900">¿Quitar de favoritos?</h3>
            <p className="text-sm text-stone-600 mt-1.5">
              ¿Deseas quitar <span className="font-semibold text-stone-900">{recipe.title}</span> de tus recetas favoritas?
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemoveFavorite}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
              >
                Sí, quitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación Toast flotante */}
      {toast && (
        <div className="fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-white text-xs sm:text-sm font-medium ${
              toast.type === 'add' ? 'bg-stone-900' : 'bg-red-600'
            }`}
          >
            {toast.type === 'add' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Trash2 className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}