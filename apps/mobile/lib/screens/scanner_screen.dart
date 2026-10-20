import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/api_service.dart';
import '../services/tts_service.dart';
import 'item_detail_screen.dart';
import 'offline_guides_screen.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _isProcessing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  static Map<String, String?> _extractTokenAndHost(String raw) {
    String clean = raw.trim();
    String token = clean;
    String? host;

    try {
      final uri = Uri.parse(clean);
      if (uri.hasScheme && uri.hasAuthority) {
        host = '${uri.scheme}://${uri.authority}/api/v1';
      }
      if (uri.queryParameters.containsKey('token')) {
        token = uri.queryParameters['token']!.trim();
      } else if (uri.pathSegments.isNotEmpty) {
        token = uri.pathSegments.last.trim();
      }
    } catch (_) {
      if (clean.contains('token=')) {
        token = clean.split('token=').last.split('&').first.trim();
      } else if (clean.contains('/scan/')) {
        token = clean.split('/scan/').last.split('?').first.trim();
      }
    }
    return {'token': token, 'host': host};
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? rawValue = barcodes.first.rawValue;
    if (rawValue == null || rawValue.isEmpty) return;

    final parsed = _extractTokenAndHost(rawValue);
    final String token = parsed['token'] ?? rawValue.trim();
    final String? host = parsed['host'];

    _processToken(token, explicitHost: host);
  }

  Future<void> _processToken(String token, {String? explicitHost}) async {
    if (_isProcessing || token.isEmpty) return;
    setState(() => _isProcessing = true);

    try {
      HapticFeedback.heavyImpact();
    } catch (_) {}

    TtsService.speak("Obra detectada. Carregando informações.");

    try {
      final item = await ApiService.scanItem(token, explicitHost: explicitHost);

      if (!mounted) return;
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ItemDetailScreen(item: item, qrToken: token),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      final errorMsg = e.toString().replaceAll('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMsg),
          backgroundColor: Colors.redAccent,
          duration: const Duration(seconds: 4),
        ),
      );
      TtsService.speak("Não foi possível carregar esta obra. Tente novamente.");
    } finally {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _isProcessing = false);
      });
    }
  }

  void _showManualInputDialog() {
    final textController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Digitar Token / Código"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Digite o código ou token da obra do acervo:",
              style: TextStyle(fontSize: 13, color: Colors.black54),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: textController,
              autofocus: true,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: "Ex: embasa-valvula-001",
                isDense: true,
              ),
              onSubmitted: (val) {
                Navigator.pop(ctx);
                _processToken(val.trim());
              },
            ),
            const SizedBox(height: 14),
            const Text(
              "Obras de demonstração cadastradas:",
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.black45),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                ActionChip(
                  label: const Text("Válvula (MS-001)",
                      style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _processToken("embasa-valvula-001");
                  },
                ),
                ActionChip(
                  label: const Text("Hidrômetro (MS-002)",
                      style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _processToken("embasa-hidrometro-002");
                  },
                ),
                ActionChip(
                  label: const Text("Grito Ipiranga (MS-004)",
                      style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _processToken("bb844b9856d64012");
                  },
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancelar"),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _processToken(textController.text.trim());
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF24748B),
                foregroundColor: Colors.white),
            child: const Text("Buscar Obra"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Lumiar Cultural"),
        backgroundColor: const Color(0xFF1E2A30),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.keyboard),
            tooltip: "Digitar Código / Simular",
            onPressed: _showManualInputDialog,
          ),
          IconButton(
            icon: const Icon(Icons.download_for_offline),
            tooltip: "Guias Offline",
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const OfflineGuidesScreen()),
              );
            },
          ),
          if (!kIsWeb)
            IconButton(
              icon: const Icon(Icons.flash_on),
              tooltip: "Ligar Lanterna",
              onPressed: () => _controller.toggleTorch(),
            ),
        ],
      ),
      body: Stack(
        children: [
          ExcludeSemantics(
            child: MobileScanner(
              controller: _controller,
              onDetect: _onDetect,
            ),
          ),

          // Guia visual e acessível de enquadramento
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF24748B), width: 4),
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),

          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      "Localizando obra e audiodescrição...",
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),

          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Semantics(
              liveRegion: true,
              label:
                  "Aponte a câmera para o QR Code da obra. Você também pode digitar o código usando o botão Digitar código na parte superior da tela.",
              child: Container(
                padding:
                    const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      "Aponte a câmera para o QR Code da obra.\nOu clique no ícone de teclado acima para digitar.",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          height: 1.35),
                    ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: _showManualInputDialog,
                      icon: const Icon(Icons.touch_app,
                          size: 18, color: Color(0xFF68C5DB)),
                      label: const Text("Digitar / Escolher Obra de Teste",
                          style: TextStyle(color: Color(0xFF68C5DB))),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
