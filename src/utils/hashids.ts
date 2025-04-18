 
import Hashids from "hashids";
import dotenv from "dotenv";

dotenv.config();
 
const hashids = new Hashids(process.env.KEY_HASH, 6);

export const encodeId = (id: number): string => {
  return hashids.encode(id);
};

export const decodeId = (id: string): number | null => {
    const decoded = hashids.decode(id);
  // Periksa apakah array decode tidak kosong
    if (decoded.length === 0) {
        return null; // atau bisa lempar error jika tidak valid
    }
    return decoded[0] as number;
}

 
