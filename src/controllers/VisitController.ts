import { Request, Response } from "express";  
import {AbsenSalesmanDetail, ISchedule, IStartAbsent, AbsenSalesman, IEndAbsent} from "../interface/VisitInterface"
import {VisitModel} from "../models/VisitModel"; 
import {getWeekOfMonth, getDay, getTimeNow, getTimeHour} from "../helper/GetWeek";
import {validateUsername, validateDate, validatePastDate} from "../helper/Validator";
import redis from "../utils/redis"
import {keyAbsen, keyDateNotClockOut} from "../helper/KeyRedis";
import fs from "fs";
import {UploadAbsent} from "../helper/UploadFile";
 
const checkAbsenSalesman = async (req: Request, res: Response): Promise<void> => { 
    const { username, date} = req.body;
    await redis.flushall(); 
    if((!date || !validateDate(date)|| ( !username || !validateUsername(username)))) {
        res.status(401).json({ message: "Invalid Request", status: false });
        return;
    }
    let absent; 
    const day           = getDay(date);   
    const week          = getWeekOfMonth(date);  
    const absenKey      = keyAbsen(username, date); 
 
    const cachedAbsen   = await redis.get(absenKey);  
    absent              = !cachedAbsen ? await VisitModel.checkAbsenSalesman(username, date) : JSON.parse(cachedAbsen); 
    !cachedAbsen && await redis.setex(absenKey, 600, JSON.stringify(absent));
 
    const Schedule  = await VisitModel.getScheduleSalesman(username, day, week);
    
    let visit: AbsenSalesmanDetail[] = []
    let totalSchedule: number = 0,totalVisit: number = 0;

    // proses hari ini atau kemarin
    if(validatePastDate(date)){ 
        console.log("Sudah lewat ⏳"); 
        const {newVisit, newTotalSchedule, newTotalVisit} = await  checkAbsenYesterday(username, date); 
        visit           = newVisit;
        totalSchedule   = newTotalSchedule;
        totalVisit      = newTotalVisit; 
    }else{ 
        console.log("Hari ini 📅");
        const {newVisit, newTotalSchedule, newTotalVisit} = await  checkAbsenToday(username, date, Schedule);
        visit           = newVisit;
        totalSchedule   = newTotalSchedule;
        totalVisit      = newTotalVisit;
    }
    let absentNotVisit;

    // ambil data absen yang belum clock out
    const absentNotVisitKey = keyDateNotClockOut(date);
    const cachedAbsentNotVisit = await redis.get(absentNotVisitKey);
    absentNotVisit = !cachedAbsentNotVisit ? await VisitModel.getAbsentNotVisit(username, date) || [] : JSON.parse(cachedAbsentNotVisit); 
    !cachedAbsentNotVisit && await redis.setex(absentNotVisitKey, 600, JSON.stringify(absentNotVisit)); 
    if (visit.length > 0)  visit = await sortingVisit(visit);  
    res.status(200).json({ status: true, version: "v1", data: {visit,  absent, totalSchedule, totalVisit, absentNotVisit} });
};

const startAbsent = async (req: Request, res: Response): Promise<void> => { 
    try {
        const file      = req.file; // File yang di-upload 
        const {username, latitude, longitude, fullname} = req.body;
       
        if (!file) res.status(400).json({ message: "File wajib diunggah!" });

        if (!username || !latitude || !longitude || !fullname || !validateUsername(username))  res.status(400).json({ message: "Data tidak lengkap!" });

        // proses upload file 
        const upload = UploadAbsent(file as Express.Multer.File, username);

        if(!upload.status) res.status(500).json({ message: upload.message, status: false });

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
        await createAbsenCache(username, absent);
        
        res.status(200).json({
            message: "Absen berhasil!", 
            status: true,
            data: absent
        });
    } catch (error) {
        console.error("Error absen:", error);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    } 
}

