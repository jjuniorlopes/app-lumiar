import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../services/api_service.dart';
import '../services/tts_service.dart';

class LumiChatScreen extends StatefulWidget {
  final String itemTitle;
  final String qrToken;

  const LumiChatScreen({
    super.key,
    required this.itemTitle,
    required this.qrToken,
  });

  @override
  State<LumiChatScreen> createState() => _LumiChatScreenState();
}

class _LumiChatScreenState extends State<LumiChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, String>> _messages = [];
  late final stt.SpeechToText _speech;
  bool _isLoading = false;
  bool _isListening = false;
  bool _isStartingListening = false;
  bool _speechAvailable = false;
  bool _speechInitialized = false;
  Future<bool>? _speechInitialization;
  bool _isSpeaking = false;
  bool _isPaused = false;
  String _status =
      'A Lumi está pronta. Faça uma pergunta por voz ou digite sua mensagem.';
  String? _lastAnswer;

  @override
  void initState() {
    super.initState();
    _speech = stt.SpeechToText();
    _messages.add({
      'role': 'lumi',
      'text':
          'Olá! Sou a Lumi, sua guia virtual. O que você gostaria de saber sobre "${widget.itemTitle}"?'
    });
    if (kIsWeb) {
      unawaited(_initializeSpeech());
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _speech.cancel();
    TtsService.stop();
    super.dispose();
  }

  Future<void> _listen() async {
    if (_isLoading) return;
    if (_isListening) {
      await _speech.stop();
      if (!mounted) return;
      setState(() {
        _isListening = false;
        _status = _controller.text.trim().isEmpty
            ? 'Não foi reconhecida uma pergunta. Tente novamente ou digite sua mensagem.'
            : 'Texto reconhecido. Revise a pergunta e escolha Enviar pergunta.';
      });
      return;
    }
    if (_isStartingListening) return;

    if (!_hasSecureMicrophoneContext) {
      setState(() => _status =
          'O navegador bloqueia o microfone nesta conexão. Abra o app por HTTPS e permita o acesso ao microfone nas configurações do navegador.');
      return;
    }

    setState(() {
      _isStartingListening = true;
      _status = 'Preparando o microfone.';
    });
    try {
      final available = await _initializeSpeech();
      if (!mounted) return;
      if (!available) {
        setState(() => _status =
            'O reconhecimento de fala não está disponível ou o acesso ao microfone foi negado. Verifique as permissões do aparelho ou navegador e tente novamente.');
        return;
      }

      if (_isSpeaking || _isPaused) {
        if (kIsWeb) {
          unawaited(TtsService.stop());
        } else {
          await TtsService.stop();
        }
      }
      if (!mounted) return;
      setState(() {
        _controller.clear();
        _isListening = true;
        _status =
            'O microfone está ouvindo. Faça sua pergunta e toque em Parar gravação quando terminar.';
      });
      await _speech.listen(
        listenOptions: stt.SpeechListenOptions(
          localeId: 'pt_BR',
          listenFor: const Duration(seconds: 30),
          pauseFor: const Duration(seconds: 4),
          partialResults: true,
        ),
        onResult: (result) {
          if (!mounted) return;
          setState(() {
            _controller.text = result.recognizedWords;
            if (result.finalResult) {
              _isListening = false;
              _status = result.recognizedWords.trim().isEmpty
                  ? 'Não foi reconhecida uma pergunta. Tente novamente ou digite sua mensagem.'
                  : 'Texto reconhecido. Revise a pergunta e escolha Enviar pergunta.';
            }
          });
        },
      );
    } on PlatformException catch (error) {
      if (!mounted) return;
      setState(() {
        _isListening = false;
        _status = _microphoneErrorMessage(error.message ?? error.code);
      });
    } on Exception catch (error) {
      if (!mounted) return;
      setState(() {
        _isListening = false;
        _status = _microphoneErrorMessage(error.toString());
      });
    } finally {
      if (mounted) {
        setState(() => _isStartingListening = false);
      }
    }
  }

  bool get _hasSecureMicrophoneContext {
    if (!kIsWeb) return true;
    final uri = Uri.base;
    final isLocalhost = uri.host == 'localhost' ||
        uri.host == '127.0.0.1' ||
        uri.host == '::1' ||
        uri.host == '[::1]' ||
        uri.host.endsWith('.localhost');
    return uri.scheme == 'https' || isLocalhost;
  }

  String _microphoneErrorMessage(String error) {
    final normalized = error.toLowerCase();
    if (normalized.contains('not-allowed') ||
        normalized.contains('permission') ||
        normalized.contains('denied') ||
        normalized.contains('service-not-allowed')) {
      return 'O acesso ao microfone foi bloqueado. Permita o uso do microfone nas configurações do navegador ou do aparelho e tente novamente.';
    }
    if (normalized.contains('audio-capture') ||
        normalized.contains('microphone')) {
      return 'Não foi encontrado um microfone disponível. Verifique o microfone do aparelho e tente novamente.';
    }
    if (normalized.contains('network')) {
      return 'O reconhecimento de voz precisa de conexão com a internet neste aparelho. Verifique a conexão e tente novamente.';
    }
    if (normalized.contains('no-speech') || normalized.contains('no speech')) {
      return 'Nenhuma fala foi detectada. Toque no microfone e fale após ouvir a indicação de gravação.';
    }
    if (normalized.contains('not supported') ||
        normalized.contains('speech_not_supported')) {
      return 'Este navegador ou aparelho não oferece reconhecimento de fala. Use um navegador compatível ou digite sua pergunta.';
    }
    return 'Não foi possível iniciar o microfone. Verifique as permissões do aparelho ou navegador e tente novamente.';
  }

  Future<bool> _initializeSpeech() async {
    if (_speechInitialized) return _speechAvailable;

    final pendingInitialization = _speechInitialization;
    if (pendingInitialization != null) return pendingInitialization;

    final initialization = _speech.initialize(
      onStatus: (status) {
        if (!mounted) return;
        if (status == 'listening') {
          setState(() {
            _isStartingListening = false;
            _isListening = true;
            _status = 'O microfone está ouvindo. Faça sua pergunta.';
          });
        } else if (status == 'done' || status == 'notListening') {
          setState(() {
            _isListening = false;
            _status = _controller.text.trim().isNotEmpty
                ? 'Texto reconhecido. Revise a pergunta e escolha Enviar pergunta.'
                : 'Não foi reconhecida uma pergunta. Tente novamente ou digite sua mensagem.';
          });
        }
      },
      onError: (error) {
        if (!mounted) return;
        setState(() {
          _isStartingListening = false;
          _isListening = false;
          _status = _microphoneErrorMessage(error.errorMsg);
        });
      },
    );
    _speechInitialization = initialization;
    try {
      final available = await initialization;
      _speechAvailable = available;
      _speechInitialized = available;
      return available;
    } on Exception catch (error) {
      _speechAvailable = false;
      if (mounted) {
        setState(() => _status = _microphoneErrorMessage(error.toString()));
      }
      return false;
    } finally {
      _speechInitialization = null;
    }
  }

  Future<void> _sendMessage([String? quickQuestion]) async {
    if (_isLoading) return;
    final text = (quickQuestion ?? _controller.text).trim();
    if (text.isEmpty) {
      setState(() => _status = 'Digite ou dite uma pergunta antes de enviar.');
      return;
    }
    if (_isListening) await _speech.stop();
    await TtsService.stop();

    setState(() {
      _isListening = false;
      _isSpeaking = false;
      _isPaused = false;
      _messages.add({'role': 'user', 'text': text});
      _isLoading = true;
      _status = 'Enviando sua pergunta para a Lumi.';
      _controller.clear();
    });

    try {
      final answer =
          await ApiService.askLumi(qrToken: widget.qrToken, question: text);
      if (!mounted) return;
      setState(() {
        _messages.add({'role': 'lumi', 'text': answer});
        _lastAnswer = answer;
        _status = 'A Lumi respondeu. A resposta será lida em voz alta.';
        _isSpeaking = true;
        _isLoading = false;
      });
      final didSpeak = await TtsService.speak(answer);
      if (!mounted) return;
      setState(() {
        _isSpeaking = false;
        _isPaused = false;
        _status = didSpeak
            ? 'Resposta concluída. Você pode perguntar novamente.'
            : 'A resposta está disponível em texto, mas não foi possível iniciar o áudio. Use a leitura de tela do aparelho.';
      });
    } on Exception {
      if (!mounted) return;
      final message =
          'Não consegui consultar a Lumi. Verifique a conexão e tente novamente, ou ouça a audiodescrição da obra.';
      setState(() {
        _messages.add({'role': 'lumi', 'text': message});
        _status = 'A Lumi não conseguiu responder. $message';
      });
      await TtsService.speak(message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleSpeech() async {
    if (_isPaused) {
      final answer = _lastAnswer;
      if (answer == null) return;
      setState(() {
        _isPaused = false;
        _isSpeaking = true;
        _status = 'Reproduzindo a resposta da Lumi.';
      });
      final didSpeak = await TtsService.resume(answer);
      if (!mounted) return;
      setState(() {
        _isSpeaking = false;
        _isPaused = false;
        _status = didSpeak
            ? 'Resposta concluída. Você pode perguntar novamente.'
            : 'Não foi possível iniciar o áudio. Use a leitura de tela do aparelho.';
      });
    } else if (_isSpeaking) {
      final didPause = await TtsService.pause();
      if (!mounted) return;
      setState(() {
        _isSpeaking = !didPause;
        _isPaused = didPause;
        _status = didPause
            ? 'Resposta pausada. Você pode ouvir a resposta novamente desde o início.'
            : 'Não foi possível pausar o áudio. Você ainda pode usar os controles do aparelho.';
      });
    } else if (_lastAnswer != null) {
      setState(() {
        _isSpeaking = true;
        _status = 'Lendo novamente a última resposta.';
      });
      final didSpeak = await TtsService.speak(_lastAnswer!);
      if (!mounted) return;
      setState(() {
        _isSpeaking = false;
        _status = didSpeak
            ? 'Resposta concluída. Você pode perguntar novamente.'
            : 'Não foi possível iniciar o áudio. Use a leitura de tela do aparelho.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final canControlAnswer = _isSpeaking || _isPaused || _lastAnswer != null;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Conversar com a Lumi'),
        backgroundColor: const Color(0xFF1E2A30),
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Semantics(
              liveRegion: true,
              child: Container(
                alignment: Alignment.centerLeft,
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: const Color(0xFFEAF4F6),
                child: Text(_status,
                    style: const TextStyle(fontSize: 16, height: 1.4)),
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final message = _messages[index];
                  final isUser = message['role'] == 'user';
                  return Semantics(
                    label:
                        '${isUser ? 'Você' : 'Lumi'}: ${message['text'] ?? ''}',
                    child: ExcludeSemantics(
                      child: Align(
                        alignment: isUser
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isUser
                                ? const Color(0xFF24748B)
                                : const Color(0xFFEDF2F4),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.85,
                          ),
                          child: Text(
                            message['text'] ?? '',
                            style: TextStyle(
                              fontSize: 17,
                              height: 1.5,
                              color: isUser
                                  ? Colors.white
                                  : const Color(0xFF1E2A30),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            if (canControlAnswer)
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: OutlinedButton.icon(
                  onPressed: _toggleSpeech,
                  icon: Icon(_isPaused
                      ? Icons.play_arrow
                      : _isSpeaking
                          ? Icons.pause
                          : Icons.replay),
                  label: Text(_isPaused
                      ? 'Ouvir novamente desde o início'
                      : _isSpeaking
                          ? 'Pausar resposta'
                          : 'Ouvir resposta novamente'),
                  style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(48)),
                ),
              ),
            if (_isLoading)
              Padding(
                padding: EdgeInsets.all(8),
                child: Semantics(
                  liveRegion: true,
                  child: Text('A Lumi está pensando. Aguarde.'),
                ),
              ),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Row(
                children: [
                  ActionChip(
                    label: const Text('Para que servia?'),
                    onPressed: _isLoading
                        ? null
                        : () => _sendMessage('Para que servia esta peça?'),
                  ),
                  const SizedBox(width: 8),
                  ActionChip(
                    label: const Text('Qual o material?'),
                    onPressed: _isLoading
                        ? null
                        : () => _sendMessage('De que material ela é feita?'),
                  ),
                  const SizedBox(width: 8),
                  ActionChip(
                    label: const Text('Qual a época?'),
                    onPressed: _isLoading
                        ? null
                        : () =>
                            _sendMessage('Qual é o ano e a época desta obra?'),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon:
                            Icon(_isListening ? Icons.stop_circle : Icons.mic),
                        color: _isListening
                            ? Colors.red.shade800
                            : const Color(0xFF24748B),
                        iconSize: 32,
                        tooltip:
                            _isListening ? 'Parar gravação' : 'Falar pergunta',
                        onPressed:
                            _isLoading || _isStartingListening ? null : _listen,
                      ),
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          minLines: 1,
                          maxLines: 4,
                          textInputAction: TextInputAction.send,
                          decoration: const InputDecoration(
                            labelText: 'Sua pergunta',
                            hintText: 'Digite ou dite sua pergunta para a Lumi',
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (_) => _sendMessage(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.send),
                        color: const Color(0xFF24748B),
                        tooltip: 'Enviar pergunta',
                        onPressed: _isLoading ? null : () => _sendMessage(),
                      ),
                    ],
                  ),
                  if (_speechAvailable && !_isListening)
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: EdgeInsets.only(left: 8, top: 4),
                        child: Text(
                          'Revise o texto reconhecido antes de enviar.',
                          style: TextStyle(fontSize: 14),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
