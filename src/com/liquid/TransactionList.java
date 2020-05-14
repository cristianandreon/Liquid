/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

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
    public String sourceColumn = null;
    public String ids = null;
    public ArrayList<TransactionList> linkedTransactList = null;

    public ArrayList<TransactionList> transactionList = null;

    public TransactionList ( String table, String column, String value, String sourceColumn, String where, String type ) {
        this.table = table;
        this.where = where;
        this.columns = new ArrayList<>(); this.columns.add(column);
        this.values = new ArrayList<>(); this.values.add(value);
        this.sourceColumn = sourceColumn;
        this.type = type;
    }
    public TransactionList ( ) {
    }
    public void add ( String _table, String _column, String _value, String _sourceColumn, String _where, String _type, String rowId, String nodeId ) {
        if(transactionList == null)
            transactionList = new ArrayList<>();
        for(int i=0; i<transactionList.size(); i++) {
            TransactionList ft = transactionList.get(i);
            if (ft.table.equalsIgnoreCase(_table) && ((ft.where == null && where == null) || ft.where.equalsIgnoreCase(_where)) )  {
                if(ft.columns.contains(_column)) {
                    ft.values.set(ft.columns.indexOf(_column), _value);
                    } else {
                    ft.columns.add(_column);
                    ft.values.add(_value);
                    ft.sourceColumn = _sourceColumn;
                    ft.rowId = rowId;
                    ft.nodeId = nodeId;
                }
                return;
            }
        }
        transactionList.add(new TransactionList(_table, _column, _value, _sourceColumn, _where, _type) );
    }
    
    public String getSQL ( workspace tbl_wrk, int i ) {
        String sql = "";
        if(i<transactionList.size()) {
            TransactionList ft = transactionList.get(i);
            String itemIdString = "\"", tableIdString = "\"";            
            if(tbl_wrk.driverClass.contains(".mysql")) {
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
                for(int ic=0; ic<ft.values.size(); ic++)
                    sql += (ic>0?",":"") + (ft.values.get(ic) != null ? ("'" + ft.values.get(ic) + "'") : "null");
                sql += ")";
            } else if("update".equalsIgnoreCase(ft.type)) {
                sql = "UPDATE " +(ft.table.startsWith(itemIdString)?"":itemIdString)+ft.table+(ft.table.endsWith(itemIdString)?"":itemIdString)+"";
                sql += " SET ";
                for(int ic=0; ic<ft.columns.size(); ic++) {
                    sql += (ic>0?",":"") + itemIdString + ft.columns.get(ic) + itemIdString;
                    sql += "=";
                    sql += (ft.values.get(ic) != null ? ("'" + ft.values.get(ic) + "'") : "null");
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

}