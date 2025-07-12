import { useState } from 'react';

export const useCnpjMask = () => {
    const [cnpj, setCnpj] = useState('');

    const maskCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const maskedValue = maskCNPJ(e.target.value);
        setCnpj(maskedValue);
    };

    return { cnpj, handleChange, maskCNPJ };
};