/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2022.
 */

package com.liquid;

import javax.servlet.http.HttpServletRequest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;

public class transaction {




    /**
     * START Transaction managment
     */

    /**
     * checf if is in transaction
     * @param request
     */
    public static boolean isTransaction(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Object oConnection = request.getAttribute("Liquid.connection");
            return (boolean) (oConnection instanceof Boolean ? oConnection : false);
        } else {
            return false;
        }
    }

    /**
     * Get the connection of the transaction
     * @param request
     * @return
     * @throws SQLException
     */
    public static Connection getTransaction(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Connection conn = (Connection)request.getAttribute("Liquid.connection.conn");
            if(conn != null) {
                if(!conn.isClosed() && conn.isValid(30)) {
                    return conn;
                } else {
                    System.err.println("Current thread:"+Thread.currentThread().getName());
                    System.err.println("Transaction thread:"+request.getAttribute("Liquid.connection.thread"));
                    throw new SQLException("Unexpected connection status");
                }
            }
        }
        return null;
    }

    /**
     * Commit a transaction
     * @param request
     */
    public static void commit(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Connection conn = (Connection)request.getAttribute("Liquid.connection.conn");
            if(!conn.isClosed() && conn.isValid(30)) {
                conn.commit();
                request.setAttribute("Liquid.connection.commit", true);
            } else {
                throw new SQLException("Unexpected connection status");
            }
        }
    }

    /**
     * Rollback a transaction
     * @param request
     */
    public static void rollback(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Connection conn = (Connection) request.getAttribute("Liquid.connection.conn");
            if(!conn.isClosed() && conn.isValid(30)) {
                conn.rollback();
                request.setAttribute("Liquid.connection.rollback", true);
            } else {
                throw new SQLException("Unexpected connection status");
            }
        }
    }

    /**
     * Close a transaction
     * @param request
     */
    public static void closeTransaction(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Connection conn = (Connection) request.getAttribute("Liquid.connection.conn");
            if(conn != null) {
                if ((boolean) request.getAttribute("Liquid.connection.commit") == false && (boolean) request.getAttribute("Liquid.connection.rollback") == false) {
                    Boolean commitAsDefault = (Boolean) request.getAttribute("Liquid.connection.commitAsDefault");
                    if (commitAsDefault != null && commitAsDefault.booleanValue()) {
                        conn.commit();
                    } else if (commitAsDefault != null && !commitAsDefault.booleanValue()) {
                        conn.rollback();
                    } else {
                        System.err.println("Please define commit or rollback as default");
                    }
                }
                request.setAttribute("Liquid.connection", false);
                request.setAttribute("Liquid.connection.conn", null);
                request.setAttribute("Liquid.connection.commit", false);
                request.setAttribute("Liquid.connection.rollback", false);
                request.setAttribute("Liquid.connection.commitAsDefault", null);
                request.setAttribute("Liquid.connection.thread", null);
                conn.close();
            }
        }
    }

    /**
     * Begin a transaction
     * @param request
     */
    public static boolean beginTransaction(HttpServletRequest request) throws Throwable {
        return beginTransaction(request, true);
    }

    /**
     *
     * @param request
     * @param commitAsDefault   (null, true, false) define commit or rollback when connection is closed and no commt/rollback is done
     * @return
     * @throws Throwable
     */
    public static boolean beginTransaction(HttpServletRequest request, Object commitAsDefault) throws Throwable {
        if(request != null) {
            if(!isTransaction(request)) {
                Object[] connResult = connection.getLiquidDBConnection();
                Connection sconn = (Connection) connResult[0];
                if (sconn == null) {
                    connResult = connection.getDBConnection();
                    sconn = (Connection) connResult[0];
                    if (sconn == null) {
                        return false;
                    }
                }
                sconn.setAutoCommit(false);
                request.setAttribute("Liquid.connection", true);
                request.setAttribute("Liquid.connection.conn", sconn);
                request.setAttribute("Liquid.connection.commit", false);
                request.setAttribute("Liquid.connection.rollback", false);
                request.setAttribute("Liquid.connection.commitAsDefault", commitAsDefault);
                request.setAttribute("Liquid.connection.thread", Thread.currentThread().getName());
                return true;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }



    /**
     *
     * @param conn
     * @param request
     * @param commitAsDefault   (null, true, false) define commit or rollback when connection is closed and no commt/rollback is done
     * @return
     * @throws Throwable
     */
    public static boolean beginTransaction(Connection conn, HttpServletRequest request, Object commitAsDefault) throws Throwable {
        if(request != null) {
            conn.setAutoCommit(false);
            request.setAttribute("Liquid.connection", true);
            request.setAttribute("Liquid.connection.conn", conn);
            request.setAttribute("Liquid.connection.commit", false);
            request.setAttribute("Liquid.connection.rollback", false);
            request.setAttribute("Liquid.connection.commitAsDefault", commitAsDefault);
            return true;
        } else {
            return false;
        }
    }



    /**
     *
     * @param conn
     * @param commitAsDefault   (null, true, false) define commit or rollback when connection is closed and no commt/rollback is done
     * @return
     * @throws Throwable
     */
    public static HttpServletRequest newTransaction(Connection conn, Object commitAsDefault) throws Throwable {
        HttpServletRequest request = new wsHttpServletRequest(null);
        if(request != null) {
            conn.setAutoCommit(false);
            request.setAttribute("Liquid.connection", true);
            request.setAttribute("Liquid.connection.conn", conn);
            request.setAttribute("Liquid.connection.commit", false);
            request.setAttribute("Liquid.connection.rollback", false);
            request.setAttribute("Liquid.connection.commitAsDefault", commitAsDefault);
            return (HttpServletRequest)request;
        } else {
            return (HttpServletRequest)null;
        }
    }


    /**
     * Create new transaction using given datasource
     *
     * @param connectionURL
     * @param commitAsDefault   (null, true, false) define commit or rollback when connection is closed and no commt/rollback is done
     * @return
     * @throws Throwable
     */
    public static HttpServletRequest newTransaction(Object connectionURL, Object commitAsDefault) throws Throwable {
        HttpServletRequest request = new wsHttpServletRequest(null);
        Object [] connRes = connection.getConnection(null, null, null, connectionURL, null);
        if(connRes != null) {
            if(connRes.length >= 1) {
                Connection conn = (Connection) connRes[0];
                String connError = (String) connRes[1];
                if (request != null) {
                    conn.setAutoCommit(false);
                    request.setAttribute("Liquid.connection", true);
                    request.setAttribute("Liquid.connection.conn", conn);
                    request.setAttribute("Liquid.connection.commit", false);
                    request.setAttribute("Liquid.connection.rollback", false);
                    request.setAttribute("Liquid.connection.commitAsDefault", commitAsDefault);
                    return (HttpServletRequest) request;
                } else {
                    throw new Exception("Connection failed : " + connError);
                }
            } else {
                throw new Exception("Connection result invalid");
            }
        } else {
            throw new Exception("Connection failed");
        }
    }




    /**
     *
     * Esecute sql inside the transaction
     *
     * @param sql
     * @param request
     * @return
     * @throws Exception
     */
    public static boolean exec(String sql, HttpServletRequest request) throws Exception {
        if(request != null) {
            Connection conn = (Connection) request.getAttribute("Liquid.connection.conn");
            if (conn != null) {
                Statement stmt = conn.createStatement();
                return stmt.execute(sql);
            } else {
                throw new Exception("Invalid connection");
            }
        } else {
            throw new Exception("Invalid request");
        }
    }


    /**
     * Esecute sql inside the transaction
     *
     * @param sql
     * @param params
     * @param request
     * @return
     * @throws Exception
     */
    public static boolean exec(String sql, Object [] params, HttpServletRequest request) throws Exception {
        if(request != null) {
            Connection conn = (Connection) request.getAttribute("Liquid.connection.conn");
            if (conn != null) {
                PreparedStatement stmt = conn.prepareStatement(sql);
                for(int i=0; i<params.length; i++) {
                    if (db.mapStatementParam(stmt, i+1, params[i])) {
                    }
                }
                return stmt.execute();
            } else {
                throw new Exception("Invalid connection");
            }
        } else {
            throw new Exception("Invalid request");
        }
    }

    public static boolean setSchema(HttpServletRequest request, String schema) throws SQLException {
        if(request != null) {
            Connection conn = (Connection) request.getAttribute("Liquid.connection.conn");
            if (conn != null) {
                return db.setSchema( conn, db.getDriver(conn), schema);
            }
        }
        return false;
    }


    /**
     * END Transaction managment
     */

}
