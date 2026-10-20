import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  static final FlutterTts _flutterTts = FlutterTts();
  static bool _isInitialized = false;
  static double _currentRate = 0.5; // taxa padrão equilibrada em pt-BR

  static Future<bool> init() async {
    if (_isInitialized) return true;
    try {
      await _flutterTts.setLanguage("pt-BR");
      await _flutterTts.setSpeechRate(_currentRate);
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);
      await _flutterTts.awaitSpeakCompletion(true);

      _flutterTts.setErrorHandler((dynamic message) {
        debugPrint("TTS Aviso/Erro (não fatal): $message");
      });
      _isInitialized = true;
      return true;
    } catch (e) {
      debugPrint("Erro ao inicializar TTS: $e");
      return false;
    }
  }

  static Future<bool> speak(String text) async {
    if (text.trim().isEmpty) return false;
    try {
      if (!await init()) return false;
      // No Web (Chrome), chamar stop() imediatamente antes de speak() cancela a fala anterior e dispara SpeechSynthesisErrorEvent
      if (!kIsWeb) {
        await _flutterTts.stop();
      }
      await _flutterTts.speak(text);
      return true;
    } catch (e) {
      debugPrint("TTS speak não pôde ser executado: $e");
      return false;
    }
  }

  static Future<void> stop() async {
    try {
      await _flutterTts.stop();
    } catch (e) {
      debugPrint("TTS stop erro: $e");
    }
  }

  static Future<bool> pause() async {
    try {
      await _flutterTts.pause();
      return true;
    } catch (e) {
      debugPrint("TTS pause erro: $e");
      return false;
    }
  }

  static Future<bool> resume(String text) => speak(text);

  static Future<void> setRate(double rate) async {
    _currentRate = rate;
    try {
      await _flutterTts.setSpeechRate(rate);
    } catch (e) {
      debugPrint("TTS setRate erro: $e");
    }
  }
}
