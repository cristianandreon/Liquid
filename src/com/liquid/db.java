/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

package com.liquid;

import static com.liquid.bean.beansToArray;
import static com.liquid.bean.load_bean;
import static com.liquid.event.forwardEvent;
import static com.liquid.utility.searchProperty;
import static com.liquid.workspace.check_database_definition;
import com.liquid.metadata.ForeignKey;

import java.beans.Expression;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;

import java.text.DateFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;

import org.apache.commons.lang.ArrayUtils;
import org.json.JSONObject;
import org.json.JSONArray;

import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;
import javassist.ClassPool;
import javassist.CtClass;

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
    public static String NULLValue = "";



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
        static public LeftJoinMap getByForeignTable(ArrayList<LeftJoinMap> list, String foreignTable) {
            if (list != null) {
                for (LeftJoinMap item : list) {
                    if (item.foreignTable.equalsIgnoreCase(foreignTable)) {
                        return item;
                    }
                }
            }
            return null;
        }


        static public String getAlias(ArrayList<LeftJoinMap> list, String foreignTable) throws Exception {
            if (list != null) {
                if(foreignTable == null || foreignTable.isEmpty())
                    throw new Exception("Invalid foreignTable");
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
        String columnName = colName.replaceAll("\\.", "_").replaceAll("[( )//]", "");
        if (columnMaxLength > 3) {
            if (columnName.length() >= columnMaxLength - 2) { // A_[XXXXXX]999
                columnName = columnName.substring(0, columnMaxLength - 5);
                columnName += aliasIndex;
            }
        }
        return columnName;
    }

    /**
     * Transalte a column in the control by language defined in session
     * ex: column "status" become "staus_it"
     *
     * @param tbl_wrk
     * @param session
     * @param col
     * @param defaultColumnName
     * @return
     * @throws Exception
     */
    private static String getColumnTranslated(workspace tbl_wrk, HttpSession session, JSONObject col, String defaultColumnName) throws Exception {
        if(col != null) {
            String colName = col.getString("name");
            colName = (defaultColumnName != null ? defaultColumnName : colName);
            String [] colNameParts = colName.split("\\.");
            if(colNameParts.length > 1) {
                colName = colNameParts[colNameParts.length-1];
            }
            if(col.has("translate") || col.has("translated")) {
                boolean translated = false;
                if(col.has("translate")) {
                    translated = col.getBoolean("translate");
                } else if(col.has("translated")) {
                    translated = col.getBoolean("translated");
                }
                if(translated) {
                    if(session != null) {
                        String lang = (String)session.getAttribute("Liquid.lang");
                        if(lang != null && !lang.isEmpty()) {
                            if(!lang.equalsIgnoreCase("EN")) {
                                return colName+"_"+lang.toLowerCase();
                            } else {
                                return colName;
                            }
                        } else {
                            return colName;
                        }
                    } else {
                        if(workspace.projectMode) {
                            System.err.println("*** ERROR: session not defined in field translation. controlId:" + tbl_wrk.controlId + " field:" + colName);
                        } else {
                            return colName;
                        }
                    }
                } else {
                    return colName;
                }
            } else {
                return colName;
            }
        } else {
            return null;
        }
        return null;
    }

    private static String getColumnTranslated(workspace tbl_wrk, HttpSession session, JSONObject col) throws Exception {
        return getColumnTranslated(tbl_wrk, session, col, null);
    }

    static public String get_table_recordset(HttpServletRequest request, JspWriter out) {
        try {
            ParamsUtil.get_recordset_params recordset_params = new ParamsUtil().new get_recordset_params(request);
            return get_table_recordset(recordset_params, out);
        } catch (Exception e) {
            System.err.println(e);
        }
        return null;
    }

    static public String get_table_recordset(String controlId, String sRequest, boolean bSaveQueryInfo, long maxRows, JspWriter out) {
        try {
            ParamsUtil.get_recordset_params recordset_params = new ParamsUtil().new get_recordset_params(controlId, sRequest, bSaveQueryInfo, maxRows);
            return get_table_recordset(recordset_params, out);
        } catch (Exception e) {
            System.err.println(e);
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
        String executingQuery = null, executingQueryForCache = null, runtimeQuery = null;
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
        boolean extendedMetadata = recordset_params.extendedMetadata;
        String targetView = null, targetColumn = recordset_params.targetColumn, targetMode = recordset_params.targetMode, idColumn = recordset_params.idColumn;
        JSONObject requestJson = recordset_params.requestJson;
        String service = recordset_params.service;

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
            ArrayList<Object> columns_alias_array = new ArrayList<Object>();
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
                    Object [] connResult = connection.getConnection(null, recordset_params.request, tbl_wrk.tableJson);
                    conn = (Connection)connResult[0];
                    String connError = (String)connResult[1];
                    if (conn == null) {
                        String err = "DB connect failed on controlId:" + controlId + "\n\nError is : "+connError;
                        System.out.println("// LIQUID ERROR : " + err);
                        return "{\"error\":\"" + utility.base64Encode(err) + "\"}";
                    }
                } catch (Throwable th) {
                    final Throwable cause = th.getCause();
                    error = (cause != null ? cause.getLocalizedMessage() : "") + "(" + th.getMessage() + ")";
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
                    if(tbl_wrk.tableJson.has("database")) {
                        database = tbl_wrk.tableJson.getString("database");
                    }
                } catch (Exception e) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
                }
                try {
                    if(tbl_wrk.tableJson.has("schema")) {
                        schema = tbl_wrk.tableJson.getString("schema");
                    }
                } catch (Exception e) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
                }
                try {
                    if(tbl_wrk.tableJson.has("table")) {
                        table = tbl_wrk.tableJson.getString("table");
                    }
                } catch (Exception e) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
                }

                if(tbl_wrk.tableJson.has("view")) {
                    view = tbl_wrk.tableJson.getString("view");
                }
                if(tbl_wrk.tableJson.has("columns")) {
                    cols = tbl_wrk.tableJson.getJSONArray("columns");
                }
                if(tbl_wrk.tableJson.has("primaryKey")) {
                    primaryKey = tbl_wrk.tableJson.getString("primaryKey");
                }
                if(tbl_wrk.tableJson.has("query")) {
                    query = tbl_wrk.tableJson.getString("query");
                    if(query != null) {
                        query = utility.base64Decode(query);
                    }
                }
                if(tbl_wrk.tableJson.has("token")) {
                    token = tbl_wrk.tableJson.getString("token");
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
                        Object [] connResult = connection.getDBConnection(database);
                        connToUse = connToDB = (Connection)connResult[0];
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

                if(tbl_wrk.tableJson.has("selectDatabases")) {
                    targetDatabase = tbl_wrk.tableJson.getString("selectDatabases");
                }
                if(tbl_wrk.tableJson.has("selectSchemas")) {
                    targetSchema = tbl_wrk.tableJson.getString("selectSchemas");
                }
                if(tbl_wrk.tableJson.has("selectTables")) {
                    targetTable = tbl_wrk.tableJson.getString("selectTables");
                }
                if(tbl_wrk.tableJson.has("selectViews")) {
                    targetView = tbl_wrk.tableJson.getString("selectViews");
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
                        // * @return Object[] { (Object) result, (Object) nRec};
                        Object[] result = metadata.getAllDatabases(targetDatabase, connToUse, bUserFieldIdentificator);
                        out_string = "{\"resultSet\":" + result[0];
                        out_string += ",\"startRow\":" + "0";
                        out_string += ",\"endRow\":" + result[1];
                        out_string += ",\"nRows\":" + result[1];
                        out_string += "}";
                        return out_string;
                    } else if ("selectSchemas".equalsIgnoreCase(isSystemLiquid)) {
                        // * @return Object[] { (Object) result, (Object) nRec};
                        Object[] result = metadata.getAllSchemas(targetDatabase != null ? targetDatabase : database, targetSchema != null ? targetSchema : schema, connToUse, bUserFieldIdentificator);
                        out_string = "{\"resultSet\":" + result[0];
                        out_string += ",\"startRow\":" + "0";
                        out_string += ",\"endRow\":" + result[1];
                        out_string += ",\"nRows\":" + result[1];
                        out_string += "}";
                        return out_string;
                    } else if ("selectTables".equalsIgnoreCase(isSystemLiquid) || "selectViews".equalsIgnoreCase(isSystemLiquid)) {
                        // * @return Object[] { (Object) result, (Object) nRec};
                        Object[] result = metadata.getAllTables(targetDatabase != null ? targetDatabase : database, targetSchema != null ? targetSchema : schema, targetTable, targetView, connToUse, bUserFieldIdentificator);
                        out_string = "{\"resultSet\":" + result[0];
                        out_string += ",\"startRow\":" + "0";
                        out_string += ",\"endRow\":" + result[1];
                        out_string += ",\"nRows\":" + result[1];
                        out_string += "}";
                        return out_string;
                    } else if ("selectColumns".equalsIgnoreCase(isSystemLiquid)) {
                        if (targetTable != null && !targetTable.isEmpty()) {
                            // * @return Object[] { (Object) result, (Object) nRec};
                            Object[] result = metadata.getAllColumns(targetDatabase != null ? targetDatabase : database, targetSchema != null ? targetSchema : schema, targetTable, connToUse, bUserFieldIdentificator, extendedMetadata);
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
                            // * @return Object[] { (Object) result, (Object) nRec};
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


                    /*
                     * Processo sorgente dati runtime
                     */
                    try {
                        if(tbl_wrk.tableJson.has("sourceData")) {
                            Object osourceData = tbl_wrk.tableJson.get("sourceData");
                            if(osourceData != null) {
                                if(osourceData instanceof JSONObject) {
                                    JSONObject sourceData = (JSONObject)osourceData;
                                    if(sourceData.has("server")) {
                                        // * @return Object[] { (Object) result, (Object) nRec};
                                        Object [] result = event.loadSourceData(tbl_wrk, sourceData, recordset_params);
                                        if(result != null) {
                                            if(result[0] instanceof String && result[1] instanceof Integer) {
                                                out_string = "{\"resultSet\":" + result[0];
                                                out_string += ",\"startRow\":" + "0";
                                                out_string += (result.length >= 2 ? ",\"endRow\":" + result[1] : "");
                                                out_string += (result.length >= 2 ? ",\"nRows\":" + result[1] : "");
                                                out_string += (result.length >= 3 ? ",\"error\":\"" + (result[2] != null ? result[2] : "") +"\"" : "");
                                                out_string += "}";
                                                return out_string;
                                            } else {
                                                out_string = "{\"resultSet\":" + "null";
                                                out_string += ",\"startRow\":" + "0";
                                                out_string += ",\"endRow\":" + "0";
                                                out_string += ",\"nRows\":" + "0";
                                                out_string += ",\"error\":\"" + utility.base64Encode("invalid format of result from sourceData")+"\"";
                                                out_string += "}";
                                                return out_string;
                                            }

                                        } else {
                                            out_string = "{\"resultSet\":" + "null";
                                            out_string += ",\"startRow\":" + "0";
                                            out_string += ",\"endRow\":" + "0";
                                            out_string += ",\"nRows\":" + "0";
                                            out_string += ",\"error\":\"" + utility.base64Encode("empty result from sourceData")+"\"";
                                            out_string += "}";
                                            return out_string;
                                        }
                                    } else {
                                        out_string = "{\"resultSet\":" + null;
                                        out_string += ",\"startRow\":" + "0";
                                        out_string += ",\"endRow\":" + "0";
                                        out_string += ",\"nRows\":" + "0";
                                        out_string += "}";
                                        return out_string;
                                    }
                                } else {
                                    out_string = "{\"resultSet\":" + "null";
                                    out_string += ",\"startRow\":" + "0";
                                    out_string += ",\"endRow\":" + "0";
                                    out_string += ",\"nRows\":" + "0";
                                    out_string += ",\"error\":\"" + utility.base64Encode("invalid sourceData object type")+"\"";
                                    out_string += "}";
                                    return out_string;
                                }
                            }
                        }
                    } catch (Exception e) {
                        Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
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
                            String joinType = null;
                            ArrayList<String> foreignColumns = new ArrayList<String>();
                            ArrayList<String> columns = new ArrayList<String>();
                            int foreignIndex = -1;

                            if(col.has("name")) {
                                try {
                                    colName = col.getString("name");
                                } catch (Exception e) {
                                    colName = null;
                                }
                            }
                            if(col.has("foreignTable")) {
                                try {
                                    foreignTable = col.getString("foreignTable");
                                } catch (Exception e) {
                                    foreignTable = null;
                                }
                            }

                            try {
                                String fcolumnsKey = null;
                                if (col.has("foreignColumns")) {
                                    JSONArray json_foreign_columns = null;
                                    try {
                                        json_foreign_columns = col.getJSONArray("foreignColumns");
                                    } catch (Exception e) { }
                                    for(int ifc=0; ifc<json_foreign_columns.length(); ifc++) {
                                        foreignColumns.add(json_foreign_columns.getString(ifc));
                                    }
                                } else if (col.has("foreignColumn")) {
                                    foreignColumns.add(col.getString("foreignColumn"));
                                }
                            } catch (Exception e) {
                                foreignColumns = null;
                            }

                            try {
                                String columnsKey = null;
                                if (col.has("columns")) {
                                    JSONArray json_columns = null;
                                    try {
                                        json_columns = col.getJSONArray("columns");
                                    } catch (Exception e) { }
                                    for(int ifc=0; ifc<json_columns.length(); ifc++) {
                                        columns.add(json_columns.getString(ifc));
                                    }
                                } else if (col.has("column")) {
                                    columns.add(col.getString("column"));
                                }
                            } catch (Exception e) {
                                columns = null;
                            }

                            if(col.has("query")) {
                                try {
                                    colQuery = col.getString("query");
                                } catch (Exception e) {
                                    colQuery = null;
                                }
                            }


                            if (colName.indexOf(".") >= colName.length() - 1) {
                                error += " [ Control:" + tbl_wrk.controlId + " Column: " + col.getString("name") + " Unsupported column name]";
                                colName = null;
                            }


                            if(col.has("joinType")) {
                                try {
                                    joinType = col.getString("joinType");
                                } catch (Exception e) {
                                    foreignTable = null;
                                }
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
                                    columns_alias_array.add( new String [] { null, columnName, column_alias, asKeyword } );
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

                                        String sourceFieldName = col.has("runtimeName") ? col.getString("runtimeName") : col.getString("name");

                                        if (    (colParts.length > 1) ||
                                                (foreignTable != null && foreignColumns != null && columns != null)
                                        ) {
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
                                                                            // Aggiunta coordinate link se assenti (derivata dalla foreign ket)
                                                                            if(foreignColumns.size() == 0) {
                                                                                foreignColumns.addAll(foreignKey.foreignColumns);
                                                                            }
                                                                            if(columns.size() == 0) {
                                                                                columns.addAll(foreignKey.columns);
                                                                            }
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
                                                    // ricerca se esiste una foreign key unica già definita ...
                                                    if (foreignTable == null || foreignColumns == null || columns == null) {                                                        
                                                        // gia' controllato da workspace : se non risolto è una condizioni di errore
                                                        int nCandidateFKey = 0;
                                                        if(foreignKeys != null) {
                                                            if (foreignTable == null) foreignTable = colParts[0];
                                                            for (int ifk = 0; ifk < foreignKeys.size(); ifk++) {
                                                                ForeignKey foreignKey = foreignKeys.get(ifk);
                                                                if (foreignKey != null) {
                                                                    if (foreignKey.foreignTable.equalsIgnoreCase(foreignTable)) {
                                                                        if (foreignColumns == null || utility.compare_array(foreignKey.foreignColumns, foreignColumns)) {
                                                                            if (columns == null || utility.compare_array(foreignKey.columns, columns)) {
                                                                                foreignIndex = ifk;
                                                                                nCandidateFKey++;
                                                                                break;
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        if(nCandidateFKey == 0) {          
                                                            error += " [ Control:" + tbl_wrk.controlId + " Column : " + col.getString("name") + " unresolved link .. cannot Build the JOIN : please define foreignKey in Database or in json..]";
                                                        } else if(nCandidateFKey == 1) {
                                                            // foreign key definita da un'altra colonna : utilizza la stessa defninizione
                                                        } else if(nCandidateFKey > 1) {
                                                            error += " [ Control:" + tbl_wrk.controlId + " Column : " + col.getString("name") + " more than one link .. cannot Build the JOIN : please define foreignKey in Database or in json..]";
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if (foreignTable != null) {
                                            String leftJoinKey = null;
                                            String leftJoinAlias = null;
                                            if(foreignIndex < 0) {
                                                error += " [ Control:" + tbl_wrk.controlId + " Column : " + col.getString("name") + " has foreignIndex invalid please check foreignTable/foreignColumn/column fields]";
                                                bAddColumnToList = false;
                                            } else {
                                                leftJoinKey = foreignTable + "_" + utility.arrayToString(foreignColumns, null, null, ",") + "_" + utility.arrayToString(columns, null, null, ",");
                                                leftJoinAlias = ("B" + String.valueOf(foreignIndex + 1));
                                                /*foreignTable+"_"+(leftJoinsMap.size()+1)*/
                                                if (!LeftJoinMap.getByKey(leftJoinsMap, leftJoinKey)) {
                                                    if (leftJoinList.length() > 0) {
                                                        leftJoinList += "\n";
                                                    }
                                                    int foreignColumnsSize = foreignColumns.size();
                                                    int columnsSize = columns.size();

                                                    if(foreignColumnsSize == 0 && columnsSize == 0) {
                                                        String msg = "ControId:" + tblWrkDesc + " column '"+col.getString("name")+"' not found";
                                                        error += "[" + msg + "]";
                                                    }
                                                    for (int ilj = 0; ilj < Math.max(foreignColumnsSize, columnsSize); ilj++) {
                                                        String foreignColumn = (ilj < foreignColumnsSize ? foreignColumns.get(ilj) : null);
                                                        String column = (ilj < columnsSize ? columns.get(ilj) : null);

                                                        if (foreignColumn == null || foreignColumn.isEmpty()) {
                                                            error += " [ Control:" + tbl_wrk.controlId + " Column:" + col.getString("name") + " Please check field 'foreignColumn', it's NOT defined..]";
                                                            bAddColumnToList = false;
                                                        }
                                                        if (column == null || column.isEmpty()) {
                                                            error += " [ Control:" + tbl_wrk.controlId + " Column:" + col.getString("name") + " Please check field 'column', it's NOT defined..]";
                                                            bAddColumnToList = false;
                                                        }

                                                        // Risoluzione campi variabili
                                                        // N.B.: Il risultato può essere una colonna o un valore
                                                        //      Se si intende un valore utilizzare il carattere ' nell'espressione
                                                        String foreignColumnSolved = null, columnSolved = null;
                                                        if(column.indexOf("{")>=0) {
                                                            columnSolved = solveVariableField(column, recordset_params.request, true);
                                                            if(!columnSolved.equalsIgnoreCase(column)) {
                                                            }
                                                        } else {
                                                            // colonna eserna ? .. cerca l'alias come risultato del join
                                                            // Es : link di secondo livello
                                                            //      tableA.columnaA dove ColumnA = tableB.colummB
                                                            String [] columnParts = column.split("\\.");
                                                            if(columnParts.length>1) {
                                                                columnSolved = column = get_column_db_alias(columns_alias_array, columnParts[0], columnParts[1]);
                                                                if(columnSolved == null) {
                                                                    // "v_auctions"."user_id" -- B5."user_id"
                                                                    LeftJoinMap resJoin = LeftJoinMap.getByForeignTable(leftJoinsMap, columnParts[0]);
                                                                    if(resJoin != null) {
                                                                        columnSolved = column = resJoin.alias + "." + (tableIdString + columnParts[1] + tableIdString);
                                                                    }
                                                                }
                                                            } else {
                                                                columnSolved = table + "." + (tableIdString + column + tableIdString);
                                                            }
                                                        }

                                                        if(foreignColumn.indexOf("{")>=0) {
                                                            foreignColumnSolved = solveVariableField(foreignColumn, recordset_params.request, true);
                                                            if(!foreignColumnSolved.equalsIgnoreCase(foreignColumn)) {
                                                            }
                                                        } else {
                                                            foreignColumnSolved = leftJoinAlias + "." + (tableIdString + foreignColumn + tableIdString);
                                                        }

                                                        if (ilj == 0) {
                                                            leftJoinList += (joinType != null && !joinType.isEmpty() ? joinType : "LEFT JOIN ")
                                                                    + (schema != null && !schema.isEmpty() ? (tableIdString + schema + tableIdString + ".") : "")
                                                                    + (tableIdString + foreignTable + tableIdString) + asKeyword + leftJoinAlias
                                                                    + " ON "
                                                                    + foreignColumnSolved
                                                                    + "="
                                                                    + columnSolved;
                                                            leftJoinsMap.add(new LeftJoinMap(leftJoinKey, leftJoinAlias, foreignTable));
                                                        } else {
                                                            leftJoinList += " AND "
                                                                    + foreignColumnSolved
                                                                    + "="
                                                                    + columnSolved;
                                                        }
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
                                                    String column_translated = getColumnTranslated(tbl_wrk, recordset_params.session, col, colParts[1]);
                                                    String db_alias = leftJoinAlias + "." + itemIdString + column_translated + itemIdString;
                                                    aliasIndex++;
                                                    column_alias = leftJoinAlias + "_" + columnName;
                                                    column_json_list += colParts[0] + "_" + columnName;
                                                    columns_alias_array.add( new String [] { colParts[0], columnName, column_alias, db_alias } );
                                                    column_list += colMode + db_alias + asKeyword + column_alias;
                                                } else {
                                                    String columnName = getColumnAlias(col.getString("name"), aliasIndex, columnMaxLength);
                                                    String column_translated = getColumnTranslated(tbl_wrk, recordset_params.session, col);
                                                    String db_alias = leftJoinAlias + "." + itemIdString + column_translated + itemIdString;
                                                    aliasIndex++;
                                                    column_alias = leftJoinAlias + "_" + columnName;
                                                    column_json_list += columnName;
                                                    columns_alias_array.add( new String [] { table, columnName, column_alias, db_alias } );
                                                    column_list += colMode + db_alias + asKeyword + column_alias;
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
                                                    String column_translated = getColumnTranslated(tbl_wrk, recordset_params.session, col);
                                                    String db_alias = tableIdString + colParts[0] + tableIdString + "." + itemIdString + column_translated + itemIdString;
                                                    aliasIndex++;
                                                    column_alias = "A" + "_" + columnName;
                                                    column_json_list += colParts[0] + "_" + columnName;
                                                    columns_alias_array.add( new String [] { colParts[0], columnName, column_alias, db_alias } );
                                                    column_list += colMode + db_alias + asKeyword + column_alias;
                                                } else {
                                                    String columnName = getColumnAlias(col.getString("name"), aliasIndex, columnMaxLength);
                                                    String column_translated = getColumnTranslated(tbl_wrk, recordset_params.session, col);
                                                    String db_alias = itemIdString + table + itemIdString + "." + itemIdString + column_translated + itemIdString;
                                                    aliasIndex++;
                                                    column_alias = /*table*/ "A_" + columnName;
                                                    column_json_list += columnName;
                                                    columns_alias_array.add( new String [] { table, columnName, column_alias, db_alias } );
                                                    column_list += colMode + db_alias + asKeyword + column_alias;
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
                                            // Imposta l'indice targetColumnIndex
                                            if(colName.equalsIgnoreCase(targetColumn)) {
                                                targetColumnIndex = ic;
                                            }
                                        }

                                        if (bAddColumnToList) {
                                            if (column_alias_list.length() > 0) {
                                                column_alias_list += ",";
                                            }
                                            column_alias_list += column_alias;
                                        } else {
                                            // Colonna non trovata
                                            String msg = "ControId:" + tblWrkDesc + " column '"+targetColumn+"' not found";
                                            error += "[" + msg + "]";
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    error += " [ Columns Error:" + e.getLocalizedMessage() + "]";
                    System.err.println("// " + e.getLocalizedMessage());
                    return "{\"error\":\"" + ("Internal Error : "+ error + "") + "\"}";
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
            ArrayList<Object> sWhereParams = new ArrayList<Object>();
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
                    // in postgres cannot chamge database : open new connection for do that
                    // usingDatabase.add("SET search_path TO \"" + schema + "\",public");
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

            if (isOracle) {
                if (!"distinct".equalsIgnoreCase(targetMode)) { // fail the dintinct purpose
                    // fuckyou ORACLE
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
                                JSONArray filtersCols = requestJson.getJSONArray("filtersJson");    // filtri valorizzati
                                JSONArray allFiltersDefinition = null;                                  // (SOLO INFORMATIVO) tutti i gruppi di filtro
                                JSONObject filtersDefinition = null;                                    // (SOLO INFORMATIVO) filtri del gruppo corrente
                                JSONArray filtersDefinitionCols = null;                                 // (SOLO INFORMATIVO) definizione delle colonne
                                int curFilter = -1;

                                if (requestJson.has("curFilter")) {
                                    curFilter = requestJson.getInt("curFilter");

                                    if (requestJson.has("filters")) {
                                            JSONArray filterCols = null;
                                            Object oFilters = requestJson.get("filters");
                                            if(oFilters instanceof JSONArray) {
                                            } else if(oFilters instanceof JSONObject) {
                                            }
                                        // allFiltersDefinition = requestJson.getJSONArray("filters");
                                    } else {
                                        if (tbl_wrk.tableJson.has("filters")) {
                                            JSONArray filterCols = null;
                                            Object oFilters = tbl_wrk.tableJson.get("filters");
                                            if(oFilters instanceof JSONArray) {
                                            } else if(oFilters instanceof JSONObject) {
                                            }
                                            // allFiltersDefinition = tbl_wrk.tableJson.getJSONArray("filters");
                                        }
                                    }
                                } else {
                                    if (filtersCols.length() > 0) {
                                        String msg = "Filters Error:unable to get back current filter definition";
                                        error += "[" + msg + "]";
                                        System.err.println("// " + msg);
                                    }
                                }

                                if (filtersCols != null) {
                                    //
                                    // N.B.: filtersCols continene le definizioni del filtro impacchettate dal client
                                    //
                                    Object[] resWhere = process_filters_json(
                                            tbl_wrk, table, cols,
                                            isOracle, isMySQL, isPostgres, isSqlServer,
                                            sWhere, sWhereParams, filtersCols, filtersDefinitionCols, leftJoinsMap,
                                            tableIdString, itemIdString,
                                            recordset_params.request);

                                    String errorWhere = (String) resWhere[1];
                                    if (errorWhere != null && !errorWhere.isEmpty())
                                        error += "[" + errorWhere + "]";

                                    sWhere = (String) resWhere[2];
                                }
                            }

                            if(requestJson.has("ids")) {
                                try {
                                    filtersIds = requestJson.getJSONArray("ids");
                                } catch (Exception e) {
                                }
                            }
                            if (filtersIds != null) {
                                String sIdsList = "";
                                String apex = "";

                                if (isNumeric(iTypePrimaryKey)) {
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
                if (!isCrossTableService
                        // N.B.: La modalita' distinct non prevarica il pre-filtro
                        || "distinct".equalsIgnoreCase(targetMode)
                ) {
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
                            try {
                                Object [] resWhere = process_filters_json(
                                        tbl_wrk, table, cols,
                                        isOracle, isMySQL, isPostgres, isSqlServer,
                                        sWhere, sWhereParams, preFilters, null, leftJoinsMap,
                                        tableIdString, itemIdString,
                                        recordset_params.request);

                                String errorWhere = (String)resWhere[1];
                                if(errorWhere != null && !errorWhere.isEmpty())
                                    error += "[" + errorWhere + "]";

                                sWhere = (String)resWhere[2];

                            } catch (Exception e) {
                                error += "[preFilters Error:" + e.getLocalizedMessage() + " on control:"+tbl_wrk.controlId+"]";
                                System.err.println("// pre Filters Error:" + e.getLocalizedMessage() + " on control:"+tbl_wrk.controlId);
                                throw new Exception(e);
                            }                            
                        }
                    }
                }

                //
                // Ordinamenti dalla richiesta
                //
                try {
                    if (tbl_wrk != null && requestJson != null) {
                        JSONArray sortColumns = new JSONArray();
                        JSONArray sortColumnsMode = new JSONArray();
                        String sortMode = null;
                        JSONObject baseObject = null;

                        if (requestJson.has("sortColumns")) {
                            //
                            // Utilizzo ordinamento della richiesta
                            //
                            baseObject = requestJson;
                        } else {
                            //
                            // Utilizzo ordinamento di default
                            //
                            baseObject = tbl_wrk.tableJson;
                        }

                        /*
                        Modalita' accettate :
                            1) - "sort":"COLUMN,MODE", "sortMode":"SERVER/CLIENT"
                            2) - "sort":"COLUMN" "sortModes:"MODE", "sortMode":"SERVER/CLIENT"
                            3) - "sortColumns":[], "sortColumnsMode":[], "sortMode":"SERVER/CLIENT"
                            4) - "sortColumns":"COL1,COL2", "sortColumnsMode":"DESC,ASC", "sortMode":"SERVER/CLIENT"
                         */

                        if (baseObject.has("sortMode")) {
                            Object osortMode = baseObject.get("sortMode");
                            if (osortMode instanceof JSONArray) {
                                sortMode = ((JSONArray)osortMode).getString(0);
                            } else if (osortMode instanceof String) {
                                sortMode = String.valueOf(osortMode);
                            }
                        }
                        if (baseObject.has("sort")) {
                            // Case 1, 2
                            Object oSort = baseObject.get("sort");
                            if (oSort instanceof JSONArray) {
                                JSONArray srcSortColumns = baseObject.getJSONArray("sort");
                                for(int is=0; is<srcSortColumns.length(); is++) {
                                    add_sort_item(sortColumns, sortColumnsMode, srcSortColumns);
                                }
                            } else if (oSort instanceof String) {
                                add_sort_item(sortColumns, sortColumnsMode, oSort);
                            }
                            if (baseObject.has("sortModes")) {
                                Object osortColumnsMode = baseObject.get("sortModes");
                                if (osortColumnsMode instanceof JSONArray) {
                                    sortColumnsMode = baseObject.getJSONArray("sortModes");
                                } else if (osortColumnsMode instanceof String) {
                                    sortColumnsMode.put(String.valueOf(osortColumnsMode));
                                }
                            }
                        }
                        if (baseObject.has("sortColumns")) {
                            // Case 3, 4
                            set_sort_columns(sortColumns, baseObject.get("sortColumns"));
                            if (baseObject.has("sortColumnsMode")) {
                                set_sort_mode(sortColumnsMode, baseObject.get("sortColumnsMode"));
                            } else if (baseObject.has("sortModes")) {
                                set_sort_mode(sortColumnsMode, baseObject.get("sortModes"));
                            } else if (baseObject.has("sortMode")) {
                                set_sort_mode(sortColumnsMode, baseObject.get("sortMode"));
                            } else if (tbl_wrk.tableJson.has("sortMode")) {
                                set_sort_mode(sortColumnsMode, tbl_wrk.tableJson.get("sortMode"));
                            } else if (tbl_wrk.tableJson.has("sortModes")) {
                                set_sort_mode(sortColumnsMode, tbl_wrk.tableJson.get("sortModes"));
                            }
                        }
                        if (sortColumns != null) {
                            JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
                            for (int i = 0; i < sortColumns.length(); i++) {
                                String sortColumn = sortColumns.getString(i);
                                String sortColumnAlias = itemIdString + sortColumn + itemIdString;

                                if (isOracle || isPostgres || isMySQL || isSqlServer) { // need column alias
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
                                                if(col.has("alias")) {
                                                    sortColumnAlias = col.getString("alias");
                                                } else {
                                                    String sortTable = null;
                                                    String sortCol = null;
                                                    String[] colParts = colName.split("\\.");
                                                    if (colParts.length > 1) {
                                                        sortTable = colParts[0];
                                                        sortCol = colParts[1];
                                                    } else {
                                                        sortCol = colParts[0];
                                                    }
                                                    // mette l'alias del join
                                                    sortColumnAlias = (sortTable != null ? LeftJoinMap.getAlias(leftJoinsMap, sortTable) : tableIdString + table + tableIdString) + "." + itemIdString + sortCol + itemIdString;
                                                }

                                            } catch (Exception e) {
                                                error += "[sort Error:" + e.getLocalizedMessage() + " on control:"+tbl_wrk.controlId+"]";
                                                System.err.println("// sort Error:" + e.getLocalizedMessage() + " on control:"+tbl_wrk.controlId);
                                                throw new Exception(e);
                                            }
                                        }
                                    }
                                }

                                if(!"client".equalsIgnoreCase(sortMode)) {
                                    if (sortColumn != null && !sortColumn.isEmpty()) {
                                        if (sSort.length() == 0) {
                                            sSort += " ORDER BY ";
                                        } else {
                                            sSort += ",";
                                        }

                                        sSort += sortColumnAlias;

                                        if (sortColumnsMode != null && sortColumnsMode.length() > i) {
                                            sSort += " " + sortColumnsMode.getString(i);
                                        } else {
                                            sSort += " ASC";
                                        }
                                    }
                                }
                            }

                            if (sSort.length() > 0) {
                                // sSort += ")";
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

                // Aggiunto ordinamento
                executingQuery += sSort;

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
                                    if(sWhereParams != null) sWhereParams.clear();
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
                                        executingQuery += ") WHERE ROWNUM < " + (endRow);
                                        executingQuery = "select * from (select * from (" + executingQuery + ") WHERE ROWNUMBER > " + startRow + "";
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
                    String runtimeCountQuery = null;
                    try {
                        if (table != null && !table.isEmpty()) {
                            if (connToUse != null) {
                                countQuery = "SELECT COUNT(*) AS nRows FROM " + tbl_wrk.schemaTable + " " + leftJoinList + " " + sWhere;
                                psdo = connToUse.prepareStatement(countQuery);
                                if(sWhereParams != null) {
                                    for (int iParam=0; iParam<sWhereParams.size(); iParam++) {
                                        set_statement_param( psdo, iParam+1, sWhereParams.get(iParam) );
                                    }
                                }
                                runtimeCountQuery = psdo.toString();
                                rsdo = psdo.executeQuery();
                                if (rsdo != null) {
                                    if (rsdo.next()) {
                                        nRows = rsdo.getInt(1);
                                    }
                                }
                            }
                        }
                    } catch (Throwable e) {
                        error += "Count Error:" + e.getLocalizedMessage() + runtimeCountQuery + "[Driver:" + tbl_wrk.driverClass + "] controlId:" + controlId;
                        System.err.println("// Count Error:" + e.getLocalizedMessage() + runtimeCountQuery);
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
                            } catch (Exception e) {
                            }
                            if (events != null) {
                                for (int ie = 0; ie < events.length(); ie++) {
                                    JSONObject event = events.getJSONObject(ie);
                                    if (event != null) {
                                        String eventName = null;
                                        try {
                                            eventName = event.getString("name");
                                        } catch (Exception ex) {
                                        }
                                        if ("onRetrieve".equalsIgnoreCase(eventName)) {
                                            bOnRetrieveFound = true;
                                            try {
                                                serverClassName = event.getString("server");
                                            } catch (Exception ex) {
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
                            try {
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
                            } catch(Exception e) {
                                error += "onRetrive Error:" + e.getLocalizedMessage();
                                System.err.println("// onRetrive() Error:" + e.getLocalizedMessage());
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
                    System.err.println("// get_table_recordset() Error:" + e.getLocalizedMessage());
                }
            }

            // salvataggio in sessione
            if (recordset_params.bSaveQueryInfo) {
                if (!isCrossTableService) {
                    set_query_info(recordset_params.request, tbl_wrk, column_list, column_alias_list, primaryKey, dbPrimaryKey, workingTable, leftJoinList, sWhere, sSort, limitString, itemIdString);
                }
            }

            lStartTime = System.currentTimeMillis();
            try {
                if (connToUse != null) {
                    psdo = connToUse.prepareStatement(executingQuery);
                    if(sWhereParams != null) {
                        for (int iParam=0; iParam<sWhereParams.size(); iParam++) {
                            set_statement_param( psdo, iParam+1, sWhereParams.get(iParam) );
                        }
                    }
                    runtimeQuery = psdo.toString();
                    rsdo = psdo.executeQuery();
                }
            } catch (Exception e) {
                error += " [" + (tblWrkDesc) + "] Query Error:" + e.getLocalizedMessage() + " executingQuery:" + executingQuery + "]" + "[Driver:" + tbl_wrk.driverClass + "]";
                System.err.println(runtimeQuery);
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

                    JSONObject col = cols.getJSONObject(ic);

                    if(col.has("type")) {
                        try {
                            String type = col.getString("type");
                            if(!type.isEmpty()) {
                                colTypes[ic] = Integer.parseInt(type);
                            } else {
                                colTypes[ic] = 1;
                            }
                        } catch(Exception e) {
                            error += "ERROR: invalid datatype at controlId:"+tbl_wrk.controlId+" field:"+col.getString("name")+" Error:" + e.getLocalizedMessage();
                        }
                    }
                    if(col.has("precision")) {
                        colPrecs[ic] = Integer.parseInt(col.getString("precision"));
                    } else {
                        colPrecs[ic] = -1;
                    }
                    if(col.has("nullable")) {
                        colNullable[ic] = col.getBoolean("nullable");
                    } else {
                        colNullable[ic] = true;
                    }
                    if(col.has("digits")) {
                        try {
                            Object digits = col.get("digits");
                            if(digits instanceof String) {
                                colDigits[ic] = Integer.parseInt((String)digits);
                            } else if(digits instanceof Integer) {
                                colDigits[ic] = (int)digits;
                            } else {
                                colDigits[ic] = -1;
                            }
                        } catch(Exception e) {
                            int lb = 1;
                        }
                    } else {
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
                        targetColumnIndex,
                        service,
                        false,
                        recordset_params.request
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
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
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
                    // Query comprensiva dei parametry
                    base64Query = utility.base64Encode(runtimeQuery != null && !runtimeQuery.isEmpty() ? runtimeQuery : "N/D");
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



    /**
     *
     * @param sortColumns
     * @param oSortColumns
     */
    private static void set_sort_columns(JSONArray sortColumns, Object oSortColumns) {
        try {
            if (oSortColumns instanceof JSONArray) {
                sortColumns.putAll((JSONArray) oSortColumns);
            } else if (oSortColumns instanceof String) {
                if (sortColumns == null) sortColumns = new JSONArray();
                String[] sort_cols = ((String) oSortColumns).split("\\.");
                for (int is = 0; is < sort_cols.length; is++) {
                    sortColumns.put(sort_cols[is]);
                }
            }
        } catch (Exception e) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
            throw e;
        }
    }

    /**
     *
     * @param sortColumnsMode
     * @param sortMode
     */
    private static void set_sort_mode(JSONArray sortColumnsMode, Object sortMode) {
        try {
            if(sortMode != null) {
                if (sortMode instanceof JSONArray) {
                    sortColumnsMode.putAll((JSONArray)sortMode);
                } else if (sortMode instanceof String) {
                    if (sortColumnsMode == null) sortColumnsMode = new JSONArray();
                    String[] sort_modes = ((String) sortMode).split("\\.");
                    for (int is = 0; is < sort_modes.length; is++) {
                        sortColumnsMode.put(String.valueOf(sort_modes[is]));
                    }
                }
            }
        } catch (Exception e) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
            throw e;
        }
    }

    /**
     *
     * @param sortColumns
     * @param sortColumnsMode
     * @param sortItem
     */
    private static void add_sort_item(JSONArray sortColumns, JSONArray sortColumnsMode, Object sortItem) {
        if(sortItem instanceof String) {
            String[] sortPats = ((String) sortItem).split(",");
            if (sortPats.length == 1) {
                sortColumns.put(sortItem);
            } else {
                sortColumns.put(sortPats[0]);
                sortColumnsMode.put(sortPats[1]);
            }
        } else if(sortItem instanceof JSONObject) {
            JSONObject jsortItem = (JSONObject)sortItem;
            sortColumns.put(jsortItem.getString("col"));
            sortColumnsMode.put(jsortItem.getString("mode"));

        } else if(sortItem instanceof JSONArray) {
            JSONArray jsortItem = (JSONArray)sortItem;
            for(int i=0; i<jsortItem.length(); i++) {
                Object oSort = jsortItem.get(i);
                if(oSort instanceof String) {
                    String [] sortParts = ((String)oSort).split("[, ]");
                    if(sortParts.length == 1) {
                        sortColumns.put(sortParts[0]);
                        sortColumnsMode.put("ASC");
                    } else {
                        sortColumns.put(sortParts[0]);
                        sortColumnsMode.put("ASC".equalsIgnoreCase(sortParts[1]) ? "ASC" : "DESC");
                    }
                }
            }
        }
    }


    //
    // filtersCols = definizione del filtro nella richiesta (il filtro corrente passato dalla pagina web)
    // filtersDefinitionCols = definizione delle colonne del filtro corrente (nel setup del controllo)
    //
    static public Object [] process_filters_json(
            workspace tbl_wrk, String table, JSONArray cols,
            boolean isOracle, boolean isMySQL, boolean isPostgres, boolean isSqlServer,
            String sWhere, ArrayList<Object> sWhereParams,
            JSONArray filtersCols, JSONArray filtersDefinitionCols, ArrayList<LeftJoinMap> leftJoinsMap,
            String tableIdString, String itemIdString,
            HttpServletRequest request) throws Exception {

        String error = "";
        int parentesisCount = 0;
        int result = 0;

        for (int i = 0; i < filtersCols.length(); i++) {
            JSONObject filtersCol = filtersCols.getJSONObject(i);
            JSONObject col = null;
            int type = 0;
            boolean nullable = false;
            try {
                String filterTable = null;
                String filterName = null;
                String filterNameAliased = null;
                String filterFullName = null;
                String filterValue = null;
                Object oFilterValue = null;
                boolean filterValueIsSet = false;
                String filterOp = null;
                String filterLogic = null;
                String filterNextLogic = null;
                boolean filterSensitiveCase = false;
                boolean includeNullValues = false;

                filterTable = filtersCol.has("table") ? filtersCol.getString("table") : filterTable;

                filterName = filtersCol.has("name") ? filtersCol.getString("name") : filterName;

                Object filterCol = filtersCol.has("col") ? filtersCol.get("col") : null;
                if(filterCol != null) {
                    if(filterCol instanceof String) {
                        if(filterName == null) {
                            filterName = (String)filterCol;
                        }
                    }
                }
                filterNameAliased = filterName;
                filterFullName = filterName;

                try {
                    if (!filtersCol.isNull("value")) {
                        oFilterValue = filtersCol.get("value");
                        if(oFilterValue instanceof String) {
                            filterValue = filtersCol.getString("value");
                            //
                            // N.B.: risolve le variabili di sessione
                            //
                            filterValue = solveVariableField(filterValue, request, true);
                            if(oFilterValue != null && filterValue != null) {
                                if (String.valueOf(oFilterValue).compareTo(filterValue) != 0) {
                                    // Espressione risolta : reimposta l'oggetto originale (verrà usato come dato sorgente per rispettare il tipo dato)
                                    oFilterValue = filterValue;
                                }
                            }
                            filterValueIsSet = true;
                        } else if(oFilterValue instanceof JSONArray) {
                            filterValueIsSet = true;
                        } else if(oFilterValue instanceof Boolean) {
                            filterValueIsSet = true;
                        } else if(oFilterValue instanceof Integer) {
                            filterValueIsSet = true;
                        } else if(oFilterValue instanceof Long) {
                            filterValueIsSet = true;
                        } else if(oFilterValue instanceof BigDecimal) {
                            filterValueIsSet = true;
                        } else if(oFilterValue instanceof Float) {
                            filterValueIsSet = true;
                        } else if(oFilterValue instanceof Double) {
                            filterValueIsSet = true;
                        } else {
                            throw new Exception("Filter type not implemented:"+oFilterValue.getClass().getName());
                        }
                    }

                    if (filtersCol.isNull("value") || !filtersCol.has("value")) {
                        if (filtersCol.has("op")) {
                            Object op = filtersCol.get("op");
                            if(op instanceof String) {
                                if("IS NOT NULL".equalsIgnoreCase((String)op)) {
                                    oFilterValue = null;
                                    filterValue = null;
                                    filterValueIsSet = true;
                                }
                            }
                        }
                    }

                } catch (Exception e) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
                    throw new Exception("LIQUID SERVER : Error in filters:"+e.getMessage());
                }

                filterOp = filtersCol.has("op") ? filtersCol.getString("op").trim() : filterOp;

                filterLogic = filtersCol.has("logic") ? filtersCol.getString("logic").trim() : filterLogic;

                filterSensitiveCase = filtersCol.has("sensitiveCase") ? filtersCol.getBoolean("sensitiveCase") : filterSensitiveCase;


                if(filterOp != null) {
                    if (filterOp.startsWith("?")) {
                        filterOp = filterOp.substring(1);
                        includeNullValues = true;
                    }
                    // Per drefault include il NULL
                    if (filterOp.equalsIgnoreCase("!=")) {
                        includeNullValues = true;
                    }
                    // Esclude il NULL
                    if (filterOp.equalsIgnoreCase("!==")) {
                        filterOp = "!=";
                        includeNullValues = false;
                    }
                }


                // is next operator a logic 'OR' ? .. start and opening parent
                if(i+1 < filtersCols.length()) {
                    JSONObject filterNextCol = filtersCols.getJSONObject(i+1);
                    if(filterNextCol.has("logic")) {
                        filterNextLogic = filterNextCol.getString("logic");
                    }
                } 

                if (filterName != null && filterValueIsSet) {
                    String preFix = "'";
                    String postFix = "'";
                    String preFixCol = "";
                    String postFixCol = "";
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

                            if(col.has("foreignTable")) {
                                colTable = col.getString("foreignTable");
                            }
                            if(col.has("name")) {
                                colName = col.getString("name");
                            }
                            String colAlias = null;// (colTable != null ? LeftJoinMap.getAlias(leftJoinsMap, colTable) : table) + "." + itemIdString+colName+itemIdString;
                            if(col.has("alias")) {
                                colAlias = col.getString("alias");
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
                            } else if((table+"."+filterName).equalsIgnoreCase(colName)) {
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
                        String colTable = colParts[0].replace("\"", "");
                        if (colTable != null) {
                            filterName = colParts[1];
                            if (!colTable.equalsIgnoreCase(table)) {
                                if (isPostgres || isOracle) {
                                    // mette l'alias
                                    String colAlias = (colTable != null ? LeftJoinMap.getAlias(leftJoinsMap, colTable) : tableIdString + table + tableIdString) + "." + itemIdString + colParts[1] + itemIdString;
                                    filterNameAliased = colAlias != null ? colAlias : filterName;
                                } else {
                                }
                                filterTable = null;
                            } else {
                                // OK con postgres e oracle
                                filterTable = tableIdString + table + tableIdString;
                                filterNameAliased = filterName;
                            }
                        }
                        for (int ic = 0; ic < cols.length(); ic++) {
                            col = cols.getJSONObject(ic);
                            String colName = null;
                            if (col.has("name")) {
                                colName = col.getString("name");
                                if (filterFullName.equalsIgnoreCase(colName)) {
                                    bFoundCol = true;
                                    // mette l'alias
                                    String colAlias = null;
                                    if (colTable != null && !colTable.equalsIgnoreCase(table)) {
                                        colAlias = LeftJoinMap.getAlias(leftJoinsMap, colTable)  + "." + itemIdString + colParts[1] + itemIdString;
                                    } else {
                                        colAlias = colParts[1];
                                    }

                                    filterNameAliased = colAlias != null ? colAlias : filterName;
                                    break;
                                }
                            }
                        }
                        if(!bFoundCol) {
                            for (int ic = 0; ic < cols.length(); ic++) {
                                col = cols.getJSONObject(ic);
                                if(col.has("name")) {
                                    String colName = col.getString("name");
                                    if (filterName.equalsIgnoreCase(colName)) {
                                        bFoundCol = true;
                                        filterTable = null;
                                        filterNameAliased = filterName;
                                        break;
                                    }
                                }
                            }
                        }
                    } else {
                        // undetected case
                    }

                    if(bFoundCol) {
                        if (col != null) {
                            try {
                                type = col.getInt("type");
                            } catch (Exception e) {
                            }
                            try {
                                nullable = col.getBoolean("nullable");
                            } catch (Exception e) {
                            }

                            // Filtro per data nulla ... non esegue il filtro
                            if (type == 6 || type == 91 || type == 93) { // date, datetime
                                if(filterValue == null || filterValue.isEmpty()) {
                                    filterDisabled = true;
                                }
                            }

                        } else {
                            String err = " Filters Error: column '" + filterName + "' not defined on control " +tbl_wrk.controlId+ "]";
                            error += err;
                            System.err.println(err);
                        }
                    } else {
                        String err = " Filters Error: column '" + filterName + "' not found on control " +tbl_wrk.controlId+ "]";
                        error += err;
                        System.err.println(err);
                    }

                    if(filterValue != null) {
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
                                } else if (filterValue.startsWith("FULLLIKE ")) {
                                    ich += 9;
                                } else {
                                    bScan = false;
                                }
                            }
                        }
                        if (ich > ichs) {
                            filterOp = filterValue.substring(ichs, ich).trim();
                            filterValue = filterValue.substring(ich);
                        }
                    }

                    boolean bUseParams = true;

                    if(filterValue != null) {
                        //
                        // String
                        //
                        int commaIndex = filterValue.indexOf(",");

                        // NO : usare l'operatore esplicito
                        // ?!?!?! Danger ?!?!?!
                        if (commaIndex == 0 || commaIndex > 0 && filterValue.charAt(commaIndex - 1) != '\\') {
                            // filterOp = "IN";
                        }

                        if (filterValue.indexOf("*") >= 0) {
                            if (filterOp == null || filterOp.isEmpty()) {
                                filterOp = "LIKE";
                                filterValue = filterValue.replaceAll("\\*", "%");
                            }
                        }

                        if (type == 8 || type == 7 || type == 6 || type == 4 || type == 3 || type == -5 || type == -6) {
                            if (filterValue.indexOf(",") >= 0) {
                                if(filterOp == null || filterOp.isEmpty()) {
                                    if (filterValue.trim().indexOf("!") == 0) {
                                        filterOp = "NOT IN";
                                    } else {
                                        filterOp = "IN";
                                    }
                                }
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

                    } else if(oFilterValue instanceof JSONArray) {
                        //
                        // Se array -> l'operatore diventa 'IN'
                        //
                        JSONArray filterValueArray = ((JSONArray) oFilterValue);
                        filterValue = "";
                        for (int ifv = 0; ifv < filterValueArray.length(); ifv++) {
                            filterValue += (ifv > 0 ? "," : "") + String.valueOf(filterValueArray.get(ifv));
                        }
                        if(filterOp == null || filterOp.isEmpty()) {
                            filterOp = "IN";
                        }
                        preFix = "";
                        postFix = "";

                    } else if(oFilterValue instanceof Boolean) {

                    } else if(oFilterValue instanceof BigDecimal || oFilterValue instanceof Integer || oFilterValue instanceof Long) {

                    } else {
                        // wrap to is null ... id not numeric
                        if (isNumeric(type)) {
                            if(filterOp != null && !filterOp.isEmpty()) {
                            } else {
                                filterValue = "0";
                            }
                        } else if (type == 6 || type == 91 || type == 93) { // date, datetime
                            if(filterOp != null && !filterOp.isEmpty()) {
                            } else {
                                filterOp = "IS";
                                filterValue = "NULL";
                            }
                        } else {
                            if(filterOp != null && !filterOp.isEmpty()) {
                            } else {
                                filterOp = "IS";
                                filterValue = "NULL";
                            }
                        }
                    }


                    if ("IS".equalsIgnoreCase(filterOp)) {
                        if ("NULL".equalsIgnoreCase(filterValue)) {
                            preFix = " ";
                            postFix = "";
                            filterValue = null;
                            oFilterValue = null;
                            bUseParams = false;
                        }
                    }
                    if ("IS NOT NULL".equalsIgnoreCase(filterOp) || "IS NULL".equalsIgnoreCase(filterOp)) {
                        preFix = " ";
                        postFix = "";
                        filterValue = null;
                        oFilterValue = null;
                        bUseParams = false;
                    }

                    if ("IN".equalsIgnoreCase(filterOp) || "NOT IN".equalsIgnoreCase(filterOp)) {
                        preFix = "(";
                        postFix = ")";
                        if (filterValue == null || filterValue.isEmpty()) {
                            if (type == 8 || type == 7 || type == 6 || type == 4 || type == 3 || type == -5 || type == -6) {
                                preFix = "";
                                postFix = "";
                                // filterValue = "NULL";
                                // (NOT)IN(NULL) -> (NOT)IN(0)
                                filterValue = "0";
                            } else {
                                // filterValue = "''";
                                filterValue = null;
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

                    if ("LIKE".equalsIgnoreCase(filterOp) || "FULLLIKE".equalsIgnoreCase(filterOp) || "%".equalsIgnoreCase(filterOp)) {
                        if (isNumeric(type)) {
                            // numeric : like unsupported
                            filterOp = "=";
                        } else {
                            filterOp = "LIKE";
                            if (filterValue != null && !filterValue.isEmpty()) {
                                filterValue = (filterValue.charAt(0) != '%' ? "%" : "") + filterValue;
                                filterValue = filterValue + (filterValue.length() > 0 ? (filterValue.charAt(filterValue.length() - 1) != '%' ? "%" : "") : "");
                            } else {
                                //
                                // no value : assume like "" as no filter
                                //
                                filterDisabled = true;
                            }
                        }
                    }

                    if ("".equalsIgnoreCase(filterOp) || "=".equalsIgnoreCase(filterOp) ||  "==".equalsIgnoreCase(filterOp) ||  "===".equalsIgnoreCase(filterOp)) {
                        if (filterValue != null && !filterValue.isEmpty()) {
                        } else {
                            //
                            // no value : assume like "" as no filter
                            //
                            filterDisabled = true;
                        }
                    }


                    if (">".equalsIgnoreCase(filterOp)) {
                        if (col != null) {
                            if (isNumeric(type)) {
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
                    

                    //
                    // Sensitive case ?
                    //
                    String sensitiveCasePreOp = "";
                    String sensitiveCasePostOp = "";
                    if (!filterSensitiveCase) {
                        if (isNumeric(type)) {
                            // numeric
                        } else if (type == 6 || type == 92 || type == 93) {
                            //
                            // date datetime
                            //
                            // N.B.: o si utilizzazno i parametri e si converse la saatringa filtro in java.util.timestamp o java.util.date
                            //          o si utilizza il to_date() come espressione e non come stringa 'to_date()'
                            //
                            bUseParams = false;
                        } else {
                            if(bFoundCol) {
                                if(filterValue != null) {
                                    oFilterValue = filterValue = filterValue.toLowerCase();
                                }
                                sensitiveCasePreOp = "lower(";
                                sensitiveCasePostOp = ")";
                            } else {
                                // Non si sa che colonna è : lower su dato numero costituisce eccezione
                            }
                        }
                    }


                    //
                    // Numeric ?
                    //
                    if (bUseParams) {
                        if (isNumeric(type)) {
                            // numeric
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

                        // Formattazione del dato
                        Object filterValueObject = null;
                        if ("IN".equalsIgnoreCase(filterOp) || "NOT IN".equalsIgnoreCase(filterOp)) {
                            // Conversione in Array
                            if(filterValue != null) {
                                String[] filterValues = filterValue.split(",");
                                ArrayList<Object> filterValueObjects = new ArrayList<Object>();
                                for (int iv = 0; iv < filterValues.length; iv++) {
                                    String val = filterValues[iv];

                                    if (isNumeric(type)) {
                                        // numeric
                                        if(val.startsWith("'")) val = val.substring(1);
                                        if(val.endsWith("'")) val = val.substring(0, val.length()-2);
                                    } else {
                                        val = "'" + val + "'";
                                    }
                                    filterValueObjects.add(toJavaType(type, (Object) val, null, -1));
                                }
                                filterValueObject = (Object) filterValueObjects;
                                filterValue = utility.objArrayToString(filterValueObjects, null, null, ",");
                            }
                        } else {
                        }
                        
                        
                        
                        //
                        // compute the value by metadata
                        //
                        int filterValueType = (int)1;
                        if ("IN".equalsIgnoreCase(filterOp) || "NOT IN".equalsIgnoreCase(filterOp)) {
                            //
                            // Un disastro con i parametri ....
                            // e = (PSQLException) org.postgresql.util.PSQLException: ERROR: operator does not exist: bigint = bigint[] Hint: No operator matches the given name and argument types. You might need to add explicit type casts. Position: 78
                            //
                            bUseParams = false;
                            preFix = "(";
                            postFix = ")";
                            
                        } else {
                            Object[] fres = format_db_value(tbl_wrk, type, nullable, oFilterValue, filterOp, null);
                            filterValueType = (int) fres[1];

                            // uso dei parametri : conversione del dato in formato java
                            filterValueObject = toJavaType(type, (Object)fres[0], (Object)fres[0], (int)fres[1], true);

                            if (filterValueType == 0) {
                                // expression
                                preFix = "";
                                postFix = "";
                                filterValue = (String)filterValueObject;
                            } else if (filterValueType == -1) {
                                // truncate
                                preFix = "";
                                postFix = "";
                                preFixCol = "TRUNC(";
                                postFixCol = ")";
                            } else if (filterValueType == 1) {
                                filterValue = (String) fres[0];
                            } else if (filterValueType == Types.BIT) {
                                filterValue = null;
                                sensitiveCasePreOp = "";
                                sensitiveCasePostOp = "";
                            } else if (filterValueType == Types.BIGINT
                                    || filterValueType == Types.TINYINT
                                    || filterValueType == Types.SMALLINT
                                    || filterValueType == Types.INTEGER
                                    || filterValueType == Types.BIGINT
                                    || filterValueType == Types.FLOAT
                                    || filterValueType == Types.REAL
                                    || filterValueType == Types.DOUBLE
                                    || filterValueType == Types.NUMERIC
                                    || filterValueType == Types.DECIMAL
                            ) {
                                filterValue = null;
                                sensitiveCasePreOp = "";
                                sensitiveCasePostOp = "";
                            } else if (filterValueType == -999) {
                                filterValue = null;
                                sensitiveCasePreOp = "";
                                sensitiveCasePostOp = "";
                            } else {
                                filterValue = null;
                                System.err.println("Invalid java type in filter:"+filterValueType);
                            }
                        }


                        // NB.:
                        //  oFilterValue = valore originale del filtro
                        //  filterValueObject = valore del filtro in tipo classe Object (usato con i parametri)
                        //  filterValue = valore del filtro in tipo classe String (usato per le espressioni)

                        // is next operator logic not 'OR' ? closing parent
                        if("OR".equalsIgnoreCase(filterNextLogic)) {
                            if(parentesisCount == 0) {
                                sWhere += "(";
                                parentesisCount++;
                            }
                        }


                        //
                        // Escaping chars
                        //
                        if (filterValueType == 1) {
                            if(filterValue != null) {
                                if ("IN".equalsIgnoreCase(filterOp) || "NOT IN".equalsIgnoreCase(filterOp)) {
                                } else {
                                    if (filterValue.indexOf("'") >= 0) {
                                        filterValue = filterValue.replace("'", "''");
                                    }
                                }
                            }
                        }


                        if(includeNullValues) {
                            sWhere += "(";
                        }

                        String filteringFieldName = (filterTable != null && !filterTable.isEmpty() ? (filterTable + "." + itemIdString + filterNameAliased + itemIdString) : (filterNameAliased));

                        //
                        // add where clausole
                        //
                        sWhere += sensitiveCasePreOp
                                + preFixCol
                                + filteringFieldName
                                + postFixCol
                                + sensitiveCasePostOp
                                + (filterOp != null && !filterOp.isEmpty() ? " " + filterOp + " " : "=");
                                
                        if(bUseParams &&  sWhereParams != null) {
                            sWhere += "?";
                            sWhereParams.add(filterValueObject);
                        } else {
                            sWhere += ""
                                    + preFix
                                    + (filterValue != null ? filterValue : "")
                                    + postFix
                                    ;
                        }


                        if(includeNullValues) {
                            sWhere += " OR " + filteringFieldName + " IS NULL)";
                        }

                        
                        // is operator logic not 'OR' ? close the parent
                        if(!"OR".equalsIgnoreCase(filterLogic) && filterNextLogic == null) {
                            if(parentesisCount>0) {
                                sWhere += ")";
                                parentesisCount--;
                            }
                        }

                        // is the last Filter ? closing open parents
                        if(i+1 >= filtersCols.length()) {
                            for (int ip=0; ip<parentesisCount; ip++) {
                                sWhere += ")";
                            }
                        }                        
                    }
                }
            } catch (Exception e) {
                error += " Filters Error:" + e.getLocalizedMessage() + "]";
                System.err.println("// " + e.getLocalizedMessage());
                throw new Exception(e);
            }
        }

        return new Object [] { result, error, sWhere };
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
     * @param skipMissingField
     * @return json of the records (String)
     * @see db
     */
    protected static Object[] get_recordset(workspace tbl_wrk,
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
                                            int targetColumnIndex,
                                            String service,
                                            boolean skipMissingField,
                                            HttpServletRequest request
    ) throws Exception {
        int addedRow = 0;
        StringBuilder out_string = new StringBuilder("");
        StringBuilder out_codes_string = new StringBuilder("");
        StringBuilder out_values_string = new StringBuilder("");
        String fieldValue = null, error = "";
        String reqDateSep = request != null ? (String)request.getAttribute("dateSep") : null;
        String reqTimeSep = request != null ? (String)request.getAttribute("timeSep") : null;
        String dateSep = reqDateSep != null ? reqDateSep : workspace.dateSep;
        String timeSep = reqTimeSep != null ? reqTimeSep : workspace.timeSep;
        DateFormat dateFormat = new SimpleDateFormat("dd" + dateSep + "MM" + dateSep + "yyyy");
        DateFormat dateTimeFormat = new SimpleDateFormat("dd" + dateSep + "MM" + dateSep + "yyyy HH" + timeSep + "mm" + timeSep + "ss.SS");
        NumberFormat nf = NumberFormat.getInstance();
        ArrayList<Long> ids = new ArrayList<Long>();
        boolean renderService = "render".equalsIgnoreCase(service);

        // N.B.: all time to GMT
        TimeZone timeZone = TimeZone.getTimeZone("GMT");
        TimeZone.setDefault(timeZone);

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
                JSONObject col = cols.getJSONObject(ic);
                try {
                    colTypes[ic] = 1;
                    if(col.has("type")) {
                        String type = String.valueOf(col.get("type"));
                        if(!type.isEmpty()) {
                            colTypes[ic] = Integer.parseInt(type);
                        }
                    }
                } catch (Exception e) {
                }
                try {
                    if(col.has("precision")) {
                        colPrecs[ic] = Integer.parseInt(String.valueOf(col.get("precision")));
                    }
                } catch (Exception e) {
                    colPrecs[ic] = -1;
                }
                try {
                    if(col.has("digits")) {
                        colDigits[ic] = Integer.parseInt(String.valueOf(col.get("digits")));
                    }
                } catch (Exception e) {
                    colDigits[ic] = -1;
                }
                try {
                    if(col.has("nullable")) {
                        colNullable[ic] = col.getBoolean("nullable");
                    }
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
                        int field_added = 0;

                        try {
                            if (idColumn != null) {
                                fieldValue = rsdo.getString(idColumn);
                                out_codes_string.append("\"" + fieldValue + "\"");
                            }
                            if (isCrossTableService) {
                                int ic = targetColumnIndex;
                                if (colTypes[ic] == 8) {
                                    fieldValue = rsdo.getString(columns_alias[0]);
                                } else if (colTypes[ic] == 91) { //date
                                    try {
                                        java.sql.Date dbSqlDate = rsdo.getDate(columns_alias[0]);
                                        fieldValue = dbSqlDate != null ? dateFormat.format(dbSqlDate) : null;
                                        if (renderService) {
                                            if (fieldValue == null) fieldValue = "";
                                        }
                                        out_values_string.append("\"" + fieldValue + "\"");
                                        field_added++;

                                    } catch (Exception e) {
                                        Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
                                        throw new Exception(e);
                                    }
                                } else if (colTypes[ic] == 92) { //time
                                    try {
                                        Time dbSqlTime = rsdo.getTime(columns_alias[0]);
                                        fieldValue = dbSqlTime != null ? dateFormat.format(dbSqlTime) : null;
                                        if (renderService) {
                                            if (fieldValue == null) fieldValue = "";
                                        }
                                        out_values_string.append("\"" + fieldValue + "\"");
                                        field_added++;
                                    } catch (Exception e) {
                                        Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
                                        throw new Exception(e);
                                    }
                                } else if (colTypes[ic] == 6 || colTypes[ic] == 93) { // datetime
                                    try {
                                        Time dbSqlDateTime = rsdo.getTime(columns_alias[0]);
                                        fieldValue = dbSqlDateTime != null ? dateTimeFormat.format(dbSqlDateTime) : null;
                                        if (renderService) {
                                            if (fieldValue == null) fieldValue = "";
                                        }
                                        out_values_string.append("\"" + fieldValue + "\"");
                                        field_added++;
                                    } catch (Exception e) {
                                        // fieldValue = "00" + workspace.dateSep + "00" + workspace.dateSep + "0000 00" + workspace.timeSep + "00" + workspace.timeSep + "00";
                                        Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
                                        throw new Exception(e);
                                    }
                                } else if (colTypes[ic] == -7) {
                                    out_values_string.append("" + rsdo.getBoolean(columns_alias[0]) + "");
                                    field_added++;
                                } else {
                                    fieldValue = rsdo.getString(columns_alias[0]);
                                    if(fieldValue != null) fieldValue = fieldValue.replace("\"", "\\\"");
                                    out_values_string.append("\"" + (fieldValue != null ? fieldValue : "") + "\"");
                                    field_added++;
                                }

                            } else {
                                for (int ic = 0; ic < cols.length(); ic++) {
                                    String columnAlias = columns_alias != null && (ic < columns_alias.length) ? (columns_alias != null ? columns_alias[ic] : null) : null;
                                    try {
                                        if (ic < maxColumn || maxColumn <= 0) {
                                            JSONObject col = cols.getJSONObject(ic);

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
                                                    nf.setGroupingUsed(false);
                                                    nf.setMaximumFractionDigits(colDigits[ic]);
                                                    fieldValue = nf.format(dFieldValue);
                                                }
                                                if (ic > 0) out_string.append(",");
                                                out_string.append("\"" + fieldName + "\":\"" + (fieldValue != null ? fieldValue : "") + "\"");
                                                field_added++;

                                            } else if (colTypes[ic] == 91) { //date
                                                java.sql.Date dbSqlDate = columnAlias != null ? rsdo.getDate(columnAlias) : rsdo.getDate(ic + 1);
                                                fieldValue = dbSqlDate != null ? dateFormat.format(dbSqlDate) : null;
                                                if(renderService) {
                                                    if(fieldValue == null) fieldValue = "";
                                                }
                                                if (ic > 0) out_string.append(",");
                                                out_string.append("\"" + fieldName + "\":\"" + (fieldValue != null ? fieldValue : "") + "\"");
                                                field_added++;

                                            } else if (colTypes[ic] == 92) { //time
                                                Time dbSqlTime = columnAlias != null ? rsdo.getTime(columnAlias) : rsdo.getTime(ic + 1);
                                                fieldValue = dbSqlTime != null ? dateFormat.format(dbSqlTime) : null;
                                                if(renderService) {
                                                    if(fieldValue == null) fieldValue = "";
                                                }
                                                if (ic > 0) out_string.append(",");
                                                out_string.append("\"" + fieldName + "\":\"" + (fieldValue != null ? fieldValue : "") + "\"");
                                                field_added++;

                                            } else if (colTypes[ic] == 6 || colTypes[ic] == 93) { // datetime
                                                Timestamp dbSqlDateTime = columnAlias != null ? rsdo.getTimestamp(columnAlias) : rsdo.getTimestamp(ic + 1);
                                                fieldValue = dbSqlDateTime != null ? dateTimeFormat.format(dbSqlDateTime) : null;
                                                if(renderService) {
                                                    if(fieldValue == null) fieldValue = "";
                                                }
                                                // } catch (Exception e) { fieldValue = "00" + workspace.dateSep + "00" + workspace.dateSep + "0000 00" + workspace.timeSep + "00" + workspace.timeSep + "00"; }
                                                if (ic > 0) out_string.append(",");
                                                out_string.append("\"" + fieldName + "\":\"" + (fieldValue != null ? fieldValue : "") + "\"");
                                                field_added++;

                                            } else if (colTypes[ic] == -7) {
                                                fieldValue = "" + (columnAlias != null ? rsdo.getBoolean(columnAlias) : rsdo.getBoolean(ic + 1));
                                                if (ic > 0) out_string.append(",");
                                                out_string.append("\"" + fieldName + "\":" + (fieldValue != null ? fieldValue : "") + "");
                                                field_added++;
                                            } else {
                                                fieldValue = columnAlias != null ? rsdo.getString(columnAlias) : rsdo.getString(ic + 1);
                                                // N.B.: Protocollo JSON : nella risposta JSON il caratere "->\" è a carico del server, e di conseguenza \->\\
                                                fieldValue = fieldValue != null ? fieldValue.replace("\\", "\\\\").replace("\"", "\\\"") : db.NULLValue;
                                                if (ic > 0) out_string.append(",");
                                                out_string.append("\"" + fieldName + "\":\"" + (fieldValue != null ? fieldValue : "") + "\"");
                                                field_added++;
                                            }
                                        }
                                    } catch (Exception e) {
                                        if(skipMissingField) {
                                            // IN TEST : null non significa inesistente
                                            // if (ic > 0) out_string.append(",");
                                            // out_string.append("\"" + fieldName + "\":null");
                                        } else {
                                            throw new Exception(e);
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            fieldValue = "";
                            error += "[ Retrieve Error:" + e.getLocalizedMessage() + executingQuery + " ]" + "[Driver:" + tbl_wrk.driverClass + "]";
                            System.err.println("// Retrieve Error at cRow:" + cRow + " fieldName:" + fieldName + " fieldValue:" + fieldValue + " Error:" + e.getLocalizedMessage() + executingQuery);
                            throw new Exception(e);
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
            } catch (Exception ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return false;
    }

    static public boolean set_prefilter(workspace tbl_wrk, String fieldName, String fieldValue, String filterOperator, String filterLogic) {
        return add_prefilter(tbl_wrk, fieldName, fieldValue, filterOperator, filterLogic);
    }
    static public boolean set_prefilter(workspace tbl_wrk, String fieldName, String fieldValue, String filterOperator) {
        return add_prefilter(tbl_wrk, fieldName, fieldValue, filterOperator, null);
    }

    static public boolean set_prefilter(workspace tbl_wrk, String fieldName, String fieldValue) {
        return add_prefilter(tbl_wrk, fieldName, fieldValue, null, null);
    }

    static public boolean add_prefilter(workspace tbl_wrk, String fieldName, String fieldValue) {
        return add_prefilter(tbl_wrk, fieldName, fieldValue, null, null);
    }

    static public boolean add_prefilter(workspace tbl_wrk, String fieldName, String fieldValue, String filterOperator, String filterLogic) {
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
                if (filterLogic != null && !filterLogic.isEmpty()) {
                    preFilter.put("logic", filterLogic);
                }
                preFilters.put(preFilter);
                tbl_wrk.tableJson.put("preFilters", preFilters);
                return true;
            } catch (Exception ex) {
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
            } catch (Exception ex) {
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

                    if(session != null) {
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
                    }

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
     * Insert row by Fields and Values
     *
     * the connection is opened by the class app.liquid.dbx.connection.getDBConnection"
     *
     * @param DatabaseSchemaTable
     * @param Fields
     * @param Values
     * @return Object [] (boolean, int)
     * @throws Throwable
     */
    static public Object [] insert_row ( String DatabaseSchemaTable, String [] Fields, Object [] Values ) throws Throwable {
        return insert_row ( DatabaseSchemaTable, Fields, Values, null);
    }

    /**
     *
     * Insert row by Fields and Values
     *
     * the connection is opened by the class app.liquid.dbx.connection.getDBConnection"
     *
     * @param DatabaseSchemaTable
     * @param FieldsAndValues
     * @param request
     * @return
     * @throws Throwable
     */
    static public Object [] insert_row ( String DatabaseSchemaTable, HashMap<String, Object> FieldsAndValues, HttpServletRequest request ) throws Throwable {
        String [] Fields = utility.arrayToArray(FieldsAndValues.keySet().toArray(), String.class);
        Object [] Values = FieldsAndValues.values().toArray();
        return insert_row ( DatabaseSchemaTable, Fields, Values, request);
    }

    /**
     *
     * Insert row by Fields and Values
     *
     * the connection is opened by the class app.liquid.dbx.connection.getDBConnection"
     *
     * @param DatabaseSchemaTable
     * @param FieldsAndValues
     * @return
     * @throws Throwable
     */
    static public Object [] insert_row ( String DatabaseSchemaTable, HashMap<String, Object> FieldsAndValues ) throws Throwable {
        return insert_row ( DatabaseSchemaTable, FieldsAndValues,null);
    }


    /**
     * Insert row by Fields and Values
     *
     * the connection is opened by the class app.liquid.dbx.connection.getDBConnection"
     *
     * @param DatabaseSchemaTable
     * @param Fields
     * @param Values
     * @param request
     * @return Object [] (boolean OK/KO, Object newId/error num, String error)
     * @throws Throwable
     */
    static public Object [] insert_row ( String DatabaseSchemaTable, String [] Fields, Object [] Values, HttpServletRequest request ) throws Throwable {
        boolean retVal = false;
        Object new_id = null;

        Connection conn = null;
        String sSTMTUpdate = null;

        if(DatabaseSchemaTable == null || Fields == null || Values == null) {
            return new Object [] { false, -1, "invalid params" };
        }
        if(Fields.length > Values.length) {
            return new Object [] { false, -1, "size fields/values mismath" };
        }

        try {

            if(transaction.isTransaction(request)) {
                conn = transaction.getTransaction(request);
            } else {
                Object[] connResult = connection.getDBConnection();
                conn = (Connection) connResult[0];
                String connError = (String) connResult[1];
                if (conn == null) {
                    String err = "insert_row() : connect failed \n\nError is : "+connError;
                    System.out.println("// LIQUID ERROR : " + err);
                    return new Object [] { false, -1, utility.base64Encode(err) };
                }
            }

            if (conn != null) {
                String [] dbParts = DatabaseSchemaTable.split("\\.");
                if(dbParts.length >= 3) {
                    DatabaseSchemaTable = dbParts[1]+"."+dbParts[2];
                }

                sSTMTUpdate = "INSERT INTO "+DatabaseSchemaTable+" (";

                for(int i=0; i<Fields.length; i++) {
                    sSTMTUpdate += (i > 0 ? "," : "") + "\"" + Fields[i].replace("\"", "") + "\"";
                }
                sSTMTUpdate += ") VALUES (";
                for(int i=0; i<Fields.length; i++) {
                    Object val = Values[i];
                    if (val instanceof Expression) {
                        sSTMTUpdate += (i > 0 ? "," : "") + ""+((Expression) val).getMethodName() +"";
                    } else if (val instanceof StringBuffer) {
                        sSTMTUpdate += (i > 0 ? "," : "") + ((StringBuffer)val).toString();
                    } else {
                        sSTMTUpdate += (i > 0 ? "," : "") + "?";
                    }
                }
                sSTMTUpdate += ")";

                PreparedStatement sqlSTMTUpdate = conn.prepareStatement(sSTMTUpdate, Statement.RETURN_GENERATED_KEYS);

                int ip = 1;
                for(int i=0; i<Values.length; i++) {
                    if(i < Fields.length) {
                        if(mapStatementParam(sqlSTMTUpdate, ip, Values[i])) {
                            ip++;
                        }
                    }
                }

                if(workspace.projectMode) {
                    System.out.print("// LIQUID Query: ");
                    System.out.println(sqlSTMTUpdate);
                }

                int res = sqlSTMTUpdate.executeUpdate();
                if (res < 0) {
                    System.err.println("Error updating db");
                    retVal = false;
                } else {
                    ResultSet rs = sqlSTMTUpdate.getGeneratedKeys();
                    if (rs != null && rs.next()) {
                        switch (rs.getMetaData().getColumnType(1)) {
                            case Types.INTEGER:
                                new_id = rs.getInt(1);
                                break;
                            case Types.NUMERIC:
                                new_id = rs.getInt(1);
                                break;
                            case Types.NVARCHAR:
                            case Types.VARCHAR:
                                new_id = rs.getString(1);
                                break;
                            case Types.BIGINT:
                            case Types.DECIMAL:
                                new_id = rs.getBigDecimal(1);
                                break;
                            case Types.ROWID:
                                new_id = rs.getRowId(1);
                                break;
                            default:
                                throw new UnsupportedOperationException("ID type non implemented ... please update me");
                        }

                        retVal = true;
                    }
                    if (rs != null)
                        rs.close();
                }
                sqlSTMTUpdate.close();
                sqlSTMTUpdate = null;
            }


        } catch (Exception e) {
            System.err.println("insert_row() error : "+e.getMessage());
            retVal = false;

            if(transaction.isTransaction(request)) {
            } else {
                try {
                    if (conn != null)
                        conn.rollback();
                } catch (Throwable e2) {
                }
            }
            throw e;

        } finally {
            if(transaction.isTransaction(request)) {
            } else {
                try {
                    if (conn != null)
                        conn.close();
                    conn = null;
                } catch (Throwable e2) {
                }
            }
        }

        return new Object [] { retVal, new_id } ;
    }


    /**
     * Delete row by keyFields and keyValues
     *
     * the connection is opened by the class app.liquid.dbx.connection.getDBConnection"
     *
     * @param DatabaseSchemaTable
     * @param keyFields
     * @param keyValues
     * @param request
     * @return
     * @throws Throwable
     */
    static public Object [] delete_row ( String DatabaseSchemaTable, String [] keyFields, Object [] keyValues, HttpServletRequest request ) throws Throwable {
        boolean retVal = false;
        Object new_id = null;

        Connection conn = null;
        String sSTMTDelete = null;

        if(DatabaseSchemaTable == null || keyFields == null || keyValues == null) {
            return new Object [] { false, -1, "invalid params" };
        }
        if(keyFields.length > keyValues.length) {
            return new Object [] { false, -1, "size fields/values mismath" };
        }

        try {

            if(transaction.isTransaction(request)) {
                conn = transaction.getTransaction(request);
            } else {
                Object[] connResult = connection.getDBConnection();
                conn = (Connection) connResult[0];
                String connError = (String) connResult[1];
                if (conn == null) {
                    String err = "delete_row() : connect failed \n\nError is : "+connError;
                    System.out.println("// LIQUID ERROR : " + err);
                    return new Object [] { false, -1, utility.base64Encode(err) };
                }
            }

            if (conn != null) {
                String [] dbParts = DatabaseSchemaTable.split("\\.");
                if(dbParts.length >= 3) {
                    DatabaseSchemaTable = dbParts[1]+"."+dbParts[2];
                }

                sSTMTDelete = "DELETE FROM "+DatabaseSchemaTable+" WHERE (";
                for(int i=0; i<keyFields.length; i++) {
                    sSTMTDelete += (i > 0 ? "," : "") + "\"" + keyFields[i].replace("\"", "") + "\"";
                    sSTMTDelete += "=";
                    Object val = keyValues[i];
                    if (val instanceof Expression) {
                        sSTMTDelete += (i > 0 ? "," : "") + ""+((Expression) val).getMethodName() +"";
                    } else if (val instanceof StringBuffer) {
                        sSTMTDelete += (i > 0 ? "," : "") + ((StringBuffer)val).toString();
                    } else {
                        sSTMTDelete += (i > 0 ? "," : "") + "?";
                    }
                }
                sSTMTDelete += ")";

                PreparedStatement sqlSTMTDelete = conn.prepareStatement(sSTMTDelete, Statement.RETURN_GENERATED_KEYS);

                int ip = 1;
                for(int i=0; i<keyValues.length; i++) {
                    if(i < keyFields.length) {
                        if(mapStatementParam(sqlSTMTDelete, ip, keyValues[i])) {
                            ip++;
                        }
                    }
                }

                if(workspace.projectMode) {
                    System.out.print("// LIQUID Query: ");
                    System.out.println(sqlSTMTDelete);
                }

                int res = sqlSTMTDelete.executeUpdate();
                if (res < 0) {
                    System.err.println("Error updating db");
                    retVal = false;
                } else {
                    ResultSet rs = sqlSTMTDelete.getGeneratedKeys();
                    if (rs != null && rs.next()) {
                        switch (rs.getMetaData().getColumnType(1)) {
                            case Types.INTEGER:
                                new_id = rs.getInt(1);
                                break;
                            case Types.NUMERIC:
                                new_id = rs.getInt(1);
                                break;
                            case Types.NVARCHAR:
                            case Types.VARCHAR:
                                new_id = rs.getString(1);
                                break;
                            case Types.BIGINT:
                            case Types.DECIMAL:
                                new_id = rs.getBigDecimal(1);
                                break;
                            case Types.ROWID:
                                new_id = rs.getRowId(1);
                                break;
                            default:
                                throw new UnsupportedOperationException("ID type non implemented ... please update me");
                        }

                        retVal = true;
                    }
                    if (rs != null)
                        rs.close();
                }
                sqlSTMTDelete.close();
                sqlSTMTDelete = null;
            }


        } catch (Exception e) {
            System.err.println("delete_row() error : "+e.getMessage());
            retVal = false;

            if(transaction.isTransaction(request)) {
            } else {
                try {
                    if (conn != null)
                        conn.rollback();
                } catch (Throwable e2) {
                }
            }
            throw e;

        } finally {
            if(transaction.isTransaction(request)) {
            } else {
                try {
                    if (conn != null)
                        conn.close();
                } catch (Throwable e2) {
                }
            }
            conn = null;
        }

        return new Object [] { retVal, new_id } ;
    }


    /**
     * Insert or update row by Fields and Values
     *
     * the connection is opened by the class app.liquid.dbx.connection.getDBConnection"
     *
     * @param DatabaseSchemaTable
     * @param Fields
     * @param Values
     * @return Object [] (boolean OK/KO, Object newId/error num, String error)
     * @throws Throwable
     */
    static public Object [] insert_update_row ( String DatabaseSchemaTable, String [] Fields, Object [] Values, Object [] keys) throws Throwable {
        return insert_update_row (DatabaseSchemaTable, Fields, Values, keys, null );
    }

    /**
     * Insert or update row by Fields and Values
     *
     * the connection is opened by the class app.liquid.dbx.connection.getDBConnection"
     *
     * @param DatabaseSchemaTable
     * @param FieldsAndValues
     * @param keys
     * @return
     * @throws Throwable
     */
    static public Object [] insert_update_row ( String DatabaseSchemaTable, HashMap<String,Object>FieldsAndValues, Object [] keys) throws Throwable {
        String [] Fields = utility.arrayToArray(FieldsAndValues.keySet().toArray(), String.class);
        Object [] Values = FieldsAndValues.values().toArray();
        return insert_update_row (DatabaseSchemaTable, Fields, Values, keys, null );
    }

    /**
     * Insert or update row by Fields and Values
     *
     * the connection is opened by the class app.liquid.dbx.connection.getDBConnection"
     *
     * @param DatabaseSchemaTable
     * @param Fields
     * @param Values
     * @param request
     * @return Object [] (boolean OK/KO, Object newId/error num, String error)
     * @throws Throwable
     */
    static public Object [] insert_update_row ( String DatabaseSchemaTable, String [] Fields, Object [] Values, Object [] keys, HttpServletRequest request ) throws Throwable {
        boolean retVal = false;
        Object new_id = null;

        Connection conn = null;
        String sSTMTUpdate = null;

        if(DatabaseSchemaTable == null || Fields == null || Values == null) {
            return new Object [] { false, -1 };
        }
        if(Fields.length > Values.length) {
            return new Object [] { false, -1 };
        }

        try {

            if(transaction.isTransaction(request)) {
                conn = transaction.getTransaction(request);
            } else {
                Object[] connResult = connection.getDBConnection();
                conn = (Connection) connResult[0];
                String connError = (String) connResult[1];
                if (conn == null) {
                    String err = "insert_update_row() : connect failed \n\nError is : "+connError;
                    System.out.println("// LIQUID ERROR : " + err);
                    return new Object [] { false, -1, utility.base64Encode(err) };
                }
            }

            if (conn != null) {
                String [] dbParts = DatabaseSchemaTable.split("\\.");
                if(dbParts.length >= 3) {
                    DatabaseSchemaTable = dbParts[1]+"."+dbParts[2];
                }

                sSTMTUpdate = "INSERT INTO "+DatabaseSchemaTable+" (";

                ArrayList<Object> params = new ArrayList<Object>();
                for(int i=0; i<Fields.length; i++) {
                    sSTMTUpdate += (i > 0 ? "," : "") + "\"" + Fields[i] + "\"";
                }
                sSTMTUpdate += ") VALUES (";
                for(int i=0; i<Fields.length; i++) {
                    sSTMTUpdate += (i > 0 ? "," : "") + "?";
                    params.add(Values[i]);
                }


                String sUpdatingFields = "";
                String sConflictFields = "";
                for(int i=0; i<Fields.length; i++) {
                    if(ArrayUtils.contains(keys, Fields[i])) {
                        sConflictFields += (sConflictFields.length() > 0 ? "," : "") + "\"" + Fields[i] + "\"";
                    } else {
                        sUpdatingFields += (sUpdatingFields.length() > 0 ? "," : "") + "\"" + Fields[i] + "\"" + "=?";
                        params.add(Values[i]);
                    }
                }

                sSTMTUpdate += ") ON CONFLICT("+sConflictFields+") DO UPDATE SET "+sUpdatingFields+"";

                PreparedStatement sqlSTMTUpdate = conn.prepareStatement(sSTMTUpdate, Statement.RETURN_GENERATED_KEYS);

                for(int i=0; i<params.size(); i++) {
                    set_statement_param( sqlSTMTUpdate, i+1, params.get(i) );
                }


                if(workspace.projectMode) {
                    System.out.print("// LIQUID Query: ");
                    System.out.println(sqlSTMTUpdate);
                }

                int res = sqlSTMTUpdate.executeUpdate();
                if (res < 0) {
                    System.err.println("Error updating db");
                    retVal = false;
                } else {
                    ResultSet rs = sqlSTMTUpdate.getGeneratedKeys();
                    if (rs != null && rs.next()) {
                        switch (rs.getMetaData().getColumnType(1)) {
                            case Types.INTEGER:
                                new_id = rs.getInt(1);
                                break;
                            case Types.NUMERIC:
                                new_id = rs.getInt(1);
                                break;
                            case Types.NVARCHAR:
                            case Types.VARCHAR:
                                new_id = rs.getString(1);
                                break;
                            case Types.BIGINT:
                            case Types.DECIMAL:
                                new_id = rs.getBigDecimal(1);
                                break;
                            case Types.ROWID:
                                new_id = rs.getRowId(1);
                                break;
                            default:
                                throw new UnsupportedOperationException("ID type non implemented ... please update me");
                        }

                        retVal = true;
                    }
                    if (rs != null)
                        rs.close();
                }
                sqlSTMTUpdate.close();
                sqlSTMTUpdate = null;
            }


        } catch (Exception e) {
            System.err.println("insert_update_row() error : "+e.getMessage());
            retVal = false;

            if(transaction.isTransaction(request)) {
            } else {
                try {
                    if (conn != null)
                        conn.rollback();
                } catch (Throwable e2) {
                }
            }
            throw e;

        } finally {
            if(transaction.isTransaction(request)) {
            } else {
                try {
                    if (conn != null)
                        conn.close();
                } catch (Throwable e2) {
                }
            }
            conn = null;
        }

        return new Object [] { retVal, new_id } ;
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
    public static String insertFields(Object p1, Object p2, Object p3, Object p4, Object p5) throws SQLException {
        return processModification(p1, p2, p3, p4, p5, "insert");
    }


    /**
     *
     * @param DatabaseSchemaTable
     * @param Fields                fields to update, must include the "primaryKey"
     * @param Values                values of fields to update
     * @param primaryKey            the field used as primaryKey, must me defined in "Fields" or use "WHERE ..." for direct where condition
     * @return
     * @throws Throwable
     */
    static public Object [] update_row ( String DatabaseSchemaTable, String [] Fields, Object [] Values, String primaryKey ) throws Throwable {
        return update_row ( DatabaseSchemaTable, Fields, Values, primaryKey, null );
    }

    /**
     *
     * @param DatabaseSchemaTable
     * @param FieldsAndValues
     * @param primaryKey
     * @return
     * @throws Throwable
     */
    static public Object [] update_row ( String DatabaseSchemaTable, HashMap<String,Object> FieldsAndValues, String primaryKey ) throws Throwable {
        String [] Fields = utility.arrayToArray(FieldsAndValues.keySet().toArray(), String.class);
        Object [] Values = FieldsAndValues.values().toArray();
        return update_row ( DatabaseSchemaTable, Fields, Values, primaryKey, null );
    }


    /**
     * TODO: addition where conditions
     *
     * @param DatabaseSchemaTable
     * @param Fields                fields to update, must include the "primaryKey"
     * @param Values                values of fields to update (use instanceof StringBuffer or Expression for SQL Espression)
     * @param primaryKey            the field used as primaryKey, must me defined in "Fields" or use "WHERE ..." for direct where condition
     * @param request
     * @return
     * @throws Throwable
     */
    static public Object [] update_row ( String DatabaseSchemaTable, String [] Fields, Object [] Values, String primaryKey, HttpServletRequest request ) throws Throwable {
        boolean retVal = false;
        int new_id = 0;
        Object keyValue = null;


        Connection conn = null;
        String sSTMTUpdate = null;

        if(DatabaseSchemaTable == null || Fields == null || Values == null) {
            return new Object [] { false, -1 };
        }
        if(Fields.length > Values.length) {
            return new Object [] { false, -1 };
        }

        try {

            if(transaction.isTransaction(request)) {
                conn = transaction.getTransaction(request);
            } else {
                Object[] connResult = connection.getDBConnection();
                conn = (Connection) connResult[0];
                String connError = (String) connResult[1];
                if (conn == null) {
                    String err = "update_row() : connect failed \n\nError is : "+connError;
                    System.out.println("// LIQUID ERROR : " + err);
                    return new Object [] { false, -1, utility.base64Encode(err) };
                }
            }

            if (conn != null) {
                String [] dbParts = DatabaseSchemaTable.split("\\.");
                if(dbParts.length >= 3) {
                    DatabaseSchemaTable = dbParts[1]+"."+dbParts[2];
                }

                sSTMTUpdate = "UPDATE "+DatabaseSchemaTable+" SET ";


                for(int i=0, ia=0; i<Fields.length; i++) {
                    if (primaryKey.equalsIgnoreCase(Fields[i])) {
                        keyValue = Values[i];
                    } else {
                        sSTMTUpdate += (ia > 0 ? "," : "");
                        sSTMTUpdate += "\"" + Fields[i] + "\"";
                        Object val = Values[i];
                        if(val instanceof Expression) {
                            sSTMTUpdate += "=" + ((Expression)val).getMethodName();
                        } else {
                            sSTMTUpdate += "=?";
                        }
                        ia++;
                    }
                }

                if(primaryKey.startsWith("WHERE ")) {
                    sSTMTUpdate += " " + primaryKey;
                } else {
                    if(keyValue == null) {
                        throw new Exception("Primary key not found");
                    } else {
                        sSTMTUpdate += " WHERE \"" + primaryKey + "\"=?";
                    }
                }

                PreparedStatement sqlSTMTUpdate = conn.prepareStatement(sSTMTUpdate, Statement.RETURN_GENERATED_KEYS);

                int ip=1;
                for(int i=0; i<Values.length; i++) {
                    if(primaryKey.equalsIgnoreCase(Fields[i])) {
                    } else {
                        if (i < Fields.length) {
                            Object val = Values[i];
                            if(db.mapStatementParam(sqlSTMTUpdate, ip, val)) {
                                ip++;
                            }
                        }
                    }
                }

                // primary key
                if(primaryKey.startsWith("WHERE ")) {
                } else {
                    if(db.mapStatementParam(sqlSTMTUpdate, ip, keyValue)) {
                        ip++;
                    }
                }

                if(workspace.projectMode) {
                    System.out.print("// LIQUID Query: ");
                    System.out.println(sqlSTMTUpdate);
                }

                int res = sqlSTMTUpdate.executeUpdate();
                if (res < 0) {
                    System.err.println("Error updating db");
                    retVal = false;
                } else {
                    ResultSet rs = sqlSTMTUpdate.getGeneratedKeys();
                    if (rs != null && rs.next()) {
                        new_id = rs.getInt(1);
                        retVal = true;
                    }
                    if (rs != null)
                        rs.close();
                }
                sqlSTMTUpdate.close();
                sqlSTMTUpdate = null;
            }


        } catch (Exception e) {
            System.err.println("update_row() error : "+e.getMessage());
            retVal = false;

            if(transaction.isTransaction(request)) {
            } else {
                try {
                    if (conn != null)
                        conn.rollback();
                } catch (Throwable e2) {
                }
            }
            throw e;

        } finally {
            if(transaction.isTransaction(request)) {
            } else {
                try {
                    if (conn != null)
                        conn.close();
                } catch (Throwable e2) {
                }
                conn = null;
            }
        }

        return new Object [] { retVal, new_id } ;
    }

    public static boolean mapStatementParam(PreparedStatement sqlSTMTUpdate, int ip, Object val) throws Exception {
        if (val instanceof Expression || val instanceof StringBuffer) {
            // Already processed
            return false;
        } else {
            if (val instanceof Integer) {
                sqlSTMTUpdate.setInt((ip), (int) val);
            } else if (val instanceof BigDecimal) {
                sqlSTMTUpdate.setBigDecimal((ip), (BigDecimal) val);
            } else if (val instanceof Long) {
                sqlSTMTUpdate.setLong((ip), (long) val);
            } else if (val instanceof Float) {
                sqlSTMTUpdate.setFloat((ip), (float) val);
            } else if (val instanceof Double) {
                sqlSTMTUpdate.setDouble((ip), (double) val);
            } else if (val instanceof Timestamp) {
                sqlSTMTUpdate.setTimestamp((ip), (Timestamp) val);
            } else if (val instanceof java.util.Date) {
                sqlSTMTUpdate.setDate((ip), (new java.sql.Date(((java.util.Date) val).getTime())));
            } else if (val instanceof java.sql.Date) {
                sqlSTMTUpdate.setDate((ip), (java.sql.Date) val);
            } else if (val instanceof java.util.Date) {
                sqlSTMTUpdate.setDate((ip), new java.sql.Date(((java.util.Date) val).getTime()));
            } else if (val instanceof String) {
                sqlSTMTUpdate.setString((ip), (String) val);
            } else if (val instanceof Boolean) {
                sqlSTMTUpdate.setBoolean((ip), (boolean) val);
            } else if (val == null) {
                sqlSTMTUpdate.setNull((ip), Types.NULL);
            } else {
                String err = "mapStatementParam() invalid obejct type : " + val.getClass().getName();
                System.err.println(err);
                throw new Exception(err);
            }
        }
        return true;
    }


    public static String update(HttpServletRequest request, Object bean, workspace wrk) throws Throwable {
        return db.update(bean, wrk, (HttpServletRequest) request);
    }


    public static Object [] update(Object bean, String DatabaseSchemaTable, String primaryKey) throws Throwable {
        return update(bean, DatabaseSchemaTable, primaryKey, null);
    }

    /**
     * Update the bean to DB
     *
     * @param bean
     * @param DatabaseSchemaTable
     * @param primaryKey   the primary key property name
     */
    public static Object [] update(Object bean, String DatabaseSchemaTable, String primaryKey, HttpServletRequest request) throws Throwable {
            boolean retVal = false;
            String infoFields = "";
            int new_id = 0;

            Connection conn = null;
            String sSTMTUpdate = null;

            if(DatabaseSchemaTable == null || bean == null || primaryKey == null) {
                if(bean != null) {
                    String beanPrimaryKey = (String)utility.get(bean, "$primaryKey");
                    if(beanPrimaryKey != null) {
                        primaryKey = beanPrimaryKey;
                    } else {
                        return new Object[]{false, -1, "missing database or bean or primary key name"};
                    }
                } else {
                    return new Object[]{false, -1, "missing database or bean or primary key name"};
                }
            }

            try {

                if(transaction.isTransaction(request)) {
                    conn = transaction.getTransaction(request);
                } else {
                    Object[] connResult = connection.getDBConnection();
                    conn = (Connection) connResult[0];
                    String connError = (String) connResult[1];
                    if (conn == null) {
                        String err = "update() : connect failed \n\nError is : "+connError;
                        System.out.println("// LIQUID ERROR : " + err);
                        return new Object [] { false, -1, utility.base64Encode(err) };
                    }
                }


                if (conn != null) {
                    sSTMTUpdate = "UPDATE " + DatabaseSchemaTable + " SET ";

                    // TODO : walk bean propery
                    String sFields = "", sWhere = "";
                    ArrayList<Object> paramValues = new ArrayList<Object>();
                    Field[] fields = bean.getClass().getDeclaredFields();
                    Field fieldFound = null;
                    Object primaryKeyValue = null;

                    for (Field f : fields) {
                        String fieldName = f.getName();
                        Object fieldData = utility.getEx(bean, fieldName);

                        if (fieldName.equals(primaryKey)) {
                            primaryKeyValue = fieldData;
                        } else {
                            if(fieldName.indexOf("$") < 0) {
                                boolean isChanged = utility.isChangedEx(bean, fieldName);
                                if (isChanged) {
                                    sFields += (sFields.length() > 0 ? "," : "") + fieldName+"=" + "?" + "";
                                    paramValues.add(fieldData);
                                    infoFields += "["+fieldName+"]";
                                }
                            }
                        }
                    }

                    if (primaryKey != null && !primaryKey.isEmpty()) {

                        if (primaryKeyValue != null) {

                            sWhere += primaryKey + "='" + primaryKeyValue + "'";

                            sSTMTUpdate += sFields;

                            sSTMTUpdate += " WHERE ";

                            sSTMTUpdate += sWhere;



                            PreparedStatement sqlSTMTUpdate = conn.prepareStatement(sSTMTUpdate, Statement.RETURN_GENERATED_KEYS);

                            int ip = 1;
                            for (int i=0; i<paramValues.size(); i++) {
                                if(mapStatementParam(sqlSTMTUpdate, ip, paramValues.get(i))) {
                                    ip++;
                                }
                            }


                            if(workspace.projectMode) {
                                System.out.print("// LIQUID Query: ");
                                System.out.println(sqlSTMTUpdate);
                            }

                            int res = sqlSTMTUpdate.executeUpdate();
                            if (res < 0) {
                                System.err.println("Error updating db");
                                retVal = false;
                            } else {
                                ResultSet rs = sqlSTMTUpdate.getGeneratedKeys();
                                if (rs != null && rs.next()) {
                                    new_id = rs.getInt(1);
                                    retVal = true;
                                }
                                if (rs != null)
                                    rs.close();
                            }
                            sqlSTMTUpdate.close();
                            sqlSTMTUpdate = null;

                        } else {
                            return new Object [] { false, -1, "missing primary key value" };
                        }

                    } else {
                        return new Object [] { false, -1, "missing primary key name" };
                    }
                }

            } catch (Exception e) {
                System.err.println("update() error : "+e.getMessage());
                retVal = false;

                if(transaction.isTransaction(request)) {
                } else {
                    try {
                        if (conn != null)
                            conn.rollback();
                    } catch (Throwable e2) {
                    }
                }
                throw e;

            } finally {
                if(transaction.isTransaction(request)) {
                } else {
                    try {
                        if (conn != null)
                            conn.close();
                        conn = null;
                    } catch (Throwable e2) {
                    }
                }
            }

            return new Object [] { retVal, new_id, infoFields } ;
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
    public static String updateFields(Object p1, Object p2, Object p3, Object p4, Object p5) throws SQLException {
        return processModification(p1, p2, p3, p4, p5, "update");
    }

    public static String updateFields(Object p1, Object p2, Object p3, Object p4) throws SQLException {
        return processModification(p1, p2, p3, p4, null, "update");
    }


    public static String updateField(workspace wrk, Object primaryKeyValue, String field, Object fieldValue, Object requestParam) throws Throwable {
        if (wrk != null) {
            Object bean = load_bean((HttpServletRequest) requestParam, wrk.databaseSchemaTable, null, (Object) primaryKeyValue);
            if (bean != null) {
                utility.set(bean, field, fieldValue);
                return db.update(bean, wrk, (HttpServletRequest) requestParam);
            }
        }
        return null;
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
    public static String deleteRow(Object p1, Object p2, Object p3, Object p4, Object p5) throws SQLException {
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
    static public String processModification(Object p1, Object p2, Object p3, Object p4, Object p5, String type) throws SQLException {
        Connection conn = null, connToDB = null, connToUse = null;
        String retVal = "", retValCbk = "";
        int nForeignUpdates = 0, nUpdates = 0;
        ArrayList<String> foreignTableUpdates = new ArrayList<>();
        ArrayList<String> tableUpdates = new ArrayList<>();
        ArrayList<String> modificationsFaild = new ArrayList<>();
        TransactionList foreignTableTransactList = new TransactionList();
        TransactionList tableTransactList = new TransactionList();
        boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;
        HttpServletRequest request = (HttpServletRequest) p4;

        try {

            if (p1 != null) {
                workspace liquid = (workspace) p1;
                String database = null;
                String schema = null;
                String table = null;
                try {
                    database = liquid.tableJson.getString("database");
                } catch (Exception e) {
                }
                try {
                    schema = liquid.tableJson.getString("schema");
                } catch (Exception e) {
                }
                try {
                    table = liquid.tableJson.getString("table");
                } catch (Exception e) {
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
                if(liquid.tableJson.has("isSystem")) {
                    isSystem = liquid.tableJson.getBoolean("isSystem");
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

                        if (paramJSON.has("modifications")) {
                            JSONArray modificationsJSON = paramJSON.getJSONArray("modifications");

                            String jsonType = null;
                            if(paramJSON.has("type")) {
                                jsonType = paramJSON.getString("type");
                            }
                            String sType = type != null ? type : (paramJSON.has("type") ? paramJSON.getString("type") : "1");

                            if (modificationsJSON != null) {
                                int[] colTypes = new int[cols.length()];
                                int[] colPrecs = new int[cols.length()];
                                int[] colDigits = new int[cols.length()];
                                for (int ic = 0; ic < cols.length(); ic++) {
                                    JSONObject col = cols.getJSONObject(ic);
                                    try {
                                        colTypes[ic] = Integer.parseInt(col.getString("type"));
                                    } catch (Exception e) {
                                    }
                                    if(col.has("precision")) {
                                        Object precision = col.get("precision");
                                        if(precision instanceof String) {
                                            colPrecs[ic] = Integer.parseInt((String)precision);
                                        } else {
                                            colPrecs[ic] = (int)precision;
                                        }
                                    } else {
                                        colPrecs[ic] = -1;
                                    }
                                    if(col.has("digits")) {
                                        Object digit = col.get("digits");
                                        if(digit instanceof String){
                                            colDigits[ic] = Integer.parseInt((String) digit);
                                        } else {
                                            colDigits[ic] = (int)digit;
                                        }
                                    } else {
                                        colDigits[ic] = -1;
                                    }
                                }
                                for (int im = 0; im < modificationsJSON.length(); im++) {
                                    JSONObject modificationJSON = (JSONObject) modificationsJSON.get(im);
                                    String rowId = "";
                                    String nodeId = "";

                                    if (modificationJSON != null) {
                                        try {
                                            if(modificationJSON.has("rowId")) {
                                                rowId = modificationJSON.getString("rowId");
                                            }
                                        } catch (Exception e) {
                                        }
                                        try {
                                            if(modificationJSON.has("nodeId")) {
                                                nodeId = modificationJSON.getString("nodeId");
                                            }
                                        } catch (Exception e) {
                                        }
                                        if (rowId != null && !rowId.isEmpty() || "insert".equalsIgnoreCase(sType)) {
                                            JSONArray fieldsJSON = null;
                                            if (modificationJSON.has("fields")) {
                                                fieldsJSON = modificationJSON.getJSONArray("fields");
                                            }
                                            if (p5 != null) {
                                                if(p5 instanceof event.eventCallback) {
                                                    try {
                                                        String resCbk = ((event.eventCallback) p5).callback(p1, p2, p3, p4, (Object) modificationJSON);
                                                        retValCbk += (resCbk != null ? resCbk : "");
                                                    } catch (Throwable th) {
                                                        Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, th);
                                                    }
                                                }
                                            }

                                            if (fieldsJSON != null) {
                                                for (int iF = 0; iF < fieldsJSON.length(); iF++) {
                                                    JSONObject fieldJSON = (JSONObject) fieldsJSON.get(iF);
                                                    if (fieldJSON != null) {
                                                        String dbDefault = null, srcDefault = null;
                                                        Object oField = null;
                                                        String field = null;
                                                        Object oValue = null;
                                                        int valueType = 0;

                                                        oField = fieldJSON.has("field") ? fieldJSON.get("field") : null;
                                                        if(oField instanceof String) {
                                                            field = (String)oField;
                                                        }

                                                        oValue = fieldJSON.has("value") ? fieldJSON.get("value") : null;

                                                        if (field != null && !field.isEmpty() && cols != null) {
                                                            for (int ic = 0; ic < cols.length(); ic++) {
                                                                JSONObject col = cols.getJSONObject(ic);
                                                                String foreignTable = null, foreignColumn = null;
                                                                String foreignEdit = null;
                                                                Boolean foreignBEdit = false;
                                                                String sourceColumn = null;
                                                                int colType = col.has("type") ? col.getInt("type") : 0;
                                                                String tField = col.getString("field");
                                                                String tName = col.getString("name");
                                                                String tTable = col.has("table") ? col.getString("table") : null;
                                                                String tPrimaryKey = col.has("primaryKey") ? col.getString("primaryKey") : null;

                                                                String[] colParts = tName.split("\\.");
                                                                boolean autoIncString = col.has("autoIncString") ? col.getBoolean("autoIncString") : false;
                                                                boolean nullable = col.has("nullable") ? col.getBoolean("nullable") : false;

                                                                dbDefault = col.has("dbDefault") ? col.getString("dbDefault") : null;
                                                                srcDefault = col.has("default_src") ? col.getString("default_src") : null;

                                                                boolean isExternalField = false;
                                                                boolean addExternalField = false;

                                                                if (tField.equalsIgnoreCase(field)) {

                                                                    if (!autoIncString) {

                                                                        if (colType == 6 || colType == 93) { // datetime)
                                                                            if(request != null) {
                                                                                if (oValue != null) {
                                                                                    if (oValue instanceof String && ((String) oValue).isEmpty()) {
                                                                                        oValue = null;
                                                                                    }
                                                                                }
                                                                                if(oValue != null) {
                                                                                    boolean parseString = true;
                                                                                    if(oValue instanceof String) {
                                                                                        if("CURRENT_TIMESTAMP".equalsIgnoreCase((String)oValue)) {
                                                                                            parseString = false;
                                                                                        }
                                                                                    }
                                                                                    if(parseString) {
                                                                                        if(liquid.tableJson.has("toLocalTimezone")) {
                                                                                            Object oToLocalTimezone = liquid.tableJson.get("toLocalTimezone");
                                                                                            if (oToLocalTimezone instanceof Boolean && (Boolean) oToLocalTimezone == true) {
                                                                                                Date gmtDate = utility.get_local2server_time(request, oValue);
                                                                                                if (gmtDate != null) {
                                                                                                    oValue = gmtDate;
                                                                                                } else {
                                                                                                    throw new Exception("Failed to get local time");
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }

                                                                        if(col.has("foreignTable")) {
                                                                            foreignTable = col.getString("foreignTable");
                                                                        }
                                                                        if(col.has("foreignColumn")) {
                                                                            foreignColumn = col.getString("foreignColumn");
                                                                        }
                                                                        if(col.has("foreignEdit")) {
                                                                            Object foreignOEdit = col.get("foreignEdit");
                                                                            if(foreignOEdit instanceof String) {
                                                                                foreignEdit = col.getString("foreignEdit");
                                                                            } else if(foreignOEdit instanceof Boolean) {
                                                                                foreignBEdit = col.getBoolean("foreignEdit");
                                                                            }
                                                                        }
                                                                        if(col.has("column")) {
                                                                            sourceColumn = col.getString("column");
                                                                        }



                                                                        //
                                                                        // uso di table/primaryKey nelle query (per aggiornare il campo sorgente
                                                                        //
                                                                        if(tTable != null && !tTable.isEmpty()) {
                                                                            foreignTable = tTable;
                                                                        }
                                                                        if(tPrimaryKey != null && !tPrimaryKey.isEmpty()) {
                                                                            foreignColumn = tPrimaryKey;
                                                                            sourceColumn = tPrimaryKey;
                                                                        }


                                                                        //
                                                                        // compute the value by metadata
                                                                        //
                                                                        String sDefault = null;
                                                                        if("update".equalsIgnoreCase(sType)) {
                                                                            // N.B.: é una modifica non un inserimento, il campo default non ha rilevanza
                                                                            sDefault = null;
                                                                        } else if("insert".equalsIgnoreCase(sType)) {
                                                                            sDefault = dbDefault;
                                                                        }

                                                                        Object[] fres = format_db_value(liquid, colTypes[ic], nullable, oValue, null, sDefault);
                                                                        oValue = (Object) fres[0];
                                                                        valueType = (int) fres[1];

                                                                        if(valueType == -999) {
                                                                            // Skip field
                                                                        } else {
                                                                            if (colParts.length > 1 || foreignTable != null && !foreignTable.isEmpty()) {
                                                                                if (colParts.length > 1) {
                                                                                    foreignTable = colParts[0];
                                                                                }
                                                                                if (!foreignTable.equalsIgnoreCase(table)) {
                                                                                    // campo esterno
                                                                                    isExternalField = true;
                                                                                    if (foreignBEdit
                                                                                            || "y".equalsIgnoreCase(foreignEdit)
                                                                                            || "yes".equalsIgnoreCase(foreignEdit)
                                                                                            || "s".equalsIgnoreCase(foreignEdit)
                                                                                            || "si".equalsIgnoreCase(foreignEdit)
                                                                                            || (tTable != null && !tTable.isEmpty() && tPrimaryKey != null && !tPrimaryKey.isEmpty())
                                                                                    ) {
                                                                                        if (colParts.length > 1) {
                                                                                            tName = colParts[1];
                                                                                        }
                                                                                        if (foreignColumn != null && !foreignColumn.isEmpty()) {
                                                                                            addExternalField = true;
                                                                                            if ("insert".equalsIgnoreCase(sType)) {
                                                                                                // TODO : Inserimento in tabella esterna : legame con la tabella principale e ignezione degli ID
                                                                                                //          Ma in transazione non sono disponibili : disabilitazione delle transazione e uso dell'autocommit
                                                                                                // foreignTableTransactList.add( col.getString("foreignTable"), tName, value, sourceColumn, null, "insert" );
                                                                                            } else if ("delete".equalsIgnoreCase(sType)) {
                                                                                                foreignTableTransactList.add(col.getString("foreignTable"), tName, oValue, valueType, sourceColumn, null, "delete", rowId, nodeId);
                                                                                            } else if ("update".equalsIgnoreCase(sType)) {
                                                                                                // TODO : lettura dei valori dal client
                                                                                                String foreignValue = "(SELECT " + itemIdString + sourceColumn + itemIdString
                                                                                                        + " FROM " + liquid.schemaTable
                                                                                                        + "\nWHERE " + tableIdString + liquid.tableJson.getString("primaryKey") + tableIdString
                                                                                                        + "=" + rowId + ")";
                                                                                                foreignTableTransactList.add((schema != null ? tableIdString + schema + tableIdString + "." : "") + tableIdString + foreignTable + tableIdString, tName, oValue, valueType, sourceColumn, foreignColumn + "=" + foreignValue + "", "update", rowId, nodeId);
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
                                                                            if (isExternalField) {
                                                                                // gia processato sopra
                                                                            } else {
                                                                                if ("insert".equalsIgnoreCase(sType)) {
                                                                                    tableTransactList.add((schema != null && (isOracle || isPostgres || isSqlServer) ? tableIdString + schema + itemIdString + "." : "") + tableIdString + table + tableIdString, tName, oValue, valueType, null, null, "insert", rowId, nodeId);

                                                                                } else if ("update".equalsIgnoreCase(sType)) {
                                                                                    tableTransactList.add((schema != null && (isOracle || isPostgres || isSqlServer) ? tableIdString + schema + tableIdString + "." : "") + tableIdString + table + tableIdString, tName, oValue, valueType, null, itemIdString + liquid.tableJson.getString("primaryKey") + itemIdString + "='" + rowId + "'", "update", rowId, nodeId);
                                                                                }
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
                                                // try { field = fieldJSON.getString("field"); } catch (Exception e) {}
                                                // try { value = fieldJSON.getString("value"); } catch (Exception e) {}
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
                        if(transaction.isTransaction(request)) {
                            conn = transaction.getTransaction(request);
                        } else {
                            Object[] connResult = connection.getConnection(null, request, liquid.tableJson);
                            conn = (Connection) connResult[0];
                            String connError = (String) connResult[1];
                            if (conn == null) {
                                String err = "processModification() : connect failed \n\nError is : " + connError;
                                System.out.println("// LIQUID ERROR : " + err);
                                // return new Object [] { false, -1, utility.base64Encode(err) };
                            }
                        }
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
                                if(transaction.isTransaction(request)) {
                                    conn = transaction.getTransaction(request);
                                } else {
                                    connection.closeConnection(conn);
                                    conn = null;
                                    Object[] connResult = connection.getDBConnection(database);
                                    connToUse = connToDB = (Connection) connResult[0];
                                }
                            }
                        }

                        try {
                            if (foreignTableTransactList != null || tableTransactList != null) {
                                if (foreignTableTransactList.transactionList != null) {
                                    for (i = 0; i < foreignTableTransactList.transactionList.size(); i++) {
                                        PreparedStatement foreignPreparedStmt = null;

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
                                            foreignPreparedStmt = (PreparedStatement) resArray[1];
                                            if (res > 0) {
                                                nForeignUpdates++;
                                                if (!"delete".equalsIgnoreCase(foreignTableTransactList.getType(liquid, i))) {
                                                    ResultSet rs = null;
                                                    try {
                                                        rs = foreignPreparedStmt.getGeneratedKeys();
                                                    } catch (Exception ex) {
                                                    }
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
                                                } else {
                                                    event.onCleanupRows(liquid, foreignTableTransactList.transactionList.get(i).rowId, request);
                                                }
                                            }
                                        } catch (Throwable th) {
                                        	if(executingQuery == null)
                                        		executingQuery = foreignTableTransactList.getSQL(liquid, i);
                                            String tableDesc = foreignTableTransactList.transactionList.get(i).table.replace(itemIdString, "");
                                            foreignTableUpdates.add("{\"table\":\"" + tableDesc + "\",\"ids\":[], \"error\":\"" + utility.base64Encode(tableDesc+" : "+th.getLocalizedMessage()) + "\", \"query\":\"" + utility.base64Encode(executingQuery) + "\" }");
                                            String fieldValue = foreignTableTransactList.transactionList.get(i).rowId;
                                            fieldValue = fieldValue != null ? fieldValue.replace("\\", "\\\\").replace("\"", "\\\"") : "";
                                            modificationsFaild.add("{\"rowId\":\"" + fieldValue + "\",\"nodeId\":\"" + foreignTableTransactList.transactionList.get(i).nodeId + "\"}");
                                        } finally {
                                            if(foreignPreparedStmt != null) {
                                                foreignPreparedStmt.close();
                                            }
                                        }
                                    }
                                }

                                if (tableTransactList.transactionList != null) {
                                    for (i = 0; i < tableTransactList.transactionList.size(); i++) {
                                        PreparedStatement preparedStmt = null;

                                    	executingQuery = null;

                                        try {
                                            if (workspace.projectMode) {
                                                executingQuery = tableTransactList.getSQL(liquid, i);
                                                System.out.println("// LIQUID Query:" + executingQuery);
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
                                                    event.onCleanupRows(liquid, tableTransactList.transactionList.get(i).rowId, request);
                                                }
                                            }
                                        } catch (Throwable th) {
                                            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
                                            if(executingQuery == null)
                                            	executingQuery = tableTransactList.getSQL(liquid, i);
                                            System.err.println("LIQUID ERROR: executingQuery:"+executingQuery);
                                            String tableDesc = liquid.schemaTable.replace(tableIdString, "");

                                            String errorMessage = th.getMessage();
                                            // String errorMessage th.getLocalizedMessage();
                                            if(errorMessage.indexOf("duplicate key value") >= 0) {
                                                if (workspace.GLLang.equalsIgnoreCase("IT")) {
                                                    errorMessage = "Elemento gia' presente .. non e' possibile aggiungerlo";
                                                } else {
                                                    errorMessage = "This item is already defined .. cannot add it";
                                                }
                                            }
                                            tableUpdates.add("{\"table\":\"" + tableDesc + "\",\"ids\":[], \"error\":\"" + utility.base64Encode(tableDesc+" : "+errorMessage) + "\", \"query\":\"" + utility.base64Encode(executingQuery) + "\" }");
                                            String fieldValue = tableTransactList.transactionList.get(i).rowId;
                                            fieldValue = fieldValue != null ? fieldValue.replace("\\", "\\\\").replace("\"", "\\\"") : "";
                                            modificationsFaild.add("{\"rowId\":\"" + fieldValue + "\",\"nodeId\":\"" + tableTransactList.transactionList.get(i).nodeId + "\"}");
                                        } finally {
                                            if(preparedStmt != null) {
                                                preparedStmt.close();
                                            }
                                        }
                                    }
                                }
                            }

                            retVal = "{"
                                    + "\"details\":[ {"
                                    + "\"tables\":["
                                    + workspace.arrayToString(tableUpdates.toArray(), null, null, ",")
                                    + "], \"foreignTables\":["
                                    + workspace.arrayToString(foreignTableUpdates.toArray(), null, null, ",")
                                    + "], \"fails\":["
                                    + workspace.arrayToString(modificationsFaild.toArray(), null, null, ",")
                                    + "]"
                                    + ",\"client\":"+"\""+retValCbk+"\""
                                    + "}"
                                    + "]"
                                    + "}";

                        } catch (Throwable th) {
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
            if(transaction.isTransaction(request)) {
            } else {
                // closing the connections (with callbacks)
                connection.closeConnection(conn);
                // closing the connections (with callbacks)
                connection.closeConnection(connToDB);
            }
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


    /**
     * Convert value to be written in database
     *
     * @param tbl_wrk
     * @param colTypes
     * @param nullable
     * @param oValue
     * @param operator
     * @param sDefault
     * @return Object [] { oValue, valueType };
     * oValue = value as Object class
     * valueType = Types.XXX (see Types.java) or :
     * 1   ->      Generic string
     * 0   ->      Expression
     * -1  ->       Truncate data (made by caller)
     * -999->       Skip field
     */
    static public Object[] format_db_value(workspace tbl_wrk, int colTypes, boolean nullable, Object oValue, String operator, String sDefault) throws Exception {

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
        int valueType = Types.CHAR; // string
        
        if (colTypes == 8 || colTypes == 7) { // float
            if(oValue instanceof String) {
                String value = (String)oValue;
                value = value.replace(",", ".");
                if(value != null && !value.isEmpty()) {
                    oValue = Float.parseFloat(value);
                } else {
                    oValue = (Object)0.0f;
                }
            } else {
            }
        }

        if (colTypes == 6 || colTypes == 91 || colTypes == 93) { // date, datetime
            if(oValue instanceof String) {
                String value = (String) oValue;
                value = getLocalDate(value, colTypes, nullable);
                if (value != null && !value.isEmpty()) {
                    // refine
                    if (isOracle || isPostgres) {
                        if (colTypes == 6 || colTypes == 93) { // date, datetime
                            if (value.equalsIgnoreCase("CURRENT_TIMESTAMP")) {
                                oValue = value;
                                valueType = 0; // is an expression
                            } else if (value.endsWith(" 0:0:0")) {
                                oValue = value = "TO_DATE('" + value.substring(0, value.length() - 6) + "','YYYY-MM-DD')";
                                valueType = 0; // is an expression
                            } else if (value.length() > 9) {
                                // value = "TO_DATE('" + value + "','YYYY-MM-DD HH24:MI:SS')";
                                oValue = value = "TO_TIMESTAMP('" + value + "','YYYY-MM-DD HH24:MI:SS')";
                                valueType = 0; // is an expression
                            } else {
                                oValue = value = "TO_DATE('" + value + "','YYYY-MM-DD')";
                                valueType = 0; // is an expression
                            }
                        } else if (colTypes == 91) { // date
                            if (value.length() > 9) value = value.substring(0, 9);
                            oValue = value = "TO_DATE('" + value + "','YYYY-MM-DD')";
                            valueType = 0; // is an expression
                        }
                    } else if (isMySQL) {
                        if (colTypes == 6 || colTypes == 91 || colTypes == 93) { // date, datetime
                            if (value.equalsIgnoreCase("CURRENT_TIMESTAMP")) {
                                oValue = value;
                                valueType = 0; // is an expression
                            } else if (value.endsWith(" 0:0:0")) {
                                oValue = value = "STR_TO_DATE('" + value.substring(0, value.length() - 6) + "','%Y-%m-%d')";
                                valueType = -1; // truncate
                            } else if (value.length() > 9) {
                                oValue = value = "STR_TO_DATE('" + value + "','%Y-%m-%d %H:%i:%s')";
                                valueType = 0; // is an expression
                            } else {
                                oValue = value = "STR_TO_DATE('" + value + "','%Y-%m-%d')";
                                valueType = 0; // is an expression
                            }
                        } else if (colTypes == 91) { // date
                            oValue = value = "STR_TO_DATE('" + value + "','%Y-%m-%d')";
                            valueType = 0; // is an expression
                        }
                    } else if (isSqlServer) {
                        if (value.equalsIgnoreCase("CURRENT_TIMESTAMP")) {
                            oValue = value;
                            valueType = 0; // is an expression
                        } else {
                            if (colTypes == 6 || colTypes == 91 || colTypes == 93) { // date, datetime
                                oValue = value = "CONVERT(DATETIME,'" + value + "')";
                                valueType = 0; // is an expression
                            } else if (colTypes == 91) { // date
                                oValue = value = "CONVERT(DATETIME,'" + value + ")";
                                valueType = 0; // is an expression
                            }
                        }
                    }
                } else {
                    // preserva il tipo dato
                    valueType = colTypes;
                }
            } else if(oValue instanceof java.sql.Date) {
                // preserva il tipo dato
                valueType = colTypes;
            } else if(oValue instanceof java.util.Date) {
                // preserva il tipo dato
                valueType = colTypes;
            } else if(oValue instanceof java.sql.Timestamp) {
                // preserva il tipo dato
                valueType = colTypes;
            } else if(oValue == null) {
                valueType = colTypes;
            } else {
                throw new Exception("format_db_value() : unsupported case");
            }
        } else if (colTypes == 92) { // time
            // TODO: 24/09/2020 Test to do
            if(oValue instanceof String) {
                String value = (String) oValue;
                value = getLocalTime(value, colTypes, nullable);
                if (value != null && !value.isEmpty()) {
                    // refine
                    if (isOracle || isPostgres) {
                        value = "TO_DATE('" + value + "', 'HH24:MI:SS')";
                        oValue = valueType = 0; // is an expression
                    } else if (isMySQL) {
                        oValue = value = "STR_TO_DATE('" + value + "', '%H:%i:%s')";
                        valueType = 0; // is an expression
                    } else if (isSqlServer) {
                        oValue = value = "CONVERT(DATETIME,'" + value + ")";
                        valueType = 0; // is an expression
                    }
                } else if (oValue instanceof java.sql.Date) {
                    // preserva il tipo dato
                    valueType = colTypes;
                } else if (oValue instanceof java.util.Date) {
                    // preserva il tipo dato
                    valueType = colTypes;
                } else if (oValue instanceof java.sql.Timestamp) {
                    // preserva il tipo dato
                    valueType = colTypes;
                } else {
                    // preserva il tipo dato
                    valueType = colTypes;
                }
            } else {
                throw new Exception("unsupported case");
            }


        } else if (isNumeric(colTypes)) {
            // numeric
            if(oValue instanceof String) {
                String value = (String) oValue;
                if (value == null || value.isEmpty()) {
                    oValue = 0;
                }
                valueType = colTypes; // is a number
            } else {
                valueType = colTypes; // is a number
            }

        } else if (colTypes == -7) { // boolean
            valueType = colTypes; // is a boolean
            if(oValue instanceof String) {
                String value = (String) oValue;
                if (value == null || value.isEmpty() || "0".equalsIgnoreCase(value) || "n".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value)) {
                    value = "false";
                    oValue = false;
                } else if ("1".equalsIgnoreCase(value) || "y".equalsIgnoreCase(value) || "on".equalsIgnoreCase(value) || "true".equalsIgnoreCase(value)) {
                    value = "true";
                    oValue = true;
                } else {
                    value = "false";
                    oValue = false;
                }
                return new Object[]{oValue, valueType};
            } else {
            }
        } else if (colTypes == Types.NUMERIC) { // boolean
            valueType = colTypes; // is a boolean
        }

        if(sDefault != null && !sDefault.isEmpty()) {
            if(sDefault.equalsIgnoreCase(String.valueOf(oValue))) {
                // Campo espressione da risolvere nel DB
                // N.B.: il campo dev'essere risoldo dal DB
                oValue = null;
                valueType = -999;
            }
        }

        return new Object [] { oValue, valueType };
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
                    Object [] connResult = connection.getConnection(null, request, tbl_wrk.tableJson);
                    conn = (Connection)connResult[0];
                    String connError = (String)connResult[1];
                    if (conn == null) {
                        String err = "count_occurences_by_column() : connect failed \n\nError is : " + connError;
                        System.out.println("// LIQUID ERROR : " + err);
                        // return new Object [] { false, -1, utility.base64Encode(err) };
                    }
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




                    JSONArray preFilters = null;

                    try {
                        preFilters = (tbl_wrk != null ? tbl_wrk.tableJson.getJSONArray("preFilters") : null);
                    } catch (Exception e) {
                    }

                    String sWhere = "";
                    ArrayList<Object> sWhereParams = new ArrayList<Object>();

                    // Filtri sovrascritti in sessione
                    if (request.getSession() != null) {
                        Object sPrefilters = request.getSession().getAttribute(tbl_wrk.controlId + ".preFilters");
                        if (sPrefilters != null) {
                            preFilters = (JSONArray) sPrefilters;
                        }

                        ArrayList<LeftJoinMap> leftJoinsMap = null;

                        if (preFilters != null) {
                            try {
                                Object [] resWhere = process_filters_json(
                                        tbl_wrk, table, cols,
                                        isOracle, isMySQL, isPostgres, isSqlServer,
                                        sWhere, sWhereParams, preFilters, null, leftJoinsMap,
                                        tableIdString, itemIdString,
                                        request);

                                String errorWhere = (String)resWhere[1];
                                if(errorWhere != null && !errorWhere.isEmpty())
                                    error += "[" + errorWhere + "]";
                                sWhere = (String)resWhere[2];

                            } catch (Exception e) {
                                error += "[preFilters Error:" + e.getLocalizedMessage() + " on control:"+tbl_wrk.controlId+"]";
                                System.err.println("// pre Filters Error:" + e.getLocalizedMessage() + " on control:"+tbl_wrk.controlId);
                                throw new Exception(e);
                            }
                        }
                    }




                    executingQuery = "SELECT " + itemIdString + targetColumn + itemIdString + ",count(*)"
                            + " FROM " + tableIdString + targetSchema + tableIdString + "." + tableIdString + targetTable + tableIdString
                            + sWhere
                            + " GROUP BY " + itemIdString + targetColumn + itemIdString + "";

                    lStartTime = System.currentTimeMillis();
                    try {
                        if (conn != null) {
                            psdo = conn.prepareStatement(executingQuery);

                            if(sWhereParams != null) {
                                for (int iParam=0; iParam<sWhereParams.size(); iParam++) {
                                    set_statement_param( psdo, iParam+1, sWhereParams.get(iParam) );
                                }
                            }

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
        out_string += ",\"query\":\"" + utility.base64Encode((executingQuery != null ? executingQuery : "N/D"))+ "\"";
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
     * @param tbl_wrk the table workspace of the control (Object or string (controlId) )
     *                N.B.: if a bean was created by another controlId tbl_wrk will be replaced by the original controlId
     *
     * @return the detail of operation as json object { "tables":[ {
     * "table":"table name", "ids":[ list of changed primary keys ] } ]
     * ,"foreignTables":[ { "table":"table name", "ids":[ list of changed
     * primary keys ] } ] ,"fails":[" { "table":"table name", "ids":[ list of
     * changed primary keys ] } ] }
     * @see db
     */
    static public String save(Object bean, Object tbl_wrk, HttpServletRequest request) throws Exception, NoSuchFieldException, IllegalAccessException {
        if(tbl_wrk instanceof String) {
            String databaseSchemaTable = (String)tbl_wrk;
            tbl_wrk = workspace.get_tbl_manager_workspace_from_db(databaseSchemaTable);
        } else if(tbl_wrk == null) {
            String databaseSchemaTable = (String)utility.get(bean, "$databaseSchemaTable");
            String controlId = (String)utility.get(bean, "$controlId");
            tbl_wrk = workspace.get_tbl_manager_workspace_from_db(databaseSchemaTable, controlId);
        } else if(tbl_wrk instanceof workspace) {
            // Check correct databaseSchemaTable/controId
            String databaseSchemaTable = (String)utility.get(bean, "$databaseSchemaTable");
            String controlId = (String)utility.get(bean, "$controlId");
            if(databaseSchemaTable != null && !databaseSchemaTable.isEmpty()) {
                if(controlId != null && !controlId.isEmpty()) {
                    if(!databaseSchemaTable.equalsIgnoreCase( ((workspace)tbl_wrk).databaseSchemaTable) || !controlId.equalsIgnoreCase( ((workspace)tbl_wrk).controlId)) {
                        tbl_wrk = workspace.get_tbl_manager_workspace_from_db(databaseSchemaTable, controlId);
                    }
                }
            }
        }
        if(tbl_wrk != null) {
            return insertUpdate(bean, tbl_wrk, request);
        } else {
            throw new Exception("Control not found .. cannot update db");
        }
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
    static public String insertUpdate(Object bean, Object tbl_wrk, HttpServletRequest request) throws Exception, NoSuchFieldException, IllegalArgumentException, IllegalAccessException {
        workspace tblWrk = (workspace)tbl_wrk;
        String primaryKey = tblWrk.tableJson.getString("primaryKey");
        String databaseSchemaTable = null;
        Object primaryKeyValue = utility.getEx(bean, primaryKey);
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
                    selectedBeans = com.liquid.bean.load_beans((HttpServletRequest)null, tblWrk.controlId, databaseSchemaTable, "*", primaryKey, primaryKeyValue, 1);
                } catch (Throwable ex) {}
                if(selectedBeans != null) {
                    if(selectedBeans.size() > 0) {
                        Object selectedBean = selectedBeans.get(0);
                        foundRow = true;
                        JSONArray cols = tblWrk.tableJson.getJSONArray("columns");
                        for (int ic = 0; ic < cols.length(); ic++) {
                            JSONObject col = cols.getJSONObject(ic);
                            String colName = col.getString("name");
                            if(utility.has(bean, colName)) {
                                Object oSelectedValue = utility.getEx(selectedBean, colName);
                                Object curValue = utility.getEx(bean, colName);
                                if( (oSelectedValue == null && curValue != null) || (oSelectedValue != null && curValue == null) ) {
                                    utility.setChanged(bean, colName, true);
                                } else if(oSelectedValue == null && curValue == null) {
                                } else if(!utility.equals(oSelectedValue, curValue)) {
                                    utility.setChanged(bean, colName, true);
                                }
                            }
                        }
                    }
                }
            }
        }
        if(foundRow) {        
            return update(bean, tbl_wrk, request);
        } else {
            return insert(request, bean, tbl_wrk, null);
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
        return insert(null, bean, tbl_wrk, null);
    }
    static public String insert(Object requestParam, Object bean, Object tbl_wrk) {
        return insert(requestParam, bean, tbl_wrk, null);
    }
    static public String insert(Object bean, Object tbl_wrk, String foreignTables, HttpServletRequest request) {
        return insert(request, bean, tbl_wrk, foreignTables);
    }

    /**
     * Insert row from bean to DB
     *
     * N.B.: default defined in the control tbl_wrk are ignored
     *
     * @param requestParam
     * @param bean
     * @param tbl_wrk
     * @param foreignTables
     * @return
     */
    static public String insert(Object requestParam, Object bean, Object tbl_wrk, String foreignTables) {
        String result = null;
        try {
            if (tbl_wrk != null) {

                if (tbl_wrk instanceof String) {
                    tbl_wrk = workspace.get_tbl_manager_workspace_from_db((String) tbl_wrk);
                }

                String table = "";
                String[] schemaTableParts = ((workspace) tbl_wrk).schemaTable.split("\\.");
                if (schemaTableParts.length == 1) {
                    table = schemaTableParts[0];
                } else if (schemaTableParts.length >= 2) {
                    table = schemaTableParts[1];
                }

                if(bean != null) {
                    String sModifications = "";
                    String sFields = "";
                    HttpServletRequest request = (HttpServletRequest)requestParam;
                    workspace tblWrk = (workspace) tbl_wrk;
                    JSONArray cols = tblWrk.tableJson.getJSONArray("columns");

                    //
                    // Copy values from beans to "modifications"...
                    //
                    for (int ic = 0; ic < cols.length(); ic++) {
                        JSONObject col = cols.getJSONObject(ic);
                        String propName = col.getString("name");

                        String [] propNameParts = propName.split("\\.");

                        if( propNameParts.length == 1 || (propNameParts.length > 1 && table.equalsIgnoreCase(propNameParts[0])) ) {

                            if(utility.has(bean, propName)) {
                                Object oFieldValue = utility.get(bean, propName);
                                String fieldValue = null;
                                boolean setFieldValue = true;

                                if (oFieldValue != null) {
                                    if (oFieldValue instanceof Date || oFieldValue instanceof Timestamp) {
                                        // N.B.: modification come from UI, date is dd/MM/yyyy HH:mm:ss
                                        if(request != null) {
                                            if(oFieldValue != null) {
                                                Date gtmDate = utility.get_local2server_time(request, oFieldValue);
                                                if(gtmDate != null) {
                                                    oFieldValue = gtmDate;
                                                } else {
                                                    throw new Exception("Failed to get local time");
                                                }
                                            }
                                        }
                                        DateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
                                        fieldValue = dateFormat.format(oFieldValue);
                                    } else {
                                        fieldValue = String.valueOf(oFieldValue);
                                    }
                                } else {
                                    fieldValue = null;
                                    if (col.has("default")) {
                                        String defaultValue = col.getString("default");
                                        if (defaultValue != null) {
                                            //
                                            // NO : se nel controllo c'è un accesso alle variabili di sessione è NECESSARIO risolverle
                                            // setFieldValue = false;
                                            //
                                            String newDefaultValue = solveVariableField(defaultValue, request, false);
                                            if (newDefaultValue.compareTo(defaultValue) != 0) {
                                                setFieldValue = true;
                                            } else {
                                                //
                                                // Lascia il campo inalterato (usa il default del DB)
                                                // N.B.: Non e' possibile usare il default del controllo poiche non sarebbe discriminabile
                                                //      dalle espressioni usate dal DB (es uso del sequence
                                                //
                                                setFieldValue = false;
                                            }
                                        }
                                    }
                                }
                                if(setFieldValue) {
                                    if (oFieldValue instanceof Integer
                                            || oFieldValue instanceof Long
                                            || oFieldValue instanceof Float
                                            || oFieldValue instanceof Double
                                            || oFieldValue instanceof BigDecimal) {
                                        sFields += (sFields.length() > 0 ? "," : "") + "{\"field\":\"" + cols.getJSONObject(ic).getString("field") + "\",\"value\":" + fieldValue + "}";
                                    } else if (oFieldValue instanceof Boolean) {
                                            sFields += (sFields.length() > 0 ? "," : "") + "{\"field\":\"" + cols.getJSONObject(ic).getString("field") + "\",\"value\":" + (((boolean)oFieldValue) ? "true" : "false") + "}";
                                    } else {
                                        fieldValue = fieldValue != null ? fieldValue.replace("\\", "\\\\") : "";
                                        fieldValue = fieldValue != null ? fieldValue.replace("\n", "\\n") : "";
                                        fieldValue = fieldValue != null ? fieldValue.replace("\"", "\\\"") : "";
                                        fieldValue = fieldValue != null ? fieldValue.replace("\t", "\\t") : "";
                                        sFields += (sFields.length() > 0 ? "," : "") + "{\"field\":\"" + cols.getJSONObject(ic).getString("field") + "\",\"value\":\"" + fieldValue + "\"}";
                                    }
                                }
                            }
                        }
                    }

                    sModifications += "{\"rowId\":\"\",\"fields\":[" + sFields + "]}";

                    String insertingParams = "{ \"params\":[{\"modifications\":[" + sModifications + "] } ] }";

                    //
                    // do insert
                    //
                    result = db.insertFields(tbl_wrk, insertingParams, null, (Object)requestParam, requestParam);
                    
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
            } else {
                String error = "controlId is missing";
                result = utility.append_error_to_result( utility.base64Encode(error), result);
            }
        } catch (Exception ex) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            result = utility.append_error_to_result( utility.base64Encode(ex.getLocalizedMessage()), result);
        }
        return result;
    }

    
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
    static public String update(Object bean, Object tbl_wrk, HttpServletRequest request) {
        try {
            if (bean != null) {
                if (tbl_wrk != null) {

                    if(tbl_wrk instanceof String) {
                        tbl_wrk = workspace.get_tbl_manager_workspace_from_db((String)tbl_wrk);
                    }

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

                                if(utility.has(bean, beanColName)) {

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
                                }
                            } catch (Exception ex) {
                                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, "// ERROR in bean:" + bean.getClass().getName() + " prop.:" + colName + " error:" + ex.getLocalizedMessage());
                            }
                        }
                    }
                    if (primaryKeyValue != null) {
                        sModifications += "{\"rowId\":\"" + primaryKeyValue + "\",\"fields\":[" + sFields + "]}";

                        String updatingParams = "{ \"params\":[{\"modifications\":[" + sModifications + "] } ] }";

                        return db.updateFields(tbl_wrk, updatingParams, null, request, null);
                    }
                }
            }

        } catch (Exception ex) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }



    /**
     * Update DB by a bean (no workspace needed)
     * 
     * @param conn
     * @param bean
     * @param databaseSchemaTable
     * @param primaryKey        (use "WHERE ..." for direct where condition)
     * @return
     */
    static public String update(Connection conn, Object bean, String databaseSchemaTable, String primaryKey) {
        try {
            if (bean != null && databaseSchemaTable != null && primaryKey != null) {
                PreparedStatement psdo = null;
                String sModifications = "";
                String database = null, schema = null, table = null, sFields = "";

                Object primaryKeyValue = null;

                DateFormat dateFormat = new SimpleDateFormat("dd" + workspace.dateSep + "MM" + workspace.dateSep + "yyyy");
                DateFormat dateTimeFormat = new SimpleDateFormat("dd" + workspace.dateSep + "MM" + workspace.dateSep + "yyyy HH" + workspace.timeSep + "mm" + workspace.timeSep + "ss.SS");


                String itemIdString = "\"", tableIdString = "\"";
                String dbProductName = conn.getMetaData().getDatabaseProductName();
                boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;
                String driverClass = conn != null ? conn.getClass().getName() : null;

                if ((driverClass != null && driverClass.toLowerCase().contains("postgres.")) || dbProductName.toLowerCase().contains("postgres")) {
                    isPostgres = true;
                }
                if ((driverClass != null && driverClass.toLowerCase().contains("mysql.")) || dbProductName.toLowerCase().contains("mysql")) {
                    isMySQL = true;
                }
                if ((driverClass != null && driverClass.toLowerCase().contains("mariadb.")) || dbProductName.toLowerCase().contains("mariadb")) {
                    isMySQL = true;
                }
                if ((driverClass != null && driverClass.toLowerCase().contains("oracle.")) || (dbProductName != null && dbProductName.toLowerCase().contains("oracle"))) {
                    isOracle = true;
                }
                if ((driverClass != null && driverClass.toLowerCase().contains("sqlserver.")) || (dbProductName != null && dbProductName.toLowerCase().contains("sqlserver"))) {
                    isSqlServer = true;
                }

                if (isMySQL) {
                    itemIdString = "`";
                    tableIdString = "";
                } else {
                    itemIdString = "\"";
                    tableIdString = "\"";
                }


                Field[] fields = bean.getClass().getDeclaredFields();
                Field fieldFound = null;
                ArrayList<Object> params = new ArrayList<Object>();

                for (Field f : fields) {
                    String fieldName = f.getName();
                    String[] colParts = fieldName.split("\\$");
                    if (colParts.length == 1) {
                        fieldName = "";
                        for (int ip = 0; ip < colParts.length; ip++) {
                            fieldName += (fieldName.length() > 0 ? "$" : "") + colParts[ip];

                            int colType = 0;
                            String colName = fieldName;

                            // String beanColName = (colRuntimeName != null ? colRuntimeName.replaceAll("\\.", "\\$") : (colName != null ? colName.replaceAll("\\.", "\\$") : null));

                            try {

                                Object fieldData = utility.get(bean, fieldName);

                                if (fieldData instanceof Timestamp) { //date
                                    fieldData = fieldData != null ? dateTimeFormat.format(fieldData) : null;

                                } else if (fieldData instanceof Date) { //date
                                    java.sql.Date dbSqlDate = (java.sql.Date) fieldData;

                                } else if (fieldData instanceof Time) { //date
                                    java.sql.Time dbSqlTime = (java.sql.Time) fieldData;

                                }

                                if (fieldName.equals(primaryKey) && !primaryKey.startsWith("WHERE ")) {
                                    primaryKeyValue = fieldData;
                                } else {
                                    boolean isChanged = utility.isChanged(bean, fieldName);
                                    if (isChanged) {
                                        sFields += (sFields.length() > 0 ? "," : "") + (itemIdString + fieldName + itemIdString) + "=?";
                                        params.add(utility.get(bean, fieldName));
                                    }
                                }
                            } catch (Exception ex) {
                                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, "// ERROR in bean:" + bean.getClass().getName() + " prop.:" + colName + " error:" + ex.getLocalizedMessage());
                            }
                        }
                    }
                }




                try {

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

                    String sql = null;
                    if (primaryKeyValue != null) {
                        sql = "UPDATE " + schema + "." + table + " SET " + sFields + " WHERE " + primaryKey + "=" + primaryKeyValue;
                    } else {
                        if(primaryKey.startsWith("WHERE ")) {
                            sql = "UPDATE " + schema + "." + table + " SET " + sFields + " " + primaryKey;
                        }
                    }
                    if (sql != null) {
                        psdo = conn.prepareStatement(sql);
                        if (params != null) {
                            for (int ip = 0; ip < params.size(); ip++) {
                                psdo.setObject(ip + 1, params.get(ip));
                            }
                        }
                        if (workspace.projectMode) {
                            System.out.print("// LIQUID Query: ");
                            System.out.println(psdo);
                        }
                        int res = psdo.executeUpdate();
                        return "{\"res\":" + res + "}";
                    }
                } catch (Throwable th) {
                    return "{\"res\":-1, \"error\":\""+th.getMessage()+"\"}";
                } finally {
                    if(psdo != null) {
                        psdo.close();
                    }
                }
            }

        } catch (Exception ex) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
        }

        return null;
    }






    /**
     * <h3>delete the bean from the database</h3>
     * <p>
     * This method execute an delete statement by the given bean
     *
     * @param bean bean to delete (Object)
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
    static public String getSelection(Object tbl_wrk, Object params) throws Exception {
        return workspace.getSelection(tbl_wrk, (String) params);
    }

    static public long getSelectionCount(Object tbl_wrk, Object params) throws Exception {
        return workspace.getSelectionCount(tbl_wrk, (String) params);
    }

    public static Object getSelectionRows(Object tbl_wrk, Object params) throws Exception {
        return workspace.getSelectionRows(tbl_wrk, (String)params);
    }


    static public String getData(Object tbl_wrk, Object params, String column) throws Exception {
        return workspace.getData(tbl_wrk, (String) params, (String) column);
    }

    static public String getUserProp(Object tbl_wrk, Object params, String prop) {
        return workspace.getUserProp(tbl_wrk, params, prop);
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

    static public JSONArray wrapFilters(JSONObject filterJSON) throws Exception {
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

    static public String syncronizeTable(
            String databaseSchemaTable, String sourceRowsFilters,
            String targetDatabaseSchemaTable, String targetRowsFilters,
            String columnsRelation
    ) {
        return syncronizeTable(databaseSchemaTable, sourceRowsFilters, targetDatabaseSchemaTable, targetRowsFilters, columnsRelation, null, null, "mirror", null);
    }

    /**
     * <h3>Syncronize target table by source table, adding and removing
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
    static public String syncronizeTable(
            String sourceDatabaseSchemaTable, String sSourceRowsFilters,
            String targetDatabaseSchemaTable, String sTargetRowsFilters,
            String sColumnsRelation,
            String methodGetPrimaryKey, Object instanceGetPrimaryKey,
            String mode,
            HttpServletRequest request
    ) {
        JSONObject resultJSON = new JSONObject();
        String result = "";
        String database = null, schema = null, table = null;
        String targetTable = null, targetSchema = null, targetDatabase = null;
        String sourceControlId = null, targetControlId = null, where_condition_source = "", where_condition_target = "", error = "";
        ArrayList<Object> where_condition_source_params = new ArrayList<Object>();
        ArrayList<Object> where_condition_target_params = new ArrayList<Object>();
        String sourcePrimaryKey = null, targetPrimaryKey = null, targetPrimaryKeyForCompare = null;
        boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;
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
                            Object [] resWhere = process_filters_json(source_tbl_wrk, table, cols,
                                    isOracle, isMySQL, isPostgres, isSqlServer,
                                    where_condition_source, where_condition_source_params,
                                    filtersCols, null, leftJoinsMap,
                                    tableIdString, itemIdString,
                                    request);

                            String errorWhere = (String)resWhere[1];
                            if(errorWhere != null && !errorWhere.isEmpty())
                                error += "[" + errorWhere + "]";

                            where_condition_target = (String)resWhere[2];
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
                    ArrayList<Object> sourceRows = com.liquid.bean.load_beans(request, sourceControlId, sourceDatabaseSchemaTable, "*", where_condition_source, 0);

                    //
                    // Build target table filters
                    //
                    try {
                        if (targetRowsFilters != null) {
                            JSONArray cols = target_tbl_wrk.tableJson.getJSONArray("columns");
                            JSONArray filtersCols = wrapFilters(targetRowsFilters);
                            Object [] resWhere = process_filters_json(source_tbl_wrk, targetTable, cols,
                                    isOracle, isMySQL, isPostgres, isSqlServer,
                                    where_condition_target, where_condition_target_params, filtersCols, null, leftJoinsMap,
                                    tableIdString, itemIdString,
                                    request);

                            String errorWhere = (String)resWhere[1];
                            if(errorWhere != null && !errorWhere.isEmpty())
                                error += "[" + errorWhere + "]";

                            where_condition_target = (String)resWhere[2];
                        }
                    } catch (Exception e) {
                        error += "[Filters Error:" + e.getLocalizedMessage() + "]" + "[Driver:" + source_tbl_wrk.driverClass + "]";
                        System.err.println("// Filters Error:" + e.getLocalizedMessage());
                        throw new Exception(e);
                    }

                    if (where_condition_target == null || where_condition_target.isEmpty()) {
                        if (mode.contains("all")) {
                            return "{\"error\":\"You need a filter on target or add 'ALL' keyword in mode parameter\"}";
                        }
                    }

                    //
                    // Filtering target table
                    //
                    ArrayList<Object> targetRows = com.liquid.bean.load_beans(request, targetControlId, targetDatabaseSchemaTable, "*", where_condition_target, 0);

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
                                    Object[] beanResult = com.liquid.bean.create_beans_multilevel_class(target_tbl_wrk, rowsJson, null, "*", 0, 1, request);
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


    static public String syncronizeTable(String sourceDatabaseSchemaTable, String sSourceRowsFilters,
                                         String targetDatabaseSchemaTable, String sTargetRowsFilters,
                                         String sColumnsRelation,
                                         String methodGetPrimaryKey, Object instanceGetPrimaryKey,
                                         String mode) {
        return  syncronizeTable(sourceDatabaseSchemaTable, sSourceRowsFilters, targetDatabaseSchemaTable, sTargetRowsFilters, sColumnsRelation, methodGetPrimaryKey, instanceGetPrimaryKey, mode, (HttpServletRequest)null);
    }

    /**
     * <h3>Syncronize target table metadata by source table, adding and removing colums</h3>
     * <p>
     * This method execute a syncronization by adding and removing rows
     *
     * @param sourceDatabaseSchemaTable the source table (database.schema.table or schema.table or table) (String)
     * 
     * @param targetDatabaseSchemaTable the target table (database.schema.table or schema.table or table) (String)
     
     * @param jdbcSource the source connection data (JDBCSource)
     *
     * @param jdbcTarget the target connection data (JDBCSource)
     *
     * @param mode can be a list of these values: "mirror" (default mode) "all" (allow to process all rows, if no filters defined) 
     *  "preview" (report the differences without perform any operations)
     *  "deepMode" (compare filed's size, default, remarks, nullable, precision, scale)
     *
     * @return the detail of operation the operation, if not preview mode as {
     * "addedColumns":[ 1, 2, 3, ... ] ,"addedCount":n ,"deletedColumns":[ 1, 2, 3, ...
     * ] ,"deletedCount":n }
     * @see db
     */
    static public String syncronizeTableMetadata(
            String sourceDatabaseSchemaTable, String targetDatabaseSchemaTable,
            connection.JDBCSource jdbcSource, connection.JDBCSource jdbcTarget,
            String mode
    ) {
        
        Connection sconn = null, tconn = null;
        String error = null;
        
        try {        
                Object [] connResult = connection.getLiquidDBConnection(jdbcSource, jdbcSource.driver, jdbcSource.host, jdbcSource.port, jdbcSource.database, jdbcSource.user, jdbcSource.password, jdbcSource.service);
                sconn = (Connection)connResult[0];
                if (sconn == null) {
                    return "{\"error\":\"" + utility.base64Encode((String) connResult[1]) + "\"}";
                }
                connResult = connection.getLiquidDBConnection(jdbcTarget, jdbcTarget.driver, jdbcTarget.host, jdbcTarget.port, jdbcTarget.database, jdbcTarget.user, jdbcTarget.password, jdbcTarget.service);
                tconn = (Connection)connResult[0];
                if (tconn == null) {
                    return "{\"error\":\"" + utility.base64Encode((String) connResult[1]) + "\"}";
                }

            return syncronizeTableMetadata(sourceDatabaseSchemaTable, targetDatabaseSchemaTable, sconn, tconn, mode);
            
        } catch (Throwable th) {
        } finally {
            if(sconn != null) try {
                sconn.close();
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
            if(tconn != null) try {
                tconn.close();
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return "{\"error\":\"" + utility.base64Encode("unknown error") + "\"}";
    }
    
    static public String syncronizeTableMetadata(
            String sourceDatabaseSchemaTable, String targetDatabaseSchemaTable,
            Connection sconn, Connection tconn,
            String mode
    ) {
        JSONObject resultJSON = new JSONObject();
        String result = "";
        String database = null, schema = null, table = null;
        String targetTable = null, targetSchema = null, targetDatabase = null;
        boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;
        HttpServletRequest request = null;
        String error = "";
        String preview = "";
        String driver = null, targetDriver = null;
        
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

            
            
            if (sconn != null) {
                
                driver = getDriver(sconn);
                
                if (tconn != null) {
                    targetDriver = getDriver(tconn);
                }
                

                String itemIdString = "\"", tableIdString = "\"", asKeyword = " AS ";
                if (driver != null && driver.toLowerCase().contains("postgres")) {
                    isPostgres = true;
                }
                if (driver != null && driver.toLowerCase().contains("mysql")) {
                    isMySQL = true;
                }
                if (driver != null && driver.toLowerCase().contains("mariadb")) {
                    isMySQL = true;
                }
                if (driver != null && driver.toLowerCase().contains("oracle")) {
                    isOracle = true;
                }
                if (driver != null && driver.toLowerCase().contains("sqlserver")) {
                    isSqlServer = true;
                }




                //        
                // Eliminazione righe non corrispondenti
                //
                ArrayList<String> addingColumnsLabel = new ArrayList<String>();
                ArrayList<String> deletingColumnsLabel = new ArrayList<String>();


                if (mode.contains("callback"))
                    Callback.send("Reading source fields " + schema + "."+ table + "...");                
                ArrayList<String> sourceColumns = metadata.getAllColumnsAsArray(database, schema, table, sconn);
                
                
                if(targetDatabase != null && !targetDatabase.isEmpty()) {                    
                } else targetDatabase = database;
                if(targetSchema != null && !targetSchema.isEmpty()) {                    
                } else targetSchema = schema;
                if(targetTable != null && !targetTable.isEmpty()) {                    
                } else targetTable = table;
                
                if (mode.contains("callback"))
                    Callback.send("Reading target fields " + targetSchema + "."+ targetTable + "...");                
                ArrayList<String> targetColumns = metadata.getAllColumnsAsArray(targetDatabase, targetSchema, targetTable, tconn);

                
                
                for(int iCol=0; iCol<sourceColumns.size(); iCol++) {
                    String field = sourceColumns.get(iCol);
                    
                    if (mode.contains("callback"))
                        Callback.send("Comparing fields " + (iCol+1) + "/"+ sourceColumns.size() + "...");
                    
                    if (utility.contains(targetColumns, (String) field)) {
                        // "deepMode" (compare filed's size, default, remarks, nullable, precision, scale)
                        if (mode.contains("deepMode")) {
                            boolean isFieldChanged = false;
                            String sTypeName = null;
                            String sNullable = null;
                            String sColumnDef = null;
                            String sSize = null;
                            String sRemarks = null;
                            String sDigits = null;

                            if (mode.contains("callback"))
                                Callback.send("Reading metadata on "+schema+"."+table+" ...");

                            metadata.MetaDataCol mdColS = (metadata.MetaDataCol) metadata.readTableMetadata(sconn, database, schema, table, field, true, true);
                            metadata.MetaDataCol mdColT = (metadata.MetaDataCol) metadata.readTableMetadata(tconn, targetDatabase, targetSchema, targetTable, field, true, true);
                            if(mdColS.size != mdColT.size) {
                                isFieldChanged = true;
                                sSize = String.valueOf(mdColS.size);
                            }
                            if(mdColS.isNullable != mdColT.isNullable) {
                                isFieldChanged = true;
                                sNullable = String.valueOf(mdColS.isNullable);
                            }
                            if(!mdColS.datatype.equalsIgnoreCase(mdColT.datatype)) {
                                isFieldChanged = true;
                                sTypeName = String.valueOf(mdColS.datatype);
                            }
                            if(mdColS.digits != mdColT.digits) {
                                isFieldChanged = true;
                                sDigits = String.valueOf(mdColS.digits);
                            }
                            if(mdColS.columnDef != null) {
                                if(!mdColS.columnDef.equalsIgnoreCase(mdColT.columnDef)) {
                                    isFieldChanged = true;
                                    sColumnDef = mdColS.columnDef;
                                }
                            } else if(mdColT.columnDef != null && !mdColT.columnDef.isEmpty()) {
                                isFieldChanged = true;
                                sColumnDef = mdColS.columnDef;
                            }
                            if(mdColS.remarks != null) {
                                if(mdColS.remarks.equalsIgnoreCase(mdColT.remarks)) {
                                    isFieldChanged = true;
                                    sRemarks = mdColS.remarks;
                                }
                            } else if(mdColT.remarks != null && !mdColT.remarks.isEmpty()) {
                                isFieldChanged = true;
                                sRemarks = mdColS.remarks;
                            }
                            if(isFieldChanged) {
                                if (mode.contains("callback"))
                                    Callback.send("Preparing sql on "+targetTable+"...");
                                String sqlCode = metadata.getUpdateColumnSQL( targetDriver, targetDatabase, targetSchema, targetTable, field, sTypeName, sSize, sDigits, sNullable, sColumnDef, sRemarks );
                                if(sqlCode != null) {
                                    String fSqlCode = sqlCode.replace("\n", " ");
                                    fSqlCode = fSqlCode.trim();
                                    if(fSqlCode.endsWith(";")) fSqlCode = fSqlCode.substring(0, fSqlCode.length()-1);
                                    if (mode.contains("preview")) {
                                        preview += fSqlCode + "\n\n";
                                    } else {
                                        try {
                                            if (mode.contains("callback"))
                                                Callback.send("Updating "+targetTable+"...");
                                            Statement stmt = tconn.createStatement();
                                            boolean res = stmt.execute(fSqlCode);
                                            if(!res) {
                                                ResultSet rs = stmt.getResultSet();
                                                if(rs != null) {
                                                    if(rs.next()) {
                                                        String sql_result = rs.getString(1);
                                                        if(sql_result != null) {
                                                        }
                                                    }
                                                }
                                            }
                                        } catch (Exception ex) {
                                            error += "[ SQL:"+fSqlCode+"<br/>Error:"+ex.getMessage()+"]";
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        addingColumnsLabel.add((String) sourceColumns.get(iCol));
                        String type = null;
                        String size = null;
                        String nullable = null;
                        String autoincrement = null;
                        String sDefault = null;
                        String sRemarks = null;

                        // TODO: isOracle var for target table
                        metadata.MetaDataCol mdCol = (metadata.MetaDataCol) metadata.readTableMetadata(sconn, database, schema, table, field, true, true);

                        if(mdCol != null) {
                            String sqlCode = metadata.getAddColumnSQL( targetDriver, targetDatabase, targetSchema, targetTable, field, mdCol.typeName, String.valueOf(mdCol.size), mdCol.isNullable ? "y":"n", mdCol.autoIncString ? "y" : "n", mdCol.columnDef, mdCol.remarks );
                            if(sqlCode != null) {
                                String fSqlCode = sqlCode.replace("\n", " ");
                                fSqlCode = fSqlCode.trim();
                                if(fSqlCode.endsWith(";")) fSqlCode = fSqlCode.substring(0, fSqlCode.length()-1);
                                if (mode.contains("preview")) {
                                    preview += fSqlCode + ";\n\n";
                                } else {
                                    try {
                                        Statement stmt = tconn.createStatement();
                                        boolean res = stmt.execute(fSqlCode);
                                        if(!res) {
                                            ResultSet rs = stmt.getResultSet();
                                            if(rs != null) {
                                                if(rs.next()) {
                                                    String sql_result = rs.getString(1);
                                                    if(sql_result != null) {
                                                    }
                                                }
                                            }
                                        }
                                    } catch (Exception ex) {
                                        error += "[ SQL:"+fSqlCode+"<br/>Error:"+ex.getMessage()+"]";
                                    }
                                }
                            } else {
                                error += "[ Failed to read metadata ]";
                            }
                        }
                    }
                }

                if(sourceColumns.size() == 0) {
                    error += "[ Failed to read source table ]";
                }

                if (mode.contains("callback"))
                    Callback.send("Analyzing missing fields " + schema + "."+ table + "...");                

                if (targetColumns != null) {
                    for (int iCol = 0; iCol < targetColumns.size(); iCol++) {
                        boolean found = false;
                        if (utility.contains(sourceColumns, targetColumns.get(iCol))) {
                        } else {
                            deletingColumnsLabel.add(targetColumns.get(iCol));
                            if (mode.contains("preview")) {
                                preview += "ALTER TABLE "+targetSchema+"."+targetTable+" DROP COLUMN "+targetColumns.get(iCol) + "\n\n";                                
                            } else {
                            }
                        }
                    }
                }

                resultJSON.put("deletingCount", deletingColumnsLabel.size());
                resultJSON.put("deletingColumns", deletingColumnsLabel);

                //
                // Aggiunta righe non trovate
                //
                if (sourceColumns != null) {
                    for (int i = 0; i < sourceColumns.size(); i++) {
                        Object sourceCoulmn = (Object) sourceColumns.get(i);
                        {
                            // adding source table
                            if (mode.contains("preview")) {
                            } else {
                            }
                        }
                    }
                }
                if (addingColumnsLabel != null) {
                    resultJSON.put("addingCount", addingColumnsLabel.size());
                    resultJSON.put("addingColumns", addingColumnsLabel);
                }
            }

            if (error != null && !error.isEmpty()) {
                resultJSON.put("error", utility.base64Encode(error));
            }
            if (preview != null && !preview.isEmpty()) {
                resultJSON.put("preview", utility.base64Encode(preview));
            }

        if (mode.contains("callback"))
            Callback.send("Done...");                
            
        } catch (Throwable th) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
            error += "[ Fatal error :"+th.getMessage()+"]";
        }

        return resultJSON.toString();
    }


    
    static public boolean setSchema( Connection conn, String engine, String schema ) {
        String sql = null;
        boolean retVal = false;
                
        String tableIdString = "";
        
        // oracle
        if("oracle".equalsIgnoreCase(engine)) {
            sql = "ALTER SESSION SET CURRENT_SCHEMA = "+schema+"";
            
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

    public static boolean isNumeric(int sqlType) {
            return Types.BIT == sqlType || Types.BIGINT == sqlType || Types.DECIMAL == sqlType ||
                            Types.DOUBLE == sqlType || Types.FLOAT == sqlType || Types.INTEGER == sqlType ||
                            Types.NUMERIC == sqlType || Types.REAL == sqlType || Types.SMALLINT == sqlType ||
                            Types.TINYINT == sqlType;
    }
    
    private static boolean isLongType(int type) {
        boolean isValidLongType = type == Types.BIGINT || type == Types.INTEGER || type == Types.SMALLINT || type == Types.TINYINT;

        // Oracle
        isValidLongType |= type == Types.NUMERIC;

        return isValidLongType;
    }

    /**
     *
     * @param typeCode
     * @param value
     * @param expression
     * @param type
     * @param wrapNullToZero
     * @return
     */
    public static Object toJavaType(int typeCode, Object value, Object expression, int type, boolean wrapNullToZero) throws Exception {
        switch (typeCode) {
            case Types.ARRAY:
                return (Array) value;
            case Types.BIGINT:
                if (value instanceof String) {
                    if (wrapNullToZero)
                        if (value == null || ((String) value).isEmpty() || "NULL".equalsIgnoreCase((String) value))
                            return new Long(0);
                    return (Long) Long.parseLong((String) value);
                } else if (value instanceof Double) {
                    return (Long) ((Double) value).longValue();
                } else if (value instanceof Float) {
                    return (Long) ((Float) value).longValue();
                } else if (value instanceof Integer) {
                    return (Long) ((Integer) value).longValue();
                } else {
                    return (Long) value;
                }
            case Types.BINARY:
                return (byte[]) value;
            case Types.BLOB:
                return (Blob) value;
            case Types.BIT:
            case Types.BOOLEAN:
                if (value instanceof String) {
                    if (wrapNullToZero)
                        if (value == null || ((String) value).isEmpty() || "NULL".equalsIgnoreCase((String) value))
                            return false;
                    if ("1".equalsIgnoreCase((String) value) || "S".equalsIgnoreCase((String) value) || "Y".equalsIgnoreCase((String) value))
                        return true;
                    else
                        return false;
                } else if (value instanceof Double) {
                    return ((Double) value).doubleValue() > 0.0 ? true : false;
                } else if (value instanceof Float) {
                    return ((Float) value).doubleValue() > 0.0f ? true : false;
                } else {
                    return (boolean) value;
                }
            case Types.CHAR:
                return (String) value;
            case Types.CLOB:
                return (Clob) value;
            // case Types.DATALINK:
            case Types.DATE:
                if (value instanceof String) {
                    // TODO: cost to date ...
                    throw new Exception("CAST not developed...");
                } else {
                    return (java.sql.Date) value;
                }
            case Types.NUMERIC:
            case Types.DECIMAL:
                if (value instanceof String) {
                    if (wrapNullToZero)
                        if (value == null || ((String) value).isEmpty() || "NULL".equalsIgnoreCase((String) value))
                            return new java.math.BigDecimal(0);
                    return (java.math.BigDecimal) new java.math.BigDecimal(String.valueOf(value));
                } else if (value instanceof Double) {
                    return (java.math.BigDecimal) new java.math.BigDecimal(((Double) value));
                } else if (value instanceof Float) {
                    return (java.math.BigDecimal) new java.math.BigDecimal(((Float) value));
                } else if (value instanceof Long) {
                    return (java.math.BigDecimal) new java.math.BigDecimal(((Long) value));
                } else if (value instanceof Integer) {
                    return (java.math.BigDecimal) new java.math.BigDecimal(((Integer) value));
                } else if (value instanceof Short) {
                    return (java.math.BigDecimal) new java.math.BigDecimal(((Short) value));
                } else {
                    return (java.math.BigDecimal) value;
                }
                // case Types.DISTINCT:
            case Types.DOUBLE:
                if (value instanceof String) {
                    if (wrapNullToZero)
                        if (value == null || ((String) value).isEmpty() || "NULL".equalsIgnoreCase((String) value))
                            return new Double(0);
                    return (Double) Double.parseDouble((String) value);
                } else if (value instanceof Double) {
                    return (Double) ((Double) value).doubleValue();
                } else if (value instanceof Float) {
                    return (Double) ((Float) value).doubleValue();
                } else if (value instanceof Integer) {
                    return (Double) ((Integer) value).doubleValue();
                } else if (value instanceof Long) {
                    return (Double) ((Long) value).doubleValue();
                } else if (value instanceof Short) {
                    return (Double) ((Short) value).doubleValue();
                } else {
                    return (Double) value;
                }
            case Types.REAL:
            case Types.FLOAT:
                if (value instanceof String) {
                    if (wrapNullToZero)
                        if (value == null || ((String) value).isEmpty() || "NULL".equalsIgnoreCase((String) value))
                            return new Float(0);
                    return (Float) Float.parseFloat((String) value);
                } else if (value instanceof Double) {
                    return (Float) ((Double) value).floatValue();
                } else if (value instanceof Float) {
                    return (Float) ((Float) value).floatValue();
                } else if (value instanceof Integer) {
                    return (Float) ((Integer) value).floatValue();
                } else if (value instanceof Long) {
                    return (Float) ((Long) value).floatValue();
                } else if (value instanceof Short) {
                    return (Float) ((Short) value).floatValue();
                } else {
                    return (Float) value;
                }
            case Types.INTEGER:
                if (value instanceof String) {
                    if (wrapNullToZero)
                        if (value == null || ((String) value).isEmpty() || "NULL".equalsIgnoreCase((String) value))
                            return new Integer(0);
                    return (Integer) Integer.parseInt((String) value);
                } else if (value instanceof Double) {
                    return (Integer) ((Double) value).intValue();
                } else if (value instanceof Float) {
                    return (Integer) ((Float) value).intValue();
                } else {
                    return (Integer) value;
                }
                // case Types.JAVA_OBJECT:
                // case Types.LONGNVARCHAR:
                // case Types.LONGVARBINARY:
            case Types.LONGVARCHAR:
                return (String) value;
            // case Types.NCHAR:
            // case Types.NCLOB:
            // case Types.NULL:
            // case Types.NVARCHAR:
            // case Types.OTHER:
            // case Types.REF_CURSOR:
            // case Types.ROWID:
            // case Types.SQLXML:
            // case Types.VARBINARY:
            case Types.REF:
                return (Ref) value;
            case Types.SMALLINT:
                if (value instanceof String) {
                    if (wrapNullToZero)
                        if (value == null || ((String) value).isEmpty() || "NULL".equalsIgnoreCase((String) value))
                            return new Short((short) 0);
                    return (Short) Short.parseShort((String) value);
                } else if (value instanceof Double) {
                    return (Short) ((Double) value).shortValue();
                } else if (value instanceof Float) {
                    return (Short) ((Float) value).shortValue();
                } else {
                    return (Short) value;
                }
            case Types.STRUCT:
                return (Struct)value;
            case Types.TIME:
                if(value instanceof java.sql.Time) {
                    return (java.sql.Time)value;
                } else {
                    return (Object) expression;
                }
            case Types.TIME_WITH_TIMEZONE:
                if(value instanceof java.sql.Time) {
                    return (java.sql.Time)value;
                } else {
                    return (Object) expression;
                }
            case Types.TIMESTAMP:
                if(value instanceof java.sql.Timestamp) {
                    return (java.sql.Timestamp)value;
                } else {
                    return (Object) expression;
                }
            case Types.TIMESTAMP_WITH_TIMEZONE:
                if(value instanceof java.sql.Timestamp) {
                    return (java.sql.Timestamp) value;
                } else {
                    return (Object) expression;
                }
            case Types.TINYINT:
                return (Byte)value;
            case Types.VARCHAR:
                return (String)value;
            default:
                return (String)value;
        }
    }

    public static Object toJavaType(int typeCode, Object value, Object expression, int type) throws Exception {
        return toJavaType(typeCode, value, expression, type, false);
    }

    
    private static String javaToSQLName( Object Param ) {
        if(Param == null) {
            return "";
        } else if (Param instanceof String) {
            return "varchar";
        } else if (Param instanceof Integer) {
            return "int4";
        } else if (Param instanceof Long) {
            return "int8";
        } else if (Param instanceof java.math.BigDecimal) {
            return "NUMBER";
        } else if (Param instanceof Double) {
            return "float8";
        } else if (Param instanceof Float) {
            return "float4";
        } else if (Param instanceof Boolean) {
            return "bool";
        } else if (Param instanceof java.sql.Time) {
            return "TIME";
        } else if (Param instanceof java.sql.Date) {
            return "DATE";
        } else if (Param instanceof java.sql.Timestamp) {
            return "TIMESTAMP";
        } else if (Param instanceof Blob) {
            return "BINARY";
        } else if (Param instanceof Clob) {
            return "BINARY";
        } else if (Param instanceof Byte) {
            return "BINARY";
        } else if (Param instanceof Array) {
            return "ARRAY";
        } else if (Param instanceof ArrayList) {
            return "ARRAY";
        } else {
            return "";
        }
    }

    
    
    
    
    public static void set_statement_param( PreparedStatement psdo, int iParam, Object Param ) throws SQLException {
        if(psdo != null) {
            if(Param == null) {
                int sqltype = 1;
                psdo.setNull(iParam, sqltype);
            } else if (Param instanceof String) {
                psdo.setString(iParam, (String)Param);
            } else if (Param instanceof Integer) {
                psdo.setInt(iParam, (Integer)Param);
            } else if (Param instanceof Long) {
                psdo.setLong(iParam, (Long)Param);
            } else if (Param instanceof java.math.BigDecimal) {
                psdo.setBigDecimal(iParam, (java.math.BigDecimal)Param);
            } else if (Param instanceof Double) {
                psdo.setDouble(iParam, (Double)Param);
            } else if (Param instanceof Float) {
                psdo.setFloat(iParam, (Float)Param);
            } else if (Param instanceof Boolean) {
                psdo.setBoolean(iParam, (Boolean)Param);
            } else if (Param instanceof java.sql.Time) {
                psdo.setTime(iParam, (java.sql.Time)Param);
            } else if (Param instanceof java.sql.Date) {
                psdo.setDate(iParam, (java.sql.Date)Param);
            } else if (Param instanceof java.sql.Timestamp) {
                psdo.setTimestamp(iParam, (java.sql.Timestamp)Param);
            } else if (Param instanceof Blob) {
                psdo.setBlob(iParam, (Blob)Param);
            } else if (Param instanceof Clob) {
                psdo.setClob(iParam, (Clob)Param);
            } else if (Param instanceof Byte) {
                psdo.setByte(iParam, (Byte)Param);
            } else if (Param instanceof Array) {
                psdo.setArray(iParam, (Array)Param);
            } else if (Param instanceof ArrayList) {
                if(((ArrayList) Param).size() > 0) {
                    Object firstObject = ((ArrayList<Object>)Param).get(0);
                    String typeName = javaToSQLName(firstObject);
                    java.sql.Array arrayParam = psdo.getConnection().createArrayOf(typeName, ((ArrayList<Object>)Param).toArray() );
                    psdo.setArray(iParam, arrayParam);
                }
            } else if (Param instanceof List) {
                if(((List) Param).size() > 0) {
                    Object firstObject = ((List<Object>)Param).get(0);
                    String typeName = javaToSQLName(firstObject);
                    java.sql.Array arrayParam = psdo.getConnection().createArrayOf(typeName, ((List<Object>)Param).toArray() );
                    psdo.setArray(iParam, arrayParam);
                }
            }
        }
    }


    /**
     * Risolve l'espressione
     * N.B.: Per essere assegnata la variabile deve essere != da NULL
     * N.B.: Per usare un testo costante : ${"text"}
     *
     * @param value
     * @param request
     * @param solveSessionVars
     * @return
     * @throws Exception
     */
    static public String solveVariableField( String value, HttpServletRequest request, boolean solveSessionVars) throws Exception {
        //
        // varibili di sessione e altre dipendenti dal client
        //
        if(solveSessionVars) {
            int nReplaced = 0;
            if (value != null && !value.isEmpty()) {
                String currentValue = null;
                for (int i = 0; i < value.length(); i++) {
                    if (i<value.length() && (value.charAt(i) == '$' || value.charAt(i) == '%') && (i+1<value.length() && value.charAt(i + 1) == '{') ) {
                        i += 2;
                        int s = i;
                        int parentCounter=1;
                        while (i < value.length()) {
                            if(value.charAt(i) == '}') {
                                parentCounter--;
                            } else if(value.charAt(i) == '{') {
                                parentCounter++;
                            }
                            if(parentCounter == 0)
                                break;
                            else
                                i++;
                        }
                        String cVar = value.substring(s, i);
                        if (!cVar.isEmpty()) {
                            if (cVar.charAt(0) == '"') {
                                String cVarValue = cVar.substring(1);
                                if (cVarValue.charAt(cVarValue.length()-1) == '"') {
                                    cVarValue = cVarValue.substring(0, cVarValue.length()-2);
                                }
                                if (cVarValue.charAt(cVarValue.length()-1) == '\\') {
                                    cVarValue = cVarValue.substring(0, cVarValue.length()-2);
                                }
                                if (currentValue == null)
                                    currentValue = "";
                                currentValue += cVarValue;
                                nReplaced++;
                            } else {
                                Object oVar = request.getSession().getAttribute(cVar);
                                String cVarValue = oVar != null ? (String) String.valueOf(oVar) : null;
                                if (cVarValue != null) {
                                    if (currentValue == null)
                                        currentValue = "";
                                    currentValue += cVarValue;
                                    nReplaced++;
                                }
                            }
                        }
                    } else {
                        if (currentValue == null)
                            currentValue = "";
                        currentValue += value.charAt(i);
                        nReplaced++;
                    }
                }
                value = currentValue;
            }
        }
        //
        // varibili nel server
        //
        if (value != null && !value.isEmpty()) {
            String currentValue = null;
            int nReplaced = 0;
            int ss = 0;
            for (int i = 0; i < value.length(); i++) {
                if (i<value.length() && (value.charAt(i) == '$' || value.charAt(i) == '%') && (i+1<value.length() && value.charAt(i + 1) == '{') ) {
                    ss = i;
                    i += 2;
                    int s = i;
                    while (value.charAt(i) != '}' && i < value.length()) {
                        i++;
                    }
                    String cVar = value.substring(s, i);
                    if (!cVar.isEmpty()) {
                        if("CURRENT_TIMESTAMP".equalsIgnoreCase(cVar)) {
                            SimpleDateFormat df = new SimpleDateFormat("dd-MM-yyyy H:mm:ss.SSS");
                            String cVarValue = df.format(new Date(System.currentTimeMillis()));
                            if (cVarValue != null) {
                                if (currentValue == null)
                                    currentValue = "";
                                currentValue += cVarValue;
                                nReplaced++;
                            }
                        } else if("currentTimeMillis".equalsIgnoreCase(cVar)) {
                            String cVarValue = String.valueOf(System.currentTimeMillis());
                            if (cVarValue != null) {
                                if (currentValue == null)
                                    currentValue = "";
                                currentValue += cVarValue;
                                nReplaced++;
                            }
                        } else {
                            if (currentValue == null)
                                currentValue = "";
                            currentValue += value.substring(ss, i+1);
                        }
                    }
                } else {
                    if (currentValue == null)
                        currentValue = "";
                    currentValue += value.charAt(i);
                }
            }
            value = currentValue;
        }

        return value;
    }


    /**
     *
     * Convert filters to hash map
     *
     * @param liquid
     * @param curFilter1B
     * @param oRequest
     * @return
     */
    public static Map<String, Object> filtersToMap(Object liquid, int curFilter1B, Object oRequest, boolean addIfNull) {
        Map<String, Object> parametersString = null;
        if (liquid != null) {
            com.liquid.workspace wrk = (com.liquid.workspace) liquid;
            if (wrk.tableJson.has("filters")) {
                JSONArray filterCols = null;
                Object oFilters = wrk.tableJson.get("filters");
                if(oFilters instanceof JSONArray) {
                    JSONArray filters = wrk.tableJson.getJSONArray("filters");
                    int curFilter = curFilter1B > 0 ? curFilter1B - 1 : 0;
                    if (wrk.tableJson.has("curFilter")) {
                        parametersString = new HashMap<>();
                        curFilter = wrk.tableJson.getInt("curFilter");
                        filterCols = (filters != null ? filters.getJSONObject(curFilter).getJSONArray("columns") : null);
                    }
                } else if(oFilters instanceof JSONObject) {
                    JSONObject filters = (JSONObject)oFilters;
                    filterCols = filters.getJSONArray("columns");
                }
                if (filterCols != null) {
                    parametersString = new HashMap<>();
                    for (int iF = 0; iF < filterCols.length(); iF++) {
                        JSONObject filterCol = filterCols.getJSONObject(iF);
                        String filterName = filterCol.getString("name");
                        if(filterCol.has("value")) {
                            String filterValue = String.valueOf(filterCol.get("value"));
                            if (filterValue != null && !filterValue.isEmpty() || addIfNull == true) {
                                parametersString.put(filterName, (Object)filterValue);
                            }
                        }
                        // Sovrascittura con il parametri che del client
                        {
                            if(oRequest != null) {
                                if(oRequest instanceof HttpServletRequest) {
                                    // dalla request
                                    HttpServletRequest request = (HttpServletRequest)oRequest;
                                    String filterValue = request.getParameter(filterName);
                                    if (filterValue != null && !filterValue.isEmpty() || addIfNull == true) {
                                        parametersString.put(filterName, (Object)filterValue);
                                    }
                                } else if(oRequest instanceof JSONObject) {
                                    // da oggetto json
                                    JSONObject requestJson = (JSONObject)oRequest;
                                    int curFilter = requestJson.has("curFilter") ? requestJson.getInt("curFilter") : 0;
                                    JSONArray filtersJson = requestJson.getJSONArray("filtersJson");
                                    for (int iFv = 0; iFv < filtersJson.length(); iFv++) {
                                        JSONObject filterJson = filtersJson.getJSONObject(iFv);
                                        if(filterJson.has("name")) {
                                            String name = filterJson.getString("name");
                                            if (name.equalsIgnoreCase(filterName)) {
                                                if (filterJson.has("value")) {
                                                    String value = String.valueOf(filtersJson.getJSONObject(iFv).get("value"));
                                                    if (value != null && !value.isEmpty() || addIfNull == true) {
                                                        parametersString.put(filterName, value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return parametersString;
    }


    static String get_column_db_alias(ArrayList<Object> columns_alias_array, String table, String column) {
        for(int i=0; i<columns_alias_array.size(); i++) {
            String [] data = (String [])columns_alias_array.get(i);
            if(table.equalsIgnoreCase(data[0])) {
                if(column.equalsIgnoreCase(data[1])) {
                    return data[3];
                }
            }
        }
        return null;
    }
}
