// src/components/Animations.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

// Variantes de animación reutilizables
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  
  slideIn: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.2 }
  },
  
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }
};

// Componente para animar productos
export const AnimatedProductCard = ({ children, index = 0 }: { children: ReactNode, index?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ 
      duration: 0.4, 
      delay: index * 0.05,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}
    whileHover={{ 
      scale: 1.03,
      transition: { duration: 0.2 }
    }}
    whileTap={{ scale: 0.98 }}
  >
    {children}
  </motion.div>
);

// Layout animado para transiciones de página
export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

// Botón animado con feedback
export const AnimatedButton = ({ 
  children, 
  onClick, 
  className = '',
  variant = 'primary'
}: { 
  children: ReactNode, 
  onClick?: () => void, 
  className?: string,
  variant?: 'primary' | 'secondary' | 'danger'
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-red-600 to-red-500',
    secondary: 'bg-gray-700',
    danger: 'bg-red-600'
  };

  return (
    <motion.button
      className={`${variants[variant]} ${className} relative overflow-hidden`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <motion.span
        className="absolute inset-0 bg-white"
        initial={{ scale: 0, opacity: 0.3 }}
        whileHover={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{ borderRadius: '50%' }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

// Toast animado
export const AnimatedToast = ({ message, show }: { message: string, show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-full shadow-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
          >
            ✓ {message}
          </motion.div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Modal animado
export const AnimatedModal = ({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  children: ReactNode 
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// Hook para animaciones de scroll
export const useScrollAnimation = () => {
  return {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.6, ease: 'easeOut' }
  };
};