import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Firebase.initializeApp() will be added after FlutterFire CLI setup
  runApp(const ProviderScope(child: G3SportsApp()));
}

class G3SportsApp extends ConsumerWidget {
  const G3SportsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'G3 Sports',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0A0F),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E5FF),
          secondary: Color(0xFFA3E635),
          surface: Color(0xFF111118),
        ),
        fontFamily: 'Roboto',
      ),
      routerConfig: router,
    );
  }
}
