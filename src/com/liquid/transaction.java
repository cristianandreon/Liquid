/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2022.
 */

package com.liquid;

import javax.servlet.http.HttpServletRequest;
import java.sql.Connection;
import java.sql.SQLException;

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
            Connection conn = (Connection) request.getSession().getAttribute("Liquid.connection");
            return conn != null;
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
            return (Connection)request.getSession().getAttribute("Liquid.connection");
        } else {
            return null;
        }
    }

    /**
     * Commit a transaction
     * @param request
     */
    public static void commit(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Connection conn = (Connection)request.getSession().getAttribute("Liquid.connection");
            conn.commit();
        }
    }

    /**
     * Rollback a transaction
     * @param request
     */
    public static void rollback(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Connection conn = (Connection) request.getSession().getAttribute("Liquid.connection");
            conn.rollback();
        }
    }

    /**
     * Close a transaction
     * @param request
     */
    public static void closeTransaction(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Connection conn = (Connection) request.getSession().getAttribute("Liquid.connection");
            request.getSession().setAttribute("Liquid.connection", null);
            conn.close();
        }
    }

    /**
     * Begin a transaction
     * @param request
     */
    public static boolean beginTransaction(HttpServletRequest request) throws Throwable {
        if(request != null) {
            Object[] connResult = connection.getLiquidDBConnection();
            Connection sconn = (Connection) connResult[0];
            if (sconn == null) {
                return false;
            }
            request.getSession().setAttribute("Liquid.connection", sconn);
            return true;
        } else {
            return false;
        }
    }


    /**
     * END Transaction managment
     */

}
