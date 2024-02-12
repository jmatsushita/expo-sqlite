import initWasm from "@vlcn.io/crsqlite-wasm";
// const stmtAsyncToNativeStatement = async ({
//   run,
//   get,
//   all,
//   iterate,
//   raw,
//   bind,
//   finalize,
// }: StmtAsync): Promise<NativeStatement> => ({
//   runAsync: run,
//   stepAsync: iterate,
//   getAllAsync: all,
//   resetAsync: () => Promise.resolve(),
//   getColumnNamesAsync: () => Promise.resolve([]),
//   finalizeAsync: finalize,
// });
const CrSqliteDatabase = class CrSqliteDatabase {
    #databaseName;
    #options;
    #db;
    constructor(databaseName, options) {
        this.#databaseName = databaseName;
        this.#options = options;
        console.log("NativeDatabase", databaseName, options);
    }
    //#region Asynchronous API
    async initAsync() {
        // const sqlite = await initWasm(() => wasmUrl);
        const sqlite = await initWasm((file) => {
            console.log("file", file);
            const wasmUrl = new URL(`./assets/?unstable_path=${encodeURIComponent("./../../node_modules/@vlcn.io/crsqlite-wasm/dist/crsqlite.wasm")}&platform=web"`, import.meta.url).href;
            console.log("wasmUrl", wasmUrl);
            return wasmUrl;
        });
        this.#db = await sqlite.open(this.#databaseName);
        // debug
        const two = await this.#db.execA("SELECT 1 + 1 AS result");
        console.log("two", two[0]);
    }
    isInTransactionAsync() {
        throw new Error("Unimplemented");
    }
    closeAsync() {
        throw new Error("Unimplemented");
    }
    execAsync(source) {
        return this.#db.exec(source);
    }
    async prepareAsync(nativeStatement, source) {
        if (this.#db === undefined)
            throw new Error("Database not initialized");
        const stmt = await this.#db.prepare(source);
        const crSqliteStatement = new CrSqliteStatement(stmt);
        return crSqliteStatement;
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
        throw new Error("Unimplemented");
    }
    execSync(source) {
        throw new Error("Unimplemented");
    }
    prepareSync(nativeStatement, source) {
        throw new Error("Unimplemented");
    }
};
const CrSqliteStatement = class CrSqliteStatement {
    isFinalized = false;
    #stmt;
    constructor(stmt) {
        this.#stmt = stmt;
    }
    async runAsync(database, bindParams, bindBlobParams, shouldPassAsArray) {
        const res = this.#stmt?.get(database.nativeDatabase.tx, bindParams);
        console.log("this.#stmt", this.#stmt);
        console.log("res", res);
        return res;
    }
    stepAsync(database) {
        throw new Error("Unimplemented");
    }
    getAllAsync(database) {
        throw new Error("Unimplemented");
    }
    resetAsync(database) {
        throw new Error("Unimplemented");
    }
    getColumnNamesAsync() {
        throw new Error("Unimplemented");
    }
    async finalizeAsync(database) {
        this.isFinalized = true;
        this.#stmt?.finalize(database.nativeDatabase);
        return;
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
};
export default {
    get name() {
        return "ExpoSQLiteNext";
    },
    NativeDatabase: CrSqliteDatabase,
    NativeStatement: CrSqliteStatement,
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
//# sourceMappingURL=ExpoSQLiteNext.xplat.js.map