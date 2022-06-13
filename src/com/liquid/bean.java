/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

package com.liquid;

import com.google.gson.*;
import javassist.ClassPool;
import javassist.CtClass;
import javassist.NotFoundException;
import org.apache.commons.lang.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;
import java.beans.IntrospectionException;
import java.lang.reflect.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

import static com.liquid.db.get_query_info;
import static com.liquid.db.get_recordset;
import static com.liquid.utility.resetAllChanged;
import static com.liquid.utility.searchProperty;


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
//        nella risposta JSON il caratere "->\" è a carico del server, e di conseguenza "\->\\"

public class bean {

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
    static public Object get_bean(HttpServletRequest request, String ids, long maxRows) throws Exception {
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
    static public Object get_bean(HttpServletRequest request, String ids, String format, long maxRows) throws Exception {
        return get_bean(request, ids, format, null, null, maxRows);
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
     * data in csv format bean, for data in a bean or ArrayList of Class of
     * beans
     * @param fields the field list, as comma separated string, of the output,
     * null or empty for primary key only
     * @param maxRows the maximun number of rows to retrieve (long)
     *
     * @return comma separated values string, null if no selection defined
     * @see db
     */
    static public Object get_bean(Object request, String ids, String format, String fields, long maxRows) throws Exception {
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
    static public Object get_bean(Object requestParam, String ids, String format, String fields, String foreignTables, long maxRows) throws Exception {
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

    static public Object get_bean(Object requestParam, String controlId, String ids, String format, String fields, String foreignTables, long maxRows) throws Exception {
        HttpServletRequest request = (HttpServletRequest) requestParam;
        Object result = null;
        String errors = "";
        String executingQuery = null;
        Connection conn = null;
        String connError = null;
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

                            if(transaction.isTransaction(request)) {
                                conn = transaction.getTransaction(request);
                            } else {
                                Object[] connResult = connection.getConnection(null, request, tbl_wrk.tableJson);
                                conn = (Connection) connResult[0];
                                connError = (String) connResult[1];
                            }

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
                                            targetColumnIndex,
                                            null,
                                            true,
                                            request
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
                                            if(rowsJson.length() > 0) {
                                                Object[] beanResult = create_beans_multilevel_class(tbl_wrk, rowsJson, foreignTablesJson, foreignTables, level, maxRows, request);
                                                if (beanResult != null) {
                                                    resultBean = (int) beanResult[0];
                                                    if (resultBean > 0) {
                                                        result = (ArrayList<Object>) beanResult[1];
                                                    }
                                                    errors += (String) beanResult[3];
                                                }
                                            } else {
                                                resultBean = 0;
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
                                System.err.println("// get_bean() no connection ... error is : "+connError);
                            }

                        } catch (Throwable th) {
                            errors += "Error:" + th.getLocalizedMessage();
                            System.err.println("// get_bean() [" + controlId + "] Error:" + th.getLocalizedMessage());
                            throw new Exception(th);

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
                                if(transaction.isTransaction(request)) {
                                } else {
                                    if (conn != null) {
                                        if (!conn.getAutoCommit()) {
                                            conn.commit();
                                        }
                                    }
                                }
                            } catch (SQLException ex) {
                                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
                            }
                            // closing the connections (with callbacks)
                            if(transaction.isTransaction(request)) {
                            } else {
                                connection.closeConnection(conn);
                            }
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
    static public Object[] create_beans_multilevel_class(workspace tbl_wrk, JSONArray rowsJson, JSONArray foreignTablesJson, String filteringForeignTables, int level, long maxRows, HttpServletRequest request) {
        ArrayList<String> runtimeForeignTables = new ArrayList<String>();
        return create_beans_multilevel_class_internal( tbl_wrk, rowsJson, foreignTablesJson, filteringForeignTables, level, maxRows, runtimeForeignTables, request );
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
            ArrayList<String> runtimeForeignTables,
            HttpServletRequest request
    ) {

        Object[] beanResult = new Object[]{0, null, 0, null, null};
        PojoGenerator pojoGenerator = null;
        String sPojoMode = level == 0 ? "" : "nested";
        String errors = "";
        int res = 1;

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

            String className = "" + tbl_wrk.controlId.replace(".", "_") + "";

            JSONArray cols = null;
            String table = null;
            String parentControlId = null;
            boolean bReadOnly = false;
            String primaryKey = null;

            if(tbl_wrk.tableJson.has("readOnly")) {
                Object oReadOnly = tbl_wrk.tableJson.get("readOnly");
                String sReadOnly = String.valueOf(oReadOnly);
                if("true".equalsIgnoreCase(sReadOnly) || "yes".equalsIgnoreCase(sReadOnly)) {
                    bReadOnly = true;
                    sPojoMode += " ReadOnly";
                }
            }
            if(tbl_wrk.tableJson.has("columns")) {
                cols = tbl_wrk.tableJson.getJSONArray("columns");
            }
            if(tbl_wrk.tableJson.has("table")) {
                table = tbl_wrk.tableJson.getString("table");
            }
            if(tbl_wrk.tableJson.has("primaryKey")) {
                primaryKey = tbl_wrk.tableJson.getString("primaryKey");
            }
            if(tbl_wrk.tableJson.has("parent")) {
                parentControlId = tbl_wrk.tableJson.getString("parent");
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
                    JSONObject col = cols.getJSONObject(ic);
                    if(col.has("type")) {
                        Object oType = col.get("type");
                        props.put(colName, metadata.getJavaClass(oType));
                    } else {
                        int lb = 1;
                    }
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

            // proprietà chiave primaria
            props.put("$primaryKey", String.class);

            // DatabaseSchemaTable/ControlId
            props.put("$databaseSchemaTable", String.class);
            props.put("$controlId", String.class);


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
                                        if( "*".equalsIgnoreCase(filteringForeignTables)
                                                || (filteringForeignTablesList != null && filteringForeignTablesList.contains(ft))
                                                || (tbl_wrk.tableJson.has("loadALL") && tbl_wrk.tableJson.getBoolean("loadALL"))
                                        ) {

                                            try {


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

                                        // System.out.println(" *** DEBUG: ftPropName:"+ftPropName);

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
                                        if(ftRowsJson == null || (ftRowsJson != null && ftRowsJson.length() >= 0)) {
                                            // TODO: verificare il bean vuoto
                                            Object[] ftBeanResult = create_beans_multilevel_class_internal(ft_tbl_wrk, ftRowsJson, foreignTableForeignTablesJson, foreignTableForeignTables, level + 1, maxRows, runtimeForeignTables, request);
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
                                                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, "// " + err);
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
            }


            className = className.replaceAll("@", "0");

            // .replaceAll("-", "_")
            // className = className.replace("$", "_");

            // Aggiunta del postfisso
            String postfix = "";
            if("*".equalsIgnoreCase(filteringForeignTables)) {
                postfix = "_ALL";
            } else if(filteringForeignTables != null && !filteringForeignTables.isEmpty()) {
                postfix = "_"+workspace.getHash(filteringForeignTables);;
            }
            className += postfix;


            try {
                clazz = Class.forName(className);
            } catch (Throwable e) {
            }

            // rebuld every time the class if we are in project mode
            if (workspace.projectMode) {
                if (clazz != null) {
                    className += "__rev$" + workspace.classMakeIndex++;
                    clazz = null;
                }
            }

            //
            // Create the pojo if missing
            //
            if (clazz == null) {

                if("MyAuctionDetails".equalsIgnoreCase(className)) {
                     // ftPropNameList = ["BID_DETAILS$AUCTION_DETAIL_ID$ID"]
                     Logger.getLogger(db.class.getName()).log(Level.INFO, "// className: " + className + "...");
                     if(ftPropNameList.size() > 0) {
                         Logger.getLogger(db.class.getName()).log(Level.INFO, "// no. foreign tables: " + ftPropNameList.size() + "...");
                     }
                 }

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

                if (rowsJson != null && rowsJson.length() > 0) {
                    for (int ir = 0; ir < rowsJson.length(); ir++) {
                        Object obj = clazz.newInstance();
                        JSONObject row = rowsJson.getJSONObject(ir);

                        // Valorizza le proprietà corrispondenti ai campi
                        // @return Object [] { bResult, primaryKey, error, primaryKeyValue }
                        Object[] resSet = set_bean_by_json_row_data(obj, tbl_wrk, row, request);
                        if (resSet != null) {
                            if (!(boolean) resSet[0]) {
                                errors += "[Error setting row " + (ir + 1) + "/" + (rowsJson.length()) + ":" + ((String) resSet[2]) + "]";
                                res = -1;
                            }

                            //
                            // set this table@rowId as processed
                            //
                            String primaryKeyValue = String.valueOf( resSet[3] );
                            utility.set(obj, "$tableKey", (String)(table+"@"+primaryKey) );
                            utility.set(obj, "$primaryKey", (String)(primaryKey) );

                            utility.set(obj, "$databaseSchemaTable", (String)(tbl_wrk.databaseSchemaTable) );
                            utility.set(obj, "$controlId", (String)(tbl_wrk.controlId) );

                        } else {
                            errors += "[Null result setting row " + (ir + 1) + "/" + (rowsJson.length()) + "]";
                            res = -1;
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
                    utility.set(obj, "$primaryKey", (String) primaryKey);
                    utility.set(obj, "$databaseSchemaTable", (String)(tbl_wrk.databaseSchemaTable) );
                    utility.set(obj, "$controlId", (String)(tbl_wrk.controlId) );

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
                                Object[] parentBeanResult = create_beans_multilevel_class(parent_tbl_wrk, parentRowsJson, null, null, -1, maxRows, request);
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
                res = -1;
            }

            //
            // set the result
            //
            beanResult[0] = res;
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
    ) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException, NotFoundException, ParseException {

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
    ) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException, NotFoundException, ParseException {

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
     * @return Object [] { bResult, primaryKey, error, primaryKeyValue }
     */
    static public Object[] set_bean_by_json_row_data(Object obj, workspace tbl_wrk, JSONObject row, HttpServletRequest request) {
        boolean bResult = false;
        String primaryKeyField = null;
        Object primaryKeyValue = null;
        String primaryKey = null;
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
                                primaryKey = row.getString(tbl_wrk.tableJson.getString("primaryKey"));
                            } catch (Exception e) {
                                try {
                                    primaryKeyField = row.getString(tbl_wrk.tableJson.getString("primaryKeyField"));
                                } catch (Exception e2) {
                                }
                            }
                        }

                        for (int ic = 0; ic < cols.length(); ic++) {
                            String colName = cols.getJSONObject(ic).has("runtimeName") ? cols.getJSONObject(ic).getString("runtimeName") : cols.getJSONObject(ic).getString("name");
                            boolean autoIncString = cols.getJSONObject(ic).has("autoIncString") ? cols.getJSONObject(ic).getBoolean("autoIncString") : false;
                            String field = null, name = null;
                            String defaultValue = null;
                            Object value = null;

                            try {
                                name = cols.getJSONObject(ic).getString("name");
                                field = cols.getJSONObject(ic).getString("field");
                            } catch (Exception e) { /* value = String.valueOf(ic+1); */ }

                            if(primaryKey == null) {
                                if(field != null && field.equalsIgnoreCase(primaryKeyField)) {
                                    primaryKey = name;
                                }
                            }
                            if(primaryKeyField == null) {
                                if(name != null && name.equalsIgnoreCase(primaryKey)) {
                                    primaryKeyField = field;
                                }
                            }


                            boolean hasValue = false;
                            try {
                                if(row.has(colName) && row.isNull(colName)) {
                                    value = null;
                                    hasValue = true;
                                } else {
                                    value = row.get(colName);
                                    hasValue = true;
                                }
                            } catch (Exception e) {
                                try {
                                    value = row.get(field);
                                    hasValue = true;
                                } catch (Exception e2) {
                                    // take from modifications
                                    try {
                                        if(row.has("fields")) {
                                            JSONArray rowFields = row.getJSONArray("fields");
                                            for (int iF=0; iF<rowFields.length(); iF++) {
                                                JSONObject rowField = rowFields.getJSONObject(iF);
                                                if(rowField.has(("field"))) {
                                                    if(field.equalsIgnoreCase( rowField.getString("field") )) {
                                                        value = rowField.getString("value");
                                                        hasValue = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    } catch (Exception e3) {
                                    }
                                }
                            }

                            /*
                            N.B.: La risoluzione del campo defaul è delegata al DB, non al bean
                            if(!hasValue) {
                                try {
                                    defaultValue = cols.getJSONObject(ic).getString("default");
                                    if(defaultValue != null) {
                                        defaultValue = solveVariableField(defaultValue, request, false);
                                        if(defaultValue != null) {
                                            value = defaultValue;
                                            hasValue = true;
                                        }
                                    }
                                } catch (Exception e) { }
                            }
                            */

                            if(hasValue) {
                                String[] colParts = colName.split("\\.");
                                if (colParts.length > 1) {
                                    if (table.equalsIgnoreCase(colParts[0])) {
                                        colName = colParts[1];
                                    } else {
                                        colName = colName.replaceAll("\\.", "\\$");
                                    }
                                }
                                if (!autoIncString) {
                                } else {
                                    try {
                                        if (Long.parseLong(String.valueOf(value)) > 0) {
                                        }
                                    } catch (Exception e) {
                                        // Formula su auto incrementante ...
                                        value = null;
                                    }
                                }
                                try {
                                    utility.set(obj, colName, value);
                                } catch (Throwable th) {
                                    error = "[ ERROR setting " + colName + " : " + th.getLocalizedMessage() + "]";
                                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, "ERROR : set_bean_by_json_resultset() : propery " + colName + " not found", th);
                                    bResult = false;
                                }

                                if(field != null && field.equalsIgnoreCase(primaryKeyField)) {
                                    primaryKeyValue = value;
                                }
                            }
                        }
                        // Set all changed marker to false
                        resetAllChanged(obj);
                    }
                } catch (Exception ex) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
                    error = ex.getLocalizedMessage();
                }
            }
        }
        return new Object[] { bResult, primaryKey, error, primaryKeyValue };
    }

    /**
     * Create new bean from the string databaseSchemaTable (using any available control)
     *
     * @param requestParam
     * @param databaseSchemaTable
     * @return
     * @throws Throwable
     */
    public static Object new_bean(Object requestParam, String databaseSchemaTable) throws Throwable {
        return new_bean(requestParam, databaseSchemaTable, "*");
    }

    /**
     * Create new bean from the string databaseSchemaTable
     *
     * @param requestParam
     * @param databaseSchemaTable
     * @param controlId             define the control user to create the bean (* = any bean)
     * @return
     * @throws Throwable
     */
    public static Object new_bean(Object requestParam, String databaseSchemaTable, String controlId) throws Throwable {
        HttpServletRequest request = (HttpServletRequest) requestParam;
        Object bean = null;
        if (request != null) {
            workspace tbl_wrk = null;
            if("*".equalsIgnoreCase(controlId)) {
                // any bean
                tbl_wrk = load_beans_get_workspace(request, databaseSchemaTable, null);
            } else if(controlId == null) {
                // default (full) bean
                tbl_wrk = load_beans_get_workspace(request, databaseSchemaTable, databaseSchemaTable.replace(".", "_"));
            } else if(controlId != null) {
                // defined bean
                tbl_wrk = load_beans_get_workspace(request, databaseSchemaTable, controlId);
            }

            if (tbl_wrk != null) {
                Object[] result = create_beans_multilevel_class_internal( tbl_wrk, (JSONArray)null, (JSONArray)null, null,
                        1, 1,
                        null,
                        request
                );
                if(result != null) {
                    int iResult = (int) result[0];
                    ArrayList<Object> beansContent = (ArrayList<Object>) result[1];
                    if(beansContent != null && beansContent.size() > 0) {
                        bean = beansContent.get(0);
                    }
                }
            } else {
                throw new Exception("Cannot create bean : control not found by database/schema/table:"+databaseSchemaTable);
            }
        }
        return bean;
    }


    /**
     * Creane new empty bean for control
     *
     * @param requestParam
     * @param tblWrk    the control workspace
     * @param rowData   the initial data
     * @return
     */

    public static Object new_bean(Object requestParam, workspace tblWrk, JSONObject rowData) throws Exception {
        if(tblWrk != null) {
            HttpServletRequest request = (HttpServletRequest)requestParam;
            JSONArray rowsData = new JSONArray();
            if(rowData.has("params")) {
                JSONObject rowDataMod = event.getJSONObject(rowData.toString(), "formX");
                if(rowDataMod != null) {
                    // Da modification a rowData .. a carico della ricevente
                    rowsData.put(rowDataMod);
                } else {
                    rowDataMod = event.getJSONObject(rowData.toString(), "modifications");
                    if(rowDataMod != null) {
                        // Da modification a rowData .. a carico della ricevente
                        if(rowDataMod.has("fields")) {
                            rowsData.put(rowDataMod);
                        }
                    }
                }
            } else {
                rowsData.put(rowData);
            }
            JSONArray foreignTablesJson = null;
            String filteringForeignTables = "*";
            ArrayList<String> runtimeForeignTables = null;
            Object[] result = create_beans_multilevel_class_internal( tblWrk, (JSONArray)rowsData, (JSONArray)foreignTablesJson, filteringForeignTables,
                    -1, 0,
                    runtimeForeignTables,
                    request
            );
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
     *
     * @param requestParam
     * @param tblWrk
     * @param rowData
     * @return
     * @throws Exception
     */
    public static Object new_bean(Object requestParam, workspace tblWrk, Object rowData) throws Exception {
        if(rowData instanceof String) {
            return new_bean(requestParam, tblWrk, new JSONObject((String)rowData));
        } else if(rowData instanceof JSONObject) {
            return new_bean(requestParam, tblWrk, (JSONObject)rowData);
        } else {
            return null;
        }
    }

    /**
     * Create new bean by templateClass, filling it by sourceJson
     * Supported object :       String, Date, Timestamp ... JSONArray
     * Unsupported object :     JSONObject
     *
     * @param templateClass
     * @param sourceJson        source data, in jsonformat,  could be null
     * @param excludingProps    props to exclude (ArrayList<String>), could be null
     * @param mappingProps      ArrayList<JSON2BeanMapper> of properties (json prop, bean prop, class, format exception ... )
     * @return
     * @throws Exception
     */
    public static Object new_bean(Class templateClass, JSONObject sourceJson, ArrayList<String> excludingProps, ArrayList<JSON2BeanMapper> mappingProps) throws Exception {

        if(excludingProps == null)
            excludingProps = new ArrayList<String>();

        Object inst = templateClass.newInstance();

        if(sourceJson != null) {
            JSONArray names = ((JSONObject)sourceJson).names();
            for(int io=0; io<names.length(); io++) {
                String name = names.getString(io);
                if (!utility.contains(excludingProps, name)) {
                    Object prop = ((JSONObject) sourceJson).get(name);
                    String beanProp = name;
                    JSON2BeanMapper json2BeanMapper = null;

                    if("budgetIntervento".equalsIgnoreCase(name)) {
                        beanProp = beanProp;
                    }

                    if(mappingProps != null) {
                        try {
                            json2BeanMapper = JSON2BeanMapper.findMapper(mappingProps, name);
                            beanProp = json2BeanMapper != null ? json2BeanMapper.beanProp : name;
                        } catch (Exception e){
                            beanProp = null;
                        }
                    }


                    if(beanProp != null && !beanProp.isEmpty()) {
                        // to bean ..

                        boolean bThrowExceptIfMissing = true;
                        String exceptMessage = null;

                        // wrap prop:
                        if(json2BeanMapper != null) {
                            if(json2BeanMapper.exception != null && !json2BeanMapper.exception.isEmpty()) {
                                bThrowExceptIfMissing = true;
                                exceptMessage = json2BeanMapper.exception;
                            } else {
                                bThrowExceptIfMissing = false;
                            }
                            if(json2BeanMapper.cls != null) {
                                if(json2BeanMapper.cls.getName().equalsIgnoreCase("java.util.Date")) {
                                    if(json2BeanMapper.format != null) {
                                        SimpleDateFormat dateTimeFormat = new SimpleDateFormat(json2BeanMapper.format);
                                        if(prop instanceof String) {
                                            prop = (Object) dateTimeFormat.parse((String) prop);
                                        }
                                    }
                                } else if(json2BeanMapper.cls.getName().equalsIgnoreCase("java.sql.Timestamp")) {
                                    if(json2BeanMapper.format != null) {
                                        SimpleDateFormat dateTimeFormat = new SimpleDateFormat(json2BeanMapper.format);
                                        if(prop instanceof String) {
                                            prop = (Object) new Timestamp(dateTimeFormat.parse((String) prop).getTime());
                                        }
                                    }
                                } else if(json2BeanMapper.cls.getName().equalsIgnoreCase("java.sql.Date")) {
                                    if(json2BeanMapper.format != null) {
                                        SimpleDateFormat dateTimeFormat = new SimpleDateFormat(json2BeanMapper.format);
                                        if(prop instanceof String) {
                                            prop = (Object) new java.sql.Date(dateTimeFormat.parse((String) prop).getTime());
                                        }
                                    }
                                } else if(json2BeanMapper.cls.getName().equalsIgnoreCase("java.lang.Double")) {
                                    if(prop instanceof String) {
                                        Double dProp = Double.parseDouble((String) ((String) prop).replace(",", "."));
                                        if (dProp != null) {
                                            prop = new Double((Double) dProp);
                                        }
                                    } else if(prop instanceof Integer) {
                                        prop = new Double((Integer) prop);
                                    } else if(prop instanceof Long) {
                                        prop = new Double((Long) prop);
                                    } else if(prop instanceof BigDecimal) {
                                        prop = new Double(((BigDecimal) prop).doubleValue());
                                    } else if(prop instanceof Float) {
                                        prop = new Double((Float) prop);
                                    } else if(prop instanceof Double) {
                                        prop = new Double((Double) prop);
                                    }
                                } else if(json2BeanMapper.cls.getName().equalsIgnoreCase("java.lang.Float")) {
                                    if(prop instanceof String) {
                                        Float dProp = Float.parseFloat((String)((String) prop).replace(",", "."));
                                        if(dProp != null) {
                                            prop = new Float((Float) dProp);
                                        }
                                    } else if(prop instanceof Integer) {
                                        prop = new Float((Integer) prop);
                                    } else if(prop instanceof Long) {
                                        prop = new Float((Long) prop);
                                    } else if(prop instanceof BigDecimal) {
                                        prop = new Float(((BigDecimal) prop).floatValue());
                                    } else if(prop instanceof Float) {
                                        prop = new Float((Float) prop);
                                    } else if(prop instanceof Double) {
                                        prop = new Float((Double) prop);
                                    }
                                } else if(json2BeanMapper.cls.getName().equalsIgnoreCase("java.math.BigDecimal")) {
                                    prop = new BigDecimal(String.valueOf(prop));
                                } else if(json2BeanMapper.cls.getName().equalsIgnoreCase("java.lang.Integer")) {
                                    prop = new Integer(String.valueOf(prop));
                                } else if(json2BeanMapper.cls.getName().equalsIgnoreCase("java.math.Long")) {
                                    prop = new Long(String.valueOf(prop));
                                }
                            }
                        }

                        if (prop instanceof JSONObject) {
                            // TODO : ricerca della classe dell'oggetto json ... oppure uso ObjectMapper objectMapper libreria jackson
                            // throw new Exception("LIQUID: new_bean() error: object type not supported : " + prop.getClass().getName());
                            //

                        } else if (prop instanceof JSONArray) {
                            // TODO : TEST
                            JSONArray propsJson = (JSONArray) prop;
                            ArrayList<Object> values = new ArrayList<Object>();
                            for (int i = 0; i < propsJson.length(); i++) {
                                values.add(propsJson.get(i));
                            }
                            setBeanProp(templateClass, inst, beanProp, values, true, exceptMessage);

                        } else if (prop instanceof String
                                || prop instanceof Date
                                || prop instanceof Timestamp
                                || prop instanceof Boolean
                                || prop instanceof Integer
                                || prop instanceof Long
                                || prop instanceof Float
                                || prop instanceof Double
                                || prop instanceof BigDecimal) {

                            setBeanProp(templateClass, inst, beanProp, prop, bThrowExceptIfMissing, exceptMessage);
                        } else {
                            throw new Exception("LIQUID: new_bean() error: object type not supported : " + prop.getClass().getName());
                        }
                    }
                }
            }
        }
        return inst;
    }

    /**
     * set property in class inst
     *
     * @param templateClass
     * @param inst
     * @param name
     * @param prop
     * @param bThrowExpectIfMissing
     * @param exceptMessage
     * @return
     * @throws Exception
     */
    static private Object setBeanProp(Class templateClass, Object inst, String name, Object prop, boolean bThrowExpectIfMissing, String exceptMessage) throws Exception {
        String setter = nameSpacer.getSetter(name);
        try {
            Method method = null;
            try {
                // Original class
                method = templateClass.getDeclaredMethod(setter, prop.getClass());
            } catch (Throwable th1) {
                // Long/Integer/BigDecimal+/Float/Double .. no made by the caller by json2BeanMapper
                if(prop instanceof Integer) {
                } else if(prop instanceof Float) {
                } else if(prop instanceof Double) {
                } else if(prop instanceof String) {
                    // String to Double/Float or to Date/Timestamp ? .. no made by the caller by json2BeanMapper
                } else if(prop instanceof java.sql.Date) {
                } else if(prop instanceof Timestamp) {
                } else if(prop instanceof Date) {
                } else {
                    throw th1;
                }
            }
            if (method != null) {
                return method.invoke(inst, prop);
            } else {
                if(bThrowExpectIfMissing) {
                    throw new Exception((exceptMessage != null ? exceptMessage : "LIQUID: new_bean() error: method not found : " + setter));
                }
            }
        } catch (Throwable th) {
            if(bThrowExpectIfMissing) {
                throw new Exception((exceptMessage != null ? exceptMessage : "LIQUID: new_bean() error: method not found : " + setter));
            }
        }
        return null;
    }


    /**
     * Load single bean for given workspace and primaryKey
     *
     * @param tbl_wrk
     * @param primaryKey
     * @return
     * @throws Throwable
     */
    public static Object load_bean(workspace tbl_wrk, Object primaryKey) throws Throwable {
        ArrayList<Object> beans = load_beans((HttpServletRequest)null, tbl_wrk.controlId, null, null, null, primaryKey, 1, null);
        if (beans != null) {
            if (beans.size() > 0) {
                return beans.get(0);
            }
        }
        return null;
    }


    /**
     * Load single bean for given database.schema.table and primaryKey
     *
     * @param databaseSchemaTable
     * @param primaryKey
     * @return
     * @throws Throwable
     */
    public static Object load_bean(String databaseSchemaTable, Object primaryKey) throws Throwable {
        ArrayList<Object> beans = load_beans((HttpServletRequest)null,null, databaseSchemaTable, null, null, primaryKey, 1, null);
        if (beans != null) {
            if (beans.size() > 0) {
                return beans.get(0);
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
     * @throws Exception
     * @throws Throwable
     */
    static public Object load_bean(HttpServletRequest request, String databaseSchemaTable, String columns, Object primaryKey) throws Exception, Throwable {
        ArrayList<Object> beans = load_beans(request, null, databaseSchemaTable, columns, null, primaryKey, 1, null);
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
    static public Object load_bean(HttpServletRequest request, String databaseSchemaTable, String columns, String filteringColumn, Object filteringValue) throws Throwable {
        ArrayList<Object> beans = load_beans(request, null, databaseSchemaTable, columns, filteringColumn+"="+filteringValue, 1, null);
        if(beans != null) {
            if(beans.size() > 0) {
                return (Object)beans.get(0);
            }
        }
        return null;
    }

    static public Object load_bean(String databaseSchemaTable, String controlId, String columns, String filteringColumn, Object filteringValue) throws Throwable {
        ArrayList<Object> beans = load_beans(null, controlId, databaseSchemaTable, columns, filteringColumn+"="+filteringValue, 1, null);
        if(beans != null) {
            if(beans.size() > 0) {
                return (Object)beans.get(0);
            }
        }
        return null;
    }


    /**
     * Loan bean from SQL
     *
     * @param request
     * @param sql
     * @param params
     * @return
     * @throws Exception
     * @throws Throwable
     */
    static public Object load_bean(HttpServletRequest request, String sql, ArrayList<Object> params) throws Exception, Throwable {
        ArrayList<Object> beans = load_beans((HttpServletRequest)null, sql, params,1);
        if (beans != null) {
            if (beans.size() > 0) {
                return beans.get(0);
            }
        }
        return null;
    }


    /**
     * Loan beans from SQL
     *
     * @param request
     * @param sql
     * @param params
     * @param maxRows
     * @return
     * @throws Exception
     * @throws Throwable
     */
    static public ArrayList<Object> load_beans(HttpServletRequest request, String sql, ArrayList<Object> params, long maxRows) throws Exception, Throwable {
        ArrayList<Object> beans = null;
        String controlId = null;
        String errors = "", connError = null;
        workspace tbl_wrk = null;
        Connection conn = null;
        JSONArray cols = new JSONArray();

        if(sql != null) {

            try {

                controlId = get_query_hash(sql);
                tbl_wrk = workspace.get_tbl_manager_workspace(controlId);
                if (tbl_wrk == null) {
                    tbl_wrk = new workspace();
                    tbl_wrk.tableJson = new JSONObject();
                    tbl_wrk.tableJson.put("columns", cols);
                    tbl_wrk.controlId = controlId;
                    workspace.glTblWorkspaces.add(tbl_wrk);
                } else {
                    cols = tbl_wrk.tableJson.getJSONArray("columns");
                }

                if(transaction.isTransaction(request)) {
                    conn = transaction.getTransaction(request);
                } else {
                    Object[] connResult = connection.getConnection(null, request, tbl_wrk.tableJson);
                    conn = (Connection) connResult[0];
                    connError = (String) connResult[1];
                }


                long lStartTime = System.currentTimeMillis();
                PreparedStatement psdo = null;
                ResultSet rsdo = null;
                try {
                    // TODO: Migliramento sicurezza nel caso di stringa malformata
                    // N.B.: Gestione degli apici a carico della chiamante (SQL Ignection)
                    if (conn != null) {
                        psdo = conn.prepareStatement(sql);
                        if(params != null) {
                            for (int iParam = 0; iParam < params.size(); iParam++) {
                                db.set_statement_param( psdo, iParam+1, params.get(iParam) );
                            }
                        }
                        rsdo = psdo.executeQuery();
                    } else {
                        String error = " [" + (controlId) + "] Connection Error:" + connError + "]";
                        errors += error;
                        System.err.println(error);
                    }
                } catch (Exception e) {
                    errors += " [" + (controlId) + "] Query Error:" + e.getLocalizedMessage() + " executingQuery:" + sql + "]" + "[Driver:" + tbl_wrk.driverClass + "]";
                    System.err.println(sql);
                    System.err.println("// Error:" + e.getLocalizedMessage());
                    throw e;
                }

                long lQueryTime = System.currentTimeMillis();

                if (rsdo != null) {
                    String fieldValue = null;
                    String column_alias_list = null;

                    if(cols.length() == 0) {
                        ResultSetMetaData rsmd = rsdo.getMetaData();
                        if (rsmd != null) {
                            for (int ic = 1; ic < rsmd.getColumnCount() + 1; ic++) {
                                JSONObject col = new JSONObject();
                                String name = rsmd.getColumnLabel(ic);
                                // column_alias_list += (ic > 0 ? "," : "") + name;
                                col.put("name", name);
                                col.put("type", rsmd.getColumnType(ic));
                                col.put("size", rsmd.getColumnDisplaySize(ic));
                                col.put("precision", rsmd.getPrecision(ic));
                                col.put("scale", rsmd.getScale(ic));
                                cols.put(col);
                            }
                        }
                        tbl_wrk.tableJson.put("table", rsmd.getTableName(1));
                        tbl_wrk.tableJson.put("schema", rsmd.getSchemaName(1));
                        tbl_wrk.tableJson.put("database", rsmd.getCatalogName(1));
                        tbl_wrk.databaseSchemaTable = workspace.getDatabaseSchemaTable(rsmd.getCatalogName(1), rsmd.getSchemaName(1), rsmd.getTableName(1));
                    } else {
                        column_alias_list = null;
                    }

                    String[] columns_alias = null; // column_alias_list.split(",");
                    String[] columns_json = null;
                    boolean bColumnsResolved = false;

                    int[] colTypes = null; // new int[cols.length()];
                    int[] colPrecs = null; // new int[cols.length()];
                    int[] colDigits = null; // new int[cols.length()];
                    boolean[] colNullable = null; // new boolean[cols.length()];
                    String primaryKeyColumn = null;
                    int cRow = 0, startRow = 0, endRow = 0;
                    boolean skipMissingColumn = false;


                    // TODO : parametri da valorizzare e debug
                    Object[] recordset = get_recordset(tbl_wrk,
                            sql,
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
                            -1,
                            null,
                            skipMissingColumn,
                            request
                    );

                    // Freee connection as soon as possible
                    if (rsdo != null) {
                        rsdo.close();
                    }
                    if (psdo != null) {
                        psdo.close();
                    }
                    if(transaction.isTransaction(request)) {
                    } else {
                        if (conn != null) {
                            if (!conn.getAutoCommit()) {
                                conn.commit();
                            }
                        }
                    }


                    // closing the connections (with callbacks)
                    if(transaction.isTransaction(request)) {
                    } else {
                        connection.closeConnection(conn);
                    }
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
                        if(tbl_wrk.tableJson.has("foreignTables")) {
                            foreignTablesJson = tbl_wrk.tableJson.getJSONArray("foreignTables");
                        }

                        //  Ritorna [ int risultato, Object [] beans, int level, String error, String className };
                        if(rowsJson.length() > 0) {
                            Object[] beanResult = create_beans_multilevel_class(tbl_wrk, rowsJson, foreignTablesJson, "*", level, maxRows, request);
                            if ((int) beanResult[0] >= 0) {
                                //
                                // Updating the foreignTables (some info may be added)
                                //
                                try {
                                    tbl_wrk.tableJson.put("foreignTables", foreignTablesJson);
                                } catch (Exception e) {
                                }
                                return (ArrayList<Object>) beanResult[1];
                            } else {
                                throw new Exception("Create bean error:" + beanResult[3]);
                            }
                        } else {
                            return null;
                        }
                    }
                }

            } catch (Throwable e) {
                errors += "Error:" + e.getLocalizedMessage();
                System.err.println("// get_beans() [" + controlId + "] Error:" + e.getLocalizedMessage());
                if(transaction.isTransaction(request)) {
                    throw e;
                } else {
                    throw e;
                }

            } finally {
                // closing the connections (with callbacks)
                if(transaction.isTransaction(request)) {
                } else {
                    connection.closeConnection(conn);
                }
            }
        }
        return null;
    }


    private static String get_query_hash(String sql) {
        int hash = 7;
        for (int i = 0; i < sql.length(); i++) {
            hash = hash*31 + sql.charAt(i);
        }
        return "SQL#"+hash;
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
     * @throws Exception
     * @throws Throwable
     */
    static public ArrayList<Object> load_beans(HttpServletRequest request, String databaseSchemaTable, String columns, String keyColumn, Object key, long maxRows) throws Exception, Throwable {
        return load_beans(request, null, databaseSchemaTable, columns, keyColumn, key, maxRows, null);
    }

    static public workspace load_beans_get_workspace(HttpServletRequest request, String databaseSchemaTable, String controlId) throws Exception, Throwable {
        String database = null, table = null, schema = null, primaryKey = null;
        workspace tbl_wrk = null;
        if (controlId == null) {
            String runtimeControlId = workspace.getControlIdFromDatabaseSchemaTable(databaseSchemaTable);
            tbl_wrk = workspace.get_tbl_manager_workspace(runtimeControlId);
            if (tbl_wrk == null) {
                runtimeControlId = workspace.getControlIdFromTable(databaseSchemaTable);
                tbl_wrk = workspace.get_tbl_manager_workspace(runtimeControlId);
                if (tbl_wrk == null) {
                    tbl_wrk = workspace.get_tbl_manager_workspace_from_db(databaseSchemaTable, controlId);
                }
            }
        } else {
            if(databaseSchemaTable == null) {
                tbl_wrk = workspace.get_tbl_manager_workspace(controlId);
            } else {
                tbl_wrk = workspace.get_tbl_manager_workspace_from_db(databaseSchemaTable, controlId);
            }
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
                    tbl_wrk.tableJson.put("loadedIndirectly", "true");
                } else {
                    return null;
                }
            }
        }
        return tbl_wrk;
    }

    /**
     *
     * @param request
     * @param databaseSchemaTable
     * @return
     * @throws Exception
     * @throws Throwable
     */
    static public workspace load_beans_get_workspace(HttpServletRequest request, String databaseSchemaTable) throws Exception, Throwable {
        return load_beans_get_workspace(request, databaseSchemaTable, databaseSchemaTable.replace(".", "_"));
    }




    public static ArrayList<Object> load_beans(String databaseSchemaTable, String controlId, String columns, String where_condition, long maxRows, String order_by) throws Throwable {
        return load_beans(null, controlId, databaseSchemaTable, columns, null, where_condition, maxRows, order_by);
    }


    static public ArrayList<Object> load_beans(HttpServletRequest request, String controlId, String databaseSchemaTable, String columns, String keyColumn, Object keyOrWhereCondition, long maxRows) throws Exception, Throwable {
        return load_beans(request, controlId, databaseSchemaTable, columns, keyColumn, keyOrWhereCondition, maxRows, null);
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
     * @param keyColumn                 (needed value if keyOrWhereCondition is ArrayList StringBuffer CharSequence ..
     *                                  (if keyOrWhereCondition is type String "keyColumn" is omitted as "keyOrWhereCondition" is condidered as full where condition)
     * @param keyOrWhereCondition       (value or where condition ... need 'WHERE' keyword to set where condition, otherwise means value of the primaty key)
     *                                  (String = full where condition if keyColumn is null)
     *                                  (StringBufffer or CharSequence = primary key value : neee keyColumn)
     *                                  (* for all rows)
     *                                  (null throw expetion)
     * @param maxRows
     *
     * @return  { Object bean, int nBeans, int nBeansLoaded, String errors, String warning }
     *
     * @throws Exception
     * @throws Throwable
     *
     *  TODO : partial columns read still unsupported... read always all columns
     */
    static public ArrayList<Object> load_beans(
            HttpServletRequest request,
            String controlId, String databaseSchemaTable,
            String columns,
            String keyColumn, Object keyOrWhereCondition,
            long maxRows,
            String orderBy
    ) throws Exception, Throwable {
        String sWhere = "";

        //
        // cerca (databaseSchemaTable)  o cerca (controlId) il controllo
        //
        workspace tbl_wrk = load_beans_get_workspace(request, databaseSchemaTable, controlId);
        if (tbl_wrk == null) {
            throw new Exception("load_beans() : ControlId not found");
        }


        if (keyOrWhereCondition instanceof String) {
            if("*".equalsIgnoreCase((String)keyOrWhereCondition)) {
                sWhere = " WHERE 1=1";
            } else {
                if (((String)keyOrWhereCondition).trim().toUpperCase().startsWith("WHERE ")) {
                    sWhere = " " + keyOrWhereCondition + "";
                } else {
                    // N.B.: Need key column ...
                    if (keyColumn == null || keyColumn.isEmpty()) {
                        if (tbl_wrk.tableJson.has("primaryKey")) {
                            keyColumn = tbl_wrk.tableJson.getString("primaryKey");
                        }
                    }
                    if(keyColumn != null) {
                        keyColumn = ((String) keyColumn).trim();
                        if (keyColumn.toUpperCase().startsWith("WHERE ")) {
                            keyColumn = ((String) keyColumn).substring(6);
                        }
                        sWhere = " WHERE " + keyColumn + "='" + keyOrWhereCondition + "'";
                    } else {
                        sWhere = " " + keyOrWhereCondition + "";
                    }
                }
            }
        } else if (keyOrWhereCondition instanceof StringBuffer) {
            // N.B.: Need key column ...
            if (keyColumn == null || keyColumn.isEmpty()) {
                if (tbl_wrk.tableJson.has("primaryKey")) {
                    keyColumn = tbl_wrk.tableJson.getString("primaryKey");
                }
            }
            sWhere = " WHERE " + keyColumn + "=" + ((StringBuffer)keyOrWhereCondition).toString() + "";

        } else if (keyOrWhereCondition instanceof CharSequence) {
            // N.B.: Need key column ...
            if (keyColumn == null || keyColumn.isEmpty()) {
                if (tbl_wrk.tableJson.has("primaryKey")) {
                    keyColumn = tbl_wrk.tableJson.getString("primaryKey");
                }
            }
            sWhere = " WHERE " + keyColumn + "=" + ((CharSequence)keyOrWhereCondition).toString() + "";

        } else if (keyOrWhereCondition instanceof Long || keyOrWhereCondition instanceof Integer || keyOrWhereCondition instanceof Float || keyOrWhereCondition instanceof Double) {
            // N.B.: Need key column ...
            if (keyColumn == null || keyColumn.isEmpty()) {
                if (tbl_wrk.tableJson.has("primaryKey")) {
                    keyColumn = tbl_wrk.tableJson.getString("primaryKey");
                }
            }
            if(keyColumn != null) {
                sWhere = " WHERE " + keyColumn + "=" + String.valueOf(keyOrWhereCondition) + "";
            } else {
                throw new Exception("Invalid primary column in control:"+tbl_wrk.controlId);
            }

        } else if (keyOrWhereCondition instanceof JSONArray) {
            // TODO : TEST ... (just coded)
            JSONArray whereConditions = (JSONArray)keyOrWhereCondition;
            sWhere = " WHERE";
            for(int iw=0; iw<whereConditions.length(); iw++) {
                Object whereCondition = whereConditions.get(iw);
                String logic = "AND";
                String column = null;
                String columnFilter = null;
                String columnOp = "=";
                if(whereCondition instanceof JSONObject) {
                    if(((JSONObject) whereCondition).has("logic"))
                        logic = ((JSONObject) whereCondition).getString("logic");
                    if(((JSONObject) whereCondition).has("col"))
                        column = ((JSONObject) whereCondition).getString("col");
                    if(((JSONObject) whereCondition).has("column"))
                        column = ((JSONObject) whereCondition).getString("column");
                    if(((JSONObject) whereCondition).has("field"))
                        column = ((JSONObject) whereCondition).getString("field");
                    if(((JSONObject) whereCondition).has("filter"))
                        columnFilter = ((JSONObject) whereCondition).getString("filter");
                    if(((JSONObject) whereCondition).has("value"))
                        columnFilter = ((JSONObject) whereCondition).getString("value");
                    if(((JSONObject) whereCondition).has("op"))
                        columnOp = ((JSONObject) whereCondition).getString("op");
                    if(((JSONObject) whereCondition).has("operator"))
                        columnOp = ((JSONObject) whereCondition).getString("operator");
                } else if(whereCondition instanceof Object) {
                } else if(whereCondition instanceof String) {
                }
                if(iw > 0) {
                    sWhere += " " + logic;
                }
                sWhere = " " + column + columnOp + "'" + columnFilter + "'";
            }

        } else if (keyOrWhereCondition instanceof ArrayList<?>) {
            if (keyOrWhereCondition != null && ((ArrayList<?>) keyOrWhereCondition).size() > 0) {
                // N.B.: Need key column ...
                if (keyColumn == null || keyColumn.isEmpty()) {
                    if (tbl_wrk.tableJson.has("primaryKey")) {
                        keyColumn = tbl_wrk.tableJson.getString("primaryKey");
                    }
                }
                String keyList = workspace.arrayToString(((ArrayList<String>) keyOrWhereCondition).toArray(), null, null, ",");
                sWhere = " WHERE " + keyColumn + " IN (" + keyList + ")";
            }

        } else {
            String err = "ERROR : load_beans() : undetect keyOrWhereCondition type in control : " + controlId;
            System.err.println("// " + err);
            throw new Exception(err);
        }

        return load_beans_internal(request, controlId, databaseSchemaTable, columns, (String)sWhere, null, maxRows, orderBy);
    }



    /**
     * Create all beans for given where condition
     * N.B. select automatically the control with high number of columns if database.schema.table match the argument "databaseSchemaTable"
     *
     * @param databaseSchemaTable
     * @param columns
     * @param where_condition
     * @param maxRows
     * @return
     */
    static public ArrayList<Object> load_beans(String databaseSchemaTable, String columns, String where_condition, long maxRows) throws Throwable {
        return load_beans((HttpServletRequest) null, null, databaseSchemaTable, columns, where_condition, maxRows, null);
    }

    static public ArrayList<Object> load_beans(String databaseSchemaTable, String columns, String where_condition, long maxRows, String orderBy) throws Throwable {
        return load_beans((HttpServletRequest) null, null, databaseSchemaTable, columns, where_condition, maxRows, orderBy);
    }

    /**
     *
     * Create all beans for given where condition
     * N.B. select automatically the control by matching controlId ... or with high number of columns if database.schema.table match the argument "databaseSchemaTable"
     *
     * @param databaseSchemaTable
     * @param controlId
     * @param columns
     * @param where_condition
     * @param maxRows
     * @return
     */
    static public ArrayList<Object> load_beans(String databaseSchemaTable, String controlId, String columns, String where_condition, long maxRows) throws Throwable {
        return load_beans((HttpServletRequest) null, controlId, databaseSchemaTable, columns, where_condition, maxRows, null);
    }

    /**
     *
     * @param databaseSchemaTable
     * @param columns
     * @param where_condition
     * @return
     */
    static public ArrayList<Object> load_beans(String databaseSchemaTable, String columns, String where_condition) throws Throwable {
        return load_beans((HttpServletRequest) null, (String) null, databaseSchemaTable, columns, where_condition, -1, null);
    }

    /**
     *
     * @param databaseSchemaTable
     * @param controlId
     * @param columns
     * @param where_condition
     * @return
     */
    static public ArrayList<Object> load_beans(String databaseSchemaTable, String controlId, String columns, String where_condition) throws Throwable {
        return load_beans((HttpServletRequest) null, controlId, databaseSchemaTable, columns, where_condition, -1, null);
    }


    static public Object load_bean(String databaseSchemaTable, String columns, String where_condition) throws Throwable {
        ArrayList<Object> beans = load_beans((HttpServletRequest) null, (String) databaseSchemaTable, columns, where_condition, 1);
        if (beans != null) {
            if (beans.size() > 0) {
                return beans.get(0);
            }
        }
        return null;
    }
    static public Object load_bean(String databaseSchemaTable, String controlId, String columns, String where_condition) throws Throwable {
        ArrayList<Object> beans = load_beans((HttpServletRequest) null, controlId, databaseSchemaTable, columns, where_condition, 1, null);
        if (beans != null) {
            if (beans.size() > 0) {
                return beans.get(0);
            }
        }
        return null;
    }


    static public ArrayList<Object> load_beans(HttpServletRequest request, String databaseSchemaTable, String columns, String where_condition, long maxRows) throws Throwable {
        return load_beans(request, null, databaseSchemaTable, columns, where_condition, maxRows, null);
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
    static public ArrayList<Object> load_beans(HttpServletRequest request, String controlId, String databaseSchemaTable, String columns, String where_condition, long maxRows, String orderBy) throws Throwable {
        return load_beans(request, controlId, databaseSchemaTable, columns, null, where_condition, maxRows, orderBy);
    }
    static public ArrayList<Object> load_beans(HttpServletRequest request, String controlId, String databaseSchemaTable, String columns, String where_condition, long maxRows) throws Throwable {
        return load_beans(request, controlId, databaseSchemaTable, columns, null, where_condition, maxRows, null);
    }

    static public ArrayList<Object> load_beans_internal(
            HttpServletRequest request,
            String controlId, String databaseSchemaTable,
            String columns,
            String where_condition, ArrayList<String> where_condition_params, long maxRows,
            String orderBy
    ) throws Throwable {
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
        String order_by_condition = null;

        Connection conn = null;
        String connError = null;
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
            if ("*".equalsIgnoreCase(columns) || "all".equalsIgnoreCase(columns) || columns == null) {
            } else {
                // TODO : not supported, should review get_recordset ()
                // columnsList = columns.split(",");
                String [] rawColumnsList = columns.split(",");
                ArrayList<String> trimmedColumnsList = new ArrayList<String>(3);
                for(int ic=0; ic<rawColumnsList.length; ic++) {
                    trimmedColumnsList.add(rawColumnsList[ic].trim());
                }
                columnsList = trimmedColumnsList.toArray(new String[0]);
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

            if (orderBy != null && !orderBy.isEmpty()) {
                orderBy = orderBy.trim();
                if (orderBy.toUpperCase().indexOf("ORDERBY ") >= 0) {
                    order_by_condition = " ORDER BY " + orderBy.substring(8);
                } else if (orderBy.toUpperCase().indexOf("ORDER BY ") >= 0) {
                    order_by_condition = " ORDER BY " + orderBy.substring(9);
                } else {
                    order_by_condition = " ORDER BY " + orderBy;
                }
            }


            //
            // TODO : costruire i left join sui campi table.field
            //
            boolean skipMissingColumn = true;

            String executingQuery = "SELECT "
                    + (columnsList != null ? utility.arrayToString(columnsList, null, null, ",") : "*")
                    + " FROM " + tbl_wrk.schemaTable
                    + (where_condition != null ? where_condition : "")
                    + (order_by_condition != null ? order_by_condition : "")
                    ;

            if(transaction.isTransaction(request)) {
                conn = transaction.getTransaction(request);
            } else {
                Object[] connResult = connection.getConnection(null, request, tbl_wrk.tableJson);
                conn = (Connection) connResult[0];
                connError = (String) connResult[1];
            }

            long lStartTime = System.currentTimeMillis();
            try {
                // TODO: Migliramento sicurezza nel caso di stringa malformata
                // N.B.: Gestione degli apici a carico della chiamante (SQL Ignection)
                if (conn != null) {
                    psdo = conn.prepareStatement(executingQuery);
                    if(where_condition_params != null) {
                        for (int iParam = 0; iParam < where_condition_params.size(); iParam++) {
                            db.set_statement_param( psdo, iParam+1, where_condition_params.get(iParam) );
                        }
                    }
                    rsdo = psdo.executeQuery();
                } else {
                    String error = " [" + (controlId) + "] Connection Error:" + connError + "]";
                    errors += error;
                    System.err.println(error);
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
                        -1,
                        null,
                        skipMissingColumn,
                        request
                );

                // Freee connection as soon as possible
                if (rsdo != null) {
                    rsdo.close();
                }
                if (psdo != null) {
                    psdo.close();
                }
                if(transaction.isTransaction(request)) {
                } else {
                    if (conn != null) {
                        if (!conn.getAutoCommit()) {
                            conn.commit();
                        }
                    }
                }

                // closing the connections (with callbacks)
                if(transaction.isTransaction(request)) {
                } else {
                    connection.closeConnection(conn);
                }
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
                    if(tbl_wrk.tableJson.has("foreignTables")) {
                        Object oforeignTables = tbl_wrk.tableJson.get("foreignTables");
                        if(oforeignTables instanceof JSONArray) {
                            foreignTablesJson = (JSONArray)oforeignTables;
                        } else {
                            // throw new Exception("Create bean error:"+"ForeignTables in unexpected format");
                            // Non risolte : non rischiesto esplicitamente
                        }
                    }

                    //  Ritorna [ int risultato, Object [] beans, int level, String error, String className };
                    if(rowsJson.length() > 0) {
                        Object[] beanResult = create_beans_multilevel_class(tbl_wrk, rowsJson, foreignTablesJson, "*", level, maxRows, request);
                        if ((int) beanResult[0] >= 0) {
                            // Updating the foreignTables (some info may be added)
                            if (beanResult[3] != null && !((String) beanResult[3]).isEmpty()) {
                                throw new Exception("Create bean error:" + beanResult[3]);
                            } else {
                                try {
                                    tbl_wrk.tableJson.put("foreignTables", foreignTablesJson);
                                } catch (Exception e) {
                                    System.err.println("// get_beans() [" + controlId + "] Error:" + e.getLocalizedMessage());
                                }
                                return (ArrayList<Object>) beanResult[1];
                            }
                        } else {
                            throw new Exception("Create bean error:" + beanResult[3]);
                        }
                    } else {
                        // Recordset vuoto -> zero bean
                    }
                }
            }

        } catch (Throwable e) {
            errors += "Error:" + e.getLocalizedMessage();
            System.err.println("// get_beans() [" + controlId + "] Error:" + e.getLocalizedMessage());
            if(transaction.isTransaction(request)) {
                throw e;
            } else {
                throw e;
            }

        } finally {
            // closing the connections (with callbacks)
            if(transaction.isTransaction(request)) {
            } else {
                connection.closeConnection(conn);
            }
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
    static public Object[] load_child_bean(Object bean, String beanName, long maxRows, HttpServletRequest request) throws Exception {
        return load_bean(bean, beanName, null, maxRows, request);
    }
    static public Object[] load_child_bean(Object bean, String beanName, long maxRows,long maxLevel, HttpServletRequest request) throws Exception {
        return load_bean( bean, beanName, maxRows, maxLevel, request );
    }
    static public Object[] load_bean(Object bean, String beanName, long maxRows, HttpServletRequest request) throws Exception {
        return load_bean(bean, beanName, null, maxRows, request);
    }

    /**
     * Load parent bean of 'bean'
     *
     * @param bean
     * @return
     */
    static public Object load_parent_bean(Object bean, Object params, HttpServletRequest request) throws Exception {
        return load_parent_bean(bean, params, 1, request);
    }
    /**
     * Load parent bean of 'bean'
     *
     * @param bean
     * @param params the selection
     * @param maxRows max row to load (not used)
     * @return
     */
    static public Object load_parent_bean(Object bean, Object params, long maxRows, HttpServletRequest request) throws Exception {
        Object[] beans_result = load_bean(bean, "$Parent", params, maxRows, request);
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
    static public Object[] load_bean(Object bean, String childBeanName, Object params, long maxRows, long maxLevel, HttpServletRequest request) {
        if(bean != null) {
            ArrayList<String> runtimeForeignTables = new ArrayList<String>();
            // adding initial table@rowId to the anti dead-loop
            runtimeForeignTables.add( String.valueOf( utility.getEx(bean, "$tableKey") ) );
            return load_bean_internal( bean, childBeanName, params, maxRows, maxLevel, 1L, runtimeForeignTables, request);
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
    static public Object[] load_bean(Object bean, String childBeanName, Object params, long maxRows, HttpServletRequest request) throws Exception {
        if(bean != null) {
            if(bean instanceof HttpServletRequest) {
                throw new Exception("wrong load_bean() call ... you pass an http request as bean");
            }
            ArrayList<String> runtimeForeignTables = new ArrayList<String>();
            int maxLevel = 0;
            // adding initial table@rowId to the anti dead-loop
            Object tableKey = utility.get(bean, "$tableKey");
            if(tableKey != null) runtimeForeignTables.add( String.valueOf( tableKey ) );
            return load_bean_internal( bean, childBeanName, params, maxRows, maxLevel, 1L, runtimeForeignTables, request);
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
    static private Object[] load_bean_internal(Object bean, String childBeanName, Object params, long maxRows, long maxLevel, long curLevel, ArrayList<String> runtimeForeignTables, HttpServletRequest request) {
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
                                            String sRecordset = db.get_table_recordset(controlId, sRequest, false, maxRows, null);


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

                                                            // @return Object [] { bResult, primaryKey, error, primaryKeyValue }
                                                            Object[] resSet = set_bean_by_json_row_data(obj, tbl_wrk, row, request);
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
                                                                    Object [] resLoad = load_bean_internal(childBean, "*", null/*params*/, maxRows, maxLevel, curLevel+1, runtimeForeignTables, request);
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

    public static void removeProps(Object oBeans, String prop) throws Exception {
        ArrayList<Object> beans = null;
        if(oBeans instanceof ArrayList<?>) {
            beans = (ArrayList<Object>)oBeans;
        } else if(oBeans instanceof Object) {
            beans = new ArrayList<Object>();
            beans.add(oBeans);
        } else {
            throw new Exception("removeProps() : unsupported");
        }
        for (Object bean:beans) {
            doRemoveProps(bean, prop);
        }
    }
    private static void doRemoveProps(Object bean, String prop) throws Exception {
        if(bean != null) {
            Field [] fields = bean.getClass().getDeclaredFields();
            for (Field field:fields) {
                String name = field.getName();
                if (prop.startsWith("*")) {
                    if(name.endsWith(prop.substring(1))) {
                        field.setAccessible(false);
                    }
                } else if (prop.endsWith("*")) {
                    if(name.startsWith(prop.substring(0, prop.length()-1))) {
                        field.setAccessible(false);
                    }
                } else {
                    if(name.equalsIgnoreCase(prop)) {
                        field.setAccessible(false);
                    }
                }
            }
        }
    }


    public static void removeProps(Object oBeans, char c) throws Exception {
        ArrayList<Object> beans = null;
        if(oBeans instanceof ArrayList<?>) {
            beans = (ArrayList<Object>)oBeans;
        } else if(oBeans instanceof Object) {
            beans = new ArrayList<Object>();
            beans.add(oBeans);
        } else {
            throw new Exception("removeProps() : unsupported");
        }
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
                Object obj = utility.getEx(bean, propName);
                boolean bAdd = true;
                if (cond != null) {
                    try {
                        bAdd = ((beansCondition) cond).is_valid(bean);
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



    private static class myDateSerializer implements JsonSerializer<Date> {
        @Override
        public JsonElement serialize(Date date, Type type, JsonSerializationContext jsonSerializationContext) {
            return new JsonPrimitive( new SimpleDateFormat(workspace.getDateTimeFormatString(), workspace.locale).format(date) );
        }
    }

    static public String bean_to_json(Object beans) {
        GsonBuilder builder = new GsonBuilder();
        builder.excludeFieldsWithModifiers(Modifier.VOLATILE);
        GSonExclusionStrategy strategy = new GSonExclusionStrategy();
        builder.addSerializationExclusionStrategy(strategy);
        builder.addDeserializationExclusionStrategy(strategy);
        builder.setExclusionStrategies(strategy);

        builder.registerTypeAdapter(Date.class, new myDateSerializer());
        builder.registerTypeAdapter(Timestamp.class, new myDateSerializer());

        /*
        workspace.getDateTimeFormatString();
        if(workspace.getTimestampFormat() != null) {
            if("long".equalsIgnoreCase(workspace.getTimestampFormat())) {
                // builder.setDateFormat("EEE, dd MMM yyyy HH"+workspace.timeSep+"mm");
                builder.setDateFormat("dddd dd MMMM yyyy, HH"+workspace.timeSep+"mm");

            } else {
                builder.setDateFormat(workspace.getTimestampFormat());
            }
        } else {
            builder.setDateFormat("dd"+workspace.dateSep+"MM"+workspace.dateSep+"yyyy HH"+workspace.timeSep+"mm"+workspace.timeSep+"ss");
        }
        */

        return builder.create().toJson(beans);
    }
}



