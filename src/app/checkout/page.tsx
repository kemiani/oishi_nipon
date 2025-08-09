// src/app/checkout/page.tsx — Checkout Premium (TS-safe)
'use client';

import './checkout.modules.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { formatPrice, isValidPhoneNumber } from '../../lib/utils';
import type { OrderForm, RestaurantSettings } from '../../types';

type Pay = 'cash' | 'transfer';
type Ship = 'delivery' | 'pickup';

/* ───────── UI bits ───────── */
function StepBadge({ i, active, done }: { i: number; active: boolean; done: boolean }) {
  return (
    <div
      className={[
        'step-badge',
        done ? 'step-badge--done' : active ? 'step-badge--active' : 'step-badge--idle',
      ].join(' ')}
    >
      {done ? '✓' : i}
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  required?: boolean;
};
const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, required, ...props },
  ref
) {
  const id = React.useMemo(() => `f_${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label} {required && <span className="text-accent-red">*</span>}
      </label>
      <input
        id={id}
        ref={ref}
        {...props}
        className={`input-premium ${error ? 'input-premium--error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      {error && (
        <p id={`${id}-err`} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
});

function ChoiceCard({
  active,
  icon,
  title,
  subtitle,
  footer,
  onClick,
}: {
  active: boolean;
  icon: string;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`choice-card ${active ? 'choice-card--active' : ''}`}
    >
      <div className="choice-card__head">
        <span className="choice-card__icon">{icon}</span>
        <div className="min-w-0">
          <h4 className="choice-card__title">{title}</h4>
          <p className="choice-card__sub">{subtitle}</p>
        </div>
      </div>
      {footer ? <div className="choice-card__footer">{footer}</div> : null}
    </button>
  );
}

