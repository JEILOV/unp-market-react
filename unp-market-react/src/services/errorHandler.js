// src/utils/errorHandler.js
// ============================================================
//  TuCampus — Manejador centralizado de errores
//
//  POR QUÉ EXISTE:
//    Antes cada catch hacía console.error + toast genérico.
//    El usuario veía "Error al publicar" tanto si no tenía
//    internet como si su sesión expiró — causas distintas,
//    soluciones distintas, mismo mensaje inútil.
//
//  AHORA:
//    Un solo lugar traduce códigos de Firebase a mensajes
//    accionables. Si mañana cambia un código de error de
//    Firebase, se corrige aquí y se propaga a toda la app.
// ============================================================

// ── Códigos Firebase → mensaje legible para el usuario ──────
const MENSAJES_FIREBASE = {
  // Auth
  "auth/popup-closed-by-user":       null, // silencioso — el usuario canceló
  "auth/popup-blocked":              "Tu navegador bloqueó el popup. Permite popups para este sitio.",
  "auth/network-request-failed":     "Sin conexión. Revisa tu internet e intenta de nuevo.",
  "auth/too-many-requests":          "Demasiados intentos. Espera unos minutos.",
  "auth/user-disabled":              "Esta cuenta ha sido deshabilitada.",
  "auth/provider-already-linked":    null, // manejado explícitamente en Perfil.jsx

  // Firestore
  "permission-denied":               "No tienes permiso para realizar esta acción.",
  "unavailable":                     "Sin conexión con el servidor. Intenta de nuevo.",
  "deadline-exceeded":               "La operación tardó demasiado. Intenta de nuevo.",
  "not-found":                       "El recurso solicitado no existe.",
  "already-exists":                  "Este registro ya existe.",
  "resource-exhausted":              "Límite de operaciones alcanzado. Intenta más tarde.",
  "unauthenticated":                 "Tu sesión expiró. Vuelve a iniciar sesión.",

  // Storage / ImgBB
  "storage/unauthorized":            "No tienes permiso para subir archivos.",
  "storage/quota-exceeded":          "Almacenamiento lleno. Contacta al administrador.",
  "storage/retry-limit-exceeded":    "No se pudo subir la imagen. Revisa tu conexión.",
};

// ── Fallbacks por categoría cuando no hay código exacto ─────
const FALLBACKS = {
  auth:      "Error de autenticación. Intenta de nuevo.",
  firestore: "Error al conectar con la base de datos.",
  storage:   "Error al subir el archivo.",
  imgbb:     "No se pudo subir la imagen. Intenta de nuevo.",
  default:   "Algo salió mal. Intenta de nuevo.",
};

/**
 * Traduce un error de Firebase/ImgBB a un mensaje para el usuario.
 *
 * @param {Error} error  El error capturado en el catch
 * @param {string} [contexto]  Pista sobre el origen: "auth"|"firestore"|"storage"|"imgbb"
 * @returns {string|null}  Mensaje para mostrar, o null si debe ser silencioso
 *
 * @example
 *   } catch (err) {
 *     const msg = traducirError(err, "firestore");
 *     if (msg) setToast({ mensaje: msg, tipo: "error" });
 *   }
 */
export const traducirError = (error, contexto = "default") => {
  // 1. Buscar por código exacto de Firebase
  const codigo = error?.code || "";
  if (codigo && codigo in MENSAJES_FIREBASE) {
    return MENSAJES_FIREBASE[codigo]; // puede ser null (silencioso)
  }

  // 2. Buscar por mensaje de ImgBB
  if (error?.message === "ImgBB rechazó la imagen") {
    return FALLBACKS.imgbb;
  }

  // 3. Fallback por categoría
  return FALLBACKS[contexto] || FALLBACKS.default;
};

/**
 * Loguea el error en consola con contexto — solo en desarrollo.
 * En producción (Vite build) los console.error se eliminan.
 *
 * @param {string} origen   Ej: "[productService.crearProducto]"
 * @param {Error}  error
 */
export const logError = (origen, error) => {
  if (import.meta.env.DEV) {
    console.error(`${origen}`, error);
  }
};