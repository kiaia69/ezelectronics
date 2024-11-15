"use strict"

import db from "../db/db";
import fs from "fs";
import path from "path";
/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup() {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM Sale;DELETE FROM Review;DELETE FROM ProductUser;DELETE FROM Cart;DELETE FROM users;DELETE FROM ProductDescriptor;DELETE FROM ProductHistory;DELETE FROM sqlite_sequence;"

            db.exec(sql, (err: Error | null) => {
                if (err) {
                    reject(err)
                }
                resolve(true);
                return;
            });


            // const sqlFilePath = path.resolve(__dirname, "tables.sql");

            // const sql = fs.readFileSync(sqlFilePath, "utf8");

            // // Execute the SQL file
            // db.exec(sql, (err: Error | null) => {
            //     if (err) {
            //         throw err;
            //     } else {
            //         return resolve(true);
            //     }
            // });

        })

}

export function cleanup_without_users() {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM Sale;DELETE FROM Review;DELETE FROM ProductUser;DELETE FROM Cart;DELETE FROM ProductDescriptor;DELETE FROM ProductHistory;DELETE FROM sqlite_sequence;"
        db.exec(sql, (err: Error | null) => {
            if (err) {
                reject(err)
            }
            resolve(true);
            return;
        });
    });

}