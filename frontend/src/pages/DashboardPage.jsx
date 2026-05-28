import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient } from '../api/clients.js';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import { ClientCreationModal } from '../components/dashboard/ClientCreationModal.jsx';
import { MemberInvitationModal } from '../components/dashboard/MemberInvitationModal.jsx';
import { LoadingCard, ErrorCard } from '../components/ui/index.js';

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = React.useState(false);

  // Contenedor de referencia para calcular coordenadas locales del cursor
  const containerRef = React.useRef(null);

  // Valores de movimiento del mouse (normalizados de -0.5 a 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Springs para suavizar orgánicamente el movimiento 3D de las formas geométricas
  const springConfig = { damping: 25, stiffness: 100, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Mapeos 3D e interactivos para las figuras geométricas (Parallax y Rotaciones)
  const geomRotateX = useTransform(smoothY, [-0.5, 0.5], [25, -25]);
  const geomRotateY = useTransform(smoothX, [-0.5, 0.5], [-30, 30]);

  const geomTranslateX1 = useTransform(smoothX, [-0.5, 0.5], [-18, 18]);
  const geomTranslateY1 = useTransform(smoothY, [-0.5, 0.5], [-14, 14]);

  const geomTranslateX2 = useTransform(smoothX, [-0.5, 0.5], [12, -12]);
  const geomTranslateY2 = useTransform(smoothY, [-0.5, 0.5], [18, -18]);

  // Consultamos los clientes para verificar estado de carga o error
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const createClientMutation = useMutation({
    mutationFn: payload =>
      toast.promise(createClient(payload), {
        loading: 'Creando cliente…',
        success: 'Cliente creado',
        error: e => e.message || 'No se pudo crear el cliente',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  // Escuchamos el cursor para animar el Bento y las figuras geométricas
  React.useEffect(() => {
    const handleMouseMove = e => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        // Calcular la distancia al centro de la pantalla/tarjeta
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = (e.clientX - centerX) / (window.innerWidth / 2);
        const dy = (e.clientY - centerY) / (window.innerHeight / 2);

        mouseX.set(Math.max(-0.5, Math.min(0.5, dx)));
        mouseY.set(Math.max(-0.5, Math.min(0.5, dy)));
      } else {
        const normX = e.clientX / window.innerWidth - 0.5;
        const normY = e.clientY / window.innerHeight - 0.5;
        mouseX.set(normX);
        mouseY.set(normY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Si hay algún evento global de creación de cliente, lo escuchamos
  React.useEffect(() => {
    const handleOpenCreateClient = () => setIsModalOpen(true);
    window.addEventListener('cadence:open-create-client', handleOpenCreateClient);
    return () => window.removeEventListener('cadence:open-create-client', handleOpenCreateClient);
  }, []);

  if (isError) {
    return (
      <ErrorCard
        title='Error al cargar la plataforma'
        message={error.message}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <LoadingCard message='Cargando entorno creativo...' />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className='min-h-[calc(100vh-80px)] flex flex-col items-center justify-center max-w-4xl mx-auto px-6 py-12 select-none relative overflow-hidden'
    >
      {/* Glow auras background */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#7C5CFC]/8 to-[#4ECDC4]/3 blur-[140px] pointer-events-none z-0' />

      <div className='w-full flex flex-col items-center text-center z-10 relative'>
        {/* Overlapping Glassmorphic Stack Graphic (Pure CSS & SVG with Framer Motion) */}
        <div className='relative w-full max-w-[400px] h-[240px] flex items-center justify-center mb-10'>
          {/* Card 1: Trends Widget (Left back) */}
          <motion.div
            initial={{ opacity: 0, x: -60, y: 20, rotate: -8, scale: 0.9 }}
            animate={{ opacity: 1, x: -80, y: 15, rotate: -12, scale: 0.95 }}
            whileHover={{ y: 0, scale: 1.02, zIndex: 30, transition: { duration: 0.2 } }}
            className='absolute w-[180px] h-[180px] rounded-[24px] border border-white/[0.06] bg-[#121220]/60 backdrop-blur-md p-5 flex flex-col justify-between shadow-2xl text-left'
          >
            <div className='flex items-center justify-between'>
              <div className='w-9 h-9 rounded-xl bg-[#4ECDC4]/10 border border-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4]'>
                <svg
                  className='w-5 h-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                  />
                </svg>
              </div>
              <span className='text-[9px] font-extrabold uppercase tracking-wider text-[#4ECDC4] bg-[#4ECDC4]/10 px-2 py-0.5 rounded-full'>
                Tendencias
              </span>
            </div>
            <div className='flex flex-col gap-2'>
              <div className='h-2 w-16 bg-white/10 rounded-full' />
              <div className='h-1.5 w-24 bg-white/5 rounded-full' />
              <div className='flex items-end gap-1.5 h-12 pt-3'>
                <div className='w-2.5 h-6 bg-[#4ECDC4]/20 rounded-md' />
                <div className='w-2.5 h-9 bg-[#4ECDC4]/35 rounded-md' />
                <div className='w-2.5 h-12 bg-[#4ECDC4]/60 rounded-md animate-pulse' />
                <div className='w-2.5 h-7 bg-[#4ECDC4]/40 rounded-md' />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Calendar Widget (Right back) */}
          <motion.div
            initial={{ opacity: 0, x: 60, y: 20, rotate: 8, scale: 0.9 }}
            animate={{ opacity: 1, x: 80, y: 15, rotate: 12, scale: 0.95 }}
            whileHover={{ y: 0, scale: 1.02, zIndex: 30, transition: { duration: 0.2 } }}
            className='absolute w-[180px] h-[180px] rounded-[24px] border border-white/[0.06] bg-[#121220]/60 backdrop-blur-md p-5 flex flex-col justify-between shadow-2xl text-left'
          >
            <div className='flex items-center justify-between'>
              <div className='w-9 h-9 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 flex items-center justify-center text-[#FF6B6B]'>
                <svg
                  className='w-5 h-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <span className='text-[9px] font-extrabold uppercase tracking-wider text-[#FF6B6B] bg-[#FF6B6B]/10 px-2 py-0.5 rounded-full'>
                Estrategia
              </span>
            </div>
            <div className='flex flex-col gap-2'>
              <div className='h-2 w-20 bg-white/10 rounded-full' />
              <div className='h-1.5 w-12 bg-white/5 rounded-full' />
              <div className='grid grid-cols-4 gap-2 pt-3'>
                <div className='aspect-square bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[9px] text-text-muted'>
                  1
                </div>
                <div className='aspect-square bg-[#FF6B6B]/20 border border-[#FF6B6B]/40 rounded-lg flex items-center justify-center text-[9px] text-[#FF6B6B] font-bold'>
                  2
                </div>
                <div className='aspect-square bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[9px] text-text-muted'>
                  3
                </div>
                <div className='aspect-square bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[9px] text-text-muted'>
                  4
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Inspiration & AI (Center front, floating) */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: [0, -10, 0],
              scale: 1,
            }}
            transition={{
              y: {
                repeat: Infinity,
                duration: 5,
                ease: 'easeInOut',
              },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
            }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            className='absolute w-[200px] h-[200px] rounded-[28px] border border-white/15 bg-gradient-to-b from-[#18182E] to-[#0C0C18] p-6 flex flex-col justify-between shadow-2xl z-20 text-left'
          >
            <div className='flex items-center justify-between'>
              <div className='w-10 h-10 rounded-2xl bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 flex items-center justify-center text-[#7C5CFC]'>
                <svg
                  className='w-5 h-5 animate-pulse'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                  />
                </svg>
              </div>
              <div className='w-2 h-2 rounded-full bg-[#7C5CFC] animate-ping' />
            </div>
            <div className='flex flex-col gap-2'>
              <span className='text-[10px] font-black uppercase tracking-wider text-[#7C5CFC]'>
                Agencia de Ideas
              </span>
              <div className='h-2.5 w-28 bg-white/20 rounded-full' />
              <div className='h-1.5 w-20 bg-white/10 rounded-full' />
              <div className='h-1.5 w-16 bg-white/5 rounded-full' />
            </div>
          </motion.div>
        </div>

        {/* Textos de Bienvenida Lexend */}
        <h1 className='text-3xl sm:text-4xl font-title font-black text-text-primary tracking-tight leading-snug max-w-xl'>
          Diseñá y gestioná el contenido de tus{' '}
          <span className='bg-gradient-to-r from-[#7C5CFC] to-[#FF6B6B] bg-clip-text text-transparent'>
            marcas
          </span>
        </h1>

        <p className='text-sm text-text-muted leading-relaxed max-w-lg mt-4 font-normal'>
          Selecciona un cliente desde el panel lateral izquierdo para ingresar a su cronograma,
          analizar tendencias con IA, gestionar documentos y refinar su identidad de marca.
        </p>

        {/* Formas Geométricas Interactivas (Parallax y Giro 3D con Mouse) */}
        <div
          className='flex justify-center items-center gap-10 my-10 relative z-20 select-none'
          style={{ perspective: 1000 }}
        >
          {/* Figura 1: Círculo/Anillo Táctico Menta (Estrategia/Tendencias) */}
          <motion.div
            style={{
              x: geomTranslateX1,
              y: geomTranslateY1,
              rotateX: geomRotateX,
              rotateY: geomRotateY,
              transformStyle: 'preserve-3d',
            }}
            whileHover={{ scale: 1.15, transition: { duration: 0.2 } }}
            className='w-20 h-20 flex items-center justify-center relative group cursor-pointer'
          >
            {/* Resplandor trasero de hover */}
            <div className='absolute inset-0 rounded-full bg-[#4ECDC4]/5 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

            <svg
              className='w-16 h-16 text-[#4ECDC4] drop-shadow-[0_0_12px_rgba(78,205,196,0.25)] group-hover:drop-shadow-[0_0_18px_rgba(78,205,196,0.55)] transition-all duration-300'
              fill='none'
              viewBox='0 0 100 100'
            >
              <circle
                cx='50'
                cy='50'
                r='35'
                stroke='currentColor'
                strokeWidth='4'
                strokeDasharray='10 15 25 10'
                className='animate-[spin_18s_linear_infinite]'
              />
              <circle
                cx='50'
                cy='50'
                r='25'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeOpacity='0.4'
              />
              <circle cx='50' cy='15' r='4.5' fill='currentColor' className='animate-pulse' />
            </svg>
          </motion.div>

          {/* Figura 2: Prisma/Cubo Isometrico Violeta (AI & Copywriting) */}
          <motion.div
            style={{
              x: geomTranslateX2,
              y: geomTranslateY2,
              rotateX: geomRotateY,
              rotateY: geomRotateX,
              transformStyle: 'preserve-3d',
            }}
            whileHover={{ scale: 1.18, transition: { duration: 0.2 } }}
            className='w-24 h-24 flex items-center justify-center relative group cursor-pointer'
          >
            {/* Resplandor trasero de hover */}
            <div className='absolute inset-0 rounded-full bg-[#7C5CFC]/5 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

            <svg
              className='w-18 h-18 text-[#7C5CFC] drop-shadow-[0_0_12px_rgba(124,92,252,0.25)] group-hover:drop-shadow-[0_0_18px_rgba(124,92,252,0.55)] transition-all duration-300'
              fill='none'
              viewBox='0 0 100 100'
            >
              {/* Outer Hexagon */}
              <polygon
                points='50,15 80,32.5 80,67.5 50,85 20,67.5 20,32.5'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinejoin='round'
              />
              {/* Isometric Lines */}
              <line
                x1='50'
                y1='15'
                x2='50'
                y2='50'
                stroke='currentColor'
                strokeWidth='2'
                strokeDasharray='2 2'
                strokeOpacity='0.5'
              />
              <line
                x1='20'
                y1='32.5'
                x2='50'
                y2='50'
                stroke='currentColor'
                strokeWidth='2'
                strokeDasharray='2 2'
                strokeOpacity='0.5'
              />
              <line
                x1='80'
                y1='32.5'
                x2='50'
                y2='50'
                stroke='currentColor'
                strokeWidth='2'
                strokeDasharray='2 2'
                strokeOpacity='0.5'
              />

              <line
                x1='50'
                y1='85'
                x2='50'
                y2='50'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinejoin='round'
              />
              <line
                x1='20'
                y1='67.5'
                x2='50'
                y2='50'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinejoin='round'
              />
              <line
                x1='80'
                y1='67.5'
                x2='50'
                y2='50'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinejoin='round'
              />

              {/* Center Node */}
              <circle cx='50' cy='50' r='4.5' fill='currentColor' className='animate-pulse' />
            </svg>
          </motion.div>

          {/* Figura 3: Tetraedro/Triangulo Coral (Diseño & Estilo) */}
          <motion.div
            style={{
              x: geomTranslateX1,
              y: geomTranslateY2,
              rotateX: geomRotateX,
              rotateY: geomRotateY,
              transformStyle: 'preserve-3d',
            }}
            whileHover={{ scale: 1.15, transition: { duration: 0.2 } }}
            className='w-20 h-20 flex items-center justify-center relative group cursor-pointer'
          >
            {/* Resplandor trasero de hover */}
            <div className='absolute inset-0 rounded-full bg-[#FF6B6B]/5 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

            <svg
              className='w-16 h-16 text-[#FF6B6B] drop-shadow-[0_0_12px_rgba(255,107,107,0.25)] group-hover:drop-shadow-[0_0_18px_rgba(255,107,107,0.55)] transition-all duration-300'
              fill='none'
              viewBox='0 0 100 100'
            >
              <polygon
                points='50,15 85,75 15,75'
                stroke='currentColor'
                strokeWidth='3'
                strokeLinejoin='round'
              />
              <line
                x1='50'
                y1='15'
                x2='50'
                y2='55'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeOpacity='0.4'
              />
              <line
                x1='15'
                y1='75'
                x2='50'
                y2='55'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeOpacity='0.4'
              />
              <line
                x1='85'
                y1='75'
                x2='50'
                y2='55'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeOpacity='0.4'
              />
              <circle cx='50' cy='55' r='3.5' fill='currentColor' />
            </svg>
          </motion.div>
        </div>

        {/* Botones de acción centralizados */}
        <div className='flex justify-center items-center gap-4 flex-wrap mt-8'>
          <button
            id='add-client-button'
            onClick={() => setIsModalOpen(true)}
            className='px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-200 bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.4)] active:scale-[0.98]'
            aria-label='Abrir modal para añadir nuevo cliente'
          >
            + Añadir Cliente
          </button>

          <button
            id='add-member-button'
            onClick={() => setIsMemberModalOpen(true)}
            className='px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-200 bg-[#38bdf8] hover:bg-[#0ea5e9] text-white shadow-[0_4px_14px_rgba(56,189,248,0.2)] hover:shadow-[0_6px_20px_rgba(56,189,248,0.3)] active:scale-[0.98]'
            aria-label='Abrir modal para invitar nuevo miembro'
          >
            + Invitar Colaborador
          </button>
        </div>
      </div>

      <ClientCreationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <MemberInvitationModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
      />
    </div>
  );
};
