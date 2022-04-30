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
            Object oConnection = request.getSession().getAttribute("Liquid.connection");
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
            return (Connection)request.getSession().getAttribute("Liquid.connection.conn");
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
            Connection conn = (Connection)request.getSession().getAttribute("Liquid.connection.conn");
            conn.commit();
            request.getSession().setAttribute("Liquid.connection.commit", true);
        }
    }

    /**
     * Rollback a transaction
     * @param request
     */
    public static void rollback(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Connection conn = (Connection) request.getSession().getAttribute("Liquid.connection.conn");
            conn.rollback();
            request.getSession().setAttribute("Liquid.connection.rollback", true);
        }
    }

    /**
     * Close a transaction
     * @param request
     */
    public static void closeTransaction(HttpServletRequest request) throws SQLException {
        if(request != null) {
            Connection conn = (Connection) request.getSession().getAttribute("Liquid.connection.conn");
            if((boolean) request.getSession().getAttribute("Liquid.connection.commit") == false && (boolean) request.getSession().getAttribute("Liquid.connection.rollback") == false) {
                if((boolean)request.getSession().getAttribute("Liquid.connection.commitAsDefault") == true) {
                    conn.commit();
                } else if((boolean)request.getSession().getAttribute("Liquid.connection.commitAsDefault") == false) {
                    conn.rollback();
                } else {
                    System.err.println("Please define commit or rollback as default");
                }
            }
            request.getSession().setAttribute("Liquid.connection", false);
            request.getSession().setAttribute("Liquid.connection.conn", null);
            request.getSession().setAttribute("Liquid.connection.commit", false);
            request.getSession().setAttribute("Liquid.connection.rollback", false);
            request.getSession().setAttribute("Liquid.connection.commitAsDefault", null);
            conn.close();
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
            request.getSession().setAttribute("Liquid.connection", true);
            request.getSession().setAttribute("Liquid.connection.conn", sconn);
            request.getSession().setAttribute("Liquid.connection.commit", false);
            request.getSession().setAttribute("Liquid.connection.rollback", false);
            request.getSession().setAttribute("Liquid.connection.commitAsDefault", commitAsDefault);
            return true;
        } else {
            return false;
        }
    }


    /**
     * END Transaction managment
     */

}
