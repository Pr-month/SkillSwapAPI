import { Category } from '../category/entities/category.entity';
import { SeedSimple } from '../utils/seedingSimple';
import { categories } from './categories.data';

const usersSeed = new SeedSimple(
  Category,
  {
    success: 'Данные о категориях загружены',
  },
  {
    clearBefore: true,
  },
);

usersSeed.run(async (repository) => {
  const parentsMap = new Map<string, Category>();

  for (const category of categories) {
    if (category.parent == null) {
      const entity = await repository.save(repository.create(category));
      parentsMap.set(entity.name, entity);
    } else {
      const payload: Category = {
        ...category,
        parent: parentsMap.get(category.parent?.name),
      };

      const entity = await repository.save(repository.create(payload));
      parentsMap.set(entity.name, entity);
    }
  }
});
