/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

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
    public ArrayList<Object> values = null;
    public ArrayList<Integer> valueTypes = null;	// 0=String	1=Expression
    public String sourceColumn = null;
    public String ids = null;
    public ArrayList<TransactionList> linkedTransactList = null;

    public ArrayList<TransactionList> transactionList = null;

    public TransactionList(String table, String column, Object value, int valueType, String sourceColumn, String where, String type) {
        this.table = table;
        this.where = where;
        this.columns = new ArrayList<>();
        this.columns.add(column);
        this.values = new ArrayList<>();
        this.values.add(value);
        this.valueTypes = new ArrayList<>();
        this.valueTypes.add(valueType);
        this.sourceColumn = sourceColumn;
        this.type = type;
    }

    public TransactionList() {
    }

    public void add(String _table, String _column, Object _value, int _valueType, String _sourceColumn, String _where, String _type, String rowId, String nodeId) {
        if (transactionList == null) {
            transactionList = new ArrayList<>();
        }
        for (int i = 0; i < transactionList.size(); i++) {
            TransactionList ft = transactionList.get(i);
            if (ft.table.equalsIgnoreCase(_table) && ((ft.where == null && where == null) || ft.where.equalsIgnoreCase(_where))) {
                if (ft.columns.contains(_column)) {
                    ft.values.set(ft.columns.indexOf(_column), _value);
                } else {
                    ft.columns.add(_column);
                    ft.values.add(_value != null ? (_value /* _valueType != 0 ? _value.replace("'", "''") : _value*/) : null);
                    ft.valueTypes.add(_valueType);
                    ft.sourceColumn = _sourceColumn;
                    ft.rowId = rowId;
                    ft.nodeId = nodeId;
                }
                return;
            }
        }
        transactionList.add(new TransactionList(_table, _column, _value, _valueType, _sourceColumn, _where, _type));
    }

    public String getSQL(workspace tbl_wrk, int i) {
        String sql = "";
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.ENGLISH);
        if (i < transactionList.size()) {
            TransactionList transaction = transactionList.get(i);
            String itemIdString = "\"", tableIdString = "\"";
            if (tbl_wrk.driverClass.contains(".mysql") || tbl_wrk.driverClass.contains(".mariadb")) {
                itemIdString = "`";
                tableIdString = "";
            } else {
                itemIdString = "\"";
                tableIdString = "\"";
            }
            if ("insert".equalsIgnoreCase(transaction.type)) {
                sql = "INSERT INTO " + (transaction.table.startsWith(itemIdString) ? "" : itemIdString) + transaction.table + (transaction.table.endsWith(itemIdString) ? "" : itemIdString) + "";
                sql += " (";
                for (int ic = 0; ic < transaction.columns.size(); ic++) {
                    sql += (ic > 0 ? "," : "") + itemIdString + transaction.columns.get(ic) + itemIdString;
                }
                sql += ") VALUES (";
                for (int ic = 0; ic < transaction.values.size(); ic++) {
                    Object oValue = transaction.values.get(ic);
                    String apex = transaction.valueTypes.get(ic) == 0 ? "" : "'";
                    if(oValue instanceof Boolean) {
                        sql += (ic > 0 ? "," : "") + (oValue != null ? (oValue) : "NULL");
                    } else if(oValue instanceof Integer || oValue instanceof Long || oValue instanceof Float || oValue instanceof Double) {
                        sql += (ic > 0 ? "," : "") + (oValue != null ? (oValue) : "NULL");
                    } else if(oValue instanceof java.util.Date) {
                        sql += (ic > 0 ? "," : "") + (oValue != null ? (dateFormat.format((java.util.Date)oValue)) : "NULL");
                    } else if(oValue instanceof java.sql.Timestamp) {
                        sql += (ic > 0 ? "," : "") + (oValue != null ? (dateFormat.format((java.sql.Timestamp)oValue)) : "NULL");
                    } else if(oValue instanceof java.sql.Date) {
                        sql += (ic > 0 ? "," : "") + (oValue != null ? (dateFormat.format((java.sql.Date)oValue)) : "NULL");
                    } else {
                        sql += (ic > 0 ? "," : "") + (oValue != null ? (apex + oValue + apex) : "NULL");
                    }
                }
                sql += ")";
            } else if ("update".equalsIgnoreCase(transaction.type)) {
                sql = "UPDATE " + (transaction.table.startsWith(itemIdString) ? "" : itemIdString) + transaction.table + (transaction.table.endsWith(itemIdString) ? "" : itemIdString) + "";
                sql += " SET ";
                for (int ic = 0; ic < transaction.columns.size(); ic++) {
                    String apex = transaction.valueTypes.get(ic) == 0 ? "" : "'";
                    sql += (ic > 0 ? "," : "") + itemIdString + transaction.columns.get(ic) + itemIdString;
                    sql += "=";
                    Object oValue = transaction.values.get(ic);
                    if(oValue instanceof Boolean) {
                        sql += (oValue != null ? (oValue) : "NULL");
                    } else if(oValue instanceof Integer || oValue instanceof Long || oValue instanceof Float || oValue instanceof Double) {
                        sql += (oValue != null ? (oValue) : "NULL");
                    } else {
                        sql += (oValue != null ? (apex + oValue + apex) : "NULL");
                    }
                    sql += "";
                }
                sql += " WHERE ";
                sql += transaction.where;
            } else if ("delete".equalsIgnoreCase(transaction.type)) {
                if (transaction.where != null && !transaction.where.isEmpty()) {
                    sql = "DELETE FROM " + (transaction.table.startsWith(itemIdString) ? "" : itemIdString) + transaction.table + (transaction.table.endsWith(itemIdString) ? "" : itemIdString) + "";
                    sql += " WHERE ";
                    sql += transaction.where;
                }
            }
        }
        return sql;
    }

    public String getType(workspace tbl_wrk, int i) {
        String sql = "";
        if (i < transactionList.size()) {
            TransactionList t = transactionList.get(i);
            return t.type;
        }
        return null;
    }

    Object[] executeSQL(workspace tbl_wrk, int i, Connection conn, int RETURN_TYPE) throws Exception {
        String sql = "";
        if (i < transactionList.size()) {
            ArrayList<Object> params = new ArrayList<Object>();
            TransactionList transaction = transactionList.get(i);
            String itemIdString = "\"", tableIdString = "\"";
            if (tbl_wrk.driverClass.contains(".mysql") || tbl_wrk.driverClass.contains(".mariadb")) {
                itemIdString = "`";
                tableIdString = "";
            } else {
                itemIdString = "\"";
                tableIdString = "\"";
            }
            if ("insert".equalsIgnoreCase(transaction.type)) {
                sql = "INSERT INTO " + (transaction.table.startsWith(itemIdString) ? "" : itemIdString) + transaction.table + (transaction.table.endsWith(itemIdString) ? "" : itemIdString) + "";
                sql += " (";
                for (int ic = 0; ic < transaction.columns.size(); ic++) {
                    sql += (ic > 0 ? "," : "") + itemIdString + transaction.columns.get(ic) + itemIdString;
                }
                sql += ") VALUES (";
                for (int ic = 0; ic < transaction.values.size(); ic++) {
                    int value_type = transaction.valueTypes.get(ic);
                    Object oValue = transaction.values.get(ic);
                    if (value_type == 0) {
                        // expression : put in the statement
                        sql += (ic > 0 ? "," : "") + transaction.values.get(ic);
                        params.add(null);
                    } else {
                        // value : put in parameters
                        sql += (ic > 0 ? "," : "") + "?";
                        params.add(oValue);
                    }
                }
                sql += ")";
            } else if ("update".equalsIgnoreCase(transaction.type)) {
                sql = "UPDATE " + (transaction.table.startsWith(itemIdString) ? "" : itemIdString) + transaction.table + (transaction.table.endsWith(itemIdString) ? "" : itemIdString) + "";
                sql += " SET ";
                for (int ic = 0; ic < transaction.columns.size(); ic++) {
                    sql += (ic > 0 ? "," : "") + itemIdString + transaction.columns.get(ic) + itemIdString;
                    int value_type = transaction.valueTypes.get(ic);
                    if (value_type == 0) {
                        // expression : put in the statement
                        sql += "=" + transaction.values.get(ic);
                        params.add(null);
                    } else {
                        // value : put in parameters
                        sql += "=?";
                        params.add(transaction.values.get(ic));
                    }
                }
                sql += " WHERE ";
                sql += transaction.where;
            } else if ("delete".equalsIgnoreCase(transaction.type)) {
                if (transaction.where != null && !transaction.where.isEmpty()) {
                    sql = "DELETE FROM " + (transaction.table.startsWith(itemIdString) ? "" : itemIdString) + transaction.table + (transaction.table.endsWith(itemIdString) ? "" : itemIdString) + "";
                    sql += " WHERE ";
                    sql += transaction.where;
                }
            }
            PreparedStatement stmt = conn.prepareStatement(sql, RETURN_TYPE);
            int ip = 1;
            for (int ic = 0; ic < params.size(); ic++) {
                int value_type = transaction.valueTypes.get(ic);
                if (value_type == 0) {
                    // espression : not here, stmt aspect value not expression
                } else {
                    Object oParam = params.get(ic);
                    if (value_type == 1) {
                        // generic srting
                        if(oParam instanceof Integer) {
                            stmt.setInt(ip, (Integer)oParam);
                        } else if(oParam instanceof Long) {
                            stmt.setLong(ip, (Long)oParam);
                        } else if(oParam instanceof BigDecimal) {
                            stmt.setBigDecimal(ip, (BigDecimal) oParam);
                        } else if(oParam instanceof Float) {
                            stmt.setFloat(ip, (Float) oParam);
                        } else if(oParam instanceof Double) {
                            stmt.setDouble(ip, (Double) oParam);
                        } else if(oParam instanceof Boolean) {
                            stmt.setString(ip, (String) params.get(ic));
                        } else {
                            stmt.setString(ip, (String) params.get(ic));
                        }
                    } else if (value_type == 4 || value_type == 3) {
                        // Integer number
                        if(oParam instanceof String) {
                            stmt.setInt(ip, Integer.parseInt((String)oParam));
                        } else {
                            stmt.setInt(ip, (Integer)oParam);
                        }
                    } else if (value_type == 7) {
                        // Float
                        if(oParam instanceof String) {
                            stmt.setFloat(ip, Float.parseFloat((String)oParam));
                        } else {
                            stmt.setFloat(ip, (Float)oParam);
                        }
                    } else if (value_type == 8) {
                        // Double
                        if(oParam instanceof String) {
                            stmt.setDouble(ip, Double.parseDouble((String)oParam));
                        } else {
                            stmt.setDouble(ip, (Double)oParam);
                        }
                    } else if (value_type == -5) {
                        // bigint number
                        if(oParam instanceof String) {
                            stmt.setLong(ip, Long.parseLong((String)oParam));
                        } else {
                            stmt.setLong(ip, (Long)oParam);
                        }
                    } else if (value_type == -7) {
                        // boolean
                        if(oParam instanceof String) {
                            stmt.setBoolean(ip, ("true".equalsIgnoreCase((String)oParam) ? true : false));
                        } else {
                            stmt.setBoolean(ip, ((Boolean)oParam ? true : false));
                        }
                    } else if (value_type == 6) { // date
                        if(oParam instanceof String) {
                            stmt.setDate(ip, DateUtil.toDate(oParam));
                        } else if(oParam instanceof java.sql.Date) {
                            stmt.setDate(ip, (java.sql.Date)oParam);
                        } else if(oParam instanceof java.sql.Timestamp) {
                            stmt.setDate(ip, new java.sql.Date(((Timestamp)oParam).getTime()));
                        } else if(oParam instanceof java.util.Date) {
                            stmt.setDate(ip, new java.sql.Date(((java.util.Date)oParam).getTime()));
                        } else {
                            throw new Exception("invalid date object");
                        }
                    } else if (value_type == 93) { // timestamp
                        if(oParam instanceof String) {
                            stmt.setTimestamp(ip, DateUtil.toTimestamp(oParam));
                        } else if(oParam instanceof java.sql.Date) {
                            stmt.setTimestamp(ip, new java.sql.Timestamp(((java.sql.Date)oParam).getTime()));
                        } else if(oParam instanceof java.sql.Timestamp) {
                            stmt.setTimestamp(ip, (Timestamp)oParam);
                        } else if(oParam instanceof java.util.Date) {
                            stmt.setTimestamp(ip, new java.sql.Timestamp(((java.util.Date)oParam).getTime()));
                        } else {
                            throw new Exception("invalid date object");
                        }
                    } else if (value_type == 91) { // date
                        if(oParam instanceof String) {
                            stmt.setDate(ip, DateUtil.toDate(oParam));
                        } else if(oParam instanceof java.util.Date) {
                            stmt.setDate(ip, new java.sql.Date( ((java.util.Date)oParam).getTime() ));
                        } else if(oParam instanceof java.sql.Date) {
                            stmt.setDate(ip, (java.sql.Date) oParam);
                        } else if(oParam instanceof java.sql.Timestamp) {
                            stmt.setDate(ip, new java.sql.Date( ((java.sql.Timestamp)oParam).getTime() ));
                        } else {
                            stmt.setDate(ip, DateUtil.toDate(oParam));
                        }
                    } else if (value_type == 92) { // time
                        if(oParam instanceof String) {
                            stmt.setTime(ip, DateUtil.getTime(oParam));
                        } else {
                            stmt.setTime(ip, (java.sql.Time)oParam);
                        }
                    } else {
                        // unknown : srting
                        stmt.setString(ip, String.valueOf(params.get(ic)));
                        String col = transaction.columns.get(ic);
                        Logger.getLogger(db.class.getName()).log(Level.SEVERE, "At field " + transaction.table + "." + col + " datatype undetected:" + value_type);
                    }
                    ip += 1;
                }
            }
            return new Object[]{stmt.executeUpdate(), stmt};
        }
        return new Object[]{-1, null};
    }
}
