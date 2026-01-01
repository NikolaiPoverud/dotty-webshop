import { Column, Img, Row, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { OrderItem } from '@/types';

interface OrderItemsProps {
  items: OrderItem[];
}

function formatPrice(priceInOre: number): string {
  return `${(priceInOre / 100).toLocaleString('no-NO')} kr`;
}

export function OrderItems({ items }: OrderItemsProps) {
  return (
    <Section className="rounded-lg bg-card p-4">
      {items.map((item, index) => (
        <Row key={item.product_id} className={index > 0 ? 'mt-4 border-t border-border pt-4' : ''}>
          <Column className="w-20">
            {item.image_url ? (
              <Img
                src={item.image_url}
                alt={item.title}
                width={80}
                height={80}
                className="rounded border border-border"
              />
            ) : (
              <div className="h-20 w-20 rounded border border-border bg-background" />
            )}
          </Column>
          <Column className="pl-4">
            <Text className="m-0 font-medium text-foreground">{item.title}</Text>
            <Text className="m-0 mt-1 text-sm text-muted">
              Antall: {item.quantity}
            </Text>
            <Text className="m-0 mt-1 font-medium text-foreground">
              {formatPrice(item.price * item.quantity)}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}
