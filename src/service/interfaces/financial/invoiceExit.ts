export interface InvoiceData {
    enterprise: {
      phantasyName: string,
      address: string,
      neighborhood: string,
      zip_code: string,
      city: string,
      dist: string,
      phone: string
    },
    invoice: {
      number: string,
      serie: number,
      acessKey: string
      date: any | string
    },
    recipient: {
      name: string,
      r_cnpj: string,
      r_Address: string,
      r_neighborhood: string,
      r_zip_code: string,
      r_city: string,
      r_dist: string
      r_phone: string
    },
    products: [
      {
        code: string,
        description: string,
        ncm: string,
        quantity: number,
        unitValue: number,
        totalPrice: Number
      }
    ]
  };