export interface InvoiceFinish {
  dataEnterprise: {
    enterprise: string; // nome da empresa
    cnpj: string;
    address: {
      street: string;
      number: number;
      neighborhood: string;
      city: string;
      uf: string;
    };
    entrieDate: string;  // data de entrada
    invoice: number;     // número da nota fiscal
  };
  products: {
    name: string;
    quantity: number;
    price: number;
    tipe: string
  }[];
  date: string; // data que foi salva a nota, por ex.
}
