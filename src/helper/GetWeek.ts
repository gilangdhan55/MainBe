const getFullFormatter = () => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }); 
    return formatter;
}

const getTimeFormatter = () => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta", 
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }); 
    return formatter;
}

const fullFormattedDate = (formatter: Intl.DateTimeFormat, now: Date) : string => {
    const parts = chunckDate(formatter, now); 
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

const dateFormattedDate = (formatter: Intl.DateTimeFormat, now: Date) : string => {
    const parts = chunckDate(formatter, now); 
    return `${parts.year}-${parts.month}-${parts.day}`; // 2023-01-01
}

const dateFormattedDate2 = (formatter: Intl.DateTimeFormat, now: Date) : string => {  
    const parts = chunckDate(formatter, now); 
    return `${parts.day}-${parts.month}-${parts.year}`; // 01-01-2023
} 
const timeFormattedDateHour = (formatter: Intl.DateTimeFormat, now: Date) : string => {
    const parts = chunckDate(formatter, now); 
    return `${parts.hour}:${parts.minute}`;  // 13:30
}

const chunckDate = (formatter: Intl.DateTimeFormat, now: Date) : Record<string, string> => {
    const parts     = formatter.formatToParts(now).reduce((acc, part) => {
        if (part.type !== "literal") acc[part.type] = part.value;
        return acc;
    }, {} as Record<string, string>); 
    return parts; 
}

const getWeekOfMonth = (dateStr: string): number => {
    const date              = new Date(dateStr);
    const year              = date.getFullYear();
    const month             = date.getMonth();
    const firstDay          = new Date(year, month, 1);
    const firstDayOfWeek    = (firstDay.getDay() + 6) % 7; 
    const weekOfMonth       = Math.ceil((date.getDate() + firstDayOfWeek) / 7);
 
    // const lastDay   = new Date(year, month + 1, 0); 
    // const lastWeek  = Math.ceil((lastDay.getDate() + firstDayOfWeek) / 7); 
    
    // if (weekOfMonth === 6) {
    //     return 1; 
    // } else if (weekOfMonth > 1 && lastWeek === 6) {
    //     return weekOfMonth - 1; 
    // }

    return ((weekOfMonth - 1) % 4) + 1;
};
 
const getDay = (date: string) : number => {
    const day = new Date(date).getDay();
    return day === 0 ? 7 : day;
};


const getTimeNow = (): string => {
    const now           = new Date(); 
    const formatter     = getFullFormatter(); 
    const initFormat    = fullFormattedDate(formatter, now); 

    return initFormat;
};

const getTimeHour = (date: string): string => {
    const now        = new Date(date);
    const formatter  = getTimeFormatter();
    const initFormat = timeFormattedDateHour(formatter, now);
    
    return initFormat;
}

const formatDateDMY = (date: string): string => {
    const now        = new Date(date);
    const formatter  = getFullFormatter();
    const initFormat = dateFormattedDate2(formatter, now);
    //d-m-y
    return initFormat;
}

const formatDateYMD = (date: string): string => {
    const now        = new Date(date);
    const formatter  = getFullFormatter();
    const initFormat = dateFormattedDate(formatter, now);
    //y-m-d
    return initFormat;
}

const getFullDateNoTme = (date?: string): string => {
    const now        = date ? new Date(date) : new Date(); 
    const formatter  = getFullFormatter(); 
    const initFormat = fullFormattedDate(formatter, now); 

    return initFormat;
}

const getLevelWeek = (week: number): Array<string> => { 
    switch (week) {
        case 1:
            return ['MUST CHECK'];
        case 2:
            return ['MUST CHECK', 'MEDIUM'];
        case 3:
            return ['MUST CHECK', 'LOW'];
        case 4:
            return ['MUST CHECK', 'MEDIUM']; 
        default:
            return [];
    }
}

const strToTime = (time: string) : number => {
    return Math.floor(new Date(time).getTime() / 1000); 
}

export { getWeekOfMonth, getDay, getTimeNow, getTimeHour, getLevelWeek, getFullDateNoTme, dateFormattedDate, strToTime, dateFormattedDate2, formatDateDMY, formatDateYMD};
 
