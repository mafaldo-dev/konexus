export interface Invoice {
  dataEnterprise: {
    enterprise: string; // nome da empresa
    cnpj: string;
    address: {
      state: string
      street: string;
      number: number;
      neighborhood: string;
      city: string;
      uf: string;
    };
    entrieDate: string // data de entrada
    invoiceNum: number;  
    receiver: string   // número da nota fiscal
  };
  products: {
    id: string | any
    name: string;
    quantity: number;
    price: number;
    tipe: string
  }[];
  date: string | any// data que foi salva a nota, por ex.
}
