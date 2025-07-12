import { addDoc, collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Campaign, Lead, OpportunityData, Opportunity, FollowUp } from "../../interfaces";

// Campaigns
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

// Leads
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

// Opportunities
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

// FollowUps
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
