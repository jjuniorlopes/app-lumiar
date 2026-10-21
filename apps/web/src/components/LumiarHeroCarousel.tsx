import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideItem {
  id: number;
  image: string;
  fallbackImage: string;
  alt: string;
}

const CAROUSEL_SLIDES: SlideItem[] = [
  {
    id: 0,
    image: '/assets/banner-mon-niemeyer.png',
    fallbackImage: '/banner-mon-niemeyer.png',
    alt: 'Museu Oscar Niemeyer em Curitiba'
  },
  {
    id: 1,
    image: '/assets/banner-acervo-inclusivo.jpg',
    fallbackImage: '/banner-acervo-inclusivo.jpg',
    alt: 'Visitante com deficiência visual interagindo com maquete tátil e audiodescrição'
  },
  {
    id: 2,
    image: '/assets/banner-memorial-itamar.png',
    fallbackImage: '/banner-memorial-itamar.png',
    alt: 'Memorial da República Presidente Itamar Franco'
  },
  {
    id: 3,
    image: '/assets/banner-museu-ipiranga.png',
    fallbackImage: '/banner-museu-ipiranga.png',
    alt: 'Fachada monumental do Museu do Ipiranga'
  }
];

interface LumiarHeroCarouselProps {
  onOpenProposal?: () => void;
  onNavigateTo?: (path: string) => void;
}

/**
 * Componente: LumiarHeroCarousel
 * 
 * Banner carrossel dinâmico em background refeito com Vanilla CSS puro:
 * - Tamanho proporcional: 480px no desktop e 380px no mobile (Referência: movimentoods.org.br/materiais/)
 * - As 4 imagens anexadas aplicadas como background com enquadramento de cobertura (cover/center)
 * - Rotação dinâmica automática a cada 4 segundos com deslizamento horizontal suave
 * - Textos fixados dentro de todas as figuras (letra, cor branca e tamanho do modelo):
 *     * Tag [ PROJETO LUMIAR ]
 *     * Título "Experiências acessíveis, pensadas para pessoas."
 *     * Subtítulo "Conheça os produtos Lumiar: soluções digitais que aproximam visitantes dos espaços, das histórias e das informações que importam."
 *     * Botão retangular branco sólido com texto preto [ SOLICITE UMA PROPOSTA ] (estilo SHOP NOW)
 * - Setas laterais circulares brancas com chevrons pretos (esquerda e direita)
 * - Rodapé: marcadores em traços/barras horizontais brancas finas centralizadas
 */
