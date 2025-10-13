import { Component, effect, inject, signal } from '@angular/core';
import { FilterMatchMode, FilterService, SelectItem } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { CarService } from '@app/services/car.service';
import { LoggerService } from '@app/services/logger.service';

export interface Car {
  id?: number;
  vin?: string;
  year?: number;
  brand?: string;
  color?: string;
  price?: number;
  saleDate?: Date;
}

export interface Product {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  inventoryStatus?: string;
  category?: string;
  image?: string;
  rating?: number;
}

@Component({
  selector: 'filter-service-table',
  templateUrl: './filter.html',
  standalone: true,
  imports: [TableModule, CommonModule],
})
export class Filter {
  private readonly filterService = inject(FilterService);
  private readonly carService = inject(CarService);
  protected readonly logger = inject(LoggerService);

  protected cars = signal<Car[]>([]);

  protected cols = signal<Array<{ field: string; header: string }>>([]);

  protected matchModeOptions = signal<SelectItem[]>([]);

  constructor() {
    effect(() => {
      const customFilterName = 'custom-equals';

      this.filterService.register(customFilterName, (value: any, filter: any): boolean => {
        // Filter is empty - show all rows
        if (filter === undefined || filter === null || filter === '' || (typeof filter === 'string' && filter.trim() === '')) {
          return true;
        }

        // Value is empty - hide row when filter has value
        if (value === undefined || value === null || value === '') {
          return false;
        }

        // Compare values as strings
        return value.toString().toLowerCase() === filter.toString().toLowerCase();
      });

      this.cols.set([
        { field: 'year', header: 'Year' },
        { field: 'brand', header: 'Brand' },
        { field: 'color', header: 'Color' },
        { field: 'vin', header: 'Vin' },
      ]);

      this.matchModeOptions.set([
        { label: 'Custom Equals', value: customFilterName },
        { label: 'Starts With', value: FilterMatchMode.STARTS_WITH },
        { label: 'Contains', value: FilterMatchMode.CONTAINS },
      ]);

      this.carService.getCarsMedium().then((cars) => {
        this.cars.set(cars);
      });
    });
  }
}
