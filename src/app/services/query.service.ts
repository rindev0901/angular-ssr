import { Injectable, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Params, QueryParamsHandling, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class QueryService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Convert queryParams observable to signal
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  // Computed signal for easy access to all params
  readonly params = computed(() => this.queryParams());

  constructor() {
    // Optional: Log query param changes
    effect(() => {
      const query = this.params();
      const queryEntries = Object.entries(query);

      if (queryEntries.length) {
        console.log('Query params changed:', query);
      } else {
        console.log('No query params');
      }

      queryEntries.forEach(([key, value]) => {
        if (!value) this.clear([key]);
      });
    });
  }

  /**
   * Update query parameters (merge with existing)
   */
  update(params: Record<string, string | number>, typeHandling: QueryParamsHandling = 'merge') {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: typeHandling,
    });
  }

  /**
   * Clear specific query parameter keys
   */
  clear(keys: string[]) {
    const newParams = { ...this.queryParams() };
    keys.forEach((k) => delete newParams[k]);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams,
    });
  }

  /**
   * Get a single query parameter as a signal
   * Returns empty string if not found
   */
  query(key: string) {
    return computed(() => {
      const params = this.queryParams();
      return (params[key] as string) ?? '';
    });
  }

  /**
   * Get query parameter value directly (non-reactive)
   */
  getValue(key: string): string {
    const params = this.queryParams();
    return (params[key] as string) ?? '';
  }

  /**
   * Check if a query parameter exists
   */
  has(key: string) {
    return computed(() => key in this.queryParams());
  }

  /**
   * Get all query parameters as a signal
   */
  getAll() {
    return this.params;
  }

  /**
   * Set query parameters (replace all)
   */
  set(params: Record<string, string | number>) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
    });
  }

  /**
   * Remove all query parameters
   */
  clearAll() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }
}
