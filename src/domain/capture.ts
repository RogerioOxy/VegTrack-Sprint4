export type Origem = 'dispositivo' | 'demonstracao';
export interface Gps { lat: number; lng: number; accuracy: number; origem: Origem; }

export const precisaPedirPermissao = (permission: { granted: boolean } | null): boolean => !permission?.granted;

// O diálogo do Android pode colocar o app em background durante a autorização.
export const deveCancelarCaptura = (state: string, pedindoPermissao: boolean): boolean => state === 'background' && !pedindoPermissao;

export const formatarDecimal = (value: number | undefined, casas: number): string =>
  value === undefined ? 'Não informada' : value.toFixed(casas).replace('.', ',');
export interface Evidencia { uri: string; origem: Origem; }

export function origemValida(value: unknown): value is Origem {
  return value === 'dispositivo' || value === 'demonstracao';
}

export function normalizarGps(value: { latitude: number; longitude: number; accuracy: number | null }, origem: Origem): Gps {
  const { latitude: lat, longitude: lng, accuracy } = value;
  if (!origemValida(origem) || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180 || accuracy === null || !Number.isFinite(accuracy) || accuracy <= 0) {
    throw new Error('A leitura de localização é inválida. Tente novamente ou use a localização demonstrativa do trecho.');
  }
  return { lat, lng, accuracy, origem };
}

export function normalizarEvidencia(uri: string, origem: Origem): Evidencia {
  if (!origemValida(origem) || !uri.trim() || (origem === 'dispositivo' && !/^file:\/\/\/.*\/evidencias\/[^/]+\.jpg$/.test(uri))) {
    throw new Error('A foto do dispositivo precisa ser salva na pasta evidencias antes do registro.');
  }
  return { uri: uri.trim(), origem };
}

// Registros da Sprint 3 não possuem origem e eram sempre demonstrativos.
export function origemDoRegistro(value?: { origem: Origem }): Origem {
  return value?.origem ?? 'demonstracao';
}

export function rotuloGps(value?: { origem: Origem }): string {
  return origemDoRegistro(value) === 'dispositivo' ? 'GPS do dispositivo' : 'GPS demonstrativo';
}

export function rotuloFoto(value?: { origem: Origem }): string {
  return origemDoRegistro(value) === 'dispositivo' ? 'Foto do dispositivo' : 'Foto de exemplo';
}
