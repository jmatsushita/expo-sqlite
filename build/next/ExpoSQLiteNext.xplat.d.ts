import { SQLiteOpenOptions } from "./NativeDatabase";
import { NativeStatement, SQLiteBindBlobParams, SQLiteBindPrimitiveParams, SQLiteColumnNames, SQLiteColumnValues, SQLiteRunResult } from "./NativeStatement";
import { DB } from "@vlcn.io/crsqlite-wasm";
import { StmtAsync } from "@vlcn.io/xplat-api";
declare const _default: {
    readonly name: string;
    NativeDatabase: {
        new (databaseName: string, options?: SQLiteOpenOptions | undefined): {
            "__#6051@#databaseName": string;
            "__#6051@#options"?: SQLiteOpenOptions | undefined;
            "__#6051@#db"?: DB | undefined;
            initAsync(): Promise<void>;
            isInTransactionAsync(): Promise<boolean>;
            closeAsync(): Promise<void>;
            execAsync(source: string): Promise<void>;
            prepareAsync(nativeStatement: NativeStatement, source: string): Promise<NativeStatement>;
            initSync(): void;
            isInTransactionSync(): boolean;
            closeSync(): void;
            execSync(source: string): void;
            prepareSync(nativeStatement: NativeStatement, source: string): NativeStatement;
        };
    };
    NativeStatement: {
        new (stmt?: StmtAsync | undefined): {
            isFinalized: Boolean;
            "__#6052@#stmt"?: StmtAsync | undefined;
            runAsync(database: any, bindParams: SQLiteBindPrimitiveParams, bindBlobParams: SQLiteBindBlobParams, shouldPassAsArray: boolean): Promise<SQLiteRunResult & {
                firstRowValues: SQLiteColumnValues;
            }>;
            stepAsync(database: any): Promise<SQLiteColumnValues | null | undefined>;
            getAllAsync(database: any): Promise<SQLiteColumnValues[]>;
            resetAsync(database: any): Promise<void>;
            getColumnNamesAsync(): Promise<SQLiteColumnNames>;
            finalizeAsync(database: any): Promise<void>;
            runSync(database: any, bindParams: SQLiteBindPrimitiveParams, bindBlobParams: SQLiteBindBlobParams, shouldPassAsArray: boolean): SQLiteRunResult & {
                firstRowValues: SQLiteColumnValues;
            };
            stepSync(database: any): SQLiteColumnValues | null | undefined;
            getAllSync(database: any): SQLiteColumnValues[];
            resetSync(database: any): void;
            getColumnNamesSync(): string[];
            finalizeSync(database: any): void;
        };
    };
    deleteDatabaseAsync(databaseName: string): Promise<void>;
    deleteDatabaseSync(databaseName: string): void;
    addListener(): never;
    removeListeners(): never;
};
export default _default;
//# sourceMappingURL=ExpoSQLiteNext.xplat.d.ts.map