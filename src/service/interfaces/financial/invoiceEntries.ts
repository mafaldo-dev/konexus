import { ProductsProps } from "../../interfaces";

export interface Invoice {
    dataEnterprise: {
        enterprise: string;
        cnpj: string;
        address: {
            uf: string;
            state: string;
            city: string;
            neighborhood: string;
            street: string;
            number: string;
        };
        entrieDate: string;
        invoiceNum: number | any;
        receiver: string;
    };
    products: ProductsProps[];
    date: Date;
}