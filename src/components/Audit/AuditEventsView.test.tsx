import {act} from 'react';
import {createRoot} from 'react-dom/client';
import AuditEventsView, {AuditViewEvent} from './AuditEventsView';

it('preserva toda a página do servidor, paginação única e detalhes do evento', () => {
  const events: AuditViewEvent[] = Array.from({length:50}, (_, index)=>({
    id:index+1,company_id:1,username:`Pessoa ${index+1}`,station_name:'Estação',module_key:'compras',entity_type:'purchase_order',entity_id:String(index+1),
    action:'create',outcome:'success',reauth_outcome:'valid',reason:null,correlation_id:null,changes:null,ip_address:null,created_at:'2026-10-26T12:00:00Z',
  }));
  const onPageChange=jest.fn();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div');
  const root=createRoot(container);
  try {
    act(()=>root.render(<AuditEventsView events={events} total={120} page={2} pageSize={50} loading={false} error={null}
      filters={{}} options={{modules:[],actions:[],stations:[],users:[]}} onFiltersChange={jest.fn()} onPageChange={onPageChange} onRefresh={jest.fn()}/>));
    expect(container.querySelectorAll('tr')).toHaveLength(51);
    const next=Array.from(container.querySelectorAll('button')).filter(button=>button.textContent?.trim()==='Próxima');
    expect(next).toHaveLength(1);
    act(()=>next[0].click());
    expect(onPageChange).toHaveBeenCalledWith(3);
    act(()=>container.querySelector<HTMLButtonElement>('button[aria-label^="Detalhes do evento de Pessoa 50 em"]')!.click());
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('Pessoa 50');
  } finally {act(()=>root.unmount());}
});
