package com.liquid;

import static com.liquid.event.forwardEvent;
import static com.liquid.utility.searchProperty;
import static com.liquid.workspace.check_database_definition;
import com.liquid.metadata.ForeignKey;

import java.beans.IntrospectionException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;

import java.sql.*;
import java.text.DateFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javassist.ClassPool;
import javassist.CtClass;
import javassist.NotFoundException;
import javax.servlet.http.HttpSession;


// Note : for big resultset : use the pagination
// Note : compute long time : use the pagination and ids cache
// Note : cahe is set by the client siide, may be : 0=disabled, 1=enabled, 2=auto (maxQueryTimeMs)

// TODO : Get row data from client (static content) even from DB
// TODO : set dei parametri nella prepare statement
// TODO : Cursore nel DB aperto per non leggere le modifiche concorrenti
// TODO : Delete cascade
// FATTO : Gestione ciclo vita della cache
// FATTO : Prefiltri in sessione, con accesso serializzato per accessi simultanei dallo stesso dominio
// N.B.: Protocollo JSON :
//        nella risposta JSON il caratere "->\" è a carico del server, e di conseguenza \->\\


public class db {
    
    static long TIME_MSEC_LIMIT_FOR_WARNING = 1000;

    static public long maxIdsCacheAge = 3 * 60 * 1000;

    static long maxQueryTimeMs = 1000;


    static public class IdsCache {

        public String query;
        public ArrayList<Long> ids = new ArrayList<>();
        public long lastAccessTime = 0;
        public long startRow = 0;

        static public ArrayList<Long> getIds(String query) {
            long cTime = System.currentTimeMillis();
            for (IdsCache idsCache : glIdsCaches) {
                if (idsCache.query != null) {
                    if (idsCache.query.equalsIgnoreCase(query)) {
                        idsCache.lastAccessTime = cTime;
                        return idsCache.ids;
                    } else {
                        if (cTime - idsCache.lastAccessTime > maxIdsCacheAge) {
                            idsCache.ids = null;
                            idsCache.query = null;
                            idsCache.lastAccessTime = 0;
                        }
                    }
                }
            }
            return null;
        }

        static public long getStartRow(String query) {
            for (IdsCache idsCache : glIdsCaches) {
                if (idsCache.query != null) {
                    if (idsCache.query.equalsIgnoreCase(query)) {
                        return idsCache.startRow;
                    }
                }
            }
            return 0;
        }

        static public boolean addIdsCache(String query, ArrayList<Long> newIds, long startRow) {
            if (query != null) {
                int i = 0, freeIndex1B = 0;
                for (IdsCache idsCache : glIdsCaches) {
                    if (idsCache.query != null) {
                        if (idsCache.query.equalsIgnoreCase(query)) {
                            idsCache.ids = newIds;
                            idsCache.startRow = startRow;
                            return true;
                        }
                    } else {
                        freeIndex1B = i + 1;
                    }
                    i++;
                }
                IdsCache idsCache = new IdsCache();
                if (idsCache != null) {
                    idsCache.query = query;
                    idsCache.ids = newIds;
                    idsCache.startRow = startRow;
                    if (freeIndex1B > 0) {
                        glIdsCaches.set(freeIndex1B - 1, idsCache);
                    } else {
                        glIdsCaches.add(idsCache);
                    }
                    return true;
                } else {
                    return false;
                }
            }
            return false;
        }
    }

    static public class LeftJoinMap {

        String key;
        String alias;
        String foreignTable;

        LeftJoinMap(String key, String alias, String foreignTable) {
            this.key = key;
            this.alias = alias;
            this.foreignTable = foreignTable;
        }

        static public boolean getByKey(ArrayList<LeftJoinMap> list, String key) {
            if (list != null) {
                for (LeftJoinMap item : list) {
                    if (item.key.equalsIgnoreCase(key)) {
                        return true;
                    }
                }
            }
            return false;
        }

        static public String getAlias(ArrayList<LeftJoinMap> list, String foreignTable) {
            if (list != null) {
                for (LeftJoinMap item : list) {
                    if (item.foreignTable.equalsIgnoreCase(foreignTable)) {
                        return item.alias;
                    }
                }
            }
            return null;
        }
    }

    static public ArrayList<IdsCache> glIdsCaches = new ArrayList<IdsCache>();

    static public String get_page_html_from_layout(String layoutJson, HttpServletRequest request, JspWriter out) {
        String out_string = "";
        return out_string;
    }

    static public String getColumnAlias(String colName, int aliasIndex, int columnMaxLength) {
        String columnName = colName.replaceAll("\\.", "_").replaceAll("[( )]", "");
        if (columnMaxLength > 3) {
            if (columnName.length() >= columnMaxLength - 2) { // A_[XXXXXX]999
                columnName = columnName.substring(0, columnMaxLength - 5);
                columnName += aliasIndex;
            }
        }
        return columnName;
    }

    static public String get_table_recordset(HttpServletRequest request, JspWriter out) {
        try {
            ParamsUtil.get_recordset_params recordset_params = new ParamsUtil().new get_recordset_params(request);
            return get_table_recordset(recordset_params, out);
        } catch (Exception e) {
        }
        return null;
    }

    static public String get_table_recordset(String controlId, String sRequest, boolean bSaveQueryInfo, long maxRows, JspWriter out) {
        try {
            ParamsUtil.get_recordset_params recordset_params = new ParamsUtil().new get_recordset_params(controlId, sRequest, bSaveQueryInfo, maxRows);
            return get_table_recordset(recordset_params, out);
        } catch (Exception e) {
        }
        return null;
    }

