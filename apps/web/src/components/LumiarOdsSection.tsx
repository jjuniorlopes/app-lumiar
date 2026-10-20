import React from 'react';

/**
 * Componente: LumiarOdsSection (Seção Sustentabilidade)
 * 
 * Réplica exata do layout oficial de referência (figura anexa):
 * - Esquerda: Bloco tipográfico institucional (Título + Destaque "mais justo" em laranja + Parágrafo explicativo).
 * - Centro: Área aberta com visualização nítida da visitante tateando a maquete arquitetônica.
 * - Canto Inferior Esquerdo: Logotipo da folha e selo nativo "ESG | Dimensão Social: Inclusão • Acessibilidade • Equidade".
 * - Direita: 3 Blocos ODS alinhados à direita, contendo os ícones exatos anexados pelo usuário (ODS4, ODS10, ODS11),
 *   traço vertical colorido na cor oficial de cada objetivo e os textos descritivos ajustados em largura e tamanho.
 * - Arquitetura: CSS Grid Stacking (col-start-1 row-start-1) com tag <img /> nativa.
 */
export function LumiarOdsSection() {
  return (
    <section 
      id="sustentabilidade" 
      aria-labelledby="sustentabilidade-title"
      className="relative w-full py-8 sm:py-12 lg:py-16 bg-slate-950 font-inter"
    >
      <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6">
        
        {/* Container Principal em CSS Grid Stacking com Aspect Ratio 16:9 no Desktop */}
        <div className="grid grid-cols-1 grid-rows-1 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-slate-800/40 relative bg-slate-950 min-h-[640px] lg:min-h-0 lg:aspect-[16/9]">
          
          {/* Camada 1: Imagem Base Nativa (Img_fundo.png) */}
          <img
            src="/assets/Img_fundo.png"
            alt="Visitante com deficiência visual e óculos escuros interagindo e tateando maquete arquitetônica em bronze em museu moderno. No canto inferior esquerdo, selo ESG Dimensão Social: Inclusão, Acessibilidade, Equidade."
            className="col-start-1 row-start-1 w-full h-full object-cover select-none pointer-events-none"
            loading="lazy"
            decoding="async"
          />

          {/* Camada 2: Overlay Gradiente Suave para Assegurar Contraste WCAG 2.2 AAA */}
          <div
            aria-hidden="true"
            className="col-start-1 row-start-1 w-full h-full pointer-events-none"
            style={{
              background:
                'linear-gradient(to right, rgba(2, 6, 23, 0.75) 0%, rgba(2, 6, 23, 0.40) 28%, transparent 48%, rgba(2, 6, 23, 0.35) 72%, rgba(2, 6, 23, 0.82) 100%), linear-gradient(to bottom, rgba(2, 6, 23, 0.35) 0%, transparent 40%)'
            }}
          />

          {/* Camada 3: Conteúdo Sobreposto (col-start-1 row-start-1) */}
          <div className="col-start-1 row-start-1 w-full h-full p-4 sm:p-6 lg:p-0 z-10 font-inter">
            
            {/* =========================================================================
                LAYOUT DESKTOP: POSICIONAMENTO EXATO CONFORME A FIGURA DE REFERÊNCIA
                ========================================================================= */}
            <div className="hidden lg:block relative w-full h-full">
              
              {/* BLOCO DA ESQUERDA: TÍTULO E PARÁGRAFO INSTITUCIONAL */}
              <div className="absolute left-[3.2%] top-[25%] w-[27.5%] max-w-[340px] text-white">
                <h2 
                  id="sustentabilidade-title"
                  className="text-[28px] xl:text-[33px] font-bold tracking-tight leading-[1.14] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
                >
                  Tecnologia, inclusão<br />
                  e cultura construindo<br />
                  um futuro <span className="text-[#f5a623] font-bold">mais justo</span>
                </h2>

                <p className="mt-4 text-[13.5px] xl:text-[14.5px] text-slate-100 font-normal leading-[1.45] drop-shadow-[0_1px_5px_rgba(0,0,0,0.95)]">
                  O Lumiar está alinhado aos Objetivos de Desenvolvimento Sustentável (ODS) e ao ESG, promovendo educação de qualidade, redução das desigualdades e cidades mais inclusivas e sustentáveis.
                </p>
              </div>

              {/* BLOCO DA DIREITA: OS 3 TÓPICOS DOS ODS ALINHADOS E AJUSTADOS */}
              <div className="absolute right-[2.2%] top-[8.5%] w-[25%] max-w-[305px] flex flex-col gap-4">
                
                {/* ODS 4 */}
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/ODS4.png"
                    alt="Ícone ODS 4 - Educação de Qualidade"
                    className="w-[74px] h-[74px] xl:w-[80px] xl:h-[80px] rounded-lg shrink-0 object-cover shadow-lg"
                    loading="lazy"
                  />
                  
                  {/* Traço vertical oficial vermelho */}
                  <div 
                    className="w-[2.5px] h-[64px] xl:h-[72px] bg-[#c5192d] shrink-0 rounded-full shadow-sm" 
                    aria-hidden="true" 
                  />

                  <p className="text-[12px] xl:text-[13px] text-white font-normal leading-[1.28] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                    Fortalecendo o acesso inclusivo e equitativo a conteúdos educativos, culturais e formativos.
                  </p>
                </div>

                {/* ODS 10 */}
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/ODS10.png"
                    alt="Ícone ODS 10 - Redução das Desigualdades"
                    className="w-[74px] h-[74px] xl:w-[80px] xl:h-[80px] rounded-lg shrink-0 object-cover shadow-lg"
                    loading="lazy"
                  />
                  
                  {/* Traço vertical oficial magenta */}
                  <div 
                    className="w-[2.5px] h-[64px] xl:h-[72px] bg-[#dd1367] shrink-0 rounded-full shadow-sm" 
                    aria-hidden="true" 
                  />

                  <p className="text-[12px] xl:text-[13px] text-white font-normal leading-[1.28] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                    Eliminando barreiras que limitam o exercício pleno de direitos e a participação cultural.
                  </p>
                </div>

                {/* ODS 11 */}
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/ODS11.png"
                    alt="Ícone ODS 11 - Cidades e Comunidades Sustentáveis"
                    className="w-[74px] h-[74px] xl:w-[80px] xl:h-[80px] rounded-lg shrink-0 object-cover shadow-lg"
                    loading="lazy"
                  />
                  
                  {/* Traço vertical oficial laranja */}
                  <div 
                    className="w-[2.5px] h-[64px] xl:h-[72px] bg-[#fd9d24] shrink-0 rounded-full shadow-sm" 
                    aria-hidden="true" 
                  />

                  <p className="text-[12px] xl:text-[13px] text-white font-normal leading-[1.28] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                    Promovendo espaços públicos e privados mais inclusivos, acessíveis e sustentáveis.
                  </p>
                </div>

              </div>

            </div>

            {/* =========================================================================
                LAYOUT MOBILE & TABLET (REDUÇÃO RESPONSIVA HARMONIOSA)
                ========================================================================= */}
            <div className="lg:hidden flex flex-col justify-between h-full space-y-8 p-4">
              
              {/* Esquerda / Topo */}
              <div className="max-w-md text-white">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-white mb-3">
                  Tecnologia, inclusão e cultura construindo um futuro <span className="text-[#f5a623] font-bold">mais justo</span>
                </h2>
                <p className="text-sm text-slate-100 leading-relaxed font-normal">
                  O Lumiar está alinhado aos Objetivos de Desenvolvimento Sustentável (ODS) e ao ESG, promovendo educação de qualidade, redução das desigualdades e cidades mais inclusivas e sustentáveis.
                </p>
              </div>

              {/* Direita / Base */}
              <div className="flex flex-col space-y-4 max-w-md">
                
                {/* ODS 4 */}
                <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
                  <img
                    src="/assets/ODS4.png"
                    alt="ODS 4"
                    className="w-14 h-14 rounded-lg shrink-0 object-cover"
                  />
                  <div className="w-[2.5px] h-12 bg-[#c5192d] shrink-0 rounded-full" aria-hidden="true" />
                  <p className="text-xs text-white leading-snug">
                    Fortalecendo o acesso inclusivo e equitativo a conteúdos educativos, culturais e formativos.
                  </p>
                </div>

                {/* ODS 10 */}
                <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
                  <img
                    src="/assets/ODS10.png"
                    alt="ODS 10"
                    className="w-14 h-14 rounded-lg shrink-0 object-cover"
                  />
                  <div className="w-[2.5px] h-12 bg-[#dd1367] shrink-0 rounded-full" aria-hidden="true" />
                  <p className="text-xs text-white leading-snug">
                    Eliminando barreiras que limitam o exercício pleno de direitos e a participação cultural.
                  </p>
                </div>

                {/* ODS 11 */}
                <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
                  <img
                    src="/assets/ODS11.png"
                    alt="ODS 11"
                    className="w-14 h-14 rounded-lg shrink-0 object-cover"
                  />
                  <div className="w-[2.5px] h-12 bg-[#fd9d24] shrink-0 rounded-full" aria-hidden="true" />
                  <p className="text-xs text-white leading-snug">
                    Promovendo espaços públicos e privados mais inclusivos, acessíveis e sustentáveis.
                  </p>
                </div>

              </div>

              {/* Espaçamento para o selo ESG nativo da imagem no mobile */}
              <div className="h-16 pointer-events-none" aria-hidden="true" />
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default LumiarOdsSection;
