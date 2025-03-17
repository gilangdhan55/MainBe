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
    await redis.unlink(absenKey); 
    const cachedAbsen   = await redis.get(absenKey);

    if(!cachedAbsen) {
        absent    = await VisitModel.checkAbsenSalesman(username, date);
        await redis.setex(absenKey, 600, JSON.stringify(absent));
    }else{
        absent = JSON.parse(cachedAbsen);
    }

    const Schedule  = await VisitModel.getScheduleSalesman(username, day, week);
    
    let visit: AbsenSalesmanDetail[] = []
    let totalSchedule: number = 0,totalVisit: number = 0;
    if(validatePastDate(date)){ 
        console.log("Sudah lewat ⏳");

    }else{ 
        console.log("Hari ini 📅");
        const {newVisit, newTotalSchedule, newTotalVisit} = await  checkAbsenToday(username, date, Schedule);
        visit = newVisit;
        totalSchedule = newTotalSchedule;
        totalVisit = newTotalVisit;
    }

    if (visit.length > 0) {
        visit.sort((a, b) => {
            const emptyDateA = !a.start_visit || a.start_visit === "0001-01-01 00:00:00.001";
            const emptyDateB = !b.start_visit || b.start_visit === "0001-01-01 00:00:00.001";
     
            if (emptyDateA && emptyDateB) return a.customer_name.localeCompare(b.customer_name); 
            if (emptyDateA) return 1; 
            if (emptyDateB) return -1; 
            return a.start_visit.localeCompare(b.start_visit);
        });
    }
     

    res.status(200).json({ status: true, version: "v1", data: {visit,  absent, totalSchedule, totalVisit} });
};

const checkAbsenToday = async (username: string, date: string, Schedule: ISchedule[]) => {
    let totalVisit: number = 0, totalSchedule: number = 0;
    let visitHdr, visit: AbsenSalesmanDetail[] = [];
    const visitKeyNow = `visit:${username}:${date}:now`;
    await redis.unlink(visitKeyNow); 
    const cachedVisitNow = await redis.get(visitKeyNow);
    if(!cachedVisitNow){
        visitHdr = await VisitModel.getVisitHdr(username, date) || [];  
        await redis.setex(visitKeyNow, 600, JSON.stringify(Schedule));
    }else{
        visitHdr = JSON.parse(cachedVisitNow); 
    }  
    if (visitHdr.length > 0) {
        const visitDetails: AbsenSalesmanDetail[] = [];  
        for (const schedule of Schedule) { 
            let visitNew: AbsenSalesmanDetail = {
                customer_code: schedule.customer_code,
                customer_name: schedule.customer_name,
                address: schedule.address,
                note: "",
                start_visit: '',
                end_visit: '',
                is_visit: false
            };  
            const findVisit = visitHdr.find((visit: AbsenSalesmanDetail) => visit.customer_code === schedule.customer_code); 
            visitNew.note           = findVisit?.note || "";
            visitNew.start_visit    = findVisit?.start_visit || '';
            visitNew.end_visit      = findVisit?.end_visit || '';
            visitNew.is_visit       = findVisit?.is_visit || false;
            visitNew.code           = findVisit?.code || '';
            visitNew.status         = findVisit?.start_visit ? (findVisit?.end_visit ? (findVisit?.end_visit !== '0001-01-01 00:00:00.001'? 3 : 2) : 1) : 0 ;
            totalVisit              = visitNew.status === 3 ? totalVisit + 1 : totalVisit;
            visitNew.start_time     = findVisit?.start_time || '';
            visitNew.end_time       = findVisit?.end_time || '';

            visitDetails.push(visitNew);  
        }  
        visit = visitDetails;
    }else{
        for (const schedule of Schedule) { 
            const visitNew: AbsenSalesmanDetail = {
                customer_code: schedule.customer_code,
                customer_name: schedule.customer_name,
                address: schedule.address,
                note: "",
                start_visit: '',
                end_visit: '',
                is_visit: false,   
                code: '',
                status:0,
                start_time:'',
                end_time:'',
            };  
            
            totalVisit= 0;
            visit.push(visitNew); 
        }
    }
    totalSchedule = Schedule.length;

    return {newVisit: visit, newTotalSchedule: totalSchedule, newTotalVisit: totalVisit};
}
 

export {checkAbsenSalesman  }