// src/app/checkout/page.tsx - Premium Checkout Experience
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { formatPrice, isValidPhoneNumber } from '../../lib/utils';
import type { OrderForm, RestaurantSettings } from '../../types';

// Componente de paso del checkout
const CheckoutStep = ({ step, currentStep, title, description }: {
  step: number;
  currentStep: number;
  title: string;
  description: string;
}) => (
  <div className={`flex items-center gap-4 ${step <= currentStep ? 'opacity-100' : 'opacity-50'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
      step < currentStep 
        ? 'bg-green-500 text-white' 
        : step === currentStep 
          ? 'bg-accent-red text-white' 
          : 'bg-gray-700 text-gray-400 border border-gray-600'
    }`}>
      {step < currentStep ? '✓' : step}
    </div>
    <div className="hidden sm:block">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </div>
);

// Componente de campo de entrada
const InputField = ({ label, error, required, ...props }: any) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-300">
      {label} {required && <span className="text-accent-red">*</span>}
    </label>
    <input
      {...props}
      className={`input-premium w-full ${error ? 'border-red-500 focus:border-red-500' : ''}`}
    />
    {error && <p className="text-red-400 text-sm">{error}</p>}
  </div>
);

// Componente de método de entrega
const DeliveryMethod = ({ value, onChange, deliveryCost, isFree }: {
  value: 'delivery' | 'pickup';
  onChange: (value: 'delivery' | 'pickup') => void;
  deliveryCost: number;
  isFree: boolean;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white">Método de entrega</h3>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={() => onChange('delivery')}
        className={`glass-card p-6 text-left transition-all duration-300 ${
          value === 'delivery' 
            ? 'border-accent-red bg-accent-red-light' 
            : 'hover:border-gray-600'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🚚</span>
          <div>
            <h4 className="font-semibold text-white">Delivery</h4>
            <p className="text-sm text-gray-400">Entrega a domicilio</p>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-accent-gold font-medium">
            {isFree ? 'Gratis' : formatPrice(deliveryCost)}
          </p>
          <p className="text-gray-400">15-30 minutos</p>
        </div>
      </button>

      <button
        onClick={() => onChange('pickup')}
        className={`glass-card p-6 text-left transition-all duration-300 ${
          value === 'pickup' 
            ? 'border-accent-red bg-accent-red-light' 
            : 'hover:border-gray-600'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🏪</span>
          <div>
            <h4 className="font-semibold text-white">Retiro en local</h4>
            <p className="text-sm text-gray-400">Retiro en el restaurante</p>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-accent-gold font-medium">Gratis</p>
          <p className="text-gray-400">10-20 minutos</p>
        </div>
      </button>
    </div>
  </div>
);

// Componente de método de pago
const PaymentMethod = ({ value, onChange }: {
  value: 'cash' | 'transfer';
  onChange: (value: 'cash' | 'transfer') => void;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white">Método de pago</h3>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={() => onChange('cash')}
        className={`glass-card p-6 text-left transition-all duration-300 ${
          value === 'cash' 
            ? 'border-accent-red bg-accent-red-light' 
            : 'hover:border-gray-600'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">💵</span>
          <div>
            <h4 className="font-semibold text-white">Efectivo</h4>
            <p className="text-sm text-gray-400">Pago contra entrega</p>
          </div>
        </div>
        <p className="text-sm text-accent-gold">Recomendado</p>
      </button>

      <button
        onClick={() => onChange('transfer')}
        className={`glass-card p-6 text-left transition-all duration-300 ${
          value === 'transfer' 
            ? 'border-accent-red bg-accent-red-light' 
            : 'hover:border-gray-600'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">💳</span>
          <div>
            <h4 className="font-semibold text-white">Transferencia</h4>
            <p className="text-sm text-gray-400">Banco o billetera digital</p>
          </div>
        </div>
        <p className="text-sm text-gray-400">Te enviaremos los datos</p>
      </button>
    </div>
  </div>
);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [orderForm, setOrderForm] = useState<OrderForm>({
    customer_name: '',
    customer_phone: '',
    delivery_type: 'delivery',
    delivery_address: '',
    payment_method: 'cash',
    notes: ''
  });

  // Cargar configuración
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data.data);
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    };

    fetchSettings();
  }, []);

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items.length, router]);

  // Validación de formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!orderForm.customer_name.trim()) {
      newErrors.customer_name = 'El nombre es requerido';
    }

    if (!orderForm.customer_phone.trim()) {
      newErrors.customer_phone = 'El teléfono es requerido';
    } else if (!isValidPhoneNumber(orderForm.customer_phone)) {
      newErrors.customer_phone = 'Formato de teléfono inválido';
    }

    if (orderForm.delivery_type === 'delivery' && !orderForm.delivery_address?.trim()) {
      newErrors.delivery_address = 'La dirección es requerida para delivery';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calcular totales
  const subtotal = getSubtotal();
  const deliveryCost = orderForm.delivery_type === 'delivery' && !settings?.is_delivery_free 
    ? settings?.delivery_cost || 0 
    : 0;
  const total = subtotal + deliveryCost;

  // Manejar envío de pedido
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderForm,
          cartItems: items
        })
      });

      if (!response.ok) {
        throw new Error('Error al procesar el pedido');
      }

      const data = await response.json();
      
      // Limpiar carrito
      clearCart();
      
      // Redirigir a WhatsApp
      if (data.data.whatsapp_url) {
        window.open(data.data.whatsapp_url, '_blank');
      }
      
      // Redirigir a página de confirmación
      router.push(`/order-confirmation/${data.data.order.id}`);
      
    } catch (error) {
      console.error('Error al enviar pedido:', error);
      alert('Error al procesar el pedido. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // El useEffect manejará la redirección
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass-card border-0 border-b border-border-primary bg-black/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="font-medium">Volver</span>
            </button>
            
            <h1 className="text-xl font-bold text-white">Finalizar Pedido</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pasos del checkout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 p-6 glass-card">
          <CheckoutStep 
            step={1} 
            currentStep={currentStep}
            title="Información personal"
            description="Datos de contacto"
          />
          <div className="hidden sm:block w-8 h-px bg-gray-600"></div>
          <CheckoutStep 
            step={2} 
            currentStep={currentStep}
            title="Entrega y pago"
            description="Método preferido"
          />
          <div className="hidden sm:block w-8 h-px bg-gray-600"></div>
          <CheckoutStep 
            step={3} 
            currentStep={currentStep}
            title="Confirmación"
            description="Revisar pedido"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información personal */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Información de contacto</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                  label="Nombre completo"
                  type="text"
                  value={orderForm.customer_name}
                  onChange={(e: any) => setOrderForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Tu nombre"
                  required
                  error={errors.customer_name}
                />
                
                <InputField
                  label="Teléfono / WhatsApp"
                  type="tel"
                  value={orderForm.customer_phone}
                  onChange={(e: any) => setOrderForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                  placeholder="+54 9 11 1234-5678"
                  required
                  error={errors.customer_phone}
                />
              </div>
            </div>

            {/* Método de entrega */}
            <div className="glass-card p-6">
              <DeliveryMethod
                value={orderForm.delivery_type}
                onChange={(value) => setOrderForm(prev => ({ ...prev, delivery_type: value }))}
                deliveryCost={settings?.delivery_cost || 0}
                isFree={settings?.is_delivery_free || false}
              />
              
              {orderForm.delivery_type === 'delivery' && (
                <div className="mt-6">
                  <InputField
                    label="Dirección de entrega"
                    type="text"
                    value={orderForm.delivery_address || ''}
                    onChange={(e: any) => setOrderForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                    placeholder="Calle, número, piso, departamento"
                    required
                    error={errors.delivery_address}
                  />
                </div>
              )}
            </div>

            {/* Método de pago */}
            <div className="glass-card p-6">
              <PaymentMethod
                value={orderForm.payment_method}
                onChange={(value) => setOrderForm(prev => ({ ...prev, payment_method: value }))}
              />
            </div>

            {/* Notas adicionales */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Notas adicionales (opcional)</h3>
              <textarea
                value={orderForm.notes || ''}
                onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Alguna indicación especial para tu pedido..."
                rows={3}
                className="input-premium w-full resize-none"
              />
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-6">Resumen del pedido</h3>
              
              {/* Items */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1 mr-2">
                      <p className="text-white font-medium">{item.product.name}</p>
                      <p className="text-gray-400">Qty: {item.quantity}</p>
                      {item.selected_variations.length > 0 && (
                        <p className="text-xs text-accent-gold">
                          {item.selected_variations.map(v => v.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="text-white font-medium">{formatPrice(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              
              {/* Totales */}
              <div className="space-y-3 border-t border-border-primary pt-6">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-gray-300">
                  <span>Envío</span>
                  <span className={deliveryCost === 0 ? "text-accent-gold" : ""}>
                    {deliveryCost === 0 ? 'Gratis' : formatPrice(deliveryCost)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xl font-bold border-t border-border-primary pt-3">
                  <span className="text-white">Total</span>
                  <span className="text-gradient-red">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Botón de confirmar */}
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="btn-primary w-full justify-center text-lg py-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Pedido</span>
                    <span>🚀</span>
                  </>
                )}
              </button>

              {/* Información de contacto */}
              {settings && (
                <div className="mt-6 p-4 bg-accent-red-light rounded-lg">
                  <p className="text-sm text-center text-gray-300">
                    ¿Dudas? Contactanos al{' '}
                    <a 
                      href={`tel:${settings.phone}`}
                      className="text-accent-gold font-medium hover:underline"
                    >
                      {settings.phone}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}