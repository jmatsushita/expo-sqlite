import { NativeDatabase, SQLiteOpenOptions } from "./NativeDatabase";
import {
  NativeStatement,
  SQLiteAnyDatabase,
  SQLiteBindBlobParams,
  SQLiteBindPrimitiveParams,
  SQLiteColumnNames,
  SQLiteColumnValues,
  SQLiteRunResult,
} from "./NativeStatement";
import initWasm, { DB } from "@vlcn.io/crsqlite-wasm";

import { StmtAsync } from "@vlcn.io/xplat-api";

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

const CrSqliteDatabase = class CrSqliteDatabase implements NativeDatabase {
  #databaseName: string;
  #options?: SQLiteOpenOptions;
  #db?: DB;

  constructor(databaseName: string, options?: SQLiteOpenOptions) {
    this.#databaseName = databaseName;
    this.#options = options;
    console.log("NativeDatabase", databaseName, options);
  }

  //#region Asynchronous API

  public async initAsync(): Promise<void> {
    // const sqlite = await initWasm(() => wasmUrl);
    const sqlite = await initWasm((file) => {
      console.log("file", file);
      const wasmUrl = new URL(
        `./assets/?unstable_path=${encodeURIComponent(
          "./../../node_modules/@vlcn.io/crsqlite-wasm/dist/crsqlite.wasm"
        )}&platform=web"`,
        import.meta.url
      ).href;
      console.log("wasmUrl", wasmUrl);
      return wasmUrl;
    });

    this.#db = await sqlite.open(this.#databaseName);

    // debug
    const two = await this.#db.execA("SELECT 1 + 1 AS result");
    console.log("two", two[0]);
  }

  public isInTransactionAsync(): Promise<boolean> {
    throw new Error("Unimplemented");
  }

  public closeAsync(): Promise<void> {
    throw new Error("Unimplemented");
  }

  public execAsync(source: string): Promise<void> {
    return this.#db!.exec(source);
  }

  public async prepareAsync(
    nativeStatement: NativeStatement,
    source: string
  ): Promise<NativeStatement> {
    if (this.#db === undefined) throw new Error("Database not initialized");
    const stmt = await this.#db.prepare(source);
    const crSqliteStatement = new CrSqliteStatement(stmt);
    return crSqliteStatement;
  }

  //#endregion

  //#region Synchronous API

  public initSync(): void {
    throw new Error("Unimplemented");
  }
  public isInTransactionSync(): boolean {
    throw new Error("Unimplemented");
  }
  public closeSync(): void {
    throw new Error("Unimplemented");
  }
  public execSync(source: string): void {
    throw new Error("Unimplemented");
  }
  public prepareSync(
    nativeStatement: NativeStatement,
    source: string
  ): NativeStatement {
    throw new Error("Unimplemented");
  }

  //#endregion
};

const CrSqliteStatement = class CrSqliteStatement implements NativeStatement {
  isFinalized: Boolean = false;
  #stmt?: StmtAsync;

  constructor(stmt?: StmtAsync) {
    this.#stmt = stmt;
  }

  public async runAsync(
    database: SQLiteAnyDatabase,
    bindParams: SQLiteBindPrimitiveParams,
    bindBlobParams: SQLiteBindBlobParams,
    shouldPassAsArray: boolean
  ): Promise<SQLiteRunResult & { firstRowValues: SQLiteColumnValues }> {
    const res = this.#stmt?.get(database.nativeDatabase.tx, bindParams);
    console.log("this.#stmt", this.#stmt);
    console.log("res", res);
    return res;
  }
  public stepAsync(
    database: SQLiteAnyDatabase
  ): Promise<SQLiteColumnValues | null | undefined> {
    throw new Error("Unimplemented");
  }
  public getAllAsync(
    database: SQLiteAnyDatabase
  ): Promise<SQLiteColumnValues[]> {
    throw new Error("Unimplemented");
  }
  public resetAsync(database: SQLiteAnyDatabase): Promise<void> {
    throw new Error("Unimplemented");
  }
  public getColumnNamesAsync(): Promise<SQLiteColumnNames> {
    throw new Error("Unimplemented");
  }
  public async finalizeAsync(database: SQLiteAnyDatabase): Promise<void> {
    this.isFinalized = true;
    this.#stmt?.finalize(database.nativeDatabase);
    return;
  }

  //#endregion

  //#region Synchronous API

  public runSync(
    database: SQLiteAnyDatabase,
    bindParams: SQLiteBindPrimitiveParams,
    bindBlobParams: SQLiteBindBlobParams,
    shouldPassAsArray: boolean
  ): SQLiteRunResult & { firstRowValues: SQLiteColumnValues } {
    throw new Error("Unimplemented");
  }
  public stepSync(
    database: SQLiteAnyDatabase
  ): SQLiteColumnValues | null | undefined {
    throw new Error("Unimplemented");
  }
  public getAllSync(database: SQLiteAnyDatabase): SQLiteColumnValues[] {
    throw new Error("Unimplemented");
  }
  public resetSync(database: SQLiteAnyDatabase): void {
    throw new Error("Unimplemented");
  }
  public getColumnNamesSync(): string[] {
    throw new Error("Unimplemented");
  }
  public finalizeSync(database: SQLiteAnyDatabase): void {
    throw new Error("Unimplemented");
  }
};

export default {
  get name(): string {
    return "ExpoSQLiteNext";
  },

  NativeDatabase: CrSqliteDatabase,
  NativeStatement: CrSqliteStatement,

  async deleteDatabaseAsync(databaseName: string): Promise<void> {
    throw new Error("Unimplemented");
  },

  deleteDatabaseSync(databaseName: string): void {
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
