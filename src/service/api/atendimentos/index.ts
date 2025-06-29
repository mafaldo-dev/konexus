import { addDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Atendimento } from "../../interfaces/atendimentos";

export async function addAtendimento(atendimento: Atendimento): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "Atendimentos"), atendimento);
    return docRef.id;
  } catch (error) {
    console.error("Error adding atendimento:", error);
    throw new Error("Failed to add atendimento.");
  }
}

export async function getAllAtendimentos(): Promise<Atendimento[]> {
  try {
    const atendimentosCol = collection(db, "Atendimentos");
    const q = query(atendimentosCol, orderBy("createdAt", "desc"));
    const atendimentoSnapshot = await getDocs(q);
    const atendimentos: Atendimento[] = atendimentoSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Atendimento
    }));
    return atendimentos;
  } catch (error) {
    console.error("Error getting atendimentos:", error);
    throw new Error("Failed to retrieve atendimentos.");
  }
}
