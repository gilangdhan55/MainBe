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
    id: number;
    code: string;
    sales_code: string;
    sales_name: string;
    customer_code: string;
    customer_name: string;
    address: string; 
    start_date: Date;
    ended_date: Date;
}

export interface IMasterItemOutlet {
    id: number;
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
}