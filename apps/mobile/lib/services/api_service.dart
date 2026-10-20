import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cultural_item.dart';

class ApiService {
  static const String _envUrl = String.fromEnvironment('API_BASE_URL');

  // Retorna os candidatos a URL base da API
  static Future<List<String>> getCandidates({String? explicitHost}) async {
    final prefs = await SharedPreferences.getInstance();
    final candidates = <String>[];

    if (explicitHost != null && explicitHost.isNotEmpty) {
      candidates.add(explicitHost);
    }

    final customUrl = prefs.getString('api_base_url');
    if (customUrl != null && customUrl.isNotEmpty) {
      candidates.add(customUrl);
    }

    if (_envUrl.isNotEmpty) {
      candidates.add(_envUrl);
    }

    // Se estiver rodando no Web / Chrome
    if (kIsWeb) {
      candidates.add('http://localhost:8000/api/v1');
      candidates.add('http://localhost:8001/api/v1');
      candidates.add('http://127.0.0.1:8000/api/v1');
      candidates.add('http://127.0.0.1:8001/api/v1');
    } else {
      candidates.add('http://localhost:8000/api/v1');
      candidates.add('http://localhost:8001/api/v1');
      candidates.add('http://10.0.2.2:8000/api/v1'); // Emulador Android
      candidates.add('http://10.0.2.2:8001/api/v1');
    }

    candidates.add('https://lumiar-api.onrender.com/api/v1');

    return candidates.toSet().toList();
  }

  static Future<CulturalItemModel> scanItem(String qrToken,
      {String? explicitHost}) async {
    final token = qrToken.trim();
    if (token.isEmpty) {
      throw Exception('QR Code inválido ou em branco.');
    }

    // 1. Tenta buscar no cache offline local
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString('item_$token');
    if (cached != null) {
      try {
        return CulturalItemModel.fromJson(jsonDecode(cached));
      } catch (_) {}
    }

    // 2. Busca na API online testando os servidores disponíveis
    final candidates = await getCandidates(explicitHost: explicitHost);
    Exception? lastError;

    for (final base in candidates) {
      try {
        final url = Uri.parse('$base/public/scan/$token');
        final response = await http.get(
          url,
          headers: {'Accept': 'application/json'},
        ).timeout(const Duration(seconds: 4));

        if (response.statusCode == 200) {
          final data = jsonDecode(utf8.decode(response.bodyBytes));
          // Salva no cache offline
          await prefs.setString('item_$token', jsonEncode(data));
          // Lembra esta base_url como a ativa
          await prefs.setString('api_base_url', base);
          return CulturalItemModel.fromJson(data);
        } else if (response.statusCode == 404) {
          lastError = Exception('Obra não localizada no acervo ($token).');
        } else {
          lastError =
              Exception('Servidor retornou erro ${response.statusCode}.');
        }
      } catch (e) {
        lastError = Exception('Não foi possível conectar ao servidor ($base).');
      }
    }

    throw lastError ??
        Exception('Obra não localizada ou servidor inacessível.');
  }

  static Future<String> askLumi({
    required String qrToken,
    required String question,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final candidates = await getCandidates();
    final baseUrl = prefs.getString('api_base_url') ?? candidates.first;

    final url = Uri.parse('$baseUrl/public/chat');
    late final http.Response response;
    try {
      response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body:
                jsonEncode({'qr_token': qrToken.trim(), 'question': question}),
          )
          .timeout(const Duration(seconds: 15));
    } on TimeoutException {
      throw Exception('A conexão com a Lumi excedeu o tempo limite.');
    } on http.ClientException {
      throw Exception(
          'Não foi possível conectar à Lumi. Verifique a conexão com a internet.');
    }

    if (response.statusCode != 200) {
      throw Exception(
          'A Lumi não pôde responder (erro ${response.statusCode}).');
    }
    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (data is! Map<String, dynamic>) {
      throw Exception('A Lumi retornou uma resposta inválida.');
    }
    final answer = data['answer'];
    if (answer is String && answer.trim().isNotEmpty) return answer;
    throw Exception('A Lumi retornou uma resposta vazia.');
  }

  static Future<int> downloadOfflinePack(String orgSlug) async {
    final candidates = await getCandidates();
    final prefs = await SharedPreferences.getInstance();
    final baseUrl = prefs.getString('api_base_url') ?? candidates.first;

    final url = Uri.parse('$baseUrl/public/organization/$orgSlug/offline-pack');
    final response = await http.get(url).timeout(const Duration(seconds: 20));

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      final items = data['items'] as List;
      final spaces = {
        for (final space in (data['spaces'] as List)) space['id']: space,
      };

      for (var item in items) {
        final token = item['qr_token'];
        if (token != null) {
          final space = spaces[item['space_id']];
          await prefs.setString(
              'item_$token',
              jsonEncode({
                ...item,
                'space': space,
                'organization': data['organization'],
              }));
        }
      }
      return items.length;
    }
    throw Exception('Não foi possível baixar o guia offline do museu.');
  }
}
