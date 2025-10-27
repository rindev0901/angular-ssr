import { Component, computed, signal, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Todo } from '@shared/models/todo';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { ApiResponse } from '@shared/dtos/response';
import { Title, Meta } from '@angular/platform-browser';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-todo',
  templateUrl: './todo.html',
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
    SkeletonModule,
  ],
  providers: [MessageService],
})
export class TodoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly httpClient = inject(HttpClient);
  private readonly messageService = inject(MessageService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  protected readonly todo = signal<Todo | null>(null);
  protected readonly saving = signal<boolean>(false);
  protected readonly editMode = signal<boolean>(false);

  // Editable fields
  protected readonly editTitle = signal<string>('');
  protected readonly editCompleted = signal<boolean>(false);

  // Computed ID from route params
  private readonly idParam = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  protected readonly id = computed(() => this.idParam());

  private updateSEO(todo: Todo) {
    this.titleService.setTitle(`Todo: ${todo.title}`);
    this.metaService.updateTag({
      name: 'description',
      content: `Todo details for: ${todo.title}. Status: ${todo.completed ? 'Completed' : 'Pending'}`
    });
    this.metaService.updateTag({
      property: 'og:title',
      content: `Todo: ${todo.title}`
    });
  }

  constructor() {
    // Watch route param changes and load todo reactively
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.idParam.set(id);
          return this.httpClient.get<Todo>(`/api/todos/${id}`);
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: (todo) => {
          this.todo.set(todo);
          this.editTitle.set(todo.title);
          this.editCompleted.set(todo.completed);
          this.updateSEO(todo);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading todo:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load todo',
          });
        },
      });
  }

  protected toggleEditMode() {
    const currentMode = this.editMode();
    if (currentMode) {
      // Cancel edit - reset to original values
      const currentTodo = this.todo();
      if (currentTodo) {
        this.editTitle.set(currentTodo.title);
        this.editCompleted.set(currentTodo.completed);
      }
    }
    this.editMode.set(!currentMode);
  }

  protected saveTodo() {
    const currentTodo = this.todo();
    if (!currentTodo) return;

    this.saving.set(true);
    this.httpClient
      .put<ApiResponse<Todo>>(`/api/todos/${currentTodo.id}`, {
        title: this.editTitle(),
        completed: this.editCompleted(),
      })
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.todo.set(response.data);
            this.editMode.set(false);
          }
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Todo updated successfully',
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error updating todo:', error);
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update todo',
          });
        },
      });
  }

  protected deleteTodo() {
    const currentTodo = this.todo();
    if (!currentTodo) return;

    if (!confirm(`Are you sure you want to delete "${currentTodo.title}"?`)) {
      return;
    }

    this.httpClient.delete(`/api/todos/${currentTodo.id}`).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Todo deleted successfully',
        });
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting todo:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete todo',
        });
      },
    });
  }

  protected toggleCompleted() {
    const currentTodo = this.todo();
    if (!currentTodo) return;

    this.httpClient
      .put<ApiResponse<Todo>>(`/api/todos/${currentTodo.id}`, {
        completed: !currentTodo.completed,
      })
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.todo.set(response.data);
            this.editCompleted.set(response.data.completed);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Todo status updated',
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error updating todo status:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update todo status',
          });
        },
      });
  }
}
