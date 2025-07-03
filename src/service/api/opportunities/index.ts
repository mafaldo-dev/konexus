import { addDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { OpportunityData, Opportunity } from "../../interfaces";

export async function createOpportunity(opportunityData: OpportunityData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "Opportunities"), { ...opportunityData, createdAt: new Date() });
    return docRef.id;
  } catch (error) {
    console.error("Error adding opportunity:", error);
    throw new Error("Failed to add opportunity.");
  }
}

export async function getAllOpportunities(): Promise<Opportunity[]> {
  try {
    const opportunitiesCol = collection(db, "Opportunities");
    const q = query(opportunitiesCol, orderBy("createdAt", "desc"));
    const opportunitySnapshot = await getDocs(q);

    const opportunities: Opportunity[] = opportunitySnapshot.docs.map(doc => ({
      ...doc.data() as Opportunity,
      id: doc.id,
    }));

    return opportunities;
  } catch (error) {
    console.error("Error getting opportunities:", error);
    throw new Error("Failed to retrieve opportunities.");
  }
}