    /**
     * Main service : read recordset from a control
     * 
     * @param recordset_params a bean of the parameters (filters / sort / service ...)
     * @param out where to write 
     * @return the json of the resultset
     */
    static public String get_table_recordset(ParamsUtil.get_recordset_params recordset_params, JspWriter out) {
        Connection conn = null, connToDB = null, connToUse = null;
        String executingQuery = null, executingQueryForCache = null;
        String countQuery = null;
        String out_string = "", out_values_string = "", out_codes_string = "", error = "", warning = "", message = "", title = "";
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        long cRow = 0, nRows = 0;
        ArrayList<Long> ids = null;
        boolean bStoreIds = false;
        JSONArray filtersIds = null;

        long startRow = recordset_params.startRow, endRow = recordset_params.endRow, pageStart = recordset_params.pageStart, pageSize = recordset_params.pageSize, cacheIds = recordset_params.cacheIds;
        String applicationRoot = recordset_params.applicationRoot;
        String controlId = recordset_params.controlId, tblWrk = recordset_params.tblWrk, columnsResolved = recordset_params.columnsResolved;
        String targetDatabase = recordset_params.targetDatabase, targetSchema = recordset_params.targetSchema, targetTable = recordset_params.targetTable;
        String targetView = null, targetColumn = recordset_params.targetColumn, targetMode = recordset_params.targetMode, idColumn = recordset_params.idColumn;
        JSONObject requestJson = recordset_params.requestJson;
        JSONArray queryParams = null;

        int targetColumnIndex = 0, aliasIndex = 1, columnMaxLength = 0;
        boolean isCrossTableService = false;
        boolean needLeftJoinMap = false;
        long lStartTime = 0, lQueryTime = 0, lRetrieveTime = 0;

        // New columns definition, for queryX mode
        String newColsJson = null;
        long time4 = 0, time3 = 0, time2 = 0, time1 = 0, time0 = 0;

        try {

            time4 = time3 = time2 = time1 = time0 = System.currentTimeMillis();

            // Richiesta colonna o tabella.colonna specifica
            if (targetColumn != null) {
                isCrossTableService = true;
            }

            if (isCrossTableService && "distinct".equalsIgnoreCase(targetMode)) {
                needLeftJoinMap = true;
            }

            if (isCrossTableService) {
                out_string = "";
            } else {
                out_string += "{\"resultSet\":[";
            }

            String query = "";
            String token = "";
            String table = "";
            String view = "";
            String database = "";
            String schema = "";
            String primaryKey = "id";
            String dbPrimaryKey = "id";
            int indexPrimaryKey = 0;
            int iTypePrimaryKey = 0;
            String typePrimaryKey = null;
            String column_list = "";
            String column_alias_list = "";
            String column_json_list = "";
            String leftJoinList = "";
            String column_alias = null;
            ArrayList<ForeignKey> foreignKeys = null;
            ArrayList<LeftJoinMap> leftJoinsMap = new ArrayList<LeftJoinMap>();
            workspace tbl_wrk = workspace.get_tbl_manager_workspace(tblWrk != null ? tblWrk : controlId);
            String tblWrkDesc = (tblWrk != null ? tblWrk + "." : "") + (controlId != null ? controlId : "");
            boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;

            if (tbl_wrk != null) {
                try {
                    // Connessione al DB ( da predefinita, da JSON o da sessione )
                    conn = connection.getConnection(null, recordset_params.request, tbl_wrk.tableJson);
                    if (conn == null) {
                        String err = "null DB connect on controlId:" + controlId;
                        System.out.println("// LIQUID ERROR : " + err);
                        return "{\"error\":\"" + utility.base64Encode(err) + "\"}";
                    }
                } catch (Throwable th) {
                    final Throwable cause = th.getCause();
                    error = th.getCause().getLocalizedMessage() + "(" + th.getMessage() + ")";
                    String err = "connect error : " + error + ", on controlId:" + controlId;
                    System.out.println("// LIQUID ERROR : " + err);
                    return "{\"error\":\"" + utility.base64Encode(err) + "\"}";
                }
            } else {
                return "{\"error\":\"" + utility.base64Encode("controlId:" + controlId + " not found") + "\"}";
            }


       
            String itemIdString = "\"", tableIdString = "\"", asKeyword = " AS ";
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("postgres.")) || tbl_wrk.dbProductName.toLowerCase().contains("postgres")) {
                isPostgres = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mysql.")) || tbl_wrk.dbProductName.toLowerCase().contains("mysql")) {
                isMySQL = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mariadb.")) || tbl_wrk.dbProductName.toLowerCase().contains("mariadb")) {
                isMySQL = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("oracle.")) || (tbl_wrk.dbProductName != null && tbl_wrk.dbProductName.toLowerCase().contains("oracle"))) {
                isOracle = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("sqlserver.")) || (tbl_wrk.dbProductName != null && tbl_wrk.dbProductName.toLowerCase().contains("sqlserver"))) {
                isSqlServer = true;
            }

            if (isOracle) {
                columnMaxLength = 30;
            }

            if (isMySQL) {
                itemIdString = "`";
                tableIdString = "";
            } else {
                itemIdString = "\"";
                tableIdString = "\"";
            }

            if (isOracle) {
                asKeyword = " ";
            }

            if (tbl_wrk != null && tbl_wrk.tableJson != null) {
                JSONArray cols = null;

                tbl_wrk.nConnections++;
                
                // add the session if not found
                tbl_wrk.addSession(ThreadSession.getThreadSessionInfo());

                try {
                    database = tbl_wrk.tableJson.getString("database");
                } catch (Exception e) {
                }
                try {
                    schema = tbl_wrk.tableJson.getString("schema");
                } catch (Exception e) {
                }
                try {
                    table = tbl_wrk.tableJson.getString("table");
                } catch (Exception e) {
                }
                try {
                    view = tbl_wrk.tableJson.getString("view");
                } catch (Exception e) {
                }
                try {
                    cols = tbl_wrk.tableJson.getJSONArray("columns");
                } catch (Exception e) {
                }
                try {
                    primaryKey = tbl_wrk.tableJson.getString("primaryKey");
                } catch (Exception e) {
                }
                try {
                    query = tbl_wrk.tableJson.getString("query");
                    if(query != null) {
                        query = utility.base64Decode(query);
                    }
                } catch (Exception e) {
                }
                try {
                    token = tbl_wrk.tableJson.getString("token");
                } catch (Exception e) {
                }

                // set the connection
                connToUse = conn;
                if (database == null || database.isEmpty()) {
                    database = conn.getCatalog();
                } else {
                    conn.setCatalog(database);
                    String db = conn.getCatalog();
                    if (!db.equalsIgnoreCase(database)) {
                        // set catalog not supported : connect to different DB
                        conn.close();
                        conn = null;
                        connToUse = connToDB = connection.getDBConnection(database);
                    }
                }
                
                time1 = System.currentTimeMillis();

                // Controllo definizione database / database richiesto
                if (!check_database_definition(connToUse, database)) {
                    String warn = "database defined by driver :" + connToUse.getCatalog() + " requesting database:" + database;
                    System.out.println("LIQUID WARNING : " + warn);
                    warning += "[" + warn + "]\n";
                }

                // System calls
                String isSystemLiquid = workspace.isSystemLiquid(tbl_wrk.tableJson);
                boolean bUserFieldIdentificator = true;

                try {
                    targetDatabase = tbl_wrk.tableJson.getString("selectDatabases");
                } catch (Exception e) {
                }
                try {
                    targetSchema = tbl_wrk.tableJson.getString("selectSchemas");
                } catch (Exception e) {
                }
                try {
                    targetTable = tbl_wrk.tableJson.getString("selectTables");
                } catch (Exception e) {
                }
                try {
                    targetView = tbl_wrk.tableJson.getString("selectViews");
                } catch (Exception e) {
                }

                // Gestione chiamata dal servizio "editor" sulla cella
                if ("allDatabase".equalsIgnoreCase(targetMode) || "allDatabases".equalsIgnoreCase(targetMode)) {
                    isSystemLiquid = "selectDatabases";
                    bUserFieldIdentificator = false;
                } else if ("allSchema".equalsIgnoreCase(targetMode) || "allSchemas".equalsIgnoreCase(targetMode)) {
                    isSystemLiquid = "selectSchemas";
                    bUserFieldIdentificator = false;
                } else if ("allTable".equalsIgnoreCase(targetMode) || "allTables".equalsIgnoreCase(targetMode)) {
                    isSystemLiquid = "selectTables";
                    bUserFieldIdentificator = false;
                } else if ("allColumns".equalsIgnoreCase(targetMode) || "allColumns".equalsIgnoreCase(targetMode)) {
                    isSystemLiquid = "selectColumns";
                    bUserFieldIdentificator = false;
                }

                if (query != null && !query.isEmpty()) {
                    int lb = 1;
                }

                if (isSystemLiquid != null) {

                    if ("selectDatabases".equalsIgnoreCase(isSystemLiquid)) {
                        Object[] result = metadata.getAllDatabases(targetDatabase, connToUse, bUserFieldIdentificator);
                        out_string = "{\"resultSet\":" + result[0];
                        out_string += ",\"startRow\":" + "0";
                        out_string += ",\"endRow\":" + result[1];
                        out_string += ",\"nRows\":" + result[1];
                        out_string += "}";
                        return out_string;
                    } else if ("selectSchemas".equalsIgnoreCase(isSystemLiquid)) {
                        Object[] result = metadata.getAllSchemas(targetDatabase != null ? targetDatabase : database, targetSchema != null ? targetSchema : schema, connToUse, bUserFieldIdentificator);
                        out_string = "{\"resultSet\":" + result[0];
                        out_string += ",\"startRow\":" + "0";
                        out_string += ",\"endRow\":" + result[1];
                        out_string += ",\"nRows\":" + result[1];
                        out_string += "}";
                        return out_string;
                    } else if ("selectTables".equalsIgnoreCase(isSystemLiquid) || "selectViews".equalsIgnoreCase(isSystemLiquid)) {
                        Object[] result = metadata.getAllTables(targetDatabase != null ? targetDatabase : database, targetSchema != null ? targetSchema : schema, targetTable, targetView, connToUse, bUserFieldIdentificator);
                        out_string = "{\"resultSet\":" + result[0];
                        out_string += ",\"startRow\":" + "0";
                        out_string += ",\"endRow\":" + result[1];
                        out_string += ",\"nRows\":" + result[1];
                        out_string += "}";
                        return out_string;
                    } else if ("selectColumns".equalsIgnoreCase(isSystemLiquid)) {
                        if (targetTable != null && !targetTable.isEmpty()) {
                            Object[] result = metadata.getAllColumns(targetDatabase != null ? targetDatabase : database, targetSchema != null ? targetSchema : schema, targetTable, connToUse, bUserFieldIdentificator);
                            out_string = "{\"resultSet\":" + result[0];
                            out_string += ",\"startRow\":" + "0";
                            out_string += ",\"endRow\":" + result[1];
                            out_string += ",\"nRows\":" + result[1];
                            out_string += "}";
                        } else {
                            out_string = "{\"error\":\"" + utility.base64Encode("You should define a table before select columns") + "\"}";
                        }
                        return out_string;
                    } else if ("selectForeignKeys".equalsIgnoreCase(isSystemLiquid)) {
                        if (targetTable != null && !targetTable.isEmpty()) {
                            Object[] result = metadata.getAllForeignKeys(targetDatabase != null ? targetDatabase : database, targetSchema != null ? targetSchema : schema, targetTable, connToUse, bUserFieldIdentificator);
                            out_string = "{\"resultSet\":" + result[0];
                            out_string += ",\"startRow\":" + "0";
                            out_string += ",\"endRow\":" + result[1];
                            out_string += ",\"nRows\":" + result[1];
                            out_string += "}";
                        } else {
                            out_string = "{\"error\":\"" + utility.base64Encode("You should define a table before select foreign keys") + "\"}";
                        }
                        return out_string;
                    }
                    return null;
                }

                try {

                    // Verifica tel token : almeno un controllo deve avere il token assegnato (foreign table, lockup etc hanno il token ereditato
                    if (!workspace.isTokenValid(token)) {
                        System.out.println("// LIQUID ERROR : Invalid Token on controlId:" + controlId);
                        return "{\"error\":\"" + utility.base64Encode("Error: invalid token on :" + controlId) + "\"}";
                    }

                    dbPrimaryKey = "A_" + primaryKey;

                    if (schema == null || schema.isEmpty()) {
                        schema = tbl_wrk.defaultSchema;
                    }

                    // compute table coords
                    workspace.setDatabaseShemaTable(tbl_wrk);

                    // N.B. targetDatabase, targetSchema, targetTable sono validi solo per le chiamate di sistema
                    //  La definizione è fatta nel file .json è non può essere modificata dal client
                    if (targetDatabase != null && !targetDatabase.isEmpty()) {
                        if (!targetDatabase.equalsIgnoreCase(database)) {
                            System.err.println("// ERROR: cannot access to database outside its definition:" + targetDatabase + "");
                        }
                    }
                    if (targetSchema != null && !targetSchema.isEmpty()) {
                        if (!targetSchema.equalsIgnoreCase(schema)) {
                            System.err.println("// ERROR: cannot access to schema outside its definition:" + database + "." + targetSchema + "");
                        }
                    }
                    if (targetTable != null && !targetTable.isEmpty()) {
                        if (!targetTable.equalsIgnoreCase(table)) {
                            System.err.println("// ERROR: cannot access to table outside its definition:" + database + "." + schema + "." + targetTable + "");
                        }
                    }

                    foreignKeys = metadata.getForeignKeyData(database, schema, table, connToUse);

                    if (cols != null) {
                        for (int ic = 0; ic < cols.length(); ic++) {
                            JSONObject col = cols.getJSONObject(ic);
                            String colName = null, colQuery = null, colMode = (targetMode != null ? targetMode + " " : "");

                            String foreignTable = null;
                            ArrayList<String> foreignColumns = new ArrayList<String>();
                            ArrayList<String> columns = new ArrayList<String>();
                            int foreignIndex = -1;

                            try {
                                colName = col.getString("name");
                            } catch (Exception e) {
                                colName = null;
                            }
                            try {
                                foreignTable = col.getString("foreignTable");
                            } catch (Exception e) {
                                foreignTable = null;
                            }
                            try {
                                String fcolumnsKey = null;
                                if (col.has("foreignColumns")) {
                                    fcolumnsKey = "foreignColumns";
                                } else if (col.has("foreignColumn")) {
                                    fcolumnsKey = "foreignColumn";
                                }
                                if(fcolumnsKey != null) {
                                    JSONArray json_foreign_columns = null;
                                    try {
                                        json_foreign_columns = col.getJSONArray(fcolumnsKey);
                                    } catch (Exception e) {
                                    }
                                    if (json_foreign_columns != null) {
                                        for (int ia = 0; ia < json_foreign_columns.length(); ia++) {
                                            foreignColumns.add(json_foreign_columns.getString(ia));
                                        }
                                    } else {
                                        foreignColumns.add(col.getString(fcolumnsKey));
                                    }
                                }
                            } catch (Exception e) {
                                foreignColumns = null;
                            }

                            try {
                                colQuery = col.getString("query");
                            } catch (Exception e) {
                                colQuery = null;
                            }
                            
                            
                            try {
                                String columnsKey = null;
                                if (col.has("columns")) {
                                    columnsKey = "columns";
                                } else if (col.has("column")) {
                                    columnsKey = "column";
                                }
                                if(columnsKey != null) {
                                    JSONArray json_columns = null;
                                    try {
                                        json_columns = col.getJSONArray(columnsKey);
                                    } catch (Exception e) {
                                    }
                                    if (json_columns != null) {
                                        for (int ia = 0; ia < json_columns.length(); ia++) {
                                            foreignColumns.add(json_columns.getString(ia));
                                        }
                                    } else {
                                        columns.add(col.getString(columnsKey));
                                    }
                                }
                            } catch (Exception e) {
                                columns = null;
                            }

                            
                            
                            if (colName.indexOf(".") >= colName.length() - 1) {
                                error += " [ Control:" + tbl_wrk.controlId + " Column: " + col.getString("name") + " Unsupported column name]";
                                colName = null;
                            }
                            

                            if (colName != null) {
                                String[] colParts = colName.split("\\.");
                                String checkingColumn = (colParts.length > 1 ? colParts[1] : colName);
                                String checkingTable = (colParts.length > 1 ? colParts[0] : foreignTable);
                                boolean bAddColumnToList = false;

                                if(colQuery != null && !colQuery.isEmpty()) {
                                    // TODO: test                                    
                                    String columnName = getColumnAlias(col.getString("name"), aliasIndex, columnMaxLength);
                                    aliasIndex++;
                                    column_alias = /*table*/ "X_" + columnName;
                                    column_json_list += columnName;
                                    column_list += colMode + " ( "+ colQuery + " ) " + asKeyword + column_alias;
                                    
                                } else {
                                    if (targetColumn == null || colName.equalsIgnoreCase(targetColumn) || checkingColumn.equalsIgnoreCase(targetColumn) || checkingColumn.equalsIgnoreCase(idColumn)
                                            && (checkingTable.equalsIgnoreCase(targetTable) || targetTable == null)) {
                                        bAddColumnToList = true;
                                    }

                                    if (bAddColumnToList || needLeftJoinMap) {

                                        if (column_list.length() > 0) {
                                            colMode = "";
                                        }

                                        if (colParts.length > 1) {
                                            // campo esterno ?
                                            if (!colParts[0].equalsIgnoreCase(table)) {
                                                if (foreignIndex < 0) {
                                                    if (foreignTable != null && foreignColumns != null && columns != null) {
                                                        for (int ifk = 0; ifk < foreignKeys.size(); ifk++) {
                                                            ForeignKey foreignKey = foreignKeys.get(ifk);
                                                            if (foreignKey != null) {
                                                                if (foreignKey.foreignTable.equalsIgnoreCase(foreignTable)) {
                                                                    if (utility.compare_array(foreignKey.foreignColumns, foreignColumns)) {
                                                                        if (utility.compare_array(foreignKey.columns, columns)) {
                                                                            foreignIndex = ifk;
                                                                            break;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        if (foreignIndex < 0) {
                                                            foreignIndex = foreignKeys.size();
                                                            foreignKeys.add(new ForeignKey(foreignTable, foreignColumns, columns, null));
                                                        }
                                                    }
                                                }
                                                if (foreignKeys != null) {
                                                    if (foreignTable == null || foreignColumns == null || columns == null) {
                                                        // gia' controllato da workspace : se non risolto è una condizioni di errore
                                                        error += " [ Control:" + tbl_wrk.controlId + " Column : " + col.getString("name") + " unresolved link : please define foreignKey in Database or in json..]";
                                                    }
                                                }
                                            }
                                        }
                                        if (foreignTable != null) {
                                            String leftJoinKey = foreignTable + "_" + utility.arrayToString(foreignColumns, null, null, ",") + "_" + utility.arrayToString(columns, null, null, ",");
                                            String leftJoinAlias = ("B" + String.valueOf(foreignIndex + 1));
                                            /*foreignTable+"_"+(leftJoinsMap.size()+1)*/
                                            if (!LeftJoinMap.getByKey(leftJoinsMap, leftJoinKey)) {
                                                if (leftJoinList.length() > 0) {
                                                    leftJoinList += "\n";
                                                }
                                                int foreignColumnsSize = foreignColumns.size();
                                                int columnsSize = columns.size();
                                                for (int ilj = 0; ilj < Math.max(foreignColumnsSize, columnsSize); ilj++) {
                                                    String foreignColumn = (ilj < foreignColumnsSize ? foreignColumns.get(ilj) : foreignColumns.get(foreignColumnsSize - 1));
                                                    String column = (ilj < columnsSize ? columns.get(ilj) : columns.get(columnsSize - 1));
                                                    if (ilj == 0) {
                                                        leftJoinList += "LEFT JOIN "
                                                                + (schema != null && !schema.isEmpty() ? (tableIdString + schema + tableIdString + ".") : "")
                                                                + (tableIdString + foreignTable + tableIdString) + asKeyword + leftJoinAlias
                                                                + " ON "
                                                                + leftJoinAlias + "." + (tableIdString + foreignColumn + tableIdString)
                                                                + "="
                                                                + table + "." + (tableIdString + column + tableIdString);
                                                        leftJoinsMap.add(new LeftJoinMap(leftJoinKey, leftJoinAlias, foreignTable));
                                                    } else {
                                                        leftJoinList += " AND "
                                                                + (schema != null && !schema.isEmpty() ? (tableIdString + schema + tableIdString + ".") : "")
                                                                + (tableIdString + foreignTable + tableIdString) + asKeyword + leftJoinAlias
                                                                + " ON "
                                                                + leftJoinAlias + "." + (tableIdString + foreignColumn + tableIdString)
                                                                + "="
                                                                + table + "." + (tableIdString + column + tableIdString);
                                                    }
                                                }
                                            }

                                            if (bAddColumnToList) {
                                                if (column_list.length() > 0) {
                                                    column_list += ",";
                                                }
                                                if (column_json_list.length() > 0) {
                                                    column_json_list += ",";
                                                }
                                                if (colParts.length > 1) {
                                                    String columnName = getColumnAlias(colParts[1], aliasIndex, columnMaxLength);
                                                    aliasIndex++;
                                                    column_alias = leftJoinAlias + "_" + columnName;
                                                    column_json_list += colParts[0] + "_" + columnName;
                                                    column_list += colMode + leftJoinAlias + "." + itemIdString + colParts[1] + itemIdString + asKeyword + column_alias;
                                                } else {
                                                    String columnName = getColumnAlias(col.getString("name"), aliasIndex, columnMaxLength);
                                                    aliasIndex++;
                                                    column_alias = leftJoinAlias + "_" + columnName;
                                                    column_json_list += columnName;
                                                    column_list += colMode + leftJoinAlias + "." + itemIdString + col.getString("name") + itemIdString + asKeyword + column_alias;
                                                }
                                            }

                                        } else {
                                            if (bAddColumnToList) {
                                                if (column_list.length() > 0) {
                                                    column_list += ",";
                                                }
                                                if (column_json_list.length() > 0) {
                                                    column_json_list += ",";
                                                }
                                                if (colParts.length > 1) {
                                                    String columnName = getColumnAlias(colParts[1], aliasIndex, columnMaxLength);
                                                    aliasIndex++;
                                                    column_alias = "A" + "_" + columnName;
                                                    column_json_list += colParts[0] + "_" + columnName;
                                                    column_list += colMode + colParts[0] + "." + itemIdString + colParts[1] + itemIdString + asKeyword + column_alias;
                                                } else {
                                                    String columnName = getColumnAlias(col.getString("name"), aliasIndex, columnMaxLength);
                                                    aliasIndex++;
                                                    column_alias = /*table*/ "A_" + columnName;
                                                    column_json_list += columnName;
                                                    column_list += colMode + itemIdString + table + itemIdString + "." + itemIdString + col.getString("name") + itemIdString + asKeyword + column_alias;
                                                }
                                            }

                                            if (primaryKey.equalsIgnoreCase(col.getString("name"))) {
                                                indexPrimaryKey = ic + 1;
                                                if(col.has("type")) {
                                                    typePrimaryKey = col.getString("type");
                                                    try {
                                                        iTypePrimaryKey = Integer.parseInt(typePrimaryKey);
                                                    } catch (Exception e) {
                                                    }
                                                }
                                            }
                                        }

                                        if (!isCrossTableService) {
                                            col.put("alias", column_alias);
                                            cols.put(ic, col);
                                        } else {
                                            targetColumnIndex = ic;
                                        }

                                        if (bAddColumnToList) {
                                            if (column_alias_list.length() > 0) {
                                                column_alias_list += ",";
                                            }
                                            column_alias_list += column_alias;
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    error += " [ Columns Error:" + e.getLocalizedMessage() + "]";
                    System.err.println("// " + e.getLocalizedMessage());
                }

            } else {
                // tabella non registrata nel server
                String msg = "ControId:" + tblWrkDesc + " not registered";
                error += "[" + msg + "]";
                System.err.println(msg);
                table = controlId;
            }

            if (targetColumn != null && !targetColumn.isEmpty()) {
                if (column_list == null || column_list.isEmpty()) {
                    return "{\"error\":\"" + ("Error: column " + targetColumn + " not found") + "\"}";
                }
            }

            if (!BlackWhiteList.isAccessible(database, schema, table)) {
                return "{\"error\":\"" + ("Table " + database + "." + schema + "." + table + " is not accessible by wblack/white list") + "\"}";
            }

            boolean bCacheIdsInAvailable = false;
            String sWhere = "";
            String sSort = "";
            String sWhereIds = "";
            String workingTable = "";

            if (isCrossTableService && targetTable != null && !targetTable.isEmpty()) {
                workingTable = (schema != null && !schema.isEmpty() ? schema + "." : "") + targetTable; // tabella spedificata

            } else {
                workingTable = tbl_wrk.schemaTable;
                if (isMySQL) {
                } else if (isPostgres) {
                } else if (isOracle) {
                }
            }

            time2 = System.currentTimeMillis();
            
            ArrayList<String> usingDatabase = new ArrayList<String>();
            if (database != null && !database.isEmpty()) {
                if (isMySQL) {
                    usingDatabase.add("USE " + tableIdString + database + tableIdString + "");
                    // usingDatabase.add("SET global sql_mode='ANSI_QUOTES'"); // altera tutte le query
                } else if (isPostgres) {
                    // To test
                    usingDatabase.add("SET search_path TO \"" + database + "\",public");
                    // usingDatabase = "\\c \""+database+"\"";
                } else if (isOracle) {
                    // Only schema cha be changed (ALTER SESSION SET current_schema = other_user;)
                    // Database is the oracle instance, so different process
                } else if (isSqlServer) {
                    usingDatabase.add("USE " + tableIdString + database + tableIdString + "");
                }
            }
            if (usingDatabase != null) {
                for (int i = 0; i < usingDatabase.size(); i++) {
                    String stmt = usingDatabase.get(i);
                    if (stmt != null && !stmt.isEmpty()) {
                        if (connToUse != null) {
                            try {
                                psdo = connToUse.prepareStatement(stmt);
                                psdo.executeUpdate();
                                psdo.close();
                            } catch (Exception e) {
                                error += " [" + (tblWrkDesc) + "] Pre-statement Error:" + e.getLocalizedMessage() + " executingQuery:" + usingDatabase + "]" + "[Driver:" + tbl_wrk.driverClass + "]";
                                System.err.println(usingDatabase);
                                System.err.println("// Error:" + e.getLocalizedMessage());
                            }
                        }
                    }
                }
            }

            if (isOracle) { //fuckyou
                if (!"distinct".equalsIgnoreCase(targetMode)) { // fail the dintinct purpose
                    column_list += ",ROWNUM as ROWNUMBER";
                }
            }

            String baseQuery = ""
                    + "SELECT " + column_list
                    + "\nFROM " + workingTable
                    + "\n" + leftJoinList;

            String baseIdsQuery = ""
                    + "SELECT " + primaryKey
                    + "\nFROM " + workingTable
                    + "\n" + leftJoinList;

            if (query != null && !query.isEmpty()) {
                if (requestJson != null) {
                    if (requestJson.has("queryParams")) {
                        try {
                            queryParams = requestJson.getJSONArray("queryParams");
                        } catch (Exception e) {
                        }
                    }
                }

            } else {
                //
                // Request's filters
                //
                try {
                    if (!isCrossTableService) {
                        if (tbl_wrk != null && requestJson != null) {
                            JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
                            if (requestJson.has("filtersJson")) {
                                JSONArray filtersCols = requestJson.getJSONArray("filtersJson");
                                JSONArray filtersDefinition = null;
                                JSONArray filtersDefinitionCols = null;
                                int curFilter = -1;

                                if (requestJson.has("curFilter")) {
                                    curFilter = requestJson.getInt("curFilter");
                                    try {
                                        filtersDefinition = tbl_wrk.tableJson.getJSONArray("filters");
                                    } catch (Exception e) {
                                    }
                                    try {
                                        filtersDefinitionCols = (filtersDefinition != null ? filtersDefinition.getJSONObject(curFilter).getJSONArray("columns") : null);
                                    } catch (Exception e) {
                                    }
                                } else {
                                    if (filtersCols.length() > 0) {
                                        String msg = "Filters Error:unable to get back current filter definition";
                                        error += "[" + msg + "]";
                                        System.err.println("// " + msg);
                                    }
                                }

                                sWhere = process_filters_json(
                                        tbl_wrk, table, cols,
                                        isOracle, isMySQL, isPostgres, isSqlServer,
                                        sWhere, filtersCols, filtersDefinitionCols, leftJoinsMap,
                                        tableIdString, itemIdString
                                );
                            }

                            try {
                                filtersIds = requestJson.getJSONArray("ids");
                            } catch (Exception e) {
                            }
                            if (filtersIds != null) {
                                String sIdsList = "";
                                String apex = "";

                                if (iTypePrimaryKey == 3 || iTypePrimaryKey == 4 || iTypePrimaryKey == 7 || iTypePrimaryKey == 8 || iTypePrimaryKey == -5 || iTypePrimaryKey == -6 || iTypePrimaryKey == -7) {
                                    // numeric
                                } else {
                                    apex = "'";
                                }

                                for (int iF = 0; iF < filtersIds.length(); iF++) {
                                    sIdsList += (sIdsList.length() > 0 ? "," : "") + apex + String.valueOf(filtersIds.get(iF)) + apex;
                                }
                                if (sWhere.length() > 0) {
                                    sWhere += " AND ";
                                } else {
                                    sWhere += "\nWHERE ";
                                }

                                sWhere += (tbl_wrk.schemaTable) + "." + (itemIdString + primaryKey + itemIdString) + " IN (" + sIdsList + ")";
                                // Azzera la paginazione
                                startRow = 0;
                            }
                        }
                    }
                } catch (Exception e) {
                    error += "[Filters Error:" + e.getLocalizedMessage() + "]" + "[Driver:" + tbl_wrk.driverClass + "]";
                    System.err.println("// Filters Error:" + e.getLocalizedMessage());
                }

                //
                // Filtri permanenti
                //
                // N.B.: I filtri permenaneti sono decisi dal server ma possono essere impostati sessione per sessione
                //       Ad esempio accesso per dominio
                if (!isCrossTableService || "distinct".equalsIgnoreCase(targetMode)) {
                    JSONArray preFilters = null;
                    JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");

                    try {
                        preFilters = (tbl_wrk != null ? tbl_wrk.tableJson.getJSONArray("preFilters") : null);
                    } catch (Exception e) {
                    }

                    // Filtri sovrascritti in sessione
                    if (recordset_params.session != null) {
                        Object sPrefilters = recordset_params.session.getAttribute(tbl_wrk.controlId + ".preFilters");
                        if (sPrefilters != null) {
                            preFilters = (JSONArray) sPrefilters;
                        }

                        if (preFilters != null) {

                            sWhere = process_filters_json(
                                    tbl_wrk, table, cols,
                                    isOracle, isMySQL, isPostgres, isSqlServer,
                                    sWhere, preFilters, null, leftJoinsMap,
                                    tableIdString, itemIdString
                            );
                        }
                    }
                }

                //
                // Ordinamenti dalla richiesta
                //
                try {
                    if (tbl_wrk != null && requestJson != null) {
                        if (requestJson.has("sortColumns")) {
                            JSONArray sortColumns = requestJson.getJSONArray("sortColumns");
                            String sortColumnsMode = "asc";
                            if (requestJson.has("sortColumnsMode")) {
                                sortColumnsMode = requestJson.getString("sortColumnsMode");
                            }
                            if (sortColumns != null) {
                                // JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
                                // for(int i = 0; i < cols.length(); i++) {
                                // JSONObject col = cols.getJSONObject(i);
                                JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
                                for (int i = 0; i < sortColumns.length(); i++) {
                                    String sortColumn = sortColumns.getString(i);
                                    String sortColumnAlias = sortColumn;

                                    if (isOracle) { // need column alias
                                        for (int ic = 0; ic < cols.length(); ic++) {
                                            JSONObject col = cols.getJSONObject(ic);
                                            String colName = null;
                                            try {
                                                colName = col.getString("name");
                                            } catch (Exception e) {
                                                colName = null;
                                            }
                                            if (colName.equalsIgnoreCase(sortColumn)) {
                                                try {
                                                    sortColumnAlias = col.getString("alias");
                                                } catch (Exception e) {
                                                }
                                            }
                                        }
                                    }

                                    if (sortColumn != null && !sortColumn.isEmpty()) {
                                        if (sSort.length() == 0) {
                                            sSort += " ORDER BY (";
                                        } else {
                                            sSort += ",";
                                        }
                                        sSort += itemIdString + sortColumnAlias + itemIdString;
                                    }
                                }
                                if (sSort.length() > 0) {
                                    sSort += ")";
                                    sSort += " " + sortColumnsMode;
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    error += " [ sortColumns error:" + e.getLocalizedMessage() + "]" + "[Driver:" + tbl_wrk.driverClass + "]";
                    System.err.println("// sortColumns error:" + e.getLocalizedMessage() + " request:" + recordset_params.sRequest);
                }
            }

            if (query != null && !query.isEmpty()) {
                executingQuery = workspace.solve_query_params(query, queryParams);
                executingQueryForCache = null;
            } else {
                executingQuery = baseQuery + sWhere;
                if (!isOracle) {
                    // Aggiunto dopo la limitazione : in oracle è ottenuta con il filtro
                    executingQuery += sSort;
                }
                executingQueryForCache = executingQuery;
            }

            //
            // Utilizzo cache degli ids (delle primary keys)
            //
            if (tbl_wrk != null) {
                if (cacheIds > 0) {
                    if (filtersIds == null && executingQueryForCache != null) {
                        // Il filtro sugli ID pprevale sulla chache (es. lettura record appena creato)
                        if ((ids = IdsCache.getIds(executingQueryForCache)) != null) {
                            // cache id presente
                            if (ids.size() > 0) {
                                if (startRow < IdsCache.getStartRow(executingQueryForCache) + ids.size()) {
                                    String sIdsList = "";
                                    List<Long> subIdsList = ids.subList((int) startRow, endRow <= ids.size() ? (int) endRow : ids.size());
                                    for (int i = 0; i < subIdsList.size(); i++) {
                                        sIdsList += (i > 0 ? "," : "") + subIdsList.get(i);
                                    }

                                    cRow = startRow;
                                    // WHERE utenti.utenti_id IN (65,38,
                                    sWhereIds = "\nWHERE " + tbl_wrk.schemaTable + "." + primaryKey + " IN (" + sIdsList + ")";
                                    executingQuery = baseQuery + sWhereIds;
                                    bCacheIdsInAvailable = true;
                                    System.err.println("IDS CACHE: executingQuery:" + executingQuery);
                                } else {
                                    System.err.println("IDS CACHE: no result : reexecute:" + executingQuery);
                                }
                            } else {
                                if (cacheIds == 1) {
                                    System.err.println("IDS CACHE: out of range :" + executingQuery);
                                }
                            }
                        }
                    }
                }
            }

            //
            // Applicazione Limitazione recordset
            //
            String limitString = "";
            boolean canApplyLimit = true;
            if (query != null && !query.isEmpty()) {
                if (query.endsWith(";") || query.lastIndexOf(";") >= query.length() - 2) {
                    canApplyLimit = false;
                }
                int where_index = query.toLowerCase().indexOf("where");
                if(where_index >= 0)
                    sWhere = query.substring(where_index);
            }
            if (canApplyLimit) {
                if (!bCacheIdsInAvailable) {
                    if (!isCrossTableService) {
                        if (filtersIds == null) {
                            // Il filtro sugli ID pprevale sulla paginazione
                            if (cacheIds < 1 || (cacheIds == 2 && !bCacheIdsInAvailable)) {
                                // no cache : read data now
                                if (endRow > 0) {
                                    cRow = startRow;
                                    if (isOracle) {
                                        limitString = "";
                                        if (sWhere == null || sWhere.isEmpty()) {
                                            limitString += "\nWHERE ";
                                        } else {
                                            limitString += " AND ";
                                        }
                                        // limitString += " OFFSET "+startRow+" ROWS FETCH NEXT "+(endRow-startRow)+" ROWS ONLY";
                                        limitString += "ROWNUM < " + (endRow);
                                        executingQuery += limitString;
                                        executingQuery = "select * from (" + executingQuery + ") WHERE ROWNUM > " + startRow + "";
                                        limitString = "";
                                    } else if (isSqlServer) {
                                        if (sSort == null || sSort.isEmpty()) {
                                            sSort += "ORDER BY 1";
                                        }
                                        limitString += "\nOFFSET " + startRow + " ROWS";
                                        limitString += "\nFETCH NEXT " + (endRow - startRow) + " ROWS ONLY";
                                    } else {
                                        limitString = " LIMIT " + (endRow - startRow) + " OFFSET " + startRow + "";
                                    }
                                }
                            } else {
                                // N.B : alla prima esecuzione non può essere eseguita la limitazione perchè impedirebbe la lettura degli indici (limitazione cmw a workspace.maxRows)
                                //      alla sucessiva escuzione il codice non passa di qua'
                                // read now and store the cache, limit to workspace.maxRow
                                cRow = startRow;
                                if (workspace.maxRows > 0) {
                                    if (isOracle) {
                                        limitString = "";
                                        if (sWhere == null || sWhere.isEmpty()) {
                                            limitString += "\nWHERE ";
                                        } else {
                                            limitString += " AND ";
                                        }
                                        // limitString += " OFFSET "+startRow+" ROWS FETCH NEXT "+(workspace.maxRows-startRow)+" ROWS ONLY";
                                        limitString += "ROWNUM <= " + (startRow + workspace.maxRows);
                                        executingQuery += limitString;
                                        executingQuery = "select * from (" + executingQuery + ") WHERE ROWNUMBER > " + startRow + "";
                                        limitString = "";
                                    } else {
                                        limitString = " LIMIT " + (workspace.maxRows) + " OFFSET " + startRow + "";
                                    }
                                }
                            }
                        }
                        executingQuery += limitString;
                    }
                } else {
                    // walk the cache : no limit
                }
            }

            //
            // Aggiunta del criterio di ordinamento
            //
            if (isOracle) {
                if (query != null && !query.isEmpty()) {
                } else {
                    if (sSort != null && !sSort.isEmpty()) {
                        executingQuery += "\n" + sSort;
                    }
                }
            }

            long maxRow = endRow - startRow;

            //
            //  Conteggio righe risultato ed esecuzione evento onRetrieve dell'owner
            //
            if (!isCrossTableService) {

                if (query != null && !query.isEmpty()) {
                } else {
                    try {
                        if (table != null && !table.isEmpty()) {
                            if (connToUse != null) {
                                countQuery = "SELECT COUNT(*) AS nRows FROM " + tbl_wrk.schemaTable + " " + leftJoinList + " " + sWhere;
                                psdo = connToUse.prepareStatement(countQuery);
                                rsdo = psdo.executeQuery();
                                if (rsdo != null) {
                                    if (rsdo.next()) {
                                        nRows = rsdo.getInt(1);
                                    }
                                }
                            }
                        }
                    } catch (Throwable e) {
                        error += "Count Error:" + e.getLocalizedMessage() + countQuery + "[Driver:" + tbl_wrk.driverClass + "] controlId:" + controlId;
                        System.err.println("// Count Error:" + e.getLocalizedMessage() + countQuery);
                    }
                    if (rsdo != null) {
                        rsdo.close();
                    }
                    rsdo = null;
                    if (psdo != null) {
                        psdo.close();
                    }
                    rsdo = null;
                }

                //
                //  Esecuzione evento on Retrieve
                //
                try {
                    if (tbl_wrk != null) {
                        
                        Object owner = tbl_wrk.getOwner();
                        if (owner != null) {
                            JSONArray events = null;
                            boolean bOnRetrieveFound = false;
                            String serverClassName = null;
                            try {
                                events = tbl_wrk.tableJson.getJSONArray("events");
                            } catch (JSONException e) {
                            }
                            if (events != null) {
                                for (int ie = 0; ie < events.length(); ie++) {
                                    JSONObject event = events.getJSONObject(ie);
                                    if (event != null) {
                                        String eventName = null;
                                        try {
                                            eventName = event.getString("name");
                                        } catch (JSONException ex) {
                                        }
                                        if ("onRetrieve".equalsIgnoreCase(eventName)) {
                                            bOnRetrieveFound = true;
                                            try {
                                                serverClassName = event.getString("server");
                                            } catch (JSONException ex) {
                                                serverClassName = null;
                                            }
                                            if (serverClassName != null && !serverClassName.isEmpty()) {
                                                // Evento definito ma classe da chiamre non impostata : eseguie l'eevento predefinito ?
                                                // bOnRetrieveFound = false;
                                            }
                                        }
                                    }
                                }
                            }
                            Object retVal = null;
                            if (bOnRetrieveFound) {
                                // Evento definito : passa il controllo alla classe defnitia in "server" nell' evento
                                if (serverClassName != null && !serverClassName.isEmpty()) {
                                    retVal = forwardEvent("onRetrieve", tbl_wrk, (String) serverClassName, (Object) executingQuery /*params*/, (Object) nRows/*clientData*/, (Object) recordset_params.request);
                                }
                            } else {
                                // Evento di systema sulla classe owner (se definito)
                                if (owner != null) {
                                    retVal = forwardEvent("onRetrieve", tbl_wrk, (Object) owner, (Object) executingQuery /*params*/, (Object) nRows/*clientData*/, (Object) recordset_params.request);
                                }
                            }

                            if (retVal != null) {
                                boolean bTerminate = false;
                                if (retVal.getClass() == boolean.class) {
                                    if ((boolean) retVal == false) {
                                        bTerminate = true;
                                    }
                                }
                                if (retVal.getClass() == Boolean.class) {
                                    if ((boolean) retVal == false) {
                                        bTerminate = true;
                                    }
                                }
                                if (retVal.getClass() == Integer.class) {
                                    if ((int) retVal == 0) {
                                        bTerminate = true;
                                    }
                                }
                                if (retVal.getClass() == String.class) {
                                    try {
                                        JSONObject result = new JSONObject((String) retVal);
                                        if (result != null) {
                                            if (result.has("nRows")) {
                                                long newNRows = result.getLong("nRows");
                                                if (newNRows >= 0) {
                                                    maxRow = newNRows;
                                                }
                                            }
                                            if (result.has("message")) {
                                                message = result.getString("message");
                                            }
                                            if (result.has("title")) {
                                                title = result.getString("title");
                                            }
                                            if (result.has("result")) {
                                                int intResult = result.getInt("result");
                                                if (intResult <= 0) {
                                                    bTerminate = true;
                                                }
                                            }
                                            if (result.has("terminate")) {
                                                if (result.getBoolean("terminate")) {
                                                    bTerminate = true;
                                                }
                                            }
                                        }
                                    } catch (Throwable e) {
                                    }
                                }
                                if (bTerminate) {
                                    String base64Query = "";
                                    String base64Error = "";
                                    String base64Warning = "";
                                    String base64Title = "";
                                    String base64Message = "";
                                    try {
                                        base64Query = utility.base64Encode(executingQuery != null && !executingQuery.isEmpty() ? executingQuery : "N/D");
                                    } catch (Throwable e) {
                                    }
                                    try {
                                        base64Error = utility.base64Encode(error != null && !error.isEmpty() ? error : "");
                                    } catch (Throwable e) {
                                    }
                                    if (message != null && !message.isEmpty()) {
                                        // message from callback
                                        try {
                                            base64Message = utility.base64Encode(message);
                                        } catch (Throwable e) {
                                        }
                                    } else {
                                        try {
                                            base64Warning = utility.base64Encode("Terminate by event onRetrieve");
                                        } catch (Throwable e) {
                                        }
                                    }
                                    out_string = "{\"resultSet\":[";
                                    out_string += "]";
                                    out_string += ",\"startRow\":" + startRow;
                                    out_string += ",\"endRow\":" + endRow;
                                    out_string += ",\"nRows\":" + nRows;
                                    out_string += ",\"query\":\"" + base64Query + "\"";
                                    out_string += ",\"error\":\"" + base64Error + "\"";
                                    out_string += ",\"warning\":\"" + base64Warning + "\"";
                                    out_string += ",\"message\":\"" + base64Message + "\"";
                                    out_string += ",\"title\":\"" + base64Title + "\"";
                                    out_string += "}";
                                    return out_string;
                                }
                            }
                        }
                    }
                } catch (Throwable e) {
                    error += "Error:" + e.getLocalizedMessage();
                    System.err.println("// updateRow() Error:" + e.getLocalizedMessage());
                }
            }

            // salvataggio in sessione
            if (recordset_params.bSaveQueryInfo) {
                set_query_info(recordset_params.request, tbl_wrk, column_list, column_alias_list, primaryKey, dbPrimaryKey, workingTable, leftJoinList, sWhere, sSort, limitString, itemIdString);
            }

            lStartTime = System.currentTimeMillis();
            try {
                if (connToUse != null) {
                    psdo = connToUse.prepareStatement(executingQuery);
                    rsdo = psdo.executeQuery();
                }
            } catch (Exception e) {
                error += " [" + (tblWrkDesc) + "] Query Error:" + e.getLocalizedMessage() + " executingQuery:" + executingQuery + "]" + "[Driver:" + tbl_wrk.driverClass + "]";
                System.err.println(executingQuery);
                System.err.println("// Error:" + e.getLocalizedMessage());
            }
            lQueryTime = System.currentTimeMillis();

            time3 = System.currentTimeMillis();
            
            //
            // Creating the cache
            //
            if (tbl_wrk != null) {
                if (cacheIds == 1 || (cacheIds == 2 && lQueryTime - lStartTime > maxQueryTimeMs)) { // Cache activating
                    if (filtersIds == null) {
                        // Il filtro sugli ID prevale sulla paginazione
                        if (ids == null) {
                            if (executingQueryForCache != null && !executingQueryForCache.isEmpty()) {
                                if ((ids = IdsCache.getIds(executingQueryForCache)) == null) {
                                    if (!isCrossTableService) {
                                        if (startRow == 0) {
                                            ids = new ArrayList<Long>();
                                            bStoreIds = true;
                                            if (ids == null) {
                                                System.err.println("// Fatal error: no memory");
                                            } else {
                                                System.err.println("/* IDS CACHE: ativating on " + executingQuery + " */");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (rsdo != null) {
                JSONArray cols = null;

                try {
                    cols = tbl_wrk.tableJson.getJSONArray("columns");
                } catch (Exception e) {
                }

                // create columns just in time for queryX mode
                if (query != null && !query.isEmpty()) {
                    if (rsdo != null) {
                        ResultSetMetaData rsmd = rsdo.getMetaData();
                        int nCols = rsmd.getColumnCount();
                        JSONArray newCols = new JSONArray();
                        for (int ic = 1; ic <= nCols; ic++) {
                            String cName = rsmd.getColumnName(ic);
                            String cLabel = rsmd.getColumnLabel(ic);
                            int cType = rsmd.getColumnType(ic);
                            JSONObject newCol = new JSONObject();
                            if (tbl_wrk.tableJson.has("columnsResolved") && tbl_wrk.tableJson.getBoolean("columnsResolved")) {
                                newCol.put("field", String.valueOf(ic));
                            } else {
                                newCol.put("field", cName);
                            }
                            newCol.put("name", cName);
                            newCol.put("label", cLabel);
                            newCol.put("type", cType);
                            newCols.put(newCol);
                        }
                        tbl_wrk.tableJson.put("columns", newCols);
                        newColsJson = tbl_wrk.tableJson.get("columns").toString();
                        column_alias_list = null;
                        column_json_list = null;
                    }
                }

                String fieldValue = null;

                String[] columns_alias = column_alias_list != null ? column_alias_list.split(",") : null;
                String[] columns_json = column_json_list != null ? column_json_list.split(",") : null;
                boolean bColumnsResolved = false;
                try {
                    bColumnsResolved = ("false".equalsIgnoreCase(columnsResolved) ? false : tbl_wrk.tableJson.getBoolean("columnsResolved"));
                } catch (Exception e) {
                }
                try {
                    cols = tbl_wrk.tableJson.getJSONArray("columns");
                } catch (Exception e) {
                }
                int[] colTypes = new int[cols.length()];
                int[] colPrecs = new int[cols.length()];
                int[] colDigits = new int[cols.length()];
                boolean[] colNullable = new boolean[cols.length()];
                for (int ic = 0; ic < cols.length(); ic++) {
                    try {
                        colTypes[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("type"));
                    } catch (Exception e) {
                    }
                    try {
                        colPrecs[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("precision"));
                    } catch (Exception e) {
                        colPrecs[ic] = -1;
                    }
                    try {
                        colNullable[ic] = cols.getJSONObject(ic).getBoolean("nullable");
                    } catch (Exception e) {
                        colNullable[ic] = true;
                    }
                    try {
                        colDigits[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("digits"));
                    } catch (Exception e) {
                        colDigits[ic] = -1;
                    }
                }

                //
                // Legge i risultati della query
                // 
                Object[] recordset = get_recordset(tbl_wrk,
                        executingQuery,
                        rsdo,
                        cols,
                        colTypes,
                        colPrecs,
                        colDigits,
                        colNullable,
                        dbPrimaryKey,
                        cRow, startRow, endRow, maxRow,
                        columns_alias,
                        columns_json,
                        idColumn,
                        bColumnsResolved,
                        bStoreIds,
                        isCrossTableService,
                        targetColumnIndex
                );

                out_string += (String) recordset[0];
                out_values_string += (String) recordset[1];
                out_codes_string += (String) recordset[2];
                ids = (ArrayList<Long>) recordset[3];
                error += (String) recordset[4];
            }


            time4 = System.currentTimeMillis();
            
            if (rsdo != null) {
                rsdo.close();
            }
            rsdo = null;
            if (psdo != null) {
                psdo.close();
            }
            psdo = null;

            //
            //  Salvataggio cache ids
            //
            if (!isCrossTableService) {
                if (ids != null) {
                    IdsCache.addIdsCache(executingQueryForCache, ids, startRow);
                }
            }

        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println("// get_table_recordset() [" + controlId + "] Error:" + e.getLocalizedMessage());

        } finally {
            try {
                if (conn != null) {
                    if(!conn.getAutoCommit()) {
                        conn.commit();
                    }
                }
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
            // closing the connections (with callbacks)
            connection.closeConnection(conn);
            connection.closeConnection(connToDB);
        }


        lRetrieveTime = System.currentTimeMillis();
        
        
        try {
            if (isCrossTableService) {
                out_string = "{";
                out_string += "\"values\":" + "[" + out_values_string + "]";
                if (idColumn != null) {
                    out_string += ",\"codes\":" + "[" + out_codes_string + "]";
                }
                out_string += "}";
            } else {
                String base64Query = "";
                String base64Error = "";
                String base64Warning = "";
                String base64Message = "";
                String base64Title = "";

                try {
                    base64Query = utility.base64Encode(executingQuery != null && !executingQuery.isEmpty() ? executingQuery : "N/D");
                } catch (Throwable e) {
                }
                try {
                    base64Error = utility.base64Encode(error != null && !error.isEmpty() ? error : "");
                } catch (Throwable e) {
                }
                try {
                    base64Warning = utility.base64Encode(warning != null && !warning.isEmpty() ? warning : "");
                } catch (Throwable e) {
                }
                try {
                    base64Message = utility.base64Encode(message != null && !message.isEmpty() ? message : "");
                } catch (Throwable e) {
                }
                try {
                    base64Title = utility.base64Encode(title != null && !title.isEmpty() ? title : "");
                } catch (Throwable e) {
                }

                out_string += "]";
                out_string += ",\"startRow\":" + startRow;
                out_string += ",\"endRow\":" + endRow;
                out_string += ",\"nRows\":" + nRows;
                out_string += ",\"connectionTime\":" + (time1-time0);
                out_string += ",\"metedataTime\":" + (time2-time1);
                out_string += ",\"statementTime\":" + (time3-time2);
                out_string += ",\"fetchTime\":" + (time4-time3);
                out_string += ",\"queryTime\":" + (lQueryTime - lStartTime);
                out_string += ",\"totalTime\":" + (lRetrieveTime - lQueryTime);
                out_string += ",\"idsCache\":" + (ids != null ? String.valueOf(ids.size()) : "\"N/D\"");
                out_string += ",\"query\":\"" + base64Query + "\"";
                out_string += ",\"error\":\"" + base64Error + "\"";
                out_string += ",\"warning\":\"" + base64Warning + "\"";
                out_string += ",\"message\":\"" + base64Message + "\"";
                out_string += ",\"title\":\"" + base64Title + "\"";
                out_string += (newColsJson != null ? ",\"columns\":" + newColsJson + "" : "");
                out_string += ",\"debug\":1";
                out_string += "}";
            }
            
            if(time4-time0 > TIME_MSEC_LIMIT_FOR_WARNING) {
                System.err.println("*** WARNING : get_table_recordset() [" + controlId + "] time stats:"
                        +"\n connectionTime:" + (time1-time0)
                        +"\n metedataTime:" + (time2-time1)
                        +"\n statementTime:" + (time3-time2)
                        +"\n fetchTime:" + (time4-time3)
                );
            }
                    
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println("// get_table_recordset() [" + controlId + "] Error:" + e.getLocalizedMessage());
        }

        return out_string;
    }

    //
    // filtersCols = definizione del filtro nella richiesta (il filtro corrente passato dalla pagina web)
    // filtersDefinitionCols = definizione delle colonne del filtro corrente (nel setup del controllo)
    //
    static public String process_filters_json(
            workspace tbl_wrk, String table, JSONArray cols,
            boolean isOracle, boolean isMySQL, boolean isPostgres, boolean isSqlServer,
            String sWhere, JSONArray filtersCols, JSONArray filtersDefinitionCols, ArrayList<LeftJoinMap> leftJoinsMap,
            String tableIdString, String itemIdString
    ) throws JSONException {

        String error = "";
        int parentCount = 0;

        for (int i = 0; i < filtersCols.length(); i++) {
            JSONObject filtersCol = filtersCols.getJSONObject(i);
            JSONObject col = null;
            int type = 0;
            boolean nullable = false;
            try {
                String filterTable = null;
                String filterName = null;
                String filterValue = null;
                String filterOp = null;
                String filterLogic = null;
                String filterNextOp = null;
                boolean filterSensitiveCase = false;

                try {
                    filterTable = filtersCol.getString("table");
                } catch (JSONException e) {
                }
                try {
                    filterName = filtersCol.getString("name");
                } catch (JSONException e) {
                }
                try {
                    if (!filtersCol.isNull("value")) {
                        filterValue = filtersCol.getString("value");
                    }
                } catch (JSONException e) {
                }
                try {
                    filterOp = filtersCol.getString("op");
                } catch (JSONException e) {
                }
                try {
                    filterLogic = filtersCol.getString("logic");
                } catch (JSONException e) {
                }
                try {
                    filterSensitiveCase = filtersCol.getBoolean("sensitiveCase");
                } catch (JSONException e) {
                }
                
                // is next operator a logic 'OR' ? .. start and opening parent
                if(i+1 < filtersCols.length()) {
                    JSONObject filterNextCol = filtersCols.getJSONObject(i+1);
                    try {
                        filterNextOp = filterNextCol.getString("op");
                    } catch (JSONException e) {
                    }
                } 

                if (filterName != null && filterValue != null) {
                    String preFix = "'";
                    String postFix = "'";
                    String[] colParts = filterName.split("\\.");
                    boolean bFoundCol = false;
                    boolean filterDisabled = false;

                    // risolve l'ambiguita'
                    if (colParts.length == 1) {
                        if (filterTable == null || filterTable.isEmpty()) {
                        } else {
                        }
                        
                        for (int ic = 0; ic < cols.length(); ic++) {
                            col = cols.getJSONObject(ic);
                            String colName = null;
                            String colTable = null;
                            try {
                                colTable = col.getString("foreignTable");
                            } catch (Exception e) {
                            }
                            try {
                                colName = col.getString("name");
                            } catch (Exception e) {
                            }
                            String colAlias = null;// (colTable != null ? LeftJoinMap.getAlias(leftJoinsMap, colTable) : table) + "." + itemIdString+colName+itemIdString;
                            try {
                                colAlias = col.getString("alias");
                            } catch (Exception e) {
                            }

                            
                            // An alias can be used in a query select list to give a column a different name. You can use the alias in GROUP BY, ORDER BY, or HAVING clauses to refer to the column.
                            // Standard SQL disallows references to column aliases in a WHERE clause. This restriction is imposed because when the WHERE clause is evaluated, the column value may not yet have been determined.
                            filterTable = (colTable != null ? LeftJoinMap.getAlias(leftJoinsMap, colTable) : tableIdString + table + tableIdString);
                            if (filterTable == null || filterTable.isEmpty()) {
                                filterTable = tableIdString + table + tableIdString;
                            }
                            colAlias = (table) + "." + itemIdString + colName + itemIdString;

                            if (filterName.equalsIgnoreCase(colName)) {
                                // filterName = colAlias != null ? colAlias : filterName;
                                bFoundCol = true;
                                break;
                            }
                        }
                        
                        if (!bFoundCol) {
                            // filterName = tbl_wrk.schemaTable+"."+itemIdString+filterName+itemIdString;
                            // error += "[Filters Error: field : "+filterName+" not resolved]";
                            // System.err.println("Filters Error: field : "+filterName+" not resolved");
                            filterName = filterName;
                        }
                    } else if (colParts.length > 1) {
                        filterTable = colParts[0];
                        if (filterTable != null) {
                            filterName = colParts[1];
                            if (!filterTable.equalsIgnoreCase(table)) {
                                if (isPostgres || isOracle) {
                                    // mette l'alias
                                    String colAlias = (filterTable != null ? LeftJoinMap.getAlias(leftJoinsMap, filterTable) : tableIdString + table + tableIdString) + "." + itemIdString + colParts[1] + itemIdString;
                                    filterName = colAlias != null ? colAlias : filterName;
                                } else {
                                }
                                filterTable = "";
                            } else {
                                // OK con postgres
                                filterTable = tableIdString + table + tableIdString;
                            }
                        }
                        for (int ic = 0; ic < cols.length(); ic++) {
                            col = cols.getJSONObject(ic);
                            String colName = null;
                            try {
                                colName = col.getString("name");
                            } catch (Exception e) {
                            }
                            if (filterName.equalsIgnoreCase(colName)) {
                                bFoundCol = true;
                                break;
                            }
                        }
                    } else {
                        // undetected case
                    }

                    if (col != null) {
                        try {
                            type = col.getInt("type");
                        } catch (Exception e) {
                        }
                        try {
                            nullable = col.getBoolean("nullable");
                        } catch (Exception e) {
                        }
                    } else {
                        String err = " Filters Error: column '" + filterName + "' not defined" + "]";
                        error += err;
                        System.err.println(err);
                    }

                    int ich = 0, nch = filterValue.length();
                    while (ich < nch && filterValue.charAt(ich) == ' ') {
                        ich++;
                    }
                    int ichs = ich;
                    boolean bScan = true;
                    if (ich < nch) {
                        while (bScan) {
                            if (filterValue.charAt(ich) == '<' || filterValue.charAt(ich) == '>' || filterValue.charAt(ich) == '=' || filterValue.charAt(ich) == '%' || filterValue.charAt(ich) == '!') {
                                ich++;
                            } else if (filterValue.startsWith("IN ")) {
                                ich += 3;
                            } else if (filterValue.startsWith("LIKE ")) {
                                ich += 5;
                            } else {
                                bScan = false;
                            }
                        }
                    }
                    if (ich > ichs) {
                        filterOp = filterValue.substring(ichs, ich);
                        filterValue = filterValue.substring(ich);
                    } else {
                        int commaIndex = filterValue.indexOf(",");
                        if (commaIndex == 0 || commaIndex > 0 && filterValue.charAt(commaIndex - 1) != '\\') {
                            filterOp = "IN";
                        }
                    }

                    if (filterValue.indexOf("*") >= 0) {
                        if (filterOp == null || filterOp.isEmpty()) {
                            filterOp = "LIKE";
                            filterValue = filterValue.replaceAll("\\*", "%");
                        }
                    }

                    if (type == 8 || type == 7 || type == 6 || type == 4 || type == 3 || type == -5 || type == -6 || type == -7) {
                        if (filterValue.indexOf(",") >= 0) {
                            filterOp = "IN";
                        }
                    }

                    if ("null".equalsIgnoreCase(filterValue)) {
                        if ("=".equalsIgnoreCase(filterOp) || "like".equalsIgnoreCase(filterOp) || "fulllike".equalsIgnoreCase(filterOp) || filterOp == null || filterOp.isEmpty()) {
                            filterOp = "IS";
                            filterValue = "NULL";
                            preFix = " ";
                            postFix = "";
                        }
                    } else if ("\"null\"".equals(filterValue)) {
                        filterValue = "NULL";
                    } else if ("\"NULL\"".equals(filterValue)) {
                        filterValue = "NULL";
                    }

                    if ("IS".equalsIgnoreCase(filterOp)) {
                        if ("NULL".equalsIgnoreCase(filterValue)) {
                            preFix = " ";
                            postFix = "";
                        }
                    }
                    if ("IN".equalsIgnoreCase(filterOp)) {
                        preFix = "(";
                        postFix = ")";
                        if (filterValue == null || filterValue.isEmpty()) {
                            if (type == 8 || type == 7 || type == 6 || type == 4 || type == 3 || type == -5 || type == -6 || type == -7) {
                                preFix = "";
                                postFix = "";
                                filterValue = "NULL";
                            } else {
                                filterValue = "''";
                            }
                        } else {
                            if (type == 8 || type == 7 || type == 6 || type == 4 || type == 3 || type == -5 || type == -6 || type == -7) {
                                // numeric
                            } else {
                                filterValue = "'" + filterValue + "'";
                            }
                        }
                    }

                    if (filterOp == null || filterOp.isEmpty()) {
                        if (filtersDefinitionCols != null) {
                            if (filtersDefinitionCols.getJSONObject(i).has("op")) {
                                try {
                                    filterOp = filtersDefinitionCols.getJSONObject(i).getString("op");
                                } catch (Exception e) {
                                }
                            }
                        }
                    }

                    if ("LIKE".equalsIgnoreCase(filterOp) || "%".equalsIgnoreCase(filterOp)) {
                        if (type == 8 || type == 7 || type == 6 || type == 4 || type == 3 || type == -5 || type == -6 || type == -7) {
                            // numeric : like unsupported
                            filterOp = "=";
                        } else {
                            filterOp = "LIKE";
                            if (filterValue != null && !filterValue.isEmpty()) {
                                preFix = (filterValue.charAt(0) != '%' ? "'%" : "'");
                                postFix = (filterValue.length() > 0 ? (filterValue.charAt(filterValue.length() - 1) != '%' ? "%'" : "'") : "'");
                            } else {
                                // no value : assume like "" as no filter
                                filterDisabled = true;
                            }
                        }
                    }
                    if (">".equalsIgnoreCase(filterOp)) {
                        if (col != null) {
                            if (type == 8 || type == 7 || type == 6 || type == 4 || type == 3 || type == -5 || type == -6 || type == -7) {
                                // numeric
                            } else {
                                // > 0 applicato alle stringhe -> NOT null
                                preFix = "";
                                postFix = "";
                                if (isPostgres) {
                                    filterOp = "IS NOT";
                                } else {
                                    filterOp = "NOT";
                                }
                                filterValue = "NULL";
                                filterSensitiveCase = true;
                            }
                        }
                    }

                    String sensitiveCasePreOp = "";
                    String sensitiveCasePostOp = "";
                    if (!filterSensitiveCase) {
                        if (type == 8 || type == 7 || type == 6 || type == 4 || type == 3 || type == -5 || type == -6 || type == -7) {
                            // numeric                                                
                        } else {
                            filterValue = filterValue.toLowerCase();
                            sensitiveCasePreOp = "lower(";
                            sensitiveCasePostOp = ")";
                        }
                    }

                    if (!filterDisabled) {

                        if (sWhere.length() > 0) {
                            if ("OR".equalsIgnoreCase(filterLogic)) {
                                sWhere += " OR ";
                            } else {
                                sWhere += " AND ";
                            }
                        } else {
                            sWhere += "\nWHERE ";
                        }

                        //
                        // compute the value by metadata
                        //
                        Object[] fres = format_db_value(tbl_wrk, type, nullable, filterValue, filterOp);
                        filterValue = (String) fres[0];
                        int filterValueType = (int) fres[1];

                        if (filterValueType == 0) {
                            // expression
                            preFix = "";
                            postFix = "";
                        }

                        // is operator logic not 'OR' ? closing parent
                        if("OR".equalsIgnoreCase(filterNextOp)) {
                            sWhere += "(";
                            parentCount++;
                        }


                        // add where clausole
                        sWhere += sensitiveCasePreOp + (filterTable != null && !filterTable.isEmpty() ? (filterTable + "." + itemIdString + filterName + itemIdString) : (filterName)) + sensitiveCasePostOp
                                + (filterOp != null && !filterOp.isEmpty() ? " " + filterOp + " " : "=")
                                + preFix + (filterValue != null ? filterValue : "") + postFix;

                        
                        // is operator logic not 'OR' ? closing parent
                        if(!"OR".equalsIgnoreCase(filterOp)) {
                            if(parentCount>0) {
                                sWhere += ")";
                                parentCount--;
                            }
                        }

                        // is the last Filter ? closing open parents
                        if(i >= filtersCols.length()) {
                            for (int ip=0; ip<parentCount; ip++) {
                                sWhere += ")";
                            }
                        }
                        
                    }
                }
            } catch (Exception e) {
                error += " Filters Error:" + e.getLocalizedMessage() + "]";
                System.err.println("// " + e.getLocalizedMessage());
            }
        }

        return sWhere;
    }

    // Read the resultset... used internally
    /**
     * <h3>Read the recordset</h3>
     * <p>
     * This method get bean from the primary key list, creating it at runtime
     *
     * @param tbl_wrk the control (workspace)
     * @param executingQuery the query (String)
     * @param rsdo the result set (ResultSet)
     *
     * @return json of the records (String)
     * @see db
     */
    static private Object[] get_recordset(workspace tbl_wrk,
            String executingQuery,
            ResultSet rsdo,
            JSONArray cols,
            int[] colTypes,
            int[] colPrecs,
            int[] colDigits,
            boolean[] colNullable,
            String dbPrimaryKey,
            long cRow, long startRow, long endRow, long maxRow,
            String[] columns_alias,
            String[] columns_json,
            String idColumn,
            boolean bColumnsResolved,
            boolean bStoreIds,
            boolean isCrossTableService,
            int targetColumnIndex
    ) throws SQLException {
        int addedRow = 0;
        StringBuilder out_string = new StringBuilder("");
        StringBuilder out_codes_string = new StringBuilder("");
        StringBuilder out_values_string = new StringBuilder("");
        String fieldValue = null, error = "";
        DateFormat dateFormat = new SimpleDateFormat("dd" + workspace.dateSep + "MM" + workspace.dateSep + "yyyy");
        DateFormat dateTimeFormat = new SimpleDateFormat("dd" + workspace.dateSep + "MM" + workspace.dateSep + "yyyy HH" + workspace.timeSep + "mm" + workspace.timeSep + "ss.SS");
        NumberFormat nf = NumberFormat.getInstance();
        ArrayList<Long> ids = new ArrayList<Long>();

        if (rsdo != null) {
            int maxColumn = columns_alias != null ? columns_alias.length : 0;
            if (colTypes == null) {
                colTypes = new int[cols.length()];
            }
            if (colPrecs == null) {
                colPrecs = new int[cols.length()];
            }
            if (colDigits == null) {
                colDigits = new int[cols.length()];
            }
            if (colNullable == null) {
                colNullable = new boolean[cols.length()];
            }
            for (int ic = 0; ic < cols.length(); ic++) {
                try {
                    colTypes[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("type"));
                } catch (Exception e) {
                }
                try {
                    colPrecs[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("precision"));
                } catch (Exception e) {
                    colPrecs[ic] = -1;
                }
                try {
                    colDigits[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("digits"));
                } catch (Exception e) {
                    colDigits[ic] = -1;
                }
                try {
                    colNullable[ic] = cols.getJSONObject(ic).getBoolean("nullable");
                } catch (Exception e) {
                    colNullable[ic] = true;
                }
            }

            while (rsdo.next()) {
                if (cRow >= startRow) {
                    if (addedRow < maxRow || maxRow <= 0) {
                        // read fields set
                        if (addedRow > 0) {
                            out_string.append(",");
                            if (idColumn != null) {
                                out_codes_string.append(",");
                            }
                            if (isCrossTableService) {
                                out_values_string.append(",");
                            }
                        }

                        if (cRow == 89) {
                            int lb = 1;
                        }

                        out_string.append("{");
                        String fieldName = null;
                        try {
                            if (idColumn != null) {
                                fieldValue = rsdo.getString(idColumn);
                                out_codes_string.append("\"" + fieldValue + "\"");
                            }
                            if (isCrossTableService) {
                                int ic = targetColumnIndex;
                                if (colTypes[ic] == 8) {
                                    double dFieldValue = rsdo.getDouble(columns_alias[0]);
                                    if (colDigits[ic] < 0) {
                                        fieldValue = String.format(Locale.US, "%.4f", dFieldValue);
                                    } else {
                                        nf.setMaximumFractionDigits(colDigits[ic]);
                                        fieldValue = nf.format(dFieldValue);
                                    }
                                } else if (colTypes[ic] == 91) { //date
                                    try {
                                        java.sql.Date dbSqlDate = rsdo.getDate("columnName");
                                        fieldValue = dbSqlDate != null ? dateFormat.format(dbSqlDate) : null;
                                    } catch (Exception e) {
                                        fieldValue = "00" + workspace.dateSep + "00" + workspace.dateSep + "0000";
                                    }
                                } else if (colTypes[ic] == 92) { //time
                                    try {
                                        java.sql.Time dbSqlTime = rsdo.getTime("columnName");
                                        fieldValue = dbSqlTime != null ? dateFormat.format(dbSqlTime) : null;
                                    } catch (Exception e) {
                                        fieldValue = "00" + workspace.timeSep + "00" + workspace.timeSep + "00";
                                    }
                                } else if (colTypes[ic] == 6 || colTypes[ic] == 93) { // datetime
                                    try {
                                        java.sql.Time dbSqlDateTime = rsdo.getTime("columnName");
                                        fieldValue = dbSqlDateTime != null ? dateTimeFormat.format(dbSqlDateTime) : null;
                                    } catch (Exception e) {
                                        fieldValue = "00" + workspace.dateSep + "00" + workspace.dateSep + "0000 00" + workspace.timeSep + "00" + workspace.timeSep + "00";
                                    }
                                } else {
                                    fieldValue = rsdo.getString(columns_alias[0]).replace("\"", "\\\"");
                                }
                                out_values_string.append("\"" + fieldValue + "\"");
                            } else {
                                for (int ic = 0; ic < cols.length(); ic++) {
                                    String columnAlias = columns_alias != null ? columns_alias[ic] : null;

                                    if (ic < maxColumn || maxColumn <= 0) {
                                        JSONObject col = cols.getJSONObject(ic);

                                        if (ic > 0) {
                                            out_string.append(",");
                                        }
                                        if (bColumnsResolved) {
                                            fieldName = col.getString("field");
                                        } else {
                                            if (columns_json != null) {
                                                fieldName = columns_json[ic];
                                            } else {
                                                fieldName = col.has("runtimeName") ? col.getString("runtimeName") : col.getString("name");
                                            }
                                        }
                                        if (colTypes[ic] == 8) {
                                            double dFieldValue = columnAlias != null ? rsdo.getDouble(columns_alias[ic]) : rsdo.getDouble(ic + 1);
                                            if (colDigits[ic] < 0) {
                                                fieldValue = String.format(Locale.US, "%.4f", dFieldValue);
                                            } else {
                                                nf.setMaximumFractionDigits(colDigits[ic]);
                                                fieldValue = nf.format(dFieldValue);
                                            }
                                        } else if (colTypes[ic] == 91) { //date
                                            try {
                                                java.sql.Date dbSqlDate = columnAlias != null ? rsdo.getDate(columnAlias) : rsdo.getDate(ic + 1);
                                                fieldValue = dbSqlDate != null ? dateFormat.format(dbSqlDate) : null;
                                            } catch (Exception e) {
                                                fieldValue = "00" + workspace.dateSep + "00" + workspace.dateSep + "0000";
                                            }
                                        } else if (colTypes[ic] == 92) { //time
                                            try {
                                                java.sql.Time dbSqlTime = columnAlias != null ? rsdo.getTime(columnAlias) : rsdo.getTime(ic + 1);
                                                fieldValue = dbSqlTime != null ? dateFormat.format(dbSqlTime) : null;
                                            } catch (Exception e) {
                                                fieldValue = "00" + workspace.timeSep + "00" + workspace.timeSep + "00";
                                            }
                                        } else if (colTypes[ic] == 6 || colTypes[ic] == 93) { // datetime
                                            try {
                                                java.sql.Timestamp dbSqlDateTime = columnAlias != null ? rsdo.getTimestamp(columnAlias) : rsdo.getTimestamp(ic + 1);
                                                fieldValue = dbSqlDateTime != null ? dateTimeFormat.format(dbSqlDateTime) : null;
                                            } catch (Exception e) {
                                                fieldValue = "00" + workspace.dateSep + "00" + workspace.dateSep + "0000 00" + workspace.timeSep + "00" + workspace.timeSep + "00";
                                            }
                                        } else {
                                            try {
                                                fieldValue = columnAlias != null ? rsdo.getString(columnAlias) : rsdo.getString(ic + 1);
                                            } catch (Exception e) {
                                                fieldValue = "";
                                            }
                                        }
                                        // N.B.: Protocollo JSON : nella risposta JSON il caratere "->\" è a carico del server, e di conseguenza \->\\
                                        fieldValue = fieldValue != null ? fieldValue.replace("\\", "\\\\").replace("\"", "\\\"") : "";
                                        out_string.append("\"" + fieldName + "\":\"" + fieldValue + "\"");
                                    }
                                }
                            }
                        } catch (Exception e) {
                            error += "[ Retrieve Error:" + e.getLocalizedMessage() + executingQuery + " ]" + "[Driver:" + tbl_wrk.driverClass + "]";
                            System.err.println("// Retrieve Error at cRow:" + cRow + " fieldName:" + fieldName + " fieldValue:" + fieldValue + " Error:" + e.getLocalizedMessage() + executingQuery);
                            fieldValue = "";
                            out_string.append("\"" + fieldName + "\":\"" + fieldValue + "\"");
                        }

                        if (!isCrossTableService) {
                            out_string.append("}");
                        }
                    }

                    addedRow++;

                    if (bStoreIds) {
                        // store ids in cache
                        try {
                            ids.add((long) rsdo.getInt(dbPrimaryKey));
                        } catch (Exception e) {
                            error += "[ PrimaryKey Retrieve Error:" + e.getLocalizedMessage() + executingQuery + " ]" + "[Driver:" + tbl_wrk.driverClass + "]";
                            System.err.println("// PrimaryKey Retrieve Error at cRow:" + cRow + ":" + e.getLocalizedMessage() + executingQuery);
                            bStoreIds = false;
                        }
                    }
                    if (addedRow >= maxRow && maxRow > 0 && !bStoreIds) {
                        break;
                    }
                }
                cRow++;
            }
        }
        return new Object[]{out_string.toString(), out_values_string.toString(), out_codes_string.toString(), ids, error};
    }

    // Legge i dati dal db basandosi sull'ultima query eseguita dall'utente e sull' elenco di ids selezionati
    /**
     * <h3>Get the bean by primary keys</h3>
     * <p>
     * This method get bean from the primary key list, creating it at runtime
     *
     * @param request the Http requet (HttpServletRequest)
     * @param ids the comma separated string of the primary keys (String)
     * @param maxRows the maximun number of rows to retrieve (long)
     *
     * @return comma separated values string, null if no selection defined
     * @see db
     */
    static public Object get_bean(HttpServletRequest request, String ids, long maxRows) {
        return get_bean(request, ids, null, null, null, maxRows);
    }

    /**
     * <h3>Get the bean by primary keys</h3>
     * <p>
     * This method get bean from the primary key list, creating it at runtime
     *
     * @param request the Http requet (HttpServletRequest)
     * @param ids the comma separated string of the primary keys (String)
     * @param format the format of the output, may by : * all o full, for all
     * columns of the control: jsonObject, for data in json format (array of
     * string or array or array of string) array, for data in ArrayList of
     * String format (array of string or array or array of string) string, for
     * data in csv format bean, for data in a bean or ArrayList of beans
     * @param maxRows the maximun number of rows to retrieve (long)
     *
     * @return comma separated values string, null if no selection defined
     * @see db
     */
    static public Object get_bean(HttpServletRequest request, String ids, String format, long maxRows) {
        return get_bean(request, ids, format, null, null, maxRows);
    }

    /**
     * <h3>Get the bean by primary keys</h3>
     * <p>
     * This method get bean from the primary key list, creating it at runtime
     *
     * @param requestParam the Http requet (HttpServletRequest)
     * @param ids the comma separated string of the primary keys (String)
     * @param format the format of the output, may by : * all o full, for all
     * columns of the control: jsonObject, for data in json format (array of
     * string or array or array of string) array, for data in ArrayList of
     * String format (array of string or array or array of string) string, for
     * data in csv format bean, for data in a bean or ArrayList of Class of
     * beans
     * @param fields the field list, as comma separated string, of the output,
     * null or empty for primary key only
     * @param maxRows the maximun number of rows to retrieve (long)
     *
     * @return comma separated values string, null if no selection defined
     * @see db
     */
    static public Object get_bean(Object request, String ids, String format, String fields, long maxRows) {
        return get_bean(request, ids, format, fields, null, maxRows);
    }

    // formato di uscita : json o bean
    // fields : * all o full per tutti i campi
    // jsonObject : JSON campi o record
    // jsonArray : Array di campi o di record 
    // array : ArrayList di campi o record
    // string stringa di campi o record
    // bean : array di classi create a runtime
    /**
     * <h3>Get the bean by primary keys</h3>
     * <p>
     * This method get bean from the primary key list, creating it at runtime
     *
     * @param requestParam the Http requet (HttpServletRequest)
     * @param ids the comma separated string of the primary keys (String)
     * @param format the format of the output, may by : * all o full, for all
     * columns of the control: jsonObject, for data in json format (array of
     * string or array or array of string) array, for data in ArrayList of
     * String format (array of string or array or array of string) string, for
     * data in csv format bean, for data in a bean or ArrayList of Class of
     * beans
     * @param fields the field list, as comma separated string, of the output,
     * null or empty for primary key only
     * @param foreignTables the foreign tables to read, as comma separated
     * string, of the output
     * @param maxRows the maximun number of rows to retrieve (long)
     *
     * @return comma separated values string, null if no selection defined
     * @see db
     */
    static public Object get_bean(Object requestParam, String ids, String format, String fields, String foreignTables, long maxRows) {
        HttpServletRequest request = (HttpServletRequest) requestParam;
        Object result = null;
        String controlId = null, tblWrk = null, errors = "";
        if (request != null) {
            try {
                controlId = (String) request.getParameter("controlId");
            } catch (Exception e) {
            }
            try {
                tblWrk = (String) request.getParameter("tblWrk");
            } catch (Exception e) {
            }
            return get_bean(requestParam, (tblWrk != null ? tblWrk : controlId), ids, format, fields, foreignTables, maxRows);
        }
        return null;
    }

    static public Object get_bean(Object requestParam, String controlId, String ids, String format, String fields, String foreignTables, long maxRows) {
        HttpServletRequest request = (HttpServletRequest) requestParam;
        Object result = null;
        String errors = "";
        String executingQuery = null;
        Connection conn = null;
        PreparedStatement psdo = null;
        ResultSet rsdo = null;

        if (request != null) {

            workspace tbl_wrk = workspace.get_tbl_manager_workspace(controlId);

            if (format == null || format.isEmpty()) {
                format = "json";
            }
            if (fields == null || fields.isEmpty()) {
                fields = "ids";
            }

            if (tbl_wrk != null) {
                Object[] queryInfo = get_query_info(request, tbl_wrk);
                if (queryInfo != null) {
                    // TODO : create a query with all fields
                }

                if (queryInfo != null) {
                    // Esegue la query e crea il bean
                    executingQuery = "";

                    if (tbl_wrk != null) {
                        // Connessione al DB ( da pr4edefinita, da JSON o da sessione )
                        try {

                            conn = connection.getConnection(null, request, tbl_wrk.tableJson);
                            if (conn != null) {
                                String columnsList = (String) queryInfo[0];
                                String primaryKey = (String) queryInfo[1];
                                String from = (String) queryInfo[2];
                                String join = (String) queryInfo[3];
                                String where = (String) queryInfo[4];
                                String sort = (String) queryInfo[5];
                                String limit = (String) queryInfo[6];
                                String delimiter = (String) queryInfo[7];
                                String schemaTable = from;
                                JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
                                boolean bAllColumn = false;

                                executingQuery = "SELECT ";
                                if ("full".equalsIgnoreCase(fields) || "all".equalsIgnoreCase(fields) || "*".equalsIgnoreCase(fields)) {
                                    bAllColumn = true;
                                    executingQuery += "\n" + columnsList;
                                } else {
                                    boolean primaryKeyFound = false;
                                    String table = null, primaryKey2 = primaryKey;
                                    try {
                                        table = tbl_wrk.tableJson.getString("table");
                                    } catch (Exception e) {
                                    }
                                    if (table != null && !table.isEmpty()) {
                                        primaryKey2 = table + "." + primaryKey;
                                    }
                                    executingQuery += "\n" + (delimiter + primaryKey + delimiter);
                                    for (int i = 0; i < cols.length(); i++) {
                                        if (cols.getJSONObject(i).getString("name").equalsIgnoreCase(primaryKey) || cols.getJSONObject(i).getString("name").equalsIgnoreCase(primaryKey2)) {
                                            JSONArray primaryKeyCol = new JSONArray();
                                            primaryKeyCol.put(cols.get(i));
                                            cols = primaryKeyCol;
                                            primaryKeyFound = true;
                                            break;
                                        }
                                    }
                                    if (!primaryKeyFound) {
                                        // N.B.: cols deve essere coerente con la query : rettifica della quuery su tutti i campi
                                        executingQuery += "\n" + columnsList;
                                    }
                                }

                                if (ids != null && !ids.isEmpty()) {
                                    // prevale sui filtri ultima query eseguira
                                    where = null;
                                }

                                if (ids != null && ("*".equalsIgnoreCase(ids) || "\"*\"".equalsIgnoreCase(ids) || "all".equalsIgnoreCase(ids) || "\"all\"".equalsIgnoreCase(ids))) {
                                    // No filter : all rows
                                    if (where == null || where.isEmpty()) {
                                        where = "\nWHERE ";
                                    } else {
                                        where += " AND ";
                                    }
                                    where += "(1=1)";
                                } else if (ids != null && ids.startsWith("!")) {
                                    if (where == null || where.isEmpty()) {
                                        where = "\nWHERE ";
                                    } else {
                                        where += " AND ";
                                    }
                                    where += schemaTable + "." + delimiter + primaryKey + delimiter + " NOT IN (" + (ids.substring(1)).replaceAll("\"", "'") + ")";
                                } else if (ids != null && !ids.isEmpty()) {
                                    if (where == null || where.isEmpty()) {
                                        where = "\nWHERE ";
                                    } else {
                                        where += " AND ";
                                    }
                                    where += schemaTable + "." + delimiter + primaryKey + delimiter + " IN (" + (ids).replaceAll("\"", "'") + ")";
                                } else {
                                    // No record selected
                                    if (where == null || where.isEmpty()) {
                                        where = "\nWHERE ";
                                    } else {
                                        where += " AND ";
                                    }
                                    where += "(1==2)";
                                }
                                executingQuery += "\nFROM " + from;
                                executingQuery += bAllColumn ? (join != null ? "\n" + join : "") : "";
                                executingQuery += where != null ? "\n" + where : "";
                                executingQuery += sort != null ? "\n" + sort : "";

                                long lStartTime = System.currentTimeMillis();
                                try {
                                    psdo = conn.prepareStatement(executingQuery);
                                    rsdo = psdo.executeQuery();
                                } catch (Exception e) {
                                    errors += " [" + (controlId) + "] Query Error:" + e.getLocalizedMessage() + " executingQuery:" + executingQuery + "]" + "[Driver:" + tbl_wrk.driverClass + "]";
                                    System.err.println(executingQuery);
                                    System.err.println("// Error:" + e.getLocalizedMessage());
                                }
                                long lQueryTime = System.currentTimeMillis();

                                if (rsdo != null) {
                                    // Legge i risultati della query
                                    String[] columns_alias = null;
                                    String[] columns_json = null;
                                    String dbPrimaryKey = null;
                                    int[] colTypes = null;
                                    int[] colPrecs = null;
                                    int[] colDigits = null;
                                    boolean[] colNullable = null;
                                    long cRow = 0, startRow = 0, endRow = maxRows;
                                    boolean bColumnsResolved = false;
                                    boolean bStoreIds = false;
                                    boolean isCrossTableService = false;
                                    int targetColumnIndex = -1;
                                    String idColumn = null;

                                    // TODO : parametri da valorizzare e debug
                                    Object[] recordset = get_recordset(tbl_wrk,
                                            executingQuery,
                                            rsdo,
                                            cols,
                                            colTypes,
                                            colPrecs,
                                            colDigits,
                                            colNullable,
                                            dbPrimaryKey,
                                            cRow, startRow, endRow, maxRows,
                                            columns_alias,
                                            columns_json,
                                            idColumn,
                                            bColumnsResolved,
                                            bStoreIds,
                                            isCrossTableService,
                                            targetColumnIndex
                                    );

                                    if (recordset != null) {
                                        // Agginta eventuali errori 
                                        // out_values_string += (String)recordset[1];
                                        // out_codes_string += (String)recordset[2];
                                        // ids = (ArrayList<Long>)recordset[3];
                                        errors += (recordset[4] != null ? (String) recordset[4] : "");

                                        if ("jsonObject".equalsIgnoreCase(format) || "json".equalsIgnoreCase(format)) {
                                            result = new JSONObject("[" + (String) recordset[0] + "]");
                                        } else if ("jsonArray".equalsIgnoreCase(format)) {
                                            JSONArray rowsJson = new JSONArray("[" + (String) recordset[0] + "]");
                                            if (bAllColumn) {
                                                result = rowsJson;
                                            } else {
                                                JSONArray jaResult = new JSONArray();
                                                String key = null;
                                                for (int i = 0; i < rowsJson.length(); i++) {
                                                    try {
                                                        key = rowsJson.getJSONObject(i).getString(primaryKey);
                                                    } catch (Exception ex) {
                                                        key = rowsJson.getJSONObject(i).getString(tbl_wrk.tableJson.getString("table") + "." + primaryKey);
                                                    }
                                                    jaResult.put(key);
                                                }
                                                result = jaResult;
                                            }
                                        } else if ("array".equalsIgnoreCase(format)) {
                                            JSONArray rowsJson = new JSONArray("[" + (String) recordset[0] + "]");
                                            if (bAllColumn) {
                                                result = workspace.jsonArrayToArrayList(rowsJson, null, null);
                                            } else {
                                                ArrayList<String> listResult = new ArrayList<String>();
                                                for (int i = 0; i < rowsJson.length(); i++) {
                                                    listResult.add(rowsJson.getJSONObject(i).getString(primaryKey));
                                                }
                                                result = listResult;
                                            }
                                        } else if ("string".equalsIgnoreCase(format)) {
                                            JSONArray rowsJson = new JSONArray("[" + (String) recordset[0] + "]");
                                            if (bAllColumn) {
                                                result = (String) workspace.jsonArrayToString(rowsJson, null, null, ",");
                                            } else {
                                                JSONArray jaResult = new JSONArray();
                                                for (int i = 0; i < rowsJson.length(); i++) {
                                                    jaResult.put(rowsJson.getJSONObject(i).getString(primaryKey));
                                                }
                                                result = (String) workspace.jsonArrayToString(jaResult, null, null, ",");
                                            }

                                        } else if ("bean".equalsIgnoreCase(format)) {
                                            JSONArray rowsJson = new JSONArray("[" + (String) recordset[0] + "]");
                                            int resultBean = 0, level = 0;

                                            // Array foreign tables di partenza
                                            JSONArray foreignTablesJson = null;
                                            try {
                                                foreignTablesJson = tbl_wrk.tableJson.getJSONArray("foreignTables");
                                            } catch (Exception e) {
                                            }

                                            //
                                            //  Ritorna [ int risultato, Object [] beans, int level, String error, String className };
                                            //
                                            Object[] beanResult = create_beans_multilevel_class(tbl_wrk, rowsJson, foreignTablesJson, foreignTables, level, maxRows);
                                            if (beanResult != null) {
                                                resultBean = (int) beanResult[0];
                                                if (resultBean > 0) {
                                                    result = (ArrayList<Object>) beanResult[1];
                                                }
                                                errors += (String) beanResult[3];
                                            }
                                        } else {
                                            System.err.println("// get_bean() format:" + format + " unrecognized...");
                                        }
                                    } else {
                                        System.err.println("// get_bean() null recordsset...");
                                    }
                                } else {
                                    System.err.println("// get_bean() null rsdo...");
                                }
                            } else {
                                System.err.println("// get_bean() no connection...");
                            }

                        } catch (Throwable e) {
                            errors += "Error:" + e.getLocalizedMessage();
                            System.err.println("// get_bean() [" + controlId + "] Error:" + e.getLocalizedMessage());

                        } finally {
                            
                            if (rsdo != null) {
                                try {
                                    rsdo.close();
                                } catch (SQLException ex) {
                                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
                                }
                            }
                            if (rsdo != null) {
                                try {
                                    rsdo.close();
                                } catch (SQLException ex) {
                                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
                                }
                            }                    
                            try {
                                if (conn != null) {
                                    if(!conn.getAutoCommit()) {
                                        conn.commit();
                                    }
                                }
                            } catch (SQLException ex) {
                                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
                            }
                            // closing the connections (with callbacks)
                            connection.closeConnection(conn);
                        }
                    }
                } else {
                    System.err.println(" get_bean() query_info nit detected...");
                }
            } else {
                System.err.println(" get_bean() no control workspace...");
            }
        } else {
            System.err.println(" get_bean() no request...");
        }
        return result;
    }

    /**
     * 
     * Build the beans valorizing it by rowsJson, based on the control tbl_wrk
     * 
     * @param tbl_wrk
     * @param rowsJson
     * @param foreignTablesJson     the foreign table definition
     * @param filteringForeignTables    the ft to process (filtering)
     * @param level     // the max depth level
     * @param maxRows   // max no. of rows per bean
     * 
     * @return [ int result, Object [] beans, int level, String error, String className };
     */
    static public Object[] create_beans_multilevel_class(workspace tbl_wrk, JSONArray rowsJson, JSONArray foreignTablesJson, String filteringForeignTables, int level, long maxRows) {
        ArrayList<String> runtimeForeignTables = new ArrayList<String>();
        return create_beans_multilevel_class_internal( tbl_wrk, rowsJson, foreignTablesJson, filteringForeignTables, level, maxRows, runtimeForeignTables );
    }
    
    /**
     * Check for dead-loop the key by foreignTable.foreignColumn.Column@rowID or foreignTable
     * 
     *      Please noe dead loop come by the cople table-rowId
     * 
     * @param runtimeForeignTables
     * @param foreignTable
     * @return 
     */
    static public boolean is_foreign_table_in_dead_loop(ArrayList<String> runtimeForeignTables, String foreignTable, String rowID) {
        if(runtimeForeignTables != null && foreignTable != null) {
            String key = foreignTable + (rowID != null && !rowID.isEmpty() ? "@" + rowID : "");
            for(int i=0; i<runtimeForeignTables.size(); i++) {
                if(key.equalsIgnoreCase( runtimeForeignTables.get(i) )) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * used internllay
     * 
     * @param runtimeForeignTables
     * @param foreignTable
     * @param rowID
     * @return 
     */
    static public Object [] add_foreign_table_processed(ArrayList<String> runtimeForeignTables, String foreignTable, String rowID) {
        if(runtimeForeignTables != null && foreignTable != null) {
            String key = foreignTable + (rowID != null && !rowID.isEmpty() ? "@" + rowID : "");
            for(int i=0; i<runtimeForeignTables.size(); i++) {
                if(key.equalsIgnoreCase( runtimeForeignTables.get(i) )) {
                    return new Object [] { i+1, key };
                }
            }
            runtimeForeignTables.add(key);
            return new Object [] { runtimeForeignTables.size(), key };
        }
        return new Object [] { 0, null };
    }
    
    /**
     * 
     * used internally
     * 
     * @param tbl_wrk
     * @param rowsJson
     * @param foreignTablesJson
     * @param filteringForeignTables
     * @param level
     * @param maxRows
     * @param runtimeForeignTables
     * @return 
     */
    static public Object[] create_beans_multilevel_class_internal(
            workspace tbl_wrk, JSONArray rowsJson, 
            JSONArray foreignTablesJson, String filteringForeignTables, 
            int level, long maxRows, 
            ArrayList<String> runtimeForeignTables) {
        
        Object[] beanResult = new Object[]{0, null, 0, null, null};
        PojoGenerator pojoGenerator = null;
        String sPojoMode = "";
        String errors = "";

        try {

            ArrayList<String> ftPropNameList = new ArrayList<String>();
            ArrayList<String> ftControlIdList = new ArrayList<String>();
            ArrayList<String> ftColumnList = new ArrayList<String>();
            ArrayList<String> ftForeignColumnList = new ArrayList<String>();
            ArrayList<String> ftForeignTableList = new ArrayList<String>();
            ArrayList<String> ftClassNameList = new ArrayList<String>();
            ArrayList<Object> ftBeansContentList = new ArrayList<Object>();
            ArrayList<Object> rowsObject = new ArrayList<Object>();
            Class<?> clazz = null;
            String className = "" + tbl_wrk.controlId + "";

            JSONArray cols = null;
            String table = null;
            String primaryKey = null;
            String parentControlId = null;
            boolean bReadOnly = false;

            if(tbl_wrk.tableJson.has("readOnly")) {
                Object oReadOnly = tbl_wrk.tableJson.get("readOnly");
                String sReadOnly = String.valueOf(oReadOnly);
                if("true".equalsIgnoreCase(sReadOnly) || "yes".equalsIgnoreCase(sReadOnly)) {
                    bReadOnly = true;
                    sPojoMode += " ReadOnly";
                }
            }

            
            try {
                cols = tbl_wrk.tableJson.getJSONArray("columns");
            } catch (Exception e) {
            }
            try {
                table = tbl_wrk.tableJson.getString("table");
            } catch (Exception e) {
            }
            try {
                primaryKey = tbl_wrk.tableJson.getString("primaryKey");
            } catch (Exception e) {
            }
            try {
                parentControlId = tbl_wrk.tableJson.getString("parent");
            } catch (Exception e) {
            }

            Map<String, Class<?>> props = new HashMap<String, Class<?>>();
            Map<String, Class<?>> attributes = new HashMap<String, Class<?>>();
            for (int ic = 0; ic < cols.length(); ic++) {
                String colName = cols.getJSONObject(ic).has("runtimeName") ? cols.getJSONObject(ic).getString("runtimeName") : cols.getJSONObject(ic).getString("name");
                String[] colParts = colName.split("\\.");
                if (colParts.length > 1) {
                    if (table.equalsIgnoreCase(colParts[0])) {
                        // colName = colParts[1]; /// NO : respect original name ... not required changes (changes could get mistakes)
                        colName = colName.replaceAll("\\.", "\\$");
                    } else {
                        colName = colName.replaceAll("\\.", "\\$");
                    }
                }
                try {
                    props.put(colName, metadata.getJavaClass(cols.getJSONObject(ic).getInt("type")));
                    if(!bReadOnly) {
                        props.put(colName + "$Changed", boolean.class);
                    }
                } catch (Throwable th) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
                }
            }
            
            
            // proprietà Parent
            props.put("$Parent", Object.class);
            props.put("$Parent" + "$Read", boolean.class);
            if(!bReadOnly) {
                props.put("$Parent" + "$Changed", boolean.class);
            }
            // proprietà Table@rowId
            props.put("$tableKey", String.class);
            
            // Attributo Id del controllo parent
            attributes.put("$Parent" + "$controlId", String.class);
            // Attributo nome classe del controllo parent
            attributes.put("$Parent" + "$className", String.class);


            
            //
            // set this table@rowId as processed
            //
            String thisTable = table;
            String rowID = "";
            String mainTableKey = (String)add_foreign_table_processed(runtimeForeignTables, thisTable, rowID)[1];
            
            
            //
            // Process the foreign tables
            //
            if (level >= 0) {
                
                String[] sFilteringForeignTablesList = filteringForeignTables != null ? filteringForeignTables.split(",") : null;
                ArrayList<String> filteringForeignTablesList = sFilteringForeignTablesList != null ? new ArrayList<String>(Arrays.asList(sFilteringForeignTablesList)) : null;
                if (foreignTablesJson != null) {
                    for (int ift = 0; ift < foreignTablesJson.length(); ift++) {
                        JSONObject foreignableJson = foreignTablesJson.getJSONObject(ift);
                        if (foreignableJson != null) {
                            String ft = null, foreignColumnDescriptor = null, columnDescriptor = null;
                            try { ft = foreignableJson.getString("foreignTable"); } catch (Exception e) { }
                            
                            ArrayList<String> foreignColumns = new ArrayList<String>();
                            ArrayList<String> columns = new ArrayList<String>();

                            try {
                                String fcolumnsKey = null;
                                if (foreignableJson.has("foreignColumns")) {
                                    fcolumnsKey = "foreignColumns";
                                } else if (foreignableJson.has("foreignColumn")) {
                                    fcolumnsKey = "foreignColumn";
                                }
                                if(fcolumnsKey != null) {
                                    JSONArray json_foreign_columns = null;
                                    try { json_foreign_columns = foreignableJson.getJSONArray(fcolumnsKey); } catch (Exception e) { }
                                    if (json_foreign_columns != null) {
                                        for (int ia = 0; ia < json_foreign_columns.length(); ia++) {
                                            foreignColumns.add(json_foreign_columns.getString(ia));
                                        }
                                    } else {
                                        foreignColumns.add(foreignableJson.getString(fcolumnsKey));
                                    }
                                }
                            } catch (Exception e) {
                                foreignColumns = null;
                            }

                            try {
                                String columnsKey = null;
                                if (foreignableJson.has("columns")) {
                                    columnsKey = "columns";
                                } else if (foreignableJson.has("column")) {
                                    columnsKey = "column";
                                }
                                if(columnsKey != null) {
                                    JSONArray json_columns = null;
                                    try { json_columns = foreignableJson.getJSONArray(columnsKey); } catch (Exception e) { }
                                    if (json_columns != null) {
                                        for (int ia = 0; ia < json_columns.length(); ia++) {
                                            columns.add(json_columns.getString(ia));
                                        }
                                    } else {
                                        columns.add(foreignableJson.getString(columnsKey));
                                    }
                                }
                            } catch (Exception e) {
                                columns = null;
                            }

                            
                            try {
                                foreignColumnDescriptor = utility.arrayToString(foreignColumns, "", "", "_");
                            } catch (Exception e) {
                            }
                            try {
                                columnDescriptor = utility.arrayToString(columns, "", "", "_");
                            } catch (Exception e) {
                            }
                            
                            if (filteringForeignTablesList.contains(ft) || "*".equalsIgnoreCase(filteringForeignTables) || "all".equalsIgnoreCase(filteringForeignTables)) {
                                
                                // N.B.: dead loop come by the ForeignTable/ForeignColumn/Column
                                String thisForeignTable = ft+"."+foreignColumnDescriptor+"."+columnDescriptor;
                                rowID = "";

                                //
                                // check every foreign table for dead loop
                                //
                                boolean isForeignTableInDeadLoop = is_foreign_table_in_dead_loop(runtimeForeignTables, thisForeignTable, rowID);
                                if(isForeignTableInDeadLoop) {
                                    // Stop processing this foreign tables ...

                                } else {
                                
                                    //
                                    // Include questa classe nel bean
                                    //
                                    String ftControlId = "" + ft + "$" + foreignColumnDescriptor + "$" + columnDescriptor + "@" + tbl_wrk.controlId + "";
                                    JSONArray ftRowsJson = null;
                                    workspace ft_tbl_wrk = workspace.get_tbl_manager_workspace(ftControlId);

                                    if (ft_tbl_wrk == null) {
                                        //
                                        // chiamata da codice ?
                                        //
                                        if(tbl_wrk.tableJson.has("loadALL")) {
                                            try {
                                                if(tbl_wrk.tableJson.getBoolean("loadALL")) {
                                                    // load default workspace
                                                    String ftConnectionDriver = (tbl_wrk.tableJson.has("connectionDriver") ? (tbl_wrk.tableJson.getString("connectionDriver")!= null ? tbl_wrk.tableJson.getString("connectionDriver") : null) : null );
                                                    String ftConnectionURL = (tbl_wrk.tableJson.has("connectionURL") ? (tbl_wrk.tableJson.getString("connectionURL")!= null ? tbl_wrk.tableJson.getString("connectionURL") : null) : null );
                                                    String ftDatabase = (tbl_wrk.tableJson.has("database") ? (tbl_wrk.tableJson.getString("database")!= null ? tbl_wrk.tableJson.getString("database") : tbl_wrk.defaultDatabase)  : tbl_wrk.defaultDatabase );
                                                    String ftSchema = (tbl_wrk.tableJson.has("schema") ? (tbl_wrk.tableJson.getString("schema")!= null ? tbl_wrk.tableJson.getString("schema") : tbl_wrk.defaultSchema) : tbl_wrk.defaultSchema );
                                                    JSONObject sRequestJSON = new JSONObject();
                                                    if(ftConnectionDriver != null && !ftConnectionDriver.isEmpty()) {
                                                        sRequestJSON.put("cnnectionDriver", ftConnectionDriver);
                                                    }
                                                    if(ftConnectionURL != null && !ftConnectionURL.isEmpty()) {
                                                        sRequestJSON.put("connectionURL", ftConnectionURL);
                                                    }
                                                    sRequestJSON.put("foreignTables", "*");
                                                    if(bReadOnly)
                                                        sRequestJSON.put("readOnly", true);

                                                    String ftJson = workspace.get_default_json( (HttpServletRequest)null, ftControlId, null, ft, ftSchema, ftDatabase, tbl_wrk.controlId, tbl_wrk.token, sRequestJSON.toString(), (JspWriter)null );
                                                    if(ftJson != null && !ftJson.isEmpty()) {
                                                        ft_tbl_wrk = workspace.get_tbl_manager_workspace(ftControlId);
                                                        if (ft_tbl_wrk != null) {
                                                            // OK
                                                            ft_tbl_wrk.tableJson.put("loadALL", true);
                                                            if(bReadOnly)
                                                                ft_tbl_wrk.tableJson.put("readOnly", true);

                                                        } else {
                                                            Logger.getLogger(db.class.getName()).log(Level.SEVERE, "// Error loading foreign table control '" + ftControlId + "' :" + " workspace not found");
                                                        }
                                                    } else {
                                                        Logger.getLogger(db.class.getName()).log(Level.SEVERE, "// Error loading foreign table control '" + ftControlId + "' :" + "Empty json response");
                                                    }
                                                }
                                            } catch (Exception e) {
                                                Logger.getLogger(db.class.getName()).log(Level.SEVERE, "// Error loading foreign table control '" + ftControlId + "' :" + e.getLocalizedMessage());
                                            }
                                        }                                    
                                    }

                                    if (ft_tbl_wrk == null) {
                                        //
                                        // N.B.: se il tab della foreign table non è attivo il workspace non viene creato
                                        //      Attualmente non ci sono ragioni (salvo la chiamata da codice) per cui il workspace del controllo non venga caricato
                                        //      E' possibile nel caso caricarlo espressamente dal server su necessità con :
                                        //
                                        //      String get_default_json(null, String controlId, String tblWrk, String table, String schema, String database, String source, null)
                                        //
                                        String msg = "Control " + ftControlId + " not found";
                                        Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, "// [SERVER ERROR]: create_beans_from_json(): " + msg);
                                        errors += "[" + msg;
                                        errors += "\n";
                                        errors += "all controls:";
                                        errors += workspace.dump_tbl_manager_workspace();
                                        errors += "]";

                                    } else {

                                        //
                                        // Child bean property (the instance)
                                        //
                                        String ftPropName = (ft + "$" + foreignColumnDescriptor + "$" + columnDescriptor).toUpperCase();
                                        props.put(ftPropName, Object.class);
                                        // proprietà Readed
                                        props.put(ftPropName + "$Read", boolean.class);
                                        if(!bReadOnly) {
                                            // proprietà Changed
                                            props.put(ftPropName + "$Changed", boolean.class);
                                        }
                                        
                                        //
                                        // Attribute to the class (header) in order to detect child beans
                                        //
                                        attributes.put(ftPropName + "$column", String.class);
                                        // Attributo tabella per identificare i beans figli
                                        attributes.put(ftPropName + "$foreignTable", String.class);
                                        // Attributo colonna chiave primaria per identificare i beans figli
                                        attributes.put(ftPropName + "$foreignCol", String.class);
                                        // Attributo Id del controllo
                                        attributes.put(ftPropName + "$controlId", String.class);
                                        // Attributo nome classe del controllo
                                        attributes.put(ftPropName + "$className", String.class);

                                        //
                                        // adding a links ($class/$controlId) to the workkspace.tableJson.foreignTables[]
                                        //
                                        foreignableJson.put("foreignTableControlId", ftControlId);
                                        foreignableJson.put("foreignTableClassName", ftPropName);
                                        foreignTablesJson.put(ift, foreignableJson);

                                        
                                        
                                        //
                                        //  lettura dei records nella ft a partire da rowsJson :
                                        //  Impossibile stabilire il raggio d'azione senza la selezione delle righe del client
                                        //  Possibili vie :
                                        //      Il client passa la selezione anche delle foreign tables
                                        //      il server legge i beans figli solo su espressa richiesta
                                        //
                                        for (int ic = 0; ic < cols.length(); ic++) {
                                            String colName = cols.getJSONObject(ic).getString("name");
                                            String colSearch = colName;
                                            String[] colParts = colName.split("\\.");
                                            if (colParts.length > 1) {
                                                if (table.equalsIgnoreCase(colParts[0])) {
                                                    colSearch = colParts[1];
                                                } else {
                                                    colSearch = null;
                                                }
                                            }
                                            if (colSearch != null) {
                                                if (colSearch.equalsIgnoreCase(columnDescriptor)) {
                                                    ftColumnList.add(columnDescriptor/*(String)rowJson.getString(colName)*/);
                                                    ftForeignColumnList.add(foreignColumnDescriptor);
                                                    ftForeignTableList.add(ft);
                                                    break;
                                                }
                                            }
                                        }

                                        //                                        
                                        //  N.B.:   NOT here : valued depends to the rows selected
                                        //          'load_chil_bead' take care of child beans load
                                        //                                        
                                        ftRowsJson = null;
                                        if (rowsJson != null) {
                                            for (int ir = 0; ir < rowsJson.length(); ir++) {
                                                JSONObject rowJson = rowsJson.getJSONObject(ir);
                                            }
                                        }

                                        
                                        //
                                        // Adding nested foreign table in the json
                                        //
                                        JSONArray foreignTableForeignTablesJson = new JSONArray();
                                        String foreignTableForeignTables = "";

                                        JSONArray nestedForeignTablesJson = null;
                                        try { nestedForeignTablesJson = foreignableJson.getJSONArray("foreignTables"); } catch (Exception e) { }


                                        if (nestedForeignTablesJson != null) {

                                            for (int inft = 0; inft < nestedForeignTablesJson.length(); inft++) {
                                                JSONObject nestedForeignTableJson = nestedForeignTablesJson.getJSONObject(inft);
                                                String nestedForeignTable = nestedForeignTableJson.getString("foreignTable");
                                                if(nestedForeignTableJson != null) {
                                                    if (filteringForeignTablesList != null) {
                                                        // any filter ...
                                                        if (filteringForeignTablesList.contains(nestedForeignTable) || "*".equalsIgnoreCase(filteringForeignTables) || "all".equalsIgnoreCase(filteringForeignTables)) {
                                                            foreignTableForeignTables += (foreignTableForeignTables.length() > 0 ? "," : "") + nestedForeignTable;
                                                            foreignTableForeignTablesJson.put(nestedForeignTableJson);
                                                        }
                                                    } else {
                                                        // no filter .. add it
                                                        foreignTableForeignTables += (foreignTableForeignTables.length() > 0 ? "," : "") + nestedForeignTable;
                                                        foreignTableForeignTablesJson.put(nestedForeignTableJson);
                                                    }
                                                }
                                            }
                                        }

                                        //
                                        // Adding foreign table read from the database's metadata
                                        //
                                        if (ft_tbl_wrk != null) {
                                            nestedForeignTablesJson = null;
                                            try { nestedForeignTablesJson = ft_tbl_wrk.tableJson.getJSONArray("foreignTables"); } catch (Exception e) { }

                                            if(nestedForeignTablesJson != null) {
                                                for (int inft = 0; inft < nestedForeignTablesJson.length(); inft++) {
                                                    JSONObject nestedForeignTableJson = nestedForeignTablesJson.getJSONObject(inft);
                                                    if(nestedForeignTableJson != null) {
                                                        String nestedForeignTable = nestedForeignTableJson.getString("foreignTable");
                                                        // processa questa foreign table ?
                                                        if (filteringForeignTablesList.contains(nestedForeignTable) || "*".equalsIgnoreCase(filteringForeignTables) || "all".equalsIgnoreCase(filteringForeignTables)) {
                                                            foreignTableForeignTables += (foreignTableForeignTables.length() > 0 ? "," : "") + nestedForeignTable;
                                                            foreignTableForeignTablesJson.put(nestedForeignTableJson);
                                                        }
                                                    }
                                                }
                                            }
                                        }


                                        //
                                        // set this foreigh@rowId table as processed
                                        //
                                        add_foreign_table_processed(runtimeForeignTables, thisForeignTable, rowID);


                                        //
                                        // Create the bean (empty) from the control ft_tbl_wrk
                                        //
                                        Object[] ftBeanResult = create_beans_multilevel_class_internal( ft_tbl_wrk, ftRowsJson, foreignTableForeignTablesJson, foreignTableForeignTables, level + 1, maxRows, runtimeForeignTables );
                                        if (ftBeanResult != null) {
                                            int ftResult = (int) ftBeanResult[0];
                                            ArrayList<Object> ftBeansContent = (ArrayList<Object>) ftBeanResult[1];
                                            String ftClassName = (String) ftBeanResult[4];

                                            ftPropNameList.add(ftPropName);
                                            ftControlIdList.add(ftControlId);
                                            ftClassNameList.add(ftClassName);

                                            //
                                            // N.B.: ftBeansContentList is an list with an empty bean, 
                                            //      adding it due to it contains the child beans data (controlId/className/...)
                                            //
                                            ftBeansContentList.add(ftBeansContent);

                                            try {
                                                Class clazzChk = Class.forName(ftClassName);
                                                if (clazzChk == null) {
                                                    throw new Throwable("Null class");
                                                } else {
                                                }
                                            } catch (Throwable th) {
                                                String err = "Error getting class " + ftClassName + ":" + th.getLocalizedMessage();
                                                Logger.getLogger(db.class.getName()).log(Level.SEVERE, "// "+err);
                                                errors += "[SERVER ERROR]: unable to create class:" + err;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            boolean projectMode = false;
            if (workspace.genesisToken != null && !workspace.genesisToken.isEmpty()) {
                projectMode = true;
            }

            className = className.replaceAll("@", "0");
            // .replaceAll("-", "_")
            // className = className.replace("$", "_");
            
            try {
                clazz = Class.forName(className);
            } catch (Throwable e) {
            }

            // rebuld every time the class if we are in project mode
            if (projectMode) {
                if (clazz != null) {
                    className += "__rev$" + workspace.classMakeIndex++;
                    clazz = null;
                }
            }

            //
            // Create the pojo if missing
            //
            if (clazz == null) {
                pojoGenerator = new PojoGenerator();
                clazz = pojoGenerator.generate(className, props, attributes, sPojoMode);
                if (clazz == null) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, "// pojoGenerator FAILED on " + tbl_wrk.controlId + "...");
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, "// error : " + pojoGenerator.error);
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, "// properties : " + pojoGenerator.props);
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, "// properties : " + pojoGenerator.attributes);
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, " class body : " + pojoGenerator.classBody);
                }
            }

            if (clazz != null) {
               
                if (rowsJson != null) {
                    for (int ir = 0; ir < rowsJson.length(); ir++) {
                        Object obj = clazz.newInstance();
                        JSONObject row = rowsJson.getJSONObject(ir);
                        // String primaryKeyValue = null;

                        // Valorizza le proprietà corrispondenti ai campi
                        Object[] resSet = set_bean_by_json_resultset(obj, tbl_wrk, row);
                        if (resSet != null) {
                            if (!(boolean) resSet[0]) {
                                errors += "[Error setting row " + (ir + 1) + "/" + (rowsJson.length()) + ":" + ((String) resSet[2]) + "]";
                            }
                            
                            //
                            // set this table@rowId as processed
                            //
                            String primaryKeyValue = String.valueOf( resSet[1] );
                            utility.set(obj, "$tableKey", (String)(table+"@"+primaryKeyValue) );
                            
                        } else {
                            errors += "[Nulll result setting row " + (ir + 1) + "/" + (rowsJson.length()) + "]";
                        }

                        //
                        // Valorizza le proprietà corrispondenti ai beans figli
                        //
                        set_childbean_propery(obj, ftPropNameList, ftControlIdList, ftColumnList, ftForeignColumnList, ftForeignTableList, ftClassNameList, ftBeansContentList);


                        // Add to beans
                        rowsObject.add(obj);
                        
                        //
                        // set this table@rowId as processed .. no, this is done on load_child_bean(...)
                        //
                        // thisTable = table;
                        // rowID = String.valueOf( utility.get(obj, tbl_wrk.tableJson.getString("primaryKey")) );
                        // add_foreign_table_processed(runtimeForeignTables, thisTable, rowID);
                        
                    }
                    
                } else {
                    //
                    // Empty Bean : instanziate and set to null
                    //
                    Object obj = clazz.newInstance();

                    //
                    // Valorize the child beans properties
                    //
                    set_childbean_propery(obj, ftPropNameList, ftControlIdList, ftColumnList, ftForeignColumnList, ftForeignTableList, ftClassNameList, ftBeansContentList);

                    //
                    // set this table@rowId as processed
                    //
                    utility.set(obj, "$tableKey", (Object) mainTableKey);
                    
                    rowsObject.add(obj);
                }


                                    
                //
                // Set del Bean parent
                //
                if (level <= 0) {
                    for (Object rowObject : rowsObject) {
                        if (rowObject != null) {
                            if (parentControlId != null && !parentControlId.isEmpty()) {

                                JSONArray parentRowsJson = null;
                                workspace parent_tbl_wrk = workspace.get_tbl_manager_workspace(parentControlId);

                                //
                                // Create the bean from the paretn control 'parent_tbl_wrk'
                                //
                                Object[] parentBeanResult = create_beans_multilevel_class(parent_tbl_wrk, parentRowsJson, null, null, -1, maxRows);
                                if (parentBeanResult != null) {
                                    int parentResult = (int) parentBeanResult[0];
                                    ArrayList<Object> parentBeansContent = (ArrayList<Object>) parentBeanResult[1];
                                    String parentClassName = (String) parentBeanResult[4];
                                    for (Object parentBeanContent : parentBeansContent) {
                                        if (parentBeanContent != null) {
                                            utility.set(rowObject, "$Parent", (Object) parentBeanContent);
                                        }
                                    }
                                    if (!set_parentbean_propery(rowObject, "$Parent", parentControlId, parentClassName)) {
                                        errors += "[SERVER ERROR]: unable to set parent bean properties/attrobites (class:" + parentClassName + ")";
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // set by the recursivity
                }

            } else {
                // no pojo created ... pit fall
                errors += "[SERVER ERROR]: unable to create class:" + className;
            }
            
            //
            // set the result
            //
            beanResult[0] = 1;
            beanResult[1] = rowsObject;
            beanResult[2] = level;
            beanResult[3] = errors;
            beanResult[4] = className;

            return beanResult;

        } catch (Throwable th) {
            // ahi ahi ahi ...
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
            beanResult[0] = -1;
            beanResult[3] += "[" + th.getLocalizedMessage() + "]";
        }
        return beanResult;
    }


    /**
     * 
     * Valorize the child beans properties
     * 
     * @param obj
     * @param ftPropNameList
     * @param ftControlIdList
     * @param ftColumnList
     * @param ftForeignColumnList
     * @param ftClassNameList
     * @param ftBeansContentList
     * @return
     * @throws IntrospectionException
     * @throws IllegalArgumentException
     * @throws IllegalAccessException
     * @throws InvocationTargetException
     * @throws NoSuchFieldException
     * @throws NotFoundException 
     */
    static public boolean set_childbean_propery(Object obj,
            ArrayList<String> ftPropNameList,
            ArrayList<String> ftControlIdList,
            ArrayList<String> ftColumnList,
            ArrayList<String> ftForeignColumnList,
            ArrayList<String> ftForeignTableList,
            ArrayList<String> ftClassNameList,
            ArrayList<Object> ftBeansContentList
    ) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException, NotFoundException {

        if (ftPropNameList != null) {
            String className = obj.getClass().getName();
            ClassPool pool = ClassPool.getDefault();
            CtClass cc = pool.get(className);

            for (int ift = 0; ift < ftPropNameList.size(); ift++) {
                String ftPropName = ftPropNameList.get(ift);
                String ftControlIdName = ftControlIdList != null ? ftControlIdList.get(ift) : null;
                String ftColumn = ftColumnList != null ? ftColumnList.get(ift) : null;
                String ftForeignColumn = ftForeignColumnList != null ? ftForeignColumnList.get(ift) : null;
                String ftForeignTable = ftForeignTableList != null ? ftForeignTableList.get(ift) : null;
                String ftClassName = ftClassNameList != null ? ftClassNameList.get(ift) : null;
                ArrayList<Object> ftBeansContent = (ArrayList<Object>) (ftBeansContentList != null ? ftBeansContentList.get(ift) : null);
                if (ftPropName != null) {

                    // Set the properties...
                    utility.set(obj, ftPropName + "$Read", (Object) false);
                    try { utility.set(obj, ftPropName + "$Changed", (Object) false); } catch ( NoSuchFieldException nsf) {}

                    // Set dei beans per recupero eventuali dati assegnati
                    if (ftBeansContent != null) {
                        for (int ib = 0; ib < ftBeansContent.size(); ib++) {
                            Object ftBeanContent = ftBeansContent.get(ib);
                            if (ftBeanContent != null) {
                                utility.set(ftBeanContent, "$Parent", (Object) obj);
                            }
                        }
                        utility.set(obj, ftPropName + "", (Object) ftBeansContent);
                    }
                    // Set attributi della classe
                    if (cc != null) {
                        cc.setAttribute(ftPropName + "$column", ftColumn.getBytes());
                        cc.setAttribute(ftPropName + "$foreignTable", ftForeignTable.getBytes());
                        cc.setAttribute(ftPropName + "$foreignCol", ftForeignColumn.getBytes());
                        cc.setAttribute(ftPropName + "$controlId", ftControlIdName.getBytes());
                        cc.setAttribute(ftPropName + "$className", ftClassName.getBytes());
                    }
                }
            }
            return true;
        }
        return false;
    }

    // Valorizza le proprietà corrispondenti al beans fadre nel bean obj
    static public boolean set_parentbean_propery(Object obj,
            String parentPropName,
            String parentControlId,
            String parentClassName
    ) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException, NotFoundException {

        if (parentPropName != null) {
            String className = obj.getClass().getName();
            ClassPool pool = ClassPool.getDefault();
            CtClass cc = pool.get(className);

            // Set the properties...
            utility.set(obj, parentPropName + "$Read", (Object) false);
            try { utility.set(obj, parentPropName + "$Changed", (Object) false);  } catch ( NoSuchFieldException nsf) {}

            // Set attributi della classe
            if (cc != null) {
                cc.setAttribute(parentPropName + "$controlId", parentControlId.getBytes());
                cc.setAttribute(parentPropName + "$className", parentClassName.getBytes());
            }
            return true;
        }
        return false;
    }

    /**
     * 
     * @param obj
     * @param tbl_wrk
     * @param row
     * @return Object [] { bResult, keyValue, error }
     */
    static public Object[] set_bean_by_json_resultset(Object obj, workspace tbl_wrk, JSONObject row) {
        boolean bResult = false;
        String keyValue = null;
        String error = "";
        if (obj != null) {
            if (tbl_wrk != null) {
                try {
                    JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
                    String table = tbl_wrk.tableJson.getString("table");
                    if (cols != null) {
                        bResult = true;
                        
                        if(tbl_wrk.tableJson.has("primaryKey")) {
                            try {
                                keyValue = row.getString(tbl_wrk.tableJson.getString("primaryKey"));
                            } catch (Exception e) {
                                keyValue = row.getString(tbl_wrk.tableJson.getString("primaryKeyField"));
                            }
                        }
                        
                        for (int ic = 0; ic < cols.length(); ic++) {
                            String colName = cols.getJSONObject(ic).has("runtimeName") ? cols.getJSONObject(ic).getString("runtimeName") : cols.getJSONObject(ic).getString("name");
                            String field = null, value = null;

                            try {
                                field = cols.getJSONObject(ic).getString("field");
                            } catch (Exception e) {
                                /* value = String.valueOf(ic+1); */ }
                            try {
                                value = row.getString(colName);
                            } catch (Exception e) {
                                value = row.getString(field);
                            }

                            String[] colParts = colName.split("\\.");
                            if (colParts.length > 1) {
                                if (table.equalsIgnoreCase(colParts[0])) {
                                    colName = colParts[1];
                                } else {
                                    colName = colName.replaceAll("\\.", "\\$");
                                }
                            }
                            try {
                                utility.set(obj, colName, value);
                            } catch (Throwable th) {
                                error = "[ ERROR setting " + colName + " : " + th.getLocalizedMessage() + "]";
                                Logger.getLogger(db.class.getName()).log(Level.SEVERE, "ERROR : set_bean_by_json_resultset() : propery " + colName + " not found", th);
                                bResult = false;
                            }
                            try {                               
                                utility.set(obj, colName + "$Changed", false);
                            } catch (Throwable th) {
                                error = "[ ERROR setting " + colName + "$Changed" + " : " + th.getLocalizedMessage() + "]";
                            }
                        }
                    }
                } catch (JSONException ex) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
                    error = ex.getLocalizedMessage();
                }
            }
        }
        return new Object[] { bResult, keyValue, error };
    }


    /**
     * Creane new empty bean for control
     * 
     * @param tblWrk    the control workspace
     * @param targetWrk
     * @param rowData   the initial data
     * @return 
     */

    public static Object new_bean(Object requestParam, workspace tblWrk, JSONObject rowData) {
        if(tblWrk != null) {
            JSONArray foreignTablesJson = null;
            String filteringForeignTables = "*";
            ArrayList<String> runtimeForeignTables = null;
            JSONArray rowsData = new JSONArray();
            rowsData.put(rowData);
            Object[] result = create_beans_multilevel_class_internal( tblWrk, (JSONArray)rowsData, (JSONArray)foreignTablesJson, filteringForeignTables,
                    -1, 0, 
                    runtimeForeignTables);
            if(result != null) {
                int iResult = (int) result[0];
                ArrayList<Object> beansContent = (ArrayList<Object>) result[1];
                String className = (String) result[4];
                if(beansContent != null) {
                    if(beansContent.size() > 0) {
                        return (Object)beansContent.get(0);
                    }
                }
            }
        }
        return null;            
    }

    
    
    /**
     * Load single bean for given database.schema.table + primaryKey
     * 
     * It also load foreign tables definitions but not values
     * 
     * ControlId is automatically created if not exist (from databaseSchemaTable)
     * 
     * 
     * @param request
     * @param databaseSchemaTable
     * @param columns
     * @param primaryKey
     * 
     * @return  { Object bean, int nBeans, int nBeansLoaded, String errors, String warning }
     * 
     * @throws JSONException
     * @throws Throwable 
     */
    
    static public Object load_bean(HttpServletRequest request, String databaseSchemaTable, String columns, Object primaryKey) throws JSONException, Throwable {
        ArrayList<Object> beans = load_beans(request, databaseSchemaTable, columns, null, primaryKey, 1);
        if (beans != null) {
            if (beans.size() > 0) {
                return beans.get(0);
            }
        }
        return null;
    }

    /**
     * 
     * Load single bean for given database.schema.table + where condition as filteringColumn=filteringValue
     * 
     * It also load foreign tables definitions but not values
     * 
     * ControlId is automatically created if not exist (from databaseSchemaTable)
     * 
     * @param request
     * @param databaseSchemaTable
     * @param columns
     * @param filteringColumn
     * @param filteringValue
     * @return 
     */
    static public Object load_bean(HttpServletRequest request, String databaseSchemaTable, String columns, String filteringColumn, String filteringValue) {
        ArrayList<Object> beans = load_beans(databaseSchemaTable, columns, filteringColumn+"="+filteringValue, 1);
        if(beans != null) {
            if(beans.size() > 0) {
                return (Object)beans.get(0);
            }
        }
        return null;
    }

    
    /**
     * Create all beans from primaryKey value
     *
     *   ControlId is automatically created if not exist (from databaseSchemaTable)
     * 
     * @param request
     * @param databaseSchemaTable
     * @param columns
     * @param keyColumn
     * @param key
     * @param maxRows
     * 
     * @return { Object bean, int nBeans, int nBeansLoaded, String errors, String warning }
     * 
     * @throws JSONException
     * @throws Throwable 
     */
    static public ArrayList<Object> load_beans(HttpServletRequest request, String databaseSchemaTable, String columns, String keyColumn, Object key, long maxRows) throws JSONException, Throwable {
        return load_beans(request, null, databaseSchemaTable, columns, keyColumn, key, maxRows);
    }

    static public workspace load_beans_get_workspace(HttpServletRequest request, String databaseSchemaTable, String controlId) throws JSONException, Throwable {
        String database = null, table = null, schema = null, primaryKey = null;
        workspace tbl_wrk = null;
        if (controlId == null) {
            String runtimeControlId = workspace.getControlIdFromDatabaseSchemaTable(databaseSchemaTable);
            tbl_wrk = workspace.get_tbl_manager_workspace(runtimeControlId);
            if (tbl_wrk == null) {
                runtimeControlId = workspace.getControlIdFromTable(databaseSchemaTable);
                tbl_wrk = workspace.get_tbl_manager_workspace(runtimeControlId);
            }
        } else {
            tbl_wrk = workspace.get_tbl_manager_workspace(controlId);
        }
        if (tbl_wrk == null) {
            // crea il controllo
            if(databaseSchemaTable != null) {
                String[] tableParts = databaseSchemaTable.split("\\.");
                if (tableParts.length == 1) {
                    table = tableParts[0];
                } else if (tableParts.length == 2) {
                    table = tableParts[1];
                    schema = tableParts[0];
                } else if (tableParts.length == 3) {
                    table = tableParts[2];
                    schema = tableParts[1];
                    database = tableParts[0];
                }
                if (controlId == null) {
                    controlId = workspace.getControlIdFromDatabaseSchemaTable(databaseSchemaTable);
                }
                String sRequest = "";
                String parentControlId = null;
                String sTableJson = workspace.get_default_json(request, controlId, controlId, table, schema, database, parentControlId, workspace.sourceSpecialToken, sRequest, null);
                tbl_wrk = workspace.get_tbl_manager_workspace(controlId);
                if (tbl_wrk != null) {
                    tbl_wrk.tableJson.put("isSystem", "true");
                } else {
                    return null;
                }
            }
        }
        return tbl_wrk;
    }

    /**
     *  Create all beans from primaryKey value
     * 
     * ControlId is automatically created if not exist (from controlId)
     * 
     * @param request
     * @param controlId
     * @param databaseSchemaTable
     * @param columns
     * @param keyColumn
     * @param key
     * @param maxRows
     * 
     * @return  { Object bean, int nBeans, int nBeansLoaded, String errors, String warning }
     * 
     * @throws JSONException
     * @throws Throwable 
     * 
     *  TODO : partial columns read still unsupported... read always all columns
     */
    static public ArrayList<Object> load_beans(HttpServletRequest request, String controlId, String databaseSchemaTable, String columns, String keyColumn, Object key, long maxRows) throws JSONException, Throwable {
        String sWhere = "";

        //
        // cerca (databaseSchemaTable)  o cerca (controlId) il controllo
        //
        workspace tbl_wrk = load_beans_get_workspace(request, databaseSchemaTable, controlId);
        if (tbl_wrk == null) {
            return null;
        }

        JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
        if (keyColumn == null || keyColumn.isEmpty()) {
            if (tbl_wrk.tableJson.has("primaryKey")) {
                keyColumn = tbl_wrk.tableJson.getString("primaryKey");
            }
        }

        if (keyColumn == null || keyColumn.isEmpty()) {
            String err = "ERROR : load_beans() : primaryKey not defined in control : " + controlId;
            System.err.println("// " + err);
            return null;
        }

        if (key instanceof String) {
            sWhere = " WHERE " + keyColumn + "='" + key + "'";
        } else if (key instanceof Long || key instanceof Integer || key instanceof Float || key instanceof Double) {
            sWhere = " WHERE " + keyColumn + "=" + String.valueOf(key) + "";
        } else if (key instanceof JSONArray) {
        } else if (key instanceof ArrayList<?>) {
            if (key != null && ((ArrayList<?>) key).size() > 0) {
                String keyList = workspace.arrayToString(((ArrayList<String>) key).toArray(), null, null, ",");
                sWhere = " WHERE " + keyColumn + " IN (" + keyList + ")";
            }
        } else {
            String err = "ERROR : load_beans() : undetect key type in control : " + controlId;
            System.err.println("// " + err);
            return null;
        }

        return load_beans(request, controlId, databaseSchemaTable, columns, (String)sWhere, maxRows);
    }

    
    
    /**
     * Create all beans for given where condition
     * 
     * @param databaseSchemaTable
     * @param columns
     * @param where_condition
     * @param maxRows
     * @return 
     */
    static public ArrayList<Object> load_beans(String databaseSchemaTable, String columns, String where_condition, long maxRows) {
        return load_beans((HttpServletRequest) null, (String) null, databaseSchemaTable, columns, where_condition, maxRows);
    }

    /**
     * Create all beans from given where condition
     * 
     * ControlId is automatically created if not exist (from databaseSchemaTable)
     * 
     * Return { Object bean, int nBeans, int nBeansLoaded, String errors, String warning }
     * 
     * @param request
     * @param controlId
     * @param databaseSchemaTable
     * @param columns
     * @param where_condition
     * @param maxRows
     * 
     * @return { Object bean, int nBeans, int nBeansLoaded, String errors, String warning }
     * 
     * TODO : partial columns read still unsupported... read always all columns
     * 
     */    
    static public ArrayList<Object> load_beans(HttpServletRequest request, String controlId, String databaseSchemaTable, String columns, String where_condition, long maxRows) {
        // crea un controllo sulla tabella
        if(databaseSchemaTable != null)
            databaseSchemaTable = databaseSchemaTable.replace("\"", "");
        String[] tableParts = (databaseSchemaTable != null ? databaseSchemaTable.split("\\.") : null);
        String database = null, table = null, schema = null, primaryKey = null;
        String primaryKeyColumn = "";
        JSONArray cols = null;
        String column_alias_list = "";
        String column_json_list = null;
        long cRow = 0, startRow = 0, endRow = maxRows;
        String errors = "";

        Connection conn = null;
        PreparedStatement psdo = null;
        ResultSet rsdo = null;

        Object bean = null;

        try {

            if (tableParts != null) {
                if (tableParts.length == 1) {
                    table = tableParts[0];
                } else if (tableParts.length == 2) {
                    table = tableParts[1];
                    schema = tableParts[0];
                } else if (tableParts.length == 3) {
                    table = tableParts[2];
                    schema = tableParts[1];
                    database = tableParts[0];
                }
            }

            String[] columnsList = null;
            if ("*".equalsIgnoreCase(columns) || "all".equalsIgnoreCase(columns)) {
            } else {
                // TODO : not supported, should review get_recordset ()
                columnsList = null;
                // columnsList = columns.split(",");
            }

            // cerca o cerca il controllo
            workspace tbl_wrk = load_beans_get_workspace(request, databaseSchemaTable, controlId);
            if (tbl_wrk == null) {
                return null;
            }

            boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;
            String itemIdString = "\"", tableIdString = "\"";

            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("postgres.")) || tbl_wrk.dbProductName.toLowerCase().contains("postgres")) {
                isPostgres = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mysql.")) || tbl_wrk.dbProductName.toLowerCase().contains("mysql")) {
                isMySQL = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mariadb.")) || tbl_wrk.dbProductName.toLowerCase().contains("mariadb")) {
                isMySQL = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("oracle.")) || (tbl_wrk.dbProductName != null && tbl_wrk.dbProductName.toLowerCase().contains("oracle"))) {
                isOracle = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("sqlserver.")) || (tbl_wrk.dbProductName != null && tbl_wrk.dbProductName.toLowerCase().contains("sqlserver"))) {
                isSqlServer = true;
            }

            if (isMySQL) {
                itemIdString = "`";
                tableIdString = "";
            } else {
                itemIdString = "\"";
                tableIdString = "\"";
            }

            cols = tbl_wrk.tableJson.getJSONArray("columns");
            for (int ic = 0; ic < cols.length(); ic++) {
                JSONObject col = cols.getJSONObject(ic);
                String colName = null;
                boolean bAddColumn = false;
                try {
                    colName = col.getString("name");
                } catch (Exception e) {
                    colName = null;
                }

                if (columnsList != null) {
                    for (int icl = 0; icl < columnsList.length; icl++) {
                        if (columnsList[icl].equalsIgnoreCase(colName)) {
                            bAddColumn = true;
                            break;
                        }
                    }
                } else {
                    bAddColumn = true;
                }

                if (bAddColumn) {
                    if (column_alias_list.length() > 0) {
                        column_alias_list += ",";
                    }
                    column_alias_list += colName;
                }
            }

            if (where_condition != null && !where_condition.isEmpty()) {
                if (where_condition.toUpperCase().indexOf("WHERE ") < 0) {
                    where_condition = " WHERE " + where_condition;
                } else {
                    where_condition = " " + where_condition;
                }
            }

            String executingQuery = "SELECT * FROM " + tbl_wrk.schemaTable + (where_condition != null ? where_condition : "");

            conn = connection.getConnection(null, request, tbl_wrk.tableJson);

            long lStartTime = System.currentTimeMillis();
            try {
                if (conn != null) {
                    psdo = conn.prepareStatement(executingQuery);
                    rsdo = psdo.executeQuery();
                }
            } catch (Exception e) {
                errors += " [" + (controlId) + "] Query Error:" + e.getLocalizedMessage() + " executingQuery:" + executingQuery + "]" + "[Driver:" + tbl_wrk.driverClass + "]";
                System.err.println(executingQuery);
                System.err.println("// Error:" + e.getLocalizedMessage());
            }
            long lQueryTime = System.currentTimeMillis();

            if (rsdo != null) {
                String fieldValue = null;

                String[] columns_alias = column_alias_list.split(",");
                String[] columns_json = column_json_list != null ? column_json_list.split(",") : null;
                boolean bColumnsResolved = false;

                cols = tbl_wrk.tableJson.getJSONArray("columns");
                int[] colTypes = null; // new int[cols.length()];
                int[] colPrecs = null; // new int[cols.length()];
                int[] colDigits = null; // new int[cols.length()];
                boolean[] colNullable = null; // new boolean[cols.length()];

                // TODO : parametri da valorizzare e debug
                Object[] recordset = get_recordset(tbl_wrk,
                        executingQuery,
                        rsdo,
                        cols,
                        colTypes,
                        colPrecs,
                        colDigits,
                        colNullable,
                        primaryKeyColumn,
                        cRow, startRow, endRow, maxRows,
                        columns_alias,
                        columns_json,
                        null,
                        bColumnsResolved,
                        false,
                        false,
                        -1
                );

                // Freee connection as soon as possible
                if (rsdo != null) {
                    rsdo.close();
                }
                if (psdo != null) {
                    psdo.close();
                }                
                if (conn != null) {
                    if(!conn.getAutoCommit()) {
                        conn.commit();
                    }
                }
                
                // closing the connections (with callbacks)
                connection.closeConnection(conn);
                conn = null;

                if (recordset != null) {
                    // Agginta eventuali errori 
                    // out_values_string += (String)recordset[1];
                    // out_codes_string += (String)recordset[2];
                    // ids = (ArrayList<Long>)recordset[3];
                    errors += (String) recordset[4];

                    String fieldSets = (String) recordset[0];
                    fieldSets = fieldSets != null ? fieldSets.replace("\r", "\\r").replace("\n", "\\n").replace("\t", "\\t").replace("\f", "\\f").replace("\b", "\\b") : "";

                    JSONArray rowsJson = new JSONArray("[" + fieldSets + "]");
                    int resultBean = 0, level = 0;

                    // Array foreign tables di partenza
                    // JSONArray foreignTablesJson = null;
                    // try { foreignTablesJson = tbl_wrk.tableJson.getJSONArray("foreignTables"); } catch(Exception e) {}
                    // Array foreign tables di partenza
                    JSONArray foreignTablesJson = null;
                    try { foreignTablesJson = tbl_wrk.tableJson.getJSONArray("foreignTables"); } catch (Exception e) { }

                    //  Ritorna [ int risultato, Object [] beans, int level, String error, String className };
                    Object[] beanResult = create_beans_multilevel_class(tbl_wrk, rowsJson, foreignTablesJson, "*", level, maxRows);
                    if ((int) beanResult[0] >= 0) {
                        // Updating the foreignTables (some info may be added)
                        try { tbl_wrk.tableJson.put("foreignTables", foreignTablesJson); } catch (Exception e) { }
                        return (ArrayList<Object>) beanResult[1];
                    }
                }
            }

        } catch (Throwable e) {
            errors += "Error:" + e.getLocalizedMessage();
            System.err.println("// get_beans() [" + controlId + "] Error:" + e.getLocalizedMessage());

        } finally {
            // closing the connections (with callbacks)
            connection.closeConnection(conn);
        }
        return null;
    }

    
    /**
     * Load child bean (beanName) from the Object bean (the children are the foreignTables)
     * 
     * @param bean
     * @param beanName
     * @param maxRows
     * 
     * @return Object[] { beans, int nBeans, int nBeansLoaded, String errors, String warning }
     * 
     */
    static public Object[] load_child_bean(Object bean, String beanName, long maxRows) throws Exception {
        return load_bean(bean, beanName, null, maxRows);
    }
    static public Object[] load_child_bean(Object bean, String beanName, long maxRows,long maxLevel) throws Exception {
        return load_bean( bean, beanName, maxRows, maxLevel );
    }
    static public Object[] load_bean(Object bean, String beanName, long maxRows) throws Exception {
        return load_bean(bean, beanName, null, maxRows);
    }

    /**
     * Load parent bean of 'bean'
     * 
     * @param bean
     * @return 
     */
    static public Object load_parent_bean(Object bean, Object params) throws Exception {
        return load_parent_bean(bean, params, 1);
    }
    /**
     * Load parent bean of 'bean'
     * 
     * @param bean
     * @param params the selection
     * @param maxRows max row to load (not used)
     * @return 
     */
    static public Object load_parent_bean(Object bean, Object params, long maxRows) throws Exception {
        Object[] beans_result = load_bean(bean, "$Parent", params, maxRows);
        if (beans_result != null) {
            ArrayList<Object> resultBeasns = (ArrayList<Object>) beans_result[0];
            if (resultBeasns != null) {
                if (resultBeasns.size() > 0) {
                    return resultBeasns.get(0);
                }
            }
        }
        return null;
    }

    

    /**
     * 
     * Load child beans defined by childBeanName foreignTable, looking inside the Object bean
     *      Need selection or rows defined in params (it comes from client)
     * 
     * @param bean
     * @param childBeanName
     * @param params
     * @param maxRows
     * @param maxLevel
     * @return 
     */
    static public Object[] load_bean(Object bean, String childBeanName, Object params, long maxRows, long maxLevel) {
        if(bean != null) {
            ArrayList<String> runtimeForeignTables = new ArrayList<String>();
            // adding initial table@rowId to the anti dead-loop
            runtimeForeignTables.add( String.valueOf( utility.get(bean, "$tableKey") ) );
            return load_bean_internal( bean, childBeanName, params, maxRows, maxLevel, 1L, runtimeForeignTables);
        }
        return null;
    }
    
    /**
     * 
     * Load child beans defined by childBeanName foreignTable, looking inside the Object bean
     *      Need selection or rows defined in params (it comes from client)
     * 
     * @param bean
     * @param childBeanName
     * @param params
     * @param maxRows
     * 
     * @return { ArrayList<Object> beans, int nBeans, int nBeansLoaded, String errors, String warning }
     * 
     */
    static public Object[] load_bean(Object bean, String childBeanName, Object params, long maxRows) throws Exception {
        if(bean != null) {
            if(bean instanceof HttpServletRequest) {
                throw new Exception("wrong load_bean() call ... you pass an http request as bean");
            }
            ArrayList<String> runtimeForeignTables = new ArrayList<String>();
            int maxLevel = 0;
            // adding initial table@rowId to the anti dead-loop
            Object tableKey = utility.get(bean, "$tableKey");
            if(tableKey != null) runtimeForeignTables.add( String.valueOf( tableKey ) );
            return load_bean_internal( bean, childBeanName, params, maxRows, maxLevel, 1L, runtimeForeignTables);
        }
        return null;
    }

    /**
     * used internally
     * Load child beans defined by childBeanName foreignTable, looking inside the Object bean
     *      Need selection or rows defined in params (it comes from client)
     * 
     * @param bean
     * @param childBeanName
     * @param params
     * @param maxRows
     * @param maxLevel
     * @param runtimeForeignTables
     * 
     * @return Object [] { beans, nBeans, nBeansLoaded, errors, warnings }
     * 
     */
    static private Object[] load_bean_internal(Object bean, String childBeanName, Object params, long maxRows, long maxLevel, long curLevel, ArrayList<String> runtimeForeignTables) {
        ArrayList<Object> beans = null;
        int nBeans = 0, nBeansLoaded = 0;
        String errors = "", warnings = "";
        workspace tbl_wrk = null;
        Field field = null;

        try {

            String clasName = bean.getClass().getName();
            if (clasName.equalsIgnoreCase("java.util.ArrayList") || clasName.equalsIgnoreCase("java.util.List")) {
                // wrap to bean
                List<?> list = (List<?>) bean;
                if (list.size() > 0) {
                    bean = (Object) list.get(0);
                }
            }
            ArrayList<String> childBeansName = new ArrayList<String>();
            if("*".equalsIgnoreCase(childBeanName) || "ALL".equalsIgnoreCase(childBeanName)) {
                Field[] fields = bean.getClass().getDeclaredFields();
                for (Field f : fields) {
                    String fieldName = f.getName();
                    Class<?> type = f.getType();

                    if(fieldName.endsWith("$Read")) {
                        String className = fieldName.substring(0, fieldName.length()-5);
                        if(!"$Parent".equalsIgnoreCase(className)) {
                            childBeansName.add(className);
                        }
                    }
                }
            } else {
                childBeansName.add(childBeanName);
            }

            // Process chil beans for read from database ad put to bean
            if(childBeansName != null) {
                for(int ib=0; ib<childBeansName.size(); ib++) {
                    childBeanName = childBeansName.get(ib);

                    // Ricerca nei beans per corrispondenza esatta
                    field = searchProperty(bean, childBeanName, true, true);
                    if (field == null) {
                        // Ricerca nei beans per similitudine
                        field = searchProperty(bean, childBeanName, false, true);
                    }
                    if (field != null) {
                        String beanNameFound = field.getName();
                        String column = null;
                        String foreignTable = null;
                        String foreignColumn = null;
                        String className = null;
                        Object key = null;
                        boolean read = (boolean) utility.get(bean, beanNameFound + "$Read");

                        String beanClassName = bean.getClass().getName();
                        ClassPool pool = ClassPool.getDefault();
                        CtClass cc = pool.get(beanClassName);

                        if (!read) {
                            // assegna la primary key della riga
                            String controlId = new String(cc.getAttribute(beanNameFound + "$controlId"));

                            if ("$Parent".equalsIgnoreCase(beanNameFound)) {
                                // N.B. : recupoero della selezione sul controllo 'controlId' che sta nella request...
                                className = new String(cc.getAttribute(beanNameFound + "$className"));
                                tbl_wrk = workspace.get_tbl_manager_workspace(controlId);
                                if (tbl_wrk != null) {
                                    String ids = workspace.getSelection(((workspace) tbl_wrk).controlId, (String) params);
                                    String[] idsList = workspace.split(ids);
                                    if (idsList != null) {
                                        key = idsList[0];
                                        foreignColumn = ((workspace) tbl_wrk).tableJson.getString("primaryKey");
                                    } else {
                                        warnings = "Bean '" + childBeanName + "' primary key value not defined ... provide your own in order to read parent";
                                    }
                                } else {
                                    errors = "Bean '" + childBeanName + "' has wrong definition, control is missing";
                                }
                            } else {
                                foreignTable = new String(cc.getAttribute(beanNameFound + "$foreignTable"));
                                foreignColumn = new String(cc.getAttribute(beanNameFound + "$foreignCol"));
                                column = new String(cc.getAttribute(beanNameFound + "$column"));
                                className = new String(cc.getAttribute(beanNameFound + "$className"));
                                if (column != null) {
                                    key = (Object) utility.get(bean, column);
                                } else {
                                    errors = "Bean '" + childBeanName + "' has wrong definition, column is missing";
                                }
                            }

                            if (controlId != null) {
                                if (key != null) {
                                    key = utility.removeCommas(key);
                                    if (!String.valueOf(key).isEmpty()) { // N.B.:  : empty string may have link ??? assume this as false

                                        //    
                                        // N.B.: dead loop il triggered by table-wodId couple
                                        //
                                        boolean isInDeadLoop = is_foreign_table_in_dead_loop(runtimeForeignTables, foreignTable, String.valueOf(key) );

                                        if(isInDeadLoop) {
                                            // stop reccursive
                                            warnings += "[read recordset on '" + childBeanName + "' key:''" + key + "in dead loop ]";

                                        } else {

                                            String sRequest = "{\"filtersJson\":[{\"name\":\"" + foreignColumn + "\",\"value\":\"" + key + "\"}]}";
                                            String sRecordset = get_table_recordset(controlId, sRequest, false, maxRows, null);


                                            add_foreign_table_processed(runtimeForeignTables, foreignTable, String.valueOf(key));


                                            JSONObject jsonRecord = new JSONObject(sRecordset);                                
                                            if (jsonRecord != null) {
                                                Class<?> clazz = null;
                                                try {
                                                    clazz = Class.forName(className);
                                                } catch (Throwable e) {
                                                }
                                                if (clazz != null) {
                                                    Object obj = clazz.newInstance();
                                                    JSONArray rowsJson = jsonRecord.getJSONArray("resultSet");
                                                    beans = new ArrayList<Object>();
                                                    nBeans = rowsJson.length();
                                                    if (nBeans > 0) {
                                                        for (int ir = 0; ir < nBeans; ir++) {
                                                            JSONObject row = rowsJson.getJSONObject(ir);
                                                            tbl_wrk = workspace.get_tbl_manager_workspace(controlId);
                                                            Object[] resSet = set_bean_by_json_resultset(obj, tbl_wrk, row);
                                                            if (resSet != null) {
                                                                if (!(boolean) resSet[0]) {
                                                                    errors += "[Error setting row " + (ir + 1) + "/" + (rowsJson.length()) + ":" + ((String) resSet[1]) + "]";
                                                                }
                                                            } else {
                                                                errors += "[Nulll result setting row " + (ir + 1) + "/" + (rowsJson.length()) + "]";
                                                            }
                                                            beans.add(obj);
                                                            nBeansLoaded++;
                                                        }
                                                        // set del risultato sulla propietà del bean
                                                        utility.set(bean, beanNameFound, beans);
                                                        utility.set(bean, beanNameFound + "$Read", true);
                                                        // set changed as false
                                                        try { utility.set(bean, beanNameFound + "$Changed", false); } catch ( NoSuchFieldException nsf) {}

                                                        //
                                                        // Recursive mode : read all child beans
                                                        //
                                                        if(curLevel <= maxLevel || maxLevel <= 0) {
                                                            for (int ic=0; ic<beans.size(); ic++) {
                                                                Object childBean = beans.get(ic);
                                                                if(childBean != null) {
                                                                    Object [] resLoad = load_bean_internal(childBean, "*", null/*params*/, maxRows, maxLevel, curLevel+1, runtimeForeignTables);
                                                                    if(resLoad != null) {
                                                                        if(resLoad[0] != null) {
                                                                            // @return Object [] { beans, nBeans, nBeansLoaded, errors, warnings }
                                                                            nBeansLoaded += (int)resLoad[2];
                                                                            if(resLoad[3] != null) {
                                                                                if(!((String)resLoad[3]).isEmpty()) {
                                                                                    errors += (errors.length() > 0 ? "\n" : "") + resLoad[3];
                                                                                }
                                                                            }
                                                                            if(resLoad[4] != null) {
                                                                                if(!((String)resLoad[4]).isEmpty()) {
                                                                                    warnings += (warnings.length() > 0 ? "\n" : "") + resLoad[4];
                                                                                }
                                                                            }
                                                                        } else {
                                                                            
                                                                                warnings += "[ "+tbl_wrk.tableJson.getString("table") + " : bean is empty ]\n";
                                                                            if(workspace.projectMode) {
                                                                                warnings += "[ *** DBG : child row warning on '" + childBeanName + "' : " + className + " : bean is empty ]\n";
                                                                            }
                                                                        }
                                                                    } else {
                                                                        errors += "[child row error on '" + childBeanName + "' : " + className + " : resLoad is null ]\n";
                                                                    }
                                                                }
                                                            }
                                                        }

                                                    } else {
                                                        errors += "[row not found on '" + childBeanName + "' : " + className + "]\n";
                                                    }
                                                } else {
                                                    errors += "[class not found on '" + childBeanName + "' : " + className + "]\n";
                                                }
                                            } else {
                                                errors += "[read recordset on '" + childBeanName + "' failed ]\n";
                                            }
                                        }
                                    } else {
                                        // key empty
                                    }
                                } else {
                                    warnings = "Bean '" + childBeanName + "' primary key value not defined \n";
                                }
                            } else {
                                errors = "Bean '" + childBeanName + "' has wrong definition, control is missing\n";
                            }
                        } else {
                            // TODO : rilettura del bean ???
                            warnings = "Bean '" + childBeanName + "' already read\n";
                        }
                    } else {
                        // bean non trovato
                        errors = "Bean '" + childBeanName + "' not found in " + bean.getClass().getName() + " (" + bean.getClass().getCanonicalName() + ")\n";
                    }
                }
            }
        } catch (Throwable th) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
            errors = "Bean '" + childBeanName + "' Error : " + th.getLocalizedMessage();
        }
        return new Object[] { beans, nBeans, nBeansLoaded, errors, warnings };
    }

    
    
    interface beansCondition {

        /**
         *
         * @param Bean
         * @return
         */
        public boolean is_valid(Object Bean);
    }

    static public Object[] beansToArray(ArrayList<Object> beans, String propName, ArrayList<Object> targetArray) {
        return beansToArray(beans, propName, targetArray, false, null);
    }

    static public Object[] beansToArray(ArrayList<Object> beans, String propName, ArrayList<Object> targetArray, boolean bDinstinct) {
        return beansToArray(beans, propName, targetArray, bDinstinct, null);
    }

    static public Object[] beansToArray(ArrayList<Object> beans, String propName, ArrayList<Object> targetArray, boolean bDinstinct, beansCondition cond) {
        int nAdded = 0;
        ArrayList<Object> skipperList = new ArrayList<Object>();
        if (beans != null && propName != null && targetArray != null) {
            for (int ib = 0; ib < beans.size(); ib++) {
                Object bean = beans.get(ib);
                Object obj = utility.get(bean, propName);
                boolean bAdd = true;
                if (cond != null) {
                    try {
                        bAdd = ((db.beansCondition) cond).is_valid(bean);
                    } catch (Throwable th) {
                    }
                }
                if (bAdd) {
                    if (bDinstinct) {
                        boolean bFound = false;
                        for (int it = 0; it < targetArray.size(); it++) {
                            if (obj.equals(targetArray.get(it))) {
                                bFound = true;
                                break;
                            }
                        }
                        if (!bFound) {
                            targetArray.add(obj);
                            nAdded++;
                        }
                    } else {
                        targetArray.add(obj);
                        nAdded++;
                    }
                } else {
                    if (skipperList != null) {
                        skipperList.add(obj);
                    }
                }
            }
        }
        return new Object[]{nAdded, skipperList};
    }

    
    
    // Chiamata del client per impostare i prefiltri in sessione
    /**
     * <h3>set the permanent filters</h3>
     * <p>
     * This method is used to get restrictive access to data
     *
     * @param request the http request (HttpServletRequest)
     * @param out the output (JspWriter)
     *
     * @return json of the operation's result (String)
     * @see db
     */
    static public String set_prefilters(HttpServletRequest request, JspWriter out) {
        String retVal = "";
        String executingQuery = null;
        String countQuery = null;
        String table = null, primaryKey = null, out_string = "", error = "";
        JSONObject filtersJson = null;
        JSONArray preFilters = null;
        String controlId = null, tblWrk = null;

        try {

            try {
                controlId = (String) request.getParameter("controlId");
            } catch (Exception e) {
            }
            try {
                tblWrk = (String) request.getParameter("tblWrk");
            } catch (Exception e) {
            }

            String filters = workspace.get_request_content(request);

            try {
                if (filters != null && !filters.isEmpty()) {
                    filtersJson = new JSONObject(filters);
                }
            } catch (Exception e) {
            }

            workspace tbl_wrk = workspace.get_tbl_manager_workspace(tblWrk != null ? tblWrk : controlId);

            String tblWrkDesc = (tblWrk != null ? tblWrk : "") + "." + (controlId != null ? controlId : "");

            if (tbl_wrk != null && tbl_wrk.tableJson != null) {

                long time = System.currentTimeMillis(), timeout = System.currentTimeMillis() + tbl_wrk.timeout * 1000;

                while (tbl_wrk.bLocked && time < timeout) {
                    Thread.sleep(100);
                }
                if (tbl_wrk.bLocked) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, " set_prefilters() [" + controlId + "] Timeout locking workspace");
                    return null;
                }

                try {
                    tbl_wrk.bLocked = true;
                    table = tbl_wrk.tableJson.getString("table");
                    JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
                    JSONArray preFiltersValue = null;

                    try {
                        primaryKey = tbl_wrk.tableJson.getString("primaryKey");
                    } catch (Exception e) {
                    }

                    // Array di valori ?
                    if (filtersJson == null && !filters.isEmpty()) {
                        String[] filterItems = filters.split(",");
                        if (filterItems.length > 0) {
                            for (int ipv = 0; ipv < filterItems.length; ipv++) {
                            }
                        }
                        String fieldPrefilter = primaryKey;
                        preFilters = tbl_wrk.tableJson.getJSONArray("preFilters");
                        if (preFilters != null && preFilters.length() == 1) {
                            fieldPrefilter = ((JSONObject) preFilters.get(0)).getString("name");
                            filtersJson = new JSONObject("{ \"preFilters\":[ { \"name\":\"" + fieldPrefilter + "\",\"value\":\"" + filters + "\"} ] }");
                        }
                    }

                    preFiltersValue = filtersJson != null ? filtersJson.getJSONArray("preFilters") : null;

                    for (int iflt = 0; iflt < preFiltersValue.length(); iflt++) {
                        Object ofilterValue = preFiltersValue.get(iflt);
                        String filterValue = null, filterName = null;
                        if (ofilterValue.getClass() == java.lang.String.class) {
                            filterValue = (String) preFiltersValue.get(iflt);
                        } else if (ofilterValue.getClass() == java.lang.Integer.class) {
                            filterValue = String.valueOf(preFiltersValue.get(iflt));
                        } else {
                            if (ofilterValue.getClass() == JSONArray.class) {
                                // serie di stringhe
                                filterValue = ((String) preFiltersValue.get(iflt));
                            } else {
                                // oggetto
                                filterName = ((JSONObject) preFiltersValue.get(iflt)).getString("name");
                                filterValue = ((JSONObject) preFiltersValue.get(iflt)).getString("value");
                            }

                        }
                        if (filterValue != null) {
                            // Filtri permanenti
                            try {
                                preFilters = (tbl_wrk != null ? tbl_wrk.tableJson.getJSONArray("preFilters") : null);
                            } catch (Exception e) {
                            }
                            if (preFilters != null) {
                                for (int i = 0; i < preFilters.length(); i++) {
                                    JSONObject preFilter = preFilters.getJSONObject(i);
                                    String preFilterTable = null, preFilterValue = null, preFilterOp = null;
                                    try {
                                        String preFilterName = null;
                                        try {
                                            preFilterName = preFilter.getString("name");
                                        } catch (Exception e) {
                                        }
                                        if (filterName != null) {
                                            // nome filtro specificato
                                            if (preFilterName != null) {
                                                if (preFilterName.equalsIgnoreCase(filterName)) {
                                                    preFilter.put("value", filterValue);
                                                    break;
                                                }
                                            }
                                        } else {
                                            // nome filtro su chiave primaria ?
                                            if (primaryKey != null) {
                                                if (preFilterName != null) {
                                                    if (preFilterName.equalsIgnoreCase(primaryKey)) {
                                                        preFilter.put("value", filterValue);
                                                        break;
                                                    }
                                                }
                                            } else {
                                                // nel primo campo
                                                preFilter.put("value", filterValue);
                                                break;
                                            }
                                        }
                                        preFilters.put(i, preFilter);
                                        tbl_wrk.tableJson.put("preFilters", preFilters);

                                    } catch (Exception e) {
                                        System.err.println("// set_prefilters() [" + controlId + "] Error:" + e.getLocalizedMessage());
                                    }
                                }
                            }
                        }
                    }
                    // validazione attraverso l'owner
                    retVal = (String) forwardEvent("onSetPrefilters", (Object) tbl_wrk, (Object) preFilters, (Object) null, (Object) request);

                    request.getSession().setAttribute(tbl_wrk.controlId + ".preFilters", (Object) tbl_wrk.tableJson.getJSONArray("preFilters"));

                } catch (Exception e) {
                    System.err.println("// set_prefilters() [" + controlId + "] Error:" + e.getLocalizedMessage());
                } finally {
                    tbl_wrk.bLocked = false;
                }

            }

        } catch (Exception e) {
            System.err.println("// set_prefilters() [" + controlId + "] Error:" + e.getLocalizedMessage());
        }
        return retVal;
    }

    static public boolean reset_prefilters(workspace tbl_wrk) {
        if (tbl_wrk != null && tbl_wrk.tableJson != null) {
            try {
                tbl_wrk.tableJson.put("preFilters", new JSONArray());
                return true;
            } catch (JSONException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return false;
    }

    static public boolean set_prefilter(workspace tbl_wrk, String fieldName, String fieldValue, String filterOperator) {
        return add_prefilter(tbl_wrk, fieldName, fieldValue, filterOperator);
    }

    static public boolean set_prefilter(workspace tbl_wrk, String fieldName, String fieldValue) {
        return add_prefilter(tbl_wrk, fieldName, fieldValue, null);
    }

    static public boolean add_prefilter(workspace tbl_wrk, String fieldName, String fieldValue) {
        return add_prefilter(tbl_wrk, fieldName, fieldValue, null);
    }

    static public boolean add_prefilter(workspace tbl_wrk, String fieldName, String fieldValue, String filterOperator) {
        if (tbl_wrk != null && tbl_wrk.tableJson != null) {
            JSONArray preFilters = null;
            JSONObject preFilter = null;
            try {
                try {
                    preFilters = (tbl_wrk != null ? tbl_wrk.tableJson.getJSONArray("preFilters") : null);
                } catch (Exception e) {
                }
                if (preFilters != null) {
                    for (int i = 0; i < preFilters.length(); i++) {
                        preFilter = preFilters.getJSONObject(i);
                        String preFilterName = null;
                        try {
                            preFilterName = preFilter.getString("name");
                        } catch (Exception e) {
                        }
                        // nome filtro specificato
                        if (preFilterName != null) {
                            if (preFilterName.equalsIgnoreCase(fieldName)) {
                                preFilter.put("value", fieldValue);
                                if (filterOperator != null && !filterOperator.isEmpty()) {
                                    preFilter.put("op", filterOperator);
                                } else {
                                    preFilter.remove("op");
                                }
                                return true;
                            }
                        }
                    }
                }
                if (preFilters == null) {
                    preFilters = new JSONArray();
                }
                preFilter = new JSONObject();
                preFilter.put("name", fieldName);
                preFilter.put("value", fieldValue);
                if (filterOperator != null && !filterOperator.isEmpty()) {
                    preFilter.put("op", filterOperator);
                }
                preFilters.put(preFilter);
                tbl_wrk.tableJson.put("preFilters", preFilters);
                return true;
            } catch (JSONException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return false;
    }

    static public boolean remove_prefilter(workspace tbl_wrk, String fieldName, String fieldValud) {
        if (tbl_wrk != null && tbl_wrk.tableJson != null) {
            JSONArray preFilters = null;
            try {
                try {
                    preFilters = (tbl_wrk != null ? tbl_wrk.tableJson.getJSONArray("preFilters") : null);
                } catch (Exception e) {
                }
                if (preFilters != null) {
                    for (int i = 0; i < preFilters.length(); i++) {
                        JSONObject preFilter = preFilters.getJSONObject(i);
                        String preFilterName = null;
                        try {
                            preFilterName = preFilter.getString("name");
                        } catch (Exception e) {
                        }
                        if (preFilterName != null) {
                            if (preFilterName.equalsIgnoreCase(fieldName)) {
                                preFilters.remove(i);
                                return true;
                            }
                        }
                    }
                }
            } catch (JSONException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return false;
    }

    // salva in sessione l'ultima query eseguita
    static public String set_query_info(HttpServletRequest request, workspace tbl_wrk,
            String columnList, String columnAliasList,
            String primaryKey, String primaryKeyAlias,
            String sFrom, String sLeftJoinList, String sWhere, String sSort, String sLimit,
            String itemIdString) {
        String retVal = "";
        String controlId = null;

        try {

            controlId = tbl_wrk.controlId;

            if (tbl_wrk != null && tbl_wrk.tableJson != null) {

                long time = System.currentTimeMillis(), timeout = System.currentTimeMillis() + tbl_wrk.timeout * 1000;

                while (tbl_wrk.bLocked && time < timeout) {
                    Thread.sleep(100);
                }
                if (tbl_wrk.bLocked) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, " set_prefilters() [" + controlId + "] Timeout locking workspace");
                    return null;
                }

                try {

                    HttpSession session = request.getSession();

                    tbl_wrk.bLocked = true;

                    session.setAttribute(tbl_wrk.controlId + ".columnList", (Object) columnList);
                    session.setAttribute(tbl_wrk.controlId + ".primaryKey", (Object) primaryKey);
                    // session.setAttribute(tbl_wrk.controlId+".columnAliasList", (Object)columnAliasList);
                    // session.setAttribute(tbl_wrk.controlId+".primaryKeyAlias", (Object)primaryKeyAlias);
                    session.setAttribute(tbl_wrk.controlId + ".from", (Object) sFrom);
                    session.setAttribute(tbl_wrk.controlId + ".join", (Object) sLeftJoinList);
                    session.setAttribute(tbl_wrk.controlId + ".where", (Object) sWhere);
                    session.setAttribute(tbl_wrk.controlId + ".sort", (Object) sSort);
                    session.setAttribute(tbl_wrk.controlId + ".limit", (Object) sLimit);
                    session.setAttribute(tbl_wrk.controlId + ".delimiter", (Object) itemIdString);

                } catch (Exception e) {
                    System.err.println("// set_prefilters() [" + controlId + "] Error:" + e.getLocalizedMessage());
                } finally {
                    tbl_wrk.bLocked = false;
                }
            }

        } catch (Exception e) {
            System.err.println("// set_query_info() [" + controlId + "] Error:" + e.getLocalizedMessage());
        }
        return retVal;
    }

    // carica in sessione l'ultima query eseguita
    static public Object[] get_query_info(HttpServletRequest request, workspace tbl_wrk) {
        String retVal = "";
        String controlId = null;

        try {

            controlId = tbl_wrk.controlId;

            if (tbl_wrk != null && tbl_wrk.tableJson != null) {

                long time = System.currentTimeMillis(), timeout = System.currentTimeMillis() + tbl_wrk.timeout * 1000;

                while (tbl_wrk.bLocked && time < timeout) {
                    Thread.sleep(100);
                }
                if (tbl_wrk.bLocked) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, " set_prefilters() [" + controlId + "] Timeout locking workspace");
                    return null;
                }

                try {

                    HttpSession session = request.getSession();

                    tbl_wrk.bLocked = true;

                    return new Object[]{(Object) session.getAttribute(tbl_wrk.controlId + ".columnList"),
                         (Object) session.getAttribute(tbl_wrk.controlId + ".primaryKey"),
                         (Object) session.getAttribute(tbl_wrk.controlId + ".from"),
                         (Object) session.getAttribute(tbl_wrk.controlId + ".join"),
                         (Object) session.getAttribute(tbl_wrk.controlId + ".where"),
                         (Object) session.getAttribute(tbl_wrk.controlId + ".sort"),
                         (Object) session.getAttribute(tbl_wrk.controlId + ".limit"),
                         (Object) session.getAttribute(tbl_wrk.controlId + ".delimiter")
                    };

                } catch (Exception e) {
                    System.err.println("// set_prefilters() [" + controlId + "] Error:" + e.getLocalizedMessage());
                } finally {
                    tbl_wrk.bLocked = false;
                }

            }

        } catch (Exception e) {
            System.err.println("// set_query_info() [" + controlId + "] Error:" + e.getLocalizedMessage());
        }
        return null;
    }

    /**
     * <h3>Insert a record in a table</h3>
     * <p>
     * This method is used internally to insert a record
     *
     * @param p1 the control workspace (Object)
     * @param p2 the params (Object)
     * @param p3 the clientData (Object)
     * @param p4 the http request (Object)
     * @param p5 the event callback (Object)
     *
     *
     * @return json of the operation's result (String)
     * @see db
     */
    public static String insertFields(Object p1, Object p2, Object p3, Object p4, Object p5) {
        return processModification(p1, p2, p3, p4, p5, "insert");
    }

    /**
     * <h3>Update a record in a table</h3>
     * <p>
     * This method is used internally to update a record
     *
     * @param p1 the control workspace (Object)
     * @param p2 the params (Object)
     * @param p3 the clientData (Object)
     * @param p4 the http request (Object)
     * @param p5 the event callback (Object)
     *
     *
     * @return json of the operation's result (String)
     * @see db
     */
    public static String updateFields(Object p1, Object p2, Object p3, Object p4, Object p5) {
        return processModification(p1, p2, p3, p4, p5, "update");
    }

    /**
     * <h3>Delete a record in a table</h3>
     * <p>
     * This method is used internally to delete a record
     *
     * @param p1 the control workspace (Object)
     * @param p2 the params (Object)
     * @param p3 the clientData (Object)
     * @param p4 the http request (Object)
     * @param p5 the event callback (Object)
     *
     *
     * @return json of the operation's result (String)
     * @see db
     */
    public static String deleteRow(Object p1, Object p2, Object p3, Object p4, Object p5) {
        return processModification(p1, p2, p3, p4, p5, "delete");
    }

    /**
     * 
     * Process modifcations (insert, update, delete)
     * 
     * @param p1 the control workspace (Object)
     * @param p2 the params (Object)
     * @param p3 the clientData (Object)
     * @param p4 the http request (Object)
     * @param p5 the event callback (Object)
     *
     *
     * @return json of the operation's result (String)
     * @see db
     */    
    static public String processModification(Object p1, Object p2, Object p3, Object p4, Object p5, String type) {
        Connection conn = null, connToDB = null, connToUse = null;
        String retVal = "";
        int nForeignUpdates = 0, nUpdates = 0;
        ArrayList<String> foreignTableUpdates = new ArrayList<>();
        ArrayList<String> tableUpdates = new ArrayList<>();
        ArrayList<String> modificationsFaild = new ArrayList<>();
        TransactionList foreignTableTransactList = new TransactionList();
        TransactionList tableTransactList = new TransactionList();
        boolean bUseAutoCommit = false;
        boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;

        try {

            if (p1 != null) {
                workspace liquid = (workspace) p1;
                HttpServletRequest request = (HttpServletRequest) p4;
                String database = null;
                String schema = null;
                String table = null;
                try {
                    database = liquid.tableJson.getString("database");
                } catch (JSONException e) {
                }
                try {
                    schema = liquid.tableJson.getString("schema");
                } catch (JSONException e) {
                }
                try {
                    table = liquid.tableJson.getString("table");
                } catch (JSONException e) {
                }

                if ((liquid.driverClass != null && liquid.driverClass.toLowerCase().contains("postgres.")) || liquid.dbProductName.toLowerCase().contains("postgres")) {
                    isPostgres = true;
                }
                if ((liquid.driverClass != null && liquid.driverClass.toLowerCase().contains("mysql.")) || liquid.dbProductName.toLowerCase().contains("mysql")) {
                    isMySQL = true;
                }
                if ((liquid.driverClass != null && liquid.driverClass.toLowerCase().contains("mariadb.")) || liquid.dbProductName.toLowerCase().contains("mariadb")) {
                    isMySQL = true;
                }
                if ((liquid.driverClass != null && liquid.driverClass.toLowerCase().contains("oracle.")) || (liquid.dbProductName != null && liquid.dbProductName.toLowerCase().contains("oracle"))) {
                    isOracle = true;
                }
                if ((liquid.driverClass != null && liquid.driverClass.toLowerCase().contains("sqlserver.")) || (liquid.dbProductName != null && liquid.dbProductName.toLowerCase().contains("sqlserver"))) {
                    isSqlServer = true;
                }

                String itemIdString = "\"", tableIdString = "\"";
                if (isMySQL) {
                    itemIdString = "`";
                    tableIdString = "";
                } else {
                    itemIdString = "\"";
                    tableIdString = "\"";
                }

                boolean isSystem = false;
                try {
                    liquid.tableJson.getBoolean("isSystem");
                } catch (JSONException e) {
                }
                if (isSystem) {
                    // Persistenza non attiva
                    return "";
                }

                if (p2 != null) {
                    String params = (String) p2;
                    if (params.endsWith("\n")) {
                        params = params.substring(0, params.length() - 1);
                    }

                    JSONArray cols = liquid.tableJson.getJSONArray("columns");
                    JSONObject rootJSON = new JSONObject((String) p2);
                    JSONArray paramsJSON = rootJSON.getJSONArray("params");

                    for (int ip = 0; ip < paramsJSON.length(); ip++) {
                        JSONObject paramJSON = (JSONObject) paramsJSON.get(ip);

                        if (paramJSON.has("autoCommit")) {
                            bUseAutoCommit = paramJSON.getBoolean("autoCommit");
                        }

                        if (paramJSON.has("modifications")) {
                            JSONArray modificationsJSON = paramJSON.getJSONArray("modifications");

                            String jsonType = null;
                            try {
                                jsonType = paramJSON.getString("type");
                            } catch (JSONException e) {
                            }
                            String sType = type != null ? type : (paramJSON.has("type") ? paramJSON.getString("type") : "1");

                            if (modificationsJSON != null) {
                                int[] colTypes = new int[cols.length()];
                                int[] colPrecs = new int[cols.length()];
                                int[] colDigits = new int[cols.length()];
                                for (int ic = 0; ic < cols.length(); ic++) {
                                    try {
                                        colTypes[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("type"));
                                    } catch (NumberFormatException | JSONException e) {
                                    }
                                    try {
                                        colPrecs[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("precision"));
                                    } catch (NumberFormatException | JSONException e) {
                                        colPrecs[ic] = -1;
                                    }
                                    try {
                                        colDigits[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("digits"));
                                    } catch (NumberFormatException | JSONException e) {
                                        colDigits[ic] = -1;
                                    }
                                }
                                for (int im = 0; im < modificationsJSON.length(); im++) {
                                    JSONObject modificationJSON = (JSONObject) modificationsJSON.get(im);
                                    String rowId = "";
                                    String nodeId = "";

                                    if (modificationJSON != null) {
                                        try {
                                            rowId = modificationJSON.getString("rowId");
                                        } catch (Exception e) {
                                        }
                                        try {
                                            nodeId = modificationJSON.getString("nodeId");
                                        } catch (Exception e) {
                                        }
                                        if (rowId != null && !rowId.isEmpty() || "insert".equalsIgnoreCase(sType)) {
                                            JSONArray fieldsJSON = null;
                                            if (modificationJSON.has("fields")) {
                                                fieldsJSON = modificationJSON.getJSONArray("fields");
                                            }
                                            if (p5 != null) {
                                                try {
                                                    ((event.eventCallback) p5).callback(p1, p2, p3, p4, (Object) modificationJSON);
                                                } catch (Throwable th) {
                                                }
                                            }

                                            if (fieldsJSON != null) {
                                                for (int iF = 0; iF < fieldsJSON.length(); iF++) {
                                                    JSONObject fieldJSON = (JSONObject) fieldsJSON.get(iF);
                                                    if (fieldJSON != null) {
                                                        String field = null, value = null;
                                                        int valueType = 0;
                                                        try {
                                                            field = fieldJSON.getString("field");
                                                        } catch (JSONException e) {
                                                        }
                                                        try {
                                                            value = fieldJSON.getString("value");
                                                        } catch (JSONException e) {
                                                        }
                                                        if (field != null && !field.isEmpty() && cols != null) {
                                                            for (int ic = 0; ic < cols.length(); ic++) {
                                                                JSONObject col = cols.getJSONObject(ic);
                                                                String foreignTable = null, foreignColumn = null;
                                                                String foreignEdit = null;
                                                                Boolean foreignBEdit = false;
                                                                String sourceColumn = null;
                                                                String tField = col.getString("field");
                                                                String tName = col.getString("name");
                                                                String[] colParts = tName.split("\\.");
                                                                boolean autoIncString = false;
                                                                try {
                                                                    autoIncString = col.getBoolean("autoIncString");
                                                                } catch (JSONException e) {
                                                                }
                                                                boolean nullable = true;
                                                                try {
                                                                    nullable = col.getBoolean("nullable");
                                                                } catch (Exception e) {
                                                                }
                                                                boolean isExternalField = false;
                                                                boolean addExternalField = false;

                                                                if (tField.equalsIgnoreCase(field)) {

                                                                    if (!autoIncString) {

                                                                        try {
                                                                            foreignTable = col.getString("foreignTable");
                                                                        } catch (Exception e) {
                                                                        }
                                                                        try {
                                                                            foreignColumn = col.getString("foreignColumn");
                                                                        } catch (Exception e) {
                                                                        }
                                                                        try {
                                                                            foreignEdit = col.getString("foreignEdit");
                                                                        } catch (Exception e) {
                                                                        }
                                                                        try {
                                                                            foreignBEdit = col.getBoolean("foreignEdit");
                                                                        } catch (Exception e) {
                                                                        }
                                                                        try {
                                                                            sourceColumn = col.getString("column");
                                                                        } catch (Exception e) {
                                                                        }

                                                                        //
                                                                        // compute the value by metadata
                                                                        //
                                                                        Object[] fres = format_db_value(liquid, colTypes[ic], nullable, value, null);
                                                                        value = (String) fres[0];
                                                                        valueType = (int) fres[1];

                                                                        if (colParts.length > 1 || foreignTable != null && !foreignTable.isEmpty()) {
                                                                            if (colParts.length > 1) {
                                                                                foreignTable = colParts[0];
                                                                            }
                                                                            if (!foreignTable.equalsIgnoreCase(table)) {
                                                                                // campo esterno
                                                                                isExternalField = true;
                                                                                if (foreignBEdit || "y".equalsIgnoreCase(foreignEdit) || "yes".equalsIgnoreCase(foreignEdit) || "s".equalsIgnoreCase(foreignEdit) || "si".equalsIgnoreCase(foreignEdit)) {
                                                                                    if (colParts.length > 1) {
                                                                                        tName = colParts[1];
                                                                                    }
                                                                                    if (foreignColumn != null && !foreignColumn.isEmpty()) {
                                                                                        addExternalField = true;
                                                                                        if ("insert".equalsIgnoreCase(sType)) {
                                                                                            // TODO : Inserimento in tabella esterna : legame con la tabella principale e ignezione degli ID
                                                                                            //          Ma in transazione non sono disponibili : disabilitazione delle transazione e uso dell'autocommit
                                                                                            // foreignTableTransactList.add( col.getString("foreignTable"), tName, value, sourceColumn, null, "insert" );
                                                                                            // bUseAutoCommit = true;
                                                                                        } else if ("delete".equalsIgnoreCase(sType)) {
                                                                                            foreignTableTransactList.add(col.getString("foreignTable"), tName, value, valueType, sourceColumn, null, "delete", rowId, nodeId);
                                                                                        } else if ("update".equalsIgnoreCase(sType)) {
                                                                                            // TODO : lettura dei valori dal client
                                                                                            String foreignValue = "(SELECT " + itemIdString + sourceColumn + itemIdString
                                                                                                    + " FROM " + liquid.schemaTable
                                                                                                    + "\nWHERE " + tableIdString + liquid.tableJson.getString("primaryKey") + tableIdString
                                                                                                    + "=" + rowId + ")";
                                                                                            foreignTableTransactList.add((schema != null ? tableIdString + schema + tableIdString + "." : "") + tableIdString + foreignTable + tableIdString, tName, value, valueType, sourceColumn, foreignColumn + "=" + foreignValue + "", "update", rowId, nodeId);
                                                                                        }
                                                                                    } else {
                                                                                        Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, "Missing foreign column in controlId:" + liquid.controlId + " field:" + col.getString("name"));
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                tName = colParts[1];
                                                                            }
                                                                        } else {
                                                                            tName = colParts[0];
                                                                        }
                                                                        if (!isExternalField) {
                                                                            if ("insert".equalsIgnoreCase(sType)) {
                                                                                tableTransactList.add((schema != null && (isOracle || isPostgres || isSqlServer) ? tableIdString + schema + itemIdString + "." : "") + tableIdString + table + tableIdString, tName, value, valueType, null, null, "insert", rowId, nodeId);

                                                                            } else if ("update".equalsIgnoreCase(sType)) {
                                                                                tableTransactList.add((schema != null && (isOracle || isPostgres || isSqlServer) ? tableIdString + schema + tableIdString + "." : "") + tableIdString + table + tableIdString, tName, value, valueType, null, itemIdString + liquid.tableJson.getString("primaryKey") + itemIdString + "='" + rowId + "'", "update", rowId, nodeId);
                                                                            }
                                                                        }
                                                                    }
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }

                                            if ("delete".equalsIgnoreCase(sType)) {
                                                tableTransactList.add((schema != null && (isOracle || isPostgres || isSqlServer) ? tableIdString + schema + tableIdString + "." : "") + tableIdString + table + tableIdString, null, null, 0, null, itemIdString + liquid.tableJson.getString("primaryKey") + itemIdString + "='" + rowId + "'", "delete", rowId, nodeId);
                                            }

                                            // legame tableTransactList con foreignTableTransactList
                                            if (foreignTableTransactList.transactionList != null) {
                                                for (int i = 0; i < foreignTableTransactList.transactionList.size(); i++) {
                                                    if ("insert".equalsIgnoreCase(foreignTableTransactList.transactionList.get(i).type)) {
                                                        foreignTableTransactList.transactionList.get(i).linkedTransactList = tableTransactList.transactionList;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } else if (paramJSON.has("name")) {
                            String paramName = paramJSON.getString("name");
                            if (liquid.controlId.equalsIgnoreCase(paramName)) {
                                if (paramJSON.has("sel")) {
                                    JSONArray sel = paramJSON.getJSONArray("sel");
                                    if (sel != null) {
                                        for (int iSel = 0; iSel < sel.length(); iSel++) {
                                            String rowId = (String) sel.getString(iSel);
                                            String nodeId = "";
                                            if ("delete".equalsIgnoreCase(type)) {
                                                tableTransactList.add((schema != null && (isOracle || isPostgres || isSqlServer) ? tableIdString + schema + tableIdString + "." : "") + tableIdString + table + tableIdString, null, null, 0, null, itemIdString + liquid.tableJson.getString("primaryKey") + itemIdString + "='" + rowId + "'", "delete", rowId, nodeId);
                                            } else if ("update".equalsIgnoreCase(type)) {
                                                // TODO: where is the data ???
                                                // String field = null, value = null;
                                                // try { field = fieldJSON.getString("field"); } catch (JSONException e) {}
                                                // try { value = fieldJSON.getString("value"); } catch (JSONException e) {}
                                                // tableTransactList.add( (schema != null ? tableIdString+schema+tableIdString + ".":"") + tableIdString+table+tableIdString, tName, value, null, itemIdString+liquid.tableJson.getString("primaryKey") + itemIdString+"='" + rowId + "'", "update", rowId, nodeId);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (tableTransactList.transactionList != null || foreignTableTransactList.transactionList != null) {
                    try {
                        // Connessione al DB ( da predefinita, da JSON o da sessione )
                        conn = connection.getConnection(null, request, liquid.tableJson);
                        // conn = (Connection)(liquid.get_connection != null ? liquid.get_connection.invoke(null) : null);
                    } catch (Exception ex) {
                        Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                    }
                    if (conn != null) {
                        String executingQuery = null;
                        int i = 0;

                        // set the connection
                        connToUse = conn;
                        if (database == null || database.isEmpty()) {
                            database = conn.getCatalog();
                        } else {
                            conn.setCatalog(database);
                            String db = conn.getCatalog();
                            if (!db.equalsIgnoreCase(database)) {
                                // closing the connections (with callbacks)
                                connection.closeConnection(conn);
                                conn = null;
                                connToUse = connToDB = connection.getDBConnection(database);
                            }
                        }

                        if (!bUseAutoCommit) {
                            connToUse.setAutoCommit(false);
                        }

                        try {
                            PreparedStatement preparedStmt = null;
                            if (foreignTableTransactList != null || tableTransactList != null) {
                                if (foreignTableTransactList.transactionList != null) {
                                    for (i = 0; i < foreignTableTransactList.transactionList.size(); i++) {
                                    	executingQuery = null;
                                    	
                                        try {
                                            //
                                            // Print SQL for debug
                                            //
                                            if (workspace.projectMode) {
                                                executingQuery = foreignTableTransactList.getSQL(liquid, i);
                                                System.out.println("Foreign Table Update:" + executingQuery);
                                            }
                                            //
                                            // N.B.: use prepare statemet avoid sql ignection attack
                                            //
                                            int res = 0;
                                            Object[] resArray = foreignTableTransactList.executeSQL(liquid, i, connToUse, Statement.RETURN_GENERATED_KEYS);
                                            res = (int) resArray[0];
                                            preparedStmt = (PreparedStatement) resArray[1];
                                            if (res > 0) {
                                                nForeignUpdates++;
                                                ResultSet rs = preparedStmt.getGeneratedKeys();
                                                if (rs != null) {
                                                    String idsList = "";
                                                    while (rs.next()) {
                                                        idsList += (idsList.length() > 0 ? "," : "") + rs.getString(1);
                                                    }
                                                    foreignTableUpdates.add("{\"table\":\"" + foreignTableTransactList.transactionList.get(i).table.replace(itemIdString, "") + "\",\"ids\":[" + idsList + "]}");
                                                    foreignTableTransactList.transactionList.get(i).ids = idsList;
                                                    if (foreignTableTransactList.transactionList.get(i).sourceColumn != null) {
                                                        // ignezione in foreignTableTransactList.transactionList.get(i).sourceColumn del id creato
                                                        if (foreignTableTransactList.transactionList.get(i).linkedTransactList != null) {
                                                            for (int j = 0; j < foreignTableTransactList.transactionList.get(i).linkedTransactList.size(); j++) {
                                                                TransactionList linkedTransact = foreignTableTransactList.transactionList.get(i).linkedTransactList.get(j);
                                                                if (!linkedTransact.columns.contains(foreignTableTransactList.transactionList.get(i).sourceColumn)) {
                                                                    linkedTransact.columns.add(foreignTableTransactList.transactionList.get(i).sourceColumn);
                                                                    linkedTransact.values.add(idsList);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    rs.close();
                                                }
                                            }
                                        } catch (Throwable th) {
                                        	if(executingQuery == null)
                                        		executingQuery = foreignTableTransactList.getSQL(liquid, i);
                                            String tableDesc = foreignTableTransactList.transactionList.get(i).table.replace(itemIdString, "");
                                            foreignTableUpdates.add("{\"table\":\"" + tableDesc + "\",\"ids\":[], \"error\":\"" + utility.base64Encode(tableDesc+" : "+th.getLocalizedMessage()) + "\", \"query\":\"" + utility.base64Encode(executingQuery) + "\" }");
                                            String fieldValue = foreignTableTransactList.transactionList.get(i).rowId;
                                            fieldValue = fieldValue != null ? fieldValue.replace("\\", "\\\\").replace("\"", "\\\"") : "";
                                            modificationsFaild.add("{\"rowId\":\"" + fieldValue + "\",\"nodeId\":\"" + tableTransactList.transactionList.get(i).nodeId + "\"}");
                                        }
                                    }
                                }

                                if (tableTransactList.transactionList != null) {
                                    for (i = 0; i < tableTransactList.transactionList.size(); i++) {
                                    	executingQuery = null;
                                        try {
                                            if (workspace.projectMode) {
                                                executingQuery = tableTransactList.getSQL(liquid, i);
                                                System.out.println("Query:" + executingQuery);
                                            }
                                            int res = 0;
                                            Object[] resArray = tableTransactList.executeSQL(liquid, i, connToUse, Statement.RETURN_GENERATED_KEYS);
                                            res = (int) resArray[0];
                                            preparedStmt = (PreparedStatement) resArray[1];
                                            if (res > 0) {
                                                nUpdates++;
                                                if (!"delete".equalsIgnoreCase(tableTransactList.getType(liquid, i))) {
                                                    ResultSet rs = preparedStmt.getGeneratedKeys();
                                                    if (rs != null) {
                                                        String idsList = "";
                                                        while (rs.next()) {
                                                            idsList += (idsList.length() > 0 ? "," : "") + rs.getString(1);
                                                        }
                                                        tableUpdates.add("{\"table\":\"" + liquid.schemaTable.replace(tableIdString, "") + "\",\"ids\":[" + idsList + "]}");
                                                        rs.close();
                                                    } else {
                                                        tableUpdates.add("{\"table\":\"" + liquid.schemaTable.replace(tableIdString, "") + "\",\"ids\":[" + tableTransactList.transactionList.get(i).ids + "]}");
                                                    }
                                                } else {
                                                    tableUpdates.add("{\"table\":\"" + liquid.schemaTable.replace(tableIdString, "") + "\",\"ids\":[" + tableTransactList.transactionList.get(i).ids + "]}");
                                                }
                                            }
                                        } catch (Throwable th) {
                                            if(executingQuery == null)
                                            	executingQuery = tableTransactList.getSQL(liquid, i);
                                            String tableDesc = liquid.schemaTable.replace(tableIdString, "");
                                            tableUpdates.add("{\"table\":\"" + tableDesc + "\",\"ids\":[], \"error\":\"" + utility.base64Encode(tableDesc+" : "+th.getLocalizedMessage()) + "\", \"query\":\"" + utility.base64Encode(executingQuery) + "\" }");
                                            String fieldValue = tableTransactList.transactionList.get(i).rowId;
                                            fieldValue = fieldValue != null ? fieldValue.replace("\\", "\\\\").replace("\"", "\\\"") : "";
                                            modificationsFaild.add("{\"rowId\":\"" + fieldValue + "\",\"nodeId\":\"" + tableTransactList.transactionList.get(i).nodeId + "\"}");
                                        }
                                    }
                                }

                                if (!bUseAutoCommit) {
                                    connToUse.commit();
                                }

                                if (preparedStmt != null) {
                                    preparedStmt.close();
                                }
                            }

                            retVal = "{"
                                    + "\"tables\":["
                                    + workspace.arrayToString(tableUpdates.toArray(), null, null, ",")
                                    + "], \"foreignTables\":["
                                    + workspace.arrayToString(foreignTableUpdates.toArray(), null, null, ",")
                                    + "], \"fails\":["
                                    + workspace.arrayToString(modificationsFaild.toArray(), null, null, ",")
                                    + "]"
                                    + "}";

                        } catch (Throwable th) {
                            if (!bUseAutoCommit) {
                                connToUse.rollback();
                            }
                            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
                            Logger.getLogger(db.class.getName()).log(Level.SEVERE, executingQuery);
                            retVal = "{\"error\":\"" + utility.base64Encode("Fatal error:" + th.getLocalizedMessage()) + "\"}";
                        }
                    }
                }
            }

        } catch (Throwable th) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
            retVal = "{\"error\":\"" + utility.base64Encode("Fatal error:" + th.getLocalizedMessage()) + "\"}";

        } finally {
            // closing the connections (with callbacks)
            connection.closeConnection(conn);

            // closing the connections (with callbacks)
            connection.closeConnection(connToDB);
        }
        return retVal;
    }

    static public String getFieldName(workspace liquid, String field) {
        try {
            if (liquid != null) {
                JSONArray cols = liquid.tableJson.getJSONArray("columns");
                if (cols != null) {
                    for (int ic = 0; ic < cols.length(); ic++) {
                        JSONObject col = cols.getJSONObject(ic);
                        String tField = col.getString("field");
                        if (field.equalsIgnoreCase(tField)) {
                            return col.getString("name");
                        }
                    }
                }
            }
        } catch (Exception ex) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    static public int getFieldPosition(workspace liquid, String name) {
        try {
            if (liquid != null) {
                JSONArray cols = liquid.tableJson.getJSONArray("columns");
                if (cols != null) {
                    for (int ic = 0; ic < cols.length(); ic++) {
                        JSONObject col = cols.getJSONObject(ic);
                        String tName = col.getString("name");
                        if (name.equalsIgnoreCase(tName)) {
                            return (ic + 1);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
        }
        return 0;
    }

    public static String getLocalDate(String value, int colType, boolean nullable) {
        String result = null;
        // DateTimeFormatter formatter = null;
        if (colType == 6 || colType == 93) { // datetime
            if (value == null || value.isEmpty()) {
                if (!nullable) {
                    return "0000-00-00 00" + workspace.timeSep + "00" + workspace.timeSep + "00";
                } else {
                    return null;
                }
            } else {
                String dateValue = value;
                if (dateValue.length() > 19) {
                    dateValue = value.substring(0, 19);
                }
                String[] pattern = {"dd-MM-yyyy HH:mm:ss.SS", "dd-MM-yyyy HH:mm:ss", "dd/MM/yyyy HH:mm:ss", "dd-MM-yyyy H:m:s", "dd-MM-yyyy", "dd/MM/yyyy", "d-M-yyyy"};
                for (String pattern1 : pattern) {
                    try {
                        // formatter = DateTimeFormatter.ofPattern(pattern1);
                        // LocalDateTime dateTime = LocalDateTime.parse(dateValue, formatter);
                        // return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd H:m:s"));
                        DateFormat dateFormat = new SimpleDateFormat(pattern1);
                        java.util.Date valueDate = dateFormat.parse(value);
                        DateFormat dateFormat2 = new SimpleDateFormat("yyyy-MM-dd H:m:s");
                        return dateFormat2.format(valueDate);
                    } catch (Throwable ex) {
                    }
                }
            }
        } else if (colType == 91) { // date
            if (value == null || value.isEmpty()) {
                if (!nullable) {
                    return "0000-00-00";
                } else {
                    return null;
                }
            } else {
                String[] pattern = {"dd-MM-yyyy", "dd/MM/yyyy", "d-M-yyyy", "d/M/yyyy", "d-M-yy", "d/M/yy"};
                for (String pattern1 : pattern) {
                    try {
                        DateFormat dateFormat = new SimpleDateFormat(pattern1);
                        java.util.Date valueDate = dateFormat.parse(value);
                        DateFormat dateFormat2 = new SimpleDateFormat("yyyy-MM-dd");
                        return dateFormat2.format(valueDate);
                        // JAVA MERDA : "10/02/2020" con "dd/MM/yyyy" -> Text  could not be parsed at index 2 e could not be parsed: Unable to obtain LocalDateTime from TemporalAccessor: {},ISO resolved to 2020-02-10 of type java.time.format.Parsed
                        // formatter = DateTimeFormatter.ofPattern(pattern1);
                        // LocalDateTime dateTime = LocalDateTime.parse(value, formatter);
                        // result = dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    } catch (Throwable ex) {
                    }
                }
            }
        }
        return value;
    }

    public static String getLocalTime(String value, int colType, boolean nullable) {
        String result = null;
        // DateTimeFormatter formatter = null;
        if (colType == 92) { // time
            if (value == null || value.isEmpty()) {
                if (!nullable) {
                    return "00" + workspace.timeSep + "00" + workspace.timeSep + "00";
                } else {
                    return null;
                }
            } else {
                String timeValue = value;
                if (timeValue.length() > 19) {
                    timeValue = value.substring(0, 19);
                }
                String[] pattern = {"HH:mm:ss.SS", "HH:mm:ss", "HH:mm:ss", "H:m:s"};
                for (String pattern1 : pattern) {
                    try {
                        DateFormat dateFormat = new SimpleDateFormat(pattern1);
                        java.util.Date valueDate = dateFormat.parse(value);
                        DateFormat dateFormat2 = new SimpleDateFormat("H:m:s");
                        return dateFormat2.format(valueDate);
                    } catch (Throwable ex) {
                    }
                }
            }
        }
        return value;
    }

    static public Object[] format_db_value(workspace tbl_wrk, int colTypes, boolean nullable, String value, String operator) {

        boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;

        if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("postgres.")) || tbl_wrk.dbProductName.toLowerCase().contains("postgres")) {
            isPostgres = true;
        }
        if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mysql.")) || tbl_wrk.dbProductName.toLowerCase().contains("mysql")) {
            isMySQL = true;
        }
        if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mariadb.")) || tbl_wrk.dbProductName.toLowerCase().contains("mariadb")) {
            isMySQL = true;
        }
        if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("oracle.")) || (tbl_wrk.dbProductName != null && tbl_wrk.dbProductName.toLowerCase().contains("oracle"))) {
            isOracle = true;
        }
        if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("sqlserver.")) || (tbl_wrk.dbProductName != null && tbl_wrk.dbProductName.toLowerCase().contains("sqlserver"))) {
            isSqlServer = true;
        }
        int valueType = 1; // srting
        
        if (colTypes == 8 || colTypes == 7) { // float
            value = value.replace(",", ".");
        }

        if (colTypes == 6 || colTypes == 91 || colTypes == 93) { // date, datetime
            value = getLocalDate(value, colTypes, nullable);
            if (value != null) {
                // refine
                if (isOracle || isPostgres) {
                    if (colTypes == 6 || colTypes == 91 || colTypes == 93) { // date, datetime
                        value = "TO_DATE('" + value + "', 'YYYY-MM-DD HH24:MI:SS')";
                        valueType = 0; // is an expression
                        // > of means at the end of the day
                        /*
                        if(value != null && value.length() <= 10) {
                        	if(">=".equalsIgnoreCase(operator) || ">".equalsIgnoreCase(operator)) {
                        		value += "+1";
                        	}
                        }
                        */
                    } else if (colTypes == 91) { // date
                        value = "TO_DATE('" + value + "', 'YYYY-MM-DD')";
                        valueType = 0; // is an expression
                    }
                } else if (isMySQL) {
                    if (colTypes == 6 || colTypes == 91 || colTypes == 93) { // date, datetime
                        value = "STR_TO_DATE('" + value + "', '%Y-%m-%d %H:%i:%s')";
                        valueType = 0; // is an expression
                        // > of means at the end of the day
                        /*
                        if(value != null && value.length() <= 10) {
                        	if(">=".equalsIgnoreCase(operator) || ">".equalsIgnoreCase(operator)) {
                        		value += "+1";
                        	}
                        }
                        */
                    } else if (colTypes == 91) { // date
                        value = "STR_TO_DATE('" + value + "', '%Y-%m-%d')";
                        valueType = 0; // is an expression
                    }
                } else if (isSqlServer) {
                    if (colTypes == 6 || colTypes == 91 || colTypes == 93) { // date, datetime
                        value = "CONVERT(DATETIME,'" + value + "')";
                        valueType = 0; // is an expression
                    } else if (colTypes == 91) { // date
                        value = "CONVERT(DATETIME,'" + value + ")";
                        valueType = 0; // is an expression
                    }
                }
            }
        } else if (colTypes == 92) { // time
            // TODO: 24/09/2020 Test to do
            value = getLocalTime(value, colTypes, nullable);
            if (value != null) {
                // refine
                if (isOracle || isPostgres) {
                    value = "TO_DATE('" + value + "', 'HH24:MI:SS')";
                    valueType = 1; // is an expression
                } else if (isMySQL) {
                    value = "STR_TO_DATE('" + value + "', '%H:%i:%s')";
                    valueType = 1; // is an expression
                } else if (isSqlServer) {
                    value = "CONVERT(DATETIME,'" + value + ")";
                    valueType = 1; // is an expression
                }
            }
        } else if (colTypes == 8 || colTypes == 7 || colTypes == 4 || colTypes == 3 || colTypes == -5 || colTypes == -6 || colTypes == -7) {
            // numeric
            if (value == null || value.isEmpty()) {
                value = "0";
            }
            valueType = colTypes; // is a number
            
        } else if (colTypes == -7) { // 
            value = value.isEmpty() ? null : value;
        }

        return new Object[]{value, valueType};
    }

    /* Only Java 8

    // "dd-MM-yyyy HH:mm:ss.SS" sa risolvere per secondi di 00+0.1
    
    public static String getLocalDateFromDB (String value, int colType, boolean nullable) {
        String result = null;
        DateTimeFormatter formatter = null;
        if(colType == 6 || colType == 93) { // datetime
            if(value== null || value.isEmpty()) {
                if(!nullable)
                    return "00-00-0000 00:00:00";
                else
                    return null;
            } else {
                String dateValue = value;
                if(dateValue.length()>19)
                    dateValue = value.substring(0, 19);
                String [] pattern = { "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd H:m:s", "yy-M-d HH:mm:ss", "yy-M-d H:m:s" };
                for (String pattern1 : pattern) {
                    try {
                        formatter = DateTimeFormatter.ofPattern(pattern1);
                        LocalDateTime dateTime = LocalDateTime.parse(dateValue, formatter);
                        return dateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
                    }catch (Throwable ex) {  }
                }
            }
        } else if(colType == 91) { // date
            if(value== null || value.isEmpty()) {
                if(!nullable)
                    return "00-00-0000";
                else
                    return null;
            } else {
                String dateValue = value;
                String [] pattern = { "yyyy-MM-dd" };
                if(dateValue.length()>10)
                    dateValue = value.substring(0, 10);
                for (String pattern1 : pattern) {
                    try {
                        DateFormat dateFormat = new SimpleDateFormat(pattern1);
                        java.util.Date valueDate = dateFormat.parse(value);
                        DateFormat dateFormat2 = new SimpleDateFormat("dd/MM/yyyy");
                        return dateFormat2.format(valueDate);                    
                    } catch (Throwable ex) {  }
                }
            }
        }
        return value;
    }
     */
    static public String count_occurences_by_column(HttpServletRequest request, String operation, JspWriter out) {
        Connection conn = null;
        String executingQuery = null;
        String out_string = "", error = "";
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        long addedRow = 0;
        JSONObject requestJson = null;
        String controlId = null, tblWrk = null, columnsResolved = null, targetDatabase = null, targetSchema = null, targetTable = null, targetView = null,
                targetColumn = null, sRequest = null;
        long lStartTime = 0, lQueryTime = 0, lRetrieveTime = 0;

        try {

            try {
                controlId = (String) request.getParameter("controlId");
            } catch (Exception e) {
            }
            try {
                tblWrk = (String) request.getParameter("tblWrk");
            } catch (Exception e) {
            }
            try {
                targetDatabase = (String) request.getParameter("targetDatabase");
            } catch (NumberFormatException e) {
            }
            try {
                targetSchema = (String) request.getParameter("targetSchema");
            } catch (NumberFormatException e) {
            }
            try {
                targetTable = (String) request.getParameter("targetTable");
            } catch (NumberFormatException e) {
            }
            try {
                targetColumn = (String) request.getParameter("targetColumn");
            } catch (NumberFormatException e) {
            }

            sRequest = workspace.get_request_content(request);
            try {
                if (sRequest != null && !sRequest.isEmpty()) {
                    requestJson = new JSONObject(sRequest);
                }
            } catch (Exception e) {
                System.err.println(e.getLocalizedMessage());
            }

            out_string += "{\"resultSet\":[";

            String table = "";
            String database = "";
            String schema = "";

            String schemaTable = null;
            String databaseSchemaTable = null;
            workspace tbl_wrk = workspace.get_tbl_manager_workspace(tblWrk != null ? tblWrk : controlId);
            String tblWrkDesc = (tblWrk != null ? tblWrk + "." : "") + (controlId != null ? controlId : "");
            boolean isOracle = false;
            boolean isMySQL = false;
            boolean isPostgres = false;
            boolean isSqlServer = false;

            if (tbl_wrk != null) {
                try {
                    conn = connection.getConnection(null, request, tbl_wrk.tableJson);
                } catch (Exception ex) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                }
            }

            String itemIdString = "\"", tableIdString = "\"";
            if (conn != null) {
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("postgres.")) || tbl_wrk.dbProductName.toLowerCase().contains("postgres")) {
                isPostgres = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mysql.")) || tbl_wrk.dbProductName.toLowerCase().contains("mysql")) {
                isMySQL = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mariadb.")) || tbl_wrk.dbProductName.toLowerCase().contains("mariadb")) {
                isMySQL = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("oracle.")) || (tbl_wrk.dbProductName != null && tbl_wrk.dbProductName.toLowerCase().contains("oracle"))) {
                isOracle = true;
            }
            if ((tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("sqlserver.")) || (tbl_wrk.dbProductName != null && tbl_wrk.dbProductName.toLowerCase().contains("sqlserver"))) {
                isSqlServer = true;
            }
            if (isMySQL) {
                itemIdString = "`";
                tableIdString = "";
            } else {
                itemIdString = "\"";
                tableIdString = "\"";
            }

            if (tbl_wrk != null && tbl_wrk.tableJson != null) {

                try {
                    database = tbl_wrk.tableJson.getString("database");
                } catch (Exception e) {
                }
                try {
                    schema = tbl_wrk.tableJson.getString("schema");
                } catch (Exception e) {
                }
                try {
                    table = tbl_wrk.tableJson.getString("table");
                } catch (Exception e) {
                }
                JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");

                if (targetDatabase == null || targetDatabase.isEmpty()) {
                    targetDatabase = database;
                }
                if (targetSchema == null || targetSchema.isEmpty()) {
                    targetSchema = schema;
                }
                if (targetTable == null || targetTable.isEmpty()) {
                    targetTable = table;
                }

                if (targetColumn != null && !targetColumn.isEmpty()) {
                    String[] colParts = targetColumn.split("\\.");

                    if (colParts.length > 1) {
                        targetColumn = colParts[colParts.length - 1];
                    }

                    // Controllo definizione database / database richiesto
                    if (!check_database_definition(conn, database)) {
                        System.out.println("LIQUID WARNING : database defined by driver :" + conn.getCatalog() + " requesting database:" + database);
                    }
                    executingQuery = "SELECT " + itemIdString + targetColumn + itemIdString + ",count(*) from " + tableIdString + targetSchema + tableIdString + "." + tableIdString + targetTable + tableIdString + " GROUP BY " + itemIdString + targetColumn + itemIdString + "";

                    lStartTime = System.currentTimeMillis();
                    try {
                        if (conn != null) {
                            psdo = conn.prepareStatement(executingQuery);
                            rsdo = psdo.executeQuery();
                        }
                    } catch (Exception e) {
                        try {
                            itemIdString = "";
                            executingQuery = "SELECT " + itemIdString + targetColumn + itemIdString + ",count(*) from " + tableIdString + targetSchema + tableIdString + "." + tableIdString + targetTable + tableIdString + " GROUP BY " + itemIdString + targetColumn + itemIdString + "";
                            psdo = conn.prepareStatement(executingQuery);
                            rsdo = psdo.executeQuery();
                        } catch (Exception e2) {
                            error += " [" + (tblWrkDesc) + "] Query Error:" + e2.getLocalizedMessage() + " executingQuery:" + executingQuery + "]" + "[Driver:" + tbl_wrk.driverClass + "]";
                            System.err.println(executingQuery);
                            System.err.println("// Error:" + e2.getLocalizedMessage());
                        }
                    }
                    lQueryTime = System.currentTimeMillis();
                    if (rsdo != null) {
                        while (rsdo.next()) {
                            out_string += (addedRow > 0 ? "," : "") + "{";
                            out_string += "\"" + "1" + "\":\"" + rsdo.getString(1) + "\"";
                            out_string += ",\"" + "2" + "\":\"" + rsdo.getString(2) + "\"";
                            out_string += "}";
                            addedRow++;
                        }
                    }
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println("// count_occurences_by_column() [" + controlId + "] Error:" + e.getLocalizedMessage());
        } finally {
            try {
                if (rsdo != null) {
                    rsdo.close();
                }
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
            try {
                if (psdo != null) {
                    psdo.close();
                }
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
            try {
                if (conn != null) {
                    if(!conn.getAutoCommit()) {
                        conn.commit();
                    }
                }
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
            // closing the connections (with callbacks)
            connection.closeConnection(conn);
        }

        out_string += "]";
        out_string += ",\"queryTime\":" + (lQueryTime - lStartTime);
        out_string += ",\"retrieveTime\":" + (lRetrieveTime - lQueryTime);
        out_string += ",\"query\":\"" + utility.base64Encode((executingQuery != null ? executingQuery : "N/D")) + "\"";
        out_string += ",\"error\":\"" + utility.base64Encode((error != null ? error : "")) + "\"";
        out_string += "}";

        return out_string;
    }

    static String getDriver(Connection conn) throws SQLException {
        if (conn != null) {
            String dbProductName = conn.getMetaData().getDatabaseProductName();
            String driverClass = conn != null ? conn.getClass().getName() : null;

            if ((driverClass != null && driverClass.toLowerCase().contains("postgres.")) || dbProductName.toLowerCase().contains("postgres")) {
                return "postgres";
            }
            if ((driverClass != null && driverClass.toLowerCase().contains("mysql.")) || dbProductName.toLowerCase().contains("mysql")) {
                return "mysql";
            }
            if ((driverClass != null && driverClass.toLowerCase().contains("mariadb.")) || dbProductName.toLowerCase().contains("mariadb")) {
                return "mariadb";
            }
            if ((driverClass != null && driverClass.toLowerCase().contains("oracle.")) || (dbProductName != null && dbProductName.toLowerCase().contains("oracle"))) {
                return "oracle";
            }
            if ((driverClass != null && driverClass.toLowerCase().contains("sqlserver.")) || (dbProductName != null && dbProductName.toLowerCase().contains("sqlserver"))) {
                return "sqlserver";
            }
            return "unknown:" + dbProductName;
        }
        return "no connection";
    }

    // Metodo aggiornamento db da bean
    /**
     * <h3>Insert or update the bean into the database</h3>
     * <p>
     * This method execute an insert or update statement by the given bean
     *
     * @param bean bean to insert or update (Object)
     * @param tbl_wrk the table workspace of the control (Object)
     *
     * @return the detail of operation as json object { "tables":[ {
     * "table":"table name", "ids":[ list of changed primary keys ] } ]
     * ,"foreignTables":[ { "table":"table name", "ids":[ list of changed
     * primary keys ] } ] ,"fails":[" { "table":"table name", "ids":[ list of
     * changed primary keys ] } ] }
     * @see db
     */
    static public String save(Object bean, Object tbl_wrk) {
        return insert(bean, tbl_wrk);
    }

    /**
     * <h3>Insert or update the bean to the database</h3>
     * <p>
     * This method execute an insert statement by the given bean
     *
     * @param bean bean to insert (Object)
     * @param tbl_wrk the table workspace of the control (Object)
     *
     * @return the detail of operation as json object { "tables":[ {
     * "table":"table name", "ids":[ list of changed primary keys ] } ]
     * ,"foreignTables":[ { "table":"table name", "ids":[ list of changed
     * primary keys ] } ] ,"fails":[" { "table":"table name", "ids":[ list of
     * changed primary keys ] } ] }
     * @see db
     */
    static public String insertUpdate(Object bean, Object tbl_wrk) throws JSONException, NoSuchFieldException, IllegalArgumentException, IllegalAccessException {
        workspace tblWrk = (workspace)tbl_wrk;
        String primaryKey = tblWrk.tableJson.getString("primaryKey");
        String databaseSchemaTable = null;
        Object primaryKeyValue = utility.get(bean, primaryKey);
        boolean foundRow = false;
        if(primaryKeyValue != null) {
            String where_condition = "";
            ArrayList<Object> selectedBeans = null;
            boolean isEmpty = false;
            if(primaryKeyValue instanceof String) {
                if(((String)primaryKeyValue).isEmpty()) isEmpty = true;
            } else if(primaryKeyValue instanceof Integer) {
                if(((Integer)primaryKeyValue) == 0) isEmpty = true;
            } else if(primaryKeyValue instanceof Long) {
                if(((Long)primaryKeyValue) == 0) isEmpty = true;
            }
            if(!isEmpty) {
                try {
                    selectedBeans = load_beans((HttpServletRequest)null, tblWrk.controlId, databaseSchemaTable, "*", primaryKey, primaryKeyValue, 1);
                } catch (Throwable ex) {}
                if(selectedBeans != null) {
                    if(selectedBeans.size() > 0) {
                        Object selectedBean = selectedBeans.get(0);
                        foundRow = true;
                        JSONArray cols = tblWrk.tableJson.getJSONArray("columns");
                        for (int ic = 0; ic < cols.length(); ic++) {
                            JSONObject col = cols.getJSONObject(ic);
                            Object oSelectedValue = utility.get(selectedBean, col.getString("name"));
                            Object oValue = utility.get(bean, col.getString("name"));
                            if(!oSelectedValue.equals(oValue)) {
                                utility.setChanged(bean, col.getString("name"), true);
                            }
                        }
                    }
                }
            }
        }
        if(foundRow) {        
            return update(bean, tbl_wrk);
        } else {
            return insert(bean, tbl_wrk, null);
        }
    }
    
    /**
     * <h3>Insert the bean to the database</h3>
     * <p>
     * This method execute an insert statement by the given bean
     *
     * @param bean bean to insert (Object)
     * @param tbl_wrk the table workspace of the control (Object)
     *
     * @return the detail of operation as json object { "tables":[ {
     * "table":"table name", "ids":[ list of changed primary keys ] } ]
     * ,"foreignTables":[ { "table":"table name", "ids":[ list of changed
     * primary keys ] } ] ,"fails":[" { "table":"table name", "ids":[ list of
     * changed primary keys ] } ] }
     * @see db
     */
    static public String insert(Object bean, Object tbl_wrk) {
        return insert(bean, tbl_wrk, null);
    }
    static public String insert(Object bean, Object tbl_wrk, String foreignTables) {
        String result = null;
        try {
            if(tbl_wrk != null) {
                if(bean != null) {
                    String sModifications = "";
                    String sFields = "";
                    workspace tblWrk = (workspace) tbl_wrk;
                    JSONArray cols = tblWrk.tableJson.getJSONArray("columns");

                    for (int ic = 0; ic < cols.length(); ic++) {
                        JSONObject col = cols.getJSONObject(ic);
                        Object oFieldValue = utility.get(bean, col.getString("name"));
                        String fieldValue = null;
                        if(oFieldValue != null) {
                            if(oFieldValue instanceof Date || oFieldValue instanceof Timestamp) {
                                // N.B.: modification come from UI, date is dd/MM/yyyy HH:mm:ss
                                DateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
                                fieldValue = dateFormat.format(oFieldValue);
                            } else { 
                                fieldValue = String.valueOf(oFieldValue);
                            }
                        } else { 
                            fieldValue = null;
                        }                        
                        fieldValue = fieldValue != null ? fieldValue.replace("\\", "\\\\").replace("\"", "\\\"") : "";
                                
                        sFields += (sFields.length() > 0 ? "," : "") + "{\"field\":\"" + cols.getJSONObject(ic).getString("field") + "\",\"value\":\"" + fieldValue + "\"}";
                    }
                    sModifications += "{\"rowId\":\"\",\"fields\":[" + sFields + "]}";

                    String insertingParams = "{ \"params\":[{\"modifications\":[" + sModifications + "] } ] }";

                    //
                    // do insert
                    //
                    result = db.insertFields(tbl_wrk, insertingParams, null, null, null);
                    
                    if(foreignTables != null && !foreignTables.isEmpty()) {
                        //
                        // Peocess child beans (foreign tables) for insert
                        //
                        
                        ArrayList<String> childBeansName = new ArrayList<String>();
                        if("*".equalsIgnoreCase(foreignTables) || "ALL".equalsIgnoreCase(foreignTables)) {
                            Field[] fields = bean.getClass().getDeclaredFields();
                            for (Field f : fields) {
                                String fieldName = f.getName();
                                Class<?> type = f.getType();

                                if(fieldName.endsWith("$Read")) {
                                    String className = fieldName.substring(0, fieldName.length()-5);
                                    if(!"$Parent".equalsIgnoreCase(className)) {
                                        childBeansName.add(className);
                                    }
                                }
                            }
                        } else {
                            childBeansName.add(foreignTables);
                        }

                        for(int ib=0; ib<childBeansName.size(); ib++) {
                            String childBeanName = childBeansName.get(ib);
                            String error = null;

                            // Ricerca nei beans per corrispondenza esatta
                            Field field = searchProperty(bean, childBeanName, true, true);
                            if (field != null) {
                                String beanNameFound = field.getName();
                                String column = null;
                                String foreignColumn = null;
                                String className = null;

                                String beanClassName = bean.getClass().getName();
                                ClassPool pool = ClassPool.getDefault();
                                CtClass cc = pool.get(beanClassName);

                                // assegna la primary key della riga
                                String ftControlId = new String(cc.getAttribute(beanNameFound + "$controlId"));
                                if(ftControlId != null && !ftControlId.isEmpty()) {
                                    String ftClassName = new String(cc.getAttribute(beanNameFound + "$className"));
                                    if(ftClassName != null && !ftClassName.isEmpty()) {
                                        workspace ftWrk = workspace.get_tbl_manager_workspace(ftControlId);
                                        if (ftWrk != null) {
                                            Object ftFieldData = utility.get(bean, childBeanName);
                                            if(ftFieldData != null) {
                                                //
                                                // inserting rows in the foreign teble
                                                //                                                
                                                ArrayList<Object> ftRows = null;
                                                if(ftFieldData instanceof ArrayList<?>) {
                                                    ftRows = (ArrayList<Object>)ftFieldData;
                                                } else {
                                                    ftRows = new ArrayList<Object>();
                                                    ftRows.add(ftFieldData);
                                                }
                                                //
                                                // creting new ftWrk redirecting it to tbl_wrk ... 
                                                // translate ftWrk (database, schema, connectionDriver, connectionURL
                                                //
                                                workspace newFtWrk = workspace.redirect_workspace ((workspace)tbl_wrk, ftWrk, "");
                                                if(newFtWrk != null) {
                                                    for(int iftRow=0; iftRow<ftRows.size(); iftRow++) {
                                                        Object oftFieldData = ftRows.get(iftRow);
                                                        if(oftFieldData != null) {
                                                            //
                                                            // insering foreign table row
                                                            //
                                                            String ftRowResult = db.insert( oftFieldData, newFtWrk, foreignTables );
                                                            if(ftRowResult != null) {
                                                                JSONObject ftRowResultJson = new JSONObject(ftRowResult);
                                                                if (ftRowResultJson.has("tables")) {
                                                                    JSONArray tables = ftRowResultJson.getJSONArray("tables");
                                                                    for (int ie = 0; ie < tables.length(); ie++) {
                                                                        JSONObject t = tables.getJSONObject(ie);
                                                                        if (t.has("error")) {
                                                                            error += "Inserting record error; " + utility.base64Decode(t.getString("error"));
                                                                        }
                                                                        if (t.has("qery")) {
                                                                            error += " - query:" + utility.base64Decode(t.getString("query"));
                                                                        }
                                                                    }
                                                                }
                                                                result = utility.transfer_result_to_results(ftRowResult, result);
                                                            }
                                                        }
                                                    }
                                                }
                                            } else {
                                                error = "Bean '" + childBeanName + "' has wrong definition, class '"+ftClassName+"' not found";
                                            }
                                        } else {
                                            error = "Bean '" + childBeanName + "' has wrong definition, workspace '"+ftControlId+"' not found";
                                        }
                                    } else {
                                        error = "Bean '" + childBeanName + "' has wrong definition, class name '"+ftClassName+"' not found";
                                    }
                                } else {
                                    error = "Bean '" + childBeanName + "' has wrong definition, control is missing";
                                }
                            } else {
                                error = "Bean '" + childBeanName + "' has wrong definition, field not found";
                            }
                            
                            result = utility.append_error_to_result( utility.base64Encode(error), result);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
        }
        return result;
    }

    // Metodo aggiornamento db da bean
    /**
     * <h3>Update the bean to the database</h3>
     * <p>
     * This method execute an update statement by the given bean (on changed fileds only)
     *
     * @param bean bean to update (Object)
     * @param tbl_wrk the table workspace of the control (Object)
     *
     * @return the detail of operation as json object { "tables":[ {
     * "table":"table name", "ids":[ list of changed primary keys ] } ]
     * ,"foreignTables":[ { "table":"table name", "ids":[ list of changed
     * primary keys ] } ] ,"fails":[" { "table":"table name", "ids":[ list of
     * changed primary keys ] } ] }
     * @see db
     */
    static public String update(Object bean, Object tbl_wrk) {
        try {
            if (bean != null) {
                if (tbl_wrk != null) {
                    String sModifications = "";
                    String sFields = "";
                    workspace tblWrk = (workspace) tbl_wrk;
                    JSONArray cols = tblWrk.tableJson.getJSONArray("columns");
                    String primaryKey = tblWrk.tableJson.getString("primaryKey");
                    Object primaryKeyValue = null;

                    DateFormat dateFormat = new SimpleDateFormat("dd" + workspace.dateSep + "MM" + workspace.dateSep + "yyyy");
                    DateFormat dateTimeFormat = new SimpleDateFormat("dd" + workspace.dateSep + "MM" + workspace.dateSep + "yyyy HH" + workspace.timeSep + "mm" + workspace.timeSep + "ss.SS");

                    for (int ic = 0; ic < cols.length(); ic++) {
                        JSONObject col = cols.getJSONObject(ic);
                        int colType = col.getInt("type");
                        String colName = col.getString("name");
                        String colRuntimeName = col.has("runtimeName") ? col.getString("runtimeName") : null;
                        String beanColName = (colRuntimeName != null ? colRuntimeName.replaceAll("\\.", "\\$") : (colName != null ? colName.replaceAll("\\.", "\\$") : null));

                        if (beanColName != null) {
                            try {
                                Object fieldData = utility.get(bean, beanColName);

                                if (colType == 91) { //date
                                    try {
                                        java.sql.Date dbSqlDate = (java.sql.Date) fieldData;
                                        fieldData = dbSqlDate != null ? dateFormat.format(dbSqlDate) : null;
                                    } catch (Exception e) {
                                    }
                                } else if (colType == 92) { //time
                                    try {
                                        java.sql.Time dbSqlTime = (java.sql.Time) fieldData;
                                        fieldData = dbSqlTime != null ? dateFormat.format(dbSqlTime) : null;
                                    } catch (Exception e) {
                                    }
                                } else if (colType == 6 || colType == 93) { // datetime
                                    try {
                                        fieldData = fieldData != null ? dateTimeFormat.format(fieldData) : null;
                                    } catch (Exception e) {
                                    }
                                }

                                if (colName.equals(primaryKey)) {
                                    primaryKeyValue = fieldData;
                                } else {
                                    boolean isChanged = utility.isChanged(bean, beanColName);
                                    if (isChanged) {
                                        sFields += (sFields.length() > 0 ? "," : "") + "{\"field\":\"" + cols.getJSONObject(ic).getString("field") + "\",\"value\":\"" + (fieldData != null ? fieldData : "") + "\"}";
                                    }
                                }
                            } catch (Exception ex) {
                                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, "// ERROR in bean:" + bean.getClass().getName() + " prop.:" + colName + " error:" + ex.getLocalizedMessage());
                            }
                        }
                    }
                    if (primaryKeyValue != null) {
                        sModifications += "{\"rowId\":\"" + primaryKeyValue + "\",\"fields\":[" + sFields + "]}";

                        String updatingParams = "{ \"params\":[{\"modifications\":[" + sModifications + "] } ] }";

                        return db.updateFields(tbl_wrk, updatingParams, null, null, null);
                    }
                }
            }

        } catch (Exception ex) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    /**
     * <h3>Insert the bean to the database</h3>
     * <p>
     * This method execute an insert statement by the given bean
     *
     * @param bean bean to insert (Object)
     * @param tbl_wrk the table workspace of the control (Object)
     *
     * @return the detail of operation as json object { "tables":[ {
     * "table":"table name", "ids":[ list of changed primary keys ] } ]
     * ,"foreignTables":[ { "table":"table name", "ids":[ list of changed
     * primary keys ] } ] ,"fails":[" { "table":"table name", "ids":[ list of
     * changed primary keys ] } ] }
     * @see db
     */
    static public String delete(Object bean, Object tbl_wrk) {
        try {
            String sModifications = "";
            String sFields = "";
            workspace tblWrk = (workspace) tbl_wrk;
            String id = String.valueOf(utility.get(bean, ((workspace) tbl_wrk).tableJson.getString("primaryKey")));

            sModifications += "{\"rowId\":\"" + id + "\"}";

            String deletingParams = "{ \"params\":[{\"modifications\":[" + sModifications + "] } ] }";

            return db.deleteRow(tbl_wrk, deletingParams, null, null, null);
        } catch (Exception ex) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    // Wrappers
    static public String getSelection(Object tbl_wrk, Object params) {
        return workspace.getSelection(tbl_wrk, (String) params);
    }

    static public long getSelectionCount(Object tbl_wrk, Object params) {
        return workspace.getSelectionCount(tbl_wrk, (String) params);
    }

    static public String getData(Object tbl_wrk, Object params, String column) {
        return workspace.getData(tbl_wrk, (String) params, (String) column);
    }

    static public boolean set_current_database(Connection conn, String database, String driver, String tableIdString) {
        String sql = null;
        try {

            if (conn != null) {
                if (database == null || database.isEmpty()) {
                    database = conn.getCatalog();
                } else {
                    conn.setCatalog(database);
                }

                if ("mysql".equalsIgnoreCase(driver)) {
                    sql = "USE " + tableIdString + database + tableIdString + "";
                } else if ("mariadb".equalsIgnoreCase(driver)) {
                    sql = "USE " + tableIdString + database + tableIdString + "";
                } else if ("postgres".equalsIgnoreCase(driver)) {
                    sql = "SET search_path TO \"" + database + "\",public";
                } else if ("oracle".equalsIgnoreCase(driver)) {
                    // Only schema can be changed (ALTER SESSION SET current_schema = other_user;) database = oracle instance
                    // Database is the oracle instance, so different process
                } else if ("sqlserver".equalsIgnoreCase(driver)) {
                    sql = "USE " + tableIdString + database + tableIdString + "";
                }
                if (sql != null) {
                    PreparedStatement psdoLogin = conn.prepareStatement(sql);
                    psdoLogin.executeUpdate();
                    psdoLogin.close();
                    psdoLogin = null;
                }
                return true;
            }
        } catch (Throwable e) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
        }
        return false;
    }

    static public boolean create_database_schema(String driver, String host, String database, String schema, String user, String password) throws Exception {
        return metadata.create_database_schema(driver, host, database, database, user, password);
    }

    static public boolean create_database_schema(String driver, String database, String schema, String user, String password) throws Exception {
        return metadata.create_database_schema(driver, database, database, user, password);
    }

    static public boolean create_database(Connection conn, String database) {
        return metadata.create_schema(conn, database);
    }

    static public boolean create_schema(Connection conn, String schema) {
        return metadata.create_schema(conn, schema);
    }

    static public JSONArray wrapFilters(JSONObject filterJSON) throws JSONException {
        JSONArray result = new JSONArray();
        JSONArray names = filterJSON.names();
        if (names != null) {
            for (int io = 0; io < names.length(); io++) {
                String propName = names.getString(io);
                Object propVal = filterJSON.get(propName);
                JSONObject filter = new JSONObject();
                filter.put("name", propName);
                filter.put("value", propVal);
                result.put(filter);
            }
        }
        return result;
    }

    static public String syncronizeTable(String databaseSchemaTable, String sourceRowsFilters,
            String targetDatabaseSchemaTable, String targetRowsFilters,
            String columnsRelation
    ) {
        return syncronizeTable(databaseSchemaTable, sourceRowsFilters, targetDatabaseSchemaTable, targetRowsFilters, columnsRelation, null, null, "mirror");
    }

    /**
     * <h3>Suncronize target table by source table, adding and removing
     * rows</h3>
     * <p>
     * This method execute a syncronization by adding and removing rows
     *
     * @param sourceDatabaseSchemaTable the source table (database.schema.table
     * or schema.table or table) (String)
     * @param sSourceRowsFilters the filters to apply to get source rowset
     * @param targetDatabaseSchemaTable the target table (database.schema.table
     * or schema.table or table) (String)
     * @param sTargetRowsFilters the filters to apply to get target rowset
     * @param methodGetPrimaryKey the method to invoke (by java reflection) to
     * get the primary key value
     * @param instanceGetPrimaryKey the class instance user to get the primary
     * key value
     * @param sColumnsRelation the relation beetwen source and target table's
     * columns example: { "target column 1":"source column 1", "target column
     * 2":"source column 2", ... } target column must be an existing column in
     * target table source column could be an existing column in source table or
     * a fixed value
     *
     * @param mode can be a list of these values: "mirror" (default mode) "all"
     * (allow to process all rows, if no filters defined) "preview" (report the
     * differences without perform any operations)
     *
     * @return the detail of operation the operation, if not preview mode as {
     * "addedIds":[ 1, 2, 3, ... ] ,"addedCount":n ,"deletedIds":[ 1, 2, 3, ...
     * ] ,"deletedCount":n }
     * @see db
     */
    static public String syncronizeTable(String sourceDatabaseSchemaTable, String sSourceRowsFilters,
            String targetDatabaseSchemaTable, String sTargetRowsFilters,
            String sColumnsRelation,
            String methodGetPrimaryKey, Object instanceGetPrimaryKey,
            String mode
    ) {
        JSONObject resultJSON = new JSONObject();
        String result = "";
        String database = null, schema = null, table = null;
        String targetTable = null, targetSchema = null, targetDatabase = null;
        String sourceControlId = null, targetControlId = null, where_condition_source = "", where_condition_target = "", error = "";
        String sourcePrimaryKey = null, targetPrimaryKey = null, targetPrimaryKeyForCompare = null;
        boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;
        HttpServletRequest request = null;
        ArrayList<LeftJoinMap> leftJoinsMap = new ArrayList<LeftJoinMap>();
        Method mGetPrimaryKey = null;

        try {

            String[] tableParts = sourceDatabaseSchemaTable.split("\\.");
            if (tableParts.length == 1) {
                table = tableParts[0];
            } else if (tableParts.length == 2) {
                table = tableParts[1];
                schema = tableParts[0];
            } else if (tableParts.length == 3) {
                table = tableParts[2];
                schema = tableParts[1];
                database = tableParts[0];
            }

            tableParts = targetDatabaseSchemaTable.split("\\.");
            if (tableParts.length == 1) {
                targetTable = tableParts[0];
            } else if (tableParts.length == 2) {
                targetTable = tableParts[1];
                targetSchema = tableParts[0];
            } else if (tableParts.length == 3) {
                targetTable = tableParts[2];
                targetSchema = tableParts[1];
                targetDatabase = tableParts[0];
            }

            sourceControlId = workspace.getControlIdFromDatabaseSchemaTable(sourceDatabaseSchemaTable);
            workspace source_tbl_wrk = workspace.get_tbl_manager_workspace(sourceControlId);
            if (source_tbl_wrk == null) {
                String sRequest = "";
                String parentControlId = null;
                String sTableJson = workspace.get_default_json(request, sourceControlId, sourceControlId, table, schema, database, parentControlId, workspace.sourceSpecialToken, sRequest, null);
            }
            source_tbl_wrk = workspace.get_tbl_manager_workspace(sourceControlId);
            if (source_tbl_wrk != null) {
                targetControlId = workspace.getControlIdFromDatabaseSchemaTable(targetDatabaseSchemaTable);
                workspace target_tbl_wrk = workspace.get_tbl_manager_workspace(targetControlId);
                if (target_tbl_wrk == null) {
                    String sRequest = "";
                    String parentControlId = null;
                    String sTableJson = workspace.get_default_json(request, targetControlId, targetControlId, targetTable, targetSchema, targetDatabase, parentControlId, workspace.sourceSpecialToken, sRequest, null);
                }
                target_tbl_wrk = workspace.get_tbl_manager_workspace(targetControlId);
                if (target_tbl_wrk != null) {

                    String itemIdString = "\"", tableIdString = "\"", asKeyword = " AS ";
                    if ((source_tbl_wrk.driverClass != null && source_tbl_wrk.driverClass.toLowerCase().contains("postgres.")) || source_tbl_wrk.dbProductName.toLowerCase().contains("postgres")) {
                        isPostgres = true;
                    }
                    if ((source_tbl_wrk.driverClass != null && source_tbl_wrk.driverClass.toLowerCase().contains("mysql.")) || source_tbl_wrk.dbProductName.toLowerCase().contains("mysql")) {
                        isMySQL = true;
                    }
                    if ((source_tbl_wrk.driverClass != null && source_tbl_wrk.driverClass.toLowerCase().contains("mariadb.")) || source_tbl_wrk.dbProductName.toLowerCase().contains("mariadb")) {
                        isMySQL = true;
                    }
                    if ((source_tbl_wrk.driverClass != null && source_tbl_wrk.driverClass.toLowerCase().contains("oracle.")) || (source_tbl_wrk.dbProductName != null && source_tbl_wrk.dbProductName.toLowerCase().contains("oracle"))) {
                        isOracle = true;
                    }
                    if ((source_tbl_wrk.driverClass != null && source_tbl_wrk.driverClass.toLowerCase().contains("sqlserver.")) || (source_tbl_wrk.dbProductName != null && source_tbl_wrk.dbProductName.toLowerCase().contains("sqlserver"))) {
                        isSqlServer = true;
                    }

                    JSONObject sourceRowsFilters = sSourceRowsFilters != null && !sSourceRowsFilters.isEmpty() ? new JSONObject(sSourceRowsFilters) : null;
                    JSONObject targetRowsFilters = sTargetRowsFilters != null && !sTargetRowsFilters.isEmpty() ? new JSONObject(sTargetRowsFilters) : null;

                    try {
                        sourcePrimaryKey = source_tbl_wrk.tableJson.getString("primaryKey");
                    } catch (Exception e) {
                    }
                    try {
                        targetPrimaryKey = target_tbl_wrk.tableJson.getString("primaryKey");
                    } catch (Exception e) {
                    }

                    targetPrimaryKeyForCompare = targetPrimaryKey;

                    //
                    // Build source table filters
                    //
                    try {
                        if (sourceRowsFilters != null) {
                            JSONArray cols = source_tbl_wrk.tableJson.getJSONArray("columns");
                            JSONArray filtersCols = wrapFilters(sourceRowsFilters);
                            where_condition_source = process_filters_json(source_tbl_wrk, table, cols,
                                    isOracle, isMySQL, isPostgres, isSqlServer,
                                    where_condition_source, filtersCols, null, leftJoinsMap,
                                    tableIdString, itemIdString
                            );
                        }
                    } catch (Exception e) {
                        error += "[Filters Error:" + e.getLocalizedMessage() + "]" + "[Driver:" + source_tbl_wrk.driverClass + "]";
                        System.err.println("// Filters Error:" + e.getLocalizedMessage());
                    }

                    if (where_condition_source == null || where_condition_source.isEmpty()) {
                        if (mode.contains("all")) {
                            return "{\"error\":\"You need a filter on source or add 'ALL' keyword in mode parameter\"}";
                        }
                    }

                    //
                    // Filtering source table
                    //
                    ArrayList<Object> sourceRows = load_beans(request, sourceControlId, sourceDatabaseSchemaTable, "*", where_condition_source, 0);

                    //
                    // Build target table filters
                    //
                    try {
                        if (targetRowsFilters != null) {
                            JSONArray cols = target_tbl_wrk.tableJson.getJSONArray("columns");
                            JSONArray filtersCols = wrapFilters(targetRowsFilters);
                            where_condition_target = process_filters_json(source_tbl_wrk, targetTable, cols,
                                    isOracle, isMySQL, isPostgres, isSqlServer,
                                    where_condition_target, filtersCols, null, leftJoinsMap,
                                    tableIdString, itemIdString
                            );
                        }
                    } catch (Exception e) {
                        error += "[Filters Error:" + e.getLocalizedMessage() + "]" + "[Driver:" + source_tbl_wrk.driverClass + "]";
                        System.err.println("// Filters Error:" + e.getLocalizedMessage());
                    }

                    if (where_condition_target == null || where_condition_target.isEmpty()) {
                        if (mode.contains("all")) {
                            return "{\"error\":\"You need a filter on target or add 'ALL' keyword in mode parameter\"}";
                        }
                    }

                    //
                    // Filtering target table
                    //
                    ArrayList<Object> targetRows = load_beans(request, targetControlId, targetDatabaseSchemaTable, "*", where_condition_target, 0);

                    //        
                    // Eliminazione righe non corrispondenti
                    //
                    ArrayList<String> deletingIds = new ArrayList<String>();
                    ArrayList<String> addingIds = new ArrayList<String>();
                    ArrayList<String> addingFields = new ArrayList<String>();
                    ArrayList<String> addingColumnsValue = new ArrayList<String>();
                    ArrayList<String> addingColumnsName = new ArrayList<String>();
                    ArrayList<String> addingColumnsLabel = new ArrayList<String>();

                    JSONObject columnsRelation = new JSONObject(sColumnsRelation);

                    JSONArray names = columnsRelation.names();
                    if (names != null) {
                        for (int io = 0; io < names.length(); io++) {
                            String propName = names.getString(io);
                            Object propVal = columnsRelation.get(propName);
                            if (propVal instanceof String) {
                                if (getFieldPosition(target_tbl_wrk, (String) propName) > 0) {
                                    int fieldPos = getFieldPosition(source_tbl_wrk, (String) propVal);
                                    if (fieldPos > 0) {
                                        addingColumnsValue.add(null);
                                        addingColumnsName.add((String) propVal);
                                        if (sourcePrimaryKey.equalsIgnoreCase(propName)) {
                                            targetPrimaryKeyForCompare = propName;
                                        }
                                    } else {
                                        String value = columnsRelation.getString(propName);
                                        if ("NULL".equalsIgnoreCase(value)) {
                                            value = null;
                                        }
                                        addingColumnsValue.add(value);
                                        addingColumnsName.add(null);
                                    }
                                    addingColumnsLabel.add(propName);
                                }
                            }
                        }
                    }

                    ArrayList<Object> sourcePrimaryKeys = new ArrayList<Object>();
                    Object[] source_res = beansToArray(sourceRows, sourcePrimaryKey, sourcePrimaryKeys);
                    // String sSourcePrimaryKeys = utility.arrayToString(sourcePrimaryKeys.toArray(), "'", "'", ",");

                    ArrayList<Object> targetPrimaryKeys = new ArrayList<Object>();
                    Object[] target_res = beansToArray(targetRows, targetPrimaryKeyForCompare, targetPrimaryKeys);

                    if (targetRows != null) {
                        for (int i = 0; i < targetRows.size(); i++) {
                            boolean found = false;
                            Object targetBean = (Object) targetRows.get(i);
                            String id = String.valueOf(utility.get(targetBean, sourcePrimaryKey));
                            if (utility.contains(sourcePrimaryKeys, id)) {
                                found = true;
                            }
                            if (!found) {
                                deletingIds.add(id);
                                if (mode.contains("preview")) {
                                } else {
                                    delete(targetBean, target_tbl_wrk);
                                }
                            }
                        }
                    }
                    resultJSON.put("deletedCount", deletingIds.size());
                    resultJSON.put("deletedIds", deletingIds);

                    //
                    // Aggiunta righe non trovate
                    //
                    if (sourceRows != null) {
                        for (int i = 0; i < sourceRows.size(); i++) {
                            Object sourceBean = (Object) sourceRows.get(i);
                            String id = String.valueOf(utility.get(sourceBean, sourcePrimaryKey));
                            boolean found = false;
                            if (utility.contains(targetPrimaryKeys, id)) {
                                found = true;
                            }
                            if (!found) {
                                // adding source table
                                Object newBean = null;
                                if (mode.contains("preview")) {
                                } else {
                                    JSONArray rowsJson = null;
                                    Object[] beanResult = create_beans_multilevel_class(target_tbl_wrk, rowsJson, null, "*", 0, 1);
                                    if (beanResult != null) {
                                        int ftResult = (int) beanResult[0];
                                        newBean = ((ArrayList<Object>) beanResult[1]).get(0);
                                    }
                                }
                                addingFields.clear();
                                for (int ic = 0; ic < addingColumnsName.size(); ic++) {
                                    String value = null;
                                    if (addingColumnsName.get(ic) != null) {
                                        // add a column
                                        value = String.valueOf(utility.get(sourceBean, addingColumnsName.get(ic)));
                                    } else {
                                        // add a value
                                        value = addingColumnsValue.get(ic);
                                    }
                                    addingFields.add(value);
                                    if (newBean != null) {
                                        utility.set(newBean, addingColumnsLabel.get(ic), value);
                                    }
                                }

                                if (mode.contains("preview")) {
                                } else {
                                    addingIds.add(id);

                                    // generator of primary key customized
                                    if (instanceGetPrimaryKey != null && methodGetPrimaryKey != null) {
                                        if (mGetPrimaryKey == null) {
                                            Object[] resultGetPrimaryKey = event.get_method_by_class_name(methodGetPrimaryKey, instanceGetPrimaryKey);
                                            if (resultGetPrimaryKey != null) {
                                                instanceGetPrimaryKey = (Object) resultGetPrimaryKey[0];
                                                mGetPrimaryKey = (Method) resultGetPrimaryKey[1];
                                            } else {
                                                error += "Generated primary key error";
                                            }
                                        }

                                        if (mGetPrimaryKey != null) {
                                            String newId = (String) mGetPrimaryKey.invoke(instanceGetPrimaryKey);
                                            if (newId != null && !newId.isEmpty()) {
                                                utility.set(newBean, targetPrimaryKey, newId);
                                            } else {
                                                error += "Generated primary key error";
                                            }
                                        } else {
                                            error += "Unable to get method for generating primary key error";
                                        }
                                    }

                                    // inserting the row
                                    if (newBean != null) {
                                        String insertResult = insert(newBean, target_tbl_wrk);
                                        if (insertResult != null && !insertResult.isEmpty()) {
                                            JSONObject insertResultJSON = new JSONObject(insertResult);
                                            if (insertResultJSON != null) {
                                                if (insertResultJSON.has("tables")) {
                                                    JSONArray tables = insertResultJSON.getJSONArray("tables");
                                                    for (int ie = 0; ie < tables.length(); ie++) {
                                                        JSONObject t = tables.getJSONObject(ie);
                                                        if (t.has("error")) {
                                                            error += "Inserting record error; " + utility.base64Decode(t.getString("error"));
                                                        }
                                                        if (t.has("qery")) {
                                                            error += " - query:" + utility.base64Decode(t.getString("query"));
                                                        }
                                                    }
                                                }
                                                if (insertResultJSON.has("error")) {
                                                    error += "Inserting record error; " + utility.base64Decode(insertResultJSON.getString("error"));
                                                }
                                            } else {
                                                error += "Inserting record error; result misformed";
                                            }
                                        } else {
                                            error += "Inserting record result is empty";
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (addingIds != null) {
                        resultJSON.put("addingCount", addingIds.size());
                        resultJSON.put("adddingIds", addingIds);
                    }
                }
            }
            if (error != null && !error.isEmpty()) {
                resultJSON.put("error", utility.base64Encode(error));
            }

        } catch (Throwable e) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
        }

        return resultJSON.toString();
    }

    
    static public boolean setSchema( Connection conn, String engine, String schema ) {
        String sql = null;
        boolean retVal = false;
                
        String tableIdString = "";
        
        // oracle
        if("oracle".equalsIgnoreCase(engine)) {
            sql = "ALTER SESSION SET CURRENT_SCHEMA = "+schema+";";
            
        // postgres
        } else if("postgres".equalsIgnoreCase(engine)) {
            sql = "SET search_path TO \"" + schema + "\"";
            
        } else if("mysql".equalsIgnoreCase(engine)) {
            sql = "USE " + tableIdString + schema + tableIdString + "";
            
        } else if("mysql".equalsIgnoreCase(engine)) {
            sql = "USE " + tableIdString + schema + tableIdString + "";
        }
        
        if(sql != null) {
            if(conn != null) {
                try {
                    Statement stmt = conn.createStatement();
                    boolean res = stmt.execute(sql);
                    if(!res) {
                        retVal = true;
                        ResultSet rs = stmt.getResultSet();
                        if(rs != null) {
                            if(rs.next()) {
                                String result = rs.getString(1);
                                if(result != null) {
                                }
                            }
                        }
                    }
                } catch (SQLException ex) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
                }
            }            
        }        
        return retVal;
    }
    
}
