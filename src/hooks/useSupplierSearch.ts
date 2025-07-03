import { useState } from 'react';
import { handleSupplierWithCode } from '../service/api/suppliers/supplier';
import { Supplier } from '../service/interfaces';

export const useSupplierSearch = (setValue: any) => {
    const [supplierCode, setSupplierCode] = useState<string>("");
    const [supplier, setSupplier] = useState<Supplier | null>(null);

    const handleSupplier = async () => {
        if (!supplierCode) return;

        try {
            const supplierData = await handleSupplierWithCode(supplierCode) as Supplier;

            if (supplierData) {
                setSupplier(supplierData);
                setValue("dataEnterprise.enterprise", supplierData.name || "");
                setValue("dataEnterprise.cnpj", supplierData.cnpj || "");
                setValue("dataEnterprise.address.uf", supplierData.address.uf || "");
                setValue("dataEnterprise.address.state", supplierData.address.state || "");
                setValue("dataEnterprise.address.city", supplierData.address.city || "");
                setValue("dataEnterprise.address.neighborhood", supplierData.address.neighborhood || "");
                setValue("dataEnterprise.address.street", supplierData.address.street || "");
                setValue("dataEnterprise.address.number", supplierData.address.number || "");
            } else {
                alert("Fornecedor não encontrado!");
            }
        } catch (Exception) {
            console.error("Erro ao buscar fornecedor:", Exception);
            alert("Erro ao buscar fornecedor!");
        }
    };

    return { supplierCode, setSupplierCode, supplier, handleSupplier };
};