import { db } from "../config/knex";

export interface User {
    username: string;
    email: string;
    password: string;
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
    username: string;
    email: string;
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
        return await db("master_users").select();
    }

    static async getUserLogin(username: string): Promise<User | null> {
        return await db("master_users")
            .select("username", "email", "password")
            .where("username", username)
            .orWhere("email", username)
            .first();
    }

    static async getPlatformUser(username: string): Promise<PlatformUser[]> {
        const result = await db
            .raw(
                `SELECT a.id, a.code_platform, b.name, b.path, c.role_name
                FROM users_platform a 
                INNER JOIN master_platform b ON a.code_platform = b.code 
                LEFT JOIN (
                    SELECT a.users_platform_id, a.role_id, b.name AS role_name 
                    FROM users_role a 
                    JOIN master_roles b ON a.role_id = b.id_role
                ) c ON a.id = c.users_platform_id
                WHERE a.user_id = ?`,
                [username]
            )
            .then(res => res || []);

        return result;
    }

    static async getProfileUser(username: string): Promise<ProfileUser | null> {
        return await db("view_users_profile")
            .select(
                "username",
                "image",
                "whatsapp",
                "division_id",
                "division",
                "department_id",
                "department",
                "position_id",
                "position",
                "level_id",
                "level"
            )
            .where("username", username)
            .first();
    }

    static async updatePassword(data: ParamUser): Promise<number> {
        return await db("master_users")
            .where("username", data.username)
            .update({ password: data.password });
    }
}
