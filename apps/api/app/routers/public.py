import json
import html
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CulturalItem, CulturalSpace, Organization
from ..services.ai_service import ask_lumi_assistant, generate_qr_code_png
from ..config import settings

router = APIRouter(prefix='/public', tags=['Visitante & Mobile App'])

class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=1000)

class ChatRequest(BaseModel):
    qr_token: str = Field(min_length=1, max_length=128)
    question: str = Field(min_length=1, max_length=500)
    history: list[ChatTurn] = Field(default_factory=list, max_length=10)

class ChatResponse(BaseModel):
    answer: str
    item_title: str
    organization_name: str

def fix_mojibake(text: Optional[str]) -> str:
    """Corrige strings UTF-8 que foram interpretadas como Latin-1 (mojibake)."""
    if not text:
        return ""
    if any(k in text for k in ['Ã', 'Â', 'â', 'ã', 'Ã³', 'Ã§', 'Ã£', 'Ã©', 'Ã­']):
        try:
            return text.encode('latin1').decode('utf-8')
        except Exception:
            replacements = {
                'Ã¡': 'á', 'Ã©': 'é', 'Ã\xad': 'í', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
                'Ã ': 'à', 'Ã£': 'ã', 'Ãµ': 'õ', 'Ã¢': 'â', 'Ãª': 'ê',
                'Ã´': 'ô', 'Ã§': 'ç', 'Ã': 'Á', 'Ã‰': 'É', 'Ã\x8d': 'Í',
                'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã€': 'À', 'Ãƒ': 'Ã', 'Ã•': 'Õ',
                'Ã‚': 'Â', 'ÃŠ': 'Ê', 'Ã”': 'Ô', 'Ã‡': 'Ç', 'Ã—': '×'
            }
            for k, v in replacements.items():
                text = text.replace(k, v)
    return text

