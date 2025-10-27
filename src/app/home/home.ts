import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, signal, inject } from '@angular/core';
import { Todo } from '@shared/models/todo';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ChipModule } from 'primeng/chip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { QueryService } from '@app/services/query.service';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, switchMap, timer } from 'rxjs';
import { ApiResponse } from '@shared/dtos/response';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputTextModule,
    RouterLink,
    ToastModule,
    ChipModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
  ],
  providers: [MessageService],
  styles: ``,
})
export class Home {
  private readonly httpClient = inject(HttpClient);
  private readonly messageService = inject(MessageService);
  protected readonly queryService = inject(QueryService);
  protected readonly titleService = inject(Title);
  protected readonly metaService = inject(Meta);
  protected readonly todos = signal<Todo[]>([]);
  protected readonly newTodoTitle = signal<string>('');
  protected readonly searchTerm = this.queryService.query('search');

  private seo() {
    this.titleService.setTitle('My angular app');
    this.metaService.updateTag({ name: 'description', content: 'Description of My angular app' });
    this.metaService.updateTag({ property: 'og:title', content: 'My angular app' });
  }

  constructor() {
    this.seo();
    // Setup search with conditional debouncing and switchMap
    toObservable(this.searchTerm)
      .pipe(
        distinctUntilChanged(), // Only emit when value actually changes
        switchMap((query) => {
          const hasQuery = (query as string).trim().length > 0;
          // If has search query, debounce; otherwise load immediately
          return hasQuery
            ? timer(300).pipe(switchMap(() => this.getTodosObservable(query as string)))
            : this.getTodosObservable(query as string);
        }),
        takeUntilDestroyed() // Auto cleanup when component destroys
      )
      .subscribe(this.resolveSubscription());
  }

  protected searchTermFn(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.queryService.update({ search: input.value });
  }

  /**
   * Get todos observable - returns Observable for use with switchMap
   */
  private getTodosObservable(query: string = '') {
    const params = query ? new URLSearchParams({ search: query }) : '';
    const url = `/api/todos${params ? '?' + params : ''}`;
    return this.httpClient.get<Todo[]>(url);
  }

  private resolveSubscription() {
    return {
      next: (todos: Todo[]) => {
        this.todos.set(todos);
      },
      error: (error: any) => {
        console.error('Error loading todos:', error);
        if (error instanceof HttpErrorResponse) {
          const { message } = error.error as ApiResponse<any>;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
          });
          return;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load todos',
        });
      },
    };
  }

  /**
   * Load todos - for manual calls (add, update, delete)
   */
  private loadTodos() {
    this.getTodosObservable('').subscribe(this.resolveSubscription());
  }

  addTodo() {
    const title = this.newTodoTitle().trim();
    if (!title) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please enter a todo title',
      });
      return;
    }

    this.httpClient
      .post<Todo>('/api/todos', { title, completed: false, isDeleted: false })
      .subscribe({
        next: () => {
          this.newTodoTitle.set('');
          this.loadTodos();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Todo added successfully',
          });
        },
        error: (error) => {
          console.error('Error adding todo:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add todo',
          });
        },
      });
  }

  toggleTodo(todo: Todo) {
    this.httpClient
      .put<Todo>(`/api/todos/${todo.id}`, { ...todo, completed: todo.completed })
      .subscribe({
        next: () => {
          this.loadTodos();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Todo updated successfully',
          });
        },
        error: (error) => {
          console.error('Error updating todo:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update todo',
          });
        },
      });
  }

  deleteTodo(id: number) {
    this.httpClient.delete(`/api/todos/${id}`).subscribe({
      next: () => {
        this.loadTodos();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Todo deleted successfully',
        });
      },
      error: (error) => {
        console.error('Error deleting todo:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete todo',
        });
      },
    });
  }

  get completedCount() {
    return this.todos().filter((t) => t.completed).length;
  }

  get activeCount() {
    return this.todos().filter((t) => !t.completed).length;
  }
}
