import { addDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { FollowUp } from "../../../interfaces";

export async function addFollowUp(followUp: FollowUp): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "FollowUps"), followUp);
    return docRef.id;
  } catch (error) {
    console.error("Error adding follow-up:", error);
    throw new Error("Failed to add follow-up.");
  }
}

export async function getAllFollowUps(): Promise<FollowUp[]> {
  try {
    const followUpsCol = collection(db, "FollowUps");
    const q = query(followUpsCol, orderBy("createdAt", "desc"));
    const followUpSnapshot = await getDocs(q);
    const followUps: FollowUp[] = followUpSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as FollowUp
    }));
    return followUps;
  } catch (error) {
    console.error("Error getting follow-ups:", error);
    throw new Error("Failed to retrieve follow-ups.");
  }
}
