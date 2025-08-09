// src/app/checkout/page.tsx — Premium Checkout v2 (fixed refs)
'use client';

import './checkout.modules.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { formatPrice, isValidPhoneNumber } from '../../lib/utils';
import type { OrderForm, RestaurantSettings } from '../../types';

type Pay = 'cash' | 'transfer';
type Ship = 'delivery' | 'pickup';

function StepBadge({ i, active, done }: { i: number; active: boolean; done: boolean }) {
  return (
    <div
      className={[
        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
        done ? 'bg-green-500 text-white' : active ? 'bg-accent-red text-white' : 'bg-gray-800 text-gray-400 border border-gray-700',
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
  const id = useMemo(() => `f_${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label} {required && <span className="text-accent-red">*</span>}
      </label>
      <input
        id={id}
        ref={ref}
        {...props}
        className={`input-premium w-full ${error ? 'border-red-500 focus:border-red-500' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      {error && (
        <p id={`${id}-err`} className="text-red-400 text-sm">
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
      className={[
        'glass-card p-5 text-left transition-all duration-300 rounded-xl',
        active ? 'border-accent-red bg-accent-red-light' : 'hover:border-gray-600',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <div>
          <h4 className="font-semibold text-white">{title}</h4>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>
      {footer ? <div className="text-sm">{footer}</div> : null}
    </button>
  );
}

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

  // redirect si carrito vacío
  useEffect(() => {
    if (items.length === 0) router.push('/');
  }, [items.length, router]);

  // cargar settings
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/settings');
        if (r.ok) {
          const j = await r.json();
          setSettings(j.data);
        }
      } catch (e) {
        console.error('settings', e);
      }
    })();
  }, []);

  // totales
  const subtotal = useMemo(() => getSubtotal(), [getSubtotal, items]);
  const deliveryCost = useMemo(() => {
    if (orderForm.delivery_type !== 'delivery') return 0;
    if (!settings || settings.is_delivery_free) return 0;
    return settings.delivery_cost || 0;
  }, [orderForm.delivery_type, settings]);
  const total = useMemo(() => subtotal + deliveryCost, [subtotal, deliveryCost]);

  // paso actual
  const currentStep = useMemo(() => {
    const step1Ok =
      orderForm.customer_name.trim().length >= 2 &&
      orderForm.customer_phone.trim().length >= 6 &&
      isValidPhoneNumber(orderForm.customer_phone);
    const step2Ok =
      (orderForm.delivery_type === 'pickup' ||
        (orderForm.delivery_type === 'delivery' && (orderForm.delivery_address || '').trim().length >= 5)) &&
      (orderForm.payment_method === 'cash' || orderForm.payment_method === 'transfer');
    if (!step1Ok) return 1;
    if (!step2Ok) return 2;
    return 3;
  }, [orderForm]);

  // helpers
  const set = <K extends keyof OrderForm>(k: K, v: OrderForm[K]) =>
    setOrderForm(prev => ({ ...prev, [k]: v }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (orderForm.customer_name.trim().length < 2) e.customer_name = 'Mínimo 2 caracteres';
    if (!orderForm.customer_phone.trim()) e.customer_phone = 'Requerido';
    else if (!isValidPhoneNumber(orderForm.customer_phone)) e.customer_phone = 'Formato inválido';
    if (orderForm.delivery_type === 'delivery' && !(orderForm.delivery_address || '').trim())
      e.delivery_address = 'Requerido para delivery';

    setErrors(e);

    // foco en el primero inválido
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
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0b0b] to-black">
      {/* header */}
      <header className="glass-card border-0 border-b border-border-primary bg-black/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="font-medium">Seguir comprando</span>
            </button>
            <h1 className="text-xl font-bold text-white">Finalizar pedido</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* steps */}
        <div className="glass-card p-5 mb-8">
          <div className="flex items-center gap-4">
            <StepBadge i={1} active={currentStep === 1} done={currentStep > 1} />
            <div className="hidden sm:block">
              <div className="font-semibold text-white">Información personal</div>
              <div className="text-sm text-gray-400">Datos de contacto</div>
            </div>
            <div className="flex-1 h-px bg-gray-700 mx-2" />
            <StepBadge i={2} active={currentStep === 2} done={currentStep > 2} />
            <div className="hidden sm:block">
              <div className="font-semibold text-white">Entrega y pago</div>
              <div className="text-sm text-gray-400">Preferencias</div>
            </div>
            <div className="flex-1 h-px bg-gray-700 mx-2" />
            <StepBadge i={3} active={currentStep === 3} done={false} />
            <div className="hidden sm:block">
              <div className="font-semibold text-white">Confirmación</div>
              <div className="text-sm text-gray-400">Revisá y enviá</div>
            </div>
          </div>
          <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-red transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* left: form */}
          <div className="lg:col-span-2 space-y-8">
            {/* contacto */}
            <section className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Información de contacto</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field
                  ref={nameRef}
                  label="Nombre completo"
                  required
                  value={orderForm.customer_name}
                  onChange={e => set('customer_name', e.currentTarget.value)}
                  placeholder="Tu nombre"
                  error={errors.customer_name}
                  autoComplete="name"
                />
                <Field
                  ref={phoneRef}
                  label="Teléfono / WhatsApp"
                  required
                  value={orderForm.customer_phone}
                  onChange={e => set('customer_phone', e.currentTarget.value)}
                  placeholder="+54 9 11 1234-5678"
                  inputMode="tel"
                  autoComplete="tel"
                  error={errors.customer_phone}
                />
              </div>
            </section>

            {/* entrega */}
            <section className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Método de entrega</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ChoiceCard
                  active={orderForm.delivery_type === 'delivery'}
                  icon="🚚"
                  title="Delivery"
                  subtitle="A tu domicilio"
                  footer={
                    <>
                      <p className="text-accent-gold font-medium">
                        {deliveryCost === 0 ? 'Gratis' : formatPrice(deliveryCost)}
                      </p>
                      <p className="text-gray-400">15–30 minutos</p>
                    </>
                  }
                  onClick={() => set('delivery_type', 'delivery' as Ship)}
                />
                <ChoiceCard
                  active={orderForm.delivery_type === 'pickup'}
                  icon="🏪"
                  title="Retiro en local"
                  subtitle="En el restaurante"
                  footer={
                    <>
                      <p className="text-accent-gold font-medium">Gratis</p>
                      <p className="text-gray-400">10–20 minutos</p>
                    </>
                  }
                  onClick={() => set('delivery_type', 'pickup' as Ship)}
                />
              </div>

              {orderForm.delivery_type === 'delivery' && (
                <div className="mt-6">
                  <Field
                    ref={addrRef}
                    label="Dirección de entrega"
                    required
                    value={orderForm.delivery_address || ''}
                    onChange={e => set('delivery_address', e.currentTarget.value)}
                    placeholder="Calle, número, piso, depto"
                    error={errors.delivery_address}
                    autoComplete="street-address"
                  />
                </div>
              )}
            </section>

            {/* pago */}
            <section className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Método de pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ChoiceCard
                  active={orderForm.payment_method === 'cash'}
                  icon="💵"
                  title="Efectivo"
                  subtitle="Pago contra entrega"
                  footer={<p className="text-sm text-accent-gold">Recomendado</p>}
                  onClick={() => set('payment_method', 'cash' as Pay)}
                />
                <ChoiceCard
                  active={orderForm.payment_method === 'transfer'}
                  icon="💳"
                  title="Transferencia"
                  subtitle="Banco o billetera"
                  footer={<p className="text-sm text-gray-400">Te enviamos los datos</p>}
                  onClick={() => set('payment_method', 'transfer' as Pay)}
                />
              </div>
            </section>

            {/* notas */}
            <section className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Notas adicionales (opcional)</h3>
              <textarea
                value={orderForm.notes || ''}
                onChange={e => set('notes', e.currentTarget.value)}
                placeholder="Alguna indicación especial para tu pedido…"
                rows={3}
                className="input-premium w-full resize-none"
              />
            </section>
          </div>

          {/* right: resumen */}
          <aside className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-6">Resumen del pedido</h3>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1 mr-3 min-w-0">
                      <p className="text-white font-medium truncate">{item.product.name}</p>
                      <p className="text-gray-400">Qty: {item.quantity}</p>
                      {item.selected_variations?.length > 0 && (
                        <p className="text-xs text-accent-gold truncate">
                          {item.selected_variations.map(v => v.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="text-white font-medium whitespace-nowrap">{formatPrice(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border-primary pt-6">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Envío</span>
                  <span className={deliveryCost === 0 ? 'text-accent-gold' : ''}>
                    {deliveryCost === 0 ? 'Gratis' : formatPrice(deliveryCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold border-t border-border-primary pt-3">
                  <span className="text-white">Total</span>
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
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                <div className="mt-6 p-4 bg-accent-red-light rounded-lg">
                  <p className="text-sm text-center text-gray-300">
                    ¿Dudas? Contactanos al{' '}
                    <a href={`tel:${settings.phone}`} className="text-accent-gold font-medium hover:underline">
                      {settings.phone}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* barra móvil fija (cta) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-gray-400">Total</div>
            <div className="text-white text-lg font-semibold">{formatPrice(total)}</div>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary px-5 py-3 rounded-xl disabled:opacity-50">
            {loading ? 'Procesando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
