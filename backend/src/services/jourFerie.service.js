import db from "../database/db.js";

export const getAllJoursFeries = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM jours_feries ORDER BY date ASC", [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

export const getJourFerieById = (id) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM jours_feries WHERE id = ?", [id], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

export const createJourFerie = (jourFerie) => {
    const { nom, date } = jourFerie;
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO jours_feries (nom, date) VALUES (?, ?)", [nom, date], 
        function (err) {
            if (err) return reject(err);
            
            resolve({
                id: this.lastID,
                nom,
                date,
            });
        });
    });
};

export const updateJourFerie = (id, jourFerie) => {
    const { nom, date } = jourFerie;
    return new Promise((resolve, reject) => {
        db.run("UPDATE jours_feries SET nom = ?, date = ? WHERE id = ?", [nom, date, id], 
        function (err) {
            if (err) return reject(err);
            
            resolve({
                id: this.lastID,
                nom,
                date,
                changes: this.changes,
            });
        });
    });
};

export const deleteJourFerie = (id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM jours_feries WHERE id = ?",[id], function(err) {
            if (err) return reject(err);
        
            resolve({
                id: Number(id),
                changes: this.changes,
            });
        });
    });
};

