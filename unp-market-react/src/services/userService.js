import {
  doc, getDoc,
  collection, query, where, getDocs,
  updateDoc, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";

export const obtenerPerfilVendedor = async (uid) => {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? snap.data() : null;
};

export const obtenerProductosPorVendedor = async (uid) => {
  if (!uid) return [];
  const q = query(collection(db, "productos"), where("userUid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const seguirVendedor = async (vendedorUid, miUid) => {
  await updateDoc(doc(db, "usuarios", vendedorUid), {
    seguidores: arrayUnion(miUid),
  });
};

export const dejarDeSeguirVendedor = async (vendedorUid, miUid) => {
  await updateDoc(doc(db, "usuarios", vendedorUid), {
    seguidores: arrayRemove(miUid),
  });
};