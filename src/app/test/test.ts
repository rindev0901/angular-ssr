import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { LoggerService } from '@app/services/logger.service';

type Category = {
  key: string;
  name: string;
};

@Component({
  selector: 'app-test',
  imports: [CheckboxModule],
  templateUrl: './test.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Test {
  protected logger = inject(LoggerService);

  protected readonly categories: readonly Category[] = [
    { key: 'a', name: 'Accounting' },
    { key: 'b', name: 'Marketing' },
    { key: 'c', name: 'Production' },
    { key: 'd', name: 'Research' },
  ] as const;

  protected selectedCategories = signal<Category[]>([]);

  // Computed signal để check trạng thái selected - tối ưu performance
  protected isSelected = computed(() => {
    const selected = this.selectedCategories();
    return (category: Category) => selected.some((c) => c.key === category.key);
  });

  // Computed signal để hiển thị danh sách đã chọn - chỉ re-render khi thay đổi
  protected hasSelectedCategories = computed(() => this.selectedCategories().length > 0);

  protected toggleCategory(category: Category) {

    this.selectedCategories.update((prevState) => {
      const isCurrentlySelected = prevState.some((c) => c.key === category.key);
      const newState = isCurrentlySelected
        ? prevState.filter((c) => c.key !== category.key)
        : [...prevState, category];

      return newState;
    });
  }
}
