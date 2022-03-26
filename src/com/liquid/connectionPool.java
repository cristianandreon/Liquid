package com.liquid;


import org.apache.commons.dbcp2.BasicDataSource;

import java.sql.Connection;
import java.sql.SQLException;

public class connectionPool {

    private static BasicDataSource ds = new BasicDataSource();

    public connectionPool(String url, String user, String password) {
        ds.setUrl(url);
        ds.setUsername(user);
        ds.setPassword(password);
        ds.setMinIdle(5);
        ds.setMaxIdle(10);
        ds.setMaxOpenPreparedStatements(100);
    }

    public static Connection getConnection() throws SQLException {
        return ds.getConnection();
    }
}

// Connection con = DBCPDataSource.getConnection();