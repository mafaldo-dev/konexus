import {act} from 'react';
import {createRoot} from 'react-dom/client';
import ProductUpdatesPanel from './ProductUpdatesPanel';
jest.mock('../../AuthContext',()=>({useAuth:()=>({
  modules:['gestao','compras','estoque','rh','crm','nfe'],permissions:[],isCompanyAdmin:true,
})}));

it('mostra cinco destaques funcionais e filtra sem carregar o histórico antigo',()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div');
  const root=createRoot(container);
  try {
    act(()=>root.render(<ProductUpdatesPanel/>));
    expect(container.querySelectorAll('li')).toHaveLength(5);
    expect(container.textContent).not.toContain('Permissões por tela e por operação');
    const rh=Array.from(container.querySelectorAll('button')).find(button=>button.textContent==='RH')!;
    act(()=>rh.click());
    expect(container.querySelectorAll('li')).toHaveLength(1);
    expect(container.textContent).toContain('Baixe os certificados dos treinamentos concluídos');
  } finally {act(()=>root.unmount());}
});
