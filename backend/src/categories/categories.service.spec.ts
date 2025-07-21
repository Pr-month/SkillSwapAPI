import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { getRepositoryToken } from '@nestjs/typeorm';

import { IsNull } from 'typeorm';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;

  let categoryRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneOrFail: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    categoryRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: categoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('успешное создание категории с родителем', async () => {
      const createCategoryDtoInput: CreateCategoryDto = {
        name: 'Посадка огурцов',
        parent: '1231',
      };

      const expectedSavedCategory = {
        id: '1',
        name: 'Посадка огурцов',
        parent: { id: '1231' },
        children: [],
      };

      categoryRepository.save.mockResolvedValue(expectedSavedCategory);
      categoryRepository.create.mockReturnValue({
        ...createCategoryDtoInput,
        parent: { id: createCategoryDtoInput.parent },
      });
      const result = await service.create(createCategoryDtoInput);
      expect(categoryRepository.save).toHaveBeenCalledWith({
        ...createCategoryDtoInput,
        parent: { id: createCategoryDtoInput.parent },
      });
      expect(result).toEqual(expectedSavedCategory);
    });

    it('успешное создание корневой категории (без родителя)', async () => {
      const createRootCategoryDto: CreateCategoryDto = {
        name: 'Новая корневая категория',
        parent: undefined,
      };
      const expectedRootSavedCategory: Category = {
        id: '1',
        name: 'Новая корневая категория',
        parent: undefined,
        children: [],
      };
      categoryRepository.create.mockReturnValue(createRootCategoryDto);
      categoryRepository.save.mockResolvedValue(expectedRootSavedCategory);

      const result = await service.create(createRootCategoryDto);
      expect(categoryRepository.save).toHaveBeenCalledWith(
        createRootCategoryDto,
      );
      expect(result).toEqual(expectedRootSavedCategory);
    });

    // it('успешное создание категории с указанными детьми', async () => {
    //   const createCategoryWithChildrenDto: CreateCategoryDto = {
    //     name: 'Подкатегория с детьми',
    //     parent: undefined,
    //     children: ['1', '2'],
    //   };

    //   const expectedSavedCategoryWithChildren = {
    //     id: '01',
    //     name: 'Подкатегория с детьми',
    //     parent: undefined,
    //     children: [{ id: '1' }, { id: '2' }],
    //   };

    //   categoryRepository.save.mockResolvedValue(
    //     expectedSavedCategoryWithChildren,
    //   );

    //   const result = await service.create(createCategoryWithChildrenDto);
    //   expect(categoryRepository.save).toHaveBeenCalledWith({
    //     ...createCategoryWithChildrenDto,
    //     parent: undefined,
    //     children: [{ id: '1' }, { id: '2' }],
    //   });
    //   expect(result).toEqual(expectedSavedCategoryWithChildren);
    // });
  });

  describe('findAll', () => {
    it('должен возвращать массив корневых категорий с их детьми', async () => {
      const allMockCategoriesFromRepo: Category[] = [
        {
          id: '1',
          name: 'Электроника',
          parent: null,
          children: [],
        } as Category,
        {
          id: '1-1',
          name: 'Смартфоны',
          parent: { id: '1', name: 'Электроника' } as Category, // Ссылка на родителя
          children: [],
        } as Category,
        {
          id: '2',
          name: 'Одежда',
          parent: null,
          children: [],
        } as Category,
        {
          id: '2-1',
          name: 'Футболки',
          parent: { id: '2', name: 'Одежда' } as Category, // Ссылка на родителя
          children: [],
        } as Category,
      ];

      const expectedOnlyRootCategories: Category[] = [
        allMockCategoriesFromRepo[0],
        allMockCategoriesFromRepo[2],
      ];

      categoryRepository.find.mockResolvedValue(expectedOnlyRootCategories);

      const result = await service.findAll();
      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { parent: IsNull() },
        relations: ['children'],
      });
      expect(result).toEqual(expectedOnlyRootCategories);
    });

    it('должен возвращать пустой массив, если категории не найдены', async () => {
      categoryRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { parent: IsNull() },
        relations: ['children'],
      });
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const existingCategory: Category = {
      id: '1',
      name: 'Старая категория',
      parent: null,
      children: [],
    };

    const updatedCategory: Category = {
      id: '1',
      name: 'Обновленная категория',
      parent: null,
      children: [],
    };

    it('должен успешно обновить существующую категорию', async () => {
      const updateDto: UpdateCategoryDto = { name: 'Обновленная категория' };

      categoryRepository.findOneOrFail.mockResolvedValue(existingCategory);
      categoryRepository.save.mockResolvedValue(updatedCategory);

      const result = await service.update(existingCategory.id!, updateDto);

      expect(categoryRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: existingCategory.id },
        relations: ['parent', 'children'],
      });
      expect(categoryRepository.save).toHaveBeenCalledWith(updatedCategory);
      expect(result).toEqual(updatedCategory);
    });

    it('должен успешно обновить родительскую категорию на заданный ID', async () => {
      const parentId = '10';
      const updateDto: UpdateCategoryDto = {
        name: 'Категория для обновления',
        parent: parentId,
      };

      const categoryFoundByFindOne: Category = {
        id: '1',
        name: 'Категория для обновления',
        parent: null,
        children: [],
      };

      const expectedCategoryAfterSave: Category = {
        id: '1',
        name: 'Категория для обновления',
        parent: { id: parentId } as Category,
        children: [],
      };

      categoryRepository.findOneOrFail.mockResolvedValue(
        categoryFoundByFindOne,
      );
      categoryRepository.save.mockResolvedValue(expectedCategoryAfterSave);

      const result = await service.update(
        categoryFoundByFindOne.id!,
        updateDto,
      );

      expect(categoryRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: categoryFoundByFindOne.id },
        relations: ['parent', 'children'],
      });

      expect(categoryRepository.save).toHaveBeenCalledWith(
        expectedCategoryAfterSave,
      );
      expect(result).toEqual(expectedCategoryAfterSave);
    });

    it('должен успешно установить родительскую категорию в null', async () => {
      const categoryWithExistingParent: Category = {
        id: '1',
        name: 'Категория с родителем',
        parent: { id: '5', name: 'Существующий родитель' } as Category,
        children: [],
      };
      const updateDto: UpdateCategoryDto = {
        name: 'Категория с родителем',
        parent: null,
      };

      const expectedCategoryAfterSave: Category = {
        id: '1',
        name: 'Категория с родителем',
        parent: null,
        children: [],
      };

      categoryRepository.findOneOrFail.mockResolvedValue(
        categoryWithExistingParent,
      );
      categoryRepository.save.mockResolvedValue(expectedCategoryAfterSave);

      const result = await service.update(
        categoryWithExistingParent.id!,
        updateDto,
      );

      expect(categoryRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: categoryWithExistingParent.id },
        relations: ['parent', 'children'],
      });

      expect(categoryRepository.save).toHaveBeenCalledWith(
        expectedCategoryAfterSave,
      );
      expect(result).toEqual(expectedCategoryAfterSave);
    });

    // it('должен успешно обновить дочерние категории', async () => {
    //   const childIds = ['20', '21'];
    //   const updateDto: UpdateCategoryDto = { children: childIds };

    //   const categoryFoundByFindOne: Category = {
    //     id: '1',
    //     name: 'Категория без детей',
    //     parent: null,
    //     children: [],
    //   };

    //   const categoryToSaveWithNewChildren: Category = {
    //     id: '1',
    //     name: 'Категория без детей',
    //     parent: null,
    //     children: [{ id: '20' } as Category, { id: '21' } as Category],
    //   };

    //   const expectedCategoryAfterSave: Category = {
    //     id: '1',
    //     name: 'Категория без детей',
    //     parent: null,
    //     children: [{ id: '20' } as Category, { id: '21' } as Category],
    //   };

    //   categoryRepository.findOneOrFail.mockResolvedValue(
    //     categoryFoundByFindOne,
    //   );
    //   categoryRepository.save.mockResolvedValue(expectedCategoryAfterSave);

    //   const result = await service.update(
    //     categoryFoundByFindOne.id!,
    //     updateDto,
    //   );

    //   expect(categoryRepository.findOneOrFail).toHaveBeenCalledWith({
    //     where: { id: categoryFoundByFindOne.id },
    //     relations: ['parent', 'children'],
    //   });
    //   expect(categoryRepository.save).toHaveBeenCalledWith(
    //     categoryToSaveWithNewChildren,
    //   );
    //   expect(result).toEqual(expectedCategoryAfterSave);
    // });

    it('должен выбросить ошибку NotFoundException, если категория не найдена', async () => {
      const nonExistentId = 'id';
      const updateDto: UpdateCategoryDto = { name: 'Обновленная категория' };

      categoryRepository.findOneOrFail.mockRejectedValue(
        new NotFoundException(`Category with ID "${nonExistentId}" not found`),
      );

      await expect(service.update(nonExistentId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(categoryRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: nonExistentId },
        relations: ['parent', 'children'],
      });
      expect(categoryRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('должен успешно удалить категорию', async () => {
      const deleteId = '1';
      const answer = { message: `Категория с id 1 удалена` };

      categoryRepository.delete.mockResolvedValue(answer);
      const result = await service.remove(deleteId);

      expect(categoryRepository.delete).toHaveBeenCalledWith(deleteId);
      expect(result).toEqual(answer);
    });
  });
});
