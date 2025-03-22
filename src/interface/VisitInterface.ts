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
export interface AbsenSalesman {
    id: number;
    code: string;
    name: string;
    start_absent: string;
    end_absent: string;
    time_start: string;
    time_end: string;
}