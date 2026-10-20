import 'package:flutter/material.dart';
import '../models/cultural_item.dart';
import '../services/tts_service.dart';
import 'lumi_chat_screen.dart';

class ItemDetailScreen extends StatefulWidget {
  final CulturalItemModel item;
  final String qrToken;

  const ItemDetailScreen({
    super.key,
    required this.item,
    required this.qrToken,
  });

  @override
  State<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends State<ItemDetailScreen> {
  bool _isPlaying = false;
  bool _isPaused = false;
  String _audioStatus = '';
  double _rate = 0.5;

  @override
  void initState() {
    super.initState();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialSpeechChecked) {
      _initialSpeechChecked = true;
      if (!MediaQuery.of(context).accessibleNavigation) {
        _playAudioDescription();
      }
    }
  }

  @override
  void dispose() {
    TtsService.stop();
    super.dispose();
  }

  bool _initialSpeechChecked = false;

  Future<void> _playAudioDescription() async {
    setState(() {
      _isPlaying = true;
      _isPaused = false;
    });
    final didSpeak = await TtsService.speak(widget.item.audioDescription);
    if (!mounted) return;
    setState(() {
      _isPlaying = false;
      _audioStatus = didSpeak
          ? ''
          : 'Não foi possível iniciar o áudio. Use a leitura de tela do aparelho para ouvir o texto da audiodescrição.';
    });
  }

  Future<void> _togglePlayPause() async {
    if (_isPlaying) {
      final didPause = await TtsService.pause();
      if (!mounted) return;
      setState(() {
        _isPlaying = !didPause;
        _isPaused = didPause;
        _audioStatus = didPause
            ? ''
            : 'Não foi possível pausar o áudio. Você ainda pode usar os controles de áudio do aparelho.';
      });
    } else if (_isPaused) {
      setState(() {
        _isPlaying = true;
        _isPaused = false;
      });
      final didSpeak = await TtsService.resume(widget.item.audioDescription);
      if (!mounted) return;
      setState(() {
        _isPlaying = false;
        _audioStatus = didSpeak
            ? ''
            : 'Não foi possível iniciar o áudio. Use a leitura de tela do aparelho para ouvir o texto da audiodescrição.';
      });
    } else {
      await _playAudioDescription();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.item.code),
        backgroundColor: const Color(0xFF1E2A30),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: "Repetir audiodescrição",
            onPressed: _playAudioDescription,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Cabeçalho da Instituição e Espaço
            Semantics(
              header: true,
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF4F6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.item.organizationName.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF24748B),
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.item.spaceName,
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1E2A30)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Título Principal
            Semantics(
              label: "Obra: ${widget.item.title}",
              child: Text(
                widget.item.title,
                style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E2A30)),
              ),
            ),
            if (widget.item.author != null) ...[
              const SizedBox(height: 6),
              Text(
                "${widget.item.author} ${widget.item.year != null ? '(${widget.item.year})' : ''}",
                style: const TextStyle(fontSize: 15, color: Color(0xFF62737B)),
              ),
            ],

            const SizedBox(height: 24),

            // Cartão de Controle do Áudio (eMAG 3.0)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F7F8),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFD9E4E7)),
              ),
              child: Column(
                children: [
                  Semantics(
                    button: true,
                    label: _isPlaying
                        ? "Pausar audiodescrição"
                        : _isPaused
                            ? "Continuar audiodescrição desde o início"
                            : "Ouvir audiodescrição",
                    child: ElevatedButton.icon(
                      onPressed: _togglePlayPause,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isPlaying
                            ? const Color(0xFFA13535)
                            : const Color(0xFF24748B),
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(54),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: Icon(
                          _isPlaying
                              ? Icons.pause_circle_filled
                              : _isPaused
                                  ? Icons.play_circle_fill
                                  : Icons.volume_up,
                          size: 26),
                      label: Text(
                        _isPlaying
                            ? "Pausar Audiodescrição"
                            : _isPaused
                                ? "Recomeçar Audiodescrição"
                                : "Ouvir Audiodescrição (eMAG)",
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Ajuste de Velocidade
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Velocidade:",
                          style: TextStyle(
                              fontSize: 13, color: Color(0xFF55666D))),
                      Wrap(
                        spacing: 8,
                        children: [0.4, 0.5, 0.6, 0.7].map((r) {
                          final isCurrent = (r - _rate).abs() < 0.05;
                          return ChoiceChip(
                            label: Text("${(r * 2).toStringAsFixed(1)}x"),
                            selected: isCurrent,
                            onSelected: (selected) {
                              if (selected) {
                                setState(() => _rate = r);
                                TtsService.setRate(r);
                                if (_isPlaying) _playAudioDescription();
                              }
                            },
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (_audioStatus.isNotEmpty)
              Semantics(
                liveRegion: true,
                child: Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child:
                      Text(_audioStatus, style: const TextStyle(fontSize: 16)),
                ),
              ),

            const SizedBox(height: 20),

            // Texto da Audiodescrição para leitura visual e TalkBack
            Semantics(
              label:
                  "Texto completo da audiodescrição: ${widget.item.audioDescription}",
              child: Text(
                widget.item.audioDescription,
                style: const TextStyle(
                    fontSize: 16, height: 1.6, color: Color(0xFF243238)),
              ),
            ),

            const SizedBox(height: 32),

            // Botão para Conversar com a Especialista Virtual Lumi
            Semantics(
              button: true,
              label: "Abrir conversa por voz com a assistente virtual Lumi",
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => LumiChatScreen(
                        itemTitle: widget.item.title,
                        qrToken: widget.qrToken,
                      ),
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: Color(0xFF24748B), width: 2),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.chat_bubble_outline,
                    color: Color(0xFF24748B)),
                label: const Text(
                  "Tirar Dúvidas com a Lumi (IA)",
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF24748B)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
