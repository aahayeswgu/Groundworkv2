'use client';
import { usePinSync } from '@/app/features/pins/sync/usePinSync';

export default function StoreHydration() {
  usePinSync();
  return null;
}
