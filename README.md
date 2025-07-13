# SkillSwap API

REST API для обмена навыками между пользователями на основе Nest.js, PostgreSQL и TypeORM.

---

## Описание

SkillSwap — это платформа, позволяющая пользователям обмениваться навыками. Пользователи могут создавать, просматривать, добавлять в избранное навыки, отправлять заявки на обмен, а также получать уведомления в реальном времени.

### Основные возможности:
- Регистрация и авторизация (JWT, refresh token)
- CRUD операции с навыками
- Заявки на обмен навыками
- Добавление навыков в избранное
- Категории навыков (включая подкатегории)
- Загрузка и удаление изображений (ограничение 2МБ)
- Уведомления через WebSocket
- Поддержка пагинации и фильтрации по категориям и ключевым словам
- Swagger документация
- Логирование запросов и ошибок
- Защита роутов через Guard'ы (роли: USER / ADMIN)

---

## Технологии

- **Backend**: Nest.js
- **База данных**: PostgreSQL + TypeORM
- **Аутентификация**: JWT (Access/Refresh Token)
- **WebSocket**: Уведомления в реальном времени
- **Файлы**: Multer для загрузки изображений
- **Документация**: Swagger
- **Логгирование**: Winston
- **Тестирование**: Jest (unit + e2e)
- **CI/CD**: GitHub Actions
- **Деплой**: Vercel / Railway / Render

---

## Требования к окружению

- Node.js v18.x
- npm или yarn
- PostgreSQL 14+
- Docker (опционально)
- Git

---

## Установка

### Установка зависимостей

bash
npm install

Создайте файл .env на основе .env.example: cp .env.example .env

Пример содержимого .env:
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=skillswap
JWT_SECRET=mysecretkey
JWT_EXPIRATION=3600


## Запуск проекта
### Локальный запуск: 
npm run start:dev

Через Docker (если используется): docker-compose up -d


## Линтер и форматтер
npm run lint
npm run format