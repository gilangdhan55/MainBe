import { dbVisit as db } from "../config/knex";
import {IStartAbsent, IModelAbsenSalesmanDetail, ScheduleSalesman,AbsenSalesman, DateNotClockOut, IEndAbsent
    ,IVisitHdr, IMasterItemOutlet, IParmStartVisit,IPictVisit,
    IParmStartHdr,
    IEndAbsentVisit,
    IVisitEnd,
    IDetailStockVisit,
    lastCheckStockVisit,
    ArrCodeBarcode,
    IHistoryStockVisit,
    IDetailStockCurrent
} from '../interface/VisitInterface';
 
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
                .then((res) => res.rows || res || []); // Menangani hasil untuk berbagai DB
    
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

    static async getVisitHdr(username: string, date: string): Promise<IModelAbsenSalesmanDetail[]> {
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
    
    static async getVisitHdrAbsent(username: string, date: string): Promise<IModelAbsenSalesmanDetail[]> {
        try {
            const query = `
                SELECT  sales_code, customer_code, customer_name, address, note, code, to_char(start_date, 'YYYY-MM-DD HH24:MI:SS') start_visit, to_char(ended_date, 'YYYY-MM-DD HH24:MI:SS') end_visit,
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

    static async  insertAbsent(data: IStartAbsent): Promise<number | null> {
        try {
            const result = await db("app.absensi").insert(data).returning("id"); // Ambil ID yang baru
            
            return result[0].id; // Kembalikan ID
        } catch (error) {
            console.error("Error inserting data:", error);
            return null;
        } 
    }

    static async updateAbsent(data: IEndAbsent, id:number): Promise<boolean> {
        try {  
            return (await db("app.absensi").where("id", id).update(data)) > 0;
        } catch (error) {
            console.error("Error updating data:", error);
            return false;
        }
    }
    
    static async getAbsentNotVisit(username: string) : Promise<DateNotClockOut[] | null> {
        const query = db("app.absensi")
        .distinct(db.raw("to_char(start_absent, 'YYYY-MM-DD') AS start_absent")) 
        .where("code", username)
        .andWhereRaw("start_absent >= DATE_TRUNC('year', CURRENT_DATE)")
        .whereNull("end_absent")
        .orderByRaw(db.raw("to_char(start_absent, 'YYYY-MM-DD') ASC"));
    
        const result = await query; // ✅ Ambil semua hasil 
        
        return result;
    }
 
    static async checkVisitHdr(username: string, date: string, customerCode: string) : Promise<IVisitHdr | null> {
        const query = db("app.visit_hdr")
        .select(
            "id",
            "sales_code",
            "customer_code",
            "customer_name",
            "address",
            "note",
            "code",
            db.raw("to_char(start_date, 'YYYY-MM-DD HH24:MI:SS') AS start_date"),
            db.raw("to_char(ended_date, 'YYYY-MM-DD HH24:MI:SS') AS end_visit"), 
        )
        .where("sales_code", username)
        .andWhere("customer_code", customerCode)
        .andWhereRaw("DATE(start_date) = ?", [date])
        .first();
    
        const result = await query; // ✅ Ambil semua hasil 
        return result;
    }

    static async getMasteItemOutlet(customerCode: string) : Promise<IMasterItemOutlet[] | null> {
        const query = db("master.product_customers AS a")
        .select(
            db.raw("max(a.id) AS id"),
            "a.code_item",
            "b.item_code",
            "a.name_item",
            "a.category",
            "b.brand_name",
            "b.type_item", 
            db.raw("max(a.min_outlet_stock) AS min_outlet_stock"),
            db.raw("max(a.min_order) AS min_outlet_order"),
            "b.uom_to"
        )
        .innerJoin("master.products AS b", "a.code_item", "b.code_item")
        .where("a.customer_code", customerCode)
        .groupBy("a.code_item", "b.item_code", "a.name_item", "a.category", "b.brand_name", "b.type_item", "b.uom_to")
        .orderBy("a.name_item", "asc");
    
        const result = await query; // ✅ Ambil semua hasil 
        return result;
    }

    static async insertStartVisit(data: IParmStartVisit): Promise<number | null> {
        try {
            const result = await  db("app.visit_start").insert(data).returning("id"); // Ambil ID yang baru 
            
            return result[0].id; // Kembalikan ID
        } catch (error) {
            console.error("Error inserting data:", error);
            return null;
        }  
    }

    static async insertStartHdr(data: IParmStartHdr): Promise<number | null> {
        try {
            const result = await  db("app.visit_hdr").insert(data).returning("id"); // Ambil ID yang baru 
            
            return result[0].id; // Kembalikan ID
        } catch (error) {
            console.error("Error inserting data:", error);
            return null;
        }  
    }

    static async deleteStartHdr(id: number) : Promise<boolean> {
        return await db("app.visit_hdr").where("id", id).del() > 0;
    }
    
    static async getPitcureVisit(customerCode: string, salesCode: string) : Promise<IPictVisit[] | null> {
        try {
            const query = `
              (
                SELECT id, url, to_char(created_date, 'YYYY-MM-DD HH24:MI:SS') AS created_date, note, brand, 'start_visit' as is_visit
                FROM app.visit_start 
                WHERE created_by = ? AND trim(visit_hdr_code) LIKE trim(?)
                ORDER BY id DESC   
                LIMIT 5
              )
              UNION
              (
                SELECT id, url, to_char(created_date, 'YYYY-MM-DD HH24:MI:SS') AS created_date, note, brand, 'end_visit' as is_visit
                FROM app.visit_end 
                WHERE created_by = ? AND trim(visit_hdr_code) LIKE trim(?) 
                ORDER BY id DESC   
                LIMIT 5
              ) 
              ORDER BY created_date DESC `;
          
            const bindKey = `%${customerCode}%`;  
            const result = await db.raw(query, [salesCode, bindKey,salesCode, bindKey]);
          
            return result.rows || []; 
          } catch (error) {
            console.error("Error fetching visitHdr:", error);
            return [];
          } 
    }

    static async updateVisitHdr(data:IEndAbsentVisit, id: number): Promise<boolean> {
        try {  
            return (await db("app.visit_hdr").where("id", id).update(data)) > 0;
        } catch (error) {
            console.error("Error updating data:", error);
            return false;
        }
    }

    static async insertEndVisit(data: IVisitEnd): Promise<number | null> {
        try {
            const result = await  db("app.visit_end").insert(data).returning("id"); // Ambil ID yang baru  
            return result[0].id;  
        } catch (error) {
            console.error("Error inserting data:", error);
            return null;
        }  
    }

    static async saveStocKVisit(data: IDetailStockVisit[] | [], returnData: boolean = false): Promise<Array<string> | IDetailStockVisit[]> {
        if(data.length === 0) return [];
        try {
            const result = await db("app.visit_stock")
                .insert(data)
                .returning('id'); 
            
            // result = [{ id: '123' }] -> ambil value-nya
            if(!returnData) return result.map((row) => row.id.toString());
            const ids = result.map((row, index) => ({ id: Number(row.id), ...data[index] }));
            return ids; 
        } catch (error) {
            console.error("Error inserting data:", error);
            return [];
        }
    } 

    static async updateStockVisit(data: IDetailStockCurrent, id:number): Promise<boolean> {
        try {  
            return (await db("app.visit_stock").where("id", id).update(data)) > 0;
        } catch (error) {
            console.error("Error updating data:", error);
            return false;
        }
    }

    static async getLastInputStock(customerCode: string, date: string, salesCode: string) : Promise<lastCheckStockVisit[]|[]> { 
       try{
            const query = db("app.visit_stock")
            .select(
                "item_code AS itemCode",
                "code_item AS codeItem",
                "name_item AS nameItem", 
                db.raw("to_char(max(created_date), 'YYYY-MM-DD HH24:MI:SS') AS lastCheck"),
                db.raw("sum(qty) AS countQty"), 
            )
            .whereRaw("trim(customer_code) = ?", [customerCode])
            .andWhereRaw("DATE(created_date) = ?", [date])
            .andWhereRaw("created_by = ?", [salesCode])
            .groupBy("item_code","code_item", "name_item");

            const result = await query;   
            return result.length > 0 ? result : [];
       } catch (error) {
            console.error("error get data : ", error);
            return [];
       }
    }

  

    static async getHistoryStockVisit(xPar:ArrCodeBarcode[], customerCode: string) : Promise<IHistoryStockVisit[] | []> {
        try{
            const query = `WITH data(jsondata) AS (
                VALUES (?::jsonb)
                ),
                parsed AS (
                SELECT *
                FROM data,
                    jsonb_to_recordset(data.jsondata)
                    AS x(code_item TEXT, item_code TEXT)
                )
                SELECT id, code_item, item_code, qty,to_char(expired_date, 'YYYY-MM-DD') AS expired_date, price, note, to_char(created_date, 'YYYY-MM-DD')  AS created_date
                FROM (
                SELECT a.id, a.code_item, a.item_code, a.qty,
                        DATE(a.expired_date) AS expired_date, a.price,
                        DATE(a.created_date) AS created_date, a.note,
                        ROW_NUMBER() OVER (PARTITION BY a.item_code, a.code_item ORDER BY a.created_date DESC) AS rn
                FROM app.visit_stock a
                JOIN parsed p ON a.code_item = p.code_item AND a.item_code = p.item_code
                WHERE a.created_date >= (SELECT max(created_date) - INTERVAL '30 days'  FROM app.visit_stock WHERE TRIM(customer_code) 
                = ? )
                    AND TRIM(a.customer_code) = ? 
                ) stock
                WHERE rn <= 10 ORDER BY to_char(created_date, 'YYYY-MM-DD') DESC `;
            const result = await db.raw(query, [JSON.stringify(xPar), customerCode, customerCode]);
    
            return result.rows || [];  
        } catch (error) {
            console.error("error get data : ", error);
            return [];
        }
    }

    static async deleteStockVisit(id: number) : Promise<boolean> {
        return await db("app.visit_stock").where("id", id).del() > 0;
    }

    static async deleteStockVisitIn(data: Array<number> | []) : Promise<boolean> {
        if(data.length == 0) return false;
        return await db("app.visit_stock").whereIn("id", data).del() > 0;
    }
    
}
