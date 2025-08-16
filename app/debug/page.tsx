"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client";

export default function DebugPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const diagnostics = [];

    // 1. Проверка конфигурации Supabase
    diagnostics.push({
      test: "Конфигурация Supabase",
      status: "info",
      result: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || "не задан",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "задан" : "не задан"
      }
    });

    // 2. Проверка подключения к auth
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      diagnostics.push({
        test: "Подключение к Auth",
        status: sessionError ? "error" : "success",
        result: sessionError ? sessionError.message : "Подключение успешно"
      });
    } catch (error: any) {
      diagnostics.push({
        test: "Подключение к Auth",
        status: "error",
        result: error.message
      });
    }

    // 3. Проверка таблицы profiles
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      diagnostics.push({
        test: "Таблица profiles",
        status: error ? "error" : "success",
        result: error ? error.message : "Таблица доступна"
      });
    } catch (error: any) {
      diagnostics.push({
        test: "Таблица profiles",
        status: "error",
        result: error.message
      });
    }

    // 4. Проверка таблицы government_acts
    try {
      const { data, error } = await supabase
        .from('government_acts')
        .select('count')
        .limit(1);
      
      diagnostics.push({
        test: "Таблица government_acts",
        status: error ? "error" : "success",
        result: error ? error.message : "Таблица доступна"
      });
    } catch (error: any) {
      diagnostics.push({
        test: "Таблица government_acts",
        status: "error",
        result: error.message
      });
    }

    // 5. Проверка таблицы court_acts
    try {
      const { data, error } = await supabase
        .from('court_acts')
        .select('count')
        .limit(1);
      
      diagnostics.push({
        test: "Таблица court_acts",
        status: error ? "error" : "success",
        result: error ? error.message : "Таблица доступна"
      });
    } catch (error: any) {
      diagnostics.push({
        test: "Таблица court_acts",
        status: "error",
        result: error.message
      });
    }

    // 6. Проверка всех таблиц
    const tables = [
      'appointments', 'verification_requests', 'role_change_requests',
      'cases', 'court_sessions', 'lawyers', 'fines', 'warrants',
      'wanted', 'inspections', 'notifications'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        diagnostics.push({
          test: `Таблица ${table}`,
          status: error ? "error" : "success",
          result: error ? error.message : "Доступна"
        });
      } catch (error: any) {
        diagnostics.push({
          test: `Таблица ${table}`,
          status: "error",
          result: error.message
        });
      }
    }

    setResults(diagnostics);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Выполняется диагностика...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Диагностика системы</h1>
          <p className="text-gray-600">Проверка подключения к базе данных и доступности таблиц</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Результаты диагностики</h2>
              <button
                onClick={runDiagnostics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Повторить тесты
              </button>
            </div>

            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <div>
                        <h3 className="font-medium">{result.test}</h3>
                        <p className="text-sm mt-1">
                          {typeof result.result === 'string' 
                            ? result.result 
                            : JSON.stringify(result.result, null, 2)
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Статистика:</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Успешно</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Ошибки</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {results.filter(r => r.status === 'warning').length}
                  </div>
                  <div className="text-sm text-gray-600">Предупреждения</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {results.filter(r => r.status === 'info').length}
                  </div>
                  <div className="text-sm text-gray-600">Информация</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-blue-600 hover:underline"
          >
            ← Вернуться на главную
          </a>
        </div>
      </div>
    </div>
  );
}