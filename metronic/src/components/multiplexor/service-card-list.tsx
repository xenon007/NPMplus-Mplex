import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { multiplexorServices, type Service } from '@/lib/multiplexor-services';

interface Props {
  onToggle?: (service: Service, active: boolean) => void;
}

/**
 * Список карточек сервисов мультиплексора
 * Отображает доступные сервисы и позволяет их переключать
 */
export function ServiceCardList({ onToggle }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [active, setActive] = useState<string[]>([]);

  // Загружаем сервисы при монтировании компонента
  useEffect(() => {
    multiplexorServices.loadServices().then(setServices);
  }, []);

  // Обработчик переключения состояния сервиса
  const handleToggle = (service: Service) => {
    const isActive = active.includes(service.id);
    const newActive = isActive
      ? active.filter((id) => id !== service.id)
      : [...active, service.id];

    setActive(newActive);
    console.log(`Сервис ${service.id} теперь ${isActive ? 'выключен' : 'включен'}`);
    onToggle?.(service, !isActive);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <Card
          key={s.id}
          className={`cursor-pointer transition-colors ${
            active.includes(s.id) ? 'bg-primary text-white' : ''
          }`}
          onClick={() => handleToggle(s)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <span className="text-2xl">
              <i className={s.icon}></i>
            </span>
            <div>
              <CardTitle>{s.name}</CardTitle>
              <CardDescription
                className={active.includes(s.id) ? 'text-white/80' : ''}
              >
                {s.description}
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
