// src/utils/favoritesStorage.js
// ============================================================
//  Utilidad PURA de favoritos en localStorage.
//  No importa nada de Firebase: solo sabe leer/escribir el
//  array de IDs de productos favoritos del dispositivo actual.
//  La sincronización con Firestore vive en services/userService.js
// ============================================================

const CLAVE_FAVORITOS = "listaFavoritos";

export const obtenerFavoritos = () =>
  JSON.parse(localStorage.getItem(CLAVE_FAVORITOS) || "[]");

export const guardarFavoritos = (favoritos) =>
  localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));

export const esFavorito = (productoId) =>
  obtenerFavoritos().includes(productoId);

/**
 * Combina los favoritos marcados como invitado (localStorage) con los
 * guardados en Firestore, sin duplicados.
 *
 * Se usa al iniciar sesión: si marcaste productos como favorito ANTES
 * de loguearte, no deben perderse al sincronizar con tu cuenta.
 */
export const fusionarFavoritos = (favoritosInvitado = [], favoritosRemotos = []) => {
  return [...new Set([...favoritosRemotos, ...favoritosInvitado])];
};