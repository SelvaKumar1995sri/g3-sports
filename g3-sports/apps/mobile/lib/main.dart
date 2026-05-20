import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Firebase will be initialized after FlutterFire CLI is run
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const ProviderScope(child: G3SportsApp()));
}

class G3SportsApp extends ConsumerWidget {
  const G3SportsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'G3 Sports',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0A0F),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF00E5FF),
          secondary: const Color(0xFFA3E635),
          surface: const Color(0xFF111118),
        ),
        fontFamily: 'Roboto',
      ),
      home: const Scaffold(
        body: Center(child: Text('G3 Sports', style: TextStyle(color: Colors.white, fontSize: 32))),
      ),
    );
  }
}
