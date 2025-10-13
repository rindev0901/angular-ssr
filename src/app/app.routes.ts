import { Routes } from '@angular/router';
import { About } from './about/about';
import { Home } from './home/home';
import { Test } from './test/test';
import { Filter } from './filter/filter';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'about',
    component: About,
  },
  {
    path: 'test',
    component: Test,
  },
  {
    path: 'filter',
    component: Filter,
  },
];
