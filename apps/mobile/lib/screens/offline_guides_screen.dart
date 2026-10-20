import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/tts_service.dart';

class OfflineGuidesScreen extends StatefulWidget {
  const OfflineGuidesScreen({super.key});

  @override
  State<OfflineGuidesScreen> createState() => _OfflineGuidesScreenState();
}

class _OfflineGuidesScreenState extends State<OfflineGuidesScreen> {
  bool _isDownloading = false;
  String _status = "Baixe o catálogo do museu para navegar sem internet.";
  final TextEditingController _slugController = TextEditingController();

  @override
  void dispose() {
    _slugController.dispose();
    super.dispose();
  }

  void _download(String slug, String name) async {
    setState(() {
      _isDownloading = true;
      _status = "Baixando guia de $name...";
    });

    try {
      final count = await ApiService.downloadOfflinePack(slug);
      setState(() {
        _status = "Guia de $name baixado com sucesso! $count itens disponíveis offline.";
      });
      await TtsService.speak("Guia de $name baixado com sucesso. Você pode escanear mesmo sem sinal de internet.");
    } catch (e) {
      setState(() {
        _status = "Erro ao baixar guia: $e";
      });
      await TtsService.speak("Erro ao baixar o guia offline.");
    } finally {
      setState(() => _isDownloading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Guias Offline"),
        backgroundColor: const Color(0xFF1E2A30),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF4F6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _status,
                style: const TextStyle(fontSize: 15, color: Color(0xFF1E2A30), height: 1.4),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              "Baixar catálogo de uma organização",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _slugController,
              textInputAction: TextInputAction.done,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                labelText: 'Slug da organização',
                hintText: 'Ex.: museu-da-cidade',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              icon: _isDownloading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.download),
              label: const Text("Baixar guia offline"),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF24748B),
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(50),
              ),
              onPressed: _isDownloading || _slugController.text.trim().isEmpty
                  ? null
                  : () => _download(_slugController.text.trim(), _slugController.text.trim()),
            ),
          ],
        ),
      ),
    );
  }
}

