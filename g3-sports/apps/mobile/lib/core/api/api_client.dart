import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_exception.dart';

const _baseUrl = 'http://localhost:3001/api';
const _storage = FlutterSecureStorage();

Dio createDio() {
  final dio = Dio(BaseOptions(
    baseUrl: _baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ));

  // JWT interceptor
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await _storage.read(key: 'g3_jwt');
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    },
    onResponse: (response, handler) {
      // Unwrap TransformInterceptor envelope: { data: T, timestamp: string }
      final body = response.data;
      if (body is Map && body.containsKey('data') && body.containsKey('timestamp')) {
        response.data = body['data'];
      }
      handler.next(response);
    },
    onError: (e, handler) {
      if (e.response?.statusCode == 401) {
        _storage.delete(key: 'g3_jwt');
      }
      final msg = e.response?.data?['message'] ?? e.message ?? 'Unknown error';
      handler.reject(
        DioException(
          requestOptions: e.requestOptions,
          error: ApiException(statusCode: e.response?.statusCode, message: msg.toString()),
          response: e.response,
          type: e.type,
        ),
      );
    },
  ));

  return dio;
}

final dioProvider = Provider<Dio>((ref) => createDio());
