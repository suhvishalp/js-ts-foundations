/**
 * REFERENCE FILE (React 19). Not compiled by this project: see ../README.md.
 *
 * The same RequestState<Product[]> that src/ui/render.ts switches over, now held in React state.
 * The AbortController from Session 4 moves into the effect's cleanup function.
 */
import { useEffect, useState } from 'react';
import { isAbortError, toApiError } from '../../src/api/client';
import { getCatalog } from '../../src/api/products';
import type { CatalogQuery, Product, RequestState } from '../../src/types';

export function useProducts({ q, category }: CatalogQuery): RequestState<Product[]> {
  // The type argument matters: without it, useState would infer { status: string } from the
  // initial value, and 'success' with data could never be stored.
  const [state, setState] = useState<RequestState<Product[]>>({ status: 'idle' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    getCatalog({ q, category }, { signal: controller.signal })
      .then((data) => setState({ status: 'success', data }))
      .catch((err: unknown) => {
        if (isAbortError(err)) return; // this effect was cleaned up: a newer query owns the state
        setState({ status: 'error', error: toApiError(err) });
      });

    // Cleanup runs before the next effect (q or category changed) and on unmount.
    return () => controller.abort();
  }, [q, category]);

  return state;
}

/*
 * Using it: the component narrows on `status` exactly like renderProducts does.
 *
 *   const state = useProducts({ q, category });
 *   switch (state.status) {
 *     case 'idle':    return <p className="state">Start typing…</p>;
 *     case 'loading': return <Skeletons count={8} />;
 *     case 'error':   return <ErrorState error={state.error} />;       // state.error: ApiError
 *     case 'success': return <ProductGrid products={state.data} />;    // state.data: Product[]
 *     default:        return assertNever(state);
 *   }
 *
 * In production, a data library such as TanStack Query wraps this exact pattern
 * (state + abort + cache) behind a hook; its types look just like RequestState.
 */
