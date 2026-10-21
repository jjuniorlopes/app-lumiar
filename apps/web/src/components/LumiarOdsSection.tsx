import React, { useState } from 'react';

/**
 * Interface que define os dados e metadados de cada Objetivo de Desenvolvimento Sustentável (ODS)
 */
interface OdsItem {
  id: number;
  number: string;
  title: string;
  barColorHex: string;
  iconSrc: string;
  altText: string;
  description: string;
  impactMetrics: string;
  lumiarAction: string;
}

const ODS_LIST: OdsItem[] = [
  {
    id: 4,
    number: '4',
    title: 'EDUCAÇÃO DE QUALIDADE',
    barColorHex: '#c5192d',
    iconSrc: '/ODS4.png',
    altText: 'Ícone ODS 4 - Educação de Qualidade da ONU',
    description: 'Fortalecendo o acesso inclusivo e equitativo a conteúdos educativos, culturais e formativos.',
    impactMetrics: '100% de conteúdos com audiodescrição e linguagem simples',
    lumiarAction: 'Formatos multissensoriais que democratizam a transmissão do conhecimento cultural para todas as idades e capacidades cognitivas.'
  },
  {
    id: 10,
    number: '10',
    title: 'REDUÇÃO DAS DESIGUALDADES',
    barColorHex: '#dd1367',
    iconSrc: '/ODS10.png',
    altText: 'Ícone ODS 10 - Redução das Desigualdades da ONU',
    description: 'Eliminando barreiras que limitam o exercício pleno de direitos e a participação cultural.',
    impactMetrics: 'Acessibilidade física, atitudinal e digital integrada',
    lumiarAction: 'Tecnologias assistivas (Libras, sintetização de voz e rotas guiadas) que garantem autonomia real e protagonismo à pessoa com deficiência.'
  },
  {
    id: 11,
    number: '11',
    title: 'CIDADES E COMUNIDADES SUSTENTÁVEIS',
    barColorHex: '#fd9d24',
    iconSrc: '/ODS11.png',
    altText: 'Ícone ODS 11 - Cidades e Comunidades Sustentáveis da ONU',
    description: 'Promovendo espaços públicos e privados mais inclusivos, acessíveis e sustentáveis.',
    impactMetrics: 'Patrimônios e museus adaptados com desenho universal',
    lumiarAction: 'Digitalização inclusiva de espaços culturais urbanos com maquetes táteis, QR Codes inteligentes e infraestrutura acessível perene.'
  }
];

/**
 * Componente: LumiarOdsSection (Sustentabilidade & ODS)
 * 
 * Réplica exata e fiel da imagem oficial de referência:
 * - Arquitetura de CSS Grid Stacking (col-start-1 row-start-1) sem distorções.
 * - Aspect Ratio 16:9 preservado rigorosamente no desktop (sem deformar a imagem de fundo).
 * - Imagem nativa Img_fundo.png com tag <img /> (sem CSS background-image).
 * - Lado Esquerdo: Título com "mais justo" em dourado/amarelo + Parágrafo explicativo.
 * - Centro: Área desobstruída destacando a visitante tateando a maquete arquitetônica.
 * - Lado Direito: Os 3 ODS (4, 10 e 11) com ícone quadrado oficial, barra vertical e texto.
 * - Canto Inferior Esquerdo: Selo nativo "ESG | Dimensão Social: Inclusão • Acessibilidade • Equidade".
 * - Interatividade acessível (WCAG 2.2 AA) via estado React (activeOds).
 */
