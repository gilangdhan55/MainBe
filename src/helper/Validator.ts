import validator from "validator";
import {z} from "zod";

export const validateUsername = (username: string): boolean => {
    return validator.isAlphanumeric(username);
};

export const validateDate = (date: string): boolean => {
    return validator.isDate(date);
};

export const validatePastDate = (date: string): boolean => {
    const newDate   = new Date().toISOString().split('T')[0];  
    const inputDate = new Date(date).toISOString().split('T')[0]; 
  
    return inputDate < newDate; 
}

interface IReqStartVisit {
    date: string;
    customerCode: string;
    customerName: string;
    address: string;
    salesCode: string;
    salesName: string;
    latitude: string;
    longitude: string;
}

export const validStartVisit = (data: IReqStartVisit ) => {
    const validStartAbsent = z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date format must be YYYY-MM-DD" }),
        customerCode: z.string().min(1, { message: "Customer Code is Required" }).transform((val) => val.replace(/\s/g, '')),
        customerName: z.string().min(1, { message: "Customer Name is Required" }).transform((val) => val.trim()), 
        address: z.string().optional().transform((val) => val?.replace(/[\n\r\t]/gm, ' ').replace(/\s+/g, ' ').trim() || ''),
        salesCode: z.string().min(1, { message: "Code sales is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9]/g, '')),
        salesName: z.string().min(1, { message: "Sales Name is Required" }).transform((val) => val.replace(/[^a-zA-Z\s]/g, '')),
        latitude: z.string()
          .refine((val) => !isNaN(Number(val)), { message: "Location invalid" })
          .transform((val) => Number(val)),
        longitude: z.string()
          .refine((val) => !isNaN(Number(val)), { message: "Location invalid" })
          .transform((val) => Number(val)),
    });

    return validStartAbsent.safeParse(data);
}