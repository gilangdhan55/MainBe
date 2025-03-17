import { dbVisit as db } from "../config/knex";

export interface ScheduleSalesman {
    sales_code: string;
    customer_code: string;
    customer_name: string;
    address: string;
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
 
export interface AbsenSalesmanDetail {
    note: string;
    code: string;
    start_visit: string;
    end_visit: string;
    is_visit: boolean;
    customer_code: string;
    address: string;
}

export class VisitModel {
    static async getScheduleSalesman(username: string, day: number, week: number): Promise<ScheduleSalesman[]> {
        try {
            const result: ScheduleSalesman[] = await db
                .raw(
                    `SELECT  
                    a.sales_code, a.customer_code, a.customer_name, b.address
                    FROM master.sales_schedule a
                    INNER JOIN master.customer b ON a.customer_code = b.code
                    WHERE sales_code = ?
                    AND week_${week} = 'Y'
                    AND day = ? `,
                    [username, day]
                )
                .then(res => res.rows || res || []); // Menangani hasil untuk berbagai DB
    
            return result;
        } catch (error) {
            console.error("Error fetching schedule:", error);
            return [];
        }
    } 

    static async checkAbsenSalesman(username: string, date: string): Promise<AbsenSalesman | null> {
        const query = db("app.absensi")
        .select(
            "id",
            "code",
            "name",
            db.raw("to_char(start_absent, 'YYYY-MM-DD HH24:MI:SS') AS start_absent"),
            db.raw("to_char(end_absent, 'YYYY-MM-DD HH24:MI:SS') AS end_absent"), 
            db.raw("to_char(start_absent, 'HH24:MI') AS time_start"),
            db.raw("to_char(end_absent, 'HH24:MI') AS time_end")
        )
        .where("code", username)
        .andWhereRaw("DATE(start_absent) = ?", [date]);  
        const result = await query.first(); 
        return result; 
    }

    static async getVisitHdr(username: string, date: string): Promise<AbsenSalesmanDetail[]> {
        try {
            const query = `
                SELECT 
                    note, code, to_char(start_date, 'YYYY-MM-DD HH24:MI:SS') start_visit, to_char(ended_date, 'YYYY-MM-DD HH24:MI:SS') end_visit,
                    CASE 
                        WHEN start_date = '0001-01-01 00:00:00.001' THEN false 
                        ELSE true 
                    END AS is_visit,
                    customer_code, address,
                    to_char(start_date, 'HH24:MI') AS start_time,
                    to_char(ended_date, 'HH24:MI') AS end_time
                FROM app.visit_hdr 
                WHERE sales_code = ? AND DATE(created_date) = ? 
            `;
            
            const result = await db.raw(query, [username, date]); 
            return result.rows || [];  
        } catch (error) {
            console.error("Error fetching visitHdr:", error);
            return [];
        }
    }
    
}
