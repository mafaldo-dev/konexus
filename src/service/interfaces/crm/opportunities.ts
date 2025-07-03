export interface OpportunityData {
  title: string;
  value: number | "";
  stage: "prospecting" | "qualification" | "proposal" | "negotiation";
  probability: number;
  expected_close_date: string;
  description: string;
  notes?: string;
}

export interface StageOpportunity {
  id: string;
  label: string;
  color: "blue" | "purple" | "yellow" | "orange" | "green" | "red";
}

export interface Opportunity {
  id: string | number;
  title: string;
  contact_name: string;
  company?: string;
  expected_close_date?: string;
  value?: number;
  probability: number;
  stage: string;
}