// Класс управления сервисами мультиплексора
// Загружает список сервисов с API и предоставляет методы для работы с ними

export interface Service {
  id: string;
  name: string;
  description: string;
  match: string;
  defaultForward: string;
  icon: string;
  forward?: string; // Настраиваемый адрес переадресации
}

class MultiplexorServices {
  private services: Service[] = [];
  private loaded = false;

  /**
   * Загружает список сервисов с сервера
   */
  async loadServices(): Promise<Service[]> {
    if (this.loaded) {
      return this.services;
    }

    try {
      const resp = await fetch('/multiplexor/api/services');
      const data = await resp.json();
      this.services = data.services as Service[];
      this.loaded = true;
      console.log('Сервисы мультиплексора загружены', this.services);
    } catch (error) {
      console.error('Ошибка загрузки сервисов:', error);
    }

    return this.services;
  }

  /** Получает сервис по идентификатору */
  getById(id: string): Service | undefined {
    return this.services.find((s) => s.id === id);
  }

  /** Получает сервис по шаблону */
  getByMatch(match: string): Service | undefined {
    return this.services.find((s) => s.match === match);
  }

  /**
   * Преобразует правило в сервис
   * @param rule объект с полями match и forward
   */
  ruleToService(rule: { match: string; forward: string }): Service {
    const service = this.getByMatch(rule.match);
    if (service) {
      return { ...service, forward: rule.forward };
    }

    // Пользовательское правило
    return {
      id: 'custom',
      name: 'Пользовательское правило',
      description: `${rule.match} → ${rule.forward}`,
      match: rule.match,
      defaultForward: rule.forward,
      forward: rule.forward,
      icon: 'fe-code',
    };
  }
}

export const multiplexorServices = new MultiplexorServices();
