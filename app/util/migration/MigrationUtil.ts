import {Injectable} from "@angular/core";

import {Migration} from "./Migration";
import {MigrationProvider} from "./MigrationProvider";
import {SchemaVersion} from "../../dao/schema-version/SchemaVersion";
import {SchemaVersionDao} from "../../dao/schema-version/SchemaVersionDao";

@Injectable()
export class MigrationUtil{
    constructor(private migrationProvider:MigrationProvider, private schemaVersionDao:SchemaVersionDao){
        this.migrationProvider = migrationProvider;
        this.schemaVersionDao = schemaVersionDao;
    }

    getOrCreateSchemaVersion():Promise<SchemaVersion>{
        return this.schemaVersionDao.createTableIfDoesntExist().then(() => {
            return this.schemaVersionDao.getAll();
        }).then(schemaVersions => {
           if ( schemaVersions && schemaVersions.length > 0 ){
               return schemaVersions[0];
           }
           let schemaVersion = new SchemaVersion();
           schemaVersion.version = 0;
           return this.schemaVersionDao.save(schemaVersion);
        });
    }

    executeMigrations(){
        return this.getOrCreateSchemaVersion().then(schemaVersion => {
            let migrationsToExecute = this.migrationProvider.getMigrations();
            return this.executeMigrationsInternal(schemaVersion, migrationsToExecute);
        });
    }

    private executeMigrationsInternal(schemaVersion:SchemaVersion, migrations:Migration[]):Promise<any>{
        if ( migrations.length > 0 ){
            let migration = migrations[0];
            if ( migration.getVersion() > schemaVersion.version ){
                // run the migration
                return migration.migrate().then(() => {
                    schemaVersion.version++;
                    return this.schemaVersionDao.save(schemaVersion);
                }).then(() => {
                   let remainingMigrations = migrations.concat();
                   remainingMigrations.shift();
                   return this.executeMigrationsInternal(schemaVersion, remainingMigrations);
                });
            }
            else{
                let remainingMigrations = migrations.concat();
                remainingMigrations.shift();
                return this.executeMigrationsInternal(schemaVersion, remainingMigrations);
            }
        }
        else{
            return Promise.resolve();
        }
    }
}
