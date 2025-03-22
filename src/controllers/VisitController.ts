import { Request, Response } from "express";  
import {AbsenSalesmanDetail, ISchedule, IStartAbsent, AbsenSalesman} from "../interface/VisitInterface"
import {VisitModel} from "../models/VisitModel"; 
import {getWeekOfMonth, getDay, getTimeNow, getTimeHour} from "../helper/GetWeek";
import {validateUsername, validateDate, validatePastDate} from "../helper/Validator";
import redis from "../utils/redis"
import {keyAbsen} from "../helper/KeyRedis";
 
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
    // await redis.unlink(absenKey); 
    // console.log(absenKey)
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

    if (visit.length > 0)  visit = await sortingVisit(visit); 
    res.status(200).json({ status: true, version: "v1", data: {visit,  absent, totalSchedule, totalVisit} });
};

const startAbsent = async (req: Request, res: Response): Promise<void> => { 
    try {
        const file      = req.file; // File yang di-upload 
        const {username, latitude, longitude, fullname} = req.body;
       
        if (!file) res.status(400).json({ message: "File wajib diunggah!" });

        if (!username || !latitude || !longitude || !fullname || !validateUsername(username))  res.status(400).json({ message: "Data tidak lengkap!" });

        // Ambil path lengkap dan nama file
        const filePath = file?.path; // Path lengkap di server
        const fileName = file?.filename; // Nama file (SPG004_250321095128.jpg)
 
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
            res.status(500).json({ message: "Terjadi kesalahan server" });
            return;
        } 
        
        const absent: AbsenSalesman = {
            code: username,
            end_absent: '',
            id: insert,
            name: fullname,
            start_absent: data.start_absent, 
            time_start: getTimeHour(data.start_absent),
            time_end: '' 
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
        const findVisit = visitHdr.find((visit: AbsenSalesmanDetail) => visit.customer_code === schedule.customer_code); 
        // 1 = absen start visit;  2 = absen end visit; 3 = tidak visit;  0 = belum absen
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
 

export {checkAbsenSalesman, startAbsent  }