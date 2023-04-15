/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

package com.liquid;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.sql.*;
import java.util.Arrays;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class metadata {

    /**
     * ********************************
     * <p>
     * CA : 30-ott-2019
     * <p>
     * Gestione cache dei metadati Lettura della colonna COLUMN_DEF a tipo dato
     * LONG molto lenta : Da rimuovere l'utilizzo della ColumnDef dal framework
     * <p>
     * **********************************
     */
    static boolean IsMetadataCacheEnabled = true;

    static long TIME_MSEC_LIMIT_FOR_WARNING = 1000;


    static class MetaDataCol {

        String name, datatype, typeName, remarks, columnDef, sourceCatalog, sourceSchema, sourceTable, sourceDataType, sourceIsGenerated;
        int size, digits;
        boolean isNullable;
        boolean autoIncString;

        MetaDataCol(String _name, String _datatype, String _typeName, String _remarks, String _size, String _isNullable, String _columnDef, String _digits, String _autoIncString, String _sourceCatalog, String _sourceSchema, String _sourceTable, String _sourceDataType, String _sourceIsGenerated) {
            name = _name;
            datatype = _datatype;
            typeName = _typeName;
            remarks = _remarks;
            try {
                size = Integer.parseInt(_size);
            } catch (Throwable th) {
            }
            isNullable = "yes" .equalsIgnoreCase(_isNullable) || "1" .equalsIgnoreCase(_isNullable) || "y" .equalsIgnoreCase(_isNullable) || "s" .equalsIgnoreCase(_isNullable);
            columnDef = _columnDef;
            try {
                digits = Integer.parseInt(_digits);
            } catch (Throwable th) {
            }
            autoIncString = "yes" .equalsIgnoreCase(_autoIncString) || "1" .equalsIgnoreCase(_autoIncString) || "y" .equalsIgnoreCase(_autoIncString) || "s" .equalsIgnoreCase(_autoIncString);

            sourceCatalog = _sourceCatalog;
            sourceSchema = _sourceSchema;
            sourceTable = _sourceTable;
            sourceDataType = sourceDataType;
            sourceIsGenerated = sourceIsGenerated;
        }
    }

    static class MetaDataTable {

        String table, schema, database;
        ArrayList<MetaDataCol> metaDataCols;

        MetaDataTable(String _table, String _schema, String _database, ArrayList<MetaDataCol> _metaDataCols) {
            table = _table != null ? _table : "";
            schema = _schema != null ? _schema : "";
            database = _database != null ? _database : "";
            metaDataCols = _metaDataCols;
        }
    }

    static String metaDataTableSchema = null;
    public static ArrayList<MetaDataTable> metaDataTable = new ArrayList<MetaDataTable>();
    public static boolean metaDataCacheReadEnabled = true;


    public static boolean invalidateMetadata() {
        if (metaDataTable != null) {
            if (metaDataTable.size() > 0) {
                metaDataTable.clear();
                ;
                return true;
            }
        }
        return false;
    }


    /**
     * <h3>Delete metadata cache</h3>
     * <p>
     * This method clean cache of database metadata, useful when database structure change
     *
     * @param database the database (String)
     * @param schema   the schema (String)
     * @param table    the table (String)
     * @param database the database (String)
     * @return void
     * void
     * @see metadata
     */
    public static void resetTableMetadata(String database, String schema, String table) {
        for (int i = 0; i < metaDataTable.size(); i++) {
            MetaDataTable mdTable = metaDataTable.get(i);
            if ((mdTable.database != null && mdTable.database.equalsIgnoreCase(database)) || database == null || database.isEmpty()) {
                if((mdTable.schema != null && mdTable.schema.equalsIgnoreCase(schema)) || schema == null || schema.isEmpty()) {
                    if ((mdTable.table != null && mdTable.table.equalsIgnoreCase(table)) || table == null || table.isEmpty()) {
                        mdTable.metaDataCols = null;
                        mdTable.table = null;
                        mdTable.schema = null;
                        mdTable.database = null;
                    }
                }
            }
        }
    }


    public static Object readTableMetadata(Connection conn, String database, String schema, String table, String columnName) throws Throwable {
        return readTableMetadata(conn, database, schema, table, columnName, true, true);
    }

    public static Object readTableMetadata(Connection conn, String database, String schema, String table, String columnName, boolean _bReadDefault, boolean _bReadComments) throws Throwable {
        Connection connToDB = null, connToUse = conn;
        int recCount = 0;
        int nTable = 0;

        try {

            if (table != null && !table.isEmpty()) {
                if (columnName != null) {
                    Object mdCol = getTableMetadata(conn, database, schema, table, columnName, false);
                    if (mdCol != null) {
                        return mdCol;
                    }
                }

                String driver = db.getDriver(conn);
                boolean bReadDefault = _bReadDefault;
                boolean bReadComments = _bReadComments;
                if ("oracle" .equalsIgnoreCase(driver)) {
                    return readTableMetadataBySQL(conn, database, schema, table, columnName, "oracle", _bReadDefault, bReadComments);
                }


                if (database == null || database.isEmpty()) {
                    database = conn.getCatalog();
                } else {
                    conn.setCatalog(database);
                    String db = conn.getCatalog();
                    if (!db.equalsIgnoreCase(database)) {
                        // set catalog not supported : connect to different DB
                        Object[] connResult = connection.getDBConnection(database);
                        conn = (Connection) connResult[0];
                        String connError = (String) connResult[1];
                        connToUse = connToDB = conn;
                    }
                }


                long msTrace = System.currentTimeMillis();
                DatabaseMetaData databaseMetaData = connToUse.getMetaData();
                ResultSet rs = databaseMetaData.getColumns(database, schema, table, null);
                ArrayList<MetaDataCol> metaDataCols = new ArrayList<MetaDataCol>();

                while (rs.next()) {
                    String column = rs.getString("COLUMN_NAME");
                    String datatype = rs.getString("DATA_TYPE");
                    String typeName = rs.getString("TYPE_NAME");
                    String columnsize = rs.getString("COLUMN_SIZE");
                    String decimaldigits = rs.getString("DECIMAL_DIGITS");
                    String isNullable = rs.getString("IS_NULLABLE");
                    String columnRemarks = rs.getString("REMARKS");
                    String autoIncString = rs.getString("IS_AUTOINCREMENT");
                    String columnDefault = null;

                    // N.B.. ORACLE SHIT : lettura del campo default problematica
                    try {
                        columnDefault = bReadDefault ? rs.getString("COLUMN_DEF") : null;
                    } catch (Throwable th) {
                        try {
                            Object columnDefaultObj = bReadDefault ? rs.getObject("COLUMN_DEF") : null;
                            if (columnDefaultObj != null) {
                                columnDefault = columnDefaultObj.toString();
                            }
                        } catch (Throwable th2) {
                            System.err.println("readTableMetadata() error : " + th2.getMessage() + " reading deafult on column:" + table + "." + column);
                        }
                    }

                    String sourceCatalog = rs.getString("SCOPE_CATALOG");
                    String sourceSchema = rs.getString("SCOPE_SCHEMA");
                    String sourceTable = rs.getString("SCOPE_TABLE");
                    String sourceDataType = rs.getString("SOURCE_DATA_TYPE");
                    String sourceIsGenerated = rs.getString("IS_GENERATEDCOLUMN");

                    /*
                    PROCEDURE_CAT String => procedure catalog (may be null)
                    PROCEDURE_SCHEM String => procedure schema (may be null)
                    PROCEDURE_NAME String => procedure name
                    COLUMN_NAME String => column/parameter name
                    COLUMN_TYPE Short => kind of column/parameter:
                    procedureColumnUnknown - nobody knows
                    procedureColumnIn - IN parameter
                    procedureColumnInOut - INOUT parameter
                    procedureColumnOut - OUT parameter
                    procedureColumnReturn - procedure return value
                    procedureColumnResult - result column in ResultSet
                    DATA_TYPE int => SQL type from java.sql.Types
                    TYPE_NAME String => SQL type name, for a UDT type the type name is fully qualified
                    PRECISION int => precision
                    LENGTH int => length in bytes of data
                    SCALE short => scale - null is returned for data types where SCALE is not applicable.
                    RADIX short => radix
                    NULLABLE short => can it contain NULL.
                    procedureNoNulls - does not allow NULL values
                    procedureNullable - allows NULL values
                    procedureNullableUnknown - nullability unknown
                    REMARKS String => comment describing parameter/column
                    COLUMN_DEF String => default value for the column, which should be interpreted as a string when the value is enclosed in single quotes (may be null)
                    The string NULL (not enclosed in quotes) - if NULL was specified as the default value
                    TRUNCATE (not enclosed in quotes) - if the specified default value cannot be represented without truncation
                    NULL - if a default value was not specified
                    SQL_DATA_TYPE int => reserved for future use
                    SQL_DATETIME_SUB int => reserved for future use
                    CHAR_OCTET_LENGTH int => the maximum length of binary and character based columns. For any other datatype the returned value is a NULL
                    ORDINAL_POSITION int => the ordinal position, starting from 1, for the input and output parameters for a procedure. A value of 0 is returned if this row describes the procedure's return value. For result set columns, it is the ordinal position of the column in the result set starting from 1. If there are multiple result sets, the column ordinal positions are implementation defined.
                    IS_NULLABLE String => ISO rules are used to determine the nullability for a column.
                    YES --- if the column can include NULLs
                    NO --- if the column cannot include NULLs
                    empty string --- if the nullability for the column is unknown
                    SPECIFIC_NAME
                    */
                    // Colonne :
                    // OWNER,TABLE_NAME,
                    // COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'DATA_DEFAULT',DATA_PRECISION
                    // MetaDataCol(String _name, String _datatype, String _remarks, String _size, String _isNullable, String _columnDef, String _digits) {
                    
                    /*
                    SCOPE_CATALOG String => catalog of table that is the scope of a reference attribute (null if DATA_TYPE isn't REF)
                    SCOPE_SCHEMA String => schema of table that is the scope of a reference attribute (null if the DATA_TYPE isn't REF)
                    SCOPE_TABLE String => table name that this the scope of a reference attribute (null if the DATA_TYPE isn't REF)
                    SOURCE_DATA_TYPE short => source type of a distinct type or user-generated Ref type, SQL type from java.sql.Types (null if DATA_TYPE isn't DISTINCT or user-generated REF)
                    IS_AUTOINCREMENT String => Indicates whether this column is auto incremented
                    YES --- if the column is auto incremented
                    NO --- if the column is not auto incremented
                    empty string --- if it cannot be determined whether the column is auto incremented
                    IS_GENERATEDCOLUMN String => Indicates whether this is a generated column
                    YES --- if this a generated column
                    NO --- if this not a generated column
                    empty string --- if it cannot be determined whether this is a generated column
                    The COLUMN_SIZE column specifies the column size for the given column. For numeric dat
                    */


                    MetaDataCol metaDataCol = new MetaDataCol(column, datatype, typeName, columnRemarks, columnsize, isNullable, columnDefault, decimaldigits, autoIncString, sourceCatalog, sourceSchema, sourceTable, sourceDataType, sourceIsGenerated);
                    metaDataCols.add(metaDataCol);
                    recCount++;
                }
                rs.close();


                if (_bReadDefault) {
                    if ("oracle" .equalsIgnoreCase(driver)) {
                        String stmtSQL = "SELECT COLUMN_NAME, DATA_DEFAULT from DBA_TAB_COLUMNS where DATA_DEFAULT is not null and TABLE_NAME = '" + table + "'";
                        Statement stmt = conn.createStatement();
                        stmt.setFetchSize(8 * 1024);
                        rs = stmt.executeQuery(stmtSQL);
                        while (rs.next()) {
                            String col = rs.getString(1);
                            String def = rs.getString(2);
                            for (int i = 0; i < metaDataCols.size(); i++) {
                                MetaDataCol metaDataCol = metaDataCols.get(i);
                                if (metaDataCol.name.equalsIgnoreCase(col)) {
                                    metaDataCol.columnDef = def;
                                }
                            }
                        }
                        rs.close();
                    }
                }

                metaDataTable.add(new MetaDataTable(table, schema, database, metaDataCols));
                System.out.println("Read meatadata on table: " + schema + "." + table + " recCount:" + recCount + " Tempo lettura :" + (System.currentTimeMillis() - msTrace));

                if (columnName != null) {
                    Object foundMcol = getTableMetadata(conn, null, schema, table, columnName, true);
                    if (foundMcol == null) {
                        System.err.println("readTableMetadata() error: on table:" + schema + "." + table + " Column just added '"+columnName+"' not found!");
                        // Add dummy data to avoid adding loop
                        MetaDataCol metaDataCol = new MetaDataCol(columnName, "", "", "", "", "", "", "", "", "", "", "", "", "");
                        metaDataCols.add(metaDataCol);
                        metaDataTable.add(new MetaDataTable(table, schema, database, metaDataCols));
                    }
                    return foundMcol;
                }
            }

        } catch (Exception e) {
            System.err.println("readTableMetadata() error : " + e.getMessage());
        } finally {
            if (connToDB != null)
                try {
                    connToDB.close();
                } catch (SQLException ex) {
                    Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
                }
        }
        return null;
    }




    /**
     * Legge in soluzione unica tutte le tabelle dello schema(owner).tabella
     *
     * @param conn
     * @param schema
     * @param table
     * @param columnName
     * @param dialet
     * @param bReadDefault
     * @return
     */
    public static Object readTableMetadataBySQL(Connection conn, String database, String schema, String table, String columnName, String dialet, boolean bReadDefault, boolean bReadComments) {
        MetaDataTable metaDataTableResult = null;

        try {

            if (!IsMetadataCacheEnabled) {
                return null;
            }

            if (columnName != null && !"*".equalsIgnoreCase(columnName)) {
                // colonna specifica
                Object mdCol = getTableMetadata(conn, database, schema, table, columnName, false);
                if (mdCol != null) {
                    return mdCol;
                }
            }

            if (metaDataCacheReadEnabled) {
                long msTrace = System.currentTimeMillis();

                if (metaDataTableSchema == null) {
                    metaDataTableSchema = null; // conn.getMetaData().getSchemaTerm();
                }

                if (schema == null || schema.isEmpty()) {
                    schema = metaDataTableSchema;
                }


                Object result;
                if (columnName != null && !"*".equalsIgnoreCase(columnName)) {
                    // colonna specifica
                    result = getTableMetadata(conn, database, schema, table, columnName, false);
                    if(result != null)
                        return result;
                } else {
                    // tutte le colonne return metadataTable
                    result = getTableMetadata(conn, database, schema, table, null, false);
                    if(result != null)
                        return result;
                }


                // System.err.println(" getFetchSize:"+stmt.getFetchSize());
                // System.err.println(" getMaxFieldSize:"+stmt.getMaxFieldSize());
                // System.err.println(" getMaxRows"+stmt.getMaxRows());
                // ResultSet rs = stmt.executeQuery("select COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,DATA_DEFAULT,DATA_PRECISION from ALL_TAB_COLUMNS where TABLE_NAME='"+tableName+"' and OWNER='"+tableSchema+"'");
                /* Non si riesce a fare il cast su DATA_DEFAULT, e la UNION fallisce perchè i due recordset hanno tipo dato diverso */


                String[] queryList = null;
                String oracle_read_column_sql, oracle_read_synonym_column_sql;

                if(bReadComments) {
                    // tabelle e viste
                    oracle_read_column_sql =
                            "SELECT A.OWNER,A.TABLE_NAME,A.COLUMN_NAME,A.DATA_TYPE,A.DATA_LENGTH,A.NULLABLE,'',A.DATA_PRECISION,B.COMMENTS AS REMARKS FROM ALL_TAB_COLUMNS A"
                                    + " LEFT JOIN ALL_COL_COMMENTS B ON B.OWNER=A.OWNER AND B.TABLE_NAME=A.TABLE_NAME AND B.COLUMN_NAME=A.COLUMN_NAME"
                                    + " WHERE A.OWNER = '" + schema + "' AND A.TABLE_NAME='" + table + "'"
                                    + " ORDER BY 2,3";

                    // sinonimi
                    oracle_read_synonym_column_sql =
                            "SELECT A.OWNER,A.TABLE_NAME,A.COLUMN_NAME,A.DATA_TYPE,A.DATA_LENGTH,A.NULLABLE,B.COMMENTS,A.DATA_PRECISION,B.COMMENTS AS REMARKS FROM ALL_TAB_COLUMNS A"
                                    + " LEFT JOIN ALL_COL_COMMENTS B ON B.OWNER=A.OWNER AND B.TABLE_NAME=A.TABLE_NAME AND B.COLUMN_NAME=A.COLUMN_NAME"
                                    + " WHERE A.OWNER = '" + schema + "' AND A.TABLE_NAME in "
                                    + "("
                                    + "SELECT C.TABLE_NAME FROM all_synonyms C WHERE C.TABLE_OWNER = '" + schema + "' AND A.TABLE_NAME='" + table + "'"
                                    + ") ORDER BY 2,3";
                } else {
                    // tabelle e viste
                    oracle_read_column_sql =
                            "SELECT A.OWNER,A.TABLE_NAME,A.COLUMN_NAME,A.DATA_TYPE,A.DATA_LENGTH,A.NULLABLE,'',A.DATA_PRECISION,'' AS REMARKS FROM ALL_TAB_COLUMNS A"
                                    + " WHERE A.OWNER = '" + schema + "' AND A.TABLE_NAME='" + table + "'"
                                    + " ORDER BY 2,3";

                    // sinonimi
                    oracle_read_synonym_column_sql =
                            "SELECT A.OWNER,A.TABLE_NAME,A.COLUMN_NAME,A.DATA_TYPE,A.DATA_LENGTH,A.NULLABLE,'',A.DATA_PRECISION,'' AS REMARKS FROM ALL_TAB_COLUMNS A"
                                    + " WHERE A.OWNER = '" + schema + "' AND A.TABLE_NAME in "
                                    + "("
                                    + "SELECT C.TABLE_NAME FROM all_synonyms C WHERE C.TABLE_OWNER = '" + schema + "' AND A.TABLE_NAME='" + table + "'"
                                    + ") ORDER BY 2,3";
                }

                String[] oracleQueryList = { oracle_read_column_sql, oracle_read_synonym_column_sql };


                //
                // TODO : lettura information_schema
                // Per ora non serve postgres NON è una merda nella gestione dei metadati
                //
                String[] postgresQueryList = {
                        // tabelle
                        "SELECT OWNER,TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'',DATA_PRECISION,REMARKS FROM information_schema.columns WHERE OWNER = '" + schema + "' AND TABLE_NAME in "
                                + "("
                                + "SELECT TABLE_NAME FROM information_schema.tables WHERE OWNER = '" + schema + "' AND TABLE_NAME='" + table + "'"
                                + ") ORDER BY 2,3"

                        // viste
                        , "SELECT OWNER,TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'',DATA_PRECISION,REMARKS FROM information_schema.columns WHERE OWNER = '" + schema + "' AND TABLE_NAME in "
                        + "("
                        + "SELECT TABLE_NAME FROM information_schema.views WHERE AND OWNER = '" + schema + "' AND TABLE_NAME='" + table + "'"
                        + ") ORDER BY 2,3"

                        // TODO . sinonimi
                        /*
                        ,"SELECT OWNER,TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'',DATA_PRECISION FROM information_schema.columns WHERE (OWNER,TABLE_NAME) in "
                        + "("
                        + "SELECT TABLE_OWNER,TABLE_NAME FROM information_schema.tables_syn WHERE OWNER = '" + metaDataTableSchema + "' AND TABLE_NAME in "
                        + "("
                        + "SELECT OBJECT_NAME FROM information_schema.all_object WHERE object_type='SYNONYM' AND OWNER = '" + metaDataTableSchema + "'"
                        + ")"
                        + ") ORDER BY 2,3"
                        */
                };

                if ("oracle" .equalsIgnoreCase(dialet)) {
                    queryList = oracleQueryList;
                } else if ("postgres" .equalsIgnoreCase(dialet)) {
                    queryList = postgresQueryList;
                } else {
                }

                ArrayList<MetaDataCol> metaDataCols = new ArrayList<MetaDataCol>();

                int recCount = 0;
                int nTable = 0;

                Statement stmt = conn.createStatement();
                stmt.setFetchSize(8 * 1024);

                for (int iq = 0; iq < queryList.length; iq++) {

                    ResultSet rs = stmt.executeQuery(queryList[iq]);

                    long query_time = (System.currentTimeMillis() - msTrace);

                    recCount = 0;

                    while (rs.next()) {

                        String owner = rs.getString(1);
                        // String _table = rs.getString(2);

                        String autoIncString = null;

                        String typeName = rs.getString(4);
                        String sqlType = oracleToSqlType(typeName);
                        String remarks = rs.getString(9);

                        String sourceCatalog = null; // rs.getString("SCOPE_CATALOG");
                        String sourceSchema = null; // rs.getString("SCOPE_SCHEMA");
                        String sourceTable = null; // rs.getString("SCOPE_TABLE");
                        String sourceDataType = null; // rs.getString("SOURCE_DATA_TYPE");
                        String sourceIsGenerated = null; // rs.getString("IS_GENERATEDCOLUMN");

                        // Colonne :
                        // OWNER,TABLE_NAME,
                        // COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'DATA_DEFAULT',DATA_PRECISION
                        // MetaDataCol(String _name, String _datatype, String _remarks, String _size, String _isNullable, String _columnDef, String _digits) {
                        MetaDataCol metaDataCol = new MetaDataCol(rs.getString(3), sqlType, typeName, remarks, rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), autoIncString, sourceCatalog, sourceSchema, sourceTable, sourceDataType, sourceIsGenerated);
                        metaDataCols.add(metaDataCol);
                        recCount++;
                    }
                    rs.close();

                    long retrive_time = (System.currentTimeMillis() - msTrace);

                    if (recCount > 0) {
                        nTable++;

                        if (bReadDefault) {
                            // ORACLE SHIT : lettura DATA_DEFAULT
                            if ("oracle" .equalsIgnoreCase(dialet)) {
                                String stmtSQL = "SELECT COLUMN_NAME, DATA_DEFAULT from DBA_TAB_COLUMNS where DATA_DEFAULT is not null and TABLE_NAME = '" + table + "'";
                                Statement stmtc = conn.createStatement();
                                stmtc.setFetchSize(8 * 1024);
                                ResultSet rsc = stmtc.executeQuery(stmtSQL);
                                try {
                                    while (rsc.next()) {
                                        String col = rsc.getString(1);
                                        String def = rsc.getString(2);
                                        for (int i = 0; i < metaDataCols.size(); i++) {
                                            MetaDataCol metaDataCol2 = metaDataCols.get(i);
                                            if (metaDataCol2.name.equalsIgnoreCase(col)) {
                                                metaDataCol2.columnDef = def;
                                                break;
                                            }
                                        }
                                    }
                                } catch (Exception e) {
                                }
                                rsc.close();
                                stmtc.close();
                            }
                        }

                        // The result
                        metaDataTableResult = new MetaDataTable(table, schema, database, metaDataCols);

                        // Add to cache
                        metaDataTable.add(metaDataTableResult);

                        long total_time = (System.currentTimeMillis() - msTrace);
                        long extra_time = total_time - retrive_time;
                        long total_retrive_time = retrive_time - query_time;

                        System.err.println(" Lettura tabella n." + nTable + " : " + schema + "." + table + "... [ TIME Statistics : query:" + query_time + "ms" + " + retrive:" + total_retrive_time + "ms" + " + extra:" + extra_time + "ms" + " = " + total_time + "ms");
                    }
                }
                stmt.close();

                System.out.println("Read meatadata on table: " + schema + "." + table + " Items:" + recCount + " Total time :" + (System.currentTimeMillis() - msTrace));

                if (columnName != null && !"*".equalsIgnoreCase(columnName)) {
                    // colonna specifica
                    return getTableMetadata(conn, null, schema, table, columnName, true);
                } else {
                    // tutte le colonne return metadataTable
                    return metaDataTableResult;
                }
            }

        } catch (Exception e) {
            System.err.println("readTableMetadataBySQL() error : " + e.getMessage());
        }

        return null;
    }

    // uso interno
    static private Object getTableMetadata(Connection conn, String database, String schema, String table, String columnName, boolean emitError) {
        MetaDataCol foundMdCol = null;
        MetaDataTable mdTable = null;
        MetaDataCol mdCol = null;

        if (!IsMetadataCacheEnabled) {
            return null;
        }

        try {
            for (int i = 0; i < metaDataTable.size(); i++) {
                mdTable = metaDataTable.get(i);
                if (mdTable.table != null && mdTable.table.equalsIgnoreCase(table)) {
                    if ( (mdTable.schema != null && mdTable.schema.equalsIgnoreCase(schema)) || schema == null) {
                        if ( (mdTable.database != null && mdTable.database.equalsIgnoreCase(database)) || database == null) {
                            if (mdTable.metaDataCols != null) {
                                if(columnName != null && !"*".equalsIgnoreCase(columnName) && !columnName.isEmpty()) {
                                    for (int istep = 0; istep < 2; istep++) {
                                        for (int j = 0; j < mdTable.metaDataCols.size(); j++) {
                                            mdCol = mdTable.metaDataCols.get(j);
                                            boolean condition = istep > 0 ? (mdCol.name.equalsIgnoreCase(columnName)) : (mdCol.name.equals(columnName));
                                            if (condition) {
                                                // Assegna il risultato
                                                foundMdCol = mdCol;
                                                condition = istep > 0 ? (mdTable.schema.equalsIgnoreCase(schema) || (schema == null && mdTable.schema.equalsIgnoreCase(metaDataTableSchema))) : (mdTable.schema.equals(schema) || (schema == null && mdTable.schema.equals(metaDataTableSchema)));
                                                if (condition) {
                                                    // schema coincidente o schema tabella = schema utente DataSource (prioritario)
                                                    return (Object) mdCol;
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    // Metadata of the table
                                    if(mdTable.metaDataCols.size() > 1) { // TODO: >= non columns of the table
                                        return mdTable;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("getTableMetadata() error : " + e.getMessage());
        }

        if (foundMdCol == null) {
            if (metaDataTable.size() > 0) {
                boolean bTableFound = false;
                if(emitError) {
                    System.err.println("Field not in cache : " + schema + "." + table + "." + columnName + " .. dumping table's columns cache");
                    for (int i = 0; i < metaDataTable.size(); i++) {
                        mdTable = metaDataTable.get(i);
                        if ( (database != null && mdTable.database.equalsIgnoreCase(database)) || database == null || database.isEmpty()) {
                            if (mdTable.schema != null && mdTable.schema.equalsIgnoreCase(schema)) {
                                if (mdTable.table.equalsIgnoreCase(table)) {
                                    String sAllColumns = "";
                                    for (int ic = 0; ic < mdTable.metaDataCols.size(); ic++) {
                                        sAllColumns += mdTable.metaDataCols.get(ic).name + ",";
                                    }
                                    bTableFound = true;
                                    System.err.println(" tableName:" + mdTable.table + " all cols:" + sAllColumns);
                                }
                            }
                        }
                    }
                    if (!bTableFound) {
                        // ok, still to read it
                        // System.err.println(" Table: " + schema + "." + table + " not found");
                    } else {
                        System.err.println(" Field : " + schema + "." + table + "." + columnName + " not found");
                    }
                }
            }
        }
        return foundMdCol;
    }


    /**
     * CA : 25-apr-2020
     * <p>
     * Definisce la mappatura fra i dati sql e le classi java
     *
     * @param oType the data type (int)
     * @return the CLass mathcing the type
     */
    static public Class getJavaClass(Object oType) {
        if (oType instanceof Integer) {
            return getJavaClass((int)(Integer) oType);
        } else if (oType instanceof Long) {
            return getJavaClass((int)((Long) oType).intValue());
        } else if (oType instanceof String) {
            return getJavaClass((int)Integer.parseInt((String) oType));
        } else if (oType instanceof BigDecimal) {
            return getJavaClass((int)((BigDecimal) oType).intValue());
        }
        return null;
    }

    /**
     * CA : 25-apr-2020
     * <p>
     * Definisce la mappatura fra i dati sql e le classi java
     *
     * @param type the data type (int)
     * @return the CLass mathcing the type
     */
    static public Class getJavaClass(int type) {
        if (type == 1) {
            return String.class;
        } else if (type == Types.NUMERIC || type == Types.DECIMAL) {
            return java.math.BigDecimal.class;
        } else if (type == 4 || type == -5 || type == -6 || type == 5) {
            // SMALLINT	short	Integer
            // INTEGER	int	Integer
            return Integer.class;
        } else if (type == -7) {
            return Boolean.class;
        } else if (type == -5) {
            // BIGINT	long	Long     
            return Long.class;
        } else if (type == 3) {
            // NUMERIC	 	java.math.BigDecimal
            // DECIMAL	 	java.math.BigDecimal
            return java.math.BigDecimal.class;
        } else if (type == 7) {
            return Float.class;
        } else if (type == 8) {
            return Double.class;
        } else if (type == 92) {
            return java.sql.Time.class;
        } else if (type == 6 || type == 93) {
            return java.sql.Timestamp.class;
        } else if (type == 91) {
            return java.sql.Date.class;
        } else if (type == 12) {
            return String.class;
        } else {
            System.err.println("getJavaClass() : undetected type:" + type);
            return String.class;
        }
    }


    static public String oracleToSqlType(String type) {
        String sqlType = "1";
        if ("CHAR" .equalsIgnoreCase(type) || "VARCHAR2" .equalsIgnoreCase(type) || "LONG" .equalsIgnoreCase(type)) {
        } else if ("NUMBER" .equalsIgnoreCase(type) || "BINARY_INTEGER" .equalsIgnoreCase(type)) {
            sqlType = "4";
        } else if ("BINARY_FLOAT" .equalsIgnoreCase(type) || "FLOAT" .equalsIgnoreCase(type)) {
            sqlType = "7";
        } else if ("BINARY_DOUBLE" .equalsIgnoreCase(type) || "DOUBLE" .equalsIgnoreCase(type)) {
            sqlType = "8";
        } else if ("DATE" .equalsIgnoreCase(type) || "DATE" .equalsIgnoreCase(type)) {
            sqlType = "93";
        } else if ("DATETIME" .equalsIgnoreCase(type)) {
            sqlType = "6";
        } else if ("TIMESTAMP" .equalsIgnoreCase(type) || "TIMESTAMP WITH TIME ZONE" .equalsIgnoreCase(type) || "TIMESTAMP WITH LOCAL TIME ZONE" .equalsIgnoreCase(type)) {
            sqlType = "91";
        }
        return sqlType;
    }

    static public class ForeignKey {
        public String foreignTable;
        public ArrayList<String> foreignColumns;
        public ArrayList<String> columns;
        public String type;
        public String foreignWrk;

        public ForeignKey(String foreignTable, ArrayList<String> foreignColumns, ArrayList<String> columns, String foreignWrk) {
            this.foreignTable = foreignTable;
            this.foreignColumns = foreignColumns;
            this.columns = columns;
            this.foreignWrk = foreignWrk;
            this.type = null;
        }

        public ForeignKey(String foreignTable, String foreignColumn, String column, String foreignWrk) {
            this.foreignTable = foreignTable;
            this.foreignColumns = new ArrayList<String>();
            this.foreignColumns.add(foreignColumn);
            this.columns = new ArrayList<String>();
            this.columns.add(column);
            this.foreignWrk = foreignWrk;
            this.type = null;
        }

        public ForeignKey() {
            this.foreignTable = null;
            this.foreignColumns = null;
            this.columns = null;
            this.foreignWrk = null;
            this.type = null;
        }
    }


    static public Object[] getAllDatabases(String database, Connection conn, boolean bUserFieldIdentificator) {
        int nRec = 0;
        String result = "";
        try {
            // if(database == null || database.isEmpty()) database = conn.getCatalog();
            ArrayList<String> databaseList = new ArrayList<String>();
            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = dm.getCatalogs();
            if (rs != null) {
                result += "[";
                while (rs.next()) {
                    if (("*" .equalsIgnoreCase(database) || database == null) || (database != null && database.equalsIgnoreCase(rs.getString("TABLE_CAT")))) {
                        String databaseName = rs.getString("TABLE_CAT");
                        if (databaseList.indexOf(databaseName) < 0) {
                            if (BlackWhiteList.isAccessible(database, "", "")) {
                                databaseList.add(databaseName);
                                result += nRec > 0 ? "," : "";
                                result += "{";
                                result += "\"" + (bUserFieldIdentificator ? "1" : "DATABASE") + "\":\"" + databaseName + "\"";
                                result += ",\"" + (bUserFieldIdentificator ? "2" : "REMARKS") + "\":\"" + "" + "\"";
                                result += "}";
                                nRec++;
                            }
                        }
                    }
                }
                result += "]";
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        }
        return new Object[]{(Object) result, (Object) nRec};
    }

    static public Object[] getAllSchemas(String database, String schema, Connection conn, boolean bUserFieldIdentificator) {
        int nRec = 0;
        String result = "";
        try {
            ArrayList<String> schemaList = new ArrayList<String>();
            String[] types = {"TABLE"};

            if (database == null || database.isEmpty())
                database = conn.getCatalog();
            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = null;
            boolean useGetSchemas = false;
            String driver = db.getDriver(conn);
            if ("oracle" .equalsIgnoreCase(driver)) {
                useGetSchemas = true;
                rs = dm.getSchemas();
            } else {
                rs = dm.getTables(database, null, "%", types);
            }
            if (rs != null) {
                int ncols = rs.getMetaData().getColumnCount();
                String col0 = ncols >= 1 ? rs.getMetaData().getColumnName(1) : null;
                String col1 = ncols >= 2 ? rs.getMetaData().getColumnName(2) : null;
                String col2 = ncols >= 3 ? rs.getMetaData().getColumnName(3) : null;

                result += "[";
                while (rs.next()) {
                    String databaseName = "";
                    String schemaName = "";
                    if (useGetSchemas) {
                        if (ncols >= 2) {
                            databaseName = col0 != null ? rs.getString(col0) : null;
                            schemaName = col1 != null ? rs.getString(col1) : null;
                        } else {
                            databaseName = null;
                            schemaName = col0 != null ? rs.getString(col0) : null;
                            ;
                        }
                    } else {
                        databaseName = rs.getString("TABLE_CAT");
                        schemaName = rs.getString("TABLE_SCHEM");
                    }
                    // System.err.println("TABLE_CAT:"+databaseName+" TABLE_SCHEM:"+schemaName+"");
                    if (("*" .equalsIgnoreCase(database) || database == null)
                            || (database != null && databaseName != null && databaseName.contains(database))
                            || (database != null && databaseName == null)
                    ) {
                        if (("*" .equalsIgnoreCase(schema) || schema == null)
                                || (schema != null && schemaName != null && schemaName.contains(schema))
                                || (schema == null && schemaName != null)
                        ) {
                            if (schemaList.indexOf(schemaName) < 0) {
                                if (BlackWhiteList.isAccessible(database, schema, "")) {
                                    schemaList.add(schemaName);
                                    result += nRec > 0 ? "," : "";
                                    result += "{";
                                    result += "\"" + (bUserFieldIdentificator ? "1" : "CATALOG") + "\":\"" + (databaseName != null ? databaseName : (database != null ? database : "")) + "\"";
                                    result += ",\"" + (bUserFieldIdentificator ? "2" : "SCHEMA") + "\":\"" + (schemaName != null ? schemaName : "") + "\"";
                                    result += ",\"" + (bUserFieldIdentificator ? "3" : "REMARKS") + "\":\"" + "" + "\"";
                                    result += "}";
                                    nRec++;
                                }
                            }
                        }
                    }
                }
                result += "]";
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        }
        return new Object[]{(Object) result, (Object) nRec};
    }

    static public Object[] getAllTables(String database, String schema, String table, String view, Connection conn, boolean bUserFieldIdentificator) {
        int nRec = 0;
        String result = "", driver = null;
        String[] types = {"", "", ""};
        try {

            try {
                driver = db.getDriver(conn);
            } catch (SQLException e) {
            }

            if ("oracle" .equalsIgnoreCase(driver)) {
                // fuckyou oracle
                if (schema == null || schema.isEmpty()) {
                    try {
                        schema = conn.getSchema();
                    } catch (Throwable e) { }
                }
                if (schema == null || schema.isEmpty()) {
                    try {
                        schema = conn.getMetaData().getUserName();
                    } catch (Throwable e) { }
                }
            }

            if (table != null) types[0] = "TABLE";
            if (view != null) types[1] = "VIEW";
            if (database == null || database.isEmpty())
                database = conn.getCatalog();
            if (schema == null || schema.isEmpty())
                schema = null; // conn.getMetaData().getSchemaTerm();

            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = dm.getTables(database, schema, null, types);
            if (rs != null) {
                result += "[";
                while (rs.next()) {
                    String resultShcema = rs.getString("TABLE_SCHEM");
                    if ((schema == null && !"information_schema" .equalsIgnoreCase(resultShcema))
                            || (schema != null && schema.equalsIgnoreCase(resultShcema))
                            || (schema != null && resultShcema == null)
                            || (schema != null && schema.equalsIgnoreCase(resultShcema))
                    ) {
                        if (BlackWhiteList.isAccessible(database, schema, table)) {
                            String table_name = rs.getString("TABLE_NAME");
                            String table_type = rs.getString("TABLE_TYPE");
                            String remarks = rs.getString("REMARKS");
                            if(table_name != null && !table_name.isEmpty()) {
                                result += nRec > 0 ? "," : "";
                                result += "{";
                                result += "\"" + (bUserFieldIdentificator ? "1" : "TABLE") + "\":\"" + table_name + "\"";
                                result += ",\"" + (bUserFieldIdentificator ? "2" : "TYPE") + "\":\"" + (table_type != null ? table_type : "") + "\"";
                                result += ",\"" + (bUserFieldIdentificator ? "3" : "REMARKS") + "\":\"" + (remarks != null ? remarks : "") + "\"";
                                result += "}";
                                nRec++;
                            }
                        }
                    }
                }
                result += "]";
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        }
        return new Object[]{(Object) result, (Object) nRec};
    }

    static public Object[] getAllColumns(String database, String schema, String tableName, Connection conn, boolean bUserFieldIdentificator) {
        return getAllColumns( database, schema, tableName, conn, bUserFieldIdentificator, true);
    }

    static public Object[] getAllColumns(String database, String schema, String tableName, Connection conn, boolean bUserFieldIdentificator, boolean extendedMetadata) {
        int nRec = 0;
        String result = "", driver = null;
        metadata.MetaDataTable metaDatatable = null;

        try {

            try {
                driver = db.getDriver(conn);
            } catch (SQLException e) {
            }

            if ("oracle" .equalsIgnoreCase(driver)) {
                // fuckyou oracle
                if (schema == null || schema.isEmpty()) {
                    try {
                        schema = conn.getSchema();
                    } catch (Throwable e) { }
                }
                if (schema == null || schema.isEmpty()) {
                    try {
                        schema = conn.getMetaData().getUserName();
                    } catch (Throwable e) { }
                }

                try {
                    oracle.jdbc.OracleConnection oraCon = (oracle.jdbc.OracleConnection)conn.unwrap(oracle.jdbc.OracleConnection.class);
                    if(oraCon != null) {
                        oraCon.setRemarksReporting(true);
                    }
                } catch (Throwable e) { }

                metaDatatable = (MetaDataTable) readTableMetadataBySQL(conn, database, schema, tableName, null, "oracle", false, extendedMetadata);
            }

            if (database == null || database.isEmpty())
                database = conn.getCatalog();
            if (schema == null || schema.isEmpty())
                schema = null; // conn.getMetaData().getSchemaTerm();

            // ((oracle.jdbc.OracleConnection)conn ).setIncludeSynonyms(true);

            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = dm.getColumns(database, schema, tableName, null);
            if (rs != null) {
                result += "[";
                while (rs.next()) {
                    String resultShcema = rs.getString("TABLE_SCHEM");
                    if ((       schema == null && !"information_schema" .equalsIgnoreCase(resultShcema))
                            || (schema != null && resultShcema == null)
                            || (schema != null && schema.equalsIgnoreCase(resultShcema))
                    ) {

                        String columnName = null, remarks = null, decimalDigits = null;

                        try {
                            columnName = (rs.getString("COLUMN_NAME") != null ? rs.getString("COLUMN_NAME") : "");
                        } catch (Exception e) {}


                        try {
                            if ("oracle" .equalsIgnoreCase(driver)) {
                                // oracle shit
                                Object res = metadata.getTableMetadata(metaDatatable, columnName, "remarks");
                                remarks = String.valueOf( res != null ? res : "" );
                            } else {
                                remarks = (rs.getString("REMARKS") != null ? rs.getString("REMARKS") : "");
                            }
                        } catch (Exception e) {}

                        try {
                            decimalDigits = String.valueOf(rs.getInt("DECIMAL_DIGITS"));
                        } catch (Exception e) {}


                        result += nRec > 0 ? "," : "";
                        result += "{";
                        result += "\"" + (bUserFieldIdentificator ? "1" : "TABLE") + "\":\"" + (rs.getString("TABLE_NAME") != null ? rs.getString("TABLE_NAME") : "") + "\"";
                        result += ",\"" + (bUserFieldIdentificator ? "2" : "COLUMN") + "\":\"" + columnName + "\"";
                        result += ",\"" + (bUserFieldIdentificator ? "3" : "REMARKS") + "\":\"" + remarks + "\"";
                        result += ",\"" + (bUserFieldIdentificator ? "4" : "TYPE_NAME") + "\":\"" + (rs.getString("TYPE_NAME") != null ? rs.getString("TYPE_NAME") : "") + "\"";
                        result += ",\"" + (bUserFieldIdentificator ? "5" : "COLUMN_SIZE") + "\":\"" + (rs.getString("COLUMN_SIZE") != null ? rs.getString("COLUMN_SIZE") : "") + "\"";
                        result += ",\"" + (bUserFieldIdentificator ? "6" : "DECIMAL_DIGITS") + "\":\"" + (decimalDigits != null ? decimalDigits : "") + "\"";
                        result += ",\"" + (bUserFieldIdentificator ? "7" : "NULLABLE") + "\":\"" + (rs.getString("NULLABLE") != null ? rs.getString("NULLABLE") : "") + "\"";
                        result += "}";
                        nRec++;
                    }
                }
                result += "]";
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        }
        return new Object[]{(Object) result, (Object) nRec};
    }

    private static Object getTableMetadata(MetaDataTable metaDatatable, String column, String prop) {
        ArrayList<MetaDataCol> cols = metaDatatable.metaDataCols;
        for(int ic=0; ic<cols.size(); ic++) {
            MetaDataCol col = cols.get(ic);
            if(col.name.equalsIgnoreCase(column)) {
                if("remarks".equalsIgnoreCase(prop)) {
                    return col.remarks;
                } else if("typeName".equalsIgnoreCase(prop)) {
                    return col.remarks;
                } else if("size".equalsIgnoreCase(prop)) {
                    return col.size;
                } else if("isNullable".equalsIgnoreCase(prop)) {
                    return col.isNullable;
                } else if("columnDef".equalsIgnoreCase(prop)) {
                    return col.columnDef;
                } else {
                    return col.name;
                }
            }
        }
        return null;
    }

    static public ArrayList<String> getAllColumnsAsArray(String database, String schema, String tableName, Connection conn) throws Throwable {
        ArrayList<String> result = new ArrayList<String>();
        Connection connToDB = null, connToUse = conn;
        long time1 = 0, time0 = System.currentTimeMillis();

        try {
            if (database == null || database.isEmpty()) {
                database = conn.getCatalog();
            } else {
                conn.setCatalog(database);
                String db = conn.getCatalog();
                if (db != null && !database.trim().isEmpty()) {
                    if (!db.equalsIgnoreCase(database)) {
                        // set catalog not supported : connect to different DB
                        Object[] connResult = connection.getDBConnection(database);
                        conn = (Connection) connResult[0];
                        String connError = (String) connResult[1];
                        connToUse = connToDB = conn;
                    }
                }
            }
            if (schema == null || schema.isEmpty())
                schema = null; // connToUse.getMetaData().getSchemaTerm();

            if (tableName != null && !tableName.isEmpty()) {
                try {
                    ((oracle.jdbc.driver.OracleConnection) connToUse).setIncludeSynonyms(true);
                } catch (Throwable e) {
                }
                DatabaseMetaData dm = connToUse.getMetaData();
                ResultSet rs = dm.getColumns(database, schema, tableName, null);
                if (rs != null) {
                    rs.getMetaData().getColumnCount();
                    if (rs.next()) {
                        fill_columns(schema, rs, result);
                    } else {
                        PreparedStatement stmt;
                        try {
                            stmt = connToUse.prepareStatement("select COLUMN_NAME from all_tab_cols where TABLE_NAME=?");
                            stmt.setString(1, tableName.toUpperCase());
                            rs = stmt.executeQuery();
                            if (rs != null) {
                                if (rs.next()) {
                                    fill_columns(schema, rs, result);
                                }
                            }
                        }catch (Exception e) {
                            System.err.println(e.getMessage());
                        }
                    }
                    rs.close();
                }
            }

        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        } finally {
            if (connToDB != null) {
                try {
                    connToDB.close();
                } catch (SQLException ex) {
                    Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        }
        time1 = System.currentTimeMillis();
        if (time1 - time0 > TIME_MSEC_LIMIT_FOR_WARNING) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, "*** WARNING : getAllColumnsAsArray() database:" + database + " schema:" + schema + " table:" + tableName + " time:" + (time1 - time0));
        }
        return result;
    }

    private static void fill_columns(String schema, ResultSet rs, ArrayList<String> result) throws SQLException {
        do {
            String resultShcema = rs.getString("TABLE_SCHEM");
            if ((schema == null && !"information_schema".equalsIgnoreCase(resultShcema))
                    || (schema != null && resultShcema == null)
                    || (schema != null && schema.equalsIgnoreCase(resultShcema)) ) {
                result.add(rs.getString("COLUMN_NAME"));
            }
        } while (rs.next());
    }


    /**
     * Return all foreign keys and all cross reference relative to database/schema/table
     *
     * @param database
     * @param schema
     * @param table
     * @param conn
     * @param bUserFieldIdentificator
     *
     * @return Object[] { (Object) result, (Object) nRec};
     *
     *
     */
    static public Object[] getAllForeignKeys(String database, String schema, String table, Connection conn, boolean bUserFieldIdentificator) {
        int nRec = 0;
        String result = "";
        String[] types = {"", "", ""};
        try {
            if (database == null || database.isEmpty())
                database = conn.getCatalog();
            if (schema == null || schema.isEmpty())
                schema = null; // conn.getMetaData().getSchemaTerm();
            if (table != null && !table.isEmpty()) {
                // ArrayList<ForeignKey> foreignKeys = getForeignKeyData(database, schema, table, conn);
                ArrayList<ForeignKey> foreignKeys = null;

                ArrayList<metadata.ForeignKey> foreignKeysImportedOnTable = null;
                ArrayList<metadata.ForeignKey> foreignKeysExportedOnTable = null;
                //
                // Elenco colonne che sono referenziate su altre tabelle (tabelle usate da questa tabella)
                // es. campo ID_NAZIONE referenziato in NAZIONE.ID
                try {
                    foreignKeysImportedOnTable = metadata.getForeignKeyData(database, schema, table, conn);
                } catch (Exception ex) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                }
                //
                // Elenco di colonne (chiavi) che sono utilizzate da altre tabelle (tabelle che usano questa tabella)
                // es. campo NAZIONE.ID usato in ORDINI.ID_NAZIONE, PREVENTIVI.ID_NAZION£ etc
                try {
                    foreignKeysExportedOnTable = metadata.getExternalForeignKeyData(database, schema, table, conn);
                } catch (Exception ex) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                }
                if(foreignKeysImportedOnTable != null || foreignKeysExportedOnTable != null) {
                    foreignKeys = new ArrayList<metadata.ForeignKey>();
                    if(foreignKeysImportedOnTable != null) {
                        foreignKeys.addAll(foreignKeysImportedOnTable);
                    }
                    if(foreignKeysExportedOnTable != null) {
                        foreignKeys.addAll(foreignKeysExportedOnTable);
                    }
                }


                if (foreignKeys != null) {
                    result += "[";
                    for (int i = 0; i < foreignKeys.size(); i++) {
                        ForeignKey foreignKey = foreignKeys.get(i);
                        if (foreignKey != null) {
                            // TODO : lettura colonne su foreignKey.foreignTable e set del campo desrittpre
                            String descriptor = "";
                            result += nRec > 0 ? "," : "";
                            result += "{";
                            result += "\"" + (bUserFieldIdentificator ? "1" : "ID") + "\":\"" + (nRec + 1) + "\"";
                            result += ",\"" + (bUserFieldIdentificator ? "2" : "TABLE") + "\":\"" + table + "\"";
                            result += ",\"" + (bUserFieldIdentificator ? "3" : "COLUMN") + "\":\"" + utility.arrayToString(foreignKey.columns.toArray(), null, null, ",") + "\"";
                            result += ",\"" + (bUserFieldIdentificator ? "4" : "FOREIGN_TABLE") + "\":\"" + foreignKey.foreignTable + "\"";
                            result += ",\"" + (bUserFieldIdentificator ? "5" : "FOREIGN_COLUMN") + "\":\"" + utility.arrayToString(foreignKey.foreignColumns.toArray(), null, null, ",") + "\"";
                            result += ",\"" + (bUserFieldIdentificator ? "6" : "TYPE") + "\":\""+foreignKey.type+"\"";
                            result += ",\"" + (bUserFieldIdentificator ? "7" : "USEAS") + "\":\""+("REFERENCE".equalsIgnoreCase(foreignKey.type) ? "FOREIGN TABLE" : "LOOKUP")+"\"";
                            result += ",\"" + (bUserFieldIdentificator ? "8" : "DESCRIPTOR") + "\":\""+descriptor+"\"";
                            result += "}";
                            nRec++;
                        }
                    }
                    result += "]";
                }
            } else {
                result = "[]";
            }
        } catch (Exception ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        }
        return new Object[]{(Object) result, (Object) nRec};
    }


    /**
     * @param database
     * @param schema
     * @param tableName
     * @param conn
     * @return
     */
    static public ArrayList<ForeignKey> getForeignKeyData(String database, String schema, String tableName, Connection conn) {
        ArrayList<ForeignKey> result = new ArrayList<ForeignKey>();
        try {
            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = dm.getImportedKeys((database != null && database.isEmpty() ? database : null), schema, ("*" .equalsIgnoreCase(tableName) ? "" : tableName));
            // ResultSet rs = dm.getImportedKeys(null, null, null);
            if (rs != null) {
                while (rs.next()) {
                    String resultDatabase = rs.getString("FKTABLE_CAT");
                    String resultSchema = rs.getString("FKTABLE_SCHEM");
                    String resultTable = rs.getString("FKTABLE_NAME");

                    if ((database == null && resultDatabase == null)
                            || (database != null && resultDatabase != null && database.equalsIgnoreCase(resultDatabase))
                            || (database == null && resultDatabase != null)
                            || (database != null && resultDatabase == null)
                    ) {
                        if ((schema == null && resultSchema == null)
                                || (schema != null && resultSchema != null && schema.equalsIgnoreCase(resultSchema))
                                || (schema == null && resultSchema != null)
                                || (schema != null && resultSchema == null)
                        ) {
                            if ((tableName == null && resultTable == null)
                                    || (tableName != null && resultTable != null && tableName.equalsIgnoreCase(resultTable))
                                    || (tableName == null && resultTable != null)
                            ) {

                                ForeignKey foreignTable = new ForeignKey();
                                foreignTable.foreignTable = rs.getString("PKTABLE_NAME");
                                foreignTable.foreignColumns = new ArrayList<String>(Arrays.asList(rs.getString("PKCOLUMN_NAME").split(",")));
                                foreignTable.columns = new ArrayList<String>(Arrays.asList(rs.getString("FKCOLUMN_NAME").split(",")));
                                foreignTable.foreignWrk = foreignTable.foreignTable + ".default";
                                foreignTable.type = "FOREIGN KEY";
                                result.add(foreignTable);
                            }
                        }
                    }
                }
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        }
        return result;
    }


    /**
     * @param database
     * @param schema
     * @param tableName
     * @param conn
     * @return
     */
    static public ArrayList<ForeignKey> getExternalForeignKeyData(String database, String schema, String tableName, Connection conn) {
        ArrayList<ForeignKey> result = new ArrayList<ForeignKey>();
        try {
            DatabaseMetaData dm = conn.getMetaData();
            // ResultSet rs = dm.getImportedKeys((database != null && database.isEmpty() ? database : null), schema, null/*("*".equalsIgnoreCase(tableName) ? "" : tableName)*/ );
            ResultSet rs = dm.getCrossReference((database != null && database.isEmpty() ? database : null), (schema != null && schema.isEmpty() ? schema : null), tableName,
                                                (database != null && database.isEmpty() ? database : null), null, null);
            /*
            PKTABLE_CAT String => parent key table catalog (may be null)
            PKTABLE_SCHEM String => parent key table schema (may be null)
            PKTABLE_NAME String => parent key table name
            PKCOLUMN_NAME String => parent key column name
            FKTABLE_CAT String => foreign key table catalog (may be null) being exported (may be null)
            FKTABLE_SCHEM String => foreign key table schema (may be null) being exported (may be null)
            FKTABLE_NAME String => foreign key table name being exported
            FKCOLUMN_NAME String => foreign key column name being exported
            KEY_SEQ short => sequence number within foreign key( a value of 1 represents the first column of the foreign key, a value of 2 would represent the second column within the foreign key).
                    UPDATE_RULE short => What happens to foreign key when parent key is updated:
            importedNoAction - do not allow update of parent key if it has been imported
            importedKeyCascade - change imported key to agree with parent key update
            importedKeySetNull - change imported key to NULL if its parent key has been updated
            importedKeySetDefault - change imported key to default values if its parent key has been updated
                importedKeyRestrict - same as importedKeyNoAction (for ODBC 2.x compatibility)
                DELETE_RULE short => What happens to the foreign key when parent key is deleted.
                        importedKeyNoAction - do not allow delete of parent key if it has been imported
                importedKeyCascade - delete rows that import a deleted key
                importedKeySetNull - change imported key to NULL if its primary key has been deleted
                importedKeyRestrict - same as importedKeyNoAction (for ODBC 2.x compatibility)
                importedKeySetDefault - change imported key to default if its parent key has been deleted
                FK_NAME String => foreign key name (may be null)
                PK_NAME String => parent key name (may be null)
                DEFERRABILITY short => can the evaluation of foreign key constraints be deferred until commit
                importedKeyInitiallyDeferred - see SQL92 for definition
                importedKeyInitiallyImmediate - see SQL92 for definition
                importedKeyNotDeferrable - see SQL92 for definition
                Params:
                parentCatalog – a catalog name; must match the catalog name as it is stored in the database; "" retrieves those without a catalog; null means drop catalog name from the selection criteria
                parentSchema – a schema name; must match the schema name as it is stored in the database; "" retrieves those without a schema; null means drop schema name from the selection criteria
                parentTable – the name of the table that exports the key; must match the table name as it is stored in the database
                foreignCatalog – a catalog name; must match the catalog name as it is stored in the database; "" retrieves those without a catalog; null means drop catalog name from the selection criteria
                foreignSchema – a schema name; must match the schema name as it is stored in the database; "" retrieves those without a schema; null means drop schema name from the selection criteria
                foreignTable – the name of the table that imports the key; must match the table name as it is stored in the database
                */
            // ResultSet rs = dm.getImportedKeys(null, null, null);
            if (rs != null) {
                while (rs.next()) {
                    String resultDatabase = rs.getString("FKTABLE_CAT");
                    String resultSchema = rs.getString("FKTABLE_SCHEM");
                    String resultTable = rs.getString("FKTABLE_NAME");
                    // PKTABLE_NAME, PKCOLUMN_NAME, KEY_SEQ, UPDATE_RULE, DELETE_RULE, FK_NAME, PK_NAME, DEFERRABILITY

                    if ((database == null && resultDatabase == null)
                            || (database != null && resultDatabase != null && database.equalsIgnoreCase(resultDatabase))
                            || (database == null && resultDatabase != null)
                            || (database != null && resultDatabase == null)
                    ) {
                        if ((schema == null && resultSchema == null)
                                || (schema != null && resultSchema != null && schema.equalsIgnoreCase(resultSchema))
                                || (schema == null && resultSchema != null)
                                || (schema != null && resultSchema == null)
                        ) {
                            if ((tableName == null && resultTable == null)
                                    || (tableName != null && resultTable != null && !tableName.equalsIgnoreCase(resultTable))
                                    || (tableName == null && resultTable != null)
                            ) {

                                ForeignKey foreignTable = new ForeignKey();
                                String fktable = rs.getString("FKTABLE_NAME");
                                if(!fktable.equalsIgnoreCase(tableName) || tableName == null || tableName.isEmpty() || "*".equalsIgnoreCase(tableName)) {
                                    foreignTable.foreignTable = rs.getString("FKTABLE_NAME");
                                    foreignTable.foreignColumns = new ArrayList<String>(Arrays.asList(rs.getString("FKCOLUMN_NAME").split(",")));
                                    foreignTable.columns = new ArrayList<String>(Arrays.asList(rs.getString("PKCOLUMN_NAME").split(",")));
                                    foreignTable.foreignWrk = foreignTable.foreignTable + ".default";
                                    foreignTable.type = "REFERENCE";
                                    result.add(foreignTable);
                                }
                            }
                        }
                    }
                }
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        }
        return result;
    }


    static public String getPrimaryKeyData(String database, String schema, String tableName, Connection conn) throws Throwable {
        Connection connToDB = null, connToUse = conn;
        String result = null;
        try {
            if(conn == null) {
                Object[] connResult = connection.getDBConnection(database);
                conn = (Connection) connResult[0];
                String connError = (String) connResult[1];
                connToUse = connToDB = conn;
            }
            if (database == null || database.isEmpty()) {
                database = conn.getCatalog();
            } else {
                if(conn != null) {
                    conn.setCatalog(database);
                    String db = conn.getCatalog();
                    if (!db.equalsIgnoreCase(database)) {
                        // set catalog not supported : connect to different DB
                        Object[] connResult = connection.getDBConnection(database);
                        conn = (Connection) connResult[0];
                        String connError = (String) connResult[1];
                        connToUse = connToDB = conn;
                    }
                }
            }

            DatabaseMetaData dm = connToUse.getMetaData();
            ResultSet rs = dm.getPrimaryKeys(database, schema, tableName);
            if (rs != null) {
                if (rs.next()) {
                    result = rs.getString("COLUMN_NAME");
                }
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        } finally {
            if (connToDB != null)
                try {
                    connToDB.close();
                } catch (SQLException ex) {
                    Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
                }
        }
        return result;
    }

    static public String searchOnDatabases(HttpServletRequest request, JspWriter out) {
        String result = "";
        try {
            Connection conn = null;
            String database = request.getParameter("database");
            String schema = request.getParameter("schema");
            String table = request.getParameter("table");
            String search = request.getParameter("search");

            try {
                Object[] connResult = connection.getDBConnection(database);
                conn = (Connection) connResult[0];
                String connError = (String) connResult[1];
                if (conn != null) {
                    result = searchOnDatabases(database, schema, table, conn, search, out);
                }
            } finally {
                try {
                    if (conn != null)
                        conn.close();
                } catch (SQLException ex) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
                }
            }

            if (out != null)
                out.print("<LiquidStartResponde/>");

        } catch (Throwable th) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, th);
        }
        return result;
    }

    static public String searchOnDatabases(String database, String schema, String table, Connection conn, String search, JspWriter out) {
        int nDatabaseSearch = 0;
        int nSchemaSearch = 0;
        int nTbableSearch = 0;
        int nColumnSearch = 0;
        int nRecFound = 0;

        if (database != null && database.isEmpty() || "*" .equalsIgnoreCase(database))
            database = null;
        if (schema != null && schema.isEmpty() || "*" .equalsIgnoreCase(schema))
            schema = null;
        if (table != null && table.isEmpty() || "*" .equalsIgnoreCase(table))
            table = null;

        String curStatus = "";
        String driver = null;
        String[] types = {"TABLE", "VIEW"};

        String tblHtml = "<table cellspacing=\"0\" cellpadding=\"10\" class=\"liquidFoundTable\">";
        String recHtml = "";

        tblHtml += append_to_found_record(null, null, null, null, null, null, null);

        try {
            driver = db.getDriver(conn);
        } catch (SQLException e) {
        }

        if (search != null && !search.isEmpty()) {

            try {
                ArrayList<String> databaseList = new ArrayList<String>();
                DatabaseMetaData dm = conn.getMetaData();
                ResultSet rs = dm.getCatalogs();
                if (rs != null) {
                    while (rs.next()) {
                        if (("*" .equalsIgnoreCase(database) || database == null) || (database != null && database.equalsIgnoreCase(rs.getString("TABLE_CAT")))) {
                            String databaseName = rs.getString("TABLE_CAT");
                            if (databaseList.indexOf(databaseName) < 0) {
                                databaseList.add(databaseName);
                                nDatabaseSearch++;
                                curStatus = "Adding Database:" + databaseName;
                                out.print("<Liquid>" + curStatus + "</Liquid>");

                            }
                        }
                    }
                    rs.close();
                }

                if (database == null || database.isEmpty()) {
                    if (databaseList.size() == 0) {
                        databaseList.add(null);
                        nDatabaseSearch++;
                    }
                }

                for (int idb = 0; idb < databaseList.size(); idb++) {
                    String db = databaseList.get(idb);
                    ArrayList<String> schemaList = new ArrayList<String>();
                    boolean useGetSchemas = false;
                    try {
                        if ("oracle" .equalsIgnoreCase(driver)) {
                            useGetSchemas = true;
                            rs = dm.getSchemas();
                        } else {
                            rs = dm.getTables(db, null, "%", types);
                        }
                        if (rs != null) {
                            while (rs.next()) {
                                String databaseName = "";
                                String schemaName = "";
                                if (useGetSchemas) {
                                    databaseName = rs.getString("TABLE_CATALOG");
                                    schemaName = rs.getString("TABLE_SCHEM");
                                } else {
                                    databaseName = rs.getString("TABLE_CAT");
                                    schemaName = rs.getString("TABLE_SCHEM");
                                }
                                // System.err.println("TABLE_CAT:"+databaseName+" TABLE_SCHEM:"+schemaName+"");
                                if ("*" .equalsIgnoreCase(database)
                                        || (db == null && database == null)
                                        || (db != null && databaseName != null && databaseName.contains(db))
                                        || (db != null && databaseName == null)
                                ) {
                                    if ("*" .equalsIgnoreCase(schema)
                                            || (schema == null && schemaName == null)
                                            || (schema != null && schemaName != null && schemaName.contains(schema))
                                            || (schema == null && schemaName != null)
                                    ) {
                                        if (schemaList.indexOf(schemaName) < 0) {
                                            schemaList.add(schemaName);
                                            nSchemaSearch++;
                                            curStatus = "Adding Database:" + db + " Schema:" + schemaName;
                                            out.print("<Liquid>" + curStatus + "</Liquid>");
                                        }
                                    }
                                }
                            }
                            rs.close();
                        }
                    } catch (SQLException ex) {
                        Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
                    }

                    for (int is = 0; is < schemaList.size(); is++) {
                        String scm = schemaList.get(is);
                        ArrayList<String> tableList = new ArrayList<String>();
                        ArrayList<String> tableRemarksList = new ArrayList<String>();
                        try {
                            rs = dm.getTables(db, scm, table, types);
                            if (rs != null) {
                                while (rs.next()) {
                                    String resultShcema = rs.getString("TABLE_SCHEM");
                                    String resultTable = rs.getString("TABLE_NAME");
                                    String resultTableRemarks = rs.getString("REMARKS");
                                    if ((schema == null && !"information_schema" .equalsIgnoreCase(resultShcema))
                                            || (schema != null && schema.equalsIgnoreCase(resultShcema))
                                            || (schema != null && resultShcema == null)
                                            || (schema != null && schema.equalsIgnoreCase(resultShcema))
                                    ) {
                                        if ((table == null && !"information_schema" .equalsIgnoreCase(resultTable))
                                                || (table != null && schema.equalsIgnoreCase(resultTable))
                                                || (table != null && resultTable == null)
                                                || (table != null && schema.equalsIgnoreCase(resultTable))
                                        ) {
                                            tableList.add(resultTable);
                                            tableRemarksList.add(resultTableRemarks);
                                            nTbableSearch++;

                                            curStatus = "Adding Database:" + db + " Schema:" + scm + " Table:" + table;
                                            out.print("<Liquid>" + curStatus + "</Liquid>");

                                            if (resultTable != null) {
                                                if (resultTable.contains(search)) {
                                                    recHtml = append_to_found_record("Table name", db, scm, resultTable, "", resultTable, search);
                                                    nRecFound++;
                                                }
                                            }
                                            if (resultTableRemarks != null) {
                                                if (resultTableRemarks.contains(search)) {
                                                    recHtml = append_to_found_record("Table remarks", db, scm, resultTable, "", resultTableRemarks, search);
                                                    nRecFound++;
                                                }
                                            }
                                        }
                                    }
                                }
                                rs.close();
                            }
                        } catch (SQLException ex) {
                            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
                        }

                        for (int it = 0; it < tableList.size(); it++) {
                            String tbl = tableList.get(it);
                            ArrayList<String> labelList = new ArrayList<String>();
                            ArrayList<String> remarksList = new ArrayList<String>();
                            try {
                                rs = dm.getColumns(db, scm, tbl, null);
                                if (rs != null) {
                                    while (rs.next()) {
                                        labelList.add(rs.getString("COLUMN_NAME"));
                                        remarksList.add(rs.getString("REMARKS"));
                                    }
                                    rs.close();
                                }
                            } catch (SQLException ex) {
                                Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
                            }

                            for (int ic = 0; ic < labelList.size(); ic++) {
                                String label = labelList.get(ic);
                                recHtml = "";
                                if (label != null) {
                                    if (label.contains(search)) {
                                        recHtml = append_to_found_record("Label", db, scm, tbl, label, label, search);
                                        nRecFound++;
                                    }
                                }
                                String remarks = remarksList.get(ic);
                                if (remarks != null) {
                                    if (remarks.contains(search)) {
                                        recHtml = append_to_found_record("Remarks", db, scm, tbl, label, remarks, search);
                                        nRecFound++;
                                    }
                                }
                                tblHtml += recHtml;
                                nColumnSearch++;

                                curStatus = "Searching on Database:" + db + " (" + (idb + 1) + "/" + databaseList.size() + ")" + " Schema:" + scm + " (" + (is + 1) + "/" + schemaList.size() + ")" + " Table:" + tbl + " (" + (it + 1) + "/" + tableList.size() + ")" + " Columns:" + label + " (" + (ic + 1) + "/" + labelList.size() + ")";
                                out.print("<Liquid>" + curStatus + "</Liquid>");

                                Thread.sleep(1);
                                out.flush();
                            }
                            int t = 1;
                        }
                        int s = 1;
                    }
                    int d = 1;
                }

                if (nRecFound == 0) {
                    recHtml += "<tr>";
                    recHtml += "<td colspan=\"6\">";
                    recHtml += "No data match '" + search + "'";
                    recHtml += "</td>";
                    recHtml += "</tr>";
                }

                recHtml += "<tr>";
                recHtml += "<td colspan=\"6\">";
                recHtml += "</td>";
                recHtml += "</tr>";


                recHtml += "<tr>";
                recHtml += "<td colspan=\"6\">";
                recHtml += "Searched in " + nDatabaseSearch + " database(s), " + nSchemaSearch + " schema(s), " + nTbableSearch + " table(s), " + nColumnSearch + " column(s)";
                recHtml += "</td>";
                recHtml += "</tr>";
                tblHtml += recHtml;

                tblHtml += "</table>";

            } catch (Exception ex) {
                Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, ex.getMessage());
            }
        }
        return tblHtml;
    }


    static boolean table_exist(Connection conn, String db, String scm, String table) throws SQLException {
        DatabaseMetaData dm = conn.getMetaData();
        ResultSet rs = dm.getCatalogs();
        try {
            if (rs != null) {
                String[] types = {"TABLE", "VIEW"};
                rs = dm.getTables(db, scm, table, types);
                if (rs != null) {
                    if (rs.next()) return true;
                }
                rs = dm.getTables(db, scm, table.toLowerCase(), types);
                if (rs != null) {
                    if (rs.next()) return true;
                }
                if (rs != null) rs.close();
                rs = dm.getTables(db, scm, table.toUpperCase(), types);
                if (rs != null) {
                    if (rs.next()) return true;
                }
                if (rs != null) rs.close();
                rs = dm.getTables(db, scm, null, null);
                if (rs != null) {
                    while (rs.next()) {
                        String resultTable = rs.getString("TABLE_NAME");
                        if (resultTable != null && table.equalsIgnoreCase(resultTable))
                            return true;
                    }
                }
                /* NO : pericoloso ritornare la tabella su un altro schema
                if(rs != null) rs.close();
                rs = dm.getTables(db, null, null, null );
                if(rs != null) {
                    while (rs.next()) {
                        String resultSchema = rs.getString("TABLE_SCHEM");
                        String resultTable = rs.getString("TABLE_NAME");
                        if(resultTable != null && table.equalsIgnoreCase(resultTable))
                            return true;
                    }
                }
                */
            }
        } finally {
            if (rs != null) rs.close();
        }
        return false;
    }

    static boolean create_table(Connection conn, String database, String schema, String table, JSONObject tableJson) throws SQLException, JSONException {
        boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;
        String itemIdString = "\"", tableIdString = "\"";
        String pre_sql = null;
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        int res;

        try {

            String driver = db.getDriver(conn);
            if ("mysql" .equalsIgnoreCase(driver)) {
                isMySQL = true;
            } else if ("mariadb" .equalsIgnoreCase(driver)) {
                isMySQL = true;
            } else if ("postgres" .equalsIgnoreCase(driver)) {
                isPostgres = true;
            } else if ("oracle" .equalsIgnoreCase(driver)) {
                isOracle = true;
            } else if ("sqlserver" .equalsIgnoreCase(driver)) {
                isSqlServer = true;
            }

            if (isMySQL) {
                itemIdString = "`";
                tableIdString = "";
            }

            create_database(conn, database);

            create_schema(conn, schema);

            String sql = "";

            sql += "CREATE TABLE IF NOT EXISTS " + (tableIdString + schema + tableIdString) + "." + (tableIdString + table + tableIdString) + " ";


            if (isOracle) {
            } else if (isPostgres) {
                sql += "(\n";
            }


            String primaryKey = null;
            try {
                primaryKey = tableJson.getString("primaryKey");
            } catch (Exception e) {
            }

            JSONArray cols = tableJson.getJSONArray("columns");
            for (int ic = 0; ic < cols.length(); ic++) {
                JSONObject col = cols.getJSONObject(ic);
                String name = col.getString("name");
                String type = col.has("type") ? col.getString("type") : "1";
                String typeName = col.has("typeName") ? col.getString("typeName") : "VARCHAR";
                int size = col.has("size") ? col.getInt("size") : 256;


                String sDefault = "";
                try {
                    sDefault = col.getString("default");
                } catch (Exception e) {
                }

                if (ic > 0) {
                    sql += ",";
                }

                if (primaryKey == null || primaryKey.isEmpty()) {
                    if ("id" .equalsIgnoreCase(name)) {
                        primaryKey = name;
                    }
                }

                if (isOracle) {
                    if (size <= 0) {
                        sql += (itemIdString + name + itemIdString) + " " + typeName + "\n";
                    } else {
                        sql += (itemIdString + name + itemIdString) + " " + typeName + "(" + size + ")" + "\n";
                    }
                    if (sDefault != null && !sDefault.isEmpty()) {
                        sDefault = sDefault.replace("`", "'");
                        sql += " DEFAULT " + sDefault;
                    }

                } else if (isPostgres) {
                    // code        char(5) CONSTRAINT firstkey PRIMARY KEY,
                    // title       varchar(40) NOT NULL,
                    // did         integer NOT NULL,

                    if (name.equals(primaryKey)) {
                        // creoosa references non implememted
                        // String seq_name = ((tableIdString+schema+tableIdString)+"."+(tableIdString+table+"_seq"+tableIdString));
                        // sDefault = "nextval('"+schema+"."+seq_name+"'::regclass)";
                        String seq_name = (tableIdString + table + "_seq" + tableIdString);
                        // pre_sql = "CREATE SEQUENCE IF NOT EXISTS "+seq_name+";\nCOMMIT;\n";
                        pre_sql = "CREATE SEQUENCE " + seq_name + ";\nCOMMIT;\n";
                        sDefault = "nextval('" + seq_name + "'::regclass)";
                        typeName = "int4";
                    }

                    if ("serial" .equalsIgnoreCase(typeName)) {
                        typeName = "integer";
                        size = -2;
                    }

                    if ("int4" .equalsIgnoreCase(typeName)) {
                        size = -1;
                    }
                    if (size <= 0) {
                        sql += (itemIdString + name + itemIdString) + " " + typeName;
                    } else {
                        if ("text" .equalsIgnoreCase(typeName)) {
                            sql += (itemIdString + name + itemIdString) + " " + typeName;
                        } else {
                            sql += (itemIdString + name + itemIdString) + " " + typeName + "(" + size + ")";
                        }
                    }

                    if (name.equals(primaryKey)) {
                        sql += " PRIMARY KEY ";
                    }

                    if (sDefault != null && !sDefault.isEmpty()) {
                        sDefault = sDefault.replace("`", "'");
                        sql += " DEFAULT " + sDefault + "";
                    }

                    sql += "\n";
                }
            }


            if (primaryKey != null && !primaryKey.isEmpty()) {
                if (isOracle) {
                    sql += "PRIMARY KEY " + primaryKey + "\n";
                }
            }

            if (isOracle) {
            } else if (isPostgres) {
                sql += ");\nCOMMIT;\n";
            }

            if (pre_sql != null && !pre_sql.isEmpty()) {
                try {
                    psdo = conn.prepareStatement(pre_sql);
                    res = psdo.executeUpdate();
                } catch (Exception ex) {
                    Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, ex.getMessage());
                    System.err.println("sql:" + pre_sql);
                }
                psdo.close();
            }

            if (sql != null && !sql.isEmpty()) {
                try {
                    psdo = conn.prepareStatement(sql);
                    res = psdo.executeUpdate();
                } catch (Exception ex) {
                    Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, ex.getMessage());
                    System.err.println("sql:" + sql);
                }
            }

            if (!table_exist(conn,
                    database,
                    schema,
                    table)) {
                // Fail
                return false;
            } else {
                return true;
            }
        } catch (Exception ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);

        } finally {
            if (psdo != null) psdo.close();
            if (rsdo != null) rsdo.close();
        }
        return false;
    }

    static boolean create_database_schema(String driver, String database, String schema, String user, String password) throws SQLException {
        return create_database_schema(driver, "localhost", database, schema, user, password);
    }

    static boolean create_database_schema(String driver, String host, String database, String schema, String user, String password) throws SQLException {
        Connection conn = null;
        boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;
        String itemIdString = "\"", tableIdString = "\"";
        Class driverClass = null;
        PreparedStatement psdo = null;
        ResultSet rsdo = null;

        try {

            if ("oracle" .equalsIgnoreCase(driver)) {
                isOracle = true;
                if (driverClass == null) driverClass = Class.forName("oracle.jdbc.driver.OracleDriver");
                conn = DriverManager.getConnection("jdbc:oracle:thin:@" + host + ":1521:xe", user, password);

            } else if ("postgres" .equalsIgnoreCase(driver)) {
                isPostgres = true;
                if (driverClass == null) driverClass = Class.forName("org.postgresql.Driver");
                conn = DriverManager.getConnection("jdbc:postgresql://" + host + ":5432/", user, password);

            } else if ("mysql" .equalsIgnoreCase(driver)) {
                isMySQL = true;
                if (driverClass == null) driverClass = Class.forName("com.mysql.jdbc.Driver");
                conn = DriverManager.getConnection("jdbc:mysql://" + host + ":3306/", user, password);

            } else if ("mariadb" .equalsIgnoreCase(driver)) {
                isMySQL = true;
                if (driverClass == null) driverClass = Class.forName("org.mariadb.jdbc.Driver");
                conn = DriverManager.getConnection("jdbc:mariadb://" + host + ":3306/", user, password);

            } else if ("sqlserver" .equalsIgnoreCase(driver)) {
                isSqlServer = true;
                if (driverClass == null) driverClass = Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
                conn = DriverManager.getConnection("jdbc:sqlserver://" + host + ":1433", user, password);

            } else {
                Logger.getLogger(Connection.class.getName()).log(Level.SEVERE, "driver not recognized");
            }


            if (isMySQL) {
                itemIdString = "`";
                tableIdString = "";
            }

            create_database(conn, database);

            create_schema(conn, schema);

            return true;

        } catch (Exception ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, ex.getMessage());

        } finally {
            if (psdo != null) psdo.close();
            if (rsdo != null) rsdo.close();
        }
        return false;
    }

    static public boolean create_database(Connection conn, String database) {
        String sql = null;
        if (conn != null) {
            if (database != null && !database.isEmpty()) {
                try {
                    String driver = db.getDriver(conn);
                    if ("mysql" .equalsIgnoreCase(driver)) {
                        sql = "CREATE DATABASE IF NOT EXISTS " + database;
                    } else if ("mariadb" .equalsIgnoreCase(driver)) {
                        sql = "CREATE DATABASE IF NOT EXISTS " + database;
                    } else if ("postgres" .equalsIgnoreCase(driver)) {
                        sql = "CREATE DATABASE " + database;
                    } else if ("oracle" .equalsIgnoreCase(driver)) {
                        // N.B. database = oracle instance
                        sql = "CREATE DATABASE IF NOT EXISTS " + database;
                    } else if ("sqlserver" .equalsIgnoreCase(driver)) {
                        sql = "CREATE DATABASE IF NOT EXISTS " + database;
                    }
                    if (sql != null) {
                        PreparedStatement psdo = conn.prepareStatement(sql);
                        psdo.executeUpdate();
                        psdo.close();
                        Logger.getLogger(metadata.class.getName()).log(Level.INFO, "Created database : " + database + " by driver : " + driver);
                        return true;
                    }
                } catch (Throwable th) {
                    Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, th.getMessage());
                    System.err.println("sql:" + sql);
                }
            }
        }
        return false;
    }

    static public boolean create_schema(Connection conn, String schema) {
        String sql = null;
        if (conn != null) {
            if (schema != null && !schema.isEmpty()) {
                try {
                    String driver = db.getDriver(conn);
                    if ("mysql" .equalsIgnoreCase(driver)) {
                        sql = "CREATE SCHEMA IF NOT EXISTS " + schema;
                    } else if ("mariadb" .equalsIgnoreCase(driver)) {
                        sql = "CREATE SCHEMA IF NOT EXISTS " + schema;
                    } else if ("postgres" .equalsIgnoreCase(driver)) {
                        sql = "CREATE SCHEMA " + schema;
                    } else if ("oracle" .equalsIgnoreCase(driver)) {
                        sql = "CREATE SCHEMA IF NOT EXISTS " + schema;
                    } else if ("sqlserver" .equalsIgnoreCase(driver)) {
                        sql = "CREATE SCHEMA IF NOT EXISTS " + schema;
                    }
                    if (sql != null) {
                        PreparedStatement psdo = conn.prepareStatement(sql);
                        psdo.executeUpdate();
                        psdo.close();
                        return true;
                    }
                } catch (Throwable th) {
                    Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, th.getMessage());
                    System.err.println("sql:" + sql);
                }
            }
        }
        return false;
    }


    //
    // search  in db utility func
    //
    static String append_to_found_record(String type, String database, String schema, String table, String column, String data, String searchString) {
        String recHtml = "";
        if (searchString == null) {
            recHtml += "<tr style=\"background-color: lightgrey\">";
            recHtml += "<td>";
            recHtml += "database";
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += "schema";
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += "table";
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += "column";
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += "type";
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += "result";
            recHtml += "</td>";
            recHtml += "</tr>";
        } else {
            recHtml += "<tr>";
            recHtml += "<td>";
            recHtml += database;
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += schema;
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += "<a href=\"javawcript:void(0)\" onclick=\"Liquid.onNewLiquidFromTableName('" + table + "', null, null);\" title=\"Click to create control\">" + table + "</a>";
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += column;
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += type;
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += data.substring(0, data.indexOf(searchString)) + "<span style=\"color:red\">" + searchString + "</span>" + data.substring(data.indexOf(searchString) + searchString.length());
            recHtml += "</td>";
            recHtml += "</tr>";
        }
        return recHtml;
    }

    static public String getAddColumnSQL(String driver, String database, String schema, String table, String field, String type, String size, String nullable, String autoincrement, String sDefault, String sRemarks) {
        return getAddColumnSQL(driver, database, schema, table, field, type, size, null, nullable, autoincrement, sDefault, sRemarks);
    }

    static public String getAddColumnSQL(String driver, String database, String schema, String table, String field, String type, String size, String scale, String nullable, String autoincrement, String sDefault, String sRemarks) {
        String sql = "";
        String schemaTable = ((schema != null && !schema.isEmpty()) ? schema + "." : "") + table;

        if ("mysql" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        } else if ("mariadb" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        } else if ("postgres" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        } else if ("oracle" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        } else if ("sqlserver" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        }

        if ("mysql" .equalsIgnoreCase(driver)) {
        } else if ("mariadb" .equalsIgnoreCase(driver)) {
        } else if ("postgres" .equalsIgnoreCase(driver)) {
        } else if ("oracle" .equalsIgnoreCase(driver)) {
            if ("DATE" .equalsIgnoreCase(type))
                size = null;

            String dataType = "";

            if (scale != null && !scale.isEmpty() && size != null && !size.isEmpty()) {
                dataType = (" " + type + "(" + size + "," + scale + ") ");
            } else if (size != null && !size.isEmpty()) {
                if (type.indexOf("(") < 0) {
                    dataType = " " + type + "(" + size + ") ";
                } else {
                    dataType = " " + type + " ";
                }
            } else {
                dataType = (" " + type + " ");
            }

            sql += " ADD\n";
            sql += "("
                    + field
                    + dataType
                    + (nullable != null && "Y" .equalsIgnoreCase(nullable) ? "" : "NOT NULL ")
                    + (sDefault != null && !sDefault.isEmpty() ? " DEFAULT " + sDefault : "")
                    + ");\n";
        }

        if (sRemarks != null && !sRemarks.isEmpty()) {
            sql += "\n";
            if ("mysql" .equalsIgnoreCase(driver)) {
            } else if ("mariadb" .equalsIgnoreCase(driver)) {
            } else if ("postgres" .equalsIgnoreCase(driver)) {
            } else if ("oracle" .equalsIgnoreCase(driver)) {
                sql += "COMMENT ON COLUMN " + schemaTable + "." + field
                        + " IS '" + sRemarks + "';";
            } else if ("sqlserver" .equalsIgnoreCase(driver)) {
            }
        }

        return sql;
    }


    static public String getUpdateColumnSQL(String driver, String database, String schema, String table, String field, String type, String size, String scale, String nullable, String sDefault, String sRemarks) {
        String sql = "";
        String schemaTable = ((schema != null && !schema.isEmpty()) ? schema + "." : "") + table;

        if ("mysql" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        } else if ("mariadb" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        } else if ("postgres" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        } else if ("oracle" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        } else if ("sqlserver" .equalsIgnoreCase(driver)) {
            sql = "ALTER TABLE\n" + schemaTable;
        }

        if ("mysql" .equalsIgnoreCase(driver)) {
        } else if ("mariadb" .equalsIgnoreCase(driver)) {
        } else if ("postgres" .equalsIgnoreCase(driver)) {
        } else if ("oracle" .equalsIgnoreCase(driver)) {
            if ("DATE" .equalsIgnoreCase(type))
                size = null;

            String dataType = "";

            if (scale != null && !scale.isEmpty() && size != null && !size.isEmpty()) {
                dataType = (" " + type + "(" + size + "," + scale + ") ");
            } else if (size != null && !size.isEmpty()) {
                dataType = (" " + type + "(" + size + ") ");
            } else if (type != null && !type.isEmpty()) {
                dataType = (" " + type + " ");
            }

            sql += " MODIFY\n";
            sql += "("
                    + field
                    + (dataType != null && !dataType.isEmpty() ? dataType : "")
                    + (nullable != null && "Y" .equalsIgnoreCase(nullable) ? " NULL " : (nullable != null && !"Y" .equalsIgnoreCase(nullable) ? " NOT NULL " : ""))
                    + (sDefault != null && !sDefault.isEmpty() ? " DEFAULT " + sDefault : "")
                    + ");\n";
        }

        if (sRemarks != null && !sRemarks.isEmpty()) {
            sql += "\n";
            if ("mysql" .equalsIgnoreCase(driver)) {
            } else if ("mariadb" .equalsIgnoreCase(driver)) {
            } else if ("postgres" .equalsIgnoreCase(driver)) {
            } else if ("oracle" .equalsIgnoreCase(driver)) {
                sql += "COMMENT ON COLUMN " + schemaTable + "." + field
                        + " IS '" + sRemarks + "';";
            } else if ("sqlserver" .equalsIgnoreCase(driver)) {
            }
        }

        return sql;
    }

}
