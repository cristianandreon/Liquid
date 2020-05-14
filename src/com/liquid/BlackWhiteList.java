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
public class BlackWhiteList {

    String database = null;
    String schema = null;
    String table = null;

    static private ArrayList<BlackWhiteList> blackList = new ArrayList<BlackWhiteList> ();
    static private ArrayList<BlackWhiteList> whiteList = new ArrayList<BlackWhiteList> ();

    
    BlackWhiteList(String database, String schema, String table) {
        this.database = database;
        this.schema = schema;
        this.table = table;        
    }
    BlackWhiteList(String database, String schema, String table, boolean toBlackList) {
        BlackWhiteList bh = new BlackWhiteList(database, schema, table);
        if(toBlackList) {
            blackList.add(bh);
        } else {
            whiteList.add(bh);
        }
    }
    
    
    /**
     * <h3>Add the item to the black list</h3>
     * <p>
     * This method add the database.schema.table to the black list
     * </p>
     * @param  database  the database of the table to add (String)
     * @param  schema  the schema of the table to add (String)
     * @param  table  the table to add (String)
     * 
     * @return
     *  This method return true if the item was added

     * @see         BlackWhiteList
     */    
    static public boolean addToBlackList(String database, String schema, String table) {
        BlackWhiteList item = searchList(blackList, database, schema, table);
        if(item != null) {
            BlackWhiteList bh = new BlackWhiteList(database, schema, table);
            blackList.add(bh);
            return true;
        }
        return false;
    }
    
    
    /**
     * <h3>Add the item to the white list</h3>
     * <p>
     * This method add the database.schema.table to the white list
     * </p>
     * @param  database  the database of the table to add (String)
     * @param  schema  the schema of the table to add (String)
     * @param  table  the table to add (String)
     * 
     * @return
     *  This method return true if the item was added

     * @see         BlackWhiteList
     */    
    static public boolean addToWhiteList(String database, String schema, String table) {
        BlackWhiteList item = searchList(whiteList, database, schema, table);
        if(item != null) {
            BlackWhiteList bh = new BlackWhiteList(database, schema, table);
            whiteList.add(bh);
            return true;
        }
        return false;
    }

    /**
     * <h3>Remove the item from the black list</h3>
     * <p>
     * This method search and remove the database.schema.table from the black list
     * </p>
     * @param  database  the database of the table to remove (String)
     * @param  schema  the schema of the table to remove (String)
     * @param  table  the table to remove (String)
     * 
     * @return
     *  This method return true if the item was found and removed

     * @see         BlackWhiteList
     */    
    static public boolean removeFromBlackList(String database, String schema, String table) {
        BlackWhiteList item = searchList(whiteList, database, schema, table);
        if(item != null) {
            blackList.remove(item);
            return true;
        }
        return false;
    }
    
    /**
     * <h3>Remove the item from the white list</h3>
     * <p>
     * This method search and remove the database.schema.table from the white list
     * </p>
     * @param  database  the database of the table to remove (String)
     * @param  schema  the schema of the table to remove (String)
     * @param  table  the table to remove (String)
     * 
     * @return
     *  This method return true if the item was found and removed

     * @see         BlackWhiteList
     */    
    static public boolean removeFromWhiteList(String database, String schema, String table) {
        BlackWhiteList item = searchList(whiteList, database, schema, table);
        if(item != null) {
            whiteList.remove(item);
            return true;
        }
        return false;
    }

    static private BlackWhiteList searchList(ArrayList<BlackWhiteList>List, String database, String schema, String table) {
        if(List != null) {
            for(BlackWhiteList item : List) {
                if(item != null) {
                    if(   ((database == null || database.isEmpty()) && (item.database == null || item.database.isEmpty()))
                        || (database != null && database.equalsIgnoreCase(item.database) )) {
                        if(   ((schema == null || schema.isEmpty()) && (item.schema == null || item.schema.isEmpty()))
                            || (schema != null && schema.equalsIgnoreCase(item.schema) )) {
                            if(   ((table == null || table.isEmpty()) && (item.table == null || item.table.isEmpty()))
                                || (table != null && table.equalsIgnoreCase(item.table) )) {
                                return item;
                                
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    
    /**
     * <h3>Compute accessibility of specific database.schema.table</h3>
     * <p>
     * This method return true if table (or schema or database is accessible)
     * </p>
     * @param  database  the database of the table to check (String)
     * @param  schema  the schema of the table to check (String)
     * @param  table  the table to check (String)

     * @see         BlackWhiteList
     */    
    static public boolean isAccessible(String database, String schema, String table) {
        if(blackList != null) {
            for(BlackWhiteList black : blackList) {
                if(black != null) {
                    if(    (database == null || database.isEmpty()) 
                        || (database != null && utility.match(database, black.database)) 
                        || "*".equalsIgnoreCase(black.database) 
                        || black.database == null 
                        || black.database.isEmpty()) {
                        if(    (schema != null || schema.isEmpty()) 
                            || (schema != null && utility.match(schema, black.schema)) 
                            || "*".equalsIgnoreCase(black.schema) 
                            || black.schema == null 
                            || black.schema.isEmpty()) {
                            if( (table != null && utility.match(table, black.table)) 
                                || "*".equalsIgnoreCase(black.table) 
                                || black.table == null 
                                || black.table.isEmpty()) {                        
                                return false;
                            }
                        }
                    }
                }
            }
        }
        if(whiteList != null) {
            if(whiteList.size() > 0) {
                for(BlackWhiteList white : whiteList) {
                    if(white != null) {
                        if(    (database != null || database.isEmpty()) 
                            || (database != null && utility.match(database, white.database)) 
                            || "*".equalsIgnoreCase(white.database) 
                            || white.database == null 
                            || white.database.isEmpty()) {
                            if(    (schema != null || schema.isEmpty()) 
                                || (schema != null && utility.match(schema, white.schema)) 
                                || "*".equalsIgnoreCase(white.schema) 
                                || white.schema == null 
                                || white.schema.isEmpty()) {
                                if(    (table != null || table.isEmpty()) 
                                    || (table != null && utility.match(table, white.table))
                                    || "*".equalsIgnoreCase(white.table) 
                                    || white.table == null 
                                    || white.table.isEmpty()) {
                                    return true;
                                }
                            }
                        }
                    }
                }
                return false;
            }
        }
        return true;
    }

    static public String getBlackListHTML() {
        return getBlackWhiteListHTML(blackList);
    }

    static public String getWhiteListHTML() {
        return getBlackWhiteListHTML(whiteList);
    }
    static private String getBlackWhiteListHTML(ArrayList<BlackWhiteList> list) {
        if(list != null) {
            if(list.size() > 0) {
                String out_string = "";
                for(BlackWhiteList item : list) {
                    out_string += item.database + "." + item.schema + "." + item.table + "<br/>";
                }
                return out_string;
            }
        }
        return "[N/D]";
    }        
}