def render_visitor_mobile_page(item: dict, qr_token: str) -> str:
    """Gera página web mobile responsiva e acessível para o visitante que escaneia o QR Code."""
    title = html.escape(item.get('title') or 'Obra do Acervo')
    author = html.escape(item.get('author') or '')
    year = html.escape(str(item.get('year') or ''))
    category = html.escape(item.get('category') or 'Acervo Cultural')
    code = html.escape(item.get('code') or '')
    audio_desc = html.escape(item.get('audio_description') or '')
    organization = item.get('organization') or {}
    space = item.get('space') or {}
    org_name = html.escape(organization.get('name') or 'Lumiar Cultural')
    space_name = html.escape(space.get('name') or 'Exposição Geral')
    image_url = item.get('image_url') or ''
    clean_audio_desc_js = json.dumps(item.get('audio_description') or '')

    image_html = ""
    if image_url:
        image_html = f'''
        <div class="artwork-image-container">
            <img src="{html.escape(image_url)}" alt="Fotografia de {title}" class="artwork-image" loading="lazy" />
        </div>
        '''

    author_year_html = ""
    if author or year:
        author_year_html = f'<p class="artwork-author">{author} {f"({year})" if year else ""}</p>'

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    <meta name="theme-color" content="#1a252b" />
    <title>{title} — {org_name}</title>
    <style>
        :root {{
            --bg-color: #f4f7f8;
            --card-bg: #ffffff;
            --text-main: #1d2b32;
            --text-muted: #5e6f76;
            --primary: #23748b;
            --primary-dark: #195668;
            --accent: #dcf0f3;
            --border: #e1ebed;
            --radius: 18px;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            line-height: 1.6;
            padding-bottom: 50px;
        }}
        header.app-header {{
            background: linear-gradient(135deg, #1b262c, #263842);
            color: #ffffff;
            padding: 16px 20px;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }}
        .header-org {{
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: #68c5db;
        }}
        .header-space {{
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 2px;
        }}
        main.container {{
            max-width: 680px;
            margin: 0 auto;
            padding: 18px 16px;
        }}
        .card {{
            background: var(--card-bg);
            border-radius: var(--radius);
            border: 1px solid var(--border);
            padding: 20px;
            margin-bottom: 18px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.03);
        }}
        .artwork-image-container {{
            width: 100%;
            max-height: 380px;
            overflow: hidden;
            border-radius: 14px;
            margin-bottom: 16px;
            background: #eef2f3;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .artwork-image {{
            width: 100%;
            height: auto;
            max-height: 380px;
            object-fit: contain;
            display: block;
        }}
        .badge {{
            display: inline-block;
            background: var(--accent);
            color: var(--primary);
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
            margin-bottom: 8px;
        }}
        h1.artwork-title {{
            font-size: 24px;
            font-weight: 800;
            line-height: 1.25;
            color: #1a252b;
            margin-bottom: 4px;
        }}
        p.artwork-author {{
            font-size: 15px;
            color: var(--text-muted);
            margin-bottom: 14px;
        }}
        .audio-player-box {{
            background: #f8fbfb;
            border: 1px solid #dbe6e8;
            border-radius: 14px;
            padding: 16px;
            margin-top: 14px;
        }}
        .btn-play {{
            width: 100%;
            background: var(--primary);
            color: #ffffff;
            border: none;
            border-radius: 12px;
            padding: 15px 20px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: background 0.2s;
            touch-action: manipulation;
        }}
        .btn-play.playing {{
            background: #9a3535;
        }}
        .btn-play:active {{
            transform: scale(0.99);
        }}
        .audio-transport {{
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
            margin-top: 12px;
        }}
        .btn-transport {{
            min-height: 48px;
            border: 1px solid #ccd6d9;
            border-radius: 10px;
            background: #ffffff;
            color: var(--text-main);
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            touch-action: manipulation;
        }}
        .btn-transport.primary {{
            background: var(--primary);
            color: #ffffff;
            border-color: var(--primary);
        }}
        .audio-status {{
            min-height: 24px;
            margin-top: 8px;
            color: var(--text-muted);
            font-size: 14px;
        }}
        .scan-card {{
            display: grid;
            gap: 12px;
        }}
        .scan-actions, .voice-actions {{
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }}
        .btn-scan, .btn-voice {{
            min-height: 48px;
            padding: 10px 16px;
            border: 0;
            border-radius: 10px;
            background: var(--primary);
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            touch-action: manipulation;
        }}
        .btn-scan.secondary, .btn-voice.secondary {{
            background: #ffffff;
            color: var(--primary-dark);
            border: 2px solid var(--primary);
        }}
        .scan-video {{
            display: none;
            width: 100%;
            max-height: 320px;
            background: #111;
            border-radius: 12px;
        }}
        .scan-status, .voice-status {{
            min-height: 24px;
            color: var(--text-muted);
            font-size: 15px;
        }}
        .audio-controls {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 12px;
            font-size: 13px;
            color: var(--text-muted);
            flex-wrap: wrap;
            gap: 8px;
        }}
        .speed-buttons {{
            display: flex;
            gap: 6px;
        }}
        .btn-speed {{
            background: #ffffff;
            border: 1px solid #ccd6d9;
            border-radius: 6px;
            padding: 5px 9px;
            font-size: 12px;
            font-weight: 700;
            color: var(--text-main);
            cursor: pointer;
        }}
        .btn-speed.active {{
            background: var(--primary);
            color: #ffffff;
            border-color: var(--primary);
        }}
        .section-title {{
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: var(--primary);
            margin-bottom: 8px;
        }}
        .sr-only {{
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }}
        .audio-description-text {{
            font-size: 16px;
            line-height: 1.7;
            color: #243238;
            margin-top: 14px;
        }}
        /* Chat com a Lumi */
        .chat-container {{
            margin-top: 10px;
        }}
        .chat-log {{
            max-height: 280px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 10px;
            background: #fafcfc;
            border-radius: 12px;
            border: 1px solid #e7eeef;
            margin-bottom: 12px;
        }}
        .chat-bubble {{
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 14px;
            line-height: 1.45;
            max-width: 88%;
        }}
        .chat-bubble.bot {{
            background: #eaf1f3;
            color: #1f2d33;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
        }}
        .chat-bubble.user {{
            background: var(--primary);
            color: #ffffff;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }}
        .chat-form {{
            display: flex;
            gap: 8px;
        }}
        .chat-input {{
            flex: 1;
            padding: 12px 14px;
            border: 1px solid #ccd6d9;
            border-radius: 10px;
            font-size: 14px;
            outline: none;
        }}
        .chat-input:focus {{
            border-color: var(--primary);
        }}
        .btn-send {{
            background: var(--primary);
            color: white;
            border: none;
            padding: 0 16px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
        }}
        .quick-prompts {{
            display: flex;
            gap: 6px;
            margin-top: 10px;
            flex-wrap: wrap;
        }}
        .prompt-chip {{
            background: #ffffff;
            border: 1px solid #d3dedf;
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 12px;
            color: #3b5057;
            cursor: pointer;
        }}
        .footer-note {{
            text-align: center;
            font-size: 12px;
            color: #798a91;
            margin-top: 24px;
        }}
    </style>
</head>
<body>
    <header class="app-header">
        <div class="header-org">{org_name}</div>
        <div class="header-space">{space_name}</div>
    </header>

    <main class="container">
        <section class="card">
            {image_html}
            <span class="badge">{code} · {category}</span>
            <h1 class="artwork-title">{title}</h1>
            {author_year_html}

            <!-- Player de Audiodescrição eMAG 3.0 -->
            <div class="audio-player-box">
                <button id="btn-audio" class="btn-play" onclick="toggleAudio()" aria-label="Ouvir audiodescrição acessível">
                    <span id="audio-icon">🔊</span>
                    <span id="audio-label">Ouvir Audiodescrição (eMAG 3.0)</span>
                </button>

                <div class="audio-transport" aria-label="Controles da audiodescrição">
                    <button type="button" class="btn-transport" onclick="skipAudio(-1)" aria-label="Voltar uma frase">⏮ Voltar</button>
                    <button type="button" class="btn-transport primary" id="btn-pause" onclick="togglePauseResume()" aria-label="Pausar áudio">⏸ Pausar</button>
                    <button type="button" class="btn-transport" onclick="stopAudio()" aria-label="Parar áudio">⏹ Parar</button>
                    <button type="button" class="btn-transport" onclick="skipAudio(1)" aria-label="Avançar uma frase">Avançar ⏭</button>
                </div>
                <div id="audio-status" class="audio-status" role="status" aria-live="polite"></div>

                <div class="audio-controls">
                    <span>Velocidade de reprodução:</span>
                    <div class="speed-buttons">
                        <button class="btn-speed" onclick="setSpeed(0.8)">0.8x</button>
                        <button class="btn-speed active" onclick="setSpeed(1.0)">1.0x</button>
                        <button class="btn-speed" onclick="setSpeed(1.25)">1.25x</button>
                        <button class="btn-speed" onclick="setSpeed(1.5)">1.5x</button>
                    </div>
                </div>

                <div class="audio-description-text" id="desc-container">
                    {audio_desc}
                </div>
            </div>
        </section>

        <section class="card scan-card">
            <div class="section-title">📷 Continuar visita</div>
            <p>Escaneie o QR Code de outra obra com a câmera deste navegador ou digite o código impresso na placa.</p>
            <div class="scan-actions">
                <button type="button" class="btn-scan" onclick="startQrScanner()">Escanear outro QR Code</button>
                <button type="button" class="btn-scan secondary" onclick="document.getElementById('qr-photo').click()">Fotografar QR Code</button>
                <button type="button" class="btn-scan secondary" onclick="stopQrScanner()">Fechar câmera</button>
            </div>
            <input id="qr-photo" class="sr-only" type="file" accept="image/*" capture="environment" onchange="decodeQrPhoto(event)" aria-label="Fotografar QR Code da próxima obra" />
            <video id="qr-video" class="scan-video" playsinline muted aria-label="Visualização da câmera para ler um QR Code"></video>
            <div id="scan-status" class="scan-status" role="status" aria-live="polite"></div>
            <form class="chat-form" onsubmit="openScannedCode(event)">
                <label class="sr-only" for="next-qr-code">Código ou endereço do QR Code</label>
                <input type="text" id="next-qr-code" class="chat-input" placeholder="Código da próxima obra" autocomplete="off" />
                <button type="submit" class="btn-send">Abrir obra</button>
            </form>
        </section>

        <!-- Assistente Virtual Lumi -->
        <section class="card chat-container">
            <div class="section-title">💬 Pergunte à Lumi (Guia Virtual)</div>
            <p style="font-size: 13px; color: #5e6f76; margin-bottom: 12px;">
                Pergunte sobre esta obra, o acervo ou outros assuntos. Você pode falar ou escrever; a Lumi responde por texto e voz.
            </p>

            <div class="chat-log" id="chat-log">
                <div class="chat-bubble bot">
                    Olá! Sou a Lumi, sua assistente acessível. Estou aqui com você admirando "{title}". Quer saber mais detalhes históricos ou curiosidades?
                </div>
            </div>

            <form class="chat-form" onsubmit="handleSendQuestion(event)">
                <input type="text" id="chat-input" class="chat-input" placeholder="Digite sua pergunta aqui..." aria-label="Pergunta sobre a obra" required />
                <button type="submit" class="btn-send" id="btn-send">Perguntar</button>
            </form>
            <div class="voice-actions">
                <button type="button" class="btn-voice" id="btn-voice" onclick="toggleVoiceInput()">🎙️ Falar com a Lumi</button>
                <button type="button" class="btn-voice secondary" onclick="stopAudio()">⏹ Parar áudio</button>
            </div>
            <div id="voice-status" class="voice-status" role="status" aria-live="polite"></div>
            <div id="chat-status" class="voice-status" role="status" aria-live="polite"></div>

            <div class="quick-prompts">
                <button type="button" class="prompt-chip" onclick="askPreset('Qual o contexto histórico desta obra?')">
                    💡 Contexto histórico?
                </button>
                <button type="button" class="prompt-chip" onclick="askPreset('De que material e técnica ela é feita?')">
                    🔍 Material e técnica?
                </button>
                <button type="button" class="prompt-chip" onclick="askPreset('Qual a importância artística e cultural?')">
                    🎨 Importância cultural?
                </button>
            </div>
        </section>

        <p class="footer-note">
            Lumiar Cultural · Sistema de Acessibilidade Conectada para Museus (eMAG 3.0 / WCAG 2.1)
        </p>
    </main>

    <script>
        const qrToken = {json.dumps(qr_token)};
        const textToRead = {clean_audio_desc_js};
        let isSpeaking = false;
        let isPaused = false;
        let currentRate = 1.0;
        let activeUtterance = null;
        let audioSegments = [];
        let audioIndex = 0;
        let playbackGeneration = 0;
        let currentAudioText = '';
        let currentAudioLabel = 'Audiodescrição';
        let pauseAfterStart = false;
        let qrStream = null;
        let qrAnimationFrame = null;
        let speechRecognition = null;
        let chatHistory = [];

        function splitSpeech(text) {{
            return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text])
                .map(part => part.trim())
                .filter(Boolean);
        }}

        function speakText(text, label, startIndex = 0) {{
            if (!('speechSynthesis' in window)) {{
                setAudioStatus('A leitura por voz não está disponível neste navegador.');
                return;
            }}
            stopAudio(false);
            currentAudioText = text;
            currentAudioLabel = label;
            audioSegments = splitSpeech(text);
            audioIndex = Math.max(0, Math.min(startIndex, audioSegments.length - 1));
            const generation = playbackGeneration;
            speakCurrentSegment(generation);
        }}

        function speakCurrentSegment(generation) {{
            if (generation !== playbackGeneration || audioIndex >= audioSegments.length) {{
                isSpeaking = false;
                isPaused = false;
                updateButtonState(false);
                setAudioStatus('Leitura concluída.');
                return;
            }}
            activeUtterance = new SpeechSynthesisUtterance(audioSegments[audioIndex]);
            activeUtterance.lang = 'pt-BR';
            activeUtterance.rate = currentRate;
            activeUtterance.onstart = () => {{
                if (generation !== playbackGeneration) return;
                if (pauseAfterStart) {{
                    pauseAfterStart = false;
                    window.speechSynthesis.pause();
                    isSpeaking = false;
                    isPaused = true;
                    updateButtonState(false);
                    setAudioStatus(`Leitura pausada. Frase ${{audioIndex + 1}} de ${{audioSegments.length}}.`);
                    return;
                }}
                isSpeaking = true;
                isPaused = false;
                updateButtonState(true);
                setAudioStatus(`Lendo ${{currentAudioLabel}}. Frase ${{audioIndex + 1}} de ${{audioSegments.length}}.`);
            }};
            activeUtterance.onend = () => {{
                if (generation !== playbackGeneration) return;
                audioIndex += 1;
                if (audioIndex < audioSegments.length) speakCurrentSegment(generation);
                else {{
                    isSpeaking = false;
                    isPaused = false;
                    audioIndex = 0;
                    updateButtonState(false);
                    setAudioStatus('Leitura concluída.');
                }}
            }};
            activeUtterance.onerror = (event) => {{
                if (generation !== playbackGeneration || event.error === 'canceled' || event.error === 'interrupted') return;
                isSpeaking = false;
                isPaused = false;
                updateButtonState(false);
                setAudioStatus('Não foi possível reproduzir o áudio. Tente novamente.');
            }};
            window.speechSynthesis.speak(activeUtterance);
        }}

        function setAudioStatus(message) {{
            const status = document.getElementById('audio-status');
            if (status) status.innerText = message;
        }}

        function setSpeed(rate) {{
            currentRate = rate;
            document.querySelectorAll('.btn-speed').forEach(b => {{
                b.classList.toggle('active', parseFloat(b.innerText) === rate);
            }});
            if (isSpeaking || isPaused) {{
                const wasPaused = isPaused;
                const index = audioIndex;
                speakText(currentAudioText, currentAudioLabel, index);
                if (wasPaused) pauseAfterStart = true;
            }}
        }}

        function toggleAudio() {{
            if (isSpeaking && currentAudioLabel === 'Audiodescrição') pauseAudio();
            else if (isPaused && currentAudioLabel === 'Audiodescrição') resumeAudio();
            else speakText(textToRead, 'Audiodescrição', currentAudioText === textToRead ? audioIndex : 0);
        }}

        function pauseAudio() {{
            if (!('speechSynthesis' in window) || !isSpeaking) return;
            window.speechSynthesis.pause();
            isSpeaking = false;
            isPaused = true;
            updateButtonState(false);
            setAudioStatus(`Leitura pausada. Frase ${{audioIndex + 1}} de ${{audioSegments.length}}.`);
        }}

        function togglePauseResume() {{
            if (isPaused) resumeAudio();
            else pauseAudio();
        }}

        function resumeAudio() {{
            if (!('speechSynthesis' in window) || !isPaused) return;
            window.speechSynthesis.resume();
            isSpeaking = true;
            isPaused = false;
            updateButtonState(true);
            setAudioStatus(`Continuando ${{currentAudioLabel}}.`);
        }}

        function stopAudio(updateStatus = true) {{
            playbackGeneration += 1;
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            isSpeaking = false;
            isPaused = false;
            updateButtonState(false);
            if (updateStatus) setAudioStatus('Áudio parado.');
        }}

        function skipAudio(direction) {{
            if (!audioSegments.length) {{
                speakText(textToRead, 'Audiodescrição');
                return;
            }}
            const wasPlaying = isSpeaking;
            const wasPaused = isPaused;
            audioIndex = Math.max(0, Math.min(audioSegments.length - 1, audioIndex + direction));
            const index = audioIndex;
            const text = currentAudioText;
            const label = currentAudioLabel;
            stopAudio(false);
            if (wasPlaying) speakText(text, label, index);
            else {{
                audioIndex = index;
                isPaused = wasPaused;
                updateButtonState(false);
                setAudioStatus(`Posição ajustada para a frase ${{audioIndex + 1}} de ${{audioSegments.length}}. ${{wasPaused ? 'Toque em continuar para ouvir.' : ''}}`);
            }}
        }}

        function updateButtonState(playing) {{
            const btn = document.getElementById('btn-audio');
            const icon = document.getElementById('audio-icon');
            const label = document.getElementById('audio-label');
            const pauseButton = document.getElementById('btn-pause');
            if (playing) {{
                btn.classList.add('playing');
                icon.innerText = '🔊';
                label.innerText = currentAudioLabel === 'Audiodescrição' ? 'Audiodescrição em reprodução' : 'Resposta da Lumi em reprodução';
                pauseButton.innerText = '⏸ Pausar';
                pauseButton.setAttribute('aria-label', 'Pausar áudio');
            }} else {{
                btn.classList.remove('playing');
                icon.innerText = '🔊';
                label.innerText = 'Ouvir Audiodescrição (eMAG 3.0)';
                pauseButton.innerText = isPaused ? '▶ Continuar' : '⏸ Pausar';
                pauseButton.setAttribute('aria-label', isPaused ? 'Continuar áudio' : 'Pausar áudio');
            }}
        }}

        function openScannedCode(e) {{
            e.preventDefault();
            const raw = document.getElementById('next-qr-code').value.trim();
            if (!raw) {{
                setScanStatus('Digite ou escaneie o código da próxima obra.');
                return;
            }}
            let token = raw;
            try {{
                const parsed = new URL(raw);
                token = parsed.searchParams.get('token') || parsed.pathname.split('/').filter(Boolean).pop() || '';
            }} catch (_) {{}}
            if (!token) {{
                setScanStatus('Não reconheci um código válido. Tente novamente.');
                return;
            }}
            stopQrScanner();
            window.location.href = `/api/v1/public/scan/${{encodeURIComponent(token)}}`;
        }}

        function setScanStatus(message) {{
            document.getElementById('scan-status').innerText = message;
        }}

        async function startQrScanner() {{
            const video = document.getElementById('qr-video');
            if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {{
                setScanStatus('A câmera no navegador exige uma conexão HTTPS. Digite o código da placa ou use a câmera do celular para ler o próximo QR Code.');
                document.getElementById('next-qr-code').focus();
                return;
            }}
            if (!('BarcodeDetector' in window)) {{
                setScanStatus('Este navegador não oferece leitura de QR pela página. Digite o código impresso na placa.');
                document.getElementById('next-qr-code').focus();
                return;
            }}
            try {{
                const detector = new BarcodeDetector({{ formats: ['qr_code'] }});
                qrStream = await navigator.mediaDevices.getUserMedia({{ video: {{ facingMode: 'environment' }} }});
                video.srcObject = qrStream;
                video.style.display = 'block';
                await video.play();
                setScanStatus('A câmera está pronta. Aponte para o QR Code da próxima obra.');
                const detect = async () => {{
                    if (!qrStream) return;
                    try {{
                        const codes = await detector.detect(video);
                        if (codes.length && codes[0].rawValue) {{
                            document.getElementById('next-qr-code').value = codes[0].rawValue;
                            openScannedCode(new Event('submit', {{ cancelable: true }}));
                            return;
                        }}
                    }} catch (error) {{
                        setScanStatus('Não foi possível ler o código pela câmera. Digite o código da placa.');
                    }}
                    qrAnimationFrame = requestAnimationFrame(detect);
                }};
                qrAnimationFrame = requestAnimationFrame(detect);
            }} catch (error) {{
                setScanStatus('Não foi possível abrir a câmera. Verifique a permissão do navegador ou digite o código da placa.');
            }}
        }}

        async function decodeQrPhoto(event) {{
            const file = event.target.files?.[0];
            if (!file) return;
            if (!('BarcodeDetector' in window) || !window.createImageBitmap) {{
                setScanStatus('Este navegador não consegue ler QR Codes de uma foto. Digite o código impresso na placa.');
                document.getElementById('next-qr-code').focus();
                return;
            }}
            let image;
            try {{
                const detector = new BarcodeDetector({{ formats: ['qr_code'] }});
                image = await createImageBitmap(file);
                const codes = await detector.detect(image);
                if (!codes.length || !codes[0].rawValue) {{
                    setScanStatus('Não encontrei um QR Code na foto. Tente novamente ou digite o código.');
                    return;
                }}
                document.getElementById('next-qr-code').value = codes[0].rawValue;
                openScannedCode(new Event('submit', {{ cancelable: true }}));
            }} catch (error) {{
                setScanStatus('Não foi possível ler a foto. Digite o código impresso na placa.');
            }} finally {{
                if (image) image.close();
                event.target.value = '';
            }}
        }}

        function stopQrScanner() {{
            if (qrAnimationFrame) cancelAnimationFrame(qrAnimationFrame);
            qrAnimationFrame = null;
            if (qrStream) qrStream.getTracks().forEach(track => track.stop());
            qrStream = null;
            const video = document.getElementById('qr-video');
            if (video) {{
                video.pause();
                video.srcObject = null;
                video.style.display = 'none';
            }}
        }}

        window.addEventListener('pagehide', stopQrScanner);

        async function handleSendQuestion(e) {{
            if (e) e.preventDefault();
            const input = document.getElementById('chat-input');
            const q = input.value.trim();
            if (!q) return;
            input.value = '';
            await processQuestion(q);
        }}

        function askPreset(q) {{
            processQuestion(q);
        }}

        async function processQuestion(q) {{
            const log = document.getElementById('chat-log');
            const btn = document.getElementById('btn-send');
            const status = document.getElementById('chat-status');
            stopAudio(false);

            // Mensagem do usuário
            const userDiv = document.createElement('div');
            userDiv.className = 'chat-bubble user';
            userDiv.innerText = q;
            log.appendChild(userDiv);

            // Mensagem de aguardo
            const botDiv = document.createElement('div');
            botDiv.className = 'chat-bubble bot';
            botDiv.innerText = 'Lumi está preparando uma resposta...';
            log.appendChild(botDiv);
            log.scrollTop = log.scrollHeight;

            btn.disabled = true;
            try {{
                const res = await fetch('/api/v1/public/chat', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{ qr_token: qrToken, question: q, history: chatHistory.slice(-10) }})
                }});
                if (!res.ok) throw new Error(`HTTP ${{res.status}}`);
                const data = await res.json();
                const answer = data.answer || 'Não consegui encontrar essa resposta.';
                botDiv.innerText = answer;
                chatHistory.push({{ role: 'user', text: q }}, {{ role: 'assistant', text: answer }});
                chatHistory = chatHistory.slice(-10);
                status.innerText = 'A resposta da Lumi será lida em voz alta.';

                const replayButton = document.createElement('button');
                replayButton.type = 'button';
                replayButton.className = 'btn-transport';
                replayButton.innerText = 'Ouvir resposta';
                replayButton.setAttribute('aria-label', 'Ouvir resposta da Lumi novamente');
                replayButton.onclick = () => speakText(answer, 'Resposta da Lumi');
                botDiv.appendChild(replayButton);
                speakText(answer, 'Resposta da Lumi');
            }} catch (err) {{
                botDiv.innerText = 'Não consegui consultar a Lumi. Verifique a conexão e tente novamente.';
                status.innerText = botDiv.innerText;
            }} finally {{
                btn.disabled = false;
                log.scrollTop = log.scrollHeight;
            }}
        }}

        function toggleVoiceInput() {{
            if (speechRecognition) {{
                speechRecognition.stop();
                return;
            }}
            const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const status = document.getElementById('voice-status');
            if (!Recognition) {{
                status.innerText = 'O reconhecimento de voz não está disponível neste navegador. Você ainda pode digitar sua pergunta.';
                document.getElementById('chat-input').focus();
                return;
            }}
            speechRecognition = new Recognition();
            speechRecognition.lang = 'pt-BR';
            speechRecognition.interimResults = false;
            speechRecognition.maxAlternatives = 1;
            status.innerText = 'Ouvindo. Fale sua pergunta.';
            document.getElementById('btn-voice').innerText = '⏹ Parar gravação';
            speechRecognition.onresult = event => {{
                const question = event.results[0][0].transcript.trim();
                document.getElementById('chat-input').value = question;
                status.innerText = `Pergunta reconhecida: ${{question}}`;
                speechRecognition = null;
                document.getElementById('btn-voice').innerText = '🎙️ Falar com a Lumi';
                processQuestion(question);
            }};
            speechRecognition.onerror = event => {{
                status.innerText = event.error === 'not-allowed'
                    ? 'Permissão para usar o microfone negada. Digite sua pergunta ou habilite o microfone nas configurações do navegador.'
                    : 'Não foi possível reconhecer a fala. Tente novamente ou digite sua pergunta.';
            }};
            speechRecognition.onend = () => {{
                speechRecognition = null;
                document.getElementById('btn-voice').innerText = '🎙️ Falar com a Lumi';
                if (status.innerText === 'Ouvindo. Fale sua pergunta.') status.innerText = 'Não ouvi uma pergunta. Tente novamente ou digite.';
            }};
            try {{
                speechRecognition.start();
            }} catch (error) {{
                speechRecognition = null;
                document.getElementById('btn-voice').innerText = '🎙️ Falar com a Lumi';
                status.innerText = 'Não foi possível iniciar o microfone. Verifique a permissão do navegador ou digite sua pergunta.';
            }}
        }}
    </script>
