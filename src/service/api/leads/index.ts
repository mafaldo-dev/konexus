import { addDoc, collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Lead } from "../../interfaces/leads";

export async function createLead(lead: Lead): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "Leads"), { ...lead, createdAt: new Date() });
    return docRef.id;
  } catch (error) {
    console.error("Error adding lead:", error);
    throw new Error("Failed to add lead.");
  }
}

export async function getLeads(filters?: { status?: string; source?: string }): Promise<Lead[]> {
  try {
    const leadsCol = collection(db, "Leads");
    let q = query(leadsCol, orderBy("createdAt", "desc"));

    if (filters?.status && filters.status !== "all") {
      q = query(q, where("status", "==", filters.status));
    }
    if (filters?.source && filters.source !== "all") {
      q = query(q, where("source", "==", filters.source));
    }

    const leadSnapshot = await getDocs(q);
    const leads: Lead[] = leadSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Lead
    }));
    return leads;
  } catch (error) {
    console.error("Error getting leads:", error);
    throw new Error("Failed to retrieve leads.");
  }
}

export async function updateLead(id: string, lead: Partial<Lead>): Promise<void> {
  try {
    const leadRef = doc(db, "Leads", id);
    await updateDoc(leadRef, lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    throw new Error("Failed to update lead.");
  }
}

export async function deleteLead(id: string): Promise<void> {
  try {
    const leadRef = doc(db, "Leads", id);
    await deleteDoc(leadRef);
  } catch (error) {
    console.error("Error deleting lead:", error);
    throw new Error("Failed to delete lead.");
  }
}