import React from 'react';
import { Scale, Fingerprint } from 'lucide-react';

/**
 * Componente: LumiarExperienceCards
 * 
 * Especialista em UI/UX e Acessibilidade (WCAG 2.2 AA).
 * Arquitetura de Layout: CSS Grid Stacking (sem position: absolute, sem background-image).
 * Alinhamento pixel-perfect horizontal e vertical entre os cards lado a lado.
 */
export function LumiarExperienceCards() {
  return (
    <section 
      id="experiencia" 
      aria-labelledby="experiencia-titulo"
      className="lumiar-section-experience w-full py-8 bg-white font-inter"
    >
      <div className="lumiar-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* =========================================================================
            CABEÇALHO DA SEÇÃO (TÍTULO E SUBTÍTULO NO MESMO PADRÃO DA SEÇÃO PRODUTOS)
            ========================================================================= */}
        <div className="lumiar-section-header text-center max-w-[860px] mx-auto mb-8">
          <h2 
            id="experiencia-titulo" 
            className="text-[clamp(34px,4.6vw,54px)] font-extrabold text-slate-900 leading-[1.08] tracking-tight mb-5"
          >
            Direito de acessar, autonomia para vivenciar.
          </h2>
          <p className="text-[clamp(17px,2vw,20px)] font-normal text-slate-600 leading-[1.48] max-w-[780px] mx-auto">
            Da garantia legal da LBI às soluções sensoriais com inteligência artificial: conectamos pessoas a espaços culturais com independência, acolhimento e dignidade.
          </p>
        </div>

        {/* =========================================================================
            GRID DE CARDS LADO A LADO (Grid Stacking Obrigatório: col-start-1 row-start-1)
            ========================================================================= */}
        <div className="lumiar-experience-grid grid grid-cols-1 md:grid-cols-2 gap-7 items-stretch">
          
          {/* =========================================================================
              CARD 1: Maquete Tátil em Bronze - O acesso à informação é um direito
              ========================================================================= */}
          <article className="lumiar-experience-card grid grid-cols-1 grid-rows-1 rounded-2xl overflow-hidden min-h-[560px] shadow-2xl border border-slate-800/20 group">
            {/* Camada 1: Imagem nativa (Grid Stacking: col-start-1 row-start-1) */}
            <img
              src="/assets/lumiar-maquete-tatil.jpg"
              alt="Mão de visitante explorando os relevos táteis em bronze de uma maquete arquitetônica de catedral, promovendo acessibilidade física e tátil."
              className="lumiar-experience-img col-start-1 row-start-1 w-full h-full min-h-[560px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />

            {/* Camada 2: Overlay gradiente multi-direcional (Grid Stacking: col-start-1 row-start-1) */}
            <div
              aria-hidden="true"
              className="lumiar-experience-overlay col-start-1 row-start-1 w-full h-full pointer-events-none"
            />

            {/* Camada 3: Container de Conteúdo perfeitamente alinhado (Grid Stacking: col-start-1 row-start-1) */}
            <div className="lumiar-experience-content col-start-1 row-start-1 w-full h-full flex flex-col justify-start items-start text-left p-8 md:p-11 text-white z-10 font-inter">
              {/* Ícone: Scale (text-blue-400) com moldura translúcida alinhado à esquerda */}
              <div className="lumiar-experience-icon-badge blue mb-5 self-start inline-flex items-center justify-center w-[52px] h-[52px] rounded-xl bg-blue-500/20 border border-blue-400/40 backdrop-blur-md shadow-inner shrink-0">
                <Scale className="w-6 h-6 text-blue-400" aria-hidden="true" />
              </div>

              {/* Título do Card (h3) com altura mínima uniforme para pareamento exato */}
              <h3 className="lumiar-experience-card-title text-2xl md:text-[27px] font-extrabold tracking-tight text-white mb-6 leading-snug text-left">
                O acesso à informação é um direito
              </h3>

              {/* Tópicos com marcadores pontuais e textos perfeitamente alinhados */}
              <ul className="lumiar-experience-list space-y-4 text-white text-sm md:text-base leading-relaxed list-none p-0 m-0 w-full text-left">
                <li className="lumiar-experience-item flex items-start gap-3 text-left">
                  <span className="lumiar-experience-bullet blue w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0 shadow-sm" aria-hidden="true" />
                  <div className="lumiar-experience-item-text block text-slate-100 leading-relaxed">
                    <strong className="text-white font-bold">Garantia Legal:</strong>{' '}
                    A Lei Brasileira de Inclusão (LBI - 13.146/15) assegura o pleno acesso à comunicação para todas as pessoas.
                  </div>
                </li>
                <li className="lumiar-experience-item flex items-start gap-3 text-left">
                  <span className="lumiar-experience-bullet blue w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0 shadow-sm" aria-hidden="true" />
                  <div className="lumiar-experience-item-text block text-slate-100 leading-relaxed">
                    <strong className="text-white font-bold">Quebra de Barreiras:</strong>{' '}
                    Transforma a tecnologia em uma ferramenta obrigatória para eliminar obstáculos em espaços culturais e turísticos.
                  </div>
                </li>
                <li className="lumiar-experience-item flex items-start gap-3 text-left">
                  <span className="lumiar-experience-bullet blue w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0 shadow-sm" aria-hidden="true" />
                  <div className="lumiar-experience-item-text block text-slate-100 leading-relaxed">
                    <strong className="text-white font-bold">Autonomia e Dignidade:</strong>{' '}
                    Garante que pessoas com deficiência tenham independência total para consumir conteúdo e vivenciar experiências.
                  </div>
                </li>
              </ul>
            </div>
          </article>

          {/* =========================================================================
              CARD 2: Usuária com App Mobile - Múltiplas formas de explorar
              ========================================================================= */}
          <article className="lumiar-experience-card grid grid-cols-1 grid-rows-1 rounded-2xl overflow-hidden min-h-[560px] shadow-2xl border border-slate-800/20 group">
            {/* Camada 1: Imagem nativa (Grid Stacking: col-start-1 row-start-1) */}
            <img
              src="/assets/lumiar-experiencia-mobile.png"
              alt="Mulher negra com óculos inteligentes e fones de ouvido utilizando o aplicativo Lumiar no smartphone em uma galeria de arte com obras iluminadas."
              className="lumiar-experience-img col-start-1 row-start-1 w-full h-full min-h-[560px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />

            {/* Camada 2: Overlay gradiente multi-direcional (Grid Stacking: col-start-1 row-start-1) */}
            <div
              aria-hidden="true"
              className="lumiar-experience-overlay col-start-1 row-start-1 w-full h-full pointer-events-none"
            />

            {/* Camada 3: Container de Conteúdo perfeitamente alinhado (Grid Stacking: col-start-1 row-start-1) */}
            <div className="lumiar-experience-content col-start-1 row-start-1 w-full h-full flex flex-col justify-start items-start text-left p-8 md:p-11 text-white z-10 font-inter">
              {/* Ícone: Fingerprint (text-teal-400) com moldura translúcida alinhado à esquerda */}
              <div className="lumiar-experience-icon-badge teal mb-5 self-start inline-flex items-center justify-center w-[52px] h-[52px] rounded-xl bg-teal-500/20 border border-teal-400/40 backdrop-blur-md shadow-inner shrink-0">
                <Fingerprint className="w-6 h-6 text-teal-400" aria-hidden="true" />
              </div>

              {/* Título do Card (h3) com altura mínima uniforme para pareamento exato */}
              <h3 className="lumiar-experience-card-title text-2xl md:text-[27px] font-extrabold tracking-tight text-white mb-6 leading-snug text-left">
                Múltiplas formas de explorar
              </h3>

              {/* Tópicos com marcadores pontuais e textos perfeitamente alinhados */}
              <ul className="lumiar-experience-list space-y-4 text-white text-sm md:text-base leading-relaxed list-none p-0 m-0 w-full text-left">
                <li className="lumiar-experience-item flex items-start gap-3 text-left">
                  <span className="lumiar-experience-bullet teal w-2 h-2 rounded-full bg-teal-400 mt-2 shrink-0 shadow-sm" aria-hidden="true" />
                  <div className="lumiar-experience-item-text block text-slate-100 leading-relaxed">
                    <strong className="text-white font-bold">Ouça:</strong>{' '}
                    Audiodescrições detalhadas e imersivas para você vivenciar o ambiente no seu próprio ritmo.
                  </div>
                </li>
                <li className="lumiar-experience-item flex items-start gap-3 text-left">
                  <span className="lumiar-experience-bullet teal w-2 h-2 rounded-full bg-teal-400 mt-2 shrink-0 shadow-sm" aria-hidden="true" />
                  <div className="lumiar-experience-item-text block text-slate-100 leading-relaxed">
                    <strong className="text-white font-bold">Navegue:</strong>{' '}
                    Rotas adaptadas e informações de localização acessíveis para guiar sua visita com segurança.
                  </div>
                </li>
                <li className="lumiar-experience-item flex items-start gap-3 text-left">
                  <span className="lumiar-experience-bullet teal w-2 h-2 rounded-full bg-teal-400 mt-2 shrink-0 shadow-sm" aria-hidden="true" />
                  <div className="lumiar-experience-item-text block text-slate-100 leading-relaxed">
                    <strong className="text-white font-bold">Interaja:</strong>{' '}
                    Converse com a assistente de IA Lumi, tire dúvidas em tempo real e enriqueça sua experiência.
                  </div>
                </li>
              </ul>
            </div>
          </article>

        </div>
      </div>
    </section>
  );
}

export default LumiarExperienceCards;
