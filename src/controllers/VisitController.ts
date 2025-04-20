import { Request, Response } from "express";  
import {AbsenSalesmanDetail, ISchedule, IStartAbsent, AbsenSalesman, IEndAbsent, IVisitHdr, IMasterItemOutlet, IParmStartVisit, IParmStartHdr, IPictVisit, IEndAbsentVisit, IVisitEnd} from "../interface/VisitInterface"
import {VisitModel} from "../models/VisitModel"; 
import {getWeekOfMonth, getDay, getTimeNow, getTimeHour, getLevelWeek, strToTime, formatDateDMY} from "../helper/GetWeek";
import {validateUsername, validateDate, validatePastDate, validStartVisit, validCustSalesCode, validEndVisit} from "../helper/Validator";
import redis from "../utils/redis"
import {keyAbsen, keyDateNotClockOut, keyVisitNow, keyAbsentVisit, keyItemVisitOutlet, keyPictVisit} from "../helper/KeyRedis";
import fs from "fs";
import {UploadAbsent, UploadAbsentVisit} from "../helper/UploadFile"; 
import {decodeId, encodeId} from "../utils/hashids";
import BaseController from "./BaseController";     

class VisitController extends BaseController{
    private static instance: VisitController;
 
    private constructor() {
        super();
    }
 
    static getInstance(): VisitController {
        if (!VisitController.instance) {
            VisitController.instance = new VisitController();
        }
        return VisitController.instance;
    }

    private async checkAbsenYesterday(username: string, date: string) {
        let totalVisit  = 0, totalSchedule = 0;
        const visitKeyNow =  keyVisitNow(username, date);
        
        // Ambil data dari Redis
        const cachedVisitNow = await redis.get(visitKeyNow);
    
        // await redis.unlink(visitKeyNow); 
        const visitHdr = !cachedVisitNow ? await VisitModel.getVisitHdrAbsent(username, date) || [] : JSON.parse(cachedVisitNow);
        if(!cachedVisitNow){
            await redis.setex(visitKeyNow, 600, JSON.stringify(visitHdr));
        }  
        // Proses daftar kunjungan
        const visit =  visitHdr.map((visit: AbsenSalesmanDetail) => {  
            const status = visit?.start_visit ? (!visit?.end_visit ? 1 : (visit?.end_visit && visit?.end_visit !== '0001-01-01 00:00:00' ? 2 : 3) ): 0; 
            if(status === 2) totalVisit++;
            return { ...visit, status: status };
        });
        totalSchedule = visitHdr.length; 
        return {newVisit: visit, newTotalSchedule: totalSchedule, newTotalVisit: totalVisit}; 
    }
    
    private async checkAbsenToday (username: string, date: string, Schedule: ISchedule[])  {
        let totalVisit      = 0; 
        const totalSchedule = Schedule.length;
        let visitHdr        = [];
        const visitKeyNow =  keyVisitNow(username, date);
        // await redis.unlink(visitKeyNow); 
    
        // Ambil data dari Redis
        const cachedVisitNow = await redis.get(visitKeyNow);
        visitHdr = !cachedVisitNow ? await VisitModel.getVisitHdr(username, date) || [] : JSON.parse(cachedVisitNow);
        
        if(!cachedVisitNow){
            await redis.setex(visitKeyNow, 600, JSON.stringify(visitHdr));
        } 
        
        // Proses daftar kunjungan
        const visit = Schedule.map(schedule => {
            // 1 = absen start visit;  2 = absen end visit; 3 = tidak visit;  0 = belum absen
            const findVisit = visitHdr.find((visit: AbsenSalesmanDetail) => visit.customer_code === schedule.customer_code); 
            const status = findVisit?.start_visit ? (!findVisit?.end_visit ? 1 : (findVisit?.end_visit && findVisit?.end_visit !== '0001-01-01 00:00:00' ? 2 : 3) ): 0; 
            if (status === 2) totalVisit++;
    
            return {
                sales_code: username,
                customer_code: schedule.customer_code,
                customer_name: schedule.customer_name,
                address: schedule.address,
                note: findVisit?.note || "",
                start_visit: findVisit?.start_visit || '',
                end_visit: findVisit?.end_visit || '',
                is_visit: findVisit?.is_visit || false,
                code: findVisit?.code || '',
                status,
                start_time: findVisit?.start_time || '',
                end_time: findVisit?.end_time || '',
            };
        }); 
        return { newVisit: visit, newTotalSchedule: totalSchedule, newTotalVisit: totalVisit };
    };

