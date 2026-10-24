import {useEffect} from 'react';
import {useAuth} from '../AuthContext';
import {syncLocalDrafts,resumeLocalDrafts} from './salesDrafts';
export default function DraftSync(){
  const {user,company,activeLegalEntity,legalEntities,token}=useAuth();
  const entityIds=(legalEntities?.length?legalEntities.map(entity=>entity.id):[activeLegalEntity?.id]).filter(Boolean).sort().join(',');
  useEffect(()=>{
    if(!user?.id||!company?.id||!entityIds)return;
    let stopped=false,running=false;
    const scopes=entityIds.split(',').map(id=>({userId:Number(user.id),companyId:Number(company.id),legalEntityId:Number(id)}));
    const sync=()=>{if(running)return;running=true;void (async()=>{
      for(const scope of scopes){if(stopped)return;await syncLocalDrafts(scope);}
    })().catch(error=>console.error('Rascunho local preservado; sincronização indisponível:',error.message)).finally(()=>{running=false;});};
    void Promise.all(scopes.map(resumeLocalDrafts)).then(()=>{if(!stopped)sync();}).catch(()=>{if(!stopped)sync();});
    const timer=setInterval(sync,15000);window.addEventListener('online',sync);
    return()=>{stopped=true;clearInterval(timer);window.removeEventListener('online',sync);};
  },[user?.id,company?.id,entityIds,token]);
  return null;
}
