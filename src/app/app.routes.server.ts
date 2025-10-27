import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { Todo } from '@shared/models/todo';
import { firstValueFrom } from 'rxjs';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'todo/:id',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client, // Fallback to CSR if not prerendered
    async getPrerenderParams() {
      const httpClient = inject(HttpClient);
      const todos = await firstValueFrom(httpClient.get<Todo[]>('/api/todos'));
      // This function returns an array of objects representing prerendered posts at the paths:
      // Map todos to return their IDs for prerendering
      return todos.map((todo) => ({ id: todo.id.toString() }));
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
