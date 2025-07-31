import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { ServiceCardList } from '@/components/multiplexor/service-card-list';

/**
 * Страница управления сервисами мультиплексора
 * Показывает список сервисов и позволяет их активировать
 */
export function NetworkMultiplexorPage() {
  return (
    <Fragment>
      <Container>
        <ServiceCardList onToggle={(s, active) => console.log('Toggle', s.id, active)} />
      </Container>
    </Fragment>
  );
}
