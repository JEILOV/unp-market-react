// src/hooks/useFavorites.js
// ============================================================
//  UNP Market — Hook de favoritos
//
//  EXTRAE DE: Producto.jsx y Home.jsx
//    - handleFavorito: toggle add/delete del Set
//    - sincronizarFavoritos con Firestore si hay sesión
//    - crearNotificacion al agregar (tipo "favorito")
//    - Estado derivado esFavorito para un producto específico
//
//  LO QUE QUEDA EN Producto.jsx:
//    - mostrarToast (UI concern)
//    - El Set de favoritos vive en AuthContext — este hook
//      solo expone una interfaz limpia para togglear.
// ============================================================

import { useCallback }          from "react";
import { useAuth }              from "../context/AuthContext";
import { sincronizarFavoritos } from "../services/userService";
import { crearNotificacion }    from "../services/notificationService";
import { logError }             from "../utils/errorHandler";

/**
 * Hook para manejar favoritos de un producto específico.
 * Lee y escribe en AuthContext (fuente de verdad única).
 *
 * @param {Object} params
 * @param {string}        params.productoId     ID del producto
 * @param {string|null}   [params.vendedorUid]  UID del dueño del producto (para notificación)
 * @param {string|null}   [params.vendedorNombre] Nombre del vendedor (para notificación)
 * @param {string|null}   [params.productoTitulo] Título del producto (para notificación)
 * @param {Function}      [params.onToast]      Callback (mensaje, tipo) para feedback visual
 *
 * @returns {{
 *   esFavorito: boolean,
 *   toggleFavorito: () => Promise<void>,
 * }}
 *
 * @example
 *   const { esFavorito, toggleFavorito } = useFavorites({
 *     productoId,
 *     vendedorUid:     producto?.userUid,
 *     vendedorNombre:  producto?.vendedorNombre,
 *     productoTitulo:  producto?.titulo,
 *     onToast:         mostrarToast,
 *   });
 */
export const useFavorites = ({
  productoId,
  vendedorUid    = null,
  vendedorNombre = null,
  productoTitulo = null,
  onToast        = null,
}) => {
  const { user, perfil, favoritos, actualizarFavoritos } = useAuth();

  // Estado derivado — no necesita useState propio porque ya vive en el contexto
  const esFavorito = favoritos.has(productoId);

  const toggleFavorito = useCallback(async () => {
    const eraFav = favoritos.has(productoId);
    const nuevos = new Set(favoritos);
    eraFav ? nuevos.delete(productoId) : nuevos.add(productoId);

    // ① Actualizar contexto global + localStorage (sync, inmediato para la UI)
    actualizarFavoritos(nuevos);
    onToast?.(
      eraFav ? "Eliminado de favoritos" : "¡Guardado en favoritos! ❤️",
      eraFav ? "success" : "success"
    );

    // ② Persistir en Firestore + notificación (async, best-effort)
    if (user) {
      try {
        await sincronizarFavoritos(user.uid, [...nuevos]);

        // Solo notificar al agregar (no al quitar) y nunca a uno mismo
        if (!eraFav && vendedorUid && vendedorUid !== user.uid) {
          await crearNotificacion({
            paraUid:        vendedorUid,
            deUid:          user.uid,
            deNombre:       perfil?.nombre || user.displayName || "Un usuario",
            tipo:           "favorito",
            productoId,
            productoTitulo: productoTitulo || "tu producto",
          });
        }
      } catch (err) {
        logError("[useFavorites.toggleFavorito]", err);
        // No revertimos el estado local: el usuario ya vio el feedback.
        // La próxima carga desde Firestore reconciliará si hubo error.
      }
    }
  }, [
    productoId, vendedorUid, vendedorNombre, productoTitulo,
    user, perfil, favoritos, actualizarFavoritos, onToast,
  ]);

  return { esFavorito, toggleFavorito };
};