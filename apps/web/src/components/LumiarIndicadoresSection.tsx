import React, { useEffect, useRef, useState } from 'react';

interface IndicatorItem {
  id: string;
  target: number;
  label: string;
  highlightWords?: string[];
  sourceNote?: string;
}

const INDICATORS_DATA: IndicatorItem[] = [
  {
    id: 'indicador-1',
    target: 7.3,
    label: 'População brasileira com algum tipo de deficiência (aprox. 1 em cada 14 pessoas).'
  },
  {
    id: 'indicador-2',
    target: 4.0,
    label: 'Dificuldade permanente para enxergar.'
  },
  {
    id: 'indicador-3',
    target: 2.6,
    label: 'Dificuldade para andar ou subir degraus.'
  },
  {
    id: 'indicador-4',
    target: 1.4,
    label: 'Dificuldade para pegar objetos pequenos ou abrir tampas.'
  },
  {
    id: 'indicador-5',
    target: 1.4,
    label: 'Limitações nas funções mentais/intelectuais.'
  },
  {
    id: 'indicador-6',
    target: 1.3,
    label: 'Dificuldade permanente para ouvir.'
  }
];

export function LumiarIndicadoresSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [currentValues, setCurrentValues] = useState<number[]>(() =>
    INDICATORS_DATA.map(() => 0)
  );

  useEffect(() => {
    // Respeito à preferência do usuário por redução de movimento (WCAG 2.2 AA)
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCurrentValues(INDICATORS_DATA.map(item => item.target));
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 2000; // 2 segundos de animação suave
          const startTime = performance.now();

          const animateCounters = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Curva easeOutCubic para desaceleração natural e elegante
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setCurrentValues(
              INDICATORS_DATA.map(item => {
                const val = item.target * easeOut;
                return val;
              })
            );

            if (progress < 1) {
              requestAnimationFrame(animateCounters);
            } else {
              // Garante precisão exata nos valores finais
              setCurrentValues(INDICATORS_DATA.map(item => item.target));
            }
          };

          requestAnimationFrame(animateCounters);
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const targetEl = sectionRef.current;
    if (targetEl) {
      observer.observe(targetEl);
    }

    return () => {
      if (targetEl) observer.unobserve(targetEl);
    };
  }, [hasAnimated]);

  return (
    <section
      ref={sectionRef}
      id="indicadores-inclusao"
      aria-labelledby="indicadores-titulo"
      className="lumiar-indicadores-section w-full bg-white py-16 sm:py-20 lg:py-24 font-inter text-slate-800"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* =========================================================================
            COLUNA CENTRAL SUPERIOR: TÍTULO, DESCRIÇÃO E CITAÇÃO
            ========================================================================= */}
        <div className="text-center max-w-[960px] mx-auto">
          {/* Título Principal */}
          <h2
            id="indicadores-titulo"
            className="text-[32px] sm:text-[42px] lg:text-[48px] leading-[115%] font-extrabold text-center text-slate-900 tracking-[-0.03em] mb-6"
          >
            Por que a inclusão digital é indispensável em ambientes mais inclusivos, interativos e responsivos?
          </h2>

          {/* Texto Descritivo Longo */}
          <p className="max-w-[926px] mx-auto text-[20px] leading-[120%] font-normal text-center text-slate-700">
            Hoje, 14,4 milhões de brasileiros precisam de recursos de acessibilidade para acessar plenamente espaços e conteúdos culturais. Esse dado, apontado pelo Censo 2022 (IBGE), revela o tamanho do público que pode estar sendo excluído quando um ambiente físico ou digital não é inteligente e inclusivo.
          </p>

          {/* Citação em Destaque (Aspeada) */}
          <blockquote className="italic text-center text-[24px] leading-[100%] font-semibold tracking-[-0.48px] mt-[35px] text-slate-800">
            &ldquo;7,9 milhões de pessoas com dificuldade para enxergar, correspondendo a aproximadamente 4,0% da população brasileira de 2 anos ou mais&rdquo;
          </blockquote>
        </div>

        {/* =========================================================================
            GRID RESPONSIVO COM OS 6 INDICADORES PERCENTUAIS
            1 Coluna no Mobile, 2 Colunas no Tablet, 3 Colunas no Desktop
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 max-w-[1080px] mx-auto">
          {INDICATORS_DATA.map((item, index) => {
            const formattedValue = currentValues[index]
              .toFixed(1)
              .replace('.', ',');

            return (
              <div
                key={item.id}
                className="lumiar-indicador-card flex flex-col items-center justify-start p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-teal-500/40 hover:bg-white hover:shadow-lg transition-all duration-300 ease-out"
                role="region"
                aria-label={`${formattedValue}%: ${item.label}`}
              >
                {/* Efeito Percentual em Destaque com Grande Tipografia */}
                <span
                  className="text-[56px] leading-[100%] font-bold tracking-[-1.12px] text-teal-600 text-center block mb-2 select-none"
                  aria-hidden="true"
                >
                  {formattedValue}%
                </span>

                {/* Texto Explicativo Abaixo de Cada Percentual */}
                <p className="text-[18px] leading-[130%] font-normal text-center text-slate-600">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LumiarIndicadoresSection;
