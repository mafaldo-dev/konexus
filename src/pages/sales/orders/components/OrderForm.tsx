import { useForm } from "react-hook-form";
import { Trash2, Package, User, MapPin, RefreshCw, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

import {
  createOrder,
  getNextOrderNumber,
  updateOrder,
  getOrderCustomers,
} from "../../../../services/orderService";
import { Order, OrderResponse } from "../../../../types/sales/orders";
import { Customer, ProductsProps } from "../../../../types";
import { useInvoiceProductsManagement } from "../../../../hooks/_manager/useProductManagement";
import { useAuth } from "../../../../AuthContext";
import { clearLocalDraft, loadLocalDraft, readDraftPayload, saveLocalDraft, syncLocalDrafts, LocalDraft } from '../../../../offline/salesDrafts';
import { cancelReservation, listOfflineOrders, loadReservation, queueOfflineOrder, reservationIsLocked, reservationMatchesProducts, reserveStock, retryOfflineOrder, StockReservation, OfflineOrder, syncOfflineOrders } from '../../../../offline/stockReservations';

type FormValues = {
  orderDate: string;
  orderStatus: string;
  customerId: string | number;
  name: string;
  phone: string;
  code: string;
  currency: string;
  salesperson: string;
  notes?: string;
  carrier: string
  payment_method: string
  shippingAddressId?: string | any;
  billingAddressId?: string | any;
};

interface OrderFormProps {
  editMode?: boolean;
  initialData?: OrderResponse;
  orderId?: number;
}

export default function OrderForm(props:OrderFormProps) {
  const {user,activeLegalEntity}=useAuth();
  return <OrderFormContent key={`${user?.id}:${activeLegalEntity?.id}:${props.orderId||'new'}`} {...props}/>;
}
function OrderFormContent({ editMode = false, initialData, orderId }: OrderFormProps) {
  const [products, setProducts] = useState<ProductsProps[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>("Carregando...");
  const [orderNumberError, setOrderNumberError] = useState<string | null>(null);
  const [loadingOrderNumber, setLoadingOrderNumber] = useState(true);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const hasPrefilledData = useRef(false);

  const navigate = useNavigate();
  const { user, company, activeLegalEntity, hasPermission } = useAuth();
  const canSaveOrder=hasPermission('vendas',editMode?'edit':'create');
  const [draftReady,setDraftReady]=useState(false);
  const [draftStatus,setDraftStatus]=useState('Preparando proteção local…');
  const [reservation,setReservation]=useState<StockReservation|null>(null);
  const [offlineOrder,setOfflineOrder]=useState<OfflineOrder|null>(null);
  const [reservationStatus,setReservationStatus]=useState('');
  const [reservationBusy,setReservationBusy]=useState(false);
  const [reservationChecked,setReservationChecked]=useState(!Boolean((window as any).ipcRenderer));
  const [online,setOnline]=useState(typeof navigator==='undefined'?true:navigator.onLine);
  const draftRef=useRef<LocalDraft | undefined>(undefined);
  const saveChain=useRef<Promise<any>>(Promise.resolve());
  const finished=useRef(false);
  const hasNativeOffline=Boolean((window as any).ipcRenderer);
  const reservationLocked=reservationIsLocked(reservation);
  const orderConfirmed=offlineOrder?.state==='confirmed';
  const submissionLockedByState=Boolean(
    !reservationChecked ||
    orderConfirmed ||
    (offlineOrder && ['pending','leased','blocked'].includes(offlineOrder.state)) ||
    reservation?.status==='queued' ||
    reservation?.status==='blocked'
  );
  const submitLabel=!canSaveOrder?'Acesso Restrito'
    :!reservationChecked?'Verificando reserva local…'
      :orderConfirmed?'Pedido confirmado'
        :(offlineOrder&&['pending','leased'].includes(offlineOrder.state))?'Aguardando sincronização'
          :offlineOrder?.state==='blocked'||reservation?.status==='blocked'?'Reserva bloqueada'
            :isSubmitting?(editMode?'Atualizando...':'Enviando...')
              :!online&&!reservationLocked?'Salvar rascunho local'
                :reservationLocked?(reservation?.effectiveStatus==='expired'?'Enfileirar com reserva vencida':'Enfileirar pedido reservado')
                  :editMode?'Atualizar Pedido':'Criar Pedido';

  const isSalesPerson = user?.role === "Vendedor" && user?.sector === "Comercial";

  const { register, handleSubmit, formState: { errors }, setValue, getValues, reset, watch } = useForm<FormValues>({
    defaultValues: {
      orderDate: format(new Date(), "yyyy-MM-dd"),
      orderStatus: "pending",
      currency: "BRL",
      salesperson: isSalesPerson ? user.username : "",
      payment_method: "pix"
    },
  });

  const {
    productCode,
    setProductCode,
    selectedProduct,
    quantity,
    setQuantity,
    unitCost,
    setUnitCost,
    searchProduct,
    addProductToInvoice,
  } = useInvoiceProductsManagement();

  const scope={companyId:Number(company?.id),legalEntityId:Number(activeLegalEntity?.id),userId:Number(user?.id)};
  const slot=editMode?`edit-${orderId}`:'new';
  const draftState=useRef({products,selectedCustomer,addressConfirmed,orderNumber});
  draftState.current={products,selectedCustomer,addressConfirmed,orderNumber};
  const persistDraft=()=>{
    if(!draftReady||!reservationChecked||finished.current||!scope.companyId||!scope.legalEntityId||!scope.userId)return Promise.resolve();
    const payload={values:getValues(),...draftState.current,...(editMode?{editOrderId:orderId}:{})};
    saveChain.current=saveChain.current.catch(()=>{}).then(async()=>{
      // Uma gravação já enfileirada não pode criar uma revisão nova depois
      // que o pedido entrou na fila imutável: essa revisão sobreviveria ao
      // ACK exato e permitiria um segundo pedido a partir da mesma reserva.
      if(finished.current)return;
      draftRef.current=await saveLocalDraft(scope,payload,draftRef.current?.revisionId||null,slot);
      setDraftStatus('Salvo neste dispositivo — aguardando sincronização');
    }).catch(error=>{setDraftStatus(`Falha ao salvar localmente: ${error.message}`);throw error;});
    return saveChain.current;
  };
  useEffect(()=>{
    let live=true;
    if(!scope.companyId||!scope.legalEntityId||!scope.userId)return;
    loadLocalDraft(scope,slot).then(async row=>{
      if(row){
        const payload=await readDraftPayload(row);
        if(!live)return;
        draftRef.current=row;reset(payload.values);
        setProducts(payload.products);setSelectedCustomer(payload.selectedCustomer);setAddressConfirmed(payload.addressConfirmed);
        setDraftStatus(row.synced?'Rascunho recuperado — cópia sincronizada':'Rascunho recuperado deste dispositivo — sincronização pendente');
      }else setDraftStatus('Salvamento local automático ativo');
      if(live)setDraftReady(true);
    }).catch(error=>{if(live)setDraftStatus(`Armazenamento local indisponível: ${error.message}`);});
    return()=>{live=false;};
    // O componente é remontado quando usuário/CNPJ/pedido muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[scope.companyId,scope.legalEntityId,scope.userId]);
  useEffect(()=>{
    if(!draftReady)return;
    const subscription=watch(()=>{void persistDraft().catch(()=>{});});
    return()=>subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[draftReady,watch]);
  useEffect(()=>{if(draftReady&&reservationChecked)void persistDraft().catch(()=>{});},[draftReady,reservationChecked,products,selectedCustomer,addressConfirmed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    const up=()=>setOnline(true),down=()=>setOnline(false);
    window.addEventListener('online',up);window.addEventListener('offline',down);
    return()=>{window.removeEventListener('online',up);window.removeEventListener('offline',down);};
  },[]);

  useEffect(()=>{
    const update=()=>{void loadLocalDraft(scope,slot).then(row=>{
      if(row?.revisionId===draftRef.current?.revisionId)setDraftStatus(row?.synced?'Salvo no dispositivo e no banco online':row?.error?`Salvo localmente. ${row.error}`:'Salvo localmente — sincronização pendente');
    }).catch(()=>{});};
    window.addEventListener('konexus:drafts-changed',update);
    return()=>window.removeEventListener('konexus:drafts-changed',update);
  },[scope.companyId,scope.legalEntityId,scope.userId,slot]);

  useEffect(()=>{
    let live=true;
    if(!hasNativeOffline||!scope.companyId||!scope.legalEntityId||!scope.userId){
      setReservationStatus(hasNativeOffline?'':'A reserva de estoque offline exige o aplicativo desktop.');
      return;
    }
    const refresh=()=>{
      void Promise.all([loadReservation(scope,slot),listOfflineOrders(scope)]).then(([current,orders])=>{
        if(!live)return;
        setReservation(current);
        const related=current?orders.find(order=>order.reservationId===current.id)||null:null;
        setOfflineOrder(related);
        // Um pedido ja enfileirado e imutavel. Nao criar nova revisao de
        // rascunho enquanto a confirmacao exata nao chegar; isso evitava que
        // um rascunho novo sobrevivesse ao ACK e permitisse duplicidade.
        if(related||current?.status==='queued'||current?.status==='blocked')finished.current=true;
        setReservationChecked(true);
        if(related?.state==='confirmed')setReservationStatus(`Pedido confirmado na central como ${related.serverOrderNumber||'número pendente'}.`);
        else if(related?.state==='blocked')setReservationStatus(`Pedido preservado neste dispositivo, mas bloqueado (${related.errorCode||'revisão necessária'}). Nada foi descartado.`);
        else if(related?.state==='pending'||related?.state==='leased')setReservationStatus('Pedido na fila local; aguardando confirmação exata do servidor.');
        else if(current){
          const expired=current.effectiveStatus==='expired';
          setReservationStatus(expired
            ?'Reserva vencida: o estoque continua retido até liberação explícita. Você ainda pode consumi-la ou cancelá-la online.'
            :'Estoque reservado para esta estação. Os itens estão travados até o envio ou cancelamento.');
        } else setReservationStatus('Nenhuma reserva de estoque para este rascunho.');
      }).catch(error=>{if(live){setReservationStatus(error instanceof Error?error.message:'Não foi possível ler a reserva local.');setReservationChecked(true);}});
    };
    refresh();window.addEventListener('konexus:offline-orders-changed',refresh);
    return()=>{live=false;window.removeEventListener('konexus:offline-orders-changed',refresh);};
  },[hasNativeOffline,scope.companyId,scope.legalEntityId,scope.userId,slot]);

  // ==================== EFFECTS ==================== //

  useEffect(() => {
    if (editMode && initialData && !hasPrefilledData.current) {
      hasPrefilledData.current = true;

      setValue("orderDate", initialData.orderDate.split('T')[0]);
      setValue("customerId", initialData.customer.id.toString());
      setValue("currency", initialData.currency);
      setValue("salesperson", initialData.salesperson || "");
      setValue("notes", initialData.notes || "");
      setValue("payment_method", initialData.payment_method || "pix");
      setValue("shippingAddressId", initialData.shipping?.id?.toString() || "");
      setValue("billingAddressId", initialData.billing?.id?.toString() || "");

      if (initialData.orderItems?.length > 0) {
        const formattedProducts: ProductsProps[] = initialData.orderItems.map(item => ({
          id: item.productId.toString(),
          productname: item.productName,
          name: item.productName,
          code: item.productCode,
          quantity: item.quantity,
          price: item.unitPrice,
          coast: item.unitPrice,
          location: item.location || "",
          stock: 0,
          total_price: item.quantity * item.unitPrice
        }));
        setProducts(formattedProducts);
      }

      const customerData: Customer = {
        id: initialData.customer.id,
        name: initialData.customer.name,
        phone: initialData.customer.phone || "",
        email: initialData.customer.email || "",
        code: initialData.customer.code,
        status: initialData.customer.status || "",
        cpf_cnpj: initialData.customer.cpf_cnpj ||"",
        address: {
          id: initialData.shipping?.id || initialData.billing?.id || "",
          city: initialData.shipping?.city || initialData.billing?.city || "",
          number: initialData.shipping?.number || initialData.billing?.number || 0,
          street: initialData.shipping?.street || initialData.billing?.street || "",
          zip: initialData.shipping?.zip || initialData.billing?.zip || "",
          state: initialData.shipping?.state || initialData.billing?.state || "",
          city_code: initialData.shipping?.city_code || initialData.billing?.city_code || "",
          neighborhood: initialData.shipping?.neighborhood || initialData.billing?.neighborhood || "",
          type: 'shipping'
        },
        createdAt: new Date().toISOString()
      };
      setSelectedCustomer(customerData);

      if (initialData.shipping?.id && initialData.billing?.id) {
        setAddressConfirmed(true);
      }

      setOrderNumber(initialData.orderNumber);
    }
  }, [editMode, initialData, setValue]);

  useEffect(() => {
    const loadOrderNumber = async () => {
      if (editMode) return;

      try {
        setLoadingOrderNumber(true);
        setOrderNumberError(null);
        const newOrderNumber = await getNextOrderNumber();
        setOrderNumber(newOrderNumber);
      } catch (error) {
        console.error("Erro ao carregar número do pedido:", error);
        setOrderNumber("Não disponível");
        setOrderNumberError(
          error instanceof Error
            ? error.message
            : "Não foi possível obter o número do próximo pedido."
        );
      } finally {
        setLoadingOrderNumber(false);
      }
    };
    loadOrderNumber();
  }, [editMode]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setCustomersError(null);
        const response = await getOrderCustomers();
        if (!response.ok || !response.data) {
          setCustomers([]);
          setCustomersError(
            response.error || "Não foi possível carregar os clientes."
          );
          return;
        }
        setCustomers(response.data);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        setCustomers([]);
        setCustomersError(
          "Não foi possível carregar os clientes. Tente novamente."
        );
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, []);

  // ==================== HANDLERS ==================== //

  const refreshOrderNumber = async () => {
    try {
      setLoadingOrderNumber(true);
      setOrderNumberError(null);
      const newOrderNumber = await getNextOrderNumber();
      setOrderNumber(newOrderNumber);
    } catch (error) {
      console.error("Erro ao recarregar número do pedido:", error);
      setOrderNumber("Não disponível");
      setOrderNumberError(
        error instanceof Error
          ? error.message
          : "Não foi possível obter o número do próximo pedido."
      );
    } finally {
      setLoadingOrderNumber(false);
    }
  };

  const reserveNow = async () => {
    if(editMode)return;
    if(!reservationChecked){
      await Swal.fire('Verificando reserva local','Aguarde a leitura do SQLite. Reservar antes disso poderia criar uma segunda reserva para o mesmo rascunho.','info');
      return;
    }
    if(!hasNativeOffline){
      await Swal.fire('Aplicativo desktop necessário','A reserva de estoque offline usa o SQLite protegido do aplicativo. No navegador, o pedido online continua disponível.','info');
      return;
    }
    if(!scope.companyId||!scope.legalEntityId||!scope.userId){
      await Swal.fire('Contexto incompleto','Entre novamente com organização, CNPJ e usuário definidos.','error');
      return;
    }
    if(!user?.stationId){
      await Swal.fire('Computador não registrado','A reserva é vinculada à estação de trabalho. Peça ao administrador para vincular este computador em Configurações > Estações com um código de pareamento válido e, depois, saia e entre novamente.','error');
      return;
    }
    if(products.length===0){
      await Swal.fire('Sem itens','Adicione os produtos antes de reservar estoque.','info');
      return;
    }
    if(!selectedCustomer){
      await Swal.fire('Selecione o cliente','A reserva deve estar ligada a um pedido que possa ser finalizado.','info');
      return;
    }
    if(!getValues('shippingAddressId')||!getValues('billingAddressId')){
      await Swal.fire('Defina os endereços','Confirme entrega e cobrança antes de reservar o estoque.','info');
      return;
    }
    const list=products.map(product=>`${product.productname}: ${product.quantity}`).join('<br>');
    const confirmation=await Swal.fire({
      title:'Reservar estoque para esta estação?',
      html:`<p>As unidades abaixo ficarão retidas para este CNPJ, usuário e computador:</p><p class="mt-2"><strong>${list}</strong></p><p class="mt-3 text-sm">A reserva exige confirmação de senha. Ela não cria o pedido nem libera estoque automaticamente ao vencer.</p>`,
      icon:'question',showCancelButton:true,confirmButtonText:'Reservar estoque',cancelButtonText:'Voltar'
    });
    if(!confirmation.isConfirmed)return;
    setReservationBusy(true);
    try{
      await persistDraft();
      const created=await reserveStock(scope,slot,products.map(product=>({productId:Number(product.id),quantity:Number(product.quantity)})));
      setReservation(created);setOfflineOrder(null);
      setReservationStatus('Estoque reservado para esta estação. Os itens estão travados; o pedido pode ser preparado e enfileirado mesmo sem internet.');
      await Swal.fire('Estoque reservado',`Reserva válida até ${new Date(created.expiresAt).toLocaleString('pt-BR')}. O estoque não será liberado automaticamente.`,'success');
    }catch(error){
      await Swal.fire('Reserva não criada',error instanceof Error?error.message:'Nenhuma unidade foi reservada.','error');
    }finally{setReservationBusy(false);}
  };

  const cancelReservedStock = async () => {
    if(!reservation)return;
    if(offlineOrder&&['pending','leased'].includes(offlineOrder.state)){
      await Swal.fire('Pedido na fila','Sincronize ou resolva o pedido antes de liberar a reserva. O estoque continua retido.','info');
      return;
    }
    const confirmation=await Swal.fire({
      title:'Liberar a reserva?',
      html:'<p>O servidor devolverá as unidades ao estoque livre. Esta ação exige confirmação de senha e conexão com a central.</p>',
      icon:'warning',showCancelButton:true,confirmButtonText:'Liberar reserva',cancelButtonText:'Manter'
    });
    if(!confirmation.isConfirmed)return;
    setReservationBusy(true);
    try{
      await cancelReservation(scope,reservation.id,'Cancelamento solicitado na estação de trabalho');
      finished.current=false;
      setReservation(null);setOfflineOrder(null);setReservationStatus('Reserva liberada na central; o estoque voltou ao saldo livre. O rascunho atual pode ser editado.');
      await Swal.fire('Reserva liberada','O estoque voltou a ficar disponível para outras operações.','success');
    }catch(error){
      await Swal.fire('Reserva preservada',error instanceof Error?error.message:'O servidor não confirmou a liberação. Nada foi alterado localmente.','error');
    }finally{setReservationBusy(false);}
  };

  const syncOfflineNow = async () => {
    setReservationBusy(true);
    try{await syncOfflineOrders(scope);}
    catch(error){await Swal.fire('Sincronização indisponível',error instanceof Error?error.message:'O pedido e a reserva continuam preservados neste dispositivo.','error');}
    finally{setReservationBusy(false);}
  };

  const retryOfflineOrderNow = async () => {
    if(!offlineOrder)return;
    setReservationBusy(true);
    try{
      await retryOfflineOrder(scope,offlineOrder.operationId);
      if(navigator.onLine)await syncOfflineOrders(scope);
      setReservationStatus(navigator.onLine?'Reenvio solicitado; aguardando confirmação exata do servidor.':'Reenvio agendado; o pedido será sincronizado quando a conexão voltar.');
    }catch(error){
      await Swal.fire('Pedido preservado',error instanceof Error?error.message:'Não foi possível reenviar. O conteúdo continua no dispositivo.','error');
    }finally{setReservationBusy(false);}
  };

  const handleCustomerChange = (customerId: string) => {
    const customerIdNum = parseInt(customerId);
    setValue("customerId", customerIdNum);
    setAddressConfirmed(false);

    const customer = customers.find(c => c.id === customerIdNum);
    if (customer) {
      setSelectedCustomer(customer);
      setValue("shippingAddressId", undefined);
      setValue("billingAddressId", undefined);
    } else {
      setSelectedCustomer(null);
    }
  };

  const useCustomerAddress = () => {
    if (selectedCustomer?.address?.id) {
      const addressId = selectedCustomer.address.id.toString();
      setValue("shippingAddressId", addressId);
      setValue("billingAddressId", addressId);
      setAddressConfirmed(true);
      Swal.fire("Info", "Endereço definido para entrega e cobrança!", "success");
    } else {
      Swal.fire("Aviso", "Este cliente não possui endereço válido cadastrado!", "warning");
    }
  };

  const formatAddress = (customer: Customer) => {
    if (!customer.address) return "Endereço não cadastrado";
    const { street, number, city, zip } = customer.address;
    return `${street}, ${number} - ${city} - ${zip}`;
  };

  //Função para adicionar produto convertendo para ProductsProps
  const handleAddProductWithStockCheck = () => {
    if(reservationLocked){
      void Swal.fire('Itens reservados','Cancele ou resolva a reserva antes de alterar produtos e quantidades. O servidor exige correspondência exata entre reserva e pedido.','info');
      return;
    }
    if (!selectedProduct) return;

    const existingProduct = products.find(p => p.id === selectedProduct.id);
    const totalQuantity = existingProduct ? existingProduct.quantity + quantity : quantity;

    const availableStock = Math.max(0, Number(selectedProduct.stock || 0) - Number(selectedProduct.reserved || 0));

    if (totalQuantity > availableStock) {
      Swal.fire({
        title: "Estoque Insuficiente!",
        html: `Quantidade solicitada: <strong>${totalQuantity}</strong><br>Estoque disponível: <strong>${availableStock}</strong>`,
        icon: "warning",
        confirmButtonText: "Entendi"
      });
      return;
    }

    // Guarda o saldo fisico e as unidades reservadas separadamente. O saldo
    // disponivel e sempre calculado como `stock - reserved`; gravar apenas o
    // disponivel aqui descontaria a reserva duas vezes no envio.
    const physicalStock = Number(selectedProduct.stock || 0);
    const newProduct: ProductsProps = {
      id: selectedProduct.id,
      productname: selectedProduct.name,
      name: selectedProduct.name,
      code: selectedProduct.code,
      quantity: quantity,
      price: unitCost,
      coast: unitCost,
      location: selectedProduct.location || "",
      stock: physicalStock,
      reserved: Number(selectedProduct.reserved || 0),
      total_price: quantity * unitCost
    };

    if (existingProduct) {
      setProducts(prev => prev.map(p =>
        p.id === selectedProduct.id
          ? {
            ...p,
            quantity: p.quantity + quantity,
            total_price: (p.quantity + quantity) * p.price,
            stock: physicalStock,
            reserved: Number(selectedProduct.reserved || 0)
          }
          : p
      ));
    } else {
      setProducts(prev => [...prev, newProduct]);
    }

    addProductToInvoice();
  };

  // Sinaliza ao seletor global que existe um pedido/orçamento em andamento.
  // A troca de CNPJ exige confirmação e nunca descarta os dados já digitados.
  useEffect(() => {
    if (products.length === 0 && !selectedCustomer) return;
    localStorage.setItem(
      "konexus:operation-in-progress",
      JSON.stringify({
        label: `${editMode ? "pedido" : "novo pedido/orçamento"} ${orderNumber !== "Carregando..." ? orderNumber : ""}`.trim(),
        path: window.location.pathname,
      })
    );
    return () => localStorage.removeItem("konexus:operation-in-progress");
  }, [products.length, selectedCustomer, orderNumber, editMode]);

  const onSubmit = async (data: FormValues) => {
    if (!canSaveOrder) {
      Swal.fire({
        title: "Acesso Restrito",
        text: "Sua conta não tem permissão para salvar este pedido.",
        icon: "error",
        confirmButtonText: "Entendi"
      });
      return;
    }
    if (!reservationChecked) {
      await Swal.fire(
        'Verificando reserva local',
        'Aguarde a leitura do SQLite protegido. O envio fica bloqueado até sabermos se existem unidades já reservadas para esta estação.',
        'info'
      );
      return;
    }
    try { await persistDraft(); } catch (error) {
      await Swal.fire('Não foi possível proteger o rascunho',error instanceof Error?error.message:'Verifique o armazenamento do dispositivo.','error');
      return;
    }
    if (orderConfirmed) {
      await Swal.fire('Pedido já confirmado',`A central já registrou este pedido como ${offlineOrder?.serverOrderNumber||'confirmado'}. Não envie novamente.`,'info');
      return;
    }

    if (offlineOrder && ['pending','leased'].includes(offlineOrder.state)) {
      await Swal.fire('Pedido na fila local','Aguarde a confirmação exata do servidor. Os itens permanecem travados e o estoque reservado.','info');
      return;
    }

    if (products.length === 0) {
      Swal.fire("Info", "Adicione pelo menos um produto ao pedido!", "info");
      return;
    }

    if (!data.customerId) {
      Swal.fire("Info", "Selecione um cliente!", "info");
      return;
    }

    if (!data.shippingAddressId || !data.billingAddressId) {
      Swal.fire("Info", "Defina o endereço para entrega e cobrança.", "question");
      return;
    }

    const reservationActive = Boolean(!editMode && reservation && reservation.status === 'active');
    if (reservation && ['queued','blocked'].includes(reservation.status)) {
      await Swal.fire('Pedido já reservado','Existe um pedido enfileirado ou bloqueado para esta reserva. Use as ações de sincronização ou liberação exibidas no aviso acima.','info');
      return;
    }
    if (reservationActive && !hasNativeOffline) {
      await Swal.fire('Aplicativo desktop necessário','A fila de pedidos offline exige o SQLite protegido do aplicativo.','error');
      return;
    }
    if (reservationActive && !reservationMatchesProducts(reservation!, products)) {
      await Swal.fire('Itens diferentes da reserva','A reserva foi criada para outros produtos ou quantidades. Cancele a reserva online e crie outra com os itens atuais. Nenhum pedido foi enfileirado.','error');
      return;
    }

    if (!navigator.onLine && !reservationActive) {
      await Swal.fire(
        'Rascunho salvo localmente',
        reservation
          ? 'A reserva existente está bloqueada ou já foi enfileirada. Resolva o pedido antes de criar outro.'
          : 'Para finalizar sem internet, conecte-se primeiro e use "Reservar estoque". A reserva é a autorização que impede outra estação de usar as mesmas unidades.',
        'info'
      );
      return;
    }

    if (!reservationActive && !editMode && (orderNumberError || orderNumber === "Não disponível")) {
      Swal.fire(
        "Número do pedido indisponível",
        orderNumberError ||
          "Não foi possível obter a sequência real de pedidos. Tente novamente antes de salvar.",
        "error"
      );
      return;
    }

    // A edicao devolve ao estoque a quantidade da versao anterior no backend
    // antes de validar a nova. O formulario nao recebe esse saldo restaurado
    // em `initialData`, por isso a checagem local seria falsa; o servidor
    // continua sendo a autoridade e rejeita falta real de estoque.
    if (!reservationActive && !editMode) {
      const stockIssues = products.filter(product => {
        const availableStock = Math.max(0, Number(product.stock || 0) - Number(product.reserved || 0));
        return product.quantity > availableStock;
      });

      if (stockIssues.length > 0) {
        const productNames = stockIssues.map(p => p.productname).join(', ');
        Swal.fire({
          title: "Estoque Insuficiente!",
          html: `Os seguintes produtos não têm estoque suficiente:<br><strong>${productNames}</strong><p class="mt-2 text-sm">O saldo exibido desconta unidades reservadas para outras estações.</p>`,
          icon: "error",
          confirmButtonText: "Entendi"
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const totalAmount = products.reduce((acc, p) => acc + p.quantity * p.price, 0);

      const orderData: Order = {
        ...(!editMode&&draftRef.current?{clientRequestId:draftRef.current.draftId}:{}),
        orderDate: data.orderDate,
        orderStatus: "pending",
        orderNumber: orderNumber,
        customerId: data.customerId,
        customerName: selectedCustomer?.name || "",
        customerPhone: selectedCustomer?.phone || "",
        customerCode: selectedCustomer?.code || "",
        totalAmount,
        currency: data.currency,
        salesperson: data.salesperson,
        notes: data.notes,
        carrier: data.carrier,
        payment_method: data.payment_method,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
        orderItems: products.map((p) => ({
          productId: p.id,
          quantity: p.quantity,
          unitPrice: p.price,
          location: p.location,
        })),
      };

      if (!editMode && reservationActive && reservation) {
        // Bloqueia novas revisões antes de enfileirar. Se o SQLite falhar,
        // o rascunho volta a ser editável e permanece recuperável.
        finished.current = true;
        let queued: OfflineOrder;
        try {
          queued = await queueOfflineOrder(
            scope,
            slot,
            reservation.id,
            {
              orderDate: data.orderDate,
              customerId: Number(data.customerId),
              totalAmount,
              currency: data.currency,
              salesperson: data.salesperson,
              notes: data.notes,
              carrier: data.carrier,
              payment_method: data.payment_method,
              shippingAddressId: data.shippingAddressId,
              billingAddressId: data.billingAddressId,
              orderItems: products.map((p) => ({
                productId: Number(p.id),
                quantity: Number(p.quantity),
                unitPrice: Number(p.price),
                location: p.location,
              })),
            },
            draftRef.current?.revisionId || null
          );
        } catch (error) {
          finished.current = false;
          throw error;
        }
        localStorage.removeItem("konexus:operation-in-progress");
        setOfflineOrder(queued);
        setReservation({ ...reservation, status: 'queued' });
        setReservationStatus(
          navigator.onLine
            ? 'Pedido enfileirado; enviando à central para confirmação exata…'
            : 'Pedido enfileirado neste dispositivo. O estoque permanece reservado até a confirmação do servidor.'
        );
        let current = queued;
        if (navigator.onLine) {
          try {
            await syncOfflineOrders(scope);
            const orders = await listOfflineOrders(scope);
            current = orders.find((order) => order.operationId === queued.operationId) || queued;
            setOfflineOrder(current);
          } catch (syncError) {
            setReservationStatus(
              `Pedido salvo e preservado neste dispositivo. A sincronização falhou: ${
                syncError instanceof Error ? syncError.message : String(syncError)
              }`
            );
          }
        }
        if (current.state === 'confirmed') {
          setReservation(null);
          setReservationStatus(
            `Pedido confirmado pelo servidor como ${current.serverOrderNumber}. O rascunho local foi removido após a confirmação.`
          );
          await Swal.fire({
            title: 'Pedido criado',
            html: `<p><strong>Pedido ${current.serverOrderNumber} confirmado pela central.</strong></p><p class="text-sm mt-2">O número foi atribuído pelo servidor. A reserva foi consumida exatamente uma vez.</p>`,
            icon: 'success',
            confirmButtonText: 'Ver Pedidos',
          });
          navigate('/sales/orders');
        } else if (current.state === 'blocked') {
          setReservationStatus(
            `Pedido preservado neste dispositivo, mas bloqueado (${current.errorCode || 'revisão necessária'}). Nada foi descartado; use as ações acima.`
          );
          await Swal.fire({
            title: 'Pedido preservado, mas bloqueado',
            html: `<p>O servidor não confirmou a criação. O pedido e a reserva continuam no dispositivo.</p><p class="mt-2 text-sm"><strong>${current.errorCode || 'REVISÃO'}</strong> — confira a reserva e use "Tentar novamente" ou "Liberar reserva".</p>`,
            icon: 'warning',
            confirmButtonText: 'Entendi',
          });
        } else {
          await Swal.fire({
            title: 'Pedido na fila offline',
            html: `<p>Pedido e reserva protegidos neste computador.</p><p class="text-sm mt-2">O número definitivo será atribuído pelo servidor na sincronização. Enquanto isso, as unidades continuam reservadas.</p>`,
            icon: 'info',
            confirmButtonText: 'Entendi',
          });
        }
        return;
      }

      let result;

      if (editMode && orderId) {
        result = await updateOrder(orderId, orderData);
      } else {
        result = await createOrder(orderData);
      }

      const orderResult = result.ok ? result.data : null;
      if (orderResult && orderResult.id) {
        finished.current=true;
        await saveChain.current.catch(()=>{});
        if(draftRef.current)await clearLocalDraft(scope,draftRef.current.revisionId,slot);
        Swal.fire({
          title: "Sucesso!",
          html: `
            <div>
              <p><strong>Pedido ${orderNumber} ${editMode ? 'atualizado' : 'criado'} com sucesso!</strong></p>
              <p class="text-sm mt-2">✓ Aguardando aprovação do financeiro</p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Ver Pedidos"
        });


        localStorage.removeItem("konexus:operation-in-progress");
        navigate("/sales/orders");
      } else {
        Swal.fire("Erro", `Erro ao ${editMode ? 'atualizar' : 'criar'} pedido.`, "error");
        setDraftStatus('Rascunho preservado. Confira o resultado do envio antes de alterar o número do pedido.');
      }
    } catch (err) {
      console.error(`Erro ao ${editMode ? 'atualizar' : 'criar'} pedido:`, err);
      Swal.fire("Erro", `Erro ao ${editMode ? 'atualizar' : 'criar'} pedido.`, "error");
      setDraftStatus('Rascunho preservado. Confira o resultado do envio antes de alterar o número do pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENDER ==================== //

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 space-y-3 rounded border border-blue-200 bg-blue-50 p-3 text-sm" role="status">
          <div>
            <strong>{draftStatus}</strong>
            <p>Rascunho protegido por usuário e CNPJ. A sincronização salva uma cópia online; não reserva estoque nem finaliza a venda.</p>
            <button type="button" className="mt-2 underline" onClick={()=>{void persistDraft().then(()=>syncLocalDrafts(scope)).catch(error=>setDraftStatus(error.message));}}>Salvar e sincronizar agora</button>
          </div>
          <div className="border-t border-blue-200 pt-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <strong>Reserva de estoque e fila offline</strong>
                <p className="mt-1 text-blue-900">{reservationStatus || 'Verificando reserva local…'}</p>
                {reservation && (
                  <p className="mt-1 text-xs text-blue-800">
                    Reserva {reservation.id.slice(0,8)}… · estação {reservation.deviceId} · expira {new Date(reservation.expiresAt).toLocaleString('pt-BR')} · {reservation.items.length} item(ns)
                  </p>
                )}
                {offlineOrder && (
                  <p className="mt-1 text-xs text-blue-800">
                    Pedido local {offlineOrder.operationId.slice(0,8)}… · {offlineOrder.state}
                    {offlineOrder.serverOrderNumber?` · ${offlineOrder.serverOrderNumber}`:''}
                    {offlineOrder.errorCode?` · ${offlineOrder.errorCode}`:''}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!editMode && !reservation && !orderConfirmed && !offlineOrder && hasNativeOffline && (
                  <button type="button" onClick={()=>{void reserveNow();}} disabled={reservationBusy||!online||!reservationChecked} className="rounded bg-slate-800 px-3 py-2 text-white disabled:opacity-50">
                    {!reservationChecked?'Verificando reserva…':online?'Reservar estoque para offline':'Conecte-se para reservar'}
                  </button>
                )}
                {!hasNativeOffline && <span className="max-w-xs text-xs text-blue-800">Reserva e fila offline disponíveis no aplicativo desktop com SQLite protegido.</span>}
                {reservation && offlineOrder && ['pending','leased'].includes(offlineOrder.state) && (
                  <button type="button" onClick={()=>{void syncOfflineNow();}} disabled={reservationBusy||!online} className="rounded border border-slate-400 bg-white px-3 py-2 text-slate-800 disabled:opacity-50">Sincronizar agora</button>
                )}
                {reservation && offlineOrder?.state==='blocked' && (
                  <button type="button" onClick={()=>{void retryOfflineOrderNow();}} disabled={reservationBusy} className="rounded border border-amber-500 bg-amber-50 px-3 py-2 text-amber-900 disabled:opacity-50">Tentar novamente</button>
                )}
                {reservation && !orderConfirmed && offlineOrder?.state!=='pending' && offlineOrder?.state!=='leased' && (
                  <button type="button" onClick={()=>{void cancelReservedStock();}} disabled={reservationBusy||!online||reservation.status==='queued'} className="rounded border border-red-300 bg-white px-3 py-2 text-red-700 disabled:opacity-50">Liberar reserva</button>
                )}
                {orderConfirmed && <button type="button" onClick={()=>navigate('/sales/orders')} className="rounded bg-slate-800 px-3 py-2 text-white">Ver pedidos</button>}
              </div>
            </div>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {activeLegalEntity && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-700">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Emitente deste documento</p>
                  <p className="truncate font-semibold text-slate-900">
                    {activeLegalEntity.tradeName || activeLegalEntity.legalName}
                    {activeLegalEntity.cnpjFormatted ? ` · ${activeLegalEntity.cnpjFormatted}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${activeLegalEntity.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {activeLegalEntity.status === 'active' ? 'Ativa' : 'Em regularização'}
                </span>
                <p className="w-full text-xs text-blue-800">O CNPJ selecionado no topo será gravado no pedido e usado em estoque, financeiro e fiscal. Confira antes de confirmar.</p>
              </div>
            )}

            {/* Informações do Pedido */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <Package className="w-4 h-4 text-slate-600" /> Informações do Pedido
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    Número do Pedido
                    {!editMode && !reservation && !offlineOrder && (
                      <button
                        type="button"
                        onClick={refreshOrderNumber}
                        disabled={loadingOrderNumber}
                        className="text-slate-500 hover:text-slate-700 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingOrderNumber ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </label>
                  <input
                    value={offlineOrder?.serverOrderNumber || (reservation||offlineOrder ? 'Pendente — definido pelo servidor' : orderNumber)}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono font-bold"
                  />
                  {orderNumberError && !reservation && !offlineOrder && (
                    <p className="mt-1 text-sm font-medium text-red-600">
                      {orderNumberError}
                    </p>
                  )}
                  {(reservation||offlineOrder) && (
                    <p className="mt-1 text-xs text-blue-700">O número definitivo é atribuído pelo servidor na confirmação; números enviados pelo cliente são ignorados.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Data do Pedido *</label>
                  <input
                    type="date"
                    {...register("orderDate", { required: "Data do pedido é obrigatória" })}
                    className={`w-full border rounded-lg p-3 ${errors.orderDate ? "border-red-300" : "border-gray-300"}`}
                  />
                  {errors.orderDate && <p className="text-red-600 text-sm mt-1">{errors.orderDate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <input
                    value={editMode ? orderNumber.includes("P-") ? "Pendente" : orderNumber.includes("A-") ? "Aprovado" : "Processando" : "Pendente - Aguardando Financeiro"}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg p-3 bg-yellow-50 text-yellow-700 font-medium"
                  />
                  <input type="hidden" {...register("orderStatus")} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vendedor *</label>
                  <input
                    {...register("salesperson", {
                      required: "Vendedor é obrigatório",
                      validate: () => canSaveOrder || "Sem permissão para salvar pedidos"
                    })}
                    className={`w-full border rounded-lg p-3 ${errors.salesperson ? "border-red-300" : "border-gray-300"
                      } ${isSalesPerson ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder={isSalesPerson ? "" : "Digite o nome do vendedor"}
                    readOnly={isSalesPerson}
                  />
                  {errors.salesperson && <p className="text-red-600 text-sm mt-1">{errors.salesperson.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transporte</label>
                  <input type="text"
                    {...register("carrier", {
                      required: "Transporte requerido"
                    })}
                    className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-700 font-medium"
                    placeholder="Transporte"
                  />
                  {errors.carrier && <p className="text-red-600 text-sm mt-1">{errors.carrier.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Moeda *</label>
                  <select {...register("currency")} className="w-full border border-gray-300 rounded-lg p-3">
                    <option value="BRL">BRL (Real)</option>
                    <option value="USD">USD (Dólar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Forma de Pagamento *</label>
                  <select
                    {...register("payment_method", { required: "Forma de pagamento é obrigatória" })}
                    className={`w-full border rounded-lg p-3 ${errors.payment_method ? "border-red-300" : "border-gray-300"}`}
                  >
                    <option value="pix">PIX</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="bank_slip">Boleto Bancário</option>
                    <option value="cash">Dinheiro</option>
                    <option value="bank_transfer">Transferência Bancária</option>
                  </select>
                  {errors.payment_method && <p className="text-red-600 text-sm mt-1">{errors.payment_method.message}</p>}
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <User className="w-4 h-4 text-slate-600" /> Dados do Cliente
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                  <select
                    {...register("customerId", { required: "Cliente é obrigatório" })}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    disabled={loadingCustomers}
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.code} - {customer.email}
                      </option>
                    ))}
                  </select>
                  {errors.customerId && <p className="text-red-600 text-sm mt-1">{errors.customerId.message}</p>}
                  {customersError && (
                    <p className="text-red-600 text-sm mt-1">{customersError}</p>
                  )}
                </div>

                {selectedCustomer && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Código</label>
                      <input value={selectedCustomer.code} readOnly className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
                      <input value={selectedCustomer.name} readOnly className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
                      <input value={selectedCustomer.phone} readOnly className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input value={selectedCustomer.email} readOnly className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Endereço Cadastrado
                        {addressConfirmed && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">✓ Definido</span>}
                      </label>
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <p className="text-sm text-gray-700">{formatAddress(selectedCustomer)}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={useCustomerAddress} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                            Usar Este Endereço
                          </button>
                          {addressConfirmed && <span className="text-xs text-green-600 font-medium">Endereço definido</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Adicionar Produto */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Adicionar Produto</h2>
              {reservationLocked && (
                <p className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">
                  Itens travados pela reserva {reservation?.id.slice(0,8)}… Para trocar produtos ou quantidades, libere a reserva online e crie outra.
                </p>
              )}
              <div className="flex gap-3 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Código do produto"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  onKeyPress={(e) => {if(!reservationLocked&&e.key === 'Enter')void searchProduct();}}
                  disabled={reservationLocked}
                  className="border border-gray-300 p-2 rounded-lg w-48 disabled:bg-gray-100"
                />
                <button type="button" onClick={()=>{if(!reservationLocked)void searchProduct();}} disabled={reservationLocked} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50">
                  Buscar Produto
                </button>
                {selectedProduct && (
                  <div className="flex justify-between gap-2 items-center ml-4 bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex flex-col">
                      <span className="font-semibold text-green-800">{selectedProduct.name}</span>
                      <span className="text-sm text-green-600">Código: {selectedProduct.code}</span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      disabled={reservationLocked}
                      className="border border-gray-300 p-2 rounded-lg w-20 disabled:bg-gray-100"
                      placeholder="Qtd"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Preço Unit:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={unitCost}
                        onChange={(e) => setUnitCost(Number(e.target.value))}
                        disabled={reservationLocked}
                        className="border border-gray-300 p-2 rounded-lg w-24 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">Total</span>
                      <span className="font-semibold text-blue-700">R$ {(quantity * unitCost).toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProductWithStockCheck}
                      disabled={reservationLocked}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Itens do Pedido */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 bg-slate-800 text-white">
                <h2 className="text-xl font-semibold">Itens do Pedido ({products.length})</h2>
              </div>
              {products.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum produto adicionado</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-4 text-left">Produto</th>
                          <th className="p-4 text-left">Código</th>
                          <th className="p-4 text-center">Qtd</th>
                          <th className="p-4 text-center">Estoque</th>
                          <th className="p-4 text-right">Preço Unit.</th>
                          <th className="p-4 text-right">Total</th>
                          <th className="p-4 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((item, index) => (
                          <tr key={`${item.id}-${index}`} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="p-4 font-medium">{item.productname}</td>
                            <td className="p-4 text-gray-600">{item.code}</td>
                            <td className="p-4 text-center">{item.quantity}</td>
                            <td className="p-4 text-center">
                              {reservationLocked && reservation?.items.some(reserved=>Number(reserved.productId)===Number(item.id)) ? (
                                <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">Reservado</span>
                              ) : editMode && Number(item.stock || 0) === 0 ? (
                                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600" title="O saldo anterior é devolvido e validado no servidor durante a edição.">Original</span>
                              ) : (() => {
                                const available = Math.max(0, Number(item.stock || 0) - Number(item.reserved || 0));
                                return (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${available >= item.quantity
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {available}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="p-4 text-right">R$ {item.price}</td>
                            <td className="p-4 text-right font-semibold">R$ {(item.quantity * item.price).toFixed(2)}</td>
                            <td className="p-4 text-center">
                              <button
                                type="button"
                                onClick={() => setProducts(products.filter((_, i) => i !== index))}
                                disabled={reservationLocked}
                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-6 bg-gray-50 border-t border-gray-200 text-right">
                    <p className="text-sm text-gray-600 mb-1">Total do Pedido</p>
                    <p className="text-3xl font-bold text-slate-800">
                      R$ {products.reduce((acc, p) => acc + p.quantity * p.price, 0).toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Observações */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Observações</label>
              <textarea
                {...register("notes")}
                className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-slate-500"
                placeholder="Adicione observações sobre o pedido..."
              />
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-4 pb-8">
              <button
                type="button"
                onClick={() => navigate("/sales/orders")}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !canSaveOrder || submissionLockedByState}
                className={`px-6 py-3 rounded-lg transition-colors ${canSaveOrder && !submissionLockedByState
                  ? "bg-slate-800 text-white hover:bg-slate-900"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  } disabled:opacity-50`}
              >
                {submitLabel}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
