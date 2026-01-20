import { Column, Img, Row, Section, Text } from '@react-email/components';

import { formatPrice } from '@/lib/utils';
import type { OrderItem } from '@/types';

interface OrderItemsProps {
  items: OrderItem[];
}

export function OrderItems({ items }: OrderItemsProps) {
  return (
    <Section>
      {items.map((item, index) => (
        <Row
          key={item.product_id}
          style={{
            padding: '12px',
            backgroundColor: index % 2 === 0 ? '#1a1a1f' : '#131316',
            borderLeft: '3px solid #FE206A',
            marginBottom: index < items.length - 1 ? '8px' : '0',
          }}
        >
          <Column style={{ width: '70px', verticalAlign: 'top' }}>
            {item.image_url ? (
              <Img
                src={item.image_url}
                alt={item.title}
                width={60}
                height={60}
                style={{
                  borderRadius: '4px',
                  border: '2px solid #2a2a2f',
                }}
              />
            ) : (
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#2a2a2f',
                borderRadius: '4px',
              }} />
            )}
          </Column>
          <Column style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
            <Text style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
            }}>
              {item.title}
            </Text>
            <Text style={{
              margin: '4px 0 0 0',
              fontSize: '12px',
              color: '#9ca3af',
            }}>
              Antall: {item.quantity}
            </Text>
            <Text style={{
              margin: '6px 0 0 0',
              fontSize: '15px',
              fontWeight: 700,
              color: '#FE206A',
            }}>
              {formatPrice(item.price * item.quantity)}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}
