import validator from "validator";
import {z} from "zod";
import {IDetailStockVisit, IReqStartVisit, IHeaderStockVisit, IBodyApiStock, IDetailStockCurrent} from "../interface/VisitInterface";
import {decodeId} from "../utils/hashids";

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

export const validGetItemVisit = (data: {customerCode: string; date: string; salesCode: string;}) => {
    const valid = z.object({
        customerCode: z.string().min(1, { message: "Customer Code is Required" }).transform((val) => val.replace(/\s/g, '')), 
        salesCode: z.string().min(1, { message: "Code sales is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9]/g, '')),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date format must be YYYY-MM-DD" }).transform((val) => val.replace(/\s/g, '')), 
    });

    return valid.safeParse(data);
}

export const validEndVisit = (data: IReqStartVisit ) => {
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
        id: z.string().min(1, { message: "Id is Required" }).transform((val) => val.replace(/\s/g, '')),
        code: z.string().min(1, { message: "Code is Required" }).transform((val) => val.replace(/\s/g, '')),
    });

    return validStartAbsent.safeParse(data);
}
  
export const validCustSalesCode = (data: { customerCode: string; salesCode: string; }) => {
    const schema = z.object({ 
        customerCode: z.string().min(1, { message: "Customer Code is Required" }).transform((val) => val.replace(/\s/g, '')), 
        salesCode: z.string().min(1, { message: "Code sales is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9]/g, '')), 
    });

    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        errors: !result.success ? result.error.flatten().fieldErrors : null
    }
}
 
export const validHeaderStock = (data: IHeaderStockVisit) => {
    const schema = z.object({ 
        id: z.string().min(1, { message: "ID is Required" }).transform((val) => decodeId(val.replace(/\s/g, ''))),
        codeItem: z.string().min(1, { message: "Code Item is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9]/g, '')),
        barcode: z.string().min(1, { message: "Barcode is Required" }).transform((val) => val.replace(/[^0-9]/g, ''))
        .refine((val) => val.length > 0, {
            message: "Barcode harus berupa angka"
        }), 
        nameItem: z.string().min(1, { message: "Item is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9\s\-#&()%.,+]/g, '').trim()),
        code: z.string().min(1, { message: "Code is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9/]/g, '')),
        customerCode: z.string().min(1, { message: "Customer Code is Required" }).transform((val) => val.replace(/\s/g, '')),
        salesCode: z.string().min(1, { message: "Code sales is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9]/g, '')),
    });

    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        errors: !result.success ? result.error.flatten().fieldErrors : null
    }
}
 

export const validDetailStockVisit = (data: IDetailStockVisit) => {
    const schema = z.object({
        qty: z.number().min(0, { message: "Qty is Required" }).transform((val) => Number(val)),        
        price: z.string().min(1, { message: "Price is Required" }).transform((val) => val.replace(".", "").trim()),    
        note: z.string().min(1, { message: "Note is Required" }).transform((val) => val.trim()),
        visit_hdr_code: z.string().min(1, { message: "Code is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9/]/g, '')),
        name_item: z.string().min(1, { message: "Item is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9\s\-#&()%.,+]/g, '').trim()),
        item_code: z.string().min(1, { message: "Code Item is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9]/g, '')),
        code_item: z.string().min(1, { message: "Barcode is Required" }).transform((val) => val.replace(/[^0-9]/g, ''))
          .refine((val) => val.length > 0, {
            message: "Barcode harus berupa angka"
          }),  
        created_by: z.string().min(1, { message: "Code sales is Required" }).transform((val) => val.replace(/[^a-zA-Z0-9]/g, '')),
        expired_date: z.string().transform((val) => val.trim()), // Use z.string() instead of z.string()
        created_date: z.string().transform((val) => val.trim()), // Same here, transform to Date
        customer_code: z.string().min(1, { message: "Customer Code is Required" }).transform((val) => val.replace(/\s/g, '')),
        is_problem: z.string().min(1, { message: "is_problem is Required" }).max(1, { message: "is_problem must be y or n" })
          .refine((val) => ['y', 'n'].includes(val), { message: "is_problem must be 'y' or 'n'" }) // Custom validation for y or n
    }); 
    const result = z.array(schema).safeParse(data); 
    return {
        success: result.success,
        data: result.success ? result.data : null,
        errors: !result.success ? result.error.flatten().fieldErrors : null
    }
}

export const validDetailStockVisitCurrent = (data: IDetailStockCurrent) => {
    const schema = z.object({
        qty: z.number().min(0, { message: "Qty is Required" }).transform((val) => Number(val)),        
        price: z.string().min(1, { message: "Price is Required" }).transform((val) => val.replace(".", "").trim()),    
        note: z.string().min(1, { message: "Note is Required" }).transform((val) => val.trim()), 
        expired_date: z.string().transform((val) => val.trim()),   
        is_problem: z.string().min(1, { message: "is_problem is Required" }).max(1, { message: "is_problem must be y or n" })
          .refine((val) => ['y', 'n'].includes(val), { message: "is_problem must be 'y' or 'n'" }),
        id: z.string().min(1, { message: "Id is Required" }).transform((val) => decodeId(val.replace(/\s/g, ''))),
    }); 
    const result = z.array(schema).safeParse(data); 
    return {
        success: result.success,
        data: result.success ? result.data : null,
        errors: !result.success ? result.error.flatten().fieldErrors : null
    }
}

export const validBodyApiStock = (data: IBodyApiStock) => {
    const schema = z.object({
        customerCode: z.string().min(1, { message: "Customer Code is Required" }).transform((val) => val.replace(/\s/g, '')), 
        xPar: z.string().min(1, { message: "not valid" }).transform((val) => val.trim())
    });

    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        errors: !result.success ? result.error.flatten().fieldErrors : null
    } 
}

export const validIdStock = (data: {id: string}) => {
    const schema = z.object({ 
        id: z.string().min(1, { message: "Id is Required" }).transform((val) => val.replace(/\s/g, '')), 
    });

    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        errors: !result.success ? result.error.flatten().fieldErrors : null
    }
}