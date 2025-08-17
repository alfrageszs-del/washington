"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SearchResult {
  id: string;
  type: "act" | "fine" | "wanted" | "court_act" | "government_act";
  title: string;
  staticID?: string;
  nickname?: string;
  date: string;
  status: string;
  url: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const documentTypes = [
    { id: "act", label: "Акты суда", color: "bg-blue-100 text-blue-800" },
    { id: "government_act", label: "Акты правительства", color: "bg-green-100 text-green-800" },
    { id: "fine", label: "Штрафы", color: "bg-yellow-100 text-yellow-800" },
    { id: "wanted", label: "Ордера на арест", color: "bg-red-100 text-red-800" },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    // Здесь будет API запрос к Supabase
    // Пока используем моковые данные
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: "1",
          type: "act",
          title: "Постановление о возбуждении уголовного дела",
          staticID: "12345",
          nickname: "John_Doe",
          date: "2024-01-15",
          status: "Активно",
          url: "/acts-court/1"
        },
        {
          id: "2",
          type: "fine",
          title: "Штраф за нарушение ПДД",
          staticID: "12345",
          nickname: "John_Doe",
          date: "2024-01-14",
          status: "Оплачен",
          url: "/fines/2"
        }
      ];
      setResults(mockResults);
      setIsLoading(false);
    }, 1000);
  };

  const getTypeColor = (type: string) => {
    const docType = documentTypes.find(t => t.id === type);
    return docType?.color || "bg-gray-100 text-gray-800";
  };

  const getTypeLabel = (type: string) => {
    const docType = documentTypes.find(t => t.id === type);
    return docType?.label || "Документ";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Глобальный поиск документов</h1>
        
        {/* Поисковая форма */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Поиск по StaticID или Nickname
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Введите StaticID или Nickname..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Поиск..." : "Найти"}
              </button>
            </div>
          </div>

          {/* Фильтры по типам документов */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Типы документов
            </label>
            <div className="flex flex-wrap gap-2">
              {documentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    if (selectedTypes.includes(type.id)) {
                      setSelectedTypes(selectedTypes.filter(t => t !== type.id));
                    } else {
                      setSelectedTypes([...selectedTypes, type.id]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTypes.includes(type.id)
                      ? type.color
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Результаты поиска */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Найдено документов: {results.length}
              </h2>
            </div>
            <div className="divide-y">
              {results.map((result) => (
                <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                          {getTypeLabel(result.type)}
                        </span>
                        <span className="text-sm text-gray-500">{result.date}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.status === "Активно" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium mb-2">{result.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {result.staticID && (
                          <span>StaticID: {result.staticID}</span>
                        )}
                        {result.nickname && (
                          <span>Nickname: {result.nickname}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={result.url}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Просмотр
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && results.length === 0 && query && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Документы не найдены</p>
            <p className="text-gray-400">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}
