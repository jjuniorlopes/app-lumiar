// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lumiar_mobile/main.dart';

void main() {
  testWidgets('A tela inicial oferece navegação acessível para a visita',
      (WidgetTester tester) async {
    await tester.pumpWidget(const LumiarApp());
    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.text('Acessibilidade para sua visita'), findsOneWidget);
    expect(find.text('Começar visita'), findsOneWidget);
    expect(find.text('Guias offline'), findsOneWidget);
    expect(
        find.textContaining('Identifique uma obra primeiro'), findsOneWidget);
  });
}
