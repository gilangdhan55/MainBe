const keyAbsen = (username: string, date: string): string => {
    return `absen:${username}:${date}`;
};

const keyDateNotClockOut = (username: string): string => {
    return `date_not_clock_out:${username}`; 
};

const keyVisitNow = (username: string, date: string): string => {
    return `visit:${username}:${date}:now`;
}

const keyAbsentVisit = (username: string, customerCode: string, date:string) : string => {
    return `absentHdr:${username}:${customerCode}:${date}`
}

const keyItemVisitOutlet = (customerCode: string, week: number, date: string): string => {
    return `item_visit_outlet:${customerCode}:${week}:${date}`
}

export {keyAbsen, keyDateNotClockOut, keyVisitNow, keyAbsentVisit, keyItemVisitOutlet};