    public async checkAbsenSalesman(req: Request, res: Response): Promise<void> { 
        const { username, date} = req.body;
        // await redis.flushall(); 
        if((!date || !validateDate(date)|| ( !username || !validateUsername(username)))) {
            res.status(400).json({ message: "Invalid Request", status: false, version: "v1" });
            return;
        } 
        const day           = getDay(date);   
        const week          = getWeekOfMonth(date);  
        const absenKey      = keyAbsen(username, date); 
     
        const cachedAbsen   = await redis.get(absenKey);  
        const absent        = !cachedAbsen ? await VisitModel.checkAbsenSalesman(username, date) : JSON.parse(cachedAbsen); 
    
        if(!cachedAbsen){
            await redis.setex(absenKey, 600, JSON.stringify(absent));
        }
     
        const Schedule      = await VisitModel.getScheduleSalesman(username, day, week);
        
        let visit: AbsenSalesmanDetail[] = []
        let totalSchedule: number = 0,totalVisit: number = 0;
    
        // proses hari ini atau kemarin
        if(validatePastDate(date)){ 
            console.log("Sudah lewat ⏳"); 
            const {newVisit, newTotalSchedule, newTotalVisit} = await this.checkAbsenYesterday(username, date); 
            visit           = newVisit;
            totalSchedule   = newTotalSchedule;
            totalVisit      = newTotalVisit; 
        }else{ 
            console.log("Hari ini 📅");
            const {newVisit, newTotalSchedule, newTotalVisit} = await this.checkAbsenToday(username, date, Schedule);
            visit           = newVisit;
            totalSchedule   = newTotalSchedule;
            totalVisit      = newTotalVisit;
        } 
    
        // ambil data absen yang belum clock out
        const absentNotVisitKey     = keyDateNotClockOut(date);
        const cachedAbsentNotVisit  = await redis.get(absentNotVisitKey);
        const absentNotVisit        = !cachedAbsentNotVisit ? await VisitModel.getAbsentNotVisit(username) || [] : JSON.parse(cachedAbsentNotVisit); 
        if(!cachedAbsentNotVisit){
            await redis.setex(absentNotVisitKey, 600, JSON.stringify(absentNotVisit)); 
        } 
        if (visit.length > 0)  visit = await this.sortingVisit(visit);  
        res.status(200).json({ status: true, version: "v1", data: {visit,  absent, totalSchedule, totalVisit, absentNotVisit} });
    };
    
