import { Request, Response } from "express"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; 
import {AuthModel} from "../models/AuthModel";
import {encript} from "../utils/bycrypt";
import Redis from "ioredis";

  
const redis = new Redis();

interface User { 
    username: string; 
    platform: string[];
}

interface ParamUser {
    username: string;
    password: string
}

const login = async (req: Request, res: Response): Promise<void> => { 
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(401).json({ message: "Invalid username or password", status: false });
        return;
    }

    // **Cek di Redis dulu biar cepet**
    const cacheKey = `user:${username}`;
    const cachedUser = await redis.get(cacheKey);

    let user;
    if (cachedUser) {
        console.log("✅ Cache hit! 🔥");
        user = JSON.parse(cachedUser);
    } else {
        console.log("❌ Cache miss. Fetching from DB...");
        user = await AuthModel.getUserLogin(username);
        
        if (!user || !user.password) {
            res.status(401).json({ message: "Invalid username or password", status: false });
            return;
        }

        // **Simpan ke Redis (TTL 10 menit)**
        await redis.setex(cacheKey, 600, JSON.stringify(user));
    }

    // **Cek Password**
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(404).json({ message: "Invalid username or password", status: false });
        return;
    }

    // **Ambil profile & platform**
    const [infoUser, platForm] = await Promise.all([
        AuthModel.getProfileUser(username),
        AuthModel.getPlatformUser(username)
    ]);

    const data = { 
        username: infoUser?.username || '',  
        image: infoUser?.image || '',  
        whatsapp: infoUser?.whatsapp || '',  
        division_id: infoUser?.division_id || '',  
        division: infoUser?.division || '',  
        department_id: infoUser?.department_id || '',  
        department: infoUser?.department || '',  
        position_id: infoUser?.position_id || '',  
        position: infoUser?.position || '',  
        level_id: infoUser?.level_id || '',  
        level: infoUser?.level || '',  
        email: user.email
    };

    const forToken = { username, platform: platForm };
    const token = jwt.sign(forToken, process.env.JWT_SECRET!, { expiresIn: "1h" });

    res.status(200).json({ status: true, version: "v1", data, token });
};



const updateAllpassword = async (req: Request, res: Response): Promise<void> => {
    const users = await AuthModel.getAllUsers();

    for(const user of users){
        const password = await encript(user.password);
        const param:ParamUser = {
            username: user.username,
            password: password
        }
        const update = await AuthModel.updatePassword(param);
        console.log(update)
    }
     
    res.status(200).json({data: users, status: true, version: "v1" });
}


    // if (!user || !bcrypt.compareSync(password, user.password)) {
    //     res.status(401).json({ message: "Invalid username or password" });
    //     return;
    // }

    // const data : User = { 
    //     username: user.username, 
    //     platform: user.platform 
    // } 

    // const token = jwt.sign(data, process.env.JWT_SECRET!, { expiresIn: "1h" });

export {login,updateAllpassword }