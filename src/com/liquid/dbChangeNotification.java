// TODO : Test
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;
import java.util.concurrent.Executor;
import oracle.jdbc.OracleConnection;
import oracle.jdbc.OracleStatement;
import oracle.jdbc.dcn.*;
import oracle.jdbc.dcn.RowChangeDescription.RowOperation;

/**
 *
 * @author Cristitan
 */
public class dbChangeNotification  implements DatabaseChangeListener {
    
    dbChangeNotification demo;
    dbChangeNotification(dbChangeNotification dem) {
        demo = dem;
    }

    public void onDatabaseChangeNotification(DatabaseChangeEvent databaseChangeEvent) {
        System.out.println("DCNListener: got an event (" + this + ")");
        System.out.println(databaseChangeEvent.toString());
        TableChangeDescription[] tableChanges
                = databaseChangeEvent.getTableChangeDescription();

        for (TableChangeDescription tableChange : tableChanges) {
            RowChangeDescription[] rcds = tableChange.getRowChangeDescription();
            for (RowChangeDescription rcd : rcds) {
                System.out.println("Affected row -> " + rcd.getRowid().stringValue());
                RowOperation ro = rcd.getRowOperation();

                Executor executor = new DBExecutor();
                String rowid = rcd.getRowid().stringValue();

                if (ro.equals(RowOperation.INSERT)) {

                    System.out.println("INSERT occurred");
                    executor.execute(new HandleDBRefresh(rowid, "insert"));
                } else if (ro.equals(RowOperation.UPDATE)) {
                    System.out.println("UPDATE occurred");
                    executor.execute(new HandleDBRefresh(rowid, "update"));
                } else if (ro.equals(RowOperation.DELETE)) {
                    System.out.println("DELETE occurred");
                    executor.execute(new HandleDBRefresh(rowid, "delete"));
                } else {
                    System.out.println("Only handling INSERT/DELETE/UPDATE");
                }
            }
        }

        synchronized (demo) {
            demo.notify();
        }
    }

    private static class DBExecutor implements Executor {

        public DBExecutor() {
        }

        @Override
        public void execute(Runnable r) {
            throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
        }
    }
    
    public class HandleDBRefresh implements Runnable {

        public HandleDBRefresh(String rowid, String insert) {
        }

        @Override
        public void run() {
            throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
        }

    }

    static private dbChangeNotification glDatabaseChangeEvent = null;

    public boolean set_notification_change( Connection con, String database, String schema, String table, String className ) throws SQLException {
        boolean retVal = false;


        String myConnectionString = "User Id=Scott;Password=tiger;Data Source=Ora;";
        OracleConnection oConn = (OracleConnection)con;
  
        /*
         * register a listener for change notofication to be displayed to standard out
         * for testing purposes
         */  
        Properties props = new Properties();
        props.put(OracleConnection.DCN_NOTIFY_ROWIDS, "true");
        props.put(OracleConnection.NTF_QOS_RELIABLE, "false");
        props.setProperty(OracleConnection.DCN_BEST_EFFORT, "true");

        DatabaseChangeRegistration dcr = oConn.registerDatabaseChangeNotification(props);

        // Add the dummy DCNListener which is DCNListener.java class
        dbChangeNotification list = new dbChangeNotification(this);
        dcr.addListener(list);

    
        Statement stmt = oConn.createStatement();
        // Associate the statement with the registration.
        ((OracleStatement)stmt).setDatabaseChangeRegistration(dcr);
        ResultSet rs = stmt.executeQuery("select * from dept where 1 = 2");
        while (rs.next()) {
            // do nothing no , need to just need query to register the DEPT table
        }

        String[] tableNames = dcr.getTables();
        for(int i=0; i < tableNames.length; i++) {
            System.out.println(tableNames[i]+" successfully registered.");
        }

        // close resources
        stmt.close();
        rs.close();
        return false;
    }
}


