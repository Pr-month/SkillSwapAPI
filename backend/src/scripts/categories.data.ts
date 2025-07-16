import { Category } from '../categories/entities/category.entity';

const rootCategories: Record<string, Category> = {
  music: {
    name: 'Муз. Инструменты',
    parent: null,
  },
  electronics: {
    name: 'Электроника',
    parent: null,
  },
  creativity: {
    name: 'Творчество и искусство',
    parent: null,
  },
  it: {
    name: 'IT и программирование',
    parent: null,
  },
  design: {
    name: 'Дизайн и UX/UI',
    parent: null,
  },
  finance: {
    name: 'Финансы и бухгалтерия',
    parent: null,
  },
  marketing: {
    name: 'Маркетинг и продажи',
    parent: null,
  },
  education: {
    name: 'Образование и обучение',
    parent: null,
  },
  languages: {
    name: 'Языки',
    parent: null,
  },
};

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

  // Творчество и искусство
  {
    name: 'Управление командой',
    parent: rootCategories.creativity,
  },
  {
    name: 'Маркетинг и реклама',
    parent: rootCategories.creativity,
  },
  {
    name: 'Продажи и переговоры',
    parent: rootCategories.creativity,
  },
  {
    name: 'Личный бренд',
    parent: rootCategories.creativity,
  },
  {
    name: 'Резюме и собеседование',
    parent: rootCategories.creativity,
  },
  {
    name: 'Тайм-менеджмент',
    parent: rootCategories.creativity,
  },
  {
    name: 'Проектное управление',
    parent: rootCategories.creativity,
  },
  {
    name: 'Предпринимательство',
    parent: rootCategories.creativity,
  },

  // IT и программирование
  {
    name: 'Frontend',
    parent: rootCategories.it,
  },
  {
    name: 'Backend',
    parent: rootCategories.it,
  },
  {
    name: 'DevOps',
    parent: rootCategories.it,
  },
  {
    name: 'Мобильная разработка',
    parent: rootCategories.it,
  },
  {
    name: 'GameDev',
    parent: rootCategories.it,
  },

  // Дизайн и UX/UI
  {
    name: 'Графический дизайн',
    parent: rootCategories.design,
  },
  {
    name: 'UX/UI',
    parent: rootCategories.design,
  },
  {
    name: 'Motion-дизайн',
    parent: rootCategories.design,
  },
  {
    name: 'Web-дизайн',
    parent: rootCategories.design,
  },

  // Финансы и бухгалтерия
  {
    name: 'Личная финансовая грамотность',
    parent: rootCategories.finance,
  },
  {
    name: 'Бухгалтерия и налоги',
    parent: rootCategories.finance,
  },
  {
    name: 'Инвестиции',
    parent: rootCategories.finance,
  },

  // Маркетинг и продажи
  {
    name: 'Таргетинг',
    parent: rootCategories.marketing,
  },
  {
    name: 'Контекстная реклама',
    parent: rootCategories.marketing,
  },
  {
    name: 'SEO',
    parent: rootCategories.marketing,
  },
  {
    name: 'Email-маркетинг',
    parent: rootCategories.marketing,
  },

  // Образование и обучение
  {
    name: 'Методика преподавания',
    parent: rootCategories.education,
  },
  {
    name: 'Онлайн-курсы',
    parent: rootCategories.education,
  },
  {
    name: 'Педагогика',
    parent: rootCategories.education,
  },

  // Языки
  {
    name: 'Английский язык',
    parent: rootCategories.languages,
  },
  {
    name: 'Немецкий язык',
    parent: rootCategories.languages,
  },
  {
    name: 'Французский язык',
    parent: rootCategories.languages,
  },
  {
    name: 'Испанский язык',
    parent: rootCategories.languages,
  },
  {
    name: 'Китайский язык',
    parent: rootCategories.languages,
  },
  {
    name: 'Русский язык',
    parent: rootCategories.languages,
  },
];