export function LumiarHeroCarousel({ onOpenProposal }: LumiarHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const totalSlides = CAROUSEL_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Rotação dinâmica automática contínua a cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  // Navegação pelo teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  // Suporte a swipe touch para dispositivos móveis
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  return (
    <section 
      aria-label="Carrossel de Destaques Lumiar"
      className="lumiar-hero-carousel-wrap"
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      role="region"
      aria-roledescription="carrossel de imagens"
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#000000',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: 'none',
        borderBottom: '1px solid #111827',
        margin: 0,
        padding: 0
      }}
    >
      {/* =========================================================================
          PALCO DO BANNER: ALTURA PROPORCIONAL DE 480PX DESKTOP / 380PX MOBILE
          (Referência: https://movimentoods.org.br/materiais/)
          ========================================================================= */}
      <div 
        className="lumiar-hero-carousel-stage"
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        
        {/* Trilho de Imagens de Fundo com Deslizamento Horizontal */}
        <div 
          className="lumiar-hero-carousel-track"
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          {CAROUSEL_SLIDES.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                className="lumiar-hero-carousel-slide"
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${slide.image}), url(${slide.fallbackImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#000000'
                }}
              />
            );
          })}
        </div>

        {/* Camada Escurecida Equilibrada para Garantir Contraste WCAG 2.2 AAA */}
        <div 
          aria-hidden="true"
          className="lumiar-hero-carousel-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.40) 0%, rgba(0, 0, 0, 0.52) 50%, rgba(0, 0, 0, 0.72) 100%)'
          }}
        />

        {/* =========================================================================
            CONTEÚDO CENTRALIZADO DENTRO DE TODAS AS FIGURAS
            (Letra, cor branca pura #ffffff e tamanho conforme a imagem anexa)
            ========================================================================= */}
        <div 
          className="lumiar-hero-carousel-content"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px 24px',
            pointerEvents: 'none'
          }}
        >
          <div 
            className="lumiar-hero-carousel-content-inner"
            style={{
              maxWidth: '860px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'auto'
            }}
          >
            
            {/* Tag Superior: Retângulo com borda branca fina de 1px [ PROJETO LUMIAR ] */}
            <span 
              className="lumiar-hero-carousel-tag"
              style={{
                display: 'inline-block',
                padding: '5px 16px',
                border: '1px solid #ffffff',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: 700,
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                borderRadius: '2px',
                marginBottom: '14px',
                backdropFilter: 'blur(2px)'
              }}
            >
              PROJETO LUMIAR
            </span>

            {/* Título Principal em Branco Puro de Grande Impacto e Centralizado */}
            <h1 
              className="lumiar-hero-carousel-title"
              style={{
                color: '#ffffff',
                fontWeight: 800,
                lineHeight: 1.15,
                margin: '0 0 14px',
                letterSpacing: '-0.5px',
                textShadow: '0 4px 16px rgba(0, 0, 0, 0.95)',
                textAlign: 'center'
              }}
            >
              Experiências acessíveis,<br />
              pensadas para pessoas.
            </h1>

            {/* Subtítulo Centralizado com Tamanho Proporcional */}
            <p 
              className="lumiar-hero-carousel-subtitle"
              style={{
                color: '#ffffff',
                fontWeight: 400,
                lineHeight: 1.5,
                margin: '0 0 24px',
                maxWidth: '720px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.95)',
                textAlign: 'center',
                opacity: 0.95
              }}
            >
              Conheça os produtos Lumiar: soluções digitais que aproximam visitantes dos espaços, das histórias e das informações que importam.
            </p>

            {/* Botão Central: Caixa Retangular Branca Sólida com Texto Preto (Estilo SHOP NOW) */}
            <button
              type="button"
              onClick={onOpenProposal}
              className="lumiar-hero-carousel-btn"
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '14px 40px',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
                transition: 'transform 0.2s ease, background-color 0.2s ease',
                display: 'inline-block'
              }}
            >
              SOLICITE UMA PROPOSTA
            </button>

          </div>
        </div>

        {/* =========================================================================
            NAVEGAÇÃO LATERAL: SETAS CIRCULARES BRANCAS COM CHEVRONS PRETOS
            ========================================================================= */}
        <button
          type="button"
          onClick={prevSlide}
          className="lumiar-hero-carousel-arrow lumiar-hero-carousel-arrow-prev"
          aria-label="Imagem anterior do carrossel"
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            transition: 'transform 0.2s ease'
          }}
        >
          <ChevronLeft size={24} className="stroke-[2.5]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="lumiar-hero-carousel-arrow lumiar-hero-carousel-arrow-next"
          aria-label="Próxima imagem do carrossel"
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            transition: 'transform 0.2s ease'
          }}
        >
          <ChevronRight size={24} className="stroke-[2.5]" aria-hidden="true" />
        </button>

        {/* =========================================================================
            MARCADORES NO RODAPÉ: TRAÇOS / BARRAS HORIZONTAIS BRANCAS FINAS
            ========================================================================= */}
        <div 
          className="lumiar-hero-carousel-dots"
          role="tablist"
          aria-label="Marcadores das imagens do carrossel"
          style={{
            position: 'absolute',
            bottom: '22px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {CAROUSEL_SLIDES.map((slide, index) => {
            const isSelected = index === currentIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Ir para a imagem ${index + 1} de ${totalSlides}: ${slide.alt}`}
                onClick={() => goToSlide(index)}
                className={`lumiar-hero-carousel-dot ${isSelected ? 'lumiar-hero-carousel-dot-active' : 'lumiar-hero-carousel-dot-inactive'}`}
                style={{
                  height: '3px',
                  width: isSelected ? '54px' : '34px',
                  backgroundColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                  boxShadow: isSelected ? '0 0 10px rgba(255, 255, 255, 0.95)' : 'none',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0
                }}
              />
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default LumiarHeroCarousel;
