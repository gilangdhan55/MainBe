import { db } from "../config/knex";
import sql from "mssql";

export interface User {
    username: string,
    email: string,
    password: string
}

interface ParamUser {
    username: string;
    password: string;
}

interface PlatformUser { 
    code_platform: string;
    user_id: string;
    name: string;
    path: string;
}

interface ProfileUser {
    username:string;
    email:string;
    image: string;
    whatsapp: string;
    division_id: number;
    division: string;
    department_id: number;
    department: string;
    position_id: number;
    position: string;
    level_id: number;
    level: string;
}

export class AuthModel {  
    static async getAllUsers(): Promise<User[]> {
        const result = await db().select().from("master_users"); 
        return result;
    }

    static async getUser(username: string): Promise<User | null> {
        const result = await db.raw("SELECT * FROM master_users WHERE username = ? OR email = ?", [username, username]);  
        const data   = result[0] || null;
        return data;
    }

    static async getPlatformUser(username: string): Promise<PlatformUser[]> {
        const result = await db.raw(`select a.id, a.code_platform, b.name, b.path, c.role_name
        FROM users_platform a 
        INNER JOIN master_platform b ON a.code_platform = b.code 
        LEFT JOIN (SELECT a.users_platform_id, a.role_id, b.name role_name FROM users_role a JOIN master_roles b ON a.role_id = b.id_role) c ON a.id = c.users_platform_id
        WHERE a.user_id = ? `, [username]);

        if(result.lenght === 0) return [];

        return result;
    }

    static async getProfileUser(username: string): Promise<ProfileUser | null> {
        const result = await db.raw(`SELECT * FROM view_users_profile WHERE username = ?`, [username]);
        console.log(username)
        const data   = result[0] || null;
        return data;
    }

    static async updatePassword(data:ParamUser ): Promise<number> {
        const result = await db.raw("UPDATE master_users SET password = ? WHERE username = ?; SELECT @@ROWCOUNT as affectedRows;", [data.password, data.username]);
 
        return result[0].affectedRows;
    }
 
}
