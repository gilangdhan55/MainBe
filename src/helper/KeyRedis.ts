const keyAbsen = (username: string, date: string): string => {
    return `absen:${username}:${date}`;
};


export {keyAbsen};