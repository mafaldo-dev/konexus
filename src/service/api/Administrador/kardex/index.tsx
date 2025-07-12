import { collection, query, where, getDocs, addDoc, limit, orderBy, serverTimestamp, DocumentSnapshot, startAfter } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { Movement } from "../../../interfaces";


export const createKardexEntry = async (
  productId: string,
  type: "entrada" | "saida" | "ajuste",
  quantity: number,
  description: string,
  nfNumber?: string,
  userId?: string
): Promise<string> => {
  try {
    // Validações básicas
    if (!productId) throw new Error("ID do produto é obrigatório");
    if (quantity <= 0) throw new Error("Quantidade deve ser maior que zero");
    
    const currentBalance = await calculateCurrentBalance(productId);
    
    // Verificação para estoque negativo em saídas
    if (type === "saida" && currentBalance < quantity) {
      throw new Error("Saldo insuficiente para esta saída");
    }

    const newBalance = type === "entrada" 
      ? currentBalance + quantity 
      : currentBalance - quantity;

    const movementData = {
      productId,
      type,
      quantity,
      description,
      nfNumber: nfNumber || "N/A",
      user: userId || "system",
      date: serverTimestamp(),
      balance: newBalance,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "Kardex"), movementData);
    
    console.log(`Movimentação criada com sucesso: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("Erro detalhado ao criar movimentação:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao registrar movimentação");
  }
};
// Função para calcular saldo atual
const calculateCurrentBalance = async (productId: string): Promise<number> => {
  const lastMovement = await getLastMovement(productId);
  return lastMovement?.balance || 0;
};


const getLastMovement = async (productId: string): Promise<Movement | null> => {
  try {
    const q = query(
      collection(db, "Kardex"),
      where("productId", "==", productId),
      orderBy("date", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`Nenhuma movimentação anterior encontrada para o produto ${productId}`);
      return null;
    }

    const docData = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...docData,
      date: docData.date?.toDate?.()?.toISOString() || docData.date
    } as Movement;
  } catch (error) {
    console.error("Erro ao buscar última movimentação:", error);
    throw new Error("Falha ao consultar histórico");
  }
};

export const getKardexMovements = async (productId: string): Promise<Movement[]> => {
  try {
    if (!productId) {
      throw new Error("ID do produto é obrigatório");
    }

    const kardexRef = collection(db, "Kardex");
    const q = query(
      kardexRef, 
      where("productId", "==", productId),
      orderBy("date", "desc")
    );

    const snap = await getDocs(q);
    console.log(snap)

    const movements = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        productId: data.productId,
        type: data.type,
        quantity: Number(data.quantity),
        date: data.date?.toDate?.()?.toISOString() || data.date,
        description: data.description || `Movimentação de ${data.type}`,
        nfNumber: data.nfNumber || null,
        user: data.user || "Sistema",
        balance: Number(data.balance)
      };
    });

    console.log(`Encontradas ${movements.length} movimentações para o produto ${productId}`);
    return movements;
  } catch (error) {
    console.error("Erro detalhado ao buscar movimentações:", error);
    throw new Error("Falha ao carregar histórico de movimentações");
  }
};


export const getKardexPaginated = async (
  productId: string,
  pageSize: number,
  lastDoc?: DocumentSnapshot
): Promise<{ movements: Movement[]; lastVisible: DocumentSnapshot | null }> => {
  try {
    let q = query(
      collection(db, "Kardex"),
      where("productId", "==", productId),
      orderBy("date", "desc"),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Movement[];

    return {
      movements,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error("Erro na paginação:", error);
    throw error;
  }
};