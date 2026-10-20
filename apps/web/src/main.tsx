import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, Landmark, MapPinned, Users, Building2,
  ShieldCheck, LogOut, Plus, Volume2,
  QrCode, CheckCircle2, Clock, Sparkles, MessageSquare, Send, Download,
  Edit2, Trash2, ArrowRightLeft, Image as ImageIcon, UploadCloud,
  Search, RefreshCw, UserPlus, AlertCircle, Accessibility, ZoomIn, ZoomOut,
  Contrast, Moon, Palette, Link2, Keyboard, Type, MoveVertical, MousePointer2,
  Square, RotateCcw, X, Mic, MicOff, Pause, Play, SkipBack, SkipForward,
  ChevronLeft, ChevronRight, ChevronDown, Globe, Check, Eye, EyeOff, Sun, MessageCircle
} from 'lucide-react';
import './styles/global.css';
import './styles/landing-polish.css';
import './styles/portal-moderno.css';
import { QuemSomosSection } from './components/QuemSomosSection';
import { LumiarExperienceCards } from './components/LumiarExperienceCards';
import { LumiarOdsSection } from './components/LumiarOdsSection';

const API = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

async function request(path: string, opts: any = {}, token?: string) {
  const r = await fetch(API + '/api/v1' + path, {
    ...opts,
    headers: {
      ...(opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(opts.headers || {})
    }
  });

  let d: any;
  try {
    d = await r.json();
  } catch (err) {
    d = { detail: r.statusText || 'Erro na resposta do servidor' };
  }

  if (!r.ok) {
    let msg = 'Erro na requisição';
    if (typeof d?.detail === 'string') {
      msg = d.detail;
    } else if (Array.isArray(d?.detail) && d.detail[0]?.msg) {
      msg = d.detail[0].msg;
    } else if (d?.message) {
      msg = d.message;
    }
    const error: any = new Error(msg);
    error.status = r.status;
    throw error;
  }
  return d;
}

function Login({ onLogin, onBack }: { onLogin: (t: string) => void; onBack?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [forgotInfo, setForgotInfo] = useState(false);

  const [openDyslexic, setOpenDyslexic] = useState(() => {
    return typeof document !== 'undefined' && document.body.classList.contains('a11y-opendyslexic');
  });
  const [highContrast, setHighContrast] = useState(() => {
    return typeof document !== 'undefined' && document.body.classList.contains('a11y-high-contrast');
  });

  const toggleOpenDyslexic = () => {
    const next = !openDyslexic;
    setOpenDyslexic(next);
    document.body.classList.toggle('a11y-opendyslexic', next);
  };

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    document.body.classList.toggle('a11y-high-contrast', next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      let d;
      if (mode === 'login') {
        d = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
      } else {
        d = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Curador Institucional',
            email: email.trim(),
            password,
            organization_name: 'Novo Museu Cultural'
          })
        });
      }
      localStorage.setItem('lumiar_token', d.access_token);
      onLogin(d.access_token);
    } catch (x: any) {
      setErr(x.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* Coluna Esquerda: Imagem com Acessibilidade no Museu */}
      <div className="login-split-media" aria-hidden="true">
        <img
          src="/assets/login-acessibilidade.jpg"
          alt="Visitantes explorando museu acessível"
        />
        <div className="login-split-media-overlay" />
      </div>

      {/* Coluna Direita: Formulário de Autenticação */}
      <div className="login-split-form-col">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="login-back-btn"
            aria-label="Voltar para a página comercial"
          >
            <ChevronLeft size={16} /> Voltar para o portal
          </button>
        )}

        <div className="login-form-inner">
          <div className="login-brand-header">
            <img
              src="/logo_oficial_lumiar.png"
              alt="Lumiar - Acessibilidade Conectada"
              className="login-brand-logo"
            />
            <h2 className="login-title">
              {mode === 'login' ? 'Entrar na plataforma' : 'Cadastrar na plataforma'}
            </h2>
            <p className="login-subtitle">
              {mode === 'login'
                ? 'Acesse sua conta para gerenciar e explorar'
                : 'Crie a conta da sua instituição para gerenciar acervos e rotas'}
            </p>
          </div>

          <div className="login-mode-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={'login-mode-tab' + (mode === 'login' ? ' active' : '')}
              onClick={() => { setMode('login'); setErr(''); }}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={'login-mode-tab' + (mode === 'register' ? ' active' : '')}
              onClick={() => { setMode('register'); setErr(''); }}
            >
              Cadastrar Instituição
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="login-field-group">
              <label htmlFor="login-email" className="login-field-label">
                {mode === 'login' ? 'E-mail' : 'E-mail institucional'}
              </label>
              <input
                id="login-email"
                className="login-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="nome@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="login-field-group">
              <div className="login-field-row">
                <label htmlFor="login-password" className="login-field-label">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setForgotInfo(p => !p)}
                    className="login-forgot-link"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="login-password-wrapper">
                <input
                  id="login-password"
                  className="login-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="login-toggle-password-btn"
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  <span>{showPassword ? 'Ocultar' : 'Mostrar senha'}</span>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {forgotInfo && (
              <div className="login-info-alert" role="status">
                <span>Para redefinir sua senha com segurança institucional, contate: <strong>contato@lumiar.dev</strong></span>
                <button type="button" onClick={() => setForgotInfo(false)} className="login-info-close" aria-label="Fechar aviso">
                  <X size={14} />
                </button>
              </div>
            )}

            {err && (
              <div className="login-error-alert" role="alert">
                <AlertCircle size={17} />
                <span>{err}</span>
              </div>
            )}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Cadastrar Instituição'}
            </button>
          </form>

          {/* Toggles de Acessibilidade da Tela de Login (Padrão do Mockup) */}
          <div className="login-a11y-toggles-row">
            <label className="login-a11y-toggle-item">
              <span className="login-switch">
                <input
                  type="checkbox"
                  checked={openDyslexic}
                  onChange={toggleOpenDyslexic}
                  aria-label="Ativar fonte OpenDyslexic"
                />
                <span className="login-switch-slider"></span>
              </span>
              <span>Ativar OpenDyslexic</span>
            </label>

            <label className="login-a11y-toggle-item">
              <span className="login-switch">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={toggleHighContrast}
                  aria-label="Ativar modo Alto Contraste"
                />
                <span className="login-switch-slider"></span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                Alto contraste <Sun size={15} />
              </span>
            </label>
          </div>

          <p className="login-bottom-quote">
            Lumiar: tecnologia que ilumina caminhos, conecta pessoas e transforma a acessibilidade em uma experiência para todos.
          </p>
        </div>
      </div>
    </div>
  );
}

type AccessibilitySettings = {
  fontScale: number;
  highContrast: boolean;
  darkMode: boolean;
  grayscale: boolean;
  saturateHigh: boolean;
  saturateLow: boolean;
  dyslexiaFont: boolean;
  hideImages: boolean;
  readingMode: boolean;
  largeCursor: boolean;
  highlightLinks: boolean;
  keyboardMode: boolean;
  letterSpacing: boolean;
  lineSpacing: boolean;
};

const defaultAccessibilitySettings: AccessibilitySettings = {
  fontScale: 100,
  highContrast: false,
  darkMode: false,
  grayscale: false,
  saturateHigh: false,
  saturateLow: false,
  dyslexiaFont: false,
  hideImages: false,
  readingMode: false,
  largeCursor: false,
  highlightLinks: false,
  keyboardMode: false,
  letterSpacing: false,
  lineSpacing: false
};

