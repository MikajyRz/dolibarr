import db from "../database/db.js";

const TABLES_TO_RESET = [
  "jours_feries",
];

const countTableRows = (tableName) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) AS count FROM ${tableName}`, [], (err, row) => {
      if (err) return reject(err);

      resolve({
        table: tableName,
        count: row?.count || 0,
      });
    });
  });
};

const deleteTableRows = (tableName) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${tableName}`, [], function (err) {
      if (err) return reject(err);

      resolve({
        table: tableName,
        deleted: this.changes || 0,
      });
    });
  });
};

const resetTableAutoIncrement = (tableName) => {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM sqlite_sequence WHERE name = ?",
      [tableName],
      function (err) {
        if (err) return reject(err);

        resolve(true);
      }
    );
  });
};

export const getSqliteResetPreview = async () => {
  const tables = [];

  for (const tableName of TABLES_TO_RESET) {
    const tableInfo = await countTableRows(tableName);
    tables.push(tableInfo);
  }

  const total = tables.reduce((sum, table) => {
    return sum + table.count;
  }, 0);

  return {
    total,
    tables,
  };
};

export const resetSqliteTables = async () => {
  const deletedTables = [];

  await new Promise((resolve, reject) => {
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  try {
    for (const tableName of TABLES_TO_RESET) {
      const deletedTable = await deleteTableRows(tableName);
      await resetTableAutoIncrement(tableName);
      deletedTables.push(deletedTable);
    }

    await new Promise((resolve, reject) => {
      db.run("COMMIT", (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const totalDeleted = deletedTables.reduce((sum, table) => {
      return sum + table.deleted;
    }, 0);

    return {
      totalDeleted,
      tables: deletedTables,
    };
  } catch (error) {
    await new Promise((resolve) => {
      db.run("ROLLBACK", () => resolve());
    });

    throw error;
  }
};