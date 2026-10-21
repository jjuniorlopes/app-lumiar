import React from 'react';

/**
 * Componente: LumiarAcessibilidadeSection
 * 
 * Seção de Acessibilidade Digital e LBI posicionada logo abaixo dos cards de produtos:
 * - Título e subtítulo com mesmo formato de fonte, cor e tamanho da seção
 *   "Direito de acessar, autonomia para vivenciar."
 * - Imagem "Inclusão Digital para Todos.png" posicionada logo abaixo do texto
 *   com os mesmos efeitos visuais e de contorno da imagem do tópico "O que é o Lumiar?":
 *     * Borda arredondada (border-radius: 28px)
 *     * Contorno com realce superior em cyan (#06b6d4)
 *     * Sombra com profundidade (box-shadow)
 *     * Efeito de transição suave no hover
 * - Imagem 100% íntegra, sem qualquer corte, modificação interna ou distorção.
 */
export function LumiarAcessibilidadeSection() {
  return (
    <section 
      id="sustentabilidade" 
      aria-labelledby="acessibilidade-titulo"
      className="lumiar-section-acessibilidade relative"
    >
      <span id="acessibilidade" style={{ position: 'absolute', top: '-80px', visibility: 'hidden' }} aria-hidden="true" />
      <div className="lumiar-acessibilidade-container">
        {/* =========================================================================
            CABEÇALHO DA SEÇÃO (TÍTULO E SUBTÍTULO NO MESMO FORMATO DE FONTE E COR)
            ========================================================================= */}
        <div className="lumiar-acessibilidade-header">
          <h2 
            id="acessibilidade-titulo"
            className="lumiar-acessibilidade-title"
          >
            A acessibilidade digital é um direito, não um privilégio
          </h2>
          
          <p className="lumiar-acessibilidade-subtitle">
            A <strong>Lei Brasileira de Inclusão (LBI — Lei nº 13.146/2015)</strong> assegura o direito à informação e à comunicação em condições de igualdade. Tornar sites e plataformas digitais acessíveis é promover <strong>educação inclusiva (ODS 4), redução das desigualdades (ODS 10) e cidades mais inclusivas e sustentáveis (ODS 11)</strong>, garantindo que todas as pessoas possam acessar informações, serviços e oportunidades com autonomia.
          </p>
        </div>

        {/* =========================================================================
            IMAGEM NATIVA: "Inclusão Digital para Todos.png"
            Com o mesmo estilo de efeitos visuais e contorno de "O que é o Lumiar?":
            - Borda com cantos arredondados (border-radius: 28px)
            - Contorno superior em cyan (#06b6d4)
            - Sombra moderna e profunda
            - Efeito hover sutil
            - Imagem 100% completa, mantendo todos os elementos internos intactos
            ========================================================================= */}
        <div className="lumiar-acessibilidade-media-card">
          <img
            src="/assets/inclusao-digital-para-todos.png"
            alt="Inclusão Digital para Todos: quatro pessoas com diferentes características e deficiências utilizando smartphone, laptop e tablet com recursos de acessibilidade como audiodescrição, Libras e leitor de tela, alinhadas aos ODS 4, 10 e 11."
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/Inclusão Digital para Todos.png';
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default LumiarAcessibilidadeSection;
