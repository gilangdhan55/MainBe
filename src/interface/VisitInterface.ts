export interface AbsenSalesmanDetail {
    note: string; 
    start_visit: string;
    end_visit: string;
    is_visit: boolean;
    customer_code: string;
    customer_name: string;
    address: string;
    code?: string;
    status?: number;
    start_time?: string;
    end_time?: string;
}

export interface ScheduleSalesman {
    sales_code: string;
    customer_code: string;
    customer_name: string;
    address: string;
}

export interface IModelAbsenSalesmanDetail {
    note: string;
    code: string;
    start_visit: string;
    end_visit: string;
    is_visit: boolean;
    customer_code: string;
    address: string;
}
export interface ISchedule {
    sales_code: string;
    customer_code: string;
    customer_name: string;
    address: string;
}

export interface IStartAbsent {
    code: string;
    name: string;
    start_absent: string;  
    latitude_start: string;
    longitude_start: string;
    end_absent: null | string; 
    url_start: string;
}

export interface IEndAbsent{
    end_absent: string;
    latitude_end: string;
    longitude_end: string;
    url_end: string;
    date?: string;
}
  
export interface AbsenSalesman {
    id: number;
    code: string;
    name: string;
    start_absent: string;
    end_absent: string | null;
    time_start: string;
    time_end: string | null;
}

export interface DateNotClockOut{
    start_absent: string;
}

export interface UploadResponseAbsen {
    status: boolean;
    message: string;
    path?: string;
    filename?: string;
}


export interface IVisitHdr {
    id: number | string;
    code: string;
    sales_code: string;
    sales_name: string;
    customer_code: string;
    customer_name: string;
    address: string; 
    start_date: Date | string;
    end_visit: Date | string | null;
}

export interface IMasterItemOutlet {
    id: number | string;
    code_item: number;
    item_code: string;
    name_item: string;
    category: string;
    brand_name: string;
    type_item: string; 
    min_outlet_stock: number;
    min_outlet_order: number;
    uom_to: string; 
}
 
export interface IParmStartVisit {
    visit_hdr_code: string;
    url: string;
    note: string;
    created_by: string;
    created_date: string;
    is_upload: string;
    brand: string;
    id?: number | string;
    is_visit?: string;
    dateFormat?: string;
    timeFormat?: string;
}
 
export interface IParmStartHdr {
    code: string;
    created_by: string;
    sales_code: string;
    sales_name: string;
    customer_code: string;
    customer_name: string;
    address: string;
    start_date: string;
    created_date: string;
    latitude: string;
    longitude: string;
}

export interface IPictVisit {
    id: number | string;
    url: string;
    created_date: Date;
    note: string;
    brand: string;
    is_visit: string;
    dateFormat?: string;
    timeFormat?: string;
}

export interface IEndAbsentVisit {
    latitude_end: string; 
    longitude_end: string;
    ended_date: string | null;
}

export interface IVisitEnd {
    visit_hdr_code: string;
    url: string;
    note: string;
    created_by: string;
    created_date: string;
    is_upload: string;
    brand: string;
    id?: number | string;
    is_visit?: string;
    dateFormat?: string;
    timeFormat?: string;
} 

export interface IReqStartVisit {
    date: string;
    customerCode: string;
    customerName: string;
    address: string;
    salesCode: string;
    salesName: string;
    latitude: string;
    longitude: string;
}

export interface IDetailStockVisit {
    visit_hdr_code: string;
    name_item: string;
    code_item: string;
    item_code: string;
    created_by: string;
    customer_code: string;
    is_problem: string;
    expired_date: string;
    created_date?: string;
    price: string;
    qty: number;
    note: string;
}