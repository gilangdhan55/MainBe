const keyAbsen = (username: string, date: string): string => {
    return `absen:${username}:${date}`;
};

const keyDateNotClockOut = (username: string): string => {
    return `date_not_clock_out:${username}`; 
};


export {keyAbsen, keyDateNotClockOut};