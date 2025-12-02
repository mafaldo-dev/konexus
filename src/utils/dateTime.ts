import { useEffect, useState } from "react";
import { format, isValid , parseISO} from "date-fns";
import { ptBR } from 'date-fns/locale';

export const useDateTime = (): string => {
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setDateTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const day = dateTime.getDate();
    const month = dateTime.getMonth() + 1;
    const year = dateTime.getFullYear();
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const seconds = dateTime.getSeconds();
    const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
   
    return formattedDateTime;
};



export const safeFormatDate = (dateString?: string | null): string => {
  if (!dateString) return "Data inválida";
  try {
    const date = new Date(dateString);
    return isValid(date) ? format(date, "dd/MM/yyyy") : "Data inválida";
  } catch {
    return "Data inválida";
  }
};




// Formatar data do PostgreSQL para exibição
export const formatPostgresDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Data inválida";
  
  try {
    // Remove a parte do timezone se existir
    const cleanDate = dateString.split('+')[0].split('.')[0];
    const date = parseISO(cleanDate);
    
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return "Data inválida";
  }
};

// Formatar data e hora
export const formatPostgresDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "Data inválida";
  
  try {
    const cleanDate = dateString.split('+')[0].split('.')[0];
    const date = parseISO(cleanDate);
    
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error);
    return "Data inválida";
  }
};

// Formatar data extenso
export const formatPostgresDateLong = (dateString: string | null | undefined): string => {
  if (!dateString) return "Data inválida";
  
  try {
    const cleanDate = dateString.split('+')[0].split('.')[0];
    const date = parseISO(cleanDate);
    
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data longa:', error);
    return "Data inválida";
  }
};