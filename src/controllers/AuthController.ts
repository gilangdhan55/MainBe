import { Request, Response } from "express"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { platform, version } from "os";

const users = [
    { id: 1, username: "admin", password: bcrypt.hashSync("admin123", 10), platform: ["visit", "action-plan", "pkexpress", "anp"] },
    { id: 2, username: "user", password: bcrypt.hashSync("user123", 10), platform: ["anp"] },
];

interface User {
    id?: number;
    username: string; 
    platform: string[];
}

const login = (req: Request, res: Response): void => { 
    const { username, password, platform } = req.body;
    const user = users.find(u => u.username === username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }

    const data : User = { 
        username: user.username, 
        platform: user.platform 
    } 

    const token = jwt.sign(data, process.env.JWT_SECRET!, { expiresIn: "1h" });

    res.status(200).json({ token, status: true, version: "v1" });
}


export {login}