function AccessibilityToolbar({ externalOpen, onToggleExternal }: { externalOpen?: boolean; onToggleExternal?: () => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    if (onToggleExternal) {
      onToggleExternal();
    } else {
      setInternalOpen(val);
    }
  };

  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      return { ...defaultAccessibilitySettings, ...JSON.parse(localStorage.getItem('lumiar_accessibility') || '{}') };
    } catch {
      return defaultAccessibilitySettings;
    }
  });

  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    localStorage.setItem('lumiar_accessibility', JSON.stringify(settings));
    const root = document.body;
    root.classList.toggle('a11y-high-contrast', settings.highContrast);
    root.classList.toggle('a11y-dark-mode', settings.darkMode);
    root.classList.toggle('a11y-grayscale', settings.grayscale);
    root.classList.toggle('a11y-saturate-high', settings.saturateHigh);
    root.classList.toggle('a11y-saturate-low', settings.saturateLow);
    root.classList.toggle('a11y-dyslexia-font', settings.dyslexiaFont);
    root.classList.toggle('a11y-hide-images', settings.hideImages);
    root.classList.toggle('a11y-reading-mode', settings.readingMode);
    root.classList.toggle('a11y-large-cursor', settings.largeCursor);
    root.classList.toggle('a11y-highlight-links', settings.highlightLinks);
    root.classList.toggle('a11y-keyboard-mode', settings.keyboardMode);
    root.classList.toggle('a11y-letter-spacing', settings.letterSpacing);
    root.classList.toggle('a11y-line-spacing', settings.lineSpacing);
    root.dataset.a11yFontScale = String(settings.fontScale);
    root.style.setProperty('--a11y-font-scale', String(settings.fontScale / 100));
  }, [settings]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        return;
      }
      if (!event.altKey) return;
      const actions: Record<string, () => void> = {
        '1': () => updateSetting('highContrast', !settings.highContrast),
        '2': () => updateSetting('darkMode', !settings.darkMode),
        '3': () => updateSetting('grayscale', !settings.grayscale),
        '4': () => updateSetting('dyslexiaFont', !settings.dyslexiaFont),
        '5': () => updateSetting('largeCursor', !settings.largeCursor),
        '6': () => changeFontScale(10),
        '7': () => changeFontScale(-10),
        '8': () => triggerVLibras(),
        '0': resetSettings
      };
      const action = actions[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
      if (event.key.toLowerCase() === 'r' && !event.ctrlKey) {
        event.preventDefault();
        readPageAloud();
      }
      if (event.key.toLowerCase() === 'p' && !event.ctrlKey) {
        event.preventDefault();
        stopReading();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [settings, open]);

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(current => ({ ...current, [key]: value }));
  };

  const changeFontScale = (delta: number) => {
    setSettings(current => ({ ...current, fontScale: Math.min(150, Math.max(85, current.fontScale + delta)) }));
  };

  const resetSettings = () => {
    stopReading();
    setSettings(defaultAccessibilitySettings);
  };

  const readPageAloud = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = window.getSelection()?.toString() || document.querySelector('main')?.textContent || document.body.textContent || '';
    const utterance = new SpeechSynthesisUtterance(text.trim().replace(/\s+/g, ' '));
    utterance.lang = 'pt-BR';
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    setIsReading(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopReading = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    }
  };

  const triggerVLibras = () => {
    const btn = document.querySelector('[vw-access-button]') as HTMLElement;
    if (btn) {
      btn.click();
    } else {
      alert('VLibras gov.br: O recurso de tradução em Libras oficial está ativo e disponível na barra lateral.');
    }
  };

  return (
    <>
      {/* Botão flutuante de acessibilidade no canto inferior direito */}
      <button
        type="button"
        className="lumiar-a11y-float-btn"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Abrir painel de acessibilidade digital (Alt+A)"
        title="Painel de Acessibilidade Digital"
      >
        <img src="/assets/acessibilidade.jpg" alt="Acessibilidade Digital" className="lumiar-a11y-float-img" />
      </button>

      {/* Painel Flutuante Modal de Acessibilidade Digital */}
      {open && (
        <div className="lumiar-a11y-modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="lumiar-a11y-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Controles de Acessibilidade Digital"
            onClick={e => e.stopPropagation()}
          >
            {/* Cabeçalho com Redefinir e Fechar */}
            <div className="lumiar-a11y-modal-header">
              <button type="button" className="lumiar-a11y-reset-btn" onClick={resetSettings}>
                Redefinir Ajustes
              </button>
              <button
                type="button"
                className="lumiar-a11y-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Fechar painel de acessibilidade"
              >
                <X size={20} />
              </button>
            </div>

            {/* Grid com cartões interativos */}
            <div className="lumiar-a11y-cards-grid">
              {/* 1. Aumentar Fonte */}
              <button
                type="button"
                className="lumiar-a11y-item-card"
                onClick={() => changeFontScale(10)}
                aria-label={`Aumentar Fonte (atual ${settings.fontScale}%)`}
              >
                <span className="lumiar-a11y-item-icon">A+</span>
                <span className="lumiar-a11y-item-label">Aumentar Fonte</span>
              </button>

              {/* 2. Diminuir Fonte */}
              <button
                type="button"
                className="lumiar-a11y-item-card"
                onClick={() => changeFontScale(-10)}
                aria-label={`Diminuir Fonte (atual ${settings.fontScale}%)`}
              >
                <span className="lumiar-a11y-item-icon">A-</span>
                <span className="lumiar-a11y-item-label">Diminuir Fonte</span>
              </button>

              {/* 3. Fonte para Dislexia */}
              <button
                type="button"
                className={'lumiar-a11y-item-card' + (settings.dyslexiaFont ? ' active' : '')}
                onClick={() => updateSetting('dyslexiaFont', !settings.dyslexiaFont)}
                aria-pressed={settings.dyslexiaFont}
              >
                <span className="lumiar-a11y-item-icon"><Type size={24} /></span>
                <span className="lumiar-a11y-item-label">Fonte para Dislexia</span>
              </button>

              {/* 4. Monocromático */}
              <button
                type="button"
                className={'lumiar-a11y-item-card' + (settings.grayscale ? ' active' : '')}
                onClick={() => updateSetting('grayscale', !settings.grayscale)}
                aria-pressed={settings.grayscale}
              >
                <span className="lumiar-a11y-item-icon"><Palette size={24} /></span>
                <span className="lumiar-a11y-item-label">Monocromático</span>
              </button>

              {/* 5. Aumentar Saturação */}
              <button
                type="button"
                className={'lumiar-a11y-item-card' + (settings.saturateHigh ? ' active' : '')}
                onClick={() => {
                  updateSetting('saturateLow', false);
                  updateSetting('saturateHigh', !settings.saturateHigh);
                }}
                aria-pressed={settings.saturateHigh}
              >
                <span className="lumiar-a11y-item-icon">💧+</span>
                <span className="lumiar-a11y-item-label">Aumentar Saturação</span>
              </button>

              {/* 6. Diminuir Saturação */}
              <button
                type="button"
                className={'lumiar-a11y-item-card' + (settings.saturateLow ? ' active' : '')}
                onClick={() => {
                  updateSetting('saturateHigh', false);
                  updateSetting('saturateLow', !settings.saturateLow);
                }}
                aria-pressed={settings.saturateLow}
              >
                <span className="lumiar-a11y-item-icon">💧-</span>
                <span className="lumiar-a11y-item-label">Diminuir Saturação</span>
              </button>

              {/* 7. Esconder Imagens */}
              <button
                type="button"
                className={'lumiar-a11y-item-card' + (settings.hideImages ? ' active' : '')}
                onClick={() => updateSetting('hideImages', !settings.hideImages)}
                aria-pressed={settings.hideImages}
              >
                <span className="lumiar-a11y-item-icon"><ImageIcon size={24} /></span>
                <span className="lumiar-a11y-item-label">Esconder Imagens</span>
              </button>

              {/* 8. Modo Leitura */}
              <button
                type="button"
                className={'lumiar-a11y-item-card' + (settings.readingMode ? ' active' : '')}
                onClick={() => updateSetting('readingMode', !settings.readingMode)}
                aria-pressed={settings.readingMode}
              >
                <span className="lumiar-a11y-item-icon"><LayoutDashboard size={24} /></span>
                <span className="lumiar-a11y-item-label">Modo Leitura</span>
              </button>

              {/* 9. Aumentar Cursor */}
              <button
                type="button"
                className={'lumiar-a11y-item-card' + (settings.largeCursor ? ' active' : '')}
                onClick={() => updateSetting('largeCursor', !settings.largeCursor)}
                aria-pressed={settings.largeCursor}
              >
                <span className="lumiar-a11y-item-icon"><MousePointer2 size={24} /></span>
                <span className="lumiar-a11y-item-label">Aumentar Cursor</span>
              </button>

              {/* 10. Libras */}
              <button
                type="button"
                className="lumiar-a11y-item-card"
                onClick={triggerVLibras}
                aria-label="Ativar VLibras gov.br"
              >
                <span className="lumiar-a11y-item-icon">
                  <img src="/assets/icone-acessibilidade-libras.png" alt="" style={{ height: '30px', objectFit: 'contain' }} />
                </span>
                <span className="lumiar-a11y-item-label">Libras</span>
              </button>

              {/* 11. Ler Conteúdo */}
              <button
                type="button"
                className={'lumiar-a11y-item-card' + (isReading ? ' active' : '')}
                onClick={isReading ? stopReading : readPageAloud}
                aria-pressed={isReading}
                aria-label={isReading ? 'Parar leitura em voz alta' : 'Ler conteúdo da página em voz alta'}
              >
                <span className="lumiar-a11y-item-icon">
                  {isReading ? <Square size={24} /> : <Volume2 size={24} />}
                </span>
                <span className="lumiar-a11y-item-label">{isReading ? 'Parar Áudio' : 'Ler Conteúdo'}</span>
              </button>

              {/* 12. Alto Contraste */}
              <button
                type="button"
                className={'lumiar-a11y-item-card' + (settings.highContrast ? ' active' : '')}
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                aria-pressed={settings.highContrast}
              >
                <span className="lumiar-a11y-item-icon"><Contrast size={24} /></span>
                <span className="lumiar-a11y-item-label">Alto Contraste</span>
              </button>
            </div>

            {/* Cartão de crédito Lumiar */}
            <div className="lumiar-a11y-credit-card">
              <span className="lumiar-a11y-credit-text">Acessibilidade Digital por</span>
              <img className="lumiar-a11y-credit-logo" src="/logo_oficial_lumiar.png" alt="Lumiar Acessibilidade Conectada" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type SupportedLang = 'pt' | 'pt-PT' | 'en' | 'es' | 'fr';

interface LanguageOption {
  code: SupportedLang;
  nativeName: string;
  hreflang: string;
  flag: string;
  country: string;
  badge: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'pt', nativeName: 'Português (Brasil)', hreflang: 'pt-BR', flag: '/assets/bandeira-brasil.png', country: 'Brasil', badge: 'PT' },
  { code: 'pt-PT', nativeName: 'Português (Portugal)', hreflang: 'pt-PT', flag: '/assets/bandeira-portugal.svg', country: 'Portugal', badge: 'PT' },
  { code: 'en', nativeName: 'English', hreflang: 'en-US', flag: '/assets/bandeira-eua.png', country: 'United States', badge: 'EN' },
  { code: 'es', nativeName: 'Español', hreflang: 'es-ES', flag: '/assets/bandeira-espanha.png', country: 'España', badge: 'ES' },
  { code: 'fr', nativeName: 'Français', hreflang: 'fr-FR', flag: '/assets/bandeira-franca.svg', country: 'France', badge: 'FR' }
];

function detectInitialLanguage(): SupportedLang {
  try {
    const params = new URLSearchParams(window.location.search);
    const rawUrlLang = params.get('lang');
    if (rawUrlLang) {
      const lower = rawUrlLang.toLowerCase();
      if (lower === 'pt-pt' || lower === 'pt_pt') return 'pt-PT';
      if (lower === 'pt' || lower === 'pt-br' || lower === 'pt_br') return 'pt';
      if (['en', 'es', 'fr'].includes(lower)) return lower as SupportedLang;
    }

    const saved = localStorage.getItem('lumiar_lang') as SupportedLang;
    if (saved && ['pt', 'pt-PT', 'en', 'es', 'fr'].includes(saved)) {
      return saved;
    }

    const navLangs = navigator.languages || [navigator.language || ''];
    for (const l of navLangs) {
      const lower = l.toLowerCase();
      if (lower === 'pt-pt' || lower.startsWith('pt-pt')) return 'pt-PT';
      if (lower.startsWith('fr')) return 'fr';
      if (lower.startsWith('es')) return 'es';
      if (lower.startsWith('en')) return 'en';
      if (lower.startsWith('pt')) return 'pt';
    }
  } catch (err) {}
  return 'pt';
}

function LumiarUnifiedHeader({
  onToggleA11y,
  lang,
  setLang,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenLogin,
  onNavigateTo,
  onOpenProposal,
  onOpenA11yInfo
}: {
  onToggleA11y: () => void;
  lang: SupportedLang;
  setLang: (l: SupportedLang) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onOpenLogin: () => void;
  onNavigateTo: (path: string) => void;
  onOpenProposal: () => void;
  onOpenA11yInfo: () => void;
}) {
  const [langModalOpen, setLangModalOpen] = useState(false);

  const langDetails: Record<SupportedLang, { primary: string; sub: string; flag: string; badge: string }> = {
    pt: { primary: 'Português', sub: 'Brasil', flag: '/assets/bandeira-brasil.png', badge: 'PT-BR' },
    'pt-PT': { primary: 'Português', sub: 'Portugal', flag: '/assets/bandeira-portugal.svg', badge: 'PT' },
    en: { primary: 'Inglês', sub: 'Estados Unidos', flag: '/assets/bandeira-eua.png', badge: 'EN' },
    es: { primary: 'Espanhol', sub: 'Espanhol', flag: '/assets/bandeira-espanha.png', badge: 'ES' },
    fr: { primary: 'Francês', sub: 'França', flag: '/assets/bandeira-franca.svg', badge: 'FR' }
  };

  const currentLang = langDetails[lang] || langDetails.pt;

  return (
    <header className="lumiar-header-unified" role="banner">
      <div className="lumiar-header-unified-inner">
        {/* LINHA 1: Topo */}
        <div className="lumiar-header-row-1">
          {/* Logo Lumiar */}
          <a
            href="/"
            className="lumiar-header-brand"
            onClick={e => { e.preventDefault(); onNavigateTo('/'); }}
            aria-label="Lumiar Acessibilidade Conectada - Página Inicial"
          >
            <img
              src="/logo_oficial_lumiar.png"
              alt="Lumiar - Acessibilidade Conectada"
              className="lumiar-header-logo"
            />
          </a>

          {/* Ações superiores alinhadas */}
          <div className="lumiar-header-top-actions">
            {/* Palavra Acessibilidade clicável */}
            <button
              type="button"
              className="lumiar-a11y-word-btn"
              onClick={onOpenA11yInfo}
              aria-label="Informações sobre Acessibilidade Lumiar"
            >
              Acessibilidade
            </button>

            {/* Ícones de atalhos de acessibilidade */}
            <div className="lumiar-header-a11y-tools" aria-label="Ferramentas rápidas de acessibilidade">
              {/* Ícone acessibilidade.jpg (abre menu de acessibilidade) */}
              <button
                type="button"
                className="lumiar-icon-a11y-modal-btn"
                onClick={onToggleA11y}
                title="Abrir painel de recursos de acessibilidade"
                aria-label="Abrir painel de acessibilidade"
              >
                <img src="/assets/acessibilidade.jpg" alt="Acessibilidade" />
              </button>

              {/* VLibras */}
              <button
                type="button"
                className="lumiar-icon-libras-btn"
                title="Ativar VLibras (Língua Brasileira de Sinais)"
                aria-label="Ativar VLibras"
                onClick={() => {
                  const btn = document.querySelector('[vw-access-button]') as HTMLElement;
                  if (btn) btn.click();
                }}
              >
                <img src="/assets/libras.svg" alt="Libras" />
              </button>

              {/* A+ A- A */}
              <button
                type="button"
                className="lumiar-font-shortcut-btn"
                title="Aumentar fonte"
                aria-label="Aumentar fonte"
                onClick={() => {
                  const cur = parseFloat(document.body.style.getPropertyValue('--a11y-font-scale') || '1');
                  const next = Math.min(1.5, cur + 0.1);
                  document.body.style.setProperty('--a11y-font-scale', String(next));
                }}
              >
                A+
              </button>
              <button
                type="button"
                className="lumiar-font-shortcut-btn"
                title="Diminuir fonte"
                aria-label="Diminuir fonte"
                onClick={() => {
                  const cur = parseFloat(document.body.style.getPropertyValue('--a11y-font-scale') || '1');
                  const next = Math.max(0.85, cur - 0.1);
                  document.body.style.setProperty('--a11y-font-scale', String(next));
                }}
              >
                A-
              </button>
              <button
                type="button"
                className="lumiar-font-shortcut-btn"
                title="Tamanho normal de fonte"
                aria-label="Restaurar tamanho de fonte normal"
                onClick={() => {
                  document.body.style.setProperty('--a11y-font-scale', '1');
                }}
              >
                A
              </button>

              {/* Monocromático / Saturação */}
              <button
                type="button"
                className="lumiar-contrast-shortcut-btn"
                title="Alternar monocromático (saturação/escala de cinza)"
                aria-label="Alternar monocromático"
                onClick={() => {
                  document.body.classList.toggle('a11y-grayscale');
                }}
              >
                ◐
              </button>
            </div>

            {/* Separador traço | */}
            <span className="lumiar-header-divider" aria-hidden="true" />

            {/* Redes sociais com ícones circulares proporcionais */}
            <div className="lumiar-header-socials" aria-label="Redes sociais do Lumiar">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="lumiar-social-link" aria-label="Instagram" title="Instagram">
                <img src="/assets/instagram.png" alt="Instagram" className="lumiar-social-img" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="lumiar-social-link" aria-label="YouTube" title="YouTube">
                <img src="/assets/youtube.png" alt="YouTube" className="lumiar-social-img" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="lumiar-social-link" aria-label="LinkedIn" title="LinkedIn">
                <img src="/assets/linkedin.png" alt="LinkedIn" className="lumiar-social-img" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="lumiar-social-link" aria-label="TikTok" title="TikTok">
                <img src="/assets/tiktok.png" alt="TikTok" className="lumiar-social-img" />
              </a>
              <a href="https://wa.me/" target="_blank" rel="noreferrer" className="lumiar-social-link" aria-label="WhatsApp" title="WhatsApp">
                <img src="/assets/whatsapp.png" alt="WhatsApp" className="lumiar-social-img" />
              </a>
            </div>

            {/* Separador traço | */}
            <span className="lumiar-header-divider" aria-hidden="true" />

            {/* Seletor de Idioma com Globo e padrão textual do menu */}
            <div className="lumiar-lang-trigger-group">
              <img src="/assets/icone-globo.png" alt="" className="lumiar-globe-icon" aria-hidden="true" />
              <button
                type="button"
                className="lumiar-lang-pill-btn"
                onClick={() => setLangModalOpen(true)}
                aria-haspopup="dialog"
                aria-label={`Idioma selecionado: ${currentLang.primary} ${currentLang.sub}. Clique para alterar o idioma.`}
              >
                <img src={currentLang.flag} alt="" />
                <span>{currentLang.badge}</span>
                <ChevronDown size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* LINHA 2: Menu de Navegação + ENTRAR + Solicite uma proposta */}
        <div className="lumiar-header-row-2">
          <nav aria-label="Menu de seções do projeto Lumiar">
            <ul className="lumiar-nav-links-black">
              <li><a href="#quem-somos" className="lumiar-nav-item-link">QUEM SOMOS</a></li>
              <li><a href="#produtos" className="lumiar-nav-item-link">PRODUTOS</a></li>
              <li><a href="#sustentabilidade" className="lumiar-nav-item-link">SUSTENTABILIDADE</a></li>
              <li><a href="#experiencia" className="lumiar-nav-item-link">EXPERIÊNCIA</a></li>
              <li><a href="#contato" className="lumiar-nav-item-link">CONTATO</a></li>
            </ul>
          </nav>

          <div className="lumiar-header-cta-group">
            <button
              type="button"
              className="lumiar-btn-entrar"
              onClick={onOpenLogin}
              aria-label="Entrar no sistema"
            >
              ENTRAR
            </button>
            <button
              type="button"
              className="lumiar-btn-proposta"
              onClick={onOpenProposal}
              aria-label="Solicite uma proposta e conheça os planos"
            >
              <MessageCircle size={18} />
              Solicite uma proposta
            </button>
          </div>
        </div>

        {/* LINHA 3: Opção de Busca conforme menu_geral.png */}
        <div className="lumiar-header-row-3">
          <form className="lumiar-header-search-form" onSubmit={onSearchSubmit} role="search">
            <Search className="lumiar-header-search-icon" size={24} aria-hidden="true" />
            <div className="lumiar-header-search-input-wrap">
              <input
                type="search"
                className="lumiar-header-search-input"
                placeholder="Digite palavras-chaves para iniciar a busca..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Digite palavras-chaves para iniciar a busca"
              />
            </div>
            <button type="submit" className="lumiar-header-search-btn">
              PESQUISA
            </button>
          </form>
        </div>
      </div>

      {/* Modal Lista de Idiomas (Menu_linguagem.jpeg) */}
      {langModalOpen && (
        <div className="lumiar-lang-modal-overlay" onClick={() => setLangModalOpen(false)} role="dialog" aria-modal="true" aria-label="Selecione o idioma">
          <div className="lumiar-lang-modal-card" onClick={e => e.stopPropagation()}>
            <div className="lumiar-lang-modal-bar" />
            <div className="lumiar-lang-modal-list">
              {(['pt', 'pt-PT', 'en', 'es', 'fr'] as SupportedLang[]).map(key => {
                const item = langDetails[key];
                const isSelected = lang === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className="lumiar-lang-modal-item"
                    onClick={() => {
                      setLang(key);
                      setLangModalOpen(false);
                    }}
                  >
                    <div className="lumiar-lang-modal-left">
                      <img src={item.flag} alt="" className="lumiar-lang-modal-flag" />
                      <div className="lumiar-lang-modal-text">
                        <span className="lumiar-lang-modal-primary">{item.primary}</span>
                        <span className="lumiar-lang-modal-sub">{item.sub}</span>
                      </div>
                    </div>
                    <div className={'lumiar-lang-modal-radio' + (isSelected ? ' selected' : '')}>
                      {isSelected && <span className="lumiar-lang-modal-radio-dot" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function LumiarFixedTopbar({
  onToggleA11y,
  lang,
  setLang
}: {
  onToggleA11y: () => void;
  lang: SupportedLang;
  setLang: (l: SupportedLang) => void;
}) {
  return (
    <LumiarUnifiedHeader
      onToggleA11y={onToggleA11y}
      lang={lang}
      setLang={setLang}
      searchQuery=""
      setSearchQuery={() => {}}
      onSearchSubmit={e => e.preventDefault()}
      onOpenLogin={() => {}}
      onNavigateTo={() => { window.location.href = '/'; }}
      onOpenProposal={() => { window.location.href = '/#produtos'; }}
      onOpenA11yInfo={onToggleA11y}
    />
  );
}

const salesPlans = [
  { id: 'cultural-starter', product: 'Lumiar Cultural', name: 'Starter', price: 'R$ 49/mês', description: 'O essencial para começar a organizar um espaço cultural.', featured: false },
  { id: 'cultural-pro', product: 'Lumiar Cultural', name: 'Profissional', price: 'R$ 149/mês', description: 'Acervo, acessibilidade, curadoria e indicadores para operar com escala.', featured: true },
  { id: 'guia-early-access', product: 'Lumiar Guia', name: 'Acesso antecipado', price: 'R$ 29/mês', description: 'Entre na lista de lançamento do guia digital acessível para visitantes.', featured: false },
  { id: 'turismo-pro', product: 'Lumiar Turismo', name: 'Turismo Acessível', price: 'R$ 199/mês', description: 'Guia de roteiros, audiodescrição de pontos turísticos e suporte IA.', featured: false }
];

function SalesPage({ onLogin }: { onLogin: (t: string) => void }) {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname.replace(/\/$/, '') || '/');
  const checkoutStatus = new URLSearchParams(window.location.search).get('checkout');
  const [showLogin, setShowLogin] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<typeof salesPlans[number] | null>(null);
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [a11yOpen, setA11yOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [a11yInfoModalOpen, setA11yInfoModalOpen] = useState(false);

  // Busca e Idioma Multilíngue (com detecção automática e sincronização)
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<SupportedLang>(detectInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('lumiar_lang', lang);

    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('lang') !== lang) {
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {}

    // Inserção dinâmica de tags hreflang para SEO internacional dos motores de busca (Google)
    SUPPORTED_LANGUAGES.forEach(opt => {
      let link = document.querySelector(`link[rel="alternate"][hreflang="${opt.hreflang}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = opt.hreflang;
        document.head.appendChild(link);
      }
      try {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('lang', opt.code);
        link.href = currentUrl.toString();
      } catch (e) {}
    });
  }, [lang]);

  // Listener para histórico do navegador
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.replace(/\/$/, '') || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase().trim();
    if (query.includes('cultur') || query.includes('museu')) {
      navigateTo('/cultural');
    } else if (query.includes('guia') || query.includes('mapa') || query.includes('rota')) {
      navigateTo('/guia');
    } else if (query.includes('turism') || query.includes('viagem') || query.includes('cidade')) {
      navigateTo('/turismo');
    } else {
      const el = document.getElementById('produtos');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const checkout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!checkoutPlan) return;
    setLoading(true);
    setError('');
    try {
      const response = await request('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: checkoutPlan.id, email, organization_name: organizationName })
      });
      window.location.href = response.checkout_url;
    } catch (checkoutError: any) {
      setError(checkoutError.message || 'Não foi possível iniciar o checkout.');
    } finally {
      setLoading(false);
    }
  };

  // Se o usuário solicitou tela de login
  if (showLogin) {
    return (
      <div className="lumiar-login-page-wrap">
        <Login onLogin={onLogin} onBack={() => setShowLogin(false)} />
        <AccessibilityToolbar externalOpen={a11yOpen} onToggleExternal={() => setA11yOpen(p => !p)} />
      </div>
    );
  }

  // Se estiver nas rotas filhas de produto: /cultural, /guia ou /turismo
  if (currentPath === '/cultural' || currentPath === '/guia' || currentPath === '/turismo') {
    return (
      <ProductSalesPage
        path={currentPath}
        onNavigateHome={() => navigateTo('/')}
        onNavigateTo={navigateTo}
        onLogin={() => setShowLogin(true)}
        onCheckout={setCheckoutPlan}
        checkoutPlan={checkoutPlan}
        email={email}
        setEmail={setEmail}
        organizationName={organizationName}
        setOrganizationName={setOrganizationName}
        loading={loading}
        error={error}
        checkout={checkout}
        a11yOpen={a11yOpen}
        onToggleA11y={() => setA11yOpen(p => !p)}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  return (
    <div className="lumiar-portal">
      {/* Skip Link para leitores de tela */}
      <a className="lumiar-skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal (Alt+1)
      </a>

      {/* ==============================================================================
          CABEÇALHO UNIFICADO (menu_geral.png - WCAG 2.2 AA & FUNDO BRANCO)
          ============================================================================== */}
      <LumiarUnifiedHeader
        onToggleA11y={() => setA11yOpen(prev => !prev)}
        lang={lang}
        setLang={setLang}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onOpenLogin={() => setShowLogin(true)}
        onNavigateTo={navigateTo}
        onOpenProposal={() => setProposalModalOpen(true)}
        onOpenA11yInfo={() => setA11yInfoModalOpen(true)}
      />

      {/* ==============================================================================
          CONTEÚDO PRINCIPAL
          ============================================================================== */}
      <main id="conteudo-principal">
        {checkoutStatus && (
          <div className={'checkout-status ' + checkoutStatus} role="status">
            {checkoutStatus === 'success'
              ? 'Pagamento iniciado com sucesso. Em breve você receberá os próximos passos por e-mail.'
              : 'O pagamento foi cancelado. Você pode retomar quando estiver pronto.'}
          </div>
        )}

        {/* Modal de Solicitação de Proposta / Planos */}
        {proposalModalOpen && (
          <div className="lumiar-proposal-modal-overlay" onClick={() => setProposalModalOpen(false)} role="dialog" aria-modal="true" aria-labelledby="proposta-title">
            <div className="lumiar-proposal-modal-card" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="lumiar-proposal-close-btn"
                onClick={() => setProposalModalOpen(false)}
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>

              <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Planos & Propostas
              </span>
              <h2 id="proposta-title" style={{ margin: '8px 0 12px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                Solicite uma proposta para sua instituição
              </h2>
              <p style={{ color: '#64748b', fontSize: '14.5px', lineHeight: 1.6, margin: '0 0 20px' }}>
                Soluções completas para museus, memoriais e cidades turísticas com acessibilidade nativa e inteligência artificial. Conheça nossos planos:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {salesPlans.map(plan => (
                  <div
                    key={plan.id}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setCheckoutPlan(plan);
                      setProposalModalOpen(false);
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{plan.product}</div>
                    <div style={{ color: '#0284c7', fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>{plan.price}</div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '6px' }}>{plan.description}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setProposalModalOpen(false);
                    const el = document.getElementById('produtos');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="lumiar-btn-proposta"
                  style={{ padding: '8px 18px', fontSize: '14px' }}
                >
                  Ver todos os produtos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Informações sobre Acessibilidade */}
        {a11yInfoModalOpen && (
          <div className="lumiar-info-modal-overlay" onClick={() => setA11yInfoModalOpen(false)} role="dialog" aria-modal="true" aria-labelledby="a11y-info-title">
            <div className="lumiar-proposal-modal-card" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="lumiar-proposal-close-btn"
                onClick={() => setA11yInfoModalOpen(false)}
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>

              <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Diretrizes de Acessibilidade
              </span>
              <h2 id="a11y-info-title" style={{ margin: '8px 0 12px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                Compromisso Lumiar com a Inclusão Digital
              </h2>
              <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: 1.6, margin: '0 0 16px' }}>
                A plataforma Lumiar foi projetada desde a primeira linha de código para atender integralmente às diretrizes <strong>WCAG 2.2 Nível AA</strong> e aos pilares da <strong>Lei Brasileira de Inclusão (LBI nº 13.146/2015)</strong>.
              </p>

              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '13.5px', lineHeight: 1.8 }}>
                  <li><strong>VLibras integrado:</strong> Tradução em tempo real para a Língua Brasileira de Sinais.</li>
                  <li><strong>Ajustes de texto:</strong> Atalhos diretos para aumento (A+), redução (A-) e tamanho padrão (A).</li>
                  <li><strong>Modo Monocromático:</strong> Alternância de saturação e contraste para maior conforto visual.</li>
                  <li><strong>Navegação sem barreiras:</strong> Suporte total a leitores de tela e navegação por teclado.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setA11yInfoModalOpen(false);
                    setA11yOpen(true);
                  }}
                  className="lumiar-btn-entrar"
                  style={{ padding: '8px 18px', fontSize: '13.5px' }}
                >
                  Abrir painel de ferramentas
                </button>
                <button
                  type="button"
                  onClick={() => setA11yInfoModalOpen(false)}
                  className="lumiar-btn-proposta"
                  style={{ padding: '8px 18px', fontSize: '13.5px' }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================================
            3. SEÇÃO QUEM SOMOS (CSS Grid Stacking & Glassmorphism - WCAG 2.2 AA)
            ============================================================================== */}
        <QuemSomosSection />

        {/* ==============================================================================
            4. SEÇÃO PRODUTOS LUMIAR (CARDS COLORIDOS)
            ============================================================================== */}
        <section className="lumiar-section-products" id="produtos">
          <div className="lumiar-container">
            <div className="lumiar-section-header">
              <h2>Tecnologia que ganha sentido na experiência.</h2>
              <p>Conheça cada solução e acesse uma demonstração para ver como ela funciona.</p>
            </div>

            <div className="lumiar-products-grid">
              {/* Card 1: Lumiar Cultural */}
              <a
                href="/cultural"
                className="lumiar-product-card lumiar-card-cultural"
                onClick={e => { e.preventDefault(); navigateTo('/cultural'); }}
              >
                <div>
                  <div className="lumiar-product-icon-wrap">
                    <div className="lumiar-product-icon">
                      <Landmark size={28} />
                    </div>
                    <span className="lumiar-card-number">01</span>
                  </div>
                  <h3 className="lumiar-product-title">Lumiar Cultural</h3>
                  <p className="lumiar-product-subtitle">
                    Gestão de acervos, audiodescrição e curadoria com inteligência artificial para museus e memoriais.
                  </p>
                </div>
                <div className="lumiar-product-action">
                  <span>Conhecer produto</span> <ArrowRightLeft size={16} />
                </div>
              </a>

              {/* Card 2: Lumiar Guia */}
              <a
                href="/guia"
                className="lumiar-product-card lumiar-card-guia"
                onClick={e => { e.preventDefault(); navigateTo('/guia'); }}
              >
                <div>
                  <div className="lumiar-product-icon-wrap">
                    <div className="lumiar-product-icon">
                      <MapPinned size={28} />
                    </div>
                    <span className="lumiar-card-number">02</span>
                  </div>
                  <h3 className="lumiar-product-title">Lumiar Guia</h3>
                  <p className="lumiar-product-subtitle">
                    Orientação acessível, rotas inteligentes e suporte interativo em espaços públicos e privados.
                  </p>
                </div>
                <div className="lumiar-product-action">
                  <span>Conhecer a proposta</span> <ArrowRightLeft size={16} />
                </div>
              </a>

              {/* Card 3: Lumiar Turismo */}
              <a
                href="/turismo"
                className="lumiar-product-card lumiar-card-turismo"
                onClick={e => { e.preventDefault(); navigateTo('/turismo'); }}
              >
                <div>
                  <div className="lumiar-product-icon-wrap">
                    <div className="lumiar-product-icon">
                      <Users size={28} />
                    </div>
                    <span className="lumiar-card-number">03</span>
                  </div>
                  <h3 className="lumiar-product-title">Lumiar Turismo</h3>
                  <p className="lumiar-product-subtitle">
                    IA Generativa conectando pessoas a destinos turísticos e atrações com acessibilidade plena.
                  </p>
                </div>
                <div className="lumiar-product-action">
                  <span>Explorar turismo</span> <ArrowRightLeft size={16} />
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            5. SEÇÃO OBJETIVOS DE DESENVOLVIMENTO SUSTENTÁVEL (ODS & ESG)
            ============================================================================== */}
        <LumiarOdsSection />

        {/* ==============================================================================
            6. SEÇÃO EXPERIÊNCIA & DIREITO À ACESSIBILIDADE (GRID STACKING WCAG 2.2 AA)
            ============================================================================== */}
        <LumiarExperienceCards />

        {/* ==============================================================================
            7. SEÇÃO VAMOS CONVERSAR (CALL TO ACTION)
            ============================================================================== */}
        <section className="lumiar-section-cta" id="contato">
          <div className="lumiar-cta-box">
            <span className="lumiar-eyebrow">VAMOS CONVERSAR</span>
            <h2>Quer levar o Lumiar para o seu espaço?</h2>
            <p>Conheça as demonstrações ou fale com a equipe para descobrir qual solução faz sentido para sua instituição.</p>
            <div className="lumiar-cta-actions">
              <a
                href="/cultural"
                className="lumiar-btn-cta-primary"
                onClick={e => { e.preventDefault(); navigateTo('/cultural'); }}
              >
                Acessar demonstração <ArrowRightLeft size={17} />
              </a>
              <a href="mailto:contato@lumiar.dev" className="lumiar-cta-email">
                contato@lumiar.dev
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ==============================================================================
          8. RODAPÉ INSTITUCIONAL (FOOTER)
          ============================================================================== */}
      <footer className="lumiar-footer">
        <div className="lumiar-footer-inner">
          <div className="lumiar-footer-brand">
            <img src="/logo_oficial_lumiar.png" alt="Lumiar" className="lumiar-footer-logo" />
            <span className="lumiar-footer-tagline">Grupo Lumiar - Acessibilidade Conectada</span>
          </div>

          <nav style={{ display: 'flex', gap: '20px' }} aria-label="Navegação secundária do rodapé">
            <a href="/cultural" onClick={e => { e.preventDefault(); navigateTo('/cultural'); }} style={{ color: '#cbd5e1', textDecoration: 'none' }}>Lumiar Cultural</a>
            <a href="/guia" onClick={e => { e.preventDefault(); navigateTo('/guia'); }} style={{ color: '#cbd5e1', textDecoration: 'none' }}>Lumiar Guia</a>
            <a href="/turismo" onClick={e => { e.preventDefault(); navigateTo('/turismo'); }} style={{ color: '#cbd5e1', textDecoration: 'none' }}>Lumiar Turismo</a>
            <a href="mailto:contato@lumiar.dev" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Contato</a>
          </nav>
        </div>

        <div className="lumiar-footer-copy">
          Copyright © 2026 Grupo Lumiar - Todos os direitos reservados. / All rights reserved.
        </div>
      </footer>

      {/* Modal de Checkout */}
      {checkoutPlan && (
        <div className="sales-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <form className="checkout-card" onSubmit={checkout}>
            <button type="button" className="checkout-close" onClick={() => setCheckoutPlan(null)} aria-label="Fechar">×</button>
            <span className="sales-kicker">CHECKOUT STRIPE</span>
            <h2 id="checkout-title">Assinar {checkoutPlan.name}</h2>
            <p>{checkoutPlan.product} · {checkoutPlan.price}</p>
            <label>E-mail institucional
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="voce@instituicao.org" />
            </label>
            <label>Nome da instituição
              <input value={organizationName} onChange={event => setOrganizationName(event.target.value)} required placeholder="Museu, espaço cultural ou destino" />
            </label>
            {error && <div className="checkout-error" role="alert">{error}</div>}
            <button className="sales-primary checkout-submit" disabled={loading}>
              {loading ? 'Abrindo checkout...' : 'Continuar para pagamento seguro'}
            </button>
            <small>Você será redirecionado para o Stripe Checkout oficial. Os dados do cartão não passam pelo servidor Lumiar.</small>
          </form>
        </div>
      )}

      {/* Painel Flutuante de Acessibilidade */}
      <AccessibilityToolbar externalOpen={a11yOpen} onToggleExternal={() => setA11yOpen(p => !p)} />
    </div>
  );
}

function ProductSalesPage({
  path,
  onNavigateHome,
  onNavigateTo,
  onLogin,
  onCheckout,
  checkoutPlan,
  email,
  setEmail,
  organizationName,
  setOrganizationName,
  loading,
  error,
  checkout,
  a11yOpen,
  onToggleA11y,
  lang,
  setLang
}: any) {
  const isCultural = path === '/cultural';
  const isGuia = path === '/guia';
  const isTurismo = path === '/turismo';

  return (
    <div className="lumiar-portal">
      {/* ==============================================================================
          1. BANNER SUPERIOR FIXADO NA ROLAGEM (BANNER_FIXO.png - COR #3F4E55)
          ============================================================================== */}
      <LumiarFixedTopbar
        onToggleA11y={onToggleA11y}
        lang={lang}
        setLang={setLang}
      />

      <main className="lumiar-product-page-container">
        {/* Breadcrumb e botão Voltar */}
        <div className="lumiar-breadcrumb-bar">
          <nav aria-label="Trilha de navegação (Breadcrumbs)" className="lumiar-breadcrumb-nav">
            <a href="/" onClick={e => { e.preventDefault(); onNavigateHome(); }} className="lumiar-breadcrumb-link">
              Página Inicial
            </a>
            {' / '}
            <span>
              {isCultural ? 'Página Lumiar Cultural' : isGuia ? 'Lumiar Guia' : 'Lumiar Turismo'}
            </span>
          </nav>

          <button type="button" className="lumiar-btn-back" onClick={onNavigateHome}>
            <ChevronLeft size={16} /> Voltar
          </button>
        </div>

        {/* Título Principal */}
        <h1 className="lumiar-page-hero-title">
          {isCultural ? 'Lumiar Cultural' : isGuia ? 'Lumiar Guia' : 'LUMIAR TURISMO'}
        </h1>

        {/* Card Detalhado do Produto */}
        {isCultural && (
          <article className="lumiar-detail-card">
            <div className="lumiar-detail-media-wrap">
              <span className="lumiar-detail-badge">CULTURA E ACESSIBILIDADE</span>
              <img
                src="/assets/modelos/museu-do-ipiranga.png"
                alt="Fachada histórica do Museu do Ipiranga"
                className="lumiar-detail-img"
              />
            </div>

            <div className="lumiar-detail-content">
              <span className="lumiar-detail-index">01 / PARA MUSEUS E ESPAÇOS CULTURAIS</span>
              <h2 className="lumiar-detail-title">Lumiar Cultural</h2>
              <p className="lumiar-detail-desc">
                Uma plataforma para organizar acervos e oferecer ao visitante uma experiência acessível pelo celular, com audiodescrição e conteúdo conectado às obras.
              </p>

              <ul className="lumiar-checklist">
                <li className="lumiar-check-item">
                  <CheckCircle2 size={19} className="lumiar-check-icon" />
                  <span>Acervo e conteúdo em um só lugar</span>
                </li>
                <li className="lumiar-check-item">
                  <CheckCircle2 size={19} className="lumiar-check-icon" />
                  <span>Acesso às obras por QR Code</span>
                </li>
                <li className="lumiar-check-item">
                  <CheckCircle2 size={19} className="lumiar-check-icon" />
                  <span>Audiodescrição e interação com a Lumi</span>
                </li>
              </ul>

              <button
                type="button"
                className="lumiar-btn-product-cta"
                onClick={() => onCheckout(salesPlans[1])}
              >
                Ver produto e demonstração <ArrowRightLeft size={16} />
              </button>
            </div>
          </article>
        )}

        {isGuia && (
          <article className="lumiar-detail-card">
            <div className="lumiar-detail-content">
              <span className="lumiar-detail-index">02 / ORIENTAÇÃO ACESSÍVEL</span>
              <h2 className="lumiar-detail-title">Lumiar Guia</h2>
              <p className="lumiar-detail-desc">
                Uma proposta de guia digital para reunir informações úteis e apoiar a experiência das pessoas em diferentes espaços.
              </p>

              <ul className="lumiar-checklist">
                <li className="lumiar-check-item">
                  <CheckCircle2 size={19} className="lumiar-check-icon" />
                  <span>Informações acessíveis sobre os locais</span>
                </li>
                <li className="lumiar-check-item">
                  <CheckCircle2 size={19} className="lumiar-check-icon" />
                  <span>Conteúdo pensado para acompanhar a jornada</span>
                </li>
                <li className="lumiar-check-item">
                  <Clock size={19} style={{ color: '#d97706', flexShrink: 0 }} />
                  <span>Produto em desenvolvimento</span>
                </li>
              </ul>

              <button
                type="button"
                className="lumiar-btn-product-cta"
                style={{ backgroundColor: '#b45309', borderColor: '#b45309' }}
                onClick={() => onCheckout(salesPlans[2])}
              >
                Conhecer a proposta <ArrowRightLeft size={16} />
              </button>
            </div>

            <div className="lumiar-detail-media-wrap">
              <img
                src="/assets/guia-mapa-acessivel.png"
                alt="Ilustração do mapa de orientação acessível com pontos de interesse"
                className="lumiar-detail-img"
              />
            </div>
          </article>
        )}

        {isTurismo && (
          <article className="lumiar-detail-card">
            <div className="lumiar-detail-content">
              <p className="lumiar-detail-desc" style={{ fontSize: '17px', color: '#1e293b' }}>
                Uma solução inteligente que utiliza a Inteligência Artificial Generativa para conectar pessoas a destinos turísticos, pontos de interesse e informações sobre acessibilidade, promovendo experiências de viagem mais inclusivas, autônomas e seguras.
              </p>

              <ul className="lumiar-checklist">
                <li className="lumiar-check-item">
                  <CheckCircle2 size={19} className="lumiar-check-icon" />
                  <span>Informações turísticas e recursos de acessibilidade em um só lugar</span>
                </li>
                <li className="lumiar-check-item">
                  <CheckCircle2 size={19} className="lumiar-check-icon" />
                  <span>Orientação para conhecer destinos, atrações e espaços turísticos</span>
                </li>
                <li className="lumiar-check-item">
                  <CheckCircle2 size={19} className="lumiar-check-icon" />
                  <span>Assistente virtual Lumi com suporte acessível e informações inclusivas</span>
                </li>
              </ul>

              <button
                type="button"
                className="lumiar-btn-product-cta"
                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                onClick={() => onCheckout(salesPlans[3] || salesPlans[1])}
              >
                Ver produto e demonstração <ArrowRightLeft size={16} />
              </button>
            </div>

            <div className="lumiar-detail-media-wrap">
              <img
                src="/assets/turismo-acessivel-cadeirante.png"
                alt="Turista em cadeira de rodas na rampa acessível em frente ao Museu de Arte e Cultura"
                className="lumiar-detail-img"
              />
            </div>
          </article>
        )}
      </main>

      {/* Rodapé da Página Secundária */}
      <footer className="lumiar-footer">
        <div className="lumiar-footer-inner">
          <div className="lumiar-footer-brand">
            <img src="/logo_oficial_lumiar.png" alt="Lumiar" className="lumiar-footer-logo" />
            <span className="lumiar-footer-tagline">Grupo Lumiar - Acessibilidade Conectada</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="/" onClick={e => { e.preventDefault(); onNavigateHome(); }} style={{ color: '#cbd5e1', textDecoration: 'none' }}>Voltar ao Início</a>
            <a href="mailto:contato@lumiar.dev" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Contato</a>
          </div>
        </div>
        <div className="lumiar-footer-copy">
          Copyright © 2026 Grupo Lumiar - Todos os direitos reservados. / All rights reserved.
        </div>
      </footer>

      {/* Modal de Checkout */}
      {checkoutPlan && (
        <div className="sales-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <form className="checkout-card" onSubmit={checkout}>
            <button type="button" className="checkout-close" onClick={() => onCheckout(null)} aria-label="Fechar">×</button>
            <span className="sales-kicker">CHECKOUT STRIPE</span>
            <h2 id="checkout-title">Assinar {checkoutPlan.name}</h2>
            <p>{checkoutPlan.product} · {checkoutPlan.price}</p>
            <label>E-mail de trabalho
              <input type="email" value={email} onChange={(event: any) => setEmail(event.target.value)} required placeholder="voce@instituicao.org" />
            </label>
            <label>Nome da instituição
              <input value={organizationName} onChange={(event: any) => setOrganizationName(event.target.value)} required placeholder="Museu ou espaço cultural" />
            </label>
            {error && <div className="checkout-error" role="alert">{error}</div>}
            <button className="sales-primary checkout-submit" disabled={loading}>
              {loading ? 'Abrindo checkout...' : 'Continuar para pagamento seguro'}
            </button>
          </form>
        </div>
      )}

      {/* Painel de acessibilidade */}
      <AccessibilityToolbar externalOpen={a11yOpen} onToggleExternal={onToggleA11y} />
    </div>
  );
}

const showcaseImageSlots = [
  { key: 'hero', title: 'Imagem principal', description: 'Imagem que apresenta a plataforma Lumiar na abertura do site.' },
  { key: 'cultural', title: 'Lumiar Cultural', description: 'Imagem de museu, obra ou tela da experiência Cultural.' },
  { key: 'guia', title: 'Lumiar Guia', description: 'Imagem de orientação, mapa ou tela do Guia.' }
];

function ShowcaseImagesAdmin({ images, token, onSaved }: { images: Record<string, { url: string; alt: string }>; token: string; onSaved: (key: string, image: { url: string; alt: string }) => void }) {
  const [altTexts, setAltTexts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState('');
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setAltTexts(Object.fromEntries(showcaseImageSlots.map(slot => [slot.key, images[slot.key]?.alt || ''])));
  }, [images]);

  const saveImage = async (event: React.FormEvent<HTMLFormElement>, key: string) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem('image-file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setErrors(current => ({ ...current, [key]: 'Selecione uma imagem JPEG, PNG ou WebP.' }));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrors(current => ({ ...current, [key]: 'A imagem deve ter no máximo 8 MB.' }));
      return;
    }
    const alt = (altTexts[key] || '').trim();
    if (alt.length < 5) {
      setErrors(current => ({ ...current, [key]: 'Descreva a imagem para pessoas que não conseguem vê-la (mínimo de 5 caracteres).' }));
      return;
    }

    setSavingKey(key);
    setFeedback(current => ({ ...current, [key]: '' }));
    setErrors(current => ({ ...current, [key]: '' }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', alt);
    try {
      const saved = await request(`/showcase-images/${key}`, { method: 'POST', body: formData }, token);
      onSaved(key, saved);
      setFeedback(current => ({ ...current, [key]: 'Imagem publicada na página inicial.' }));
      fileInput.value = '';
    } catch (error: any) {
      setErrors(current => ({ ...current, [key]: error.message || 'Não foi possível publicar a imagem.' }));
    } finally {
      setSavingKey('');
    }
  };

  return (
    <div className="showcase-admin">
      <div className="panel">
        <h2>Gerenciar imagens da página inicial</h2>
        <p>Envie imagens para a vitrine pública. Cada imagem exige um texto alternativo para leitores de tela. Formatos aceitos: JPEG, PNG e WebP; até 8 MB.</p>
        <p><strong>Dica de acessibilidade:</strong> descreva o que a imagem comunica, sem começar por “imagem de”. Para imagens decorativas, explique o contexto visual relevante da seção.</p>
      </div>
      <div className="showcase-admin-grid">
        {showcaseImageSlots.map(slot => (
          <section className="panel showcase-admin-card" key={slot.key} aria-labelledby={`showcase-${slot.key}-heading`}>
            <h3 id={`showcase-${slot.key}-heading`}>{slot.title}</h3>
            <p>{slot.description}</p>
            <img
              className="showcase-admin-preview"
              src={images[slot.key]?.url
                ? `${API}${images[slot.key].url}`
                : `/showcase-demo-${slot.key === 'hero' ? 'hero' : slot.key}.svg`}
              alt={images[slot.key]?.url ? images[slot.key].alt || '' : `Ilustração conceitual provisória: ${slot.description}`}
            />
            {!images[slot.key]?.url && <p className="showcase-admin-demo-note">Ilustração conceitual provisória. Envie uma imagem para substituí-la no site.</p>}
            <form onSubmit={event => saveImage(event, slot.key)} noValidate>
              <label htmlFor={`showcase-${slot.key}-alt`}>Texto alternativo</label>
              <textarea
                id={`showcase-${slot.key}-alt`}
                value={altTexts[slot.key] || ''}
                onChange={event => setAltTexts(current => ({ ...current, [slot.key]: event.target.value }))}
                maxLength={300}
                required
                aria-describedby={`showcase-${slot.key}-hint`}
              />
              <small id={`showcase-${slot.key}-hint`}>Explique a informação importante que a imagem transmite. Até 300 caracteres.</small>
              <label htmlFor={`showcase-${slot.key}-file`}>Arquivo da imagem</label>
              <input id={`showcase-${slot.key}-file`} name="image-file" type="file" accept="image/jpeg,image/png,image/webp" required />
              {errors[slot.key] && <p className="showcase-admin-error" role="alert">{errors[slot.key]}</p>}
              {feedback[slot.key] && <p className="showcase-admin-success" role="status" aria-live="polite">{feedback[slot.key]}</p>}
              <button className="primary compact" type="submit" disabled={savingKey === slot.key}>
                <UploadCloud size={17} /> {savingKey === slot.key ? 'Publicando...' : 'Publicar imagem'}
              </button>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('lumiar_token') || '');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const loadVersion = useRef(0);

  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSystemAdmin = currentUser?.is_system_admin === true;

  const load = async () => {
    if (!token) return;
    const requestVersion = ++loadVersion.current;
    setLoading(true);
    setGlobalError(null);
    try {
      // Carrega dados do usuário autenticado se ainda não carregados
      let user = currentUser;
      if (!user) {
        user = await request('/auth/me', {}, token);
        setCurrentUser(user);
      }

      const userIsAdmin = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'superadmin';

      // Se não for admin e tentar acessar 'organizations', redireciona para o dashboard
      if (page === 'organizations' && !user?.is_system_admin) {
        setPage('dashboard');
        return;
      }
      if (page === 'showcase-images' && !user?.is_system_admin) {
        setPage('dashboard');
        return;
      }

      if (page === 'dashboard') {
        const d = await request('/dashboard', {}, token);
        const spaces = await request('/cultural/spaces', {}, token);
        if (requestVersion !== loadVersion.current) return;
        setData({ ...d, spaces });
      } else if (page === 'cultural') {
        const items = await request('/cultural/items', {}, token);
        const stats = await request('/cultural/stats', {}, token);
        const spaces = await request('/cultural/spaces', {}, token);
        if (requestVersion !== loadVersion.current) return;
        setData({ items, stats, spaces });
      } else if (page === 'spaces') {
        const spaces = await request('/cultural/spaces', {}, token);
        if (requestVersion !== loadVersion.current) return;
        setData(spaces);
      } else if (page === 'organizations') {
        const orgs = await request('/organizations', {}, token);
        if (requestVersion !== loadVersion.current) return;
        setData(orgs);
      } else if (page === 'users') {
        const users = await request('/users', {}, token);
        if (requestVersion !== loadVersion.current) return;
        setData(users);
      } else if (page === 'security') {
        const org = await request('/organization', {}, token);
        const audit = await request('/audit', {}, token);
        if (requestVersion !== loadVersion.current) return;
        setData({ org, audit });
      } else if (page === 'visitor') {
        const items = await request('/cultural/items', {}, token);
        if (requestVersion !== loadVersion.current) return;
        setData({ items });
      } else if (page === 'showcase-images') {
        const images = await request('/showcase-images', {}, token);
        if (requestVersion !== loadVersion.current) return;
        setData(images);
      }
    } catch (e: any) {
      console.error('Erro ao carregar dados:', e);
      if (e?.status === 401) {
        // Token estritamente expirado ou inválido
        localStorage.removeItem('lumiar_token');
        setCurrentUser(null);
        setToken('');
      } else {
        setGlobalError(e.message || 'Erro de conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, token]);

  if (!token) return <SalesPage onLogin={setToken} />;

  // O menu 'Organizações' só aparece para administradores do sistema (owner, admin, superadmin)
  // O menu 'Organizações (Museus)' só aparece para administradores do sistema (is_system_admin)
  const nav: any = [
    ['dashboard', 'Visão Geral', LayoutDashboard],
    ['cultural', 'Acervo & Obras', Landmark],
    ['spaces', 'Espaços & Galerias', MapPinned],
    ...(isSystemAdmin ? [['organizations', 'Organizações (Museus)', Building2]] : []),
    ...(isSystemAdmin ? [['showcase-images', 'Imagens da Página Inicial', ImageIcon]] : []),
    ['users', 'Curadores & Equipe', Users],
    ['visitor', 'Simulador do Visitante', MessageSquare],
    ['security', 'Segurança & LGPD', ShieldCheck]
  ];

  const logout = () => {
    localStorage.removeItem('lumiar_token');
    setCurrentUser(null);
    setToken('');
  };

  const currentOrgName = data?.organization || (Array.isArray(data) ? data.find((o: any) => o.is_current)?.name : null) || 'Museu Ativo';

  return (
    <>
      <div className="shell">
      <aside>
        <div className="brand">
          <img src="/lumiar-logo.png" alt="Lumiar Cultural" />
        </div>
        <div className="org">
          MUSEU / INSTITUIÇÃO<br />
          <b>{currentOrgName}</b>
          {currentUser && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #dbe3e5', fontSize: '11px', color: '#556' }}>
              <div style={{ fontWeight: 600, color: '#1f2e35' }}>{currentUser.name}</div>
              <span className={'badge ' + (isSystemAdmin ? 'active' : 'trial')} style={{ padding: '2px 8px', fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>
                {isSystemAdmin ? 'Administrador do Sistema' : currentUser.role === 'curator' ? 'Curador Cultural' : 'Gestor do Museu'}
              </span>
            </div>
          )}
        </div>
        {nav.map(([k, n, Icon]: any) => (
          <button
            key={k}
            className={'nav ' + (page === k ? 'selected' : '')}
            onClick={() => setPage(k)}
          >
            <Icon size={19} />
            {n}
          </button>
        ))}
        <button className="logout" onClick={logout}><LogOut size={18} />Sair</button>
      </aside>

      <main>
        <header>
          <div>
            <span className="eyebrow">LUMIAR CULTURAL · PLATAFORMA DE ACESSIBILIDADE</span>
            <h1>{nav.find((x: any) => x[0] === page)?.[1] || 'Visão Geral'}</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {page === 'cultural' && (
              <>
                <button className="primary compact" style={{ background: '#3b5560' }} onClick={() => setModal('new-space')}>
                  <Plus size={18} /> Novo Espaço
                </button>
                <button className="primary compact" onClick={() => setModal('new-item')}>
                  <Plus size={18} /> Nova Obra (com Foto)
                </button>
              </>
            )}
            {page === 'spaces' && (
              <button className="primary compact" onClick={() => setModal('new-space')}>
                <Plus size={18} /> Novo Espaço ou Galeria
              </button>
            )}
            {page === 'organizations' && (
              <button className="primary compact" onClick={() => setModal('new-org')}>
                <Plus size={18} /> Nova Organização
              </button>
            )}
            {page === 'users' && (
              <button className="primary compact" onClick={() => setModal('new-user')}>
                <UserPlus size={18} /> Adicionar Curador
              </button>
            )}
          </div>
        </header>

        {globalError && (
          <div style={{ background: '#fdf0f0', border: '1px solid #f2b8b8', padding: '12px 18px', borderRadius: '12px', color: '#9a2424', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><b>Erro:</b> {globalError}</span>
            <button onClick={load} className="primary compact" style={{ background: '#9a2424', fontSize: '12px', padding: '6px 12px' }}>
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        )}

        {loading ? (
          <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={18} className="spin" /> Carregando informações do Lumiar Cultural...
          </div>
        ) : (
          <Content
            page={page}
            data={data}
            token={token}
            onReload={load}
            onImageSaved={(key: string, image: { url: string; alt: string }) => setData((current: any) => ({ ...current, [key]: image }))}
            onNavigate={(p: string) => setPage(p)}
            onOpenModal={(type: string, item: any) => {
              setSelectedItem(item);
              setModal(type);
            }}
          />
        )}
      </main>

      {/* Modais de Ação */}
      {modal === 'new-item' && (
        <ModalNewItem
          spaces={data?.spaces || []}
          token={token}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
        />
      )}
      {modal === 'new-space' && (
        <ModalNewSpace
          token={token}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
        />
      )}
      {modal === 'new-org' && (
        <ModalNewOrg
          token={token}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
        />
      )}
      {modal === 'edit-org' && selectedItem && (
        <ModalEditOrg
          org={selectedItem}
          token={token}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
        />
      )}
      {modal === 'new-user' && (
        <ModalNewUser
          token={token}
          systemAdmin={isSystemAdmin}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
        />
      )}
      {modal === 'qr' && selectedItem && (
        <ModalQrCode
          item={selectedItem}
          token={token}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'review' && selectedItem && (
        <ModalReview
          item={selectedItem}
          token={token}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
        />
      )}
      </div>
      <AccessibilityToolbar />
    </>
  );
}

function Content({ page, data, token, onReload, onImageSaved, onNavigate, onOpenModal }: any) {
  // 1. DASHBOARD
  if (page === 'dashboard') {
    return (
      <>
        <section className="hero">
          <div>
            <h2>{data?.organization || 'Museu Ativo'}</h2>
            <p>
              Gestão inteligente de acessibilidade sensorial para museus e espaços culturais.
              Geração de audiodescrição por visão computacional com Gemini 2.5 Flash, placas QR Code e simulação acessível.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                className="primary compact"
                style={{ background: '#fff', color: '#25748b' }}
                onClick={() => onOpenModal('new-item', null)}
              >
                <Plus size={16} /> Cadastrar Obra com Foto
              </button>
              <button
                className="primary compact"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
                onClick={() => onNavigate('visitor')}
              >
                <MessageSquare size={16} /> Abrir Simulador do Visitante
              </button>
            </div>
          </div>
          <span className="plan">Plano {data?.plan?.toUpperCase() || 'STARTER'}</span>
        </section>

        <div className="stats">
          <Stat label="Obras no Acervo" value={data?.total_items ?? 0} icon={Landmark} />
          <Stat label="Audiodescrições Aprovadas" value={data?.reviewed_items ?? 0} icon={CheckCircle2} />
          <Stat label="Espaços / Galerias" value={data?.spaces?.length ?? 0} icon={MapPinned} />
          <Stat label="Total de Scans QR" value={data?.total_scans ?? 0} icon={QrCode} />
        </div>

        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Espaços Expositivos Cadastrados</h3>
            <button className="primary compact" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => onNavigate('spaces')}>
              Ver todos os espaços
            </button>
          </div>
          {data?.spaces?.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {data.spaces.slice(0, 4).map((s: any) => (
                <div key={s.id} style={{ background: '#f6f9fa', padding: '14px', borderRadius: '12px', border: '1px solid #e2eaec' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#233238' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: '#68777d', margin: '4px 0 8px' }}>
                    {s.description || 'Sem descrição cadastrada'}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#25748b' }}>
                    {s.items_count} obra{s.items_count !== 1 ? 's' : ''} alocada{s.items_count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#778', margin: 0 }}>
              Nenhum espaço cadastrado. Crie um espaço ou galeria para organizar as obras do seu museu.
            </p>
          )}
        </div>
      </>
    );
  }

  // 2. ACERVO & OBRAS
  if (page === 'cultural') {
    const [searchTerm, setSearchTerm] = useState('');
    const [spaceFilter, setSpaceFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const speakDescription = (text: string) => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'pt-BR';
      utter.rate = 1.0;
      window.speechSynthesis.speak(utter);
    };

    const deleteItem = async (item: any) => {
      if (!confirm(`Deseja realmente remover a obra "${item.title}" (${item.code}) do acervo?`)) return;
      try {
        await request(`/cultural/items/${item.id}`, { method: 'DELETE' }, token);
        onReload();
      } catch (e: any) {
        alert(e.message);
      }
    };

    const filteredItems = (data?.items || []).filter((it: any) => {
      const matchSearch = it.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          it.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (it.author && it.author.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSpace = spaceFilter === 'all' || String(it.space_id) === spaceFilter;
      const matchStatus = statusFilter === 'all' ||
                          (statusFilter === 'reviewed' && it.is_reviewed) ||
                          (statusFilter === 'pending' && !it.is_reviewed);
      return matchSearch && matchSpace && matchStatus;
    });

    return (
      <>
        <div className="stats">
          <Stat label="Total de Obras" value={data?.stats?.total_items || 0} icon={Landmark} />
          <Stat label="Audiodescrições Aprovadas" value={data?.stats?.reviewed_items || 0} icon={CheckCircle2} />
          <Stat label="Pendentes de Curadoria" value={data?.stats?.pending_review || 0} icon={Clock} />
          <Stat label="Total de Scans QR" value={data?.stats?.total_scans || 0} icon={QrCode} />
        </div>

        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Acervo Cultural & Audiodescrição eMAG 3.0</h2>
              <p style={{ margin: '4px 0 0', color: '#68777d', fontSize: '13px' }}>
                Obras com fotos, audiodescrição por visão computacional do Gemini 2.5 Flash e homologação pelo curador.
              </p>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#889' }} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, título ou autor..."
                style={{ paddingLeft: '36px', width: '100%', margin: 0 }}
              />
            </div>
            <select
              value={spaceFilter}
              onChange={e => setSpaceFilter(e.target.value)}
              style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #d8e1e3', fontSize: '13px' }}
            >
              <option value="all">Todos os Espaços</option>
              {data?.spaces?.map((s: any) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #d8e1e3', fontSize: '13px' }}
            >
              <option value="all">Todos os Status</option>
              <option value="reviewed">Aprovados (eMAG 3.0)</option>
              <option value="pending">Pendentes de Revisão</option>
            </select>
          </div>

          <div className="table-wrap" style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Código</th>
                  <th>Título da Obra</th>
                  <th>Espaço / Galeria</th>
                  <th>Categoria</th>
                  <th>Audiodescrição eMAG</th>
                  <th>Scans</th>
                  <th>Ações de Curadoria</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length ? (
                  filteredItems.map((item: any) => (
                    <tr key={item.id}>
                      <td style={{ width: '56px' }}>
                        {item.image_url ? (
                          <img
                            src={`${API}${item.image_url}`}
                            alt={item.title}
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ccd' }}
                          />
                        ) : (
                          <div style={{ width: '48px', height: '48px', background: '#eef2f3', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#889' }}>
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td><b>{item.code}</b></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{item.title}</span>
                        {item.author && <div style={{ fontSize: '11px', color: '#778890' }}>{item.author} ({item.year || 'S/D'})</div>}
                      </td>
                      <td>{item.space_name || 'Exposição Geral'}</td>
                      <td>{item.category || 'Geral'}</td>
                      <td>
                        <span className={'badge ' + (item.is_reviewed ? 'active' : 'trial')}>
                          {item.is_reviewed ? 'Revisado eMAG' : 'Pendente Revisão'}
                        </span>
                      </td>
                      <td><b>{item.scan_count}</b></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="primary compact"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Ouvir audiodescrição sintetizada"
                            onClick={() => speakDescription(item.audio_description)}
                          >
                            <Volume2 size={15} /> Ouvir
                          </button>
                          <button
                            className="primary compact"
                            style={{ padding: '6px 10px', fontSize: '12px', background: '#3b5560' }}
                            title="Ver e Imprimir QR Code"
                            onClick={() => onOpenModal('qr', item)}
                          >
                            <QrCode size={15} /> QR Code
                          </button>
                          <button
                            className="primary compact"
                            style={{ padding: '6px 10px', fontSize: '12px', background: '#25748b' }}
                            title="Revisar e Aprovar Audiodescrição"
                            onClick={() => onOpenModal('review', item)}
                          >
                            <Sparkles size={15} /> Curadoria
                          </button>
                          <button
                            className="primary compact"
                            style={{ padding: '6px 10px', fontSize: '12px', background: '#9a3535' }}
                            title="Excluir Obra"
                            onClick={() => deleteItem(item)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#778' }}>
                      Nenhuma obra encontrada para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  // 3. ESPAÇOS & GALERIAS
  if (page === 'spaces') {
    const deleteSpace = async (space: any) => {
      if (!confirm(`Deseja realmente remover o espaço "${space.name}"? As obras alocadas ficarão sem espaço associado.`)) return;
      try {
        await request(`/cultural/spaces/${space.id}`, { method: 'DELETE' }, token);
        onReload();
      } catch (e: any) {
        alert(e.message);
      }
    };

    return (
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Espaços e Galerias Expositivas</h2>
            <p style={{ margin: '4px 0 0', color: '#667', fontSize: '13px' }}>
              Organize as obras do museu por alas, pavilhões ou salas temáticas.
            </p>
          </div>
          <button className="primary compact" onClick={() => onOpenModal('new-space', null)}>
            <Plus size={16} /> Novo Espaço
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {data?.length ? (
            data.map((s: any) => (
              <div
                key={s.id}
                style={{
                  background: '#fff',
                  border: '1px solid #dce5e8',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#1f2e35' }}>{s.name}</h3>
                  <span className="badge active" style={{ fontSize: '11px' }}>
                    {s.items_count} {s.items_count === 1 ? 'obra' : 'obras'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#556', margin: '4px 0', minHeight: '36px', lineHeight: '1.45' }}>
                  {s.description || 'Espaço de exposição cultural.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '10px' }}>
                  <button
                    className="primary compact"
                    style={{ fontSize: '12px', padding: '6px 10px', background: '#9a3535' }}
                    onClick={() => deleteSpace(s)}
                  >
                    <Trash2 size={14} /> Excluir Espaço
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#778' }}>
              Nenhum espaço cadastrado. Clique no botão acima para criar o primeiro espaço ou galeria.
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. ORGANIZAÇÕES (CRUD COMPLETO MULTI-TENANT)
  if (page === 'organizations') {
    const switchOrg = async (orgId: number) => {
      try {
        await request(`/organizations/${orgId}/switch`, { method: 'POST' }, token);
        onReload();
      } catch (e: any) {
        alert(e.message);
      }
    };

    const toggleOrg = async (org: any) => {
      if (!confirm(`Deseja realmente ${org.active ? 'desativar' : 'reativar'} a organização ${org.name}?`)) return;
      try {
        if (org.active) {
          await request(`/organizations/${org.id}`, { method: 'DELETE' }, token);
        } else {
          await request(`/organizations/${org.id}`, { method: 'PUT', body: JSON.stringify({ active: true }) }, token);
        }
        onReload();
      } catch (e: any) {
        alert(e.message);
      }
    };

    return (
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Gestão Multi-tenant de Museus</h2>
            <p style={{ margin: '4px 0 0', color: '#68777d', fontSize: '13px' }}>
              Cada museu ou órgão cultural opera em ambiente isolado, com acervo próprio, equipe e métricas exclusivas.
            </p>
          </div>
          <button className="primary compact" onClick={() => onOpenModal('new-org', null)}>
            <Plus size={16} /> Nova Organização
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {(Array.isArray(data) ? data : []).map((org: any) => (
            <div
              key={org.id}
              style={{
                border: org.is_current ? '2px solid #25748b' : '1px solid #e1ebed',
                background: org.is_current ? '#f5fbfb' : '#fff',
                padding: '18px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px' }}>{org.name}</h3>
                  <span style={{ fontSize: '12px', color: '#778' }}>
                    {org.city ? `${org.city}/${org.state || 'BR'}` : 'Sede Principal'}
                  </span>
                </div>
                <span className={'badge ' + (org.active ? 'active' : 'trial')}>
                  {org.active ? `Plano ${org.plan?.toUpperCase()}` : 'Inativa'}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#556', margin: '4px 0', minHeight: '36px' }}>
                {org.description || 'Instituição cultural participante da rede Lumiar Cultural.'}
              </p>

              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#667', background: '#eef4f5', padding: '8px 12px', borderRadius: '8px' }}>
                <span><b>{org.spaces_count}</b> Espaços</span>
                <span><b>{org.items_count}</b> Obras</span>
                <span><b>{org.users_count}</b> Usuários</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', flexWrap: 'wrap' }}>
                {org.is_current ? (
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#25748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={16} /> Organização Ativa
                  </span>
                ) : (
                  <button
                    className="primary compact"
                    style={{ fontSize: '12px', padding: '6px 10px', background: '#25748b' }}
                    onClick={() => switchOrg(org.id)}
                  >
                    <ArrowRightLeft size={14} /> Alternar para esta
                  </button>
                )}
                <button
                  className="primary compact"
                  style={{ fontSize: '12px', padding: '6px 10px', background: '#3b5560', marginLeft: 'auto' }}
                  onClick={() => onOpenModal('edit-org', org)}
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button
                  className="primary compact"
                  style={{ fontSize: '12px', padding: '6px 10px', background: org.active ? '#9a4343' : '#3d8255' }}
                  onClick={() => toggleOrg(org)}
                >
                  <Trash2 size={14} /> {org.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. CURADORES & EQUIPE
  if (page === 'users') {
    return (
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Curadores & Equipe da Instituição</h2>
            <p style={{ margin: '4px 0 0', color: '#667', fontSize: '13px' }}>
              Controle de acesso por perfis (Proprietário, Administrador e Curador Cultural).
            </p>
          </div>
          <button className="primary compact" onClick={() => onOpenModal('new-user', null)}>
            <UserPlus size={16} /> Convidar Curador
          </button>
        </div>
        <Table rows={data} cols={['name', 'email', 'role', 'active', 'created_at']} />
      </div>
    );
  }

  // 6. SIMULADOR DO VISITANTE
  if (page === 'visitor') {
    return <VisitorScreen items={data?.items || []} />;
  }

  if (page === 'showcase-images') {
    return <ShowcaseImagesAdmin images={data || {}} token={token} onSaved={onImageSaved} />;
  }

  // 7. SEGURANÇA & LGPD
  if (page === 'security') {
    return (
      <>
        <div className="panel">
          <h2>Segurança, LGPD e Isolamento Multi-Organização</h2>
          <p>
            O Lumiar Cultural implementa isolamento rigoroso por instituição cultural (Tenant ID),
            criptografia de senhas com algoritmo bcrypt e tokens seguros JWT assinados.
          </p>
          <div className="grid-info" style={{ marginTop: '16px' }}>
            <div>
              <small>Organização Conectada</small>
              <b>{data?.org?.name}</b>
            </div>
            <div>
              <small>Identificador Slug / Chave</small>
              <b>{data?.org?.slug}</b>
            </div>
            <div>
              <small>Conformidade de Acessibilidade</small>
              <b>eMAG 3.0 & WCAG 2.1 AA</b>
            </div>
            <div>
              <small>Visão Computacional & IA</small>
              <b>Gemini 2.5 Flash Multimodal</b>
            </div>
          </div>
        </div>

        <ChangePasswordPanel token={token} />

        <div className="panel">
          <h3>Trilha de Auditoria Recente</h3>
          <Table rows={data?.audit || []} cols={['actor', 'action', 'created_at']} />
        </div>
      </>
    );
  }

  return <div className="panel">Página em desenvolvimento.</div>;
}

function ChangePasswordPanel({ token }: { token: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      }, token);
      setPasswordMessage(response.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.message || 'Não foi possível alterar a senha.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="panel">
      <h3>Alterar senha</h3>
      <p style={{ color: '#68777d', fontSize: '13px' }}>
        Use uma senha com pelo menos 12 caracteres. As sessões persistentes serão encerradas após a alteração.
      </p>
      <form onSubmit={changePassword} style={{ maxWidth: '480px' }}>
        <label>Senha atual</label>
        <input
          type="password"
          value={currentPassword}
          onChange={event => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <label>Nova senha</label>
        <input
          type="password"
          value={newPassword}
          onChange={event => setNewPassword(event.target.value)}
          autoComplete="new-password"
          minLength={12}
          required
        />
        <label>Confirmar nova senha</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={event => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          minLength={12}
          required
        />
        {passwordError && <div className="error" role="alert">{passwordError}</div>}
        {passwordMessage && <div className="success" role="status">{passwordMessage}</div>}
        <button className="primary" disabled={changingPassword} style={{ marginTop: '8px' }}>
          {changingPassword ? 'Alterando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  );
}

function ModalNewItem({ spaces, token, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('');
  const [spaceId, setSpaceId] = useState(spaces[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: any) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('code', code);
      formData.append('title', title);
      if (author) formData.append('author', author);
      if (year) formData.append('year', year);
      if (category) formData.append('category', category);
      if (spaceId) formData.append('space_id', String(spaceId));
      if (notes) formData.append('curator_notes', notes);
      if (file) formData.append('file', file);
      formData.append('auto_describe', 'true');

      await request('/cultural/items/with-image', {
        method: 'POST',
        body: formData
      }, token);

      onSuccess();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <form className="modal-card" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }} onSubmit={submit}>
        <h2>Cadastrar Nova Obra (com Foto e IA)</h2>
        <p style={{ fontSize: '13px', color: '#667' }}>
          Ao anexar uma foto, o <b>Gemini 2.5 Flash</b> analisará os detalhes visuais e gerará
          a audiodescrição eMAG 3.0 automaticamente!
        </p>

        {/* Upload e Preview da Imagem */}
        <div style={{ margin: '10px 0 16px', textAlign: 'center', border: '2px dashed #ccd', padding: '16px', borderRadius: '12px' }}>
          {preview ? (
            <div>
              <img src={preview} alt="Preview da obra" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', objectFit: 'contain' }} />
              <div style={{ marginTop: '8px' }}>
                <label style={{ cursor: 'pointer', color: '#25748b', fontWeight: 600, fontSize: '13px' }}>
                  Trocar Foto
                  <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          ) : (
            <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <UploadCloud size={32} color="#25748b" />
              <span style={{ fontWeight: 600, color: '#25748b' }}>Clique para selecionar a foto da peça</span>
              <span style={{ fontSize: '12px', color: '#889' }}>PNG, JPG ou WEBP (opcional)</span>
              <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        <label>Código Interno / Tombo</label>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="Ex: OBRA-012" required />

        <label>Título da Obra / Peça</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Válvula de Retenção Século XIX" required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label>Autor / Fabricante</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Ex: Fundição Imperial" />
          </div>
          <div>
            <label>Ano / Época</label>
            <input value={year} onChange={e => setYear(e.target.value)} placeholder="Ex: 1892" />
          </div>
        </div>

        <label>Categoria</label>
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Maquinário, Escultura, Pintura" />

        <label>Espaço / Galeria</label>
        <select
          value={spaceId}
          onChange={e => setSpaceId(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d8e1e3', marginBottom: '12px' }}
        >
          <option value="">Sem espaço associado</option>
          {spaces.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <label>Notas do Curador / Contexto Histórico</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d8e1e3' }}
          placeholder="Detalhes históricos ou dimensões para orientar a IA na geração da audiodescrição."
        />

        <div className="actions" style={{ marginTop: '16px' }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={loading}>
            {loading ? 'Processando Foto & IA...' : 'Cadastrar Obra'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalNewSpace({ token, onClose, onSuccess }: any) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request('/cultural/spaces', {
        method: 'POST',
        body: JSON.stringify({ name, description: desc })
      }, token);
      onSuccess();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <form className="modal-card" onSubmit={submit}>
        <h2>Novo Espaço ou Galeria</h2>
        <label>Nome do Espaço</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pavilhão das Bombas a Vapor" required />
        <label>Descrição</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Galeria histórica de maquinário do século XIX" />
        <div className="actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Espaço'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalNewOrg({ token, onClose, onSuccess }: any) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('professional');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request('/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name, plan, city, state, contact_email: email, description: desc
        })
      }, token);
      onSuccess();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <form className="modal-card organization-form" onSubmit={submit}>
        <h2>Cadastrar Novo Museu / Organização</h2>
        <label>Nome da Instituição Cultural</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Museu de Arte Moderna da Bahia" required />

        <div className="organization-form-grid">
          <div>
            <label>Cidade</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Salvador" />
          </div>
          <div>
            <label>Estado</label>
            <input value={state} onChange={e => setState(e.target.value)} placeholder="Ex: BA" />
          </div>
        </div>

        <label>Plano</label>
        <select
          value={plan}
          onChange={e => setPlan(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d8e1e3', marginBottom: '8px' }}
        >
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <label>E-mail de Contato</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@museu.gov.br" />

        <label>Descrição</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Breve apresentação da instituição" />

        <div className="actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Criar Organização'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalEditOrg({ org, token, onClose, onSuccess }: any) {
  const [name, setName] = useState(org.name || '');
  const [plan, setPlan] = useState(org.plan || 'professional');
  const [city, setCity] = useState(org.city || '');
  const [state, setState] = useState(org.state || '');
  const [email, setEmail] = useState(org.contact_email || '');
  const [desc, setDesc] = useState(org.description || '');
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request(`/organizations/${org.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name, plan, city, state, contact_email: email, description: desc
        })
      }, token);
      onSuccess();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <form className="modal-card" onSubmit={submit}>
        <h2>Editar Organização: {org.name}</h2>
        <label>Nome da Instituição</label>
        <input value={name} onChange={e => setName(e.target.value)} required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label>Cidade</label>
            <input value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label>Estado</label>
            <input value={state} onChange={e => setState(e.target.value)} />
          </div>
        </div>

        <label>Plano</label>
        <select
          value={plan}
          onChange={e => setPlan(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d8e1e3', marginBottom: '8px' }}
        >
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <label>E-mail de Contato</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />

        <label>Descrição</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} />

        <div className="actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalNewUser({ token, systemAdmin, onClose, onSuccess }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('curator');
  const [organizationId, setOrganizationId] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!systemAdmin) return;
    request('/organizations', {}, token).then(setOrganizations).catch((error: any) => alert(error.message));
  }, [systemAdmin, token]);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request('/users', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          ...(systemAdmin ? { organization_id: Number(organizationId) } : {})
        })
      }, token);
      onSuccess();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <form className="modal-card" onSubmit={submit}>
        <h2>Convidar / Adicionar Curador</h2>
        <label>Nome Completo</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria Santos" required />

        <label>E-mail</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="maria@museu.gov.br" required />

        <label>Perfil / Função</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d8e1e3', marginBottom: '8px' }}
        >
          <option value="curator">Curador Cultural</option>
          <option value="admin">Administrador do Museu</option>
          <option value="member">Membro / Assistente</option>
        </select>

        {systemAdmin && (
          <>
            <label>Instituição</label>
            <select value={organizationId} onChange={e => setOrganizationId(e.target.value)} required>
              <option value="">Selecione a instituição</option>
              {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </>
        )}

        <label>Senha Provisória</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />

        <div className="actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Adicionar à Equipe'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalQrCode({ item, onClose }: any) {
  const qrUrl = `${API}/api/v1/public/qr/${encodeURIComponent(item.qr_token)}`;

  return (
    <div className="modal">
      <div className="modal-card" style={{ textAlign: 'center' }}>
        <h2>Placa de Identificação QR Code</h2>
        <p style={{ fontSize: '13px', color: '#667' }}>
          Escaneie com a câmera do celular para abrir a audiodescrição no navegador.
        </p>
        <div style={{ margin: '18px auto', padding: '12px', background: '#f5f8f8', borderRadius: '12px', display: 'inline-block' }}>
          <img src={qrUrl} alt={`QR Code ${item.title}`} style={{ width: '220px', height: '220px' }} />
        </div>
        <div>
          <b>{item.code} — {item.title}</b>
          <div style={{ fontSize: '12px', color: '#889', marginTop: '4px' }}>Token: {item.qr_token}</div>
        </div>
        <div className="actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
          <button type="button" onClick={onClose}>Fechar</button>
          <a
            href={qrUrl}
            download={`qrcode_${item.code}.png`}
            className="primary compact"
            style={{ textDecoration: 'none', display: 'inline-flex' }}
          >
            <Download size={16} /> Baixar para Impressão
          </a>
        </div>
      </div>
    </div>
  );
}

function ModalReview({ item, token, onClose, onSuccess }: any) {
  const [desc, setDesc] = useState(item.audio_description || '');
  const [notes, setNotes] = useState(item.curator_notes || '');
  const [imageUrl, setImageUrl] = useState(item.image_url);
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request(`/cultural/items/${item.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ audio_description: desc, curator_notes: notes })
      }, token);
      onSuccess();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    setLoading(true);
    try {
      const res = await request(`/cultural/items/${item.id}/generate-description`, { method: 'POST' }, token);
      setDesc(res.audio_description);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadNewImage = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', f);
      formData.append('auto_describe', 'true');
      const res = await request(`/cultural/items/${item.id}/upload-image`, {
        method: 'POST',
        body: formData
      }, token);
      setImageUrl(res.image_url);
      setDesc(res.audio_description);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const speak = () => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(desc);
    utter.lang = 'pt-BR';
    utter.rate = 1.0;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="modal">
      <form className="modal-card" style={{ width: '680px', maxHeight: '90vh', overflowY: 'auto' }} onSubmit={submit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Curadoria eMAG 3.0: {item.code}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="primary compact"
              style={{ background: '#25748b', fontSize: '12px', padding: '6px 10px' }}
              onClick={speak}
            >
              <Volume2 size={14} /> Ouvir Áudio
            </button>
            <button
              type="button"
              className="primary compact"
              style={{ background: '#7a4282', fontSize: '12px', padding: '6px 10px' }}
              onClick={regenerate}
              disabled={loading}
            >
              <Sparkles size={14} /> Regerar com Gemini
            </button>
          </div>
        </div>

        {/* Foto da Obra e Upload */}
        <div style={{ display: 'flex', gap: '16px', margin: '14px 0', alignItems: 'center', background: '#f6f9fa', padding: '12px', borderRadius: '12px' }}>
          {imageUrl ? (
            <img src={`${API}${imageUrl}`} alt={item.title} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ccd' }} />
          ) : (
            <div style={{ width: '90px', height: '90px', background: '#eef2f3', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#889' }}>
              <ImageIcon size={30} />
            </div>
          )}
          <div>
            <b>Foto da Obra</b>
            <div style={{ fontSize: '12px', color: '#667', margin: '4px 0 8px' }}>
              A imagem é processada pelo Gemini 2.5 Flash para descrever formas, texturas e detalhes visuais.
            </div>
            <label className="primary compact" style={{ display: 'inline-flex', cursor: 'pointer', padding: '6px 12px', fontSize: '12px', background: '#3b5560' }}>
              <UploadCloud size={14} /> Substituir Foto & Regerar
              <input type="file" accept="image/*" onChange={uploadNewImage} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <label>Audiodescrição Acessível (Norma eMAG 3.0)</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={6}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d8e1e3', fontSize: '14px', lineHeight: '1.5' }}
          required
        />

        <label style={{ marginTop: '10px' }}>Notas Técnicas do Curador</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Peça restaurada em 2024. Conformidade plena com eMAG." />

        <div className="actions" style={{ marginTop: '16px' }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Aprovar Audiodescrição'}
          </button>
        </div>
      </form>
    </div>
  );
}

type VisitorRecognitionEvent = Event & {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type VisitorRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: VisitorRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function VisitorScreen({ items }: { items: any[] }) {
  const defaultToken = items[0]?.qr_token || 'embasa-valvula-001';
  const [token, setToken] = useState(defaultToken);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [question, setQuestion] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{ sender: string; text: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const playbackGeneration = useRef(0);
  const recognitionRef = useRef<VisitorRecognition | null>(null);
  const speechSegments = (item?.audio_description || '').match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s: string) => s.trim()).filter(Boolean) || [];
  const speechWindow = window as typeof window & {
    SpeechRecognition?: new () => VisitorRecognition;
    webkitSpeechRecognition?: new () => VisitorRecognition;
  };

  const loadScan = async (t: string) => {
    if (!t) return;
    setLoading(true);
    setLoadError('');
    setItem(null);
    try {
      const res = await fetch(`${API}/api/v1/public/scan/${encodeURIComponent(t)}`, {
        headers: { Accept: 'application/json' }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('O servidor não retornou dados JSON. Verifique a URL da API e tente novamente.');
      }
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'Obra não encontrada');
      setItem(d);
      setChatLog([
        { sender: 'lumi', text: `Olá! Sou a Lumi, assistente acessível do museu. Estou com você em frente a "${d.title}". Se quiser, ouça a audiodescrição ou me faça qualquer pergunta!` }
      ]);
    } catch (e: any) {
      setLoadError(e.message || 'Não foi possível carregar a obra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScan(token);
    playbackGeneration.current += 1;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setSegmentIndex(0);
  }, [token]);

  useEffect(() => {
    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      setVoiceURI(current => current || available.find(v => /^pt[-_]br$/i.test(v.lang))?.voiceURI || '');
    };
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

  useEffect(() => () => {
    playbackGeneration.current += 1;
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
  }, []);

  const speakSegment = (index: number, generation: number, segments: string[], selectedVoice: SpeechSynthesisVoice | undefined, speechRate: number) => {
    if (generation !== playbackGeneration.current) return;
    if (index >= segments.length) {
      setSpeaking(false);
      setPaused(false);
      setSegmentIndex(segments.length);
      return;
    }
    setSegmentIndex(index);
    const utterance = new SpeechSynthesisUtterance(segments[index]);
    utterance.lang = selectedVoice?.lang || 'pt-BR';
    utterance.rate = speechRate;
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = () => speakSegment(index + 1, generation, segments, selectedVoice, speechRate);
    utterance.onerror = event => {
      if (generation !== playbackGeneration.current || event.error === 'canceled' || event.error === 'interrupted') return;
      setSpeaking(false);
      setPaused(false);
      setVoiceStatus('Não foi possível reproduzir a voz selecionada. Escolha outra voz e tente novamente.');
    };
    window.speechSynthesis.speak(utterance);
  };

  const startSpeech = (index = 0) => {
    if (!speechSegments.length) return;
    playbackGeneration.current += 1;
    window.speechSynthesis.cancel();
    setVoiceStatus('');
    setSpeaking(true);
    setPaused(false);
    speakSegment(
      Math.max(0, Math.min(index, speechSegments.length - 1)),
      playbackGeneration.current,
      speechSegments,
      voices.find(voice => voice.voiceURI === voiceURI),
      rate
    );
  };

  const stopSpeech = () => {
    playbackGeneration.current += 1;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setSegmentIndex(0);
  };

  const moveSegment = (offset: number) => {
    if (!speechSegments.length) return;
    const next = Math.max(0, Math.min(speechSegments.length - 1, segmentIndex + offset));
    if (speaking || paused) startSpeech(next);
    else {
      playbackGeneration.current += 1;
      window.speechSynthesis.cancel();
      setSegmentIndex(next);
    }
  };

  const toggleSpeech = () => {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setSpeaking(true);
    } else if (speaking) {
      window.speechSynthesis.pause();
      setSpeaking(false);
      setPaused(true);
    } else {
      startSpeech(segmentIndex >= speechSegments.length ? 0 : segmentIndex);
    }
  };

  const askQuestion = async (qText?: string) => {
    const q = qText || question;
    if (!q.trim()) return;
    stopSpeech();
    const userMsg = { sender: 'user', text: q };
    setChatLog(prev => [...prev, userMsg]);
    setQuestion('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API}/api/v1/public/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ qr_token: token, question: q })
      });
      if (!res.headers.get('content-type')?.includes('application/json')) {
        throw new Error('O servidor não retornou uma resposta válida da assistente.');
      }
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'A Lumi não conseguiu responder agora.');
      const answer = String(d.answer || 'Não consegui encontrar essa resposta.');
      setChatLog(prev => [...prev, { sender: 'lumi', text: answer }]);
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(answer);
      const selectedVoice = voices.find(voice => voice.voiceURI === voiceURI);
      utter.lang = selectedVoice?.lang || 'pt-BR';
      utter.rate = rate;
      if (selectedVoice) utter.voice = selectedVoice;
      window.speechSynthesis.speak(utter);
    } catch (e: any) {
      setChatLog(prev => [...prev, { sender: 'lumi', text: e.message || 'Desculpe, não consegui consultar essa informação no momento.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleMicrophone = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceStatus('Gravação interrompida.');
      return;
    }
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus('O reconhecimento de voz não está disponível neste navegador. Use o campo de texto ou abra o simulador em um navegador compatível.');
      return;
    }
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => {
      const spokenQuestion = event.results[0]?.[0]?.transcript.trim();
      if (!spokenQuestion) {
        setVoiceStatus('Não entendi a pergunta. Tente falar novamente.');
        return;
      }
      setQuestion(spokenQuestion);
      setVoiceStatus(`Pergunta reconhecida: ${spokenQuestion}. A Lumi está respondendo.`);
      recognitionRef.current = null;
      setIsListening(false);
      askQuestion(spokenQuestion);
    };
    recognition.onerror = event => {
      setVoiceStatus(event.error === 'not-allowed'
        ? 'A permissão do microfone foi negada. Autorize o microfone nas configurações do navegador.'
        : `Não foi possível ouvir a pergunta (${event.error}). Tente novamente ou digite.`);
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    try {
      recognition.start();
      setIsListening(true);
      setVoiceStatus('Microfone ativo. Faça sua pergunta à Lumi.');
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceStatus('Não foi possível ativar o microfone. Verifique a permissão do navegador.');
    }
  };

  return (
    <div className="lumiar-visitor-screen" style={{ maxWidth: '780px', margin: 'auto' }}>
      <div className="panel" style={{ background: '#1c282e', color: 'white', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#68c5db', textTransform: 'uppercase', fontWeight: 700 }}>
              {item?.organization?.name || 'Lumiar Cultural — App do Visitante'}
            </span>
            <h2 style={{ color: 'white', margin: '4px 0 0 0' }}>{item?.space?.name || 'Visitação Acessível'}</h2>
          </div>
          {items.length > 0 && (
            <div>
              <label style={{ fontSize: '11px', color: '#aac', display: 'block', marginBottom: '4px' }}>Selecionar Obra para Simular:</label>
              <select
                value={token}
                onChange={e => setToken(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', background: '#293a42', color: '#fff', border: '1px solid #455d68', fontSize: '13px' }}
              >
                {items.map((it: any) => (
                  <option key={it.id} value={it.qr_token}>
                    {it.code} - {it.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="panel">Carregando obra e audiodescrição eMAG 3.0...</div>
      ) : loadError ? (
        <div className="panel" role="alert" style={{ color: '#9e3d3d' }}>{loadError}</div>
      ) : item && (
        <>
          <div className="panel" style={{ borderLeft: '6px solid #25748b' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {item.image_url && (
                <img
                  src={`${API}${item.image_url}`}
                  alt={item.title}
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #ccd' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '12px', background: '#dceff0', color: '#25748b', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                  {item.code} · {item.category || 'Acervo Cultural'}
                </span>
                <h1 style={{ fontSize: '24px', margin: '10px 0 4px' }}>{item.title}</h1>
                <p style={{ margin: 0, color: '#66757b', fontSize: '14px' }}>
                  {item.author} {item.year ? `(${item.year})` : ''}
                </p>
              </div>
            </div>

            {/* Player de Audiodescrição eMAG */}
            <div style={{ marginTop: '20px', background: '#f6f9fa', padding: '18px', borderRadius: '14px', border: '1px solid #e1ebed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  className="primary compact"
                  style={{ fontSize: '15px', padding: '12px 22px', background: speaking ? '#9e3d3d' : '#25748b' }}
                  onClick={toggleSpeech}
                  aria-label={paused ? 'Continuar audiodescrição' : speaking ? 'Pausar audiodescrição' : 'Ouvir audiodescrição'}
                >
                  {paused ? <Play size={20} /> : speaking ? <Pause size={20} /> : <Volume2 size={20} />}
                  {paused ? 'Continuar' : speaking ? 'Pausar Audiodescrição' : 'Ouvir Audiodescrição (eMAG)'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#556' }}>
                  <label htmlFor="visitor-voice">Voz:</label>
                  <select id="visitor-voice" value={voiceURI} onChange={e => setVoiceURI(e.target.value)} style={{ maxWidth: '240px', padding: '6px' }}>
                    {voices.length === 0 && <option value="">Voz padrão do navegador</option>}
                    {voices.map(voice => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang}){voice.default ? ' — padrão' : ''}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="visitor-rate">Velocidade:</label>
                  <select id="visitor-rate" value={rate} onChange={e => setRate(Number(e.target.value))} style={{ padding: '6px' }}>
                    {[0.8, 0.9, 1.0, 1.1, 1.25, 1.5].map(r => <option key={r} value={r}>{r}x</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                <button type="button" className="compact" aria-label="Voltar uma frase" onClick={() => moveSegment(-1)} disabled={!speechSegments.length}>
                  <SkipBack size={17} /> Voltar
                </button>
                  <progress
                    value={Math.min(segmentIndex, speechSegments.length)}
                  max={speechSegments.length || 1}
                  aria-label="Progresso da audiodescrição"
                  style={{ flex: 1, height: '14px', accentColor: '#25748b' }}
                />
                <button type="button" className="compact" aria-label="Avançar uma frase" onClick={() => moveSegment(1)} disabled={!speechSegments.length}>
                  Avançar <SkipForward size={17} />
                </button>
                <button type="button" className="compact" aria-label="Parar audiodescrição" onClick={stopSpeech}>
                  Parar
                </button>
              </div>
              <div aria-live="polite" style={{ marginTop: '5px', color: '#556', fontSize: '12px' }}>
                {speechSegments.length ? `Frase ${Math.min(segmentIndex + 1, speechSegments.length)} de ${speechSegments.length}` : 'Audiodescrição indisponível.'}
                {' · '}A naturalidade da voz depende das vozes instaladas no navegador ou aparelho.
              </div>
              <div style={{ marginTop: '16px', lineHeight: '1.65', fontSize: '15px', color: '#27343a' }}>
                {item.audio_description}
              </div>
            </div>
          </div>

          {/* Chat Acessível com a Assistente Lumi */}
          <div className="panel">
            <h3><MessageSquare size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Converse com a Lumi (Especialista Virtual)</h3>
            <p style={{ fontSize: '13px', color: '#667' }}>
              Tire dúvidas específicas sobre a história, contexto cultural ou detalhes desta obra.
            </p>

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', margin: '14px 0', padding: '8px', background: '#fafcfc', borderRadius: '10px' }}>
              {chatLog.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'user' ? '#25748b' : '#eaf0f2',
                    color: m.sender === 'user' ? '#fff' : '#223',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    maxWidth: '85%',
                    fontSize: '14px',
                    lineHeight: '1.45'
                  }}
                >
                  {m.text}
                </div>
              ))}
              {chatLoading && <div style={{ fontSize: '12px', color: '#889' }}>Lumi está consultando o acervo...</div>}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askQuestion()}
                placeholder="Pergunte à Lumi (ex: Qual era a função desta peça?)"
                aria-label="Pergunta para a Lumi"
                style={{ flex: 1, margin: 0 }}
              />
              <button className="primary compact" onClick={() => askQuestion()} disabled={chatLoading}>
                <Send size={16} /> Perguntar
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button type="button" className="primary compact" onClick={toggleMicrophone} disabled={chatLoading}>
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                {isListening ? 'Parar microfone' : 'Perguntar por áudio'}
              </button>
              <span role="status" aria-live="polite" style={{ fontSize: '13px', color: '#556' }}>{voiceStatus}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => askQuestion('Qual era a finalidade prática desta peça?')}
                style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccd', background: '#fff', cursor: 'pointer' }}
              >
                💡 "Qual era a finalidade prática?"
              </button>
              <button
                type="button"
                onClick={() => askQuestion('De que material ela é feita e qual a sua época?')}
                style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccd', background: '#fff', cursor: 'pointer' }}
              >
                🔍 "Material e época de confecção?"
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon }: any) {
  return (
    <article className="stat">
      <Icon size={24} />
      <span>{label}</span>
      <b>{value}</b>
    </article>
  );
}

function Table({ rows, cols }: { rows: any[]; cols: string[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {cols.map(c => <th key={c}>{c.replaceAll('_', ' ')}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows?.length ? (
            rows.map((r: any, i: number) => (
              <tr key={i}>
                {cols.map(c => <td key={c}>{String(r[c] ?? '—')}</td>)}
              </tr>
            ))
          ) : (
            <tr><td colSpan={cols.length}>Nenhum registro encontrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
