# Safe Journal - Тесты

Этот документ описывает тестовое покрытие проекта Safe Journal.

## Структура тестов

```
src/
├── services/
│   ├── crypto.test.ts      # Тесты криптографии
│   ├── storage.test.ts     # Тесты хранилища (IndexedDB)
│   ├── auth.test.ts        # Тесты аутентификации
│   └── analytics.test.ts   # Тесты аналитики
├── hooks/
│   ├── useAuth.test.tsx    # Тесты хука аутентификации
│   └── useEntries.test.tsx # Тесты хука записей
└── test-setup.ts           # Настройка тестового окружения
```

## Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск в watch режиме
npm test -- --watch

# Запуск конкретного файла
npm test -- src/services/crypto.test.ts

# Запуск с покрытием
npm test -- --coverage
```

## Покрытие

### Crypto Service (11 тестов)
- ✅ Генерация соли
- ✅ Деривация ключа (PBKDF2)
- ✅ Шифрование/дешифрование (AES-GCM)
- ✅ Верификация пароля
- ✅ Hex конвертация
- ✅ Шифрование/дешифрование Blob (аудио)

### Storage Service (22 теста)
- ✅ CRUD операции для настроек
- ✅ CRUD операции для записей
- ✅ CRUD операции для аудио
- ✅ Статистика
- ✅ Инициализация приложения
- ✅ Кнопка паники (удаление всех данных)

### Auth Service (20 тестов)
- ✅ Управление сессией
- ✅ Первичная настройка пароля
- ✅ Логин/логаут
- ✅ Смена пароля
- ✅ Задержка при логине (защита от брутфорса)

### Analytics Service (26 тестов)
- ✅ Базовая статистика
- ✅ Анализ времени суток
- ✅ Интервалы между событиями
- ✅ Детекция эскалации
- ✅ Оценка уровня риска

### Hooks (19 тестов)
- ✅ useAuth - управление аутентификацией
- ✅ useEntries - CRUD операции с записями

## Технологии

- **Vitest** - тестовый фреймворк
- **@testing-library/react** - тестирование React компонентов и хуков
- **fake-indexeddb** - мок IndexedDB для тестов
- **happy-dom** - DOM окружение для тестов

## Особенности

1. **IndexedDB**: Используется `fake-indexeddb` для мокирования IndexedDB в Node.js окружении
2. **Web Crypto API**: Работает нативно в Node.js 18+
3. **Изоляция**: Каждый тест изолирован и очищает данные перед выполнением
4. **Асинхронность**: Все тесты поддерживают async/await

## Добавление новых тестов

### Пример теста сервиса:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myService';

describe('My Service', () => {
    it('should do something', async () => {
        const result = await myFunction();
        expect(result).toBe('expected');
    });
});
```

### Пример теста хука:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
    it('should return correct value', () => {
        const { result } = renderHook(() => useMyHook());
        expect(result.current.value).toBe('initial');
    });
});
```
