"use client";

import { useState } from "react";

export default function SetupPage() {
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица профилей (ОБЯЗАТЕЛЬНО!)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    static_id TEXT UNIQUE NOT NULL,
    email TEXT,
    discord TEXT,
    faction TEXT NOT NULL DEFAULT 'CIVILIAN',
    gov_role TEXT NOT NULL DEFAULT 'NONE',
    leader_role TEXT,
    office_role TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица актов правительства
CREATE TABLE IF NOT EXISTS government_acts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица актов суда
CREATE TABLE IF NOT EXISTS court_acts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    case_number TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Остальные основные таблицы
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    position TEXT NOT NULL,
    faction TEXT NOT NULL,
    appointed_by UUID REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    plaintiff_id UUID REFERENCES profiles(id),
    defendant_id UUID REFERENCES profiles(id),
    judge_id UUID REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Настройка RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Базовые политики RLS
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view published acts" ON government_acts FOR SELECT USING (status = 'published');
CREATE POLICY "Anyone can view published court acts" ON court_acts FOR SELECT USING (status = 'published');

-- Функция для автоматического создания профилей
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, nickname, static_id, email, discord, faction, gov_role, is_verified
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nickname', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'static_id', 'user_' || substr(NEW.id::text, 1, 8)),
        NEW.email,
        NEW.raw_user_meta_data->>'discord',
        COALESCE(NEW.raw_user_meta_data->>'faction', 'CIVILIAN'),
        'NONE',
        false
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$;

-- Триггер для автоматического создания профилей
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-2">🚨 Настройка базы данных</h1>
          <p className="text-gray-600">Критически важно: создайте таблицы в Supabase для работы сайта</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">⚠️</span>
            <h2 className="text-xl font-semibold text-red-800">Таблицы не созданы!</h2>
          </div>
          <p className="text-red-700 mb-4">
            Диагностика показала, что таблицы базы данных не созданы. 
            Без них сайт не может работать.
          </p>
          <div className="flex space-x-4">
            <a 
              href="/debug" 
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🔍 Посмотреть диагностику
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Пошаговая инструкция</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Откройте Supabase Dashboard</h3>
                  <p className="text-gray-600 mb-2">
                    Перейдите на <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 hover:underline">https://supabase.com/dashboard</a>
                  </p>
                  <p className="text-sm text-gray-500">
                    Войдите в аккаунт и выберите проект: <code className="bg-gray-100 px-2 py-1 rounded">mxxckqvlwhuofbxragby</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Откройте SQL Editor</h3>
                  <p className="text-gray-600">
                    В левом меню нажмите <strong>SQL Editor</strong> → <strong>New query</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">Скопируйте и выполните SQL код</h3>
                  <div className="bg-gray-900 rounded-lg p-4 relative">
                    <button
                      onClick={copyToClipboard}
                      className={`absolute top-2 right-2 px-3 py-1 text-xs rounded transition-colors ${
                        copied 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {copied ? '✅ Скопировано!' : '📋 Копировать'}
                    </button>
                    <pre className="text-green-400 text-sm overflow-x-auto max-h-96 pr-20">
                      <code>{sqlCode}</code>
                    </pre>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Вставьте код в SQL Editor и нажмите <strong>Run</strong> (или Ctrl+Enter)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Проверьте результат</h3>
                  <p className="text-gray-600 mb-2">
                    После выполнения SQL кода:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Откройте <a href="/debug" className="text-blue-600 hover:underline">/debug</a></li>
                    <li>• Нажмите "🔄 Повторить тесты"</li>
                    <li>• Все таблицы должны показать ✅ "Доступна"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🎉</span>
            <h2 className="text-xl font-semibold text-green-800">После создания таблиц</h2>
          </div>
          <p className="text-green-700 mb-4">
            Все функции сайта заработают:
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <ul className="space-y-1 text-green-700">
                <li>✅ Регистрация пользователей</li>
                <li>✅ Автоматическое создание профилей</li>
                <li>✅ Акты правительства</li>
                <li>✅ Акты суда</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-1 text-green-700">
                <li>✅ Поиск документов</li>
                <li>✅ Уведомления</li>
                <li>✅ Дела и назначения</li>
                <li>✅ Все остальные функции</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-x-4">
          <a 
            href="/debug" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔍 Диагностика
          </a>
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🏠 На главную
          </a>
        </div>
      </div>
    </div>
  );
}