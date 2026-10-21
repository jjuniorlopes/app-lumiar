import React, { useState } from 'react';
import { ShieldCheck, X, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface LumiarFooterProps {
  onNavigateTo?: (path: string) => void;
}

export function LumiarFooter({ onNavigateTo }: LumiarFooterProps) {
  const [lgpdModalOpen, setLgpdModalOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    if (onNavigateTo) {
      e.preventDefault();
      onNavigateTo(path);
    }
  };

  return (
    <footer className="lumiar-footer">
      <div className="lumiar-footer-inner footer__content">
        {/* Lado Esquerdo: Nova Logomarca oficial e Identidade */}
        <div className="lumiar-footer-brand footer__content--item">
          <div className="lumiar-footer-logo-wrap">
            <img 
              src="/assets/lumiar-logo-footer.png" 
              alt="Lumiar - Acessibilidade Conectada" 
              className="lumiar-footer-logo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/lumiar-logo-footer.png';
              }}
            />
          </div>
          <span className="lumiar-footer-tagline">
            Grupo Lumiar - Acessibilidade Conectada
          </span>
        </div>

        {/* Lado Direito: Navegação do Rodapé */}
        <div className="footer__content--item">
          <nav className="nav-footer" aria-label="Navegação secundária do rodapé">
            <a 
              href="/cultural" 
              onClick={(e) => handleLinkClick(e, '/cultural')}
            >
              Lumiar Cultural
            </a>
            <a 
              href="/guia" 
              onClick={(e) => handleLinkClick(e, '/guia')}
            >
              Lumiar Guia
            </a>
            <a 
              href="/turismo" 
              onClick={(e) => handleLinkClick(e, '/turismo')}
            >
              Lumiar Turismo
            </a>
            <a 
              href="mailto:lumiar@lumiar.com.br"
            >
              Contato
            </a>
          </nav>
        </div>
      </div>

      {/* Caixa de Segurança & Proteção de Dados (LGPD) */}
      <div className="lumiar-footer-lgpd-box">
        <div className="lumiar-footer-lgpd-icon-col">
          <div className="lumiar-footer-shield-badge">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
        </div>
        <div className="lumiar-footer-lgpd-text">
          Seus dados estão protegidos. O grupo Lumiar trata dados pessoais em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais – LGPD (Lei nº 13.709/2018)</strong>. Para exercer seus direitos, escreva para{' '}
          <a href="mailto:lumiar@lumiar.com.br" className="lumiar-footer-inline-link">
            lumiar@lumiar.com.br
          </a>{' '}
          ou leia a nossa{' '}
          <button 
            type="button" 
            onClick={() => setLgpdModalOpen(true)}
            className="lumiar-footer-lgpd-btn"
            aria-haspopup="dialog"
          >
            Política de Privacidade
          </button>.
        </div>
      </div>

      {/* Copyright institucional */}
      <div className="lumiar-footer-copy">
        Copyright © 2026 Grupo Lumiar - Todos os direitos reservados. / All rights reserved.
      </div>

      {/* =========================================================================
          MODAL DE POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)
          ========================================================================= */}
      {lgpdModalOpen && (
        <div 
          className="lumiar-lgpd-modal-overlay" 
          onClick={() => setLgpdModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lgpd-modal-title"
        >
          <div 
            className="lumiar-lgpd-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lumiar-lgpd-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="lumiar-lgpd-header-icon">
                  <Lock size={22} color="#0284c7" />
                </div>
                <div>
                  <span className="lumiar-lgpd-badge">LGPD · LEI Nº 13.709/2018</span>
                  <h2 id="lgpd-modal-title" className="lumiar-lgpd-title">
                    Proteção de Dados &amp; Política de Privacidade
                  </h2>
                </div>
              </div>
              <button 
                type="button" 
                className="lumiar-lgpd-close-btn"
                onClick={() => setLgpdModalOpen(false)}
                aria-label="Fechar política de privacidade"
              >
                <X size={20} />
              </button>
            </div>

            <div className="lumiar-lgpd-modal-body">
              <div className="lumiar-lgpd-intro-callout">
                <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p>
                  O <strong>Grupo Lumiar</strong> tem o compromisso inegociável de garantir a segurança, transparência e privacidade dos dados de todos os visitantes, usuários e instituições parceiras, atuando em rigorosa conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</strong> e normas internacionais de segurança digital.
                </p>
              </div>

              <div className="lumiar-lgpd-sections-list">
                <div className="lumiar-lgpd-section-item">
                  <h3>1. Finalidade do Tratamento de Dados</h3>
                  <p>
                    Os dados coletados em nossos serviços (como formulários de contato, preferências de acessibilidade e credenciais institucionais) são tratados estritamente para:
                  </p>
                  <ul>
                    <li>Customização e entrega dos recursos de acessibilidade sensorial e digital;</li>
                    <li>Atendimento a solicitações de propostas e suporte institucional;</li>
                    <li>Garantia da segurança da informação, auditoria e prevenção a fraudes;</li>
                    <li>Cumprimento de obrigações legais e regulatórias.</li>
                  </ul>
                </div>

                <div className="lumiar-lgpd-section-item">
                  <h3>2. Bases Legais Adotadas (Art. 7º e 11 da LGPD)</h3>
                  <p>
                    Todo e qualquer tratamento é fundamentado em bases legais expressas na LGPD: <em>Consentimento do titular</em>, <em>Execução de contrato ou procedimentos preliminares</em>, <em>Cumprimento de obrigação legal</em> e <em>Legítimo interesse</em> para garantia da melhoria contínua das soluções de acessibilidade.
                  </p>
                </div>

                <div className="lumiar-lgpd-section-item">
                  <h3>3. Direitos dos Titulares de Dados (Art. 18 da LGPD)</h3>
                  <p>
                    A qualquer momento, mediante requisição direta e simplificada, você pode exercer os seguintes direitos:
                  </p>
                  <ul>
                    <li><strong>Confirmação e Acesso:</strong> Obter a confirmação da existência de tratamento e consultar seus dados pessoais;</li>
                    <li><strong>Correção:</strong> Solicitar a retificação de dados incompletos, inexatos ou desatualizados;</li>
                    <li><strong>Anonimização ou Eliminação:</strong> Requerer a exclusão ou bloqueio de dados desnecessários ou tratados em desconformidade;</li>
                    <li><strong>Portabilidade:</strong> Solicitar a transferência dos seus dados a outro prestador de serviço;</li>
                    <li><strong>Revogação do Consentimento:</strong> Revogar a qualquer tempo autorizações concedidas anteriormente.</li>
                  </ul>
                </div>

                <div className="lumiar-lgpd-section-item">
                  <h3>4. Segurança da Informação e Isolamento Institucional</h3>
                  <p>
                    Adotamos criptografia de ponta a ponta (TLS 1.3 em trânsito e AES-256 em repouso), arquitetura multilocatária isolada por instituição (Tenant ID) e políticas contínuas de governança digital para assegurar que nenhum dado seja acessado indevidamente.
                  </p>
                </div>

                <div className="lumiar-lgpd-section-item">
                  <h3>5. Canal de Atendimento e Encarregado de Dados (DPO)</h3>
                  <p>
                    Para exercer quaisquer dos seus direitos ou esclarecer dúvidas sobre nossas práticas de privacidade, entre em contato diretamente com nossa equipe de Proteção de Dados:
                  </p>
                  <div className="lumiar-lgpd-contact-card">
                    <div>
                      <strong>Encarregado pelo Tratamento de Dados (DPO):</strong> Grupo Lumiar Privacidade
                    </div>
                    <div>
                      <strong>E-mail direto:</strong>{' '}
                      <a href="mailto:lumiar@lumiar.com.br" style={{ color: '#0284c7', fontWeight: 600 }}>
                        lumiar@lumiar.com.br
                      </a>
                    </div>
                    <div>
                      <strong>Prazo de resposta:</strong> Conforme preconizado na LGPD, respondemos a solicitações em formato simplificado imediatamente ou em declaração clara e completa em até 15 dias.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lumiar-lgpd-modal-footer">
              <button 
                type="button"
                className="lumiar-lgpd-confirm-btn"
                onClick={() => setLgpdModalOpen(false)}
              >
                Compreendi e Concordo
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

export default LumiarFooter;
