import React, { Suspense, lazy } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient } from '../api/clients.js';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import { LoadingCard, ErrorCard, ShortcutTooltip } from '../components/ui/index.js';

// Lazy loading de modales del dashboard
const ClientCreationModal = lazy(() => import('../components/dashboard/ClientCreationModal.jsx').then(m => ({ default: m.ClientCreationModal })));
const MemberInvitationModal = lazy(() => import('../components/dashboard/MemberInvitationModal.jsx').then(m => ({ default: m.MemberInvitationModal })));
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLanguage, useAuth } from '../hooks';

export const DashboardPage = () => {
  const { lang, t } = useLanguage();
  const { isOwnBusiness } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const brandColors = ['#FF6B6B', '#4ECDC4', '#7C5CFC', '#FFD166', '#68D391', '#F06292'];

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

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = React.useState(false);
  const [isShapesHovered, setIsShapesHovered] = React.useState(false);

  // Contenedor de referencia para calcular coordenadas locales del cursor
  const containerRef = React.useRef(null);
  const flowerDotRef = React.useRef(null);
  const springCoilRef = React.useRef(null);

  // Animaciones elásticas e interactivas premium con GSAP
  useGSAP(() => {
    // Evitar ejecutar animaciones si el entorno está cargando, con error o los elementos no se han montado aún en el DOM
    if (isLoading || isError) return;
    if (!containerRef.current || !flowerDotRef.current || !springCoilRef.current) return;

    // 1. Revelación cinemática de las palabras en el montaje (deslizamiento y blur)
    const words = gsap.utils.toArray(".word-disena, .word-gestiona, .word-marcas, .hero-plain-word");
    gsap.fromTo(words,
      { opacity: 0, y: 45, filter: "blur(12px)", transformPerspective: 1000, rotateX: -15 },
      { opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0, duration: 1.4, stagger: 0.08, ease: "power4.out", delay: 0.15 }
    );

    // 2. Entrada rebotante elástica para los dos elementos SVG interactivos
    gsap.fromTo([flowerDotRef.current, springCoilRef.current],
      { scale: 0, rotation: -120 },
      { scale: 1, rotation: 0, duration: 1.5, stagger: 0.25, ease: "back.out(2)", delay: 0.55 }
    );

    // 3. Rotación infinita y lenta en el punto de flor de "Diseñá"
    gsap.to(flowerDotRef.current, {
      rotation: "+=360",
      duration: 35,
      repeat: -1,
      ease: "none"
    });

    // 4. Serpenteo continuo del trazo en el resorte de "gestioná" (efecto serpiente/pulso neón en loop)
    const springPath = springCoilRef.current.querySelector(".spring-snake-path");
    const pathLength = springPath.getTotalLength();
    
    gsap.set(springPath, {
      strokeDasharray: `${pathLength * 0.35} ${pathLength * 0.65}`,
      strokeDashoffset: pathLength
    });

    const springLoop = gsap.to(springPath, {
      strokeDashoffset: 0,
      duration: 1.4,
      repeat: -1,
      ease: "none"
    });

    // 5. Disparadores de hover dinámicos y notorios para la palabra "Diseñá"
    const wordDisena = document.querySelector(".word-disena");
    if (wordDisena) {
      const handleEnter = () => {
        gsap.to(wordDisena, { scale: 1.05, duration: 0.35, ease: "back.out(2)" });
        gsap.to(flowerDotRef.current, { rotation: "+=180", scale: 1.45, duration: 0.6, ease: "back.out(1.5)" });
      };
      const handleLeave = () => {
        gsap.to(wordDisena, { scale: 1, duration: 0.45, ease: "power2.out" });
        gsap.to(flowerDotRef.current, { scale: 1, duration: 0.45, ease: "power2.out" });
      };
      wordDisena.addEventListener("mouseenter", handleEnter);
      wordDisena.addEventListener("mouseleave", handleLeave);
      wordDisena._enter = handleEnter;
      wordDisena._leave = handleLeave;
    }

    // 6. Disparadores de hover dinámicos y notorios para la palabra "gestioná"
    const wordGestiona = document.querySelector(".word-gestiona");
    if (wordGestiona) {
      const handleEnter = () => {
        gsap.to(wordGestiona, { scale: 1.04, duration: 0.3, ease: "power2.out" });
        
        // Aceleración suave del flujo del trazo (serpiente) a 3.5x de velocidad en hover
        gsap.to(springLoop, { timeScale: 3.5, duration: 0.4, ease: "power2.out" });

        // Animación dinámica del grosor del trazo en hover (pulso neón)
        gsap.to(springPath, { strokeWidth: 8, duration: 0.3, ease: "power2.out" });
      };
      const handleLeave = () => {
        gsap.to(wordGestiona, { scale: 1, duration: 0.45, ease: "power2.out" });
        
        // Retorno progresivo a la velocidad de crucero normal del trazo y grosor original
        gsap.to(springLoop, { timeScale: 1, duration: 0.6, ease: "power2.out" });
        gsap.to(springPath, { strokeWidth: 6, duration: 0.45, ease: "power2.out" });
      };
      wordGestiona.addEventListener("mouseenter", handleEnter);
      wordGestiona.addEventListener("mouseleave", handleLeave);
      wordGestiona._enter = handleEnter;
      wordGestiona._leave = handleLeave;
    }

    // 6. Disparadores de hover dinámicos para la palabra "marcas"
    const wordMarcas = document.querySelector(".word-marcas");
    if (wordMarcas) {
      const handleEnter = () => {
        gsap.to(wordMarcas, { scale: 1.08, duration: 0.3, ease: "back.out(2)" });
      };
      const handleLeave = () => {
        gsap.to(wordMarcas, { scale: 1, duration: 0.4, ease: "power2.out" });
      };
      wordMarcas.addEventListener("mouseenter", handleEnter);
      wordMarcas.addEventListener("mouseleave", handleLeave);
      wordMarcas._enter = handleEnter;
      wordMarcas._leave = handleLeave;
    }

    // 7. Animación infinita y fluida del subrayado ondulado en "marcas" (desplazamiento continuo)
    gsap.fromTo(".wavy-underline-path",
      { x: 0 },
      { x: -40, duration: 1.6, repeat: -1, ease: "none" }
    );

    // 8. Efecto Parallax interactivo con física/inercia y flotación para figuras cartoon
    const shapeWrappers = gsap.utils.toArray(".gsap-cartoon-shape-wrapper");
    const shapeInners = gsap.utils.toArray(".gsap-cartoon-shape-inner");

    // A. Flotación oscilante continua independiente para cada forma (Idle)
    shapeInners.forEach((inner, i) => {
      const duration = 2.2 + i * 0.35;
      const rotationMax = 5 + i * 2.5; // oscilación sutil
      const yOffset = 6 + i * 2;

      // Movimiento vertical flotante
      gsap.to(inner, {
        y: `-=${yOffset}`,
        duration: duration,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.2
      });

      // Rotación oscilante
      gsap.to(inner, {
        rotation: rotationMax,
        duration: duration * 1.25,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.15
      });
    });

    // B. Reacción elástica en Hover sobre las formas
    shapeWrappers.forEach((wrapper) => {
      const svg = wrapper.querySelector(".gsap-cartoon-shape-svg");
      if (!svg) return;

      const onEnter = () => {
        gsap.to(svg, {
          scale: 1.3,
          rotation: 25,
          duration: 0.6,
          ease: "elastic.out(1.2, 0.4)"
        });
      };

      const onLeave = () => {
        gsap.to(svg, {
          scale: 1,
          rotation: 0,
          duration: 0.5,
          ease: "power2.out"
        });
      };

      wrapper.addEventListener("mouseenter", onEnter);
      wrapper.addEventListener("mouseleave", onLeave);
      wrapper._enterHandler = onEnter;
      wrapper._leaveHandler = onLeave;
    });

    // C. Desplazamiento Parallax interactivo amortiguado (reactivo al cursor)
    const parallaxCoeffs = [
      { x: -30, y: -20 }, // Corazón
      { x: 25, y: -25 },  // Sol
      { x: -20, y: 30 },  // Flor
      { x: 20, y: 15 }    // Domo
    ];

    const xQuickTo = shapeWrappers.map((el, i) => 
      gsap.quickTo(el, "x", { duration: 0.7 + i * 0.12, ease: "power3.out" })
    );
    const yQuickTo = shapeWrappers.map((el, i) => 
      gsap.quickTo(el, "y", { duration: 0.7 + i * 0.12, ease: "power3.out" })
    );

    const handleMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth) - 0.5;
      const normY = (e.clientY / window.innerHeight) - 0.5;

      xQuickTo.forEach((qt, i) => {
        if (parallaxCoeffs[i] && qt) qt(normX * parallaxCoeffs[i].x);
      });
      yQuickTo.forEach((qt, i) => {
        if (parallaxCoeffs[i] && qt) qt(normY * parallaxCoeffs[i].y);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (wordDisena) {
        wordDisena.removeEventListener("mouseenter", wordDisena._enter);
        wordDisena.removeEventListener("mouseleave", wordDisena._leave);
      }
      if (wordGestiona) {
        wordGestiona.removeEventListener("mouseenter", wordGestiona._enter);
        wordGestiona.removeEventListener("mouseleave", wordGestiona._leave);
      }
      if (wordMarcas) {
        wordMarcas.removeEventListener("mouseenter", wordMarcas._enter);
        wordMarcas.removeEventListener("mouseleave", wordMarcas._leave);
      }
      
      // Limpieza de Parallax y listeners de formas cartoon
      window.removeEventListener("mousemove", handleMouseMove);
      shapeWrappers.forEach((wrapper) => {
        if (wrapper._enterHandler) {
          wrapper.removeEventListener("mouseenter", wrapper._enterHandler);
        }
        if (wrapper._leaveHandler) {
          wrapper.removeEventListener("mouseleave", wrapper._leaveHandler);
        }
      });
    };
  }, { scope: containerRef, dependencies: [isLoading, isError] });

  const createClientMutation = useMutation({
    mutationFn: payload =>
      toast.promise(createClient(payload), {
        loading: t.dashboard.creatingClient || 'Creando cliente…',
        success: t.dashboard.clientCreated || 'Cliente creado',
        error: e => e.message || (lang === 'es' ? 'No se pudo crear el cliente' : 'Could not create client'),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  // Si hay algún evento global de creación de cliente, lo escuchamos
  React.useEffect(() => {
    const handleOpenCreateClient = () => setIsModalOpen(true);
    window.addEventListener('cadence:open-create-client', handleOpenCreateClient);
    return () => window.removeEventListener('cadence:open-create-client', handleOpenCreateClient);
  }, []);

  if (isError) {
    return (
      <ErrorCard
        title={t.dashboard.errorLoading || 'Error al cargar la plataforma'}
        message={error.message}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isLoading) {
    const cachedId = localStorage.getItem('cadence_last_active_client_id');
    if (isOwnBusiness && cachedId) {
      return null; // Evitar parpadeo del LoadingCard si vamos a redirigir de inmediato
    }
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <LoadingCard message={t.dashboard.loadingFeed || 'Cargando entorno creativo...'} />
      </div>
    );
  }  const clients = response?.data || [];

  React.useEffect(() => {
    if (isOwnBusiness) {
      const cachedId = localStorage.getItem('cadence_last_active_client_id');
      if (cachedId) {
        navigate(`/clients/${cachedId}`, { replace: true });
        return;
      }
      if (!isLoading && !isError && clients.length > 0) {
        navigate(`/clients/${clients[0].id}`, { replace: true });
      }
    }
  }, [isOwnBusiness, isLoading, isError, clients, navigate]);

  return (
    <div
      ref={containerRef}
      className='h-[calc(100vh-48px)] max-h-[calc(100vh-48px)] flex items-center justify-center max-w-6xl mx-auto px-6 select-none relative overflow-hidden'
    >
      {/* Glow auras background */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#7C5CFC]/8 to-[#4ECDC4]/3 blur-[140px] pointer-events-none z-0' />

      <div className='w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10 relative py-2'>
        {/* Columna Izquierda: Hero, Formas, Botones */}
        <div className='md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left justify-center'>
          {/* Textos de Bienvenida Lexend */}
          {lang === 'es' ? (
            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-title font-black text-text-primary tracking-tight leading-[1.2] max-w-xl text-center md:text-left select-none flex flex-wrap items-center justify-center md:justify-start gap-y-1'>
              {/* Palabra: Diseñá */}
              <span className="word-disena inline-block relative cursor-pointer mr-3 group">
                {t.dashboard.welcomeTitle1}<span className="relative inline-block">
                  ı
                  <svg
                    ref={flowerDotRef}
                    className="absolute -top-[44%] left-1/2 -translate-x-1/2 w-[1.15em] h-[1.15em] pointer-events-none drop-shadow-[0_0_12px_rgba(253,186,116,0.5)]"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <radialGradient id="hero-flower-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FEC5FB" />
                        <stop offset="50%" stopColor="#FF9C7C" />
                        <stop offset="100%" stopColor="#E76F00" />
                      </radialGradient>
                    </defs>
                    <path
                      d="M50 50 C20 20, 20 80, 50 50 C80 20, 80 80, 50 50 C20 20, 80 20, 50 50 C20 80, 80 80, 50 50 Z"
                      fill="url(#hero-flower-grad)"
                    />
                    <circle cx="50" cy="50" r="10" fill="#030307" />
                  </svg>
                </span>á
              </span>

              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle2}</span>

              {/* Palabra: gestioná */}
              <span className="word-gestiona inline-block relative cursor-pointer mr-3 group">
                {t.dashboard.welcomeTitle3.substring(0, 4)}<span className="relative inline-block">
                  ı
                  <svg
                    ref={springCoilRef}
                    className="absolute -top-[110%] left-1/2 -translate-x-1/2 w-[1.25em] h-[1.45em] pointer-events-none drop-shadow-[0_0_12px_rgba(78,205,196,0.45)] z-10"
                    viewBox="0 0 40 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="hero-spring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4ECDC4" />
                        <stop offset="100%" stopColor="#7C5CFC" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 20 8 C 32 8, 32 18, 20 18 C 8 18, 8 28, 20 28 C 32 28, 32 38, 20 38 C 8 38, 8 46, 20 46"
                      stroke="url(#hero-spring-grad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      opacity="0.15"
                    />
                    <path
                      className="spring-snake-path"
                      d="M 20 8 C 32 8, 32 18, 20 18 C 8 18, 8 28, 20 28 C 32 28, 32 38, 20 38 C 8 38, 8 46, 20 46"
                      stroke="url(#hero-spring-grad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{t.dashboard.welcomeTitle3.substring(5)}
              </span>

              <div className='w-full hidden md:block' />

              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle4}</span>
              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle5}</span>
              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle6}</span>
              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle7}</span>

              {/* Palabra: marcas */}
              <span className="word-marcas inline-block relative cursor-pointer bg-gradient-to-r from-[#7C5CFC] to-[#FF6B6B] bg-clip-text text-transparent ml-2.5 pb-2.5">
                {t.dashboard.welcomeTitle8}
                <svg 
                  className="absolute left-0 -bottom-1.5 w-full h-3 overflow-hidden pointer-events-none" 
                  viewBox="0 0 100 12" 
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="underline-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7C5CFC" />
                      <stop offset="100%" stopColor="#FF6B6B" />
                    </linearGradient>
                  </defs>
                  <path
                    className="wavy-underline-path"
                    d="M -40,6 Q -30,0 -20,6 T 0,6 T 20,6 T 40,6 T 60,6 T 80,6 T 100,6 T 120,6 T 140,6"
                    fill="none"
                    stroke="url(#underline-wave-grad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
          ) : (
            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-title font-black text-text-primary tracking-tight leading-[1.2] max-w-xl text-center md:text-left select-none flex flex-wrap items-center justify-center md:justify-start gap-y-1'>
              {/* Palabra: Design */}
              <span className="word-disena inline-block relative cursor-pointer mr-3 group">
                Des<span className="relative inline-block">
                  ı
                  <svg
                    ref={flowerDotRef}
                    className="absolute -top-[44%] left-1/2 -translate-x-1/2 w-[1.15em] h-[1.15em] pointer-events-none drop-shadow-[0_0_12px_rgba(253,186,116,0.5)]"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <radialGradient id="hero-flower-grad-en" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FEC5FB" />
                        <stop offset="50%" stopColor="#FF9C7C" />
                        <stop offset="100%" stopColor="#E76F00" />
                      </radialGradient>
                    </defs>
                    <path
                      d="M50 50 C20 20, 20 80, 50 50 C80 20, 80 80, 50 50 C20 20, 80 20, 50 50 C20 80, 80 80, 50 50 Z"
                      fill="url(#hero-flower-grad-en)"
                    />
                    <circle cx="50" cy="50" r="10" fill="#030307" />
                  </svg>
                </span>gn
              </span>

              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle2}</span>

              {/* Palabra: manage */}
              <span className="word-gestiona inline-block relative cursor-pointer mr-3 group">
                man<span className="relative inline-block">
                  a
                  <svg
                    ref={springCoilRef}
                    className="absolute -top-[110%] left-1/2 -translate-x-1/2 w-[1.25em] h-[1.45em] pointer-events-none drop-shadow-[0_0_12px_rgba(78,205,196,0.45)] z-10"
                    viewBox="0 0 40 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="hero-spring-grad-en" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4ECDC4" />
                        <stop offset="100%" stopColor="#7C5CFC" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 20 8 C 32 8, 32 18, 20 18 C 8 18, 8 28, 20 28 C 32 28, 32 38, 20 38 C 8 38, 8 46, 20 46"
                      stroke="url(#hero-spring-grad-en)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      opacity="0.15"
                    />
                    <path
                      className="spring-snake-path"
                      d="M 20 8 C 32 8, 32 18, 20 18 C 8 18, 8 28, 20 28 C 32 28, 32 38, 20 38 C 8 38, 8 46, 20 46"
                      stroke="url(#hero-spring-grad-en)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>ge
              </span>

              <div className='w-full hidden md:block' />

              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle4}</span>
              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle5}</span>
              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle6}</span>
              <span className="hero-plain-word inline-block mr-3 text-text-secondary font-medium font-sans text-xl sm:text-2xl lg:text-3xl">{t.dashboard.welcomeTitle7}</span>

              {/* Palabra: brands */}
              <span className="word-marcas inline-block relative cursor-pointer bg-gradient-to-r from-[#7C5CFC] to-[#FF6B6B] bg-clip-text text-transparent ml-2.5 pb-2.5">
                {t.dashboard.welcomeTitle8}
                <svg 
                  className="absolute left-0 -bottom-1.5 w-full h-3 overflow-hidden pointer-events-none" 
                  viewBox="0 0 100 12" 
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="underline-wave-grad-en" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7C5CFC" />
                      <stop offset="100%" stopColor="#FF6B6B" />
                    </linearGradient>
                  </defs>
                  <path
                    className="wavy-underline-path"
                    d="M -40,6 Q -30,0 -20,6 T 0,6 T 20,6 T 40,6 T 60,6 T 80,6 T 100,6 T 120,6 T 140,6"
                    fill="none"
                    stroke="url(#underline-wave-grad-en)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
          )}

          {/* Bauhaus Art Grid Panel */}
          <div
            id='gsap-shapes-container'
            className='flex items-center gap-4 p-3 my-6 rounded-2xl bg-white/[0.015] border border-white/[0.04] shadow-[inset_0_2px_12px_rgba(255,255,255,0.01)] backdrop-blur-md select-none justify-start relative z-20'
          >
            {/* Shape 1: Arco Bauhaus + Ojo */}
            <div className='gsap-cartoon-shape-wrapper w-16 h-16 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center cursor-pointer'>
              <div className='gsap-cartoon-shape-inner flex items-center justify-center w-full h-full'>
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="gsap-cartoon-shape-svg drop-shadow-[0_4px_12px_rgba(255,107,107,0.2)]">
                  <path d="M 10 32 A 14 14 0 0 1 38 32" stroke="#FF6B6B" strokeWidth="8" strokeLinecap="round" fill="none" />
                  <circle cx="24" cy="22" r="5.5" fill="#38BDF8" />
                </svg>
              </div>
            </div>

            {/* Shape 2: Corazón Bauhaus */}
            <div className='gsap-cartoon-shape-wrapper w-16 h-16 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center cursor-pointer'>
              <div className='gsap-cartoon-shape-inner flex items-center justify-center w-full h-full'>
                <svg width="38" height="38" viewBox="0 0 48 48" fill="none" className="gsap-cartoon-shape-svg drop-shadow-[0_4px_12px_rgba(255,94,126,0.2)]">
                  <path d="M 24 39.5 L 21.1 36.8 C 10.8 27.5 4 21.3 4 13.8 C 4 7.6 8.8 2.8 15 2.8 C 18.5 2.8 21.8 4.4 24 7.0 C 26.2 4.4 29.5 2.8 33 2.8 C 39.2 2.8 44 7.6 44 13.8 C 44 21.3 37.2 27.5 26.9 36.8 Z" fill="#FF5E7E" />
                </svg>
              </div>
            </div>

            {/* Shape 3: Sol Radiante */}
            <div className='gsap-cartoon-shape-wrapper w-16 h-16 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center cursor-pointer'>
              <div className='gsap-cartoon-shape-inner flex items-center justify-center w-full h-full'>
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="gsap-cartoon-shape-svg drop-shadow-[0_4px_12px_rgba(250,190,40,0.2)]">
                  <path d="M 24 6 L 27.5 13.5 L 35 11 L 34.5 19 L 41.5 20.5 L 37.5 27 L 41.5 33.5 L 34.5 35 L 35 43 L 27.5 40.5 L 24 48 L 20.5 40.5 L 13 43 L 13.5 35 L 6.5 33.5 L 10.5 27 L 6.5 20.5 L 13.5 19 L 13 11 L 20.5 13.5 Z" fill="#FABE28" />
                </svg>
              </div>
            </div>

            {/* Shape 4: Domo Celeste/Verde */}
            <div className='gsap-cartoon-shape-wrapper w-16 h-16 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center cursor-pointer'>
              <div className='gsap-cartoon-shape-inner flex items-center justify-center w-full h-full'>
                <svg width="36" height="36" viewBox="0 0 48 48" fill="none" className="gsap-cartoon-shape-svg drop-shadow-[0_4px_12px_rgba(78,205,196,0.2)]">
                  <path d="M 12 18 A 12 12 0 0 1 36 18 L 36 40 C 36 42, 34 44, 32 44 L 16 44 C 12 44, 12 42, 12 40 Z" fill="#4ECDC4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Botones de acción centralizados */}
          <div className='flex justify-center md:justify-start items-center gap-3.5 flex-wrap mt-2'>
            <ShortcutTooltip shortcut="Ctrl + N" description={lang === 'es' ? 'Nuevo cliente' : 'New client'} side="bottom">
              <button
                id='add-client-button'
                onClick={() => setIsModalOpen(true)}
                className='w-48 h-10 rounded-xl text-xs font-extrabold transition-all duration-200 bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.4)] active:scale-[0.98] flex items-center justify-center'
                aria-label={lang === 'es' ? 'Abrir modal para añadir nuevo cliente' : 'Open modal to add new client'}
              >
                {t.dashboard.addClientBtn}
              </button>
            </ShortcutTooltip>

            <button
              id='add-member-button'
              onClick={() => setIsMemberModalOpen(true)}
              className='w-48 h-10 rounded-xl text-xs font-extrabold transition-all duration-200 bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.4)] active:scale-[0.98] flex items-center justify-center'
              aria-label={lang === 'es' ? 'Abrir modal para invitar nuevo miembro' : 'Open modal to invite new collaborator'}
            >
              {t.dashboard.inviteBtn}
            </button>
          </div>
        </div>

        {/* Columna Derecha: Stack Gráfico (decorativo) y Cuadrícula de Clientes (funcional) */}
        <div className='md:col-span-5 flex flex-col items-center justify-center w-full gap-6'>
          {/* Overlapping Glassmorphic Stack Graphic (Pure CSS & SVG with Framer Motion) - Visible on md and up */}
          <div className='relative w-full max-w-[280px] h-[160px] flex items-center justify-center mb-2 hidden md:flex'>
            {/* Card 1: Trends Widget (Left back) */}
            <motion.div
              initial={{ opacity: 0, x: -40, y: 15, rotate: -8, scale: 0.85 }}
              animate={{ opacity: 1, x: -60, y: 10, rotate: -12, scale: 0.9 }}
              whileHover={{ y: 0, scale: 0.95, zIndex: 30, transition: { duration: 0.2 } }}
              className='absolute w-[130px] h-[130px] rounded-[18px] border border-white/[0.06] bg-[#121220]/60 backdrop-blur-md p-3.5 flex flex-col justify-between shadow-2xl text-left'
            >
              <div className='flex items-center justify-between'>
                <div className='w-7 h-7 rounded-lg bg-[#4ECDC4]/10 border border-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4]'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' />
                  </svg>
                </div>
                <span className='text-[8px] font-extrabold uppercase tracking-wider text-[#4ECDC4] bg-[#4ECDC4]/10 px-1.5 py-0.5 rounded-full'>
                  {t.dashboard.widgetTrends}
                </span>
              </div>
              <div className='flex flex-col gap-1.5'>
                <div className='h-1.5 w-12 bg-white/10 rounded-full' />
                <div className='h-1 w-16 bg-white/5 rounded-full' />
                <div className='flex items-end gap-1 h-8 pt-1'>
                  <div className='w-2 h-4 bg-[#4ECDC4]/20 rounded-sm' />
                  <div className='w-2 h-6 bg-[#4ECDC4]/35 rounded-sm' />
                  <div className='w-2 h-8 bg-[#4ECDC4]/60 rounded-sm animate-pulse' />
                  <div className='w-2 h-5 bg-[#4ECDC4]/40 rounded-sm' />
                </div>
              </div>
            </motion.div>

            {/* Card 2: Calendar Widget (Right back) */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 15, rotate: 8, scale: 0.85 }}
              animate={{ opacity: 1, x: 60, y: 10, rotate: 12, scale: 0.95 }}
              whileHover={{ y: 0, scale: 0.95, zIndex: 30, transition: { duration: 0.2 } }}
              className='absolute w-[130px] h-[130px] rounded-[18px] border border-white/[0.06] bg-[#121220]/60 backdrop-blur-md p-3.5 flex flex-col justify-between shadow-2xl text-left'
            >
              <div className='flex items-center justify-between'>
                <div className='w-7 h-7 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 flex items-center justify-center text-[#FF6B6B]'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                  </svg>
                </div>
                <span className='text-[8px] font-extrabold uppercase tracking-wider text-[#FF6B6B] bg-[#FF6B6B]/10 px-1.5 py-0.5 rounded-full'>
                  {t.dashboard.widgetStrategy}
                </span>
              </div>
              <div className='flex flex-col gap-1.5'>
                <div className='h-1.5 w-16 bg-white/10 rounded-full' />
                <div className='h-1 w-10 bg-white/5 rounded-full' />
                <div className='grid grid-cols-4 gap-1 pt-1.5'>
                  <div className='aspect-square bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[7px] text-text-muted'>1</div>
                  <div className='aspect-square bg-[#FF6B6B]/20 border border-[#FF6B6B]/40 rounded-md flex items-center justify-center text-[7px] text-[#FF6B6B] font-bold'>2</div>
                  <div className='aspect-square bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[7px] text-text-muted'>3</div>
                  <div className='aspect-square bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[7px] text-text-muted'>4</div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Inspiration & AI (Center front, floating) */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.85 }}
              animate={{
                opacity: 1,
                y: [0, -6, 0],
                scale: 0.9,
              }}
              transition={{
                y: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
              }}
              whileHover={{ scale: 0.95, transition: { duration: 0.2 } }}
              className='absolute w-[140px] h-[140px] rounded-[22px] border border-white/15 bg-gradient-to-b from-[#18182E] to-[#0C0C18] p-4 flex flex-col justify-between shadow-2xl z-20 text-left'
            >
              <div className='flex items-center justify-between'>
                <div className='w-8 h-8 rounded-xl bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 flex items-center justify-center text-[#7C5CFC]'>
                  <svg
                    className='w-4 h-4 animate-pulse'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' />
                  </svg>
                </div>
                <div className='w-1.5 h-1.5 rounded-full bg-[#7C5CFC] animate-ping' />
              </div>
              <div className='flex flex-col gap-1.5'>
                <span className='text-[8px] font-black uppercase tracking-wider text-[#7C5CFC]'>
                  {t.dashboard.widgetIdeas}
                </span>
                <div className='h-2 w-20 bg-white/20 rounded-full' />
                <div className='h-1 w-14 bg-white/10 rounded-full' />
              </div>
            </motion.div>
          </div>

          {/* Cuadrícula de marcas activas (Opción C) */}
          {clients.length > 0 && (
            <div className='w-full relative z-10'>
              <h2 className='text-[10px] font-black tracking-[0.2em] text-text-muted uppercase mb-3.5 select-none text-center md:text-left'>
                {t.dashboard.activeBrands}
              </h2>
              <div className='grid grid-cols-2 gap-3 w-full'>
                {clients.map((client, idx) => {
                  const brandColor = client.brand_info?.card_color || brandColors[idx % brandColors.length];
                  const initials = (client.name || 'CL').substring(0, 2).toUpperCase();
                  return (
                    <motion.div
                      key={client.id}
                      whileHover={{ 
                        scale: 1.03, 
                        y: -2,
                        borderColor: 'var(--color-border-strong)',
                        backgroundColor: 'var(--color-surface-soft)'
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className='flex items-center gap-2.5 p-2.5 rounded-xl border border-border-subtle bg-surface-soft/30 backdrop-blur-md cursor-pointer transition-all duration-200 shadow-sm'
                    >
                      {client.logo_url ? (
                        <img
                          src={client.logo_url}
                          alt={client.name}
                          className='w-8 h-8 rounded-[8px] object-cover border border-border-subtle flex-shrink-0 shadow-xs'
                        />
                      ) : (
                        <div
                          className='w-8 h-8 rounded-[8px] flex items-center justify-center font-black text-[10px] flex-shrink-0 select-none'
                          style={{
                            backgroundColor: brandColor + '18',
                            border: `1px solid ${brandColor}38`,
                            color: brandColor,
                          }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className='flex flex-col min-w-0 text-left'>
                        <span className='text-xs font-bold text-text-primary truncate leading-normal'>
                          {client.name}
                        </span>
                        {client.industry && (
                          <span className='text-[9px] font-semibold text-text-muted truncate mt-0.5'>
                            {client.industry}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <ClientCreationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

        <MemberInvitationModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
        />
      </Suspense>
    </div>
  );
};