/* ───────── Page ───────── */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();

  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // refs para foco
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addrRef = useRef<HTMLInputElement>(null);

  const [orderForm, setOrderForm] = useState<OrderForm>({
    customer_name: '',
    customer_phone: '',
    delivery_type: 'delivery',
    delivery_address: '',
    payment_method: 'cash',
    notes: '',
  });

  /* guards */
  useEffect(() => {
    if (items.length === 0) router.push('/');
  }, [items.length, router]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/settings');
        if (r.ok) {
          const j = await r.json();
          setSettings(j.data);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* totals */
  const subtotal = useMemo(() => getSubtotal(), [getSubtotal, items]);
  const deliveryCost = useMemo(() => {
    if (orderForm.delivery_type !== 'delivery') return 0;
    if (!settings || settings.is_delivery_free) return 0;
    return settings.delivery_cost || 0;
  }, [orderForm.delivery_type, settings]);
  const total = useMemo(() => subtotal + deliveryCost, [subtotal, deliveryCost]);

  /* step */
  const currentStep = useMemo(() => {
    const s1 =
      orderForm.customer_name.trim().length >= 2 &&
      orderForm.customer_phone.trim().length >= 6 &&
      isValidPhoneNumber(orderForm.customer_phone);
    const s2 =
      (orderForm.delivery_type === 'pickup' ||
        (orderForm.delivery_type === 'delivery' && (orderForm.delivery_address || '').trim().length >= 5)) &&
      (orderForm.payment_method === 'cash' || orderForm.payment_method === 'transfer');
    if (!s1) return 1;
    if (!s2) return 2;
    return 3;
  }, [orderForm]);

  /* helpers */
  const setF = <K extends keyof OrderForm>(k: K, v: OrderForm[K]) =>
    setOrderForm(prev => ({ ...prev, [k]: v }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (orderForm.customer_name.trim().length < 2) e.customer_name = 'Mínimo 2 caracteres';
    if (!orderForm.customer_phone.trim()) e.customer_phone = 'Requerido';
    else if (!isValidPhoneNumber(orderForm.customer_phone)) e.customer_phone = 'Formato inválido';
    if (orderForm.delivery_type === 'delivery' && !(orderForm.delivery_address || '').trim())
      e.delivery_address = 'Requerido para delivery';

    setErrors(e);
    if (e.customer_name) nameRef.current?.focus();
    else if (e.customer_phone) phoneRef.current?.focus();
    else if (e.delivery_address) addrRef.current?.focus();
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderForm, cartItems: items }),
      });
      if (!r.ok) throw new Error('order failed');
      const data = await r.json();
      clearCart();
      if (data.data?.whatsapp_url) window.open(data.data.whatsapp_url, '_blank');
      router.push(`/order-confirmation/${data.data.order.id}`);
    } catch (e) {
      console.error(e);
      alert('No se pudo procesar el pedido. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="checkout">
      {/* header */}
      <header className="checkout__header glass-card">
        <div className="wrap">
          <button onClick={() => router.back()} className="backlink">
            <span className="text-xl">←</span>
            <span className="font-medium">Seguir comprando</span>
          </button>
          <h1 className="title">Finalizar pedido</h1>
        </div>
      </header>

      <main className="wrap">
        {/* stepper */}
        <section className="glass-card step">
          <div className="stepper">
            <div className="step-cell">
              <StepBadge i={1} active={currentStep === 1} done={currentStep > 1} />
              <div className="min-w-0">
                <div className="step-title truncate">Información personal</div>
                <div className="step-sub truncate">Datos de contacto</div>
              </div>
            </div>
            <div className="step-line" />
            <div className="step-cell">
              <StepBadge i={2} active={currentStep === 2} done={currentStep > 2} />
              <div className="min-w-0">
                <div className="step-title truncate">Entrega y pago</div>
                <div className="step-sub truncate">Preferencias</div>
              </div>
            </div>
            <div className="step-line" />
            <div className="step-cell">
              <StepBadge i={3} active={currentStep === 3} done={false} />
              <div className="min-w-0">
                <div className="step-title truncate">Confirmación</div>
                <div className="step-sub truncate">Revisá y enviá</div>
              </div>
            </div>
          </div>
          <div className="progress">
            <div className="progress__bar" style={{ width: `${(currentStep / 3) * 100}%` }} />
          </div>
        </section>

        <div className="grid">
          {/* left */}
          <div className="left">
            {/* contacto */}
            <section className="glass-card card">
              <h2 className="card__title">Información de contacto</h2>
              <div className="grid2">
                <Field
                  ref={nameRef}
                  label="Nombre completo"
                  required
                  value={orderForm.customer_name}
                  onChange={(e) => setF('customer_name', e.currentTarget.value)}
                  placeholder="Tu nombre"
                  error={errors.customer_name}
                  autoComplete="name"
                />
                <Field
                  ref={phoneRef}
                  label="Teléfono / WhatsApp"
                  required
                  value={orderForm.customer_phone}
                  onChange={(e) => setF('customer_phone', e.currentTarget.value)}
                  placeholder="+54 9 11 1234-5678"
                  inputMode="tel"
                  autoComplete="tel"
                  error={errors.customer_phone}
                />
              </div>
            </section>

            {/* entrega */}
            <section className="glass-card card">
              <h3 className="card__subtitle">Método de entrega</h3>
              <div className="grid2">
                <ChoiceCard
                  active={orderForm.delivery_type === 'delivery'}
                  icon="🚚"
                  title="Delivery"
                  subtitle="A tu domicilio"
                  footer={
                    <>
                      <p className="price-tag">{deliveryCost === 0 ? 'Gratis' : formatPrice(deliveryCost)}</p>
                      <p className="muted">15–30 minutos</p>
                    </>
                  }
                  onClick={() => setF('delivery_type', 'delivery' as Ship)}
                />
                <ChoiceCard
                  active={orderForm.delivery_type === 'pickup'}
                  icon="🏪"
                  title="Retiro en local"
                  subtitle="En el restaurante"
                  footer={
                    <>
                      <p className="price-tag">Gratis</p>
                      <p className="muted">10–20 minutos</p>
                    </>
                  }
                  onClick={() => setF('delivery_type', 'pickup' as Ship)}
                />
              </div>

              {orderForm.delivery_type === 'delivery' && (
                <div className="mt-6">
                  <Field
                    ref={addrRef}
                    label="Dirección de entrega"
                    required
                    value={orderForm.delivery_address || ''}
                    onChange={(e) => setF('delivery_address', e.currentTarget.value)}
                    placeholder="Calle, número, piso, depto"
                    error={errors.delivery_address}
                    autoComplete="street-address"
                  />
                </div>
              )}
            </section>

            {/* pago */}
            <section className="glass-card card">
              <h3 className="card__subtitle">Método de pago</h3>
              <div className="grid2">
                <ChoiceCard
                  active={orderForm.payment_method === 'cash'}
                  icon="💵"
                  title="Efectivo"
                  subtitle="Pago contra entrega"
                  footer={<p className="badge badge--gold">Recomendado</p>}
                  onClick={() => setF('payment_method', 'cash' as Pay)}
                />
                <ChoiceCard
                  active={orderForm.payment_method === 'transfer'}
                  icon="💳"
                  title="Transferencia"
                  subtitle="Banco o billetera"
                  footer={<p className="muted">Te enviamos los datos</p>}
                  onClick={() => setF('payment_method', 'transfer' as Pay)}
                />
              </div>
            </section>

            {/* notas */}
            <section className="glass-card card">
              <h3 className="card__subtitle">Notas adicionales (opcional)</h3>
              <textarea
                value={orderForm.notes || ''}
                onChange={(e) => setF('notes', e.currentTarget.value)}
                placeholder="Alguna indicación especial para tu pedido…"
                rows={3}
                className="input-premium textarea"
              />
            </section>
          </div>

          {/* right */}
          <aside className="right">
            <div className="glass-card summary">
              <h3 className="card__title">Resumen del pedido</h3>

              <div className="summary__list">
                {items.map((item) => (
                  <div key={item.id} className="summary__row">
                    <div className="summary__info">
                      <p className="summary__name">{item.product.name}</p>
                      <p className="muted">Qty: {item.quantity}</p>
                      {item.selected_variations?.length > 0 && (
                        <p className="summary__variations">
                          {item.selected_variations.map((v: any) => v.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="summary__price">{formatPrice(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              <div className="summary__totals">
                <div className="summary__line">
                  <span className="muted">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="summary__line">
                  <span className="muted">Envío</span>
                  <span className={deliveryCost === 0 ? 'price-tag' : ''}>
                    {deliveryCost === 0 ? 'Gratis' : formatPrice(deliveryCost)}
                  </span>
                </div>
                <div className="summary__grand">
                  <span>Total</span>
                  <span className="text-gradient-red">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full justify-center text-lg py-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="spinner-mini" />
                    <span>Procesando…</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar pedido</span>
                    <span>🚀</span>
                  </>
                )}
              </button>

              {settings && (
                <div className="contact">
                  <p>
                    ¿Dudas? Contactanos al{' '}
                    <a href={`tel:${settings.phone}`} className="contact__link">
                      {settings.phone}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* barra móvil */}
      <div className="mobilebar">
        <div className="wrap mobilebar__wrap">
          <div>
            <div className="muted text-xs">Total</div>
            <div className="mobilebar__total">{formatPrice(total)}</div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary px-5 py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Procesando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
