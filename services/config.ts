// services/config.ts
// Shared backend URLs for REST and STOMP.

import Constants from 'expo-constants';
import { Platform } from 'react-native';

type Env = Record<string, string | undefined>;

const env = ((globalThis as unknown as { process?: { env?: Env } }).process?.env ?? {});
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];

const SERVER_PORT = env.EXPO_PUBLIC_SERVER_PORT ?? '8080';
const SERVER_HOST =
  env.EXPO_PUBLIC_SERVER_HOST ??
  expoHost ??
  (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const BACKEND_BASE_URL =
  env.EXPO_PUBLIC_BACKEND_BASE_URL ?? `http://${SERVER_HOST}:${SERVER_PORT}`;

export const API_BASE_URL =
  env.EXPO_PUBLIC_API_BASE_URL ?? `${BACKEND_BASE_URL}/api`;

export const WS_URL =
  env.EXPO_PUBLIC_WS_URL ?? `ws://${SERVER_HOST}:${SERVER_PORT}/ws/websocket`;
