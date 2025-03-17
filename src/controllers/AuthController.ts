import { Request, Response } from "express"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; 
import {AuthModel} from "../models/AuthModel";
import {encript} from "../utils/bycrypt";
import Redis from "ioredis";
 
const redis = new Redis({
    host: "127.0.0.1",
    port: 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000) // biar nggak spam error 
});

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
    let user;
    let platform;
    let profile; 
    // **Cek di Redis dulu biar cepet**
    const cacheKey      = `user:${username}`;
    // await redis.unlink(cacheKey); 
    // await redis.flushall();
    const cachedUser    = await redis.get(cacheKey);
    user                = cachedUser ? JSON.parse(cachedUser) : await AuthModel.getUserLogin(username);
    if (!user) {
        res.status(401).json({ message: "Invalid username or password", status: false });
        return;
    }  

    !cachedUser && await redis.setex(cacheKey, 600, JSON.stringify(user));
     
    const platFormKey   = `platform:${username}`;
    const profileKey    = `profile:${user.nik}`;   
    await redis.unlink(platFormKey);
    await redis.unlink(profileKey);
    
    // **Cek Password**
    const isMatch = await bcrypt.compare(password, user.password); 
    if (!isMatch) {
        res.status(404).json({ message: "Invalid username or password", status: false });
        return;
    }

    const cachePlatform = await redis.get(platFormKey); 

    platform = cachePlatform ? JSON.parse(cachePlatform) : await AuthModel.getPlatformUser(user.nik);
    !cachePlatform && await redis.setex(platFormKey, 600, JSON.stringify(platform));
      
    const cachedProfile = await redis.get(profileKey); 
    
    profile = cachedProfile ? JSON.parse(cachedProfile) : await AuthModel.getProfileUser(user.nik);
    !cachedProfile && await redis.setex(profileKey, 600, JSON.stringify(profile));

    const data = { 
        username: user.username || '', 
        fullname: user.fullname, 
        image: profile?.image || '',  
        whatsapp: profile?.whatsapp || '',  
        division_id: profile?.division_id || '',  
        division: profile?.division || '',  
        department_id: profile?.department_id || '',  
        department: profile?.department || '',  
        position_id: profile?.position_id || '',  
        position: profile?.position || '',  
        level_id: profile?.level_id || '',  
        level: profile?.level || '',  
        email: user.email,
        nik: user.nik
    };
     
    const forToken = { username, platform: platform };
    const token = jwt.sign(forToken, process.env.JWT_SECRET!, { expiresIn: "1h" });
    
    res.status(200).json({ status: true, version: "v1",data, token});
};



const updateAllpassword = async (req: Request, res: Response): Promise<void> => {
    const users = await AuthModel.getAllUsers();

    for(const user of users){
        console.log(user.password)
        const password = await encript(user.password);
        const param:ParamUser = {
            username: user.username,
            password: password
        }
        const update = await AuthModel.updatePassword(param);
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