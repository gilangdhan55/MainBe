const getWeekOfMonth = (dateStr: string): number => {
    const date              = new Date(dateStr);
    const year              = date.getFullYear();
    const month             = date.getMonth();
    const firstDay          = new Date(year, month, 1);
    const firstDayOfWeek    = (firstDay.getDay() + 6) % 7; 
    let weekOfMonth         = Math.ceil((date.getDate() + firstDayOfWeek) / 7);
 
    const lastDay   = new Date(year, month + 1, 0); 
    const lastWeek  = Math.ceil((lastDay.getDate() + firstDayOfWeek) / 7);
 
    if (weekOfMonth === 6) {
        return 1; 
    } else if (weekOfMonth > 1 && lastWeek === 6) {
        return weekOfMonth - 1; 
    }

    return weekOfMonth;
};


const getDay = (date: string) : number => {
    const day = new Date(date).getDay();
    return day === 0 ? 7 : day;
};
 
export { getWeekOfMonth, getDay};
 
