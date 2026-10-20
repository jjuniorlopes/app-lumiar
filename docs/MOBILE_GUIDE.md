# 📱 Guia de Desenvolvimento Mobile - Flutter

## Quick Start

### 1. Setup Inicial

```bash
cd apps/mobile

# Instalar dependências
flutter pub get

# Selecionar dispositivo/emulador
flutter devices

# Rodar app
flutter run -d <device-id>
```

### 2. Configurar API

Editar [lib/services/api_service.dart](lib/services/api_service.dart):

```dart
const String BASE_URL = 'http://seu-ip:8000/api/v1';  // Dev
// const String BASE_URL = 'https://api.lumiar.com/api/v1';  // Prod
```

Se usando Android emulator:
```bash
flutter run --debug -d emulator-5554 --dart-define=API_URL=http://10.0.2.2:8000/api/v1
```

### 3. Estrutura de Pastas

```
lib/
├── main.dart                  # Entry point
├── models/                    # Modelos de dados
│   └── cultural_item.dart
├── screens/                   # Telas
│   ├── login_screen.dart
│   ├── home_screen.dart
│   ├── item_detail_screen.dart
│   └── scanner_screen.dart
├── services/                  # Serviços
│   ├── api_service.dart       # HTTP client
│   ├── auth_service.dart      # Autenticação
│   ├── storage_service.dart   # Local storage
│   └── tts_service.dart       # Text-to-speech
└── widgets/                   # Componentes reutilizáveis
    └── custom_widgets.dart
```

## ✨ Funcionalidades FASE 1

### Autenticação Segura
```dart
// Usar secure_storage para guardar tokens
final storage = const FlutterSecureStorage();
await storage.write(key: 'access_token', value: token);
```

### Sincronização Offline
```dart
// Salvar itens localmente com Hive
final box = Hive.box('cultural_items');
box.put(item.id, item);

// Sincronizar quando online
if (await connectivity.hasConnection()) {
  await syncOfflineData();
}
```

### Integração API

```dart
// Classe AuthService para gerenciar autenticação
class AuthService {
  Future<void> login(String email, String password) async {
    final response = await ApiService.post('/auth/login', {
      'email': email,
      'password': password
    });
    
    await storage.write(
      key: 'access_token',
      value: response['access_token']
    );
  }
}
```

## 🔧 Dependências Principais

- `flutter_secure_storage`: Armazenar tokens seguramente
- `hive`: Database offline
- `http` ou `dio`: HTTP client
- `provider` ou `riverpod`: State management
- `flutter_tts`: Text-to-speech
- `mobile_scanner`: QR code scanning
- `connectivity_plus`: Detectar conexão online/offline

## 🧪 Testes

```bash
# Unit tests
flutter test test/unit/

# Integration tests
flutter test integration_test/

# Coverage
flutter test --coverage
```

## 📊 Build & Release

### Android

```bash
# Debug
flutter build apk

# Release (otimizado)
flutter build apk --release

# App bundle (Play Store)
flutter build appbundle --release

# Assinar APK
keytool -genkey -v -keystore lumiar.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias lumiar
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore lumiar.keystore build/app/outputs/apk/release/app-release-unsigned.apk lumiar
zipalign -v 4 build/app/outputs/apk/release/app-release-unsigned.apk app-release.apk
```

### iOS

```bash
# Build
flutter build ios --release

# Gerar .ipa
xcodebuild -workspace ios/Runner.xcworkspace \
  -scheme Runner \
  -configuration Release \
  -derivedDataPath build/ios_build \
  -arch arm64 \
  build
```

## 🎯 Roadmap FASE 2

- [ ] Architecture: Clean + Riverpod
- [ ] State Management melhorado
- [ ] Autenticação with OAuth (Google/Apple)
- [ ] Push Notifications (Firebase)
- [ ] Offline-first sincronização
- [ ] eMAG 3.0 Compliance (acessibilidade)
- [ ] Testes automatizados (80%+ coverage)
- [ ] Performance optimization
- [ ] Analytics (Firebase)
- [ ] App Store/Play Store release

## 🔐 Segurança

✅ **Implementar:**
- [ ] Encriptação de dados sensíveis
- [ ] Certificate pinning
- [ ] Obfuscação de código
- [ ] Proteção contra reverse engineering
- [ ] Validação de SSL/TLS

## 📞 Troubleshooting

### App não conecta à API
```bash
# Verificar firewall
adb shell ping 10.0.2.2

# Debug HTTP
dio.interceptors.add(LoggingInterceptor());
```

### Hot reload não funciona
```bash
flutter clean
flutter pub get
flutter run
```

### Build falha no iOS
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
flutter build ios
```

## 📚 Recursos

- [Flutter Docs](https://flutter.dev/docs)
- [Dart Language](https://dart.dev)
- [Provider Package](https://pub.dev/packages/provider)
- [Hive Database](https://pub.dev/packages/hive)
