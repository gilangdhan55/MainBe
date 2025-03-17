import { Request, Response } from "express";  
import {VisitModel} from "../models/VisitModel"; 
import {getWeekOfMonth, getDay} from "../helper/GetWeek";
import {validateUsername, validateDate, validatePastDate} from "../helper/Validator";
import Redis from "ioredis";


const redis = new Redis({
    host: "127.0.0.1",
    port: 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000) // biar nggak spam error 
});
 
 
interface AbsenSalesmanDetail {
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

interface ISchedule {
    sales_code: string;
    customer_code: string;
    customer_name: string;
    address: string;
}

const checkAbsenSalesman = async (req: Request, res: Response): Promise<void> => { 
    const { username, date} = req.body;
    // await redis.flushall(); 
    if((!date || !validateDate(date)|| ( !username || !validateUsername(username)))) {
        res.status(401).json({ message: "Invalid Request", status: false });
        return;
    }
    let absent; 
    const day           = getDay(date);   
    const week          = getWeekOfMonth(date);  
    const absenKey      = `user:${username}:${date}`; 
    // await redis.unlink(absenKey); 
    // console.log(absenKey)
    const cachedAbsen   = await redis.get(absenKey); 
    absent              = !cachedAbsen ? await VisitModel.checkAbsenSalesman(username, date) : JSON.parse(cachedAbsen);

    !cachedAbsen && await redis.setex(absenKey, 600, JSON.stringify(absent));

    // console.log(absent)
    const Schedule  = await VisitModel.getScheduleSalesman(username, day, week);
    // console.log(Schedule)
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

const checkAbsenYesterday = async (username: string, date: string) => {
    let totalVisit = 0, totalSchedule = 0;
    let visitHdr = [];
    const visitKeyNow = `visit:${username}:${date}:now`;
    
    // Ambil data dari Redis
    const cachedVisitNow = await redis.get(visitKeyNow);

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

    // Ambil data dari Redis
    const cachedVisitNow = await redis.get(visitKeyNow);
    visitHdr = !cachedVisitNow ? await VisitModel.getVisitHdr(username, date) || [] : JSON.parse(cachedVisitNow);
    !cachedVisitNow && await redis.setex(visitKeyNow, 600, JSON.stringify(visitHdr));
    
    // Proses daftar kunjungan
    const visit = Schedule.map(schedule => {
        const findVisit = visitHdr.find((visit: AbsenSalesmanDetail) => visit.customer_code === schedule.customer_code); 
        // 1 = absen start visit
        // 2 = absen end visit
        // 3 = tidak visit
        // 0 = belum absen
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
 

export {checkAbsenSalesman  }