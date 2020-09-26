/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;

/**
 *
 * @author Cristitan
 */
public class TransactionList {
    
    // raggruppamento per tabella / condizione di where e tipo
        
    public String table = null;
    public String where = null;
    public String type = null;
    public String rowId = null;
    public String nodeId = null;
    public ArrayList<String> columns = null;
    public ArrayList<String> values = null;
    public ArrayList<Integer> valueTypes = null;	// 0=String	1=Expression
    public String sourceColumn = null;
    public String ids = null;
    public ArrayList<TransactionList> linkedTransactList = null;

    public ArrayList<TransactionList> transactionList = null;

    public TransactionList ( String table, String column, String value, int valueType, String sourceColumn, String where, String type ) {
        this.table = table;
        this.where = where;
        this.columns = new ArrayList<>(); this.columns.add(column);
        this.values = new ArrayList<>(); this.values.add(value);
        this.valueTypes = new ArrayList<>(); this.valueTypes.add(valueType);
        this.sourceColumn = sourceColumn;
        this.type = type;
    }
    public TransactionList ( ) {
    }
    public void add ( String _table, String _column, String _value, int _valueType, String _sourceColumn, String _where, String _type, String rowId, String nodeId ) {
        if(transactionList == null)
            transactionList = new ArrayList<>();
        for(int i=0; i<transactionList.size(); i++) {
            TransactionList ft = transactionList.get(i);
            if (ft.table.equalsIgnoreCase(_table) && ((ft.where == null && where == null) || ft.where.equalsIgnoreCase(_where)) )  {
                if(ft.columns.contains(_column)) {
                    ft.values.set(ft.columns.indexOf(_column), _value);
                    } else {
                    ft.columns.add(_column);
                    ft.values.add(_value != null ? ( _valueType != 1 ? _value.replace("'", "''") : _value ) : null);
                    ft.valueTypes.add(_valueType);
                    ft.sourceColumn = _sourceColumn;
                    ft.rowId = rowId;
                    ft.nodeId = nodeId;
                }
                return;
            }
        }
        transactionList.add(new TransactionList(_table, _column, _value, _valueType, _sourceColumn, _where, _type) );
    }
    
    public String getSQL ( workspace tbl_wrk, int i ) {
        String sql = "";
        if(i<transactionList.size()) {
            TransactionList ft = transactionList.get(i);
            String itemIdString = "\"", tableIdString = "\"";            
            if(tbl_wrk.driverClass.contains(".mysql") || tbl_wrk.driverClass.contains(".mariadb")) {
                itemIdString = "`";
                tableIdString = "";
            } else {
                itemIdString = "\"";
                tableIdString = "\"";
            }            
            if("insert".equalsIgnoreCase(ft.type)) {
                sql = "INSERT INTO "+(ft.table.startsWith(itemIdString)?"":itemIdString)+ft.table+(ft.table.endsWith(itemIdString)?"":itemIdString)+"";
                sql += " (";
                for(int ic=0; ic<ft.columns.size(); ic++)
                    sql += (ic>0?",":"") + itemIdString + ft.columns.get(ic) + itemIdString;
                sql += ") VALUES (";
                for(int ic=0; ic<ft.values.size(); ic++) {
                	String apex = ft.valueTypes.get(ic) == 1 ? "":"'";
                    sql += (ic>0?",":"") + (ft.values.get(ic) != null ? (apex + ft.values.get(ic) + apex) : "null");
                }
                sql += ")";
            } else if("update".equalsIgnoreCase(ft.type)) {
                sql = "UPDATE " +(ft.table.startsWith(itemIdString)?"":itemIdString)+ft.table+(ft.table.endsWith(itemIdString)?"":itemIdString)+"";
                sql += " SET ";
                for(int ic=0; ic<ft.columns.size(); ic++) {
                	String apex = ft.valueTypes.get(ic) == 1 ? "":"'";
                    sql += (ic>0?",":"") + itemIdString + ft.columns.get(ic) + itemIdString;
                    sql += "=";
                    sql += (ft.values.get(ic) != null ? (apex + ft.values.get(ic) + apex) : "null");
                    sql += "";
                }
                sql += " WHERE ";
                sql += ft.where;
            } else if("delete".equalsIgnoreCase(ft.type)) {
                if(ft.where != null && !ft.where.isEmpty()) {
                    sql = "DELETE FROM " +(ft.table.startsWith(itemIdString)?"":itemIdString)+ft.table+(ft.table.endsWith(itemIdString)?"":itemIdString)+"";
                    sql += " WHERE ";
                    sql += ft.where;
                }
            }
        }
        return sql;
    }
    public String getType ( workspace tbl_wrk, int i ) {
        String sql = "";
        if(i<transactionList.size()) {
            TransactionList t = transactionList.get(i);
            return t.type;
        }
        return null;
    }

    Object [] executeSQL(workspace tbl_wrk, int i, Connection conn, int RETURN_TYPE) throws SQLException {
        String sql = "";
        if(i<transactionList.size()) {
            ArrayList<String> params = new ArrayList<String>();
            TransactionList ft = transactionList.get(i);
            String itemIdString = "\"", tableIdString = "\"";            
            if(tbl_wrk.driverClass.contains(".mysql") || tbl_wrk.driverClass.contains(".mariadb")) {
                itemIdString = "`";
                tableIdString = "";
            } else {
                itemIdString = "\"";
                tableIdString = "\"";
            }            
            if("insert".equalsIgnoreCase(ft.type)) {
                sql = "INSERT INTO "+(ft.table.startsWith(itemIdString)?"":itemIdString)+ft.table+(ft.table.endsWith(itemIdString)?"":itemIdString)+"";
                sql += " (";
                for(int ic=0; ic<ft.columns.size(); ic++)
                    sql += (ic>0?",":"") + itemIdString + ft.columns.get(ic) + itemIdString;
                sql += ") VALUES (";
                for(int ic=0; ic<ft.values.size(); ic++) {
                    sql += (ic>0?",":"") + "?";
                    params.add( ft.values.get(ic) );
                }
                sql += ")";
            } else if("update".equalsIgnoreCase(ft.type)) {
                sql = "UPDATE " +(ft.table.startsWith(itemIdString)?"":itemIdString)+ft.table+(ft.table.endsWith(itemIdString)?"":itemIdString)+"";
                sql += " SET ";
                for(int ic=0; ic<ft.columns.size(); ic++) {
                    sql += (ic>0?",":"") + itemIdString + ft.columns.get(ic) + itemIdString;
                    sql += "=?";
                    params.add( ft.values.get(ic) );
                }
                sql += " WHERE ";
                sql += ft.where;
            } else if("delete".equalsIgnoreCase(ft.type)) {
                if(ft.where != null && !ft.where.isEmpty()) {
                    sql = "DELETE FROM " +(ft.table.startsWith(itemIdString)?"":itemIdString)+ft.table+(ft.table.endsWith(itemIdString)?"":itemIdString)+"";
                    sql += " WHERE ";
                    sql += ft.where;
                }
            }
            PreparedStatement stmt = conn.prepareStatement(sql, RETURN_TYPE);
            for (int ip=0; ip<params.size(); ip++) {
                stmt.setString(ip+1, params.get(ip));
            }            
            return new Object [] { stmt.executeUpdate(), stmt };
        }
        return new Object [] { -1, null };
    }
}