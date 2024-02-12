import { IDBBatchAtomicVFS } from "@vlcn.io/wa-sqlite/src/examples/IDBBatchAtomicVFS.js";
import SQLiteESMFactory from "@vlcn.io/wa-sqlite/dist/crsqlite.mjs";
import * as SQLite from "@vlcn.io/wa-sqlite";
import { Mutex } from "async-mutex";
const WaSqliteDatabase = class WaSqliteDatabase {
    #databaseName;
    #options;
    api;
    pointer; // database pointer
    cachedStatements = new Map();
    mutex = new Mutex();
    constructor(databaseName, options) {
        this.#databaseName = databaseName;
        this.#options = options;
    }
    //#region Asynchronous API
    async initAsync() {
        const module = await SQLiteESMFactory({
            locateFile(file) {
                return `/assets/?unstable_path=${encodeURIComponent(`./../../node_modules/@vlcn.io/wa-sqlite/dist/${file}`)}&platform=web"`;
            },
        });
        this.api = SQLite.Factory(module);
        this.api.vfs_register(new IDBBatchAtomicVFS("idb-batch-atomic", { durability: "relaxed" }));
        this.pointer = await this.api.open_v2(this.#databaseName);
        // debug
        // const two = await this.api.exec(this.pointer!, "SELECT 1 + 1 AS result");
        // console.log("two", two[0]);
    }
    isInTransactionAsync() {
        throw new Error("Unimplemented");
    }
    async closeAsync() {
        // try maybeThrowForClosedDatabase(db)
        if (this.pointer === undefined)
            throw new Error("Database not initialized");
        // for removedStatement in maybeRemoveAllCachedStatements(database: db) {
        //   sqlite3_finalize(removedStatement.pointer)
        // }
        // TODO cache statements
        // if db.openOptions.enableCRSQLite {
        //   sqlite3_exec(db.pointer, "SELECT crsql_finalize()", nil, nil, nil)
        // }
        if (this.#options?.enableCRSQLite) {
            const execRes = await this.api.exec(this.pointer, "SELECT crsql_finalize()");
        }
        for (const [stmt] of this.cachedStatements) {
            const results = await this.api.finalize(stmt);
            this.cachedStatements.delete(stmt);
        }
        // // yield to the js event loop
        // await new Promise((resolve) => setTimeout(resolve, 1000));
        // let ret = sqlite3_close(db.pointer)
        // db.isClosed = true
        const ret = await this.api.close(this.pointer);
        // TODO the native selft SQLiteModuleNext implements the following:
        //   Store unmanaged (SQLiteModuleNext, Database) pairs for sqlite callbacks,
        //   will release the pair when `closeDatabase` is called.
        //
        // if let index = contextPairs.firstIndex(where: {
        //   guard let pair = $0.takeUnretainedValue() as? (SQLiteModuleNext, NativeDatabase) else {
        //     return false
        //   }
        //   if pair.1.sharedObjectId != db.sharedObjectId {
        //     return false
        //   }
        //   $0.release()
        //   return true
        // }) {
        //   contextPairs.remove(at: index)
        // }
        // if ret != SQLITE_OK {
        //   throw SQLiteErrorException(convertSqlLiteErrorToString(db))
        // }
        if (ret !== SQLite.SQLITE_OK) {
            throw new Error(`Close failed with code ${ret}`);
        }
    }
    async execAsync(source) {
        const release = await this.mutex.acquire();
        await this.api.exec(this.pointer, source);
        release();
        return;
    }
    async prepareAsync(nativeStatement, source) {
        if (this.pointer === undefined)
            throw new Error("Database not initialized");
        if (nativeStatement.isFinalized)
            throw new Error("Statement is finalized");
        const release = await this.mutex.acquire();
        const db = this.pointer;
        const str = this.api.str_new(db, source);
        try {
            const sql = this.api.str_value(str);
            // yield to the js event loop
            // await new Promise((resolve) => setTimeout(resolve, 1000));
            const prepared = await this.api.prepare_v2(db, sql);
            if (prepared == null) {
                this.api.str_finish(str);
                throw new Error(`Could not prepare ${source}`);
            }
            // SQLiteDatabase doesn't use the returned statement and instead expects the input
            // nativeStatement to be mutated.
            nativeStatement.stmt = prepared.stmt;
            // workaround for getColumnNamesAsync not taking database argument unlike the other methods
            nativeStatement.database = this;
            // add to cache
            this.cachedStatements.set(prepared.stmt, nativeStatement);
        }
        catch (error) {
            throw error;
        }
        finally {
            this.api.str_finish(str);
        }
        release();
        return nativeStatement;
    }
    //#endregion
    //#region Synchronous API
    initSync() {
        throw new Error("Unimplemented");
    }
    isInTransactionSync() {
        throw new Error("Unimplemented");
    }
    closeSync() {
        this.closeAsync()
            .then(() => {
            return;
        })
            .catch((error) => {
            throw error;
        });
    }
    execSync(source) {
        this.execAsync(source)
            .then(() => {
            return;
        })
            .catch((error) => {
            throw error;
        });
    }
    prepareSync(nativeStatement, source) {
        throw new Error("Unimplemented");
    }
};
const WaSqliteStatement = class WaSqliteStatement {
    stmt;
    // workaround for getColumnNamesAsync not taking database argument unlike the other methods
    database;
    isFinalized = false;
    // #str: number; // pointer to sql
    // #stmt?: number;
    // constructor(str: number, stmt?: StmtAsync) {
    //   this.#str = str;
    //   this.#stmt = stmt;
    // }
    // #sql: string;
    // constructor(stmt?: number) {
    //   this.stmt = stmt;
    // }
    async runAsync(database, bindParams, bindBlobParams, shouldPassAsArray) {
        return await this.run(database, bindParams, bindBlobParams, shouldPassAsArray);
    }
    stepAsync(database) {
        return this.step(database);
    }
    async getAllAsync(database) {
        return this.getAll(database);
    }
    resetAsync(database) {
        throw new Error("Unimplemented");
    }
    // workaround for getColumnNamesAsync not taking database argument unlike the other methods
    async getColumnNamesAsync() {
        if (this.stmt === undefined)
            throw new Error("Statement not initialized");
        if (this.isFinalized)
            throw new Error("Statement is finalized");
        if (this.database?.api === undefined)
            throw new Error("Database not initialized");
        return this.database.api.column_names(this.stmt);
    }
    async finalizeAsync(database) {
        this.isFinalized = true;
        await database.api.finalize(this.stmt);
        // remove from cache
        database.cachedStatements.delete(this.stmt);
    }
    //#endregion
    //#region Synchronous API
    runSync(database, bindParams, bindBlobParams, shouldPassAsArray) {
        throw new Error("Unimplemented");
    }
    stepSync(database) {
        throw new Error("Unimplemented");
    }
    getAllSync(database) {
        throw new Error("Unimplemented");
    }
    resetSync(database) {
        throw new Error("Unimplemented");
    }
    getColumnNamesSync() {
        throw new Error("Unimplemented");
    }
    finalizeSync(database) {
        throw new Error("Unimplemented");
    }
    //#endregion
    async step(database) {
        // private func step(statement: NativeStatement, database: NativeDatabase) throws -> SQLiteColumnValues? {
        //   try maybeThrowForClosedDatabase(database)
        //   try maybeThrowForFinalizedStatement(statement)
        //   let ret = sqlite3_step(statement.pointer)
        //   if ret == SQLITE_ROW {
        //     return try getColumnValues(statement: statement)
        //   }
        //   if ret != SQLITE_DONE {
        //     throw SQLiteErrorException(convertSqlLiteErrorToString(database))
        //   }
        //   return nil
        // }
        if (database.api === undefined)
            throw new Error("Database not initialized");
        if (this.stmt === undefined)
            throw new Error("Statement not initialized");
        const ret = await database.api.step(this.stmt);
        if (ret === SQLite.SQLITE_ROW) {
            return await database.api.row(this.stmt);
        }
        else if (ret === SQLite.SQLITE_DONE) {
            return null;
        }
        throw new Error(`Step failed with code ${ret}`);
    }
    async getAll(database) {
        const release = await database.mutex.acquire();
        if (database.api === undefined)
            throw new Error("Database not initialized");
        if (this.stmt === undefined)
            throw new Error("Statement not initialized");
        let columnValuesList = [];
        while (true) {
            const ret = await database.api.step(this.stmt);
            if (ret === SQLite.SQLITE_ROW) {
                columnValuesList.push(database.api.row(this.stmt));
                continue;
            }
            else if (ret === SQLite.SQLITE_DONE) {
                break;
            }
            throw new Error(`Step failed with code ${ret}`);
        }
        release();
        return columnValuesList;
    }
    async run(database, bindParams, bindBlobParams, shouldPassAsArray) {
        const release = await database.mutex.acquire();
        // try maybeThrowForClosedDatabase(database)
        // try maybeThrowForFinalizedStatement(statement)
        // sqlite3_reset(statement.pointer)
        // sqlite3_clear_bindings(statement.pointer)
        database.api.reset(this.stmt);
        // for (key, param) in bindParams {
        //   let index = try getBindParamIndex(statement: statement, key: key, shouldPassAsArray: shouldPassAsArray)
        //   if index > 0 {
        //     try bindStatementParam(statement: statement, with: param, at: index)
        //   }
        // }
        // for (key, param) in bindBlobParams {
        //   let index = try getBindParamIndex(statement: statement, key: key, shouldPassAsArray: shouldPassAsArray)
        //   if index > 0 {
        //     try bindStatementParam(statement: statement, with: param, at: index)
        //   }
        // }
        for (const [index, value] of Object.entries(bindParams)) {
            this.bind(database, this.stmt, [value]);
        }
        // let ret = sqlite3_step(statement.pointer)
        let stepResult;
        try {
            stepResult = await database.api.step(this.stmt);
        }
        catch (error) {
            throw error;
        }
        // if ret != SQLITE_ROW && ret != SQLITE_DONE {
        //   throw SQLiteErrorException(convertSqlLiteErrorToString(database))
        // }
        // let firstRowValues: SQLiteColumnValues = (ret == SQLITE_ROW) ? try getColumnValues(statement: statement) : []
        // return [
        //   "lastInsertRowId": Int(sqlite3_last_insert_rowid(database.pointer)),
        //   "changes": Int(sqlite3_changes(database.pointer)),
        //   "firstRowValues": firstRowValues
        // ]
        if (stepResult !== SQLite.SQLITE_DONE && stepResult !== SQLite.SQLITE_ROW) {
            throw new Error(`Step failed with code ${stepResult}`);
        }
        const firstRowValues = stepResult === SQLite.SQLITE_ROW
            ? await database.api.row(this.stmt)
            : [];
        const changes = database.api.changes(database.pointer);
        // TODO Given that last_insert_rowid is not part of the api at this point we can
        // use module._sqlite3_last_insert_rowid(db) instead.
        // https://github.com/rhashimoto/wa-sqlite/discussions/151#discussioncomment-8233386
        // const lastInsertRowId = database.api!.last_insert_rowid(database.pointer!);
        release();
        return { lastInsertRowId: 0, changes, firstRowValues };
    }
    bind(database, stmt, values) {
        for (let i = 0; i < values.length; ++i) {
            const v = values[i];
            database.api.bind(stmt, i + 1, typeof v === "boolean" ? (v && 1) || 0 : v);
        }
    }
};
export default {
    get name() {
        return "ExpoSQLiteNext";
    },
    NativeDatabase: WaSqliteDatabase,
    NativeStatement: WaSqliteStatement,
    async deleteDatabaseAsync(databaseName) {
        throw new Error("Unimplemented");
    },
    deleteDatabaseSync(databaseName) {
        throw new Error("Unimplemented");
    },
    //#region EventEmitter implementations
    addListener() {
        throw new Error("Unimplemented");
    },
    removeListeners() {
        throw new Error("Unimplemented");
    },
    //#endregion
};
//# sourceMappingURL=ExpoSQLiteNext.js.map