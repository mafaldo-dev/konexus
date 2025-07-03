import { useEffect, useState } from "react";

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