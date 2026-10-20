import 'package:flutter/material.dart';
import 'offline_guides_screen.dart';
import 'scanner_screen.dart';

class VisitorHomeScreen extends StatelessWidget {
  const VisitorHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lumiar Cultural'),
        backgroundColor: const Color(0xFF1E2A30),
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Semantics(
              header: true,
              child: Text(
                'Acessibilidade para sua visita',
                style: TextStyle(
                  fontSize: 28,
                  height: 1.2,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E2A30),
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Identifique uma obra para ouvir sua audiodescrição e conversar com a Lumi.',
              style: TextStyle(
                  fontSize: 18, height: 1.5, color: Color(0xFF1E2A30)),
            ),
            const SizedBox(height: 28),
            _HomeAction(
              icon: Icons.qr_code_scanner,
              title: 'Começar visita',
              description: 'Escanear um código ou informar o código da obra.',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ScannerScreen()),
              ),
            ),
            const SizedBox(height: 16),
            _HomeAction(
              icon: Icons.download_for_offline,
              title: 'Guias offline',
              description:
                  'Baixar ou acessar o catálogo de um espaço cultural.',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const OfflineGuidesScreen()),
              ),
            ),
            const SizedBox(height: 24),
            Semantics(
              label:
                  'A assistente Lumi fica disponível depois que você identificar uma obra. Na tela da obra, escolha Tirar dúvidas com a Lumi.',
              excludeSemantics: true,
              child: Card(
                color: Color(0xFFEAF4F6),
                child: Padding(
                  padding: EdgeInsets.all(18),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.record_voice_over, color: Color(0xFF1E2A30)),
                      SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          'A Lumi pode responder perguntas sobre a obra. Identifique uma obra primeiro para começar a conversa.',
                          style: TextStyle(
                              fontSize: 16,
                              height: 1.5,
                              color: Color(0xFF1E2A30)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeAction extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onPressed;

  const _HomeAction({
    required this.icon,
    required this.title,
    required this.description,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$title. $description',
      onTap: onPressed,
      child: ExcludeSemantics(
        child: OutlinedButton(
          onPressed: onPressed,
          style: OutlinedButton.styleFrom(
            alignment: Alignment.centerLeft,
            padding: const EdgeInsets.all(20),
            minimumSize: const Size.fromHeight(88),
            side: const BorderSide(color: Color(0xFF24748B), width: 2),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: Row(
            children: [
              Icon(icon, size: 32, color: const Color(0xFF24748B)),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(description,
                        style: const TextStyle(fontSize: 16, height: 1.35)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
