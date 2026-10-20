import React from 'react';
import { Sparkles, Quote } from 'lucide-react';

/**
 * Componente: QuemSomosSection
 * Conformidade: WCAG 2.2 AA | UI/UX Glassmorphism | CSS Grid Stacking (sem background-image)
 * Inspiração: inclutalk.com.br
 */
export function QuemSomosSection() {
  return (
    <section
      id="quem-somos"
      aria-labelledby="quem-somos-titulo"
      className="quem-somos-section-wrap"
    >
      {/* Card Split Moderno (Inspiração IncluTalk): Imagem na Esquerda, Texto na Direita */}
      <div className="quem-somos-split-card">
        {/* Lado Esquerdo: Imagem Nativa com Enquadramento e Bordas Arredondadas */}
        <div className="quem-somos-media-col">
          <img
            src="/assets/quem-somos-acessibilidade.jpg"
            alt="Visitantes com e sem deficiência em um museu moderno e acessível: pessoa em cadeira de rodas interagindo com totem tátil, homem cego com bengala guia caminhando sobre piso tátil, idosos e adultos explorando o acervo cultural com autonomia."
            className="quem-somos-media-img"
            loading="lazy"
            decoding="async"
          />
          <div className="quem-somos-media-overlay" aria-hidden="true" />
        </div>

        {/* Lado Direito: Conteúdo e Tipografia no Padrão de Design IncluTalk */}
        <div className="quem-somos-text-col">
          {/* Eyebrow de Contexto */}
          <div className="quem-somos-badge-wrap">
            <span className="quem-somos-badge inline-flex items-center gap-2">
              <Sparkles size={14} aria-hidden="true" />
              Inclusão &amp; Tecnologia
            </span>
          </div>

          {/* Título com Destaque de Cor (Estilo IncluTalk: O que é o Lumiar?) */}
          <h2 id="quem-somos-titulo" className="quem-somos-inclutalk-title">
            O que é<br />
            o <span className="quem-somos-highlight">Lumiar</span>?
          </h2>

          {/* Parágrafos Formatados e com Alto Contraste WCAG 2.2 AA */}
          <div className="quem-somos-paragraphs">
            <p>
              <strong>Lumiar</strong> é uma <strong>Plataforma de Acessibilidade Digital e Conectada</strong> que desenvolve soluções inovadoras com Inteligência Artificial Generativa para adaptar ambientes físicos e digitais às diferentes necessidades, tornando o patrimônio cultural e turístico acessível para pessoas com deficiência visual, auditiva, física, intelectual ou múltipla, neurodivergentes e idosos.
            </p>

            <p>
              Com ele, sua instituição demonstra compromisso com a inclusão, amplia o alcance do público e oferece uma experiência autônoma, justa e acolhedora para todos.
            </p>
          </div>

          {/* Destaque / Frase de Impacto com Ícone e Borda Lateral Cyan */}
          <blockquote className="quem-somos-quote-block">
            <Quote size={24} className="quem-somos-quote-icon flex-shrink-0" aria-hidden="true" />
            <p className="quem-somos-quote-text">
              Lumiar: Tecnologia que ilumina caminhos, conecta pessoas e transforma a acessibilidade em uma experiência para todos.
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
