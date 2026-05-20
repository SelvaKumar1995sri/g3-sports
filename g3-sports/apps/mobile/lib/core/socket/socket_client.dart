import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

const _socketUrl = 'https://g3-sports-backend.onrender.com';

class SocketClient {
  io.Socket? _socket;
  final _storage = const FlutterSecureStorage();

  Future<io.Socket> connect() async {
    if (_socket != null && _socket!.connected) return _socket!;
    final token = await _storage.read(key: 'g3_jwt');
    _socket = io.io(
      _socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer ${token ?? ''}'})
          .enableAutoConnect()
          .enableReconnection()
          .build(),
    );
    _socket!.connect();
    return _socket!;
  }

  void joinRoom(String matchId) {
    _socket?.emit('joinRoom', matchId);
  }

  void leaveRoom(String matchId) {
    _socket?.emit('leaveRoom', matchId);
  }

  Stream<Map<String, dynamic>> scoreUpdates() {
    final controller = StreamController<Map<String, dynamic>>.broadcast();
    _socket?.on('scoreUpdate', (data) {
      if (data is Map) controller.add(Map<String, dynamic>.from(data));
    });
    return controller.stream;
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}

final socketClientProvider = Provider<SocketClient>((ref) {
  final client = SocketClient();
  ref.onDispose(client.disconnect);
  return client;
});
