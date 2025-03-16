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

const checkAbsenSalesman = async (req: Request, res: Response): Promise<void> => { 
    const { username, date} = req.body;

    if(!date){
        res.status(401).json({ message: "Invalid date", status: false });
        return;
    }

    console.log(username, date)

    res.status(200).json({ status: true, version: "v1"});
};

 

export {checkAbsenSalesman  }