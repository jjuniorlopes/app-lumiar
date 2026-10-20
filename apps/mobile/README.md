# Lumiar Mobile — Aplicativo do Visitante

Aplicativo mobile multiplataforma (Android & iOS) desenvolvido em **Flutter** para garantir acessibilidade sensorial plena a pessoas com deficiência visual (cegueira total e baixa visão) em museus, centros culturais e espaços públicos.

---

## 🚀 Recursos do Aplicativo

| Recurso | Detalhes Técnicos |
|---|---|
| 📷 **Leitor de QR Code Rápido** | `mobile_scanner` com detecção instantânea, lanterna integrada e decodificação de URLs / tokens |
| 📳 **Orientação Háptica** | `HapticFeedback.heavyImpact()` quando o código é enquadrado pela câmera |
| 🎙️ **Audiodescrição eMAG 3.0** | Leitura automática por `flutter_tts` em pt-BR, com controle de velocidade (0.8x a 2.0x) |
| 🗣️ **Chat por Voz com a Lumi** | Reconhecimento de fala em pt-BR, revisão do texto reconhecido antes do envio e leitura das respostas com controles de pausa e repetição |
| 📴 **Modo 100% Offline** | Download prévio do acervo do museu para visitas em subsolos ou prédios sem sinal 4G/5G |
| ♿ **Conformidade de Acessibilidade** | Tela inicial com ações descritas, árvore de semântica para **TalkBack** e **VoiceOver**, alvos táteis amplos e alto contraste |

## Uso acessível

- A tela inicial não ativa a câmera automaticamente. Escolha **Começar visita** para escanear um QR Code ou informar o código da obra.
- Depois de identificar uma obra, a audiodescrição é apresentada em texto e por voz, e a opção **Tirar dúvidas com a Lumi** abre o chat contextualizado.
- No chat, a fala reconhecida fica no campo de texto para revisão. Toque em **Enviar pergunta** para consultar a assistente; uma falha de rede é informada em texto e voz.
- A disponibilidade e a qualidade do reconhecimento de fala dependem do aparelho, do sistema operacional, das permissões de microfone e, em alguns dispositivos, da conexão com a internet.
- Ao usar a versão Flutter Web no celular, abra o app por uma conexão **HTTPS** e autorize o microfone no navegador. Navegar por um endereço HTTP com o IP local do computador (por exemplo, `http://192.168.x.x`) faz navegadores bloquearem o microfone; HTTP só é considerado seguro em `localhost` no próprio dispositivo. A disponibilidade do reconhecimento também depende do suporte do navegador.
- Use leitores de tela nativos e ampliação de texto do sistema. A validação final de acessibilidade deve incluir testes com pessoas cegas e com baixa visão em dispositivos reais.

---

## 🛠️ Como Executar

### Pré-requisitos
- Flutter SDK instalado (3.2.0+)
- Emulador Android / iOS ou dispositivo físico conectado via USB com depuração ativada

### Execução no Emulador Android:
```bash
cd apps/mobile
flutter pub get
flutter run
```

> 💡 **Nota de Conexão com o Backend Local:**
> No Emulador Android, o endereço `10.0.2.2:8001` aponta automaticamente para o `localhost:8001` da sua máquina Windows onde o Docker está rodando.
> Para abrir o QR Code pela câmera de um celular físico, conecte computador e telefone à mesma rede Wi-Fi e configure `MOBILE_APP_URL` no `.env` como `http://<IP-DA-MAQUINA>:8001/api/v1/public/scan` (por exemplo, `http://192.168.1.50:8001/api/v1/public/scan`). Reinicie o serviço da API e gere/escaneie novamente o QR Code. O visitante abre a página acessível no navegador; a instalação do app não é necessária. Libere as portas 8000/8001 no firewall local, se solicitado.
> Para que o app Flutter acesse o backend local em um aparelho físico, configure também `API_BASE_URL` no build do Flutter com `http://<IP-DA-MAQUINA>:8001/api/v1`.
