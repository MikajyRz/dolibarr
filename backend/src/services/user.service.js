import db from "../database/db.js";

export const getAllUsers = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM users", [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};