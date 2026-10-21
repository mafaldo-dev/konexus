import { apiClient } from '../api/client';

export type CrmResource='leads'|'opportunities'|'activities';
export interface CrmStage {id:number;name:string;position:number;outcome:'open'|'won'|'lost';probability:number;}
export interface CrmRecord {
  id:number; version:number; name?:string; title?:string; email?:string; phone?:string;
  status?:string; source?:string; owner_id:number; stage_id?:number; amount?:string;
  lead_id?:number; customer_id?:number; expected_close_date?:string; notes?:string;
  due_at?:string; completed_at?:string; kind?:string; probability?:number;
}
export interface CrmPage {data:CrmRecord[];total:number;page:number;limit:number;}
export interface CrmMetrics {
  new_leads:number;qualified_leads:number;open_count:number;won_count:number;lost_count:number;
  pipeline:string;weighted:string;average_won:string;win_rate:string|null;overdue_activities:number;
}
export interface CrmHistory {id:string;username:string;action:string;outcome:string;created_at:string;correlation_id:string;changes:Record<string,{from:unknown;to:unknown}>;}
export const crmService={
  history:(kind:string,id:number,page:number)=>apiClient.get<CrmHistory[]>(`crm/history/${kind}/${id}?page=${page}`),
  list:(resource:CrmResource,page:number,search:string,stageId='')=>apiClient.get<CrmPage>(`crm/${resource}?${new URLSearchParams({page:String(page),search,stageId})}`),
  stages:()=>apiClient.get<CrmStage[]>('crm/stages'),
  metrics:()=>apiClient.get<CrmMetrics>('crm/dashboard'),
  owners:()=>apiClient.get<Array<{id:number;username:string}>>('crm/owners'),
  customers:(search:string)=>apiClient.get<Array<{id:number;name:string;code:string}>>(`crm/customers?${new URLSearchParams({search})}`),
  create:(resource:CrmResource,input:object)=>apiClient.post<CrmRecord>(`crm/${resource}`,input),
  update:(resource:CrmResource,id:number,input:object)=>apiClient.patch<CrmRecord>(`crm/${resource}/${id}`,input),
  complete:(id:number)=>apiClient.post<CrmRecord>(`crm/activities/${id}/complete`),
  stage:(input:object)=>apiClient.post<CrmStage>('crm/stages',input),
};