    async startAbsent (req: Request, res: Response): Promise<void>  { 
        try {
            const file      = req.file; // File yang di-upload 
            const {username, latitude, longitude, fullname} = req.body;
           
            if (!file) res.status(400).json({ message: "File wajib diunggah!", version: "v1" }); 
            if (!username || !latitude || !longitude || !fullname || !validateUsername(username))  res.status(400).json({ message: "Data tidak lengkap!", version: "v1" });
    
            // proses upload file 
            const upload = UploadAbsent(file as Express.Multer.File, username);
    
            if(!upload.status) res.status(500).json({ message: upload.message, status: false, version: "v1" });
    
            // Ambil path lengkap dan nama file
            const filePath = upload?.path; // Path lengkap di server
            const fileName = upload?.filename; // Nama file (SPG004_250321095128.jpg)
    
            // kumpulkan data buat insert ke db
            const data: IStartAbsent = {
                code: username,
                name: fullname,
                start_absent: getTimeNow(),
                latitude_start: latitude,
                longitude_start: longitude,
                end_absent: null,
                url_start: `uploads/absen/${username}/${fileName}`,
            }
     
            // simpan ke db
            const insert = await VisitModel.insertAbsent(data);
    
            if(!insert) {
                if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); 
                res.status(500).json({ message: "Terjadi kesalahan server" });
                return;
            } 
            
            const absent: AbsenSalesman = {
                code: username,
                end_absent: null,
                id: insert,
                name: fullname,
                start_absent: data.start_absent, 
                time_start: getTimeHour(data.start_absent),
                time_end: null 
            } 
            // simpan ke redis
            await this.createAbsenCache(username, absent);
            
            res.status(200).json({
                message: "Absen berhasil!", 
                status: true,
                data: absent,
                version: "v1"
            });
        } catch (error) {
            console.error("Error absen:", error);
            res.status(500).json({ message: "Terjadi kesalahan server", version: "v1" });
        } 
    }
    
    async endAbsent(req: Request, res: Response): Promise<void> {
        try {
            const file      = req.file; // File yang di-upload 
            if (!file) res.status(400).json({ message: "File wajib diunggah!" }); 
            const {username, latitude, longitude, fullname, id, date, date_default} = req.body;
           
            if (!username || !latitude || !longitude || !fullname || !date || !id || !date_default  ||!validateUsername(username))  res.status(400).json({ message: "Data tidak lengkap!" });
     
            const upload = UploadAbsent(file as Express.Multer.File, username); 
            if(!upload.status) res.status(500).json({ message: upload.message, status: false });
     
            const filePath = upload?.path; 
            const fileName = upload?.filename;  
      
            const data: IEndAbsent = {
                end_absent: getTimeNow(),
                latitude_end: latitude,
                longitude_end: longitude,
                url_end: `uploads/absen/${username}/${fileName}`,
            }
    
            const update = await VisitModel.updateAbsent(data, id);
         
            if(!update) {  
                if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
                res.status(400).json({ status: false, message: "Error updating data" });
                return;
            }
            data.date = date_default; 
            const updateCache = await this.updateAbsenCache(username, data);
            if(!updateCache) console.error("cache not set"); 
            res.status(200).json({ message: "Clock out berhasil!", status: true, data: updateCache, version: "v1" });
        } catch (error) {
            console.error("Error absen:", error);
            res.status(500).json({ message: "Terjadi kesalahan server", version: "v1" });   
        }
    }
    
    async startVisit(req: Request, res: Response) : Promise<void>{
        try{
            const file      = req.file; // File yang di-upload 
            if (!file) res.status(400).json({ message: "File wajib diunggah!" });  
            const valid     = await validStartVisit(req.body); 
            if (!valid.success) {
                res.status(400).json({ message: "Not Valid Data", status: false });
                return;
            }
            const {date, customerCode,customerName, address, salesCode, salesName, latitude, longitude} = valid.data;
             
            const upload    = await UploadAbsentVisit(file as Express.Multer.File, salesCode, customerCode);

            if(!upload.status) res.status(500).json({ message: upload.message, status: false });
  
            // Ambil path lengkap dan nama file 
            const filePath = upload?.path; // Path lengkap di server
            const fileName = upload?.filename;  
            const hdrCode  = `VS/${salesCode}/${date.replace(/-/g, "")}${strToTime(date)}/${customerCode}`;  

            const startHdr : IParmStartHdr = {
                code: hdrCode,
                created_by: salesCode,
                sales_code: salesCode,
                sales_name: salesName,
                customer_code: customerCode,
                customer_name: customerName,
                address: address,
                start_date: getTimeNow(),
                created_date: getTimeNow(),
                latitude: latitude.toString(),
                longitude: longitude.toString(),
            }

            const insertStartHdr    = await VisitModel.insertStartHdr(startHdr);
           
            if(!insertStartHdr) {
                if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
                res.status(400).json({ status: false, message: "Error start visit" });
                return;
            } 
 
            const startVisit: IParmStartVisit = {
                visit_hdr_code: hdrCode,
                url: `uploads/absen_visit/${salesCode}/absen_visit_mulai/${fileName}`,
                note: '',
                created_by: salesCode,
                created_date: getTimeNow(),
                is_upload: '',
                brand: '',
            } 

            const insertStart       = await VisitModel.insertStartVisit(startVisit); 
            if(!insertStart) {
                if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
                await VisitModel.deleteStartHdr(insertStartHdr); 
                res.status(400).json({ status: false, message: "Error start visit" });
                return;
            }   
            // create cached and set cached 
            const data : IVisitHdr = {
                id: insertStartHdr,
                code: hdrCode,
                sales_code: salesCode,
                sales_name: salesName,
                customer_code: customerCode,
                customer_name: customerName,
                address: address, 
                start_date: startHdr.start_date,
                end_visit: null,
            }
            const key   = keyAbsentVisit(salesCode, customerCode, date); 
            await redis.setex(key, 600, JSON.stringify(data));
            data.id = await encodeId(Number(data.id));

            startVisit.id           = insertStart;
            startVisit.is_visit     = "start_visit";
            startVisit.timeFormat   = getTimeHour(startVisit.created_date.toString());
            startVisit.dateFormat   = formatDateDMY(startVisit.created_date.toString());
             
            const newPict           = await this.updatePictureVisit(customerCode, salesCode, startVisit); 
            newPict.id              = await encodeId(Number(startVisit.id));
            const absenKey          = keyVisitNow(salesCode, date); 
            await redis.unlink(absenKey); 
            res.status(200).json({ message: "Berhasil mulai visit", data, newPict, status: true, version: "v1" });
        } catch (error) {
            console.error("Error absen:", error);
            res.status(500).json({ message: "Terjadi kesalahan server", version: "v1" });   
        } 
    }

    async endVisit(req: Request, res: Response) : Promise<void>{
        try{
            const file      = req.file; // File yang di-upload 
            if (!file) res.status(400).json({ message: "File wajib diunggah!" });  
           
            const valid     = await validEndVisit(req.body); 
            if (!valid.success) { 
                res.status(400).json({ message: "Not Valid Data", status: false });
                return;
            }
            const {date, customerCode,salesCode,latitude, longitude, id, code} = valid.data;
       
            const upload    = await UploadAbsentVisit(file as Express.Multer.File, salesCode, customerCode, "absen_visit_selesai");
            const filePath  = upload?.path; // Path lengkap di server 
            const fileName = upload?.filename;  

            if(!upload.status) res.status(500).json({ message: upload.message, status: false });
  
            const idDecode = decodeId(id);
       
            // update visit_hdr dahulu
            const updateHdr : IEndAbsentVisit = {
                latitude_end : latitude.toString(),
                longitude_end: longitude.toString(), 
                ended_date: getTimeNow(),
            }

            const updateVisitHdr = await VisitModel.updateVisitHdr(updateHdr, Number(idDecode));

            if(!updateVisitHdr && filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                res.status(400).json({ message: "Error end visit", status: false });
                return;
            }

            // insert visit_end
            const endVisit: IVisitEnd = {  
                visit_hdr_code: code,
                url: `uploads/absen_visit/${salesCode}/absen_visit_selesai/${fileName}`,
                note: '',
                created_by: salesCode,
                created_date: getTimeNow(),
                is_upload: '',
                brand: '',
            }

            const insert = await VisitModel.insertEndVisit(endVisit);
           
            if(!insert && filePath && fs.existsSync(filePath)){
                await VisitModel.updateVisitHdr({latitude_end: '', longitude_end: '', ended_date: null }, Number(idDecode));
                fs.unlinkSync(filePath);
                res.status(400).json({ message: "Error end visit", status: false });
                return;
            }

            const cached          = await this.updateCacheVisitHdr(salesCode, customerCode, date);
             
            endVisit.id           = insert ?? '';
            endVisit.is_visit     = "start_visit";
            endVisit.timeFormat   = getTimeHour(endVisit.created_date.toString());
            endVisit.dateFormat   = formatDateDMY(endVisit.created_date.toString());
             
            const newPict         = await this.updatePictureVisit(customerCode, salesCode, endVisit); 
            newPict.id            = await encodeId(Number(newPict.id));
            const absenKey        = keyVisitNow(salesCode, date); 
            await redis.unlink(absenKey); 
            res.status(200).json({ message: "Berhasil menyelesaikan visit", status: true,newPict, data: cached, version: "v1" });
        } catch (error) {
            console.error("Error absen:", error);
            res.status(500).json({ message: "Terjadi kesalahan server", version: "v1" });   
        } 
    }
     
    async checkAbsenVisit(req: Request, res: Response): Promise<void>{
        try {
            // await redis.flushall(); 
            if (Object.keys(req.body).length < 1) {
                this.sendError(res, "Invalid Request", 400); 
                return
            } 
            const { username, date, customerCode } = req.body; 
            if ((!username || !validateUsername(username)) || (!date || !validateDate(date)) || !customerCode) {  
                this.sendError(res, "Invalid Request", 400); 
                return;
            } 
            const key           = keyAbsentVisit(username, customerCode, date); 
            const getCached     = await redis.get(key);
    
            const cached: IVisitHdr = getCached ? JSON.parse(getCached) : (await VisitModel.checkVisitHdr(username, date, customerCode)) ?? {};
    
            if (!getCached) { 
                await redis.setex(key, 600, JSON.stringify(cached));
            }  
            if(Object.keys(cached).length > 0){
                cached.id = await encodeId(Number(cached.id));
            } 
            const data = {
                version: "v1", 
                data: cached, 
                status: true, isAbsen: Object.keys(cached).length < 1 ? false : true};
              
            this.sendResponse(res, data, data.isAbsen ? 'Absen found' : 'Absen not found');
            return;
        } catch (error: unknown) {
            console.error(error); 
            this.sendError(res, "Internal Server Error", 500, [{error: error instanceof Error ? error.message : undefined}]); 
        }
    };
    
    async getMasteItemOutlet (req: Request, res: Response) : Promise<void> {
        if(Object.keys(req.body).length < 1) res.status(400).json({ message: "Invalid Request", status: false });
    
        const {customerCode, date} = req.body;
    
        if(!customerCode || !date || !validateDate(date)) {
            res.status(400).json({ message: "Invalid Request", status: false })
            return;
        };
        const week          = getWeekOfMonth(date);  
        const levelWeek     = getLevelWeek(week);
        
        const key           = keyItemVisitOutlet(customerCode, week, date); 
        const getCached     = await redis.get(key);
    
        let getOutletItem: IMasterItemOutlet[] = getCached ? JSON.parse(getCached) : (await VisitModel.getMasteItemOutlet(customerCode) ?? []);
  
        if(!getCached){
            await redis.setex(key, 600, JSON.stringify(getOutletItem)); 
        } 
    
        const total        = getOutletItem ? getOutletItem.length : 0;
        if(getOutletItem && getOutletItem.length > 100){
            getOutletItem = getOutletItem.filter((item: IMasterItemOutlet) => levelWeek.includes(item.category)) 
        }

        if(getOutletItem.length > 0){
            getOutletItem = getOutletItem.map((item: IMasterItemOutlet) =>  {
                const hashId = encodeId(Number(item.id));  
                return {...item, id: hashId}
            });
        } 
        res.json({ message: "success", version: "v1", data: { item: getOutletItem, total: total}, status: true });
    }
    
    async getPictVisit (req: Request, res: Response) : Promise<void> {
        try{   
            const {success, data, errors} = await validCustSalesCode(req.body);  
            if (!success || !data) { 
                res.status(400).json({ message: "Not Valid Data", version: "v1", errors, status: false });
                return;
            } 
            const {customerCode, salesCode } = data ; 

            const key           = keyPictVisit(customerCode, salesCode); 
            const getCached     = await redis.get(key);
    
            const cached : IPictVisit[] = getCached ? JSON.parse(getCached) : (await VisitModel.getPitcureVisit(customerCode, salesCode)) ?? [];
    
            if (!getCached) { 
                await redis.setex(key, 600, JSON.stringify(cached));
            } 
 
            const newData  = cached.map((item) : IPictVisit => {
                const hashId = encodeId(Number(item.id)); 
                return {...item, id: hashId, dateFormat: formatDateDMY(item.created_date.toString()), timeFormat: getTimeHour(item.created_date.toString())}
            }) 
  
            res.json({ message: "success", version: "v1", data: newData, status: true });
        } catch (error: unknown) {
            console.error(error); 
            this.sendError(res, "Internal Server Error", 500, [{error: error instanceof Error ? error.message : undefined}]); 
        }
      
    }

    async saveStocKVisit (req: Request, res: Response) : Promise<void> {
        try {
            if(Object.keys(req.body).length < 1) res.status(400).json({ message: "Invalid Request", status: false });
            const {header, detail} = req.body;
            if(!header || !detail) res.status(400).json({ message: "Invalid Request", status: false });
        } catch (error : unknown) {
            console.error(error); 
            this.sendError(res, "Internal Server Error", 500, [{error: error instanceof Error ? error.message : undefined}]); 
        } 
    }
 
    private async createAbsenCache(username: string, absent: AbsenSalesman){
        const date      = absent.start_absent.substring(0, 10);
        const absenKey = keyAbsen(username, date);
        await redis.unlink(absenKey);
        await redis.setex(absenKey, 600, JSON.stringify(absent));
    
        return true;
    }
    
    private async updateAbsenCache(username: string, absent: IEndAbsent) : Promise<boolean | object> {
        const date          = absent.date?.substring(0, 10) || new Date().toISOString().split('T')[0];
        const absenKey      = keyAbsen(username, date);
        let cachedAbsent    = await redis.get(absenKey); 
        if(!cachedAbsent) return false; 

        const newAbsent         = JSON.parse(cachedAbsent);  
        newAbsent.end_absent    = absent.end_absent; 
        newAbsent.time_end      = getTimeHour(absent.end_absent);
        
        await redis.unlink(absenKey);
        await redis.setex(absenKey, 600, JSON.stringify(newAbsent));
        cachedAbsent    = await redis.get(absenKey); 
        if(!cachedAbsent) return false;
        return newAbsent;
    }
    private sortingVisit(visit: AbsenSalesmanDetail[]) : AbsenSalesmanDetail[] {
        visit.sort((a, b) => {
            const emptyDateA = !a.start_visit || a.start_visit === '' || a.start_visit.startsWith("0001-01-01");
            const emptyDateB = !b.start_visit || b.start_visit === '' || b.start_visit.startsWith("0001-01-01");
        
            if (emptyDateA && emptyDateB) return a.customer_name.localeCompare(b.customer_name);
            if (emptyDateA) return 1;  // Yang belum visit ke bawah
            if (emptyDateB) return -1; // Yang sudah visit ke atas 
            return new Date(a.start_visit).getTime() - new Date(b.start_visit).getTime();
        }); 
        return visit;
    }
  
    private async updatePictureVisit(customerCode: string, salesCode: string, data: IParmStartVisit)  { 
        const key           = keyPictVisit(customerCode, salesCode); 
        const getCached     = await redis.get(key);

        const cached : IPictVisit[] = getCached ? JSON.parse(getCached) : (await VisitModel.getPitcureVisit(customerCode, salesCode)) ?? []; 
        const preData = {
            id: data.id,
            url: data.url,
            created_date: data.created_date,
            note: data.note,
            brand: data.brand,
            is_visit: data.is_visit,
            dateFormat: data.dateFormat,
            timeFormat: data.timeFormat,
        }
        let newCached = [preData,...cached];
        newCached = newCached.length > 10 ? newCached.slice(0, 10) : newCached;
        await redis.setex(key, 600, JSON.stringify(newCached));

        return preData;
    }

    private async updateCacheVisitHdr(salesCode: string, customerCode: string, date: string) : Promise<IVisitHdr> {
        const key           = keyAbsentVisit(salesCode, customerCode, date); 
        const getCached     = await redis.get(key);

        const cached: IVisitHdr = getCached ? JSON.parse(getCached) : (await VisitModel.checkVisitHdr(salesCode, date, customerCode)) ?? {};

        if(cached){
            cached.end_visit = getTimeNow();
            await redis.setex(key, 600, JSON.stringify(cached)); 
        } 
        return cached;
    }
 
}

 

export default VisitController;