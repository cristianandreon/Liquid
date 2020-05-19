package com.liquid;

import java.io.IOException;
import java.util.ArrayList;
import java.sql.*;
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
     *
     * CA : 30-ott-2019
     *
     * Gestione cache dei metadati Lettura della colonna COLUMN_DEF a tipo dato
     * LONG molto lenta : Da rimuovere l'utilizzo della ColumnDef dal framework
     *
     ***********************************
     */
    static boolean IsMetadataCacheEnabled = true;

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
            isNullable = "yes".equalsIgnoreCase(_isNullable) || "1".equalsIgnoreCase(_isNullable) || "s".equalsIgnoreCase(_isNullable);
            columnDef = _columnDef;
            try {
                digits = Integer.parseInt(_digits);
            } catch (Throwable th) {
            }
            autoIncString = "yes".equalsIgnoreCase(_autoIncString) || "1".equalsIgnoreCase(_autoIncString) || "s".equalsIgnoreCase(_autoIncString);
            
            sourceCatalog = _sourceCatalog;
            sourceSchema = _sourceSchema;
            sourceTable = _sourceTable;
            sourceDataType = sourceDataType;
            sourceIsGenerated = sourceIsGenerated;
        }
    }

    static class MetaDataTable {

        String name, schema;
        ArrayList<MetaDataCol> metaDataCols;

        MetaDataTable(String _name, String _schema, ArrayList<MetaDataCol> _metaDataCols) {
            name = _name != null ? _name : "";
            schema = _schema != null ? _schema : "";
            metaDataCols = _metaDataCols;
        }
    }

    static String metaDataTableSchema = null;
    public static ArrayList<MetaDataTable> metaDataTable = new ArrayList<MetaDataTable>();

    
    
    public static Object readTableMetadata(Connection conn, String tableDatabase, String tableSchema, String tableName, String tableColumnName) {
    	return readTableMetadata(conn, tableDatabase, tableSchema, tableName, tableColumnName, true);    	
    }
    
    public static Object readTableMetadata(Connection conn, String tableDatabase, String tableSchema, String tableName, String tableColumnName, boolean _bReadDefault) {
        Connection connToDB = null, connToUse = conn;
        int recCount = 0;
        int nTable = 0;            

        try {
            
            if(tableName != null && !tableName.isEmpty()) {
                if (tableColumnName != null) {
                    Object mdCol = getTableMetadata(conn, tableSchema, tableName, tableColumnName);
                    if (mdCol != null) {
                        return mdCol;
                    }
                }

                String driver = db.getDriver(conn);
                boolean bReadDefault = _bReadDefault;
                if("oracle".equalsIgnoreCase(driver)) {
                    return readTableMetadataBySQL(conn, tableSchema, tableName, tableColumnName, "oracle");
                }
                
                
                if(tableDatabase == null || tableDatabase.isEmpty()) {
                    tableDatabase = conn.getCatalog();
                } else {
                    conn.setCatalog(tableDatabase);
                    String db = conn.getCatalog();
                    if(!db.equalsIgnoreCase(tableDatabase)) {
                        // set catalog not supported : connect to different DB
                        connToUse = connToDB = connection.getDBConnection(tableDatabase);
                    }
                }
                
                
                long msTrace = System.currentTimeMillis();
                DatabaseMetaData databaseMetaData = connToUse.getMetaData();
                ResultSet rs = databaseMetaData.getColumns(tableDatabase, tableSchema, tableName, null);
                ArrayList<MetaDataCol> metaDataCols = new ArrayList<MetaDataCol>();
                
                while(rs.next()) {
                    String columnName = rs.getString("COLUMN_NAME");
                    String datatype = rs.getString("DATA_TYPE");
                    String typeName = rs.getString("TYPE_NAME");
                    String columnsize = rs.getString("COLUMN_SIZE");
                    String decimaldigits = rs.getString("DECIMAL_DIGITS");
                    String isNullable = rs.getString("IS_NULLABLE");
                    String columnRemarks = rs.getString("REMARKS");
                    String autoIncString = rs.getString("IS_AUTOINCREMENT");
                    String columnDefault = null;

                    // N.B.. ORACLE MERDA : lettura del campo default problematica
                    try {
                        columnDefault = bReadDefault ? rs.getString("COLUMN_DEF") : null;
                    } catch (Throwable th) {
                        try {
                            Object columnDefaultObj = bReadDefault ? rs.getObject("COLUMN_DEF") : null;
                            if(columnDefaultObj != null) {
                                columnDefault = columnDefaultObj.toString();
                            }
                        } catch (Throwable th2) {
                            System.err.println("readTableMetadata() error : " + th2.getMessage() + " reading deafult on column:"+tableName+"."+columnName);
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
                    
                    MetaDataCol metaDataCol = new MetaDataCol(columnName, datatype, typeName, columnRemarks, columnsize, isNullable, columnDefault, decimaldigits, autoIncString, sourceCatalog, sourceSchema, sourceTable, sourceDataType, sourceIsGenerated);
                    metaDataCols.add(metaDataCol);
                    recCount++;
                }
                rs.close();

                
                if(_bReadDefault) {
                    if("oracle".equalsIgnoreCase(driver)) {
                        String stmtSQL = "SELECT COLUMN_NAME, DATA_DEFAULT from DBA_TAB_COLUMNS where DATA_DEFAULT is not null and TABLE_NAME = '"+tableName+"'";
                        Statement stmt = conn.createStatement();
                        stmt.setFetchSize(8 * 1024);
                        rs = stmt.executeQuery(stmtSQL);
                        while (rs.next()) {
                            String col = rs.getString(1);
                            String def = rs.getString(2);
                            for(int i=0; i<metaDataCols.size(); i++) {
                                MetaDataCol metaDataCol = metaDataCols.get(i);
                                if(metaDataCol.name.equalsIgnoreCase(col)) {
                                    metaDataCol.columnDef = def;
                                }
                            }
                        }
                        rs.close();
                    }
                }
                
                metaDataTable.add(new MetaDataTable(tableName, tableSchema, metaDataCols));
                System.out.println("Read meatadata on table: " + tableSchema + "." + tableName + " recCount:" + recCount + " Tempo lettura :" + (System.currentTimeMillis() - msTrace));

                if (tableColumnName != null) {
                    Object foundMcol = getTableMetadata(conn, tableSchema, tableName, tableColumnName);
                    if(foundMcol == null) {
                        System.err.println("readTableMetadata() error: on table:" + tableSchema + "." + tableName + " Column just added not found...maybe you are adding not exiasting column");
                        // Add dummy data to avoid adding loop
                        MetaDataCol metaDataCol = new MetaDataCol(tableColumnName, "", "", "", "", "", "", "", "", "", "", "", "", "");
                        metaDataCols.add(metaDataCol);
                        metaDataTable.add(new MetaDataTable(tableName, tableSchema, metaDataCols));
                    }
                    return foundMcol;
                }
            }

        } catch (Exception e) {
            System.err.println("readTableMetadata() error : " + e.getMessage());
        } finally {
            if(connToDB != null) 
                try {
                    connToDB.close();
            } catch (SQLException ex) {
                Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return null;
    }
    
    // Legge in soluzione unica tutte le tabelle dello schema(owner)
    public static Object readTableMetadataBySQL(Connection conn, String tableSchema, String tableName, String tableColumnName, String dialet) {

        try {

            if (!IsMetadataCacheEnabled) {
                return null;
            }

            if (tableColumnName != null) {
                Object mdCol = getTableMetadata(conn, tableSchema, tableName, tableColumnName);
                if (mdCol != null) {
                    return mdCol;
                }
            }

            if (metaDataTable.size() == 0) {
                long msTrace = System.currentTimeMillis();

                if (metaDataTableSchema == null) {
                    metaDataTableSchema = conn.getMetaData().getUserName();
                }

                if (tableSchema == null || tableSchema.isEmpty()) {
                    tableSchema = metaDataTableSchema;
                }

                // System.err.println(" getFetchSize:"+stmt.getFetchSize());
                // System.err.println(" getMaxFieldSize:"+stmt.getMaxFieldSize());
                // System.err.println(" getMaxRows"+stmt.getMaxRows());
                // ResultSet rs = stmt.executeQuery("select COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,DATA_DEFAULT,DATA_PRECISION from ALL_TAB_COLUMNS where TABLE_NAME='"+tableName+"' and OWNER='"+tableSchema+"'");
                /* Non si riesce a fare il cast su DATA_DEFAULT, e la UNION fallisce perchè i due recordset hanno tipo dato diverso */
                /*
                    String [] quewryList = {
                    "SELECT OWNER,TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'DATA_DEFAULT',DATA_PRECISION FROM ALL_TAB_COLUMNS WHERE OWNER = 'GEDIPROD' AND TABLE_NAME in "+ 
                    "("+
                        "SELECT TABLE_NAME FROM all_objects WHERE object_type in ('TABLE','VIEW') AND OWNER = 'GEDIPROD'"+
                    ")"+
                    "UNION"+
                    "("+
                        "SELECT OWNER,TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'DATA_DEFAULT',DATA_PRECISION FROM ALL_TAB_COLUMNS WHERE (OWNER,TABLE_NAME) in "+ 
                        "("+
                            "SELECT TABLE_OWNER,TABLE_NAME FROM all_synonyms WHERE OWNER = 'GEDIPROD' AND TABLE_NAME in "+
                            "("+
                                "SELECT OBJECT_NAME FROM all_objects WHERE object_type='SYNONYM' AND OWNER = 'GEDIPROD'"+
                            ")"+
                        ")"+
                    ")"
                    };
                 */
                

                String[] queryList = null;
        
                String[] oracleQueryList = {
                    // tabelle e viste
                    "SELECT OWNER,TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'',DATA_PRECISION FROM ALL_TAB_COLUMNS WHERE OWNER = '" + tableSchema + "' AND TABLE_NAME in "
                    + "("
                    + "SELECT TABLE_NAME FROM all_objects WHERE object_type in ('TABLE','VIEW') AND OWNER = '" + tableSchema + "' AND TABLE_NAME='"+tableName+"'"
                    + ") ORDER BY 2,3"
                    
                    // sinonimi
                    ,"SELECT OWNER,TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'',DATA_PRECISION FROM ALL_TAB_COLUMNS WHERE (OWNER,TABLE_NAME) in "
                    + "("
                    + "SELECT TABLE_OWNER,TABLE_NAME FROM all_synonyms WHERE OWNER = '" + tableSchema + "' AND TABLE_NAME in "
                    + "("
                    + "SELECT OBJECT_NAME FROM all_objects WHERE object_type='SYNONYM' AND OWNER = '" + tableSchema + "' AND TABLE_NAME='"+tableName+"'"
                    + ")"
                    + ") ORDER BY 2,3"
                };

                // TODO : lettura information_schema
                String[] postgresQueryList = {
                    // tabelle
                    "SELECT OWNER,TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'',DATA_PRECISION FROM information_schema.columns WHERE OWNER = '" + tableSchema + "' AND TABLE_NAME in "
                    + "("
                    + "SELECT TABLE_NAME FROM information_schema.tables WHERE OWNER = '" + tableSchema + "'"
                    + ") ORDER BY 2,3"
                    
                    // viste
                    ,"SELECT OWNER,TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'',DATA_PRECISION FROM information_schema.columns WHERE OWNER = '" + tableSchema + "' AND TABLE_NAME in "
                    + "("
                    + "SELECT TABLE_NAME FROM information_schema.views WHERE AND OWNER = '" + tableSchema + "'"
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
                
                if("oracle".equalsIgnoreCase(dialet)) {
                    queryList = oracleQueryList;
                } else if("postgres".equalsIgnoreCase(dialet)) {
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

                    System.err.println(" Tempo esecuzione query :" + (System.currentTimeMillis() - msTrace));
                    
                    recCount = 0;

                    while (rs.next()) {

                        String owner = rs.getString(1);
                        String table = rs.getString(2);
                        
                        String autoIncString = null;

                        String typeName = rs.getString(4);
                        String sqlType = oracleToSqlType(typeName);

                        String sourceCatalog = null; // rs.getString("SCOPE_CATALOG");
                        String sourceSchema = null; // rs.getString("SCOPE_SCHEMA");
                        String sourceTable = null; // rs.getString("SCOPE_TABLE");
                        String sourceDataType = null; // rs.getString("SOURCE_DATA_TYPE");
                        String sourceIsGenerated = null; // rs.getString("IS_GENERATEDCOLUMN");
                        
                        // Colonne :
                        // OWNER,TABLE_NAME,
                        // COLUMN_NAME,DATA_TYPE,DATA_LENGTH,NULLABLE,'DATA_DEFAULT',DATA_PRECISION
                        // MetaDataCol(String _name, String _datatype, String _remarks, String _size, String _isNullable, String _columnDef, String _digits) {
                        MetaDataCol metaDataCol = new MetaDataCol(rs.getString(3), sqlType, typeName, null, rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), autoIncString, sourceCatalog, sourceSchema, sourceTable, sourceDataType, sourceIsGenerated);
                        metaDataCols.add(metaDataCol);
                        recCount++;
                    }
                    rs.close();
                    
                    if(recCount > 0) {
                        nTable++;

                        // ORACLE MERDA : lettura DATA_DEFAULT
                        if("oracle".equalsIgnoreCase(dialet)) {
                            String stmtSQL = "SELECT COLUMN_NAME, DATA_DEFAULT from DBA_TAB_COLUMNS where DATA_DEFAULT is not null and TABLE_NAME = '"+tableName+"'";
                            Statement stmtc = conn.createStatement();
                            stmtc.setFetchSize(8 * 1024);
                            ResultSet rsc = stmtc.executeQuery(stmtSQL);
                            while (rsc.next()) {
                                String col = rsc.getString(1);
                                String def = rsc.getString(2);
                                for(int i=0; i<metaDataCols.size(); i++) {
                                    MetaDataCol metaDataCol2 = metaDataCols.get(i);
                                    if(metaDataCol2.name.equalsIgnoreCase(col)) {
                                        metaDataCol2.columnDef = def;
                                        break;
                                    }
                                }
                            }
                            rsc.close();
                            stmtc.close();
                        }
                        metaDataTable.add(new MetaDataTable(tableName, tableSchema, metaDataCols));
                        System.err.println(" Letta tabella n." + nTable + " : " + tableSchema + "." + tableSchema + "...");
                    }
                }
                stmt.close();                
                
                System.err.println("Read meatadata on table: " + tableSchema + "." + tableName + " recCount:" + recCount + " Tempo lettura :" + (System.currentTimeMillis() - msTrace));

                if (tableColumnName != null) {
                    return getTableMetadata(conn, tableSchema, tableName, tableColumnName);
                }
            }

        } catch (Exception e) {
            System.err.println("readTableMetadataBySQL() error : " + e.getMessage());
        }

        return null;
    }

    // uso interno
    static private Object getTableMetadata(Connection conn, String tableSchema, String tableName, String tableColumnName) {
        MetaDataCol foundMdCol = null;
        MetaDataTable mdTable = null;
        MetaDataCol mdCol = null;

        if (!IsMetadataCacheEnabled) {
            return null;
        }

        try {
            for (int i = 0; i < metaDataTable.size(); i++) {
                mdTable = metaDataTable.get(i);
                if (mdTable.name.equalsIgnoreCase(tableName)) {
                    if (mdTable.schema.equalsIgnoreCase(tableSchema) || tableSchema == null) {
                        if (mdTable.metaDataCols != null) {
                            for(int istep=0; istep<2; istep++) {
                                for (int j = 0; j < mdTable.metaDataCols.size(); j++) {
                                    mdCol = mdTable.metaDataCols.get(j);
                                    boolean condition = istep > 0 ? (mdCol.name.equalsIgnoreCase(tableColumnName)) : (mdCol.name.equals(tableColumnName));
                                    if (condition) {
                                        // Assegna il risultato
                                        foundMdCol = mdCol;
                                        condition = istep > 0 ? (mdTable.schema.equalsIgnoreCase(tableSchema) || (tableSchema == null && mdTable.schema.equalsIgnoreCase(metaDataTableSchema))) : (mdTable.schema.equals(tableSchema) || (tableSchema == null && mdTable.schema.equals(metaDataTableSchema)));
                                        if (condition) {
                                            // schema coincidente o schema tabella = schema utente DataSource (prioritario)
                                            return (Object)mdCol;
                                        }
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
                System.err.println("Field not in cache : " + tableSchema + "." + tableName + "." + tableColumnName + " .. dumping table's columns cache");
                for (int i = 0; i < metaDataTable.size(); i++) {
                    mdTable = metaDataTable.get(i);
                    if (mdTable.name.equalsIgnoreCase(tableName)) {
                        String sAllColumns = "";
                        for (int ic = 0; ic < mdTable.metaDataCols.size(); ic++) {
                            sAllColumns += mdTable.metaDataCols.get(ic).name + ",";
                        }
                        bTableFound = true;
                        System.err.println(" tableName:" + mdTable.name + " all cols:" + sAllColumns);
                    }
                }
                if (!bTableFound) {
                    System.err.println(" Table: " + tableSchema + "." + tableName + " not found");
                } else {
                    System.err.println(" Field : " + tableSchema + "." + tableName + "." + tableColumnName + " not found");
                }
            }
        }
        return foundMdCol;
    }
    

    
    /**
     *
     * CA : 25-apr-2020
     *
     * Definisce la mappatura fra i dati sql e le classi java
     * 
     */
    static public Class getJavaClass(int type) {                                               
        if(type == 2 || type == 4 || type == -5 || type == -6 || type == 5 || type == -7) {
            // SMALLINT	short	Integer
            // INTEGER	int	Integer
            return Integer.class;
        } else if(type == -5) {
            // BIGINT	long	Long     
            return Long.class;
        } else if(type == 3) {
            // NUMERIC	 	java.math.BigDecimal
            // DECIMAL	 	java.math.BigDecimal
            return java.math.BigDecimal.class;
        } else if(type == 7) {
            return Float.class;
        } else if(type == 8) {
            return Double.class;
        } else if(type == 6 || type == 91 || type == 92 || type == 93) {
            return Date.class;
        }
        return String.class;
    }

        
    static public String oracleToSqlType(String type) {
        String sqlType = "1";        
        if("CHAR".equalsIgnoreCase(type) || "VARCHAR2".equalsIgnoreCase(type) || "LONG".equalsIgnoreCase(type)) {
        } else if("NUMBER".equalsIgnoreCase(type) || "BINARY_INTEGER".equalsIgnoreCase(type)) {
            sqlType = "4";
        } else if("BINARY_FLOAT".equalsIgnoreCase(type) || "FLOAT".equalsIgnoreCase(type)) {
            sqlType = "7";
        } else if("BINARY_DOUBLE".equalsIgnoreCase(type) || "DOUBLE".equalsIgnoreCase(type)) {
            sqlType = "8";
        } else if("DATE".equalsIgnoreCase(type) || "DATE".equalsIgnoreCase(type)) {
            sqlType = "93";
        } else if("DATETIME".equalsIgnoreCase(type)) {
            sqlType = "6";
        } else if("TIMESTAMP".equalsIgnoreCase(type) || "TIMESTAMP WITH TIME ZONE".equalsIgnoreCase(type) || "TIMESTAMP WITH LOCAL TIME ZONE".equalsIgnoreCase(type)) {
            sqlType = "91";
        }
        return sqlType;
    }
    
    static public class ForeignKey {
        String foreignTable;
        String foreignColumn;
        String column;
        String foreignWrk;
        
        public ForeignKey (String foreignTable, String foreignColumn, String column, String foreignWrk) {
            this.foreignTable = foreignTable; 
            this.foreignColumn = foreignColumn;
            this.column = column;
            this.foreignWrk = foreignWrk;
        }
        public ForeignKey () {
            this.foreignTable = null; 
            this.foreignColumn = null;
            this.column = null;
            this.foreignWrk = null;
        }
    }
    
    
    static public Object [] getAllDatabases(String database, Connection conn, boolean bUserFieldIdentificator) {
        int nRec = 0;
        String result = "";
        try {
            // if(database == null || database.isEmpty()) database = conn.getCatalog();
            ArrayList<String> databaseList = new ArrayList<String>();
            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = dm.getCatalogs();      
            if(rs != null) {
                result += "[";
                while (rs.next()) {                
                    if( ("*".equalsIgnoreCase(database) || database == null) || (database != null && database.equalsIgnoreCase(rs.getString("TABLE_CAT"))) ) {
                        String databaseName = rs.getString("TABLE_CAT");
                        if(databaseList.indexOf(databaseName) < 0) {
                            if(BlackWhiteList.isAccessible(database, "", "")) {
                                databaseList.add(databaseName);
                                result += nRec > 0 ? "," : "";
                                result += "{";
                                result += "\""+(bUserFieldIdentificator?"1":"DATABASE")+"\":\""+databaseName+"\"";
                                result += ",\""+(bUserFieldIdentificator?"2":"REMARKS")+"\":\""+""+"\"";
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
        return new Object[] { (Object)result, (Object)nRec };
    }

    static public Object [] getAllSchemas(String database, String schema, Connection conn, boolean bUserFieldIdentificator) {
        int nRec = 0;
        String result = "";
        try {
            ArrayList<String> schemaList = new ArrayList<String>();
            String[] types = { "TABLE" };

            if(database == null || database.isEmpty())
                database = conn.getCatalog();            
            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = null;
            boolean useGetSchemas = false;
            String driver = db.getDriver(conn);
            if("oracle".equalsIgnoreCase(driver)) {
                useGetSchemas = true;
                rs = dm.getSchemas();
            } else {
                rs = dm.getTables(database, null, "%", types);
            }
            if(rs != null) {
                result += "[";
                while (rs.next()) {
                    String databaseName = "";
                    String schemaName = "";
                    if(useGetSchemas) {
                        databaseName = rs.getString("TABLE_CATALOG");
                        schemaName = rs.getString("TABLE_SCHEM");
                    } else {
                        databaseName = rs.getString("TABLE_CAT");
                        schemaName = rs.getString("TABLE_SCHEM");
                    }
                    // System.err.println("TABLE_CAT:"+databaseName+" TABLE_SCHEM:"+schemaName+"");
                    if( ("*".equalsIgnoreCase(database) || database == null) 
                        || (database != null && databaseName != null && databaseName.contains(database)) 
                        || (database != null && databaseName == null) 
                        )  {
                        if( ("*".equalsIgnoreCase(schema) || schema == null) 
                            || (schema != null && schemaName != null && schemaName.contains(schema)) 
                            || (schema == null && schemaName != null) 
                            ) {
                            if(schemaList.indexOf(schemaName) < 0) {
                                if(BlackWhiteList.isAccessible(database, schema, "")) {
                                    schemaList.add(schemaName);
                                    result += nRec > 0 ? "," : "";
                                    result += "{";
                                    result += "\""+(bUserFieldIdentificator?"1":"CATALOG")+"\":\""+(databaseName != null ? databaseName : (database != null ? database : ""))+"\"";
                                    result += ",\""+(bUserFieldIdentificator?"2":"SCHEMA")+"\":\""+(schemaName != null ? schemaName : "")+"\"";
                                    result += ",\""+(bUserFieldIdentificator?"3":"REMARKS")+"\":\""+""+"\"";
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
        return new Object[] { (Object)result, (Object)nRec };
    }

    static public Object [] getAllTables(String database, String schema, String table, String view, Connection conn, boolean bUserFieldIdentificator) {
        int nRec = 0;
        String result = "";
        String [] types = { "", "", "" };
        try {
            if(table != null) types[0] = "TABLE";
            if(view != null) types[1] = "VIEW";
            if(database == null || database.isEmpty())
                database = conn.getCatalog();
            if(schema == null || schema.isEmpty())
                 schema = conn.getMetaData().getUserName();
            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = dm.getTables(database, schema, null, types );
            if(rs != null) {
                result += "[";
                while (rs.next()) {                
                    String resultShcema = rs.getString("TABLE_SCHEM");
                    if( (schema == null && !"information_schema".equalsIgnoreCase(resultShcema)) 
                     || (schema != null && schema.equalsIgnoreCase(resultShcema) ) 
                     || (schema != null && resultShcema == null) 
                     || (schema != null && schema.equalsIgnoreCase(resultShcema))
                    ) {
                        if(BlackWhiteList.isAccessible(database, schema, table)) {
                            result += nRec > 0 ? "," : "";
                            result += "{";
                            result += "\""+(bUserFieldIdentificator?"1":"TABLE")+"\":\""+rs.getString("TABLE_NAME")+"\"";
                            result += ",\""+(bUserFieldIdentificator?"2":"TYPE")+"\":\""+rs.getString("TABLE_TYPE")+"\"";
                            result += ",\""+(bUserFieldIdentificator?"3":"REMARKS")+"\":\""+rs.getString("REMARKS")+"\"";
                            result += "}";
                            nRec++;
                        }
                    }
                }
                result += "]";
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        }
        return new Object[] { (Object)result, (Object)nRec };
    }
    
    static public Object [] getAllColumns(String database, String schema, String tableName, Connection conn, boolean bUserFieldIdentificator) {
        int nRec = 0;
        String result = "";
        try {
            if(database == null || database.isEmpty())
                database = conn.getCatalog();
            if(schema == null || schema.isEmpty())
                 schema = conn.getMetaData().getUserName();
            
            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = dm.getColumns(database, schema, tableName, null);
            if(rs != null) {
                result += "[";
                while (rs.next()) {
                    String resultShcema = rs.getString("TABLE_SCHEM");
                    if( (schema == null && !"information_schema".equalsIgnoreCase(resultShcema))
                            || (schema != null && resultShcema == null)
                            ||  (schema != null && schema.equalsIgnoreCase(resultShcema))
                            ) {
                        result += nRec > 0 ? "," : "";
                        result += "{";
                        result += "\""+(bUserFieldIdentificator?"1":"TABLE")+"\":\""+(rs.getString("TABLE_NAME") != null ? rs.getString("TABLE_NAME") : "")+"\"";
                        result += ",\""+(bUserFieldIdentificator?"2":"COLUMN")+"\":\""+(rs.getString("COLUMN_NAME") != null ? rs.getString("COLUMN_NAME") : "")+"\"";
                        result += ",\""+(bUserFieldIdentificator?"3":"REMARKS")+"\":\""+(rs.getString("REMARKS") != null ? rs.getString("REMARKS") : "")+"\"";
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
        return new Object[] { (Object)result, (Object)nRec };
    }
   
    static public ArrayList<String> getAllColumnsAsArray(String database, String schema, String tableName, Connection conn) {
        ArrayList<String> result = new ArrayList<String>();
        Connection connToDB = null, connToUse = conn;
        try {
            if(database == null || database.isEmpty()) {
                database = conn.getCatalog();
            } else {
                conn.setCatalog(database);
                String db = conn.getCatalog();
                if(!db.equalsIgnoreCase(database)) {
                    // set catalog not supported : connect to different DB
                    connToUse = connToDB = connection.getDBConnection(database);
                }
            }
            if(schema == null || schema.isEmpty())
                schema = connToUse.getMetaData().getUserName();
            
            DatabaseMetaData dm = connToUse.getMetaData();
            ResultSet rs = dm.getColumns(database, schema, tableName, null);
            if(rs != null) {
                while(rs.next()) {
                    String resultShcema = rs.getString("TABLE_SCHEM");
                    if(     (schema == null && !"information_schema".equalsIgnoreCase(resultShcema))
                        ||  (schema != null && resultShcema == null)
                        ||  (schema != null && schema.equalsIgnoreCase(resultShcema))
                        ) {
                        result.add(rs.getString("COLUMN_NAME"));
                    }
                }
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        } finally {
            if(connToDB != null) 
                try {
                    connToDB.close();
            } catch (SQLException ex) {
                Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return result;
    }
            

    static public Object [] getAllForeignKeys(String database, String schema, String table, Connection conn, boolean bUserFieldIdentificator) {
        int nRec = 0;
        String result = "";
        String [] types = { "", "", "" };
        try {
            if(database == null || database.isEmpty())
                database = conn.getCatalog();
            if(schema == null || schema.isEmpty())
                 schema = conn.getMetaData().getUserName();
            if(table != null && !table.isEmpty()) {
                ArrayList<ForeignKey> foreignKeys = getForeignKeyData(database, schema, table, conn);
                if(foreignKeys != null) {
                    result += "[";
                    for(int i=0; i<foreignKeys.size(); i++) {
                        ForeignKey foreignKey = foreignKeys.get(i);
                        if(foreignKey != null) {
                            result += nRec > 0 ? "," : "";
                            result += "{";
                            result += "\""+(bUserFieldIdentificator?"1":"ID")+"\":\""+(nRec+1)+"\"";
                            result += ",\""+(bUserFieldIdentificator?"2":"TABLE")+"\":\""+table+"\"";
                            result += ",\""+(bUserFieldIdentificator?"3":"COLUMN")+"\":\""+foreignKey.column+"\"";
                            result += ",\""+(bUserFieldIdentificator?"4":"FOREIGN_TABLE")+"\":\""+foreignKey.foreignTable+"\"";
                            result += ",\""+(bUserFieldIdentificator?"5":"FOREIGN_COLUMN")+"\":\""+foreignKey.foreignColumn+"\"";
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
        return new Object[] { (Object)result, (Object)nRec };
    }

    static public ArrayList<ForeignKey> getForeignKeyData(String database, String schema, String tableName, Connection conn) {
        ArrayList<ForeignKey> result = new ArrayList<ForeignKey>();
        try {
            DatabaseMetaData dm = conn.getMetaData();
            ResultSet rs = dm.getImportedKeys((database != null && database.isEmpty() ? database : null), schema, ("*".equalsIgnoreCase(tableName) ? "" : tableName) );
            // ResultSet rs = dm.getImportedKeys(null, null, null);
            if(rs != null) {
                while (rs.next()) {
                    String resultDatabase = rs.getString("FKTABLE_CAT");
                    String resultSchema = rs.getString("FKTABLE_SCHEM");
                    String resultTable = rs.getString("FKTABLE_NAME");
    
                    if(    (database == null && resultDatabase == null)
                        || (database != null && resultDatabase != null && database.equalsIgnoreCase(resultDatabase))
                        || (database == null && resultDatabase != null)
                        || (database != null && resultDatabase == null)
                        ) {
                        if(    (schema == null && resultSchema == null)
                            || (schema != null && resultSchema != null && schema.equalsIgnoreCase(resultSchema))
                            || (schema == null && resultSchema != null)
                            || (schema != null && resultSchema == null)
                            ) {
                            if(    (tableName == null && resultTable == null)
                                || (tableName != null && resultTable != null && tableName.equalsIgnoreCase(resultTable))
                                || (tableName == null && resultTable != null)
                                ) {
            
                                ForeignKey foreignTable = new ForeignKey();
                                foreignTable.foreignTable = rs.getString("PKTABLE_NAME");
                                foreignTable.foreignColumn = rs.getString("PKCOLUMN_NAME");
                                foreignTable.column = rs.getString("FKCOLUMN_NAME");
                                foreignTable.foreignWrk = foreignTable.foreignTable+".default";
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
    
    static public String getPrimaryKeyData(String database, String schema, String tableName, Connection conn) {
        Connection connToDB = null, connToUse = conn;
        String result = null;
        try {
            if(database == null || database.isEmpty()) {
                database = conn.getCatalog();
            } else {
                conn.setCatalog(database);
                String db = conn.getCatalog();
                if(!db.equalsIgnoreCase(database)) {
                    // set catalog not supported : connect to different DB
                    connToUse = connToDB = connection.getDBConnection(database);
                }
            }
            
            DatabaseMetaData dm = connToUse.getMetaData();
            ResultSet rs = dm.getPrimaryKeys(database, schema, tableName);
            if(rs != null) {
                if(rs.next()) {
                    result = rs.getString("COLUMN_NAME");
                }
                rs.close();
            }
        } catch (SQLException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        } finally {
            if(connToDB != null) 
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
                conn = connection.getDBConnection();
                if(conn != null) {
                    result = searchOnDatabases(database, schema, table, conn, search, out);
                }
            } finally {
                try {
                    if(conn != null)
                        conn.close();
                } catch (SQLException ex) {
                    Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
            
            if(out != null)
                out.print("<LiquidStartResponde/>");
            
        }   catch (IOException ex) {
            Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
        }
        return result;
    }
        
    static public String searchOnDatabases(String database, String schema, String table, Connection conn, String search, JspWriter out) {
        int nDatabaseSearch = 0;
        int nSchemaSearch = 0;
        int nTbableSearch = 0;
        int nColumnSearch = 0;
        int nRecFound = 0;

        if (database != null && database.isEmpty() || "*".equalsIgnoreCase(database))
            database = null;
        if (schema != null && schema.isEmpty() || "*".equalsIgnoreCase(schema))
            schema = null;
        if (table != null && table.isEmpty() || "*".equalsIgnoreCase(table))
            table = null;

        String curStatus = "";
        String driver = null;
        String[] types = { "TABLE", "VIEW" };
        
        String tblHtml = "<table cellspacing=\"0\" cellpadding=\"10\" class=\"liquidFoundTable\">";        
        String recHtml = "";

        tblHtml += append_to_found_record(null, null, null, null, null, null, null);
        
        try {
            driver = db.getDriver(conn);
        } catch (SQLException e) {
        }
        
        if(search != null && !search.isEmpty()) {
                
            try {
                ArrayList<String> databaseList = new ArrayList<String>();
                DatabaseMetaData dm = conn.getMetaData();
                ResultSet rs = dm.getCatalogs();      
                if(rs != null) {
                    while (rs.next()) {                
                        if( ("*".equalsIgnoreCase(database) || database == null) || (database != null && database.equalsIgnoreCase(rs.getString("TABLE_CAT"))) ) {
                            String databaseName = rs.getString("TABLE_CAT");
                            if(databaseList.indexOf(databaseName) < 0) {
                                databaseList.add(databaseName);
                                nDatabaseSearch++;
                                curStatus = "Adding Database:"+databaseName;
                                out.print("<Liquid>" + curStatus + "</Liquid>");
                                
                            }
                        }
                    }
                    rs.close();
                }

                if(database == null || database.isEmpty()) {
                    if(databaseList.size() == 0) {
                        databaseList.add(null);
                        nDatabaseSearch++;
                    }
                }

                for (int idb=0; idb<databaseList.size(); idb++) {
                    String db = databaseList.get(idb);
                    ArrayList<String> schemaList = new ArrayList<String>();
                	boolean useGetSchemas = false;
                    try {
                        if("oracle".equalsIgnoreCase(driver)) {
                            useGetSchemas = true;
                            rs = dm.getSchemas();
                        } else {
                            rs = dm.getTables(db, null, "%", types);
                        }
                        if(rs != null) {
                            while (rs.next()) {                
                                String databaseName = "";
                                String schemaName = "";
                                if(useGetSchemas) {
                                    databaseName = rs.getString("TABLE_CATALOG");
                                    schemaName = rs.getString("TABLE_SCHEM");
                                } else {
                                    databaseName = rs.getString("TABLE_CAT");
                                    schemaName = rs.getString("TABLE_SCHEM");
                                }
                                // System.err.println("TABLE_CAT:"+databaseName+" TABLE_SCHEM:"+schemaName+"");
                                if( "*".equalsIgnoreCase(database) 
                            		|| (db == null && database == null) 
                                    || (db != null && databaseName != null && databaseName.contains(db)) 
                                    || (db != null && databaseName == null) 
                                    )  {
                                    if( "*".equalsIgnoreCase(schema) 
                                		|| (schema == null && schemaName == null) 
                                        || (schema != null && schemaName != null && schemaName.contains(schema)) 
                                        || (schema == null && schemaName != null)
                                        ) {
                                        if(schemaList.indexOf(schemaName) < 0) {
                                            schemaList.add(schemaName);
                                            nSchemaSearch++;
                                            curStatus = "Adding Database:"+db+" Schema:"+schemaName;
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

                    for (int is=0; is<schemaList.size(); is++) {
                        String scm = schemaList.get(is);
                        ArrayList<String> tableList = new ArrayList<String>();
                        ArrayList<String> tableRemarksList = new ArrayList<String>();
                        try {
                            rs = dm.getTables(db, scm, table, types );
                            if(rs != null) {
                                while (rs.next()) {                
                                    String resultShcema = rs.getString("TABLE_SCHEM");
                                    String resultTable = rs.getString("TABLE_NAME");
                                    String resultTableRemarks = rs.getString("REMARKS");
                                    if( (schema == null && !"information_schema".equalsIgnoreCase(resultShcema)) 
                                     || (schema != null && schema.equalsIgnoreCase(resultShcema) ) 
                                     || (schema != null && resultShcema == null) 
                                     || (schema != null && schema.equalsIgnoreCase(resultShcema))
                                    ) {
                                        if( (table == null && !"information_schema".equalsIgnoreCase(resultTable)) 
                                         || (table != null && schema.equalsIgnoreCase(resultTable) ) 
                                         || (table != null && resultTable == null) 
                                         || (table != null && schema.equalsIgnoreCase(resultTable))
                                        ) {
                                            tableList.add(resultTable);
                                            tableRemarksList.add(resultTableRemarks);
                                            nTbableSearch++;

                                            curStatus = "Adding Database:"+db+" Schema:"+scm+" Table:"+table;
                                            out.print("<Liquid>" + curStatus + "</Liquid>");
                                            
                                            if(resultTable != null) {
                                                if(resultTable.contains(search)) {
                                                    recHtml = append_to_found_record("Table name", db, scm, resultTable, "", resultTable, search);
                                                    nRecFound++;
                                                }
                                            }
                                            if(resultTableRemarks != null) {
                                                if(resultTableRemarks.contains(search)) {
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

                        for (int it=0; it<tableList.size(); it++) {
                            String tbl = tableList.get(it);
                            ArrayList<String> labelList = new ArrayList<String>();
                            ArrayList<String> remarksList = new ArrayList<String>();
                            try {
                                rs = dm.getColumns(db, scm, tbl, null);
                                if(rs != null) {
                                    while (rs.next()) {
                                        labelList.add( rs.getString("COLUMN_NAME") );
                                        remarksList.add( rs.getString("REMARKS") );
                                    }
                                    rs.close();
                                }
                            } catch (SQLException ex) {
                                Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
                            }

                            for (int ic=0; ic<labelList.size(); ic++) {
                                String label = labelList.get(ic);
                                recHtml = "";
                                if(label != null) {
                                    if(label.contains(search)) {
                                        recHtml = append_to_found_record("Label", db, scm, tbl, label, label, search);
                                        nRecFound++;
                                    }
                                }
                                String remarks = remarksList.get(ic);
                                if(remarks != null) {
                                    if(remarks.contains(search)) {
                                        recHtml = append_to_found_record("Remarks", db, scm, tbl, label, remarks, search);
                                        nRecFound++;
                                    }
                                }
                                tblHtml += recHtml;
                                nColumnSearch++;
                                
                                curStatus = "Searching on Database:"+db+" ("+(idb+1)+"/"+databaseList.size()+")"+ " Schema:"+scm+" ("+(is+1)+"/"+schemaList.size()+")" + " Table:"+tbl+" ("+(it+1)+"/"+tableList.size()+")" + " Columns:"+label+" ("+(ic+1)+"/"+labelList.size()+")";
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

                if(nRecFound == 0) {
                    recHtml += "<tr>";
                    recHtml += "<td colspan=\"6\">";
                    recHtml += "No data match '"+search+"'";
                    recHtml += "</td>";
                    recHtml += "</tr>";
                }
                
                recHtml += "<tr>";
                recHtml += "<td colspan=\"6\">";
                recHtml += "</td>";
                recHtml += "</tr>";

                
                recHtml += "<tr>";
                recHtml += "<td colspan=\"6\">";
                recHtml += "Searched in "+nDatabaseSearch+" database(s), "+nSchemaSearch+" schema(s), "+nTbableSearch+" table(s), "+nColumnSearch+" column(s)";
                recHtml += "</td>";
                recHtml += "</tr>";
                tblHtml += recHtml;
                
                tblHtml += "</table>";

            } catch(Exception ex) {
                Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return tblHtml;
    }

    
    static boolean table_exist(Connection conn, String db, String scm, String table) throws SQLException {
        DatabaseMetaData dm = conn.getMetaData();
        ResultSet rs = dm.getCatalogs();
        try {
            if(rs != null) {
                String[] types = { "TABLE", "VIEW" };
                rs = dm.getTables(db, scm, table, types );
                if(rs != null) {
                    if (rs.next()) return true;
                }
                rs = dm.getTables(db, scm, table.toLowerCase(), types );
                if(rs != null) {
                    if (rs.next()) return true;
                }
                if(rs != null) rs.close();
                rs = dm.getTables(db, scm, table.toUpperCase(), types );
                if(rs != null) {
                    if(rs.next()) return true;
                }
                if(rs != null) rs.close();
                rs = dm.getTables(db, scm, null, null );
                if(rs != null) {
                    while (rs.next()) {
                        String resultTable = rs.getString("TABLE_NAME");
                        if(resultTable != null && table.equalsIgnoreCase(resultTable))
                            return true;
                    }
                }
            }
        } finally {
            if(rs != null) rs.close();
        }
        return false;
    }
    
    static boolean create_table(Connection conn, String database, String schema, String table, JSONObject tableJson) throws SQLException, JSONException {
        boolean isOracle = false, isMySQL = false, isPostgres = false, isSqlServer = false;
        String itemIdString = "\"", tableIdString = "\"";
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        
        try {

            String driver = db.getDriver(conn);
            if("mysql".equalsIgnoreCase(driver)) {
                isMySQL = true;
            } else if("postgres".equalsIgnoreCase(driver)) {
                isPostgres = true;
            } else if("oracle".equalsIgnoreCase(driver)) {
                isOracle = true;
            } else if("sqlserver".equalsIgnoreCase(driver)) {
                isSqlServer = true;
            }
            
            if(isMySQL) {
                itemIdString = "`";
                tableIdString = "";
            }
            
            String sql = "CREATE TABLE "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ";
            
            JSONArray cols = tableJson.getJSONArray("columns");            
            for(int ic=0; ic<cols.length(); ic++) {
                JSONObject col = cols.getJSONObject(ic);
                String name = col.getString("name");
                String type = col.getString("type");
                String typeName = col.getString("typeName");
                sql += name + " " + typeName + "\n";
            }
            
            String primaryKey = tableJson.getString("primaryKey");
            sql += "PRIMARY KEY " + primaryKey + "\n";
        
            psdo = conn.prepareStatement(sql);
            rsdo = psdo.executeQuery();
            
            if(!table_exist(conn, 
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
            if(psdo != null) psdo.close();
            if(rsdo != null) rsdo.close();
        }
        return false;
    }

    
    //
    // search  in db utility func
    //
    static String append_to_found_record(String type, String database, String schema, String table, String column, String data, String searchString) {
        String recHtml = "";
        if(searchString == null) {
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
            recHtml += "<a href=\"javawcript:void(0)\" onclick=\"Liquid.onNewLiquidFromTableName('"+table+"', null, null);\" title=\"Click to create control\">"+table+"</a>";
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += column;
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += type;
            recHtml += "</td>";
            recHtml += "<td>";
            recHtml += data.substring(0, data.indexOf(searchString)) + "<span style=\"color:red\">" + searchString + "</span>" + data.substring(data.indexOf(searchString)+searchString.length());
            recHtml += "</td>";       
            recHtml += "</tr>";
        }
        return recHtml;
    }
}
