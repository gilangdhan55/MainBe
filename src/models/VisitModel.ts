import { dbVisit as db } from "../config/knex";

export interface User {
    username: string;
    email: string;
    password: string;
}
 

export class AuthModel {
    static async getAllUsers(): Promise<User[]> {
        return await db("master_users").select();
    }
 
}
