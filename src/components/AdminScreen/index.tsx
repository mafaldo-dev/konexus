import { useEffect, useState } from "react"
import Dashboard from "../dashboard/Dashboard"
import { handleAllOrders } from "../../service/api/Administrador/orders";
import { handleAllEmployee } from "../../service/api/Administrador/employee";

import tech from '../../assets/image/tech.jpg'
import recicla from '../../assets/image/recicla.jpg'
import relatorios from '../../assets/image/relatorios.jpg'
import control from '../../assets/image/control.jpg'

import { motion } from 'framer-motion';
import {
  Bell,
  Calendar,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudRain,
  Sun,
  CloudSnow
} from 'lucide-react';
import { OrderResponse } from "../../service/interfaces";
import { Link } from "react-router-dom";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
  category: 'feature' | 'update' | 'maintenance' | 'announcement';
  read: boolean;
}

interface SystemUpdate {
  version: string;
  date: string;
  changes: string[];
}

interface CarouselImage {
  id: number;
  title: string;
  description: string;
  imageUrl: any;
  link?: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  city: string;
  loading: boolean;
}

const AdministrationScreen = () => {
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [orderPending, setOrderPending] = useState<OrderResponse[]>([])
  const [orderInProgress, setOrderInProgress] = useState<OrderResponse[]>([])
  const [employeeLen, setEmployeeLen] = useState<any[]>()
  const [isLoading, setIsLoading] = useState(true);

  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    weatherCode: 0,
    city: 'São Paulo',
    loading: true
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await handleAllOrders();
        const employee = await handleAllEmployee()

        const pending = response.filter(o => o.orderStatus === "pending");
        const inProgress = response.filter(o => o.orderStatus === "in_progress");

        const active = employee.filter((e: any) => e.active === true)

        setOrderPending(pending);
        setOrderInProgress(inProgress);

        setEmployeeLen(active)

      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const [news, setNews] = useState<NewsItem[]>([
    {
      id: 1,
      title: 'Nova funcionalidade: Exportar xls de relatorios para Excel',
      description: 'Agora é possível realizar a exportarção de relatorios para excel atraves do botão no menu do documentViewer.',
      date: 'Hoje',
      category: 'feature',
      read: false
    },
    {
      id: 2,
      title: 'Manutenção programada',
      description: 'Nova atualização disponivel!!!.',
      date: 'Hoje',
      category: 'maintenance',
      read: false
    }
  ]);

  const [systemUpdates] = useState<SystemUpdate[]>([
    {
      version: 'v1.1.9',
      date: '05/12/2025',
      changes: [
        'Nova Dashboard principal',
        'Botões de navegação rapida na Dashboard ',
        'Adição de relatorios personalizados ao sistema',
        'Exportar xls de relatorios diretamente para o excel',
        'Ajustes na interface do módulo financeiro'
      ]
    },
    {
      version: 'v1.1.8',
      date: '27/11/2025',
      changes: [
        'Correção de bugs',
        'Melhoria na performace da aplicação',
        'Update no módulo financeiro'
      ]
    }
  ]);

  const [carouselImages] = useState<CarouselImage[]>([
    {
      id: 1,
      title: 'Nova Interface',
      description: 'Interface moderna e intuitiva para melhor experiência do usuário.',
      imageUrl: tech
    },
    {
      id: 2,
      title: 'Reciclagem e seus beneficios',
      description: 'Comece a reciclar e ajude a transformar o meio ambiente.',
      imageUrl: recicla
    },
    {
      id: 3,
      title: 'Controle Total',
      description: 'Gerencie todos os processos da sua empresa em um só lugar',
      imageUrl: control
    },
    {
      id: 4,
      title: 'Relatorios',
      description: 'Gere relatorios personalizados',
      imageUrl: relatorios
    }
  ]);

  // Função para buscar dados do tempo
  const fetchWeather = async () => {
    try {
      setWeather(prev => ({ ...prev, loading: true }));

      // Geocodifica São Paulo
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=São Paulo&count=1&language=pt&format=json`
      );
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Cidade não encontrada');
      }

      const { latitude, longitude } = geoData.results[0];

      // Busca dados do tempo
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      const weatherData = await weatherResponse.json();

      setWeather({
        temperature: Math.round(weatherData.current.temperature_2m),
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: Math.round(weatherData.current.wind_speed_10m),
        weatherCode: weatherData.current.weather_code,
        city: 'São Paulo',
        loading: false
      });
    } catch (error) {
      console.error('Erro ao buscar dados do tempo:', error);
      setWeather(prev => ({ ...prev, loading: false }));
    }
  };

  // Retorna descrição e ícone baseado no código do tempo
  const getWeatherInfo = (code: number) => {
    if (code === 0) return { desc: 'Céu limpo', icon: Sun, color: 'text-yellow-500' };
    if (code <= 3) return { desc: 'Parcialmente nublado', icon: Cloud, color: 'text-gray-500' };
    if (code <= 48) return { desc: 'Névoa', icon: Cloud, color: 'text-gray-400' };
    if (code <= 67) return { desc: 'Chuva', icon: CloudRain, color: 'text-blue-500' };
    if (code <= 77) return { desc: 'Neve', icon: CloudSnow, color: 'text-blue-300' };
    return { desc: 'Tempestade', icon: CloudRain, color: 'text-blue-700' };
  };

  const nextCarousel = () => {
    setActiveCarouselIndex((prev) =>
      prev === carouselImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevCarousel = () => {
    setActiveCarouselIndex((prev) =>
      prev === 0 ? carouselImages.length - 1 : prev - 1
    );
  };

  const getCategoryColor = (category: NewsItem['category']) => {
    switch (category) {
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'announcement': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: NewsItem['category']) => {
    switch (category) {
      case 'feature': return <CheckCircle2 className="w-4 h-4" />;
      case 'update': return <TrendingUp className="w-4 h-4" />;
      case 'maintenance': return <Settings className="w-4 h-4" />;
      case 'announcement': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextCarousel();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => {
      fetchWeather();
    }, 600000);
    return () => clearInterval(interval);
  }, []);

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = weatherInfo.icon;

  return (
    <Dashboard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Breve atualização do que esta acontecendo.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 font-medium">
                    {new Date().toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Stat Card 1 */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Pedidos Pendentes</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{isLoading ? (
                    <div>Carregando...</div>
                  ) : (
                    <div>
                      {orderPending.length}
                    </div>
                  )}</h3>
                  <p className="text-gray-600 text-sm mt-1">Aguardando separação</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">{orderInProgress.length}</span>
                  <span className="text-gray-500 ml-2">este mês</span>
                </div>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Em Separação</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{orderInProgress.length}</h3>
                  <p className="text-gray-600 text-sm mt-1">Em andamento</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Package className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-gray-700">Tempo médio: 25min</span>
                </div>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center jstats.efficiencyustify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Usuários Ativos</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{employeeLen?.length}</h3>
                  <p className="text-gray-600 text-sm mt-1">Conectados ao sistema</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Weather Card */}
            <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl shadow-sm p-6 border border-blue-300 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-50 text-sm font-medium">Clima Atual</p>
                  {weather.loading ? (
                    <div className="text-2xl font-bold mt-2">Carregando...</div>
                  ) : (
                    <>
                      <h3 className="text-4xl font-bold mt-2">{weather.temperature}°C</h3>
                      <p className="text-blue-50 text-sm mt-1">{weather.city}</p>
                    </>
                  )}
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <WeatherIcon className={`w-8 h-8 ${weather.loading ? 'text-white' : 'text-white'}`} />
                </div>
              </div>
              {!weather.loading && (
                <div className="mt-4 pt-4 border-t border-blue-400/30">
                  <div className="flex items-center justify-between text-sm text-blue-50">
                    <span>{weatherInfo.desc}</span>
                    <span>💧 {weather.humidity}%</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Carousel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              {/* Carousel */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="relative">
                  {/* Image */}
                  <div className="h-64 md:h-80 overflow-hidden">
                    <img
                      src={carouselImages[activeCarouselIndex].imageUrl}
                      alt={carouselImages[activeCarouselIndex].title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white text-xl font-bold">
                          {carouselImages[activeCarouselIndex].title}
                        </h3>
                        <p className="text-gray-200 mt-1">
                          {carouselImages[activeCarouselIndex].description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <button
                    onClick={prevCarousel}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextCarousel}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {carouselImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveCarouselIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === activeCarouselIndex
                          ? 'bg-white w-8'
                          : 'bg-white/50 hover:bg-white/80'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition hover:border-blue-500 group">
                  <Link to="/sales/orders">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-700">
                        Novo Pedido
                      </span>
                    </div>
                  </Link>
                </button>

                <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition hover:border-green-500 group">
                  <Link to="/sales/order-list">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-700">
                        Expedição
                      </span>
                    </div>
                  </Link>
                </button>

                <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition hover:border-purple-500 group">
                  <Link to="/manager/customer">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-700">
                        Clientes</span>
                    </div>
                  </Link>
                </button>

                <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition hover:border-orange-500 group">
                  <Link to="/sales/reports">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-700">Relatórios</span>
                    </div>
                  </Link>
                </button>
              </motion.div>
            </motion.div>

            {/* Right Column - News and Updates */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* News Panel */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Últimas Notícias</h3>
                    <Bell className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {news.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 hover:bg-gray-50 transition ${!item.read ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getCategoryColor(item.category)}`}>
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${getCategoryColor(item.category)}`}>
                              {item.category === 'feature' && 'Nova Funcionalidade'}
                              {item.category === 'update' && 'Atualização'}
                              {item.category === 'maintenance' && 'Manutenção'}
                              {item.category === 'announcement' && 'Aviso'}
                            </span>
                            <span className="text-xs text-gray-500">{item.date}</span>
                          </div>
                          <h4 className="font-medium text-gray-900 mt-2">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Updates */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Últimas Atualizações</h3>
                    <Settings className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
                <div className="p-5">
                  {systemUpdates.map((update, index) => (
                    <div key={index} className={index > 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{update.version}</span>
                        <span className="text-sm text-gray-500">{update.date}</span>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {update.changes.map((change, changeIndex) => (
                          <li key={changeIndex} className="flex items-start text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Card */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Precisa de ajuda?</h3>
                    <p className="text-blue-100 mt-1">Nossa equipe de suporte está disponível para ajudar.</p>
                    <button className="mt-4 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition">
                      Contatar Suporte
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Dashboard>
  );
};
export default AdministrationScreen