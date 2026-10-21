import React, { useEffect, useRef, useState } from 'react';
import { AppState, Image, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { Card, MessageBanner, PrimaryButton, SectionHeader } from './index';
import PhotoCredit from './PhotoCredit';
import { Evidencia, Gps, normalizarEvidencia, normalizarGps, rotuloFoto, rotuloGps } from '../domain/capture';
import { demoPhotoUri } from '../services/demoEvidence';
import { comPrazo } from '../services/deadline';
import { Colors, Spacing } from '../utils/theme';

interface Props {
  contextKey: string;
  trecho?: { lat: number; lng: number };
  gps: Gps | null;
  evidencia: Evidencia | null;
  onGps: (gps: Gps | null) => void;
  onEvidencia: (evidencia: Evidencia | null) => void;
  onBusy: (busy: boolean) => void;
  disabled?: boolean;
}

export default function EvidenceFields({ contextKey, trecho, gps, evidencia, onGps, onEvidencia, onBusy, disabled }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const camera = useRef<CameraView>(null);
  const generation = useRef(0);
  const locked = useRef(false);
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => listener.remove();
  }, []);
  useEffect(() => {
    generation.current += 1; locked.current = false;
    setWorking(false); onBusy(false); setCameraOpen(false); setDraft(null); setReady(false);
    setGpsError(null); setPhotoError(null);
    return () => { generation.current += 1; };
  }, [contextKey, focused, foreground]);
  const begin = () => {
    if (locked.current || disabled || !focused || !foreground) return null;
    locked.current = true; setWorking(true); onBusy(true); return generation.current;
  };
  const end = (token: number) => {
    if (token !== generation.current) return;
    locked.current = false; setWorking(false); onBusy(false);
  };
  const close = () => {
    generation.current += 1; locked.current = false; setWorking(false); onBusy(false);
    setCameraOpen(false); setDraft(null); setReady(false);
  };
  const captureGps = async () => {
    const token = begin(); if (token === null) return;
    setGpsError(null); onGps(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (token !== generation.current) return;
      if (!permission.granted) throw new Error('Permissão de localização negada. Você pode tentar novamente nas configurações do Android ou usar a localização demonstrativa do trecho.');
      const enabled = await comPrazo(Location.hasServicesEnabledAsync());
      if (!enabled) throw new Error('O serviço de localização está desligado. Ative a localização do Android ou use a localização demonstrativa do trecho.');
      if (token !== generation.current) return;
      const position = await comPrazo(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }));
      if (token === generation.current) onGps(normalizarGps(position.coords, 'dispositivo'));
    } catch (error) {
      if (token === generation.current) setGpsError(`Não foi possível capturar a localização. ${error instanceof Error ? error.message : 'Tente novamente ou use a localização demonstrativa do trecho.'}`);
    } finally { end(token); }
  };
  const openCamera = async () => {
    const token = begin(); if (token === null) return;
    setPhotoError(null);
    try {
      const response = permission?.granted ? permission : await requestPermission();
      if (token !== generation.current) return;
      if (!response.granted) throw new Error('Permissão de câmera negada. Libere a câmera nas configurações do Android ou use a foto de exemplo.');
      setDraft(null); setReady(false); setCameraOpen(true);
    } catch (error) { if (token === generation.current) setPhotoError(`Não foi possível abrir a câmera. ${error instanceof Error ? error.message : 'Use a foto de exemplo ou tente novamente.'}`); }
    finally { end(token); }
  };
  const takePhoto = async () => {
    if (!ready || !camera.current) return;
    const token = begin(); if (token === null) return;
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.75, exif: false });
      if (!picture?.uri) throw new Error('A câmera não retornou uma foto. Tente novamente.');
      if (token === generation.current) { setDraft(picture.uri); setReady(false); }
    } catch { if (token === generation.current) setPhotoError('Não foi possível capturar a foto. Tente novamente ou feche a câmera e use a foto de exemplo.'); }
    finally { end(token); }
  };
  const acceptPhoto = async () => {
    if (!draft) return;
    const token = begin(); if (token === null) return;
    try {
      if (!FileSystem.documentDirectory) throw new Error('O armazenamento permanente está indisponível.');
      const directory = `${FileSystem.documentDirectory}evidencias/`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      const target = `${directory}${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      await FileSystem.copyAsync({ from: draft, to: target });
      if (token === generation.current) { onEvidencia(normalizarEvidencia(target, 'dispositivo')); setCameraOpen(false); setDraft(null); setPhotoError(null); }
    } catch { if (token === generation.current) setPhotoError('Não foi possível salvar a foto no armazenamento do app. Tente novamente ou use a foto de exemplo.'); }
    finally { end(token); }
  };
  const blocked = disabled || working;
  return <View style={styles.fields}>
    <View><SectionHeader title="Evidência fotográfica" subtitle={Platform.OS === 'web' ? 'No navegador, use a foto de exemplo.' : 'A câmera será solicitada ao tocar em Abrir câmera. A foto confirmada fica no armazenamento do app.'} />
      {evidencia ? <Card><Image source={{ uri: evidencia.uri }} style={styles.photo} resizeMode="contain" /><Text>{rotuloFoto(evidencia)}</Text>{evidencia.origem === 'demonstracao' ? <PhotoCredit /> : null}</Card> : <Text>Nenhuma foto adicionada.</Text>}
      {photoError ? <MessageBanner tone="error" message={photoError} /> : null}
      <View style={styles.actions}>{Platform.OS !== 'web' ? <PrimaryButton compact label="Abrir câmera" onPress={openCamera} disabled={blocked} /> : null}<PrimaryButton compact label="Usar foto de exemplo" variant="outline" disabled={blocked} onPress={() => { onEvidencia(normalizarEvidencia(demoPhotoUri, 'demonstracao')); setPhotoError(null); }} /><PrimaryButton compact label="Remover foto" variant="ghost" disabled={blocked || !evidencia} onPress={() => onEvidencia(null)} /></View>
    </View>
    <View><SectionHeader title="Localização" subtitle="A localização só é solicitada pelo botão. A precisão é estimada pelo dispositivo." />
      <Card>{gps ? <><Text>{rotuloGps(gps)}</Text><Text>Latitude: {gps.lat.toFixed(6)}</Text><Text>Longitude: {gps.lng.toFixed(6)}</Text><Text>Precisão {gps.origem === 'demonstracao' ? 'simulada' : 'informada'}: ±{gps.accuracy.toFixed(1)} m</Text></> : <Text>Nenhuma localização selecionada.</Text>}</Card>
      {gpsError ? <MessageBanner tone="error" message={gpsError} /> : null}
      <View style={styles.actions}>{Platform.OS !== 'web' ? <PrimaryButton compact label="Capturar localização" onPress={captureGps} disabled={blocked} /> : null}<PrimaryButton compact label="Usar localização demonstrativa do trecho" variant="outline" disabled={blocked || !trecho} onPress={() => { if (trecho) onGps(normalizarGps({ latitude: trecho.lat, longitude: trecho.lng, accuracy: 7.4 }, 'demonstracao')); setGpsError(null); }} /></View>
    </View>
    {working ? <Text accessibilityLiveRegion="polite">Aguarde a captura ou a gravação da evidência.</Text> : null}
    <Modal visible={cameraOpen && focused && foreground} onRequestClose={close} animationType="slide">
      <ScrollView contentContainerStyle={styles.modal}>
        <Text style={styles.title}>Fotografar evidência</Text><Text>Fotografe o trecho vistoriado. Confirme a prévia para guardar a foto no app.</Text>
        {photoError ? <MessageBanner tone="error" message={photoError} /> : null}
        {draft ? <Image source={{ uri: draft }} style={styles.camera} resizeMode="contain" /> : cameraOpen && focused && foreground ? <CameraView ref={camera} style={styles.camera} facing="back" mode="picture" onCameraReady={() => setReady(true)} onMountError={() => { setReady(false); setPhotoError('Câmera indisponível. Feche e tente novamente ou use a foto de exemplo.'); }} /> : null}
        {draft ? <><PrimaryButton label="Usar esta foto" onPress={acceptPhoto} disabled={blocked} /><PrimaryButton label="Refazer foto" variant="outline" disabled={blocked} onPress={() => { setDraft(null); setReady(false); setPhotoError(null); }} /></> : <PrimaryButton label="Capturar foto" onPress={takePhoto} disabled={blocked || !ready} />}
        <PrimaryButton label="Cancelar câmera" variant="ghost" onPress={close} />
      </ScrollView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  fields: { gap: Spacing.xl }, actions: { gap: Spacing.sm, marginTop: Spacing.sm },
  photo: { width: '100%', height: 210 }, camera: { width: '100%', height: 340, backgroundColor: '#111' },
  modal: { padding: Spacing.lg, paddingTop: 48, gap: Spacing.md, backgroundColor: Colors.background },
  title: { fontSize: 22, fontWeight: '700' },
});