export function LumiarOdsSection() {
  const [activeOds, setActiveOds] = useState<number | null>(4);

  const handleToggleOds = (id: number) => {
    setActiveOds((prev) => (prev === id ? null : id));
  };

  const selectedOdsData = ODS_LIST.find((o) => o.id === activeOds);

  return (
    <section 
      id="sustentabilidade" 
      aria-labelledby="ods-section-title"
      className="relative w-full py-8 sm:py-12 lg:py-16 bg-slate-950 font-inter text-white"
    >
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* =========================================================================
            CONTAINER PRINCIPAL EM CSS GRID STACKING COM ASPECT RATIO 16:9
            Garante proporção exata sem deformar a imagem nem sobrepor o centro
            ========================================================================= */}
        <div className="grid grid-cols-1 grid-rows-1 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-slate-800/60 relative bg-slate-950 aspect-auto lg:aspect-[16/9] min-h-[580px] lg:min-h-0 w-full">
          
          {/* CAMADA 1: Imagem de fundo nativa (<img />) */}
          <img
            src="/Img_fundo.png"
            alt="Visitante com deficiência visual e óculos escuros interagindo e tateando maquete arquitetônica em bronze em museu moderno. Selo ESG Dimensão Social no canto inferior esquerdo."
            className="col-start-1 row-start-1 w-full h-full object-cover select-none pointer-events-none"
            loading="lazy"
            decoding="async"
          />

          {/* CAMADA 2: Overlay gradiente escurecido suave para assegurar conformidade WCAG 2.2 AA */}
          <div
            aria-hidden="true"
            className="col-start-1 row-start-1 w-full h-full pointer-events-none"
            style={{
              background:
                'linear-gradient(to right, rgba(2, 6, 23, 0.70) 0%, rgba(2, 6, 23, 0.35) 30%, transparent 48%, rgba(2, 6, 23, 0.25) 70%, rgba(2, 6, 23, 0.75) 100%)'
            }}
          />

          {/* CAMADA 3: Conteúdo Sobreposto (col-start-1 row-start-1) */}
          <div className="col-start-1 row-start-1 w-full h-full z-10 font-inter">
            
            {/* =====================================================================
                DISPOSIÇÃO DESKTOP: PROPORÇÕES EXATAS CONFORME A IMAGEM DE REFERÊNCIA
                ===================================================================== */}
            <div className="hidden lg:block relative w-full h-full">
              
              {/* BLOCO DA ESQUERDA: TÍTULO INSTITUCIONAL + PARÁGRAFO */}
              <div className="absolute left-[3.5%] top-[24%] w-[28.5%] max-w-[340px] text-white">
                <h2 
                  id="ods-section-title"
                  className="text-[25px] xl:text-[32px] font-bold tracking-tight leading-[1.16] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
                >
                  Tecnologia, inclusão<br />
                  e cultura construindo<br />
                  um futuro <span className="text-[#f5a623] font-bold">mais justo</span>
                </h2>

                <p className="mt-3.5 xl:mt-4 text-[13px] xl:text-[14.5px] text-slate-100 font-normal leading-[1.42] drop-shadow-[0_1px_5px_rgba(0,0,0,0.95)]">
                  O Lumiar está alinhado aos Objetivos de Desenvolvimento Sustentável (ODS) e ao ESG, promovendo educação de qualidade, redução das desigualdades e cidades mais inclusivas e sustentáveis.
                </p>
              </div>

              {/* BLOCO DA DIREITA: OS 3 ODS ALINHADOS E AJUSTADOS */}
              <div 
                className="absolute right-[2.2%] top-[8.5%] w-[25.5%] max-w-[315px] flex flex-col gap-3.5 xl:gap-4"
                role="region"
                aria-label="Objetivos de Desenvolvimento Sustentável"
              >
                {ODS_LIST.map((ods) => {
                  const isSelected = activeOds === ods.id;
                  const contentId = `ods-desc-${ods.id}`;

                  return (
                    <button
                      key={ods.id}
                      type="button"
                      onClick={() => handleToggleOds(ods.id)}
                      aria-expanded={isSelected}
                      aria-controls={contentId}
                      className={`w-full text-left flex items-center gap-3 p-1.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 group ${
                        isSelected 
                          ? 'bg-slate-900/50 backdrop-blur-sm ring-1 ring-white/20 shadow-md' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Ícone Quadrado do ODS */}
                      <img
                        src={ods.iconSrc}
                        alt={ods.altText}
                        className={`w-[68px] h-[68px] xl:w-[78px] xl:h-[78px] rounded-lg shrink-0 object-cover shadow-lg transition-transform duration-200 ${
                          isSelected ? 'scale-105 ring-2 ring-white/30' : 'group-hover:scale-102'
                        }`}
                        loading="lazy"
                      />
                      
                      {/* Traço vertical colorido oficial */}
                      <div 
                        className={`w-[2.5px] xl:w-[3px] rounded-full shrink-0 transition-all duration-300 ${
                          isSelected 
                            ? 'h-[64px] xl:h-[74px] shadow-[0_0_10px_rgba(255,255,255,0.4)]' 
                            : 'h-[58px] xl:h-[68px] opacity-90'
                        }`}
                        style={{ backgroundColor: ods.barColorHex }}
                        aria-hidden="true" 
                      />

                      {/* Texto descritivo exato */}
                      <p 
                        id={contentId}
                        className="text-[12px] xl:text-[13.5px] text-white font-normal leading-[1.28] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]"
                      >
                        {ods.description}
                      </p>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* =====================================================================
                DISPOSIÇÃO MOBILE / TABLET (< 1024px): RESPONSIVA E SEM DISTORÇÃO
                ===================================================================== */}
            <div className="lg:hidden flex flex-col justify-between h-full p-5 sm:p-7 space-y-6">
              
              {/* Esquerda / Topo */}
              <div className="max-w-md text-white">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-white mb-2.5 drop-shadow-md">
                  Tecnologia, inclusão e cultura construindo um futuro <span className="text-[#f5a623] font-bold">mais justo</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-normal drop-shadow-md">
                  O Lumiar está alinhado aos Objetivos de Desenvolvimento Sustentável (ODS) e ao ESG, promovendo educação de qualidade, redução das desigualdades e cidades mais inclusivas e sustentáveis.
                </p>
              </div>

              {/* Direita / Base: Lista dos ODS */}
              <div className="flex flex-col space-y-3 max-w-md">
                {ODS_LIST.map((ods) => {
                  const isSelected = activeOds === ods.id;
                  return (
                    <button
                      key={ods.id}
                      type="button"
                      onClick={() => handleToggleOds(ods.id)}
                      className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-200 text-left border ${
                        isSelected 
                          ? 'bg-slate-900/80 border-white/20' 
                          : 'bg-slate-950/60 border-white/10'
                      }`}
                    >
                      <img
                        src={ods.iconSrc}
                        alt={ods.altText}
                        className="w-14 h-14 rounded-lg shrink-0 object-cover"
                      />
                      <div 
                        className="w-[2.5px] h-12 shrink-0 rounded-full" 
                        style={{ backgroundColor: ods.barColorHex }}
                        aria-hidden="true" 
                      />
                      <p className="text-xs text-white leading-snug">
                        {ods.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Espaço para o selo ESG nativo da imagem no mobile */}
              <div className="h-10 pointer-events-none" aria-hidden="true" />
            </div>

          </div>

        </div>

        {/* =========================================================================
            PAINEL EXPANDIDO INFORMATIVO EXTERNO (Aparece ao interagir, sem deformar o banner)
            ========================================================================= */}
        {selectedOdsData && (
          <div 
            className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md transition-all duration-300 ease-in-out flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div 
                className="w-3 h-10 rounded-full shrink-0" 
                style={{ backgroundColor: selectedOdsData.barColorHex }} 
                aria-hidden="true" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-yellow-400">
                    ODS {selectedOdsData.number} • {selectedOdsData.title}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                  {selectedOdsData.lumiarAction}
                </p>
              </div>
            </div>

            <div className="shrink-0 bg-slate-800/80 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-slate-300">
              <span className="font-semibold text-white">Meta Lumiar: </span>
              {selectedOdsData.impactMetrics}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export default LumiarOdsSection;
