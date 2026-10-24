import {useEffect} from 'react';
import {useAuth} from '../AuthContext';
import {syncLocalDrafts} from './salesDrafts';
export default function DraftSync(){
  const {user,company,activeLegalEntity}=useAuth();
  useEffect(()=>{
    if(!user?.id||!company?.id||!activeLegalEntity?.id)return;
    const sync=()=>{void syncLocalDrafts({userId:Number(user.id),companyId:Number(company.id),legalEntityId:Number(activeLegalEntity.id)}).catch(error=>console.error('Rascunho local preservado; sincronização indisponível:',error.message));};
    sync();const timer=setInterval(sync,15000);window.addEventListener('online',sync);
    return()=>{clearInterval(timer);window.removeEventListener('online',sync);};
  },[user?.id,company?.id,activeLegalEntity?.id]);
  return null;
}
