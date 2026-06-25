// src/hooks/useNotifications.js
// ============================================================
//  UNP Market — Hook de notificaciones en tiempo real
//
//  EXTRAE DE: Home.jsx y Perfil.jsx
//    - onSnapshot listener sobre colección "notificaciones"
//    - where("paraUid", "==", user.uid) + orderBy timestamp
//    - handleLimpiarNotificaciones (writeBatch delete)
//    - handleNotifClick (marcar leído + navegar)
//    - Cleanup automático del listener al desmontar
//
//  LO QUE QUEDA EN Home.jsx / Perfil.jsx:
//    - Render de cada notif (JSX, íconos, textos)
//    - navigate() tras el click (UI concern)
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  collection, query, where, orderBy,
  onSnapshot, updateDoc, writeBatch, doc,
} from "firebase/firestore";
import { db }       from "../services/firebase";
import { logError } from "../utils/errorHandler";

/**
 * Hook de notificaciones en tiempo real para el usuario autenticado.
 * Abre UN SOLO onSnapshot y lo cierra al desmontar.
 *
 * @param {string|null} uid  UID del usuario autenticado (de useAuth)
 *
 * @returns {{
 *   notificaciones: Array,
 *   noLeidas: number,
 *   marcarLeida: (notifId: string) => Promise<void>,
 *   limpiarTodas: () => Promise<void>,
 * }}
 *
 * @example
 *   const { user } = useAuth();
 *   const { notificaciones, noLeidas, marcarLeida, limpiarTodas } = useNotifications(user?.uid);
 */
export const useNotifications = (uid) => {
  const [notificaciones, setNotificaciones] = useState([]);

  // ── Listener en tiempo real ──────────────────────────────
  useEffect(() => {
    if (!uid) {
      setNotificaciones([]);
      return;
    }

    const q = query(
      collection(db, "notificaciones"),
      where("paraUid", "==", uid),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setNotificaciones(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      // onSnapshot puede fallar si el usuario pierde permisos (ej: cierra sesión durante la escucha)
      logError("[useNotifications] onSnapshot error", err);
    });

    return () => unsub();
  }, [uid]);

  // ── Marcar una notificación como leída ───────────────────
  /**
   * Actualiza el campo `leido: true` de una notificación individual.
   * Llamar antes de navegar al destino del click.
   */
  const marcarLeida = useCallback(async (notifId) => {
    try {
      await updateDoc(doc(db, "notificaciones", notifId), { leido: true });
    } catch (err) {
      logError("[useNotifications.marcarLeida]", err);
      // No relanzamos: marcar como leída es best-effort
    }
  }, []);

  // ── Borrar todas las notificaciones del usuario ──────────
  /**
   * Elimina en batch todas las notificaciones actuales.
   * @throws {Error} si el batch falla — el componente debe mostrar un toast de error
   */
  const limpiarTodas = useCallback(async () => {
    if (notificaciones.length === 0) return;
    try {
      const batch = writeBatch(db);
      notificaciones.forEach((n) => batch.delete(doc(db, "notificaciones", n.id)));
      await batch.commit();
    } catch (err) {
      logError("[useNotifications.limpiarTodas]", err);
      throw err; // el componente captura esto para mostrar toast de error
    }
  }, [notificaciones]);

  return {
    notificaciones,
    noLeidas: notificaciones.filter((n) => !n.leido).length,
    marcarLeida,
    limpiarTodas,
  };
};