const endAbsent = async (req: Request, res: Response): Promise<void> => {
    try {
        const file      = req.file; // File yang di-upload 
        if (!file) res.status(400).json({ message: "File wajib diunggah!" }); 
        const {username, latitude, longitude, fullname, id, date} = req.body;
 
        if (!username || !latitude || !longitude || !fullname || !date || !id || !validateUsername(username))  res.status(400).json({ message: "Data tidak lengkap!" });

         // proses upload file 
        const upload = UploadAbsent(file as Express.Multer.File, username); 
        if(!upload.status) res.status(500).json({ message: upload.message, status: false });

         // Ambil path lengkap dan nama file
        const filePath = upload?.path; // Path lengkap di server
        const fileName = upload?.filename; // Nama file (SPG004_250321095128.jpg)
 
        // kumpulkan data buat insert ke db
        const data: IEndAbsent = {
            end_absent: getTimeNow(),
            latitude_end: latitude,
            longitude_end: longitude,
            url_end: `uploads/absen/${username}/${fileName}`,
        }

        let update = await VisitModel.updateAbsent(data, id);
     
        if(!update) {  
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
            res.status(400).json({ status: false, message: "Error updating data" });
            return;
        }
        data.date = date;
        await updateAbsenCache(username, data)
        res.status(200).json({ message: "Clock out berhasil!", status: true, data });
    } catch (error) {
        console.error("Error absen:", error);
        res.status(500).json({ message: "Terjadi kesalahan server as" });   
    }
}

const checkAbsenYesterday = async (username: string, date: string) => {
    let totalVisit  = 0, totalSchedule = 0, visitHdr    = [];
    const visitKeyNow = `visit:${username}:${date}:now`;
    
    // Ambil data dari Redis
    const cachedVisitNow = await redis.get(visitKeyNow);

    // await redis.unlink(visitKeyNow); 
    visitHdr = !cachedVisitNow ? await VisitModel.getVisitHdrAbsent(username, date) || [] : JSON.parse(cachedVisitNow);
    !cachedVisitNow && await redis.setex(visitKeyNow, 600, JSON.stringify(visitHdr));

    // Proses daftar kunjungan
    const visit =  visitHdr.map((visit: AbsenSalesmanDetail) => {  
        const status = visit?.start_visit ? (!visit?.end_visit ? 1 : (visit?.end_visit && visit?.end_visit !== '0001-01-01 00:00:00' ? 2 : 3) ): 0; 
        if(status === 2) totalVisit++;
        return { ...visit, status: status };
    });
    totalSchedule = visitHdr.length; 
    return {newVisit: visit, newTotalSchedule: totalSchedule, newTotalVisit: totalVisit}; 
}

const checkAbsenToday = async (username: string, date: string, Schedule: ISchedule[]) => {
    let totalVisit = 0, totalSchedule = Schedule.length;
    let visitHdr = [];
    const visitKeyNow = `visit:${username}:${date}:now`;
    // await redis.unlink(visitKeyNow); 

    // Ambil data dari Redis
    const cachedVisitNow = await redis.get(visitKeyNow);
    visitHdr = !cachedVisitNow ? await VisitModel.getVisitHdr(username, date) || [] : JSON.parse(cachedVisitNow);
    !cachedVisitNow && await redis.setex(visitKeyNow, 600, JSON.stringify(visitHdr));
    
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

const sortingVisit = (visit: AbsenSalesmanDetail[]) : AbsenSalesmanDetail[] => {
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

const createAbsenCache = async (username: string, absent: AbsenSalesman) => {
    const date      = absent.start_absent.substring(0, 10);
    const absenKey = keyAbsen(username, date);
    await redis.unlink(absenKey);
    await redis.setex(absenKey, 600, JSON.stringify(absent));

    return true;
}

const updateAbsenCache = async (username: string, absent: IEndAbsent) => {
    const date          = absent.date?.substring(0, 10) || new Date().toISOString().split('T')[0];
    const absenKey      = keyAbsen(username, date);
    const cachedAbsent  = await redis.get(absenKey);
    if(!cachedAbsent) return false; 
    const newAbsent     = JSON.parse(cachedAbsent); 
    newAbsent.end_absent = absent.end_absent;
    newAbsent.latitude_end = absent.latitude_end;
    newAbsent.longitude_end = absent.longitude_end;
    newAbsent.url_end = absent.url_end;
    await redis.unlink(absenKey);
    await redis.setex(absenKey, 600, JSON.stringify(newAbsent));
    return true;
}
 

export {checkAbsenSalesman, startAbsent, endAbsent  }