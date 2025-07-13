import { Category } from '../category/entities/category.entity';

const rootCategories: Record<string, Category> = {
  music: {
    name: 'Муз. Инструменты',
    parent: null,
  },
  electronics: {
    name: 'Электроника',
    parent: null,
  },
};

Object.values(rootCategories);

export const categories: Array<Category> = [
  ...Object.values(rootCategories),
  {
    name: 'Барабан',
    parent: rootCategories.music,
  },
  {
    name: 'Гитара',
    parent: rootCategories.music,
  },
  {
    name: 'Ноутбук',
    parent: rootCategories.electronics,
  },
  {
    name: 'ПК',
    parent: rootCategories.electronics,
  },
];