</body>
</html>"""

def render_not_found_page(message: str) -> str:
    """Página de erro amigável caso o QR code não exista."""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Obra não encontrada — Lumiar Cultural</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f4f7f8;
            color: #1d2b32;
            padding: 30px 20px;
            text-align: center;
        }}
        .card {{
            max-width: 480px;
            margin: 40px auto;
            background: #fff;
            padding: 36px 24px;
            border-radius: 20px;
            border: 1px solid #dbe5e8;
            box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }}
        h1 {{ font-size: 22px; color: #a13535; margin-bottom: 12px; }}
        p {{ font-size: 15px; color: #55666d; margin-bottom: 24px; }}
        a {{
            display: inline-block;
            background: #23748b;
            color: #fff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 700;
        }}
    </style>
</head>
<body>
    <div class="card">
        <h1>🔍 Obra não localizada</h1>
        <p>{html.escape(message)}</p>
        <p>Verifique se o código QR escaneado pertence a uma exposição ativa.</p>
    </div>
</body>
</html>"""

@router.get('/scan/{qr_token}')
@router.get('/scan')
def public_scan_item(
    request: Request,
    qr_token: Optional[str] = None,
    token: Optional[str] = Query(None),
    format: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Endpoint inteligente de leitura de QR Code.
    - Se chamado por um navegador (câmera do celular), entrega uma interface web completa e acessível em HTML5 (eMAG 3.0).
    - Se chamado pelo App Mobile (Flutter) ou com format=json, entrega a resposta em JSON.
    """
    actual_token = (qr_token or token or "").strip()
    if not actual_token:
        if "text/html" in request.headers.get("accept", "") and format != "json":
            return HTMLResponse(content=render_not_found_page("Nenhum código de QR Code foi fornecido."), status_code=400)
        raise HTTPException(400, "Token do QR Code não informado")

    item = db.query(CulturalItem).filter_by(qr_token=actual_token, active=True).first()
    if not item:
        if "text/html" in request.headers.get("accept", "") and format != "json":
            return HTMLResponse(content=render_not_found_page(f"Obra com código '{actual_token}' não localizada no acervo."), status_code=404)
        raise HTTPException(404, 'Item não encontrado ou QR Code inválido')

    # Incrementa contador de visitação
    item.scan_count += 1
    db.commit()

    org = item.organization
    space = item.space

    title = fix_mojibake(item.title)
    author = fix_mojibake(item.author)
    category = fix_mojibake(item.category)
    short_desc = fix_mojibake(item.short_description)
    audio_desc = fix_mojibake(item.audio_description or 'Audiodescrição em elaboração pela curadoria do museu.')
    space_name = fix_mojibake(space.name if space else 'Exposição Geral')
    org_name = fix_mojibake(org.name if org else 'Lumiar Cultural')

    item_data = {
        'id': item.id,
        'code': item.code,
        'title': title,
        'author': author,
        'year': item.year,
        'category': category,
        'image_url': item.image_url,
        'audio_url': item.audio_url,
        'short_description': short_desc,
        'audio_description': audio_desc,
        'is_reviewed': item.is_reviewed,
        'space': {
            'id': space.id if space else None,
            'name': space_name
        } if space else None,
        'organization': {
            'id': org.id if org else None,
            'name': org_name,
            'slug': org.slug if org else ''
        }
    }

    # Se for uma requisição explícita do App Flutter (JSON)
    accept = request.headers.get("accept", "")
    if format == "json" or ("application/json" in accept and "text/html" not in accept):
        return JSONResponse(content=item_data, media_type="application/json; charset=utf-8")

    # Se for aberto por um navegador móvel (câmera do celular escaneou a placa)
    return HTMLResponse(
        content=render_visitor_mobile_page(item_data, actual_token),
        media_type="text/html; charset=utf-8"
    )

@router.get('/qr/{qr_token}')
def public_qr_code(qr_token: str, db: Session = Depends(get_db)):
    """Entrega a imagem do QR para placas públicas, sem exigir sessão administrativa."""
    item = db.query(CulturalItem).filter_by(qr_token=qr_token, active=True).first()
    if not item:
        raise HTTPException(404, 'QR Code inválido')

    visit_url = f"{settings.mobile_app_url.rstrip('/')}/{item.qr_token}"
    return Response(content=generate_qr_code_png(visit_url), media_type='image/png')

@router.post('/chat', response_model=ChatResponse)
async def public_chat_with_lumi(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Assistente virtual 'Lumi' para tirar dúvidas do visitante sobre a obra via voz/texto.
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(422, 'A pergunta não pode estar vazia')

    item = db.query(CulturalItem).filter_by(qr_token=payload.qr_token.strip(), active=True).first()
    if not item:
        raise HTTPException(404, 'Obra de referência não localizada')

    org_name = fix_mojibake(item.organization.name if item.organization else "Espaço Cultural")
    title = fix_mojibake(item.title)
    desc = fix_mojibake(item.audio_description or item.short_description or "")
    
    # Agrega contexto documental associado
    docs_text = "\n".join([fix_mojibake(d.extracted_text) for d in item.documents if d.extracted_text])

    answer = await ask_lumi_assistant(
        question=question,
        item_title=title,
        item_description=desc,
        item_docs_text=docs_text,
        org_name=org_name,
        conversation_history=[
            turn.model_dump() for turn in payload.history
        ]
    )

    return ChatResponse(
        answer=fix_mojibake(answer),
        item_title=title,
        organization_name=org_name
    )

@router.get('/organization/{slug}/offline-pack')
def get_offline_guide_pack(slug: str, db: Session = Depends(get_db)):
    """
    Permite ao app mobile baixar o guia completo da instituição para navegação 100% offline.
    """
    org = db.query(Organization).filter_by(slug=slug, active=True).first()
    if not org:
        raise HTTPException(404, 'Organização não encontrada')

    items = db.query(CulturalItem).filter_by(organization_id=org.id, active=True).all()
    spaces = db.query(CulturalSpace).filter_by(organization_id=org.id, active=True).all()

    return JSONResponse(
        content={
            'organization': {
                'id': org.id,
                'name': fix_mojibake(org.name),
                'slug': org.slug
            },
            'spaces': [
                {'id': s.id, 'name': fix_mojibake(s.name), 'description': fix_mojibake(s.description)}
                for s in spaces
            ],
            'items': [
                {
                    'id': x.id,
                    'code': x.code,
                    'title': fix_mojibake(x.title),
                    'category': fix_mojibake(x.category),
                    'audio_description': fix_mojibake(x.audio_description),
                    'short_description': fix_mojibake(x.short_description),
                    'qr_token': x.qr_token,
                    'space_id': x.space_id,
                    'image_url': x.image_url
                }
                for x in items
            ]
        },
        media_type="application/json; charset=utf-8"
    )
