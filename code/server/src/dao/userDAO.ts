import db from "../db/db"
import { User } from "../components/user"
import crypto from "crypto"
import { UserAlreadyExistsError, UserNotFoundError } from "../errors/userError";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

    /**
    * @param username
    * @param name The name of the user
    * @param surname The surname of the user
    * @param birthdate
    * @param address
    * @param filter Filtro: 0 per tutti gli utenti, 1 per determinato ruolo
    * @param role enum definito in user
      @returns
    */
 
   GetUsers(filter: number, role: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            try {
                let sql;
                switch (filter) {
                    //ALL
                    case 0: 
                    sql = "SELECT username, name, surname, role, address, birthdate FROM users";
                    break;
                    //ROLE
                    case 1: 
                    sql = 'SELECT username, name, surname, role, address, birthdate FROM users WHERE role = "'+role+'"';
                    break;
                    default:
                    throw new Error("Invalid Filter");
                }
                db.all(sql, [], (err: Error | null, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    DeleteAll() {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM users WHERE role != 'Admin'"
                db.run(sql, [], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }

        })
    }
    

    EditUser(username: string, name: string, surname: string, address: string, birthdate: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            try {
                const updateSql = "UPDATE users SET name=?, surname=?, address=?, birthdate=? WHERE username=?";
                db.run(updateSql, [name, surname, address, birthdate, username], function (err: Error | null) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (this.changes === 0) {
                        //Se non viene aggiornata nessuna riga vuol dire che non è stato trovato lo user con quel username
                        reject(new UserNotFoundError());
                        return;
                    }
                    
                    const selectSql = "SELECT * FROM users WHERE username=?";
                    db.get(selectSql, [username], (err: Error | null, row: any) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (!row) {
                            reject(new UserNotFoundError());
                            return;
                        }
                        resolve(new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate));
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    


    DeleteUser(username: string) {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM users WHERE username = ?"
                db.run(sql, [username], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: users.username")) return reject(new UserNotFoundError);
                        return reject(err);
                    }
                    resolve(true);
                })
            } catch (error) {
                reject(error)
            }
        })
    }


    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                /**
                 * Example of how to retrieve user information from a table that stores username, encrypted password and salt (encrypted set of 16 random bytes that ensures additional protection against dictionary attacks).
                 * Using the salt is not mandatory (while it is a good practice for security), however passwords MUST be hashed using a secure algorithm (e.g. scrypt, bcrypt, argon2).
                 */
                const sql = "SELECT username, password, salt FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) return reject(err)
                    //If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
                    if (!row || row.username !== username || !row.salt) {
                       return resolve(false)
                    } else {
                        //Hashes the plain password using the salt and then compares it with the hashed password stored in the database
                        const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16)
                        const passwordHex = Buffer.from(row.password, "hex")
                        if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) return resolve(false);
                        resolve(true);
                    }

                })
            } catch (error) {
                reject(error)
            }

        });
    }

 /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const salt = crypto.randomBytes(16)
                const hashedPassword = crypto.scryptSync(password, salt, 16)
                const sql = "INSERT INTO users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)"
                db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: users.username")) return reject(new UserAlreadyExistsError);
                        return reject(err);
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserByUsername(username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new UserNotFoundError())
                        return
                    }
                    const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                    resolve(user)
                })
            } catch (error) {
                reject(error)
            }

        })
    }
}
export default UserDAO