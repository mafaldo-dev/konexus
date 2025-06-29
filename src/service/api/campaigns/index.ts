import { addDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Campaign } from "../../interfaces/campaigns";

export async function addCampaign(campaign: Campaign): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "Campaigns"), campaign);
    return docRef.id;
  } catch (error) {
    console.error("Error adding campaign:", error);
    throw new Error("Failed to add campaign.");
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const campaignsCol = collection(db, "Campaigns");
    const q = query(campaignsCol, orderBy("createdAt", "desc"));
    const campaignSnapshot = await getDocs(q);
    const campaigns: Campaign[] = campaignSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Campaign
    }));
    return campaigns;
  } catch (error) {
    console.error("Error getting campaigns:", error);
    throw new Error("Failed to retrieve campaigns.");
  }
}
