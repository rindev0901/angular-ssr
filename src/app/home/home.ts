import { HttpClient } from '@angular/common/http';
import { Component, signal, inject, effect } from '@angular/core';
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
  protected readonly todos = signal<Todo[]>([]);
  protected newTodoTitle = signal<string>('');

  constructor() {
    effect(() => {
      this.loadTodos();
    });
  }

  loadTodos() {
    this.httpClient.get<Todo[]>('/api/todos').subscribe({
      next: (todos) => {
        this.todos.set(todos);
      },
      error: (error) => {
        console.error('Error loading todos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load todos',
        });
      },
    });
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
