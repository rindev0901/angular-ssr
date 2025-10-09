import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
type Category = {
  key: string;
  name: string;
};

@Component({
  selector: 'app-test',
  imports: [CheckboxModule, FormsModule],
  templateUrl: './test.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Test {
  protected categories: Category[] = [
    { key: 'a', name: 'Accounting' },
    { key: 'b', name: 'Marketing' },
    { key: 'c', name: 'Production' },
    { key: 'd', name: 'Research' },
  ];

  protected selectedCategories: Category[] = [];
}
