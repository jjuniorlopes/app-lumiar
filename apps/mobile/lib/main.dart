import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'screens/visitor_home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LumiarApp());
}

class LumiarApp extends StatelessWidget {
  const LumiarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lumiar — Acessibilidade Conectada',
      debugShowCheckedModeBanner: false,
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF24748B),
          primary: const Color(0xFF24748B),
          secondary: const Color(0xFFEAF4F6),
        ),
        scaffoldBackgroundColor: const Color(0xFFF9FAFA),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(fontSize: 18, color: Color(0xFF1E2A30)),
          bodyMedium: TextStyle(fontSize: 16, color: Color(0xFF1E2A30)),
        ),
      ),
      home: const VisitorHomeScreen(),
    );
  }
}
