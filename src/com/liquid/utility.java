/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

package com.liquid;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.ErrorHandler;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.servlet.jsp.JspWriter;
import javax.xml.bind.DatatypeConverter;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.*;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.sql.Timestamp;
import java.text.DateFormat;
import java.text.DateFormatSymbols;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

public class utility {

    public static int javaVersion = getVersion();

    private static int getVersion() {
        String version = System.getProperty("java.version");
        if (version.startsWith("1.")) {
            version = version.substring(2, 3);
        } else {
            int dot = version.indexOf(".");
            if (dot != -1) {
                version = version.substring(0, dot);
            }
        }
        return Integer.parseInt(version);
    }

    static public boolean equals(Object o1, Object o2) {
        if (o1 == null && o2 != null) {
            return true;
        } else {
            return o1.equals(o2);
        }
    }

    static public String base64Encode(String data) {
        if (data == null || data.isEmpty()) {
            return "";
        }
        try {
            return base64Encode(data.getBytes());
        } catch (Throwable th) {
            System.err.println("Error:" + th.getLocalizedMessage() + "Please try adding apache commons-codes.jar to your project");
        }
        return "";
    }

    static public String base64Encode(byte[] data) {
        if (data == null) {
            return "";
        }
        try {
            return DatatypeConverter.printBase64Binary(data);
        } catch (Throwable th) {
            try {
                if (javaVersion >= 8) {
                    return new String(Base64.getEncoder().encode(data));
                    // throw new Throwable(); // x java 7
                } else {
                    throw new Throwable();  // x java 7
                }
            } catch (Throwable th2) {
                try {
                    return new String(org.apache.commons.codec.binary.Base64.encodeBase64(data));
                } catch (Throwable th3) {
                    System.err.println("Error:" + th3.getLocalizedMessage() + "Please try adding apache commons-codes.jar to your project");
                }
            }
        }
        return "";
    }

    static public String base64EncodeURLSafe(byte[] data) {
        if (data == null) {
            return "";
        }
        try {
            return DatatypeConverter.printBase64Binary(data);
        } catch (Throwable th) {
            try {
                if (javaVersion >= 8) {
                    return new String(Base64.getUrlEncoder().encode(data));
                    // throw new Throwable(); // x java 7
                } else {
                    throw new Throwable();  // x java 7
                }
            } catch (Throwable th2) {
                try {
                    return new String(org.apache.commons.codec.binary.Base64.encodeBase64URLSafe(data));
                } catch (Throwable th3) {
                    System.err.println("Error:" + th3.getLocalizedMessage() + "Please try adding apache commons-codes.jar to your project");
                }
            }
        }
        return "";
    }


    static public String base64Decode(String data) {
        try {
            if (data != null)
                return base64Decode(data.getBytes());
        } catch (Throwable th) {
            System.err.println("Error:" + th.getLocalizedMessage() + "Please try adding apache commons-codes.jar to your project");
        }
        return null;
    }

    static public String base64Decode(byte[] data) {
        try {
            return new String(DatatypeConverter.parseBase64Binary(new String(data)));
        } catch (Throwable th) {
            try {
                return new String(Base64.getDecoder().decode(data));
                // throw new Throwable(); // x java 7
            } catch (Throwable th2) {
                try {
                    return new String(org.apache.commons.codec.binary.Base64.decodeBase64(data));
                } catch (Throwable th3) {
                    System.err.println("Error:" + th3.getMessage());
                }
            }
        }
        return null;
    }


    static public byte [] base64DecodeBytes(String data) {
        try {
            return DatatypeConverter.parseBase64Binary(data);
        } catch (Throwable th) {
            try {
                return Base64.getDecoder().decode(data);
                // throw new Throwable(); // x java 7
            } catch (Throwable th2) {
                try {
                    return org.apache.commons.codec.binary.Base64.decodeBase64(data);
                } catch (Throwable th3) {
                    System.err.println("Error:" + th3.getMessage());
                }
            }
        }
        return null;
    }


    /**
     * create lisy of key for DMS from [database][schema][table][dms folder name][list of is in ids]
     *
     * @param tblWrk
     * @param params
     * @return
     */
    static public ArrayList<String> get_dms_keys(workspace tblWrk, String params) {
        ArrayList<String> keyList = null;
        try {
            if (tblWrk != null) {
                JSONObject paramsJson = new JSONObject((String) params);
                JSONObject paramJson = paramsJson.getJSONObject("params");
                if (paramJson != null) {
                    JSONArray ids = paramJson.getJSONArray("ids");
                    String database = null, schema = null, table = null, name = null;
                    try {
                        database = paramJson.getString("database");
                    } catch (Exception e) {
                    }
                    try {
                        schema = paramJson.getString("schema");
                    } catch (Exception e) {
                    }
                    try {
                        table = paramJson.getString("table");
                    } catch (Exception e) {
                    }
                    try {
                        name = paramJson.getString("name");
                    } catch (Exception e) {
                    }
                    // { database:liquid.tableJson.database, schema:liquid.tableJson.schema, table:liquid.tableJson.table, ids:nodeKeys };
                    if (database == null || database.isEmpty()) {
                        try {
                            database = tblWrk.tableJson.getString("database");
                        } catch (Exception e) {
                        }
                    }
                    if (schema == null || schema.isEmpty()) {
                        try {
                            schema = tblWrk.tableJson.getString("schema");
                        } catch (Exception e) {
                        }
                    }
                    if (table == null || table.isEmpty()) {
                        try {
                            table = tblWrk.tableJson.getString("table");
                        } catch (Exception e) {
                        }
                    }

                    if (database == null || database.isEmpty()) {
                        database = tblWrk.defaultDatabase;
                    }
                    if (schema == null || schema.isEmpty()) {
                        schema = "";
                    }
                    if (table == null || table.isEmpty()) {
                        table = "";
                    }
                    if (name == null || name.isEmpty()) {
                        try {
                            name = "default";
                        } catch (Exception e) {
                        }
                    }

                    keyList = new ArrayList<String>();
                    Object id;
                    for (int i = 0; i < ids.length(); i++) {
                        id = ids.get(i);
                        keyList.add(database + "." + schema + "." + table + "." + name + "." + id);
                    }
                }
            }
        } catch (JSONException ex) {
            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, ex);
        }
        return keyList;
    }

    /**
     * <h3>Search for the property in the bean</h3>
     * <p>
     * This method return a Field of the property from a bean
     *
     * @param bean        the bean (Object)
     * @param property    the Field of the property to get (Field)
     * @param exaclyMatch if false strip by $ and check only the parts defined
     *                    in the param property (boolean) ex.: searching for 'foreigntTable' the
     *                    property named 'foreigntTable$foreignColumn$column' is returned as found
     * @param onlyObject
     * @return the Field found or null
     * @see utility
     */
    static public Field searchProperty(Object bean, String property, boolean exaclyMatch, boolean onlyObject) {
        if (bean != null) {
            String clasName = bean.getClass().getName();
            if (clasName.equalsIgnoreCase("java.util.ArrayList") || clasName.equalsIgnoreCase("java.util.List")) {
                // wrap to bean
                List<?> list = (List<?>) bean;
                if (list.size() > 0) {
                    bean = (Object) list.get(0);
                }
            }
            String[] searchParts = property.split("\\$");
            Field[] fields = bean.getClass().getDeclaredFields();
            Field fieldFound = null;
            int propLen = property.length();
            for (int istp = 0; istp < 2; istp++) {
                int bestMatch = 999999999;
                for (Field f : fields) {
                    String fieldName = f.getName();
                    if (!exaclyMatch) {
                        String[] colParts = fieldName.split("\\$");
                        if (colParts.length > 1) {
                            fieldName = "";
                            for (int ip = 0; ip < searchParts.length && ip < colParts.length; ip++) {
                                fieldName += (fieldName.length() > 0 ? "$" : "") + colParts[ip];
                            }
                        }
                    }
                    if (istp == 0 ? fieldName.equals(property) : fieldName.toUpperCase().equalsIgnoreCase(property.toUpperCase())) {
                        if (!exaclyMatch) {
                            int dSize = f.getName().length() - propLen;
                            if (dSize <= bestMatch) {
                                if (onlyObject) {
                                    if (f.getType().equals(Object.class)) {
                                        bestMatch = dSize;
                                        fieldFound = f;
                                    }
                                } else {
                                    bestMatch = dSize;
                                    fieldFound = f;
                                }
                            }
                        } else {
                            if (onlyObject) {
                                if (f.getType().equals(Object.class)) {
                                    return f;
                                }
                            } else {
                                return f;
                            }
                        }
                    }
                }
                if (fieldFound != null) {
                    return fieldFound;
                }
            }
        }
        return null;
    }

    // JAVA MERDA : se la libreria non è presente ANCHE sul progetto principale si solleva la throwable
    /*
    APACHE MERDA : devo tirarmi dentro un pianete per usare un solo metodo ...
    static public boolean set(Object bean, String propName, Object propValue) throws IllegalAccessException, InvocationTargetException {
        try {
            BeanUtils.setProperty(bean, propName, propValue);
            return true;
        } catch (Throwable e) {
            System.err.println("ERROR : com.liquid.utility.set() " + e.getLocalizedMessage()+" .. make sure to include commons-beanutils-1.9.4.jar and commons-logging-1.2.jar in your project");
        }
        return false;
    }
    static public Object get(Object bean, String propName) throws IllegalAccessException, InvocationTargetException, NoSuchMethodException {
        try {
            return (Object)BeanUtils.getProperty(bean, propName);
        } catch (Throwable e) {
            System.err.println("ERROR: com.liquid.utility.get() " + e.getLocalizedMessage()+" .. make sure to include commons-beanutils-1.9.4.jar and commons-logging-1.2.jar in your project");
        }
        return null;
    }
     */


    static public void set(Object bean, String property, Object value) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException, ParseException {
        try {
            setEx(bean, property, value);
        } catch (Exception e) {
            throw e;
        }
    }

    /**
     * <h3>Set the property of a bean</h3>
     * <p>
     * This method set a property from a bean
     *
     * @param bean     the bean (Object)
     * @param property the name of the property to get (String)
     * @param value    the new value to set
     * @throws java.beans.IntrospectionException
     * @throws java.lang.NoSuchFieldException
     * @throws java.lang.reflect.InvocationTargetException
     * @throws java.lang.IllegalAccessException
     * @see utility
     */
    static public boolean setEx(Object bean, String property, Object value) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException, ParseException {
        boolean retVal = false;
        Field field = bean.getClass().getDeclaredField(property);
        if (field == null) {
            // Ricerca nei beans per similitudine
            field = searchProperty(bean, property, false, false);
        }
        if (field != null) {
            field.setAccessible(true);
            Class<?> propType = field.getType();
            Object curValue = field.get(bean);
            try {
                if (propType.equals(Boolean.class) || propType.equals(boolean.class)) {
                    if (value instanceof String) {
                        if (value != null && !((String) value).isEmpty() && (
                                "on".equalsIgnoreCase((String) value) ||
                                        "true".equalsIgnoreCase((String) value) ||
                                        "1".equalsIgnoreCase((String) value) ||
                                        "s".equalsIgnoreCase((String) value) ||
                                        "t".equalsIgnoreCase((String) value)
                        )) {
                            if(curValue == null || !(boolean)field.get(bean)) {
                                field.set(bean, true);
                                retVal = true;
                            }
                        } else {
                            if(curValue == null || (boolean)field.get(bean)) {
                                field.set(bean, false);
                                retVal = true;
                            }
                        }
                    } else if (value instanceof Boolean) {
                        if(curValue == null || !(Boolean)curValue != (Boolean)value) {
                            field.set(bean, value);
                            retVal = true;
                        }
                    } else if (value instanceof Integer) {
                        if (curValue == null || (value != null && ((Integer) value) > 0)) {
                            if(!(boolean)field.get(bean)) {
                                field.set(bean, true);
                                retVal = true;
                            }
                        } else {
                            if(curValue == null || (boolean)field.get(bean)) {
                                field.set(bean, false);
                                retVal = true;
                            }
                        }
                    } else if (value instanceof Long) {
                        if (curValue == null || (value != null && ((Long) value) > 0)) {
                            if(!(boolean)field.get(bean)) {
                                field.set(bean, true);
                                retVal = true;
                            }
                        } else {
                            if(curValue == null || (boolean)field.get(bean)) {
                                field.set(bean, false);
                                retVal = true;
                            }
                        }
                    } else if (value instanceof Float) {
                        if (curValue == null || (value != null && ((Float) value) > 0.0f)) {
                            if(!(boolean)field.get(bean)) {
                                field.set(bean, true);
                                retVal = true;
                            }
                        } else {
                            if(curValue == null || (boolean)field.get(bean)) {
                                field.set(bean, false);
                                retVal = true;
                            }
                        }
                    } else if (value instanceof Double) {
                        if (curValue == null || value != null && ((Double) value) > 0.0f) {
                            if(!(boolean)field.get(bean)) {
                                field.set(bean, true);
                                retVal = true;
                            }
                        } else {
                            if(curValue == null || (boolean)field.get(bean)) {
                                field.set(bean, false);
                                retVal = true;
                            }
                        }
                    } else if (value instanceof BigDecimal) {
                        if (curValue == null || (value != null && ((BigDecimal) value).intValue() > 0)) {
                            if(!(boolean)field.get(bean)) {
                                field.set(bean, true);
                                retVal = true;
                            }
                        } else {
                            if(curValue == null || (boolean)field.get(bean)) {
                                field.set(bean, false);
                                retVal = true;
                            }
                        }
                    }
                } else if (propType.equals(Integer.class)) {
                    if (value instanceof String) {
                        if (value == null || ((String) value).isEmpty()) {
                            if(curValue == null || (Integer)curValue != 0) {
                                field.set(bean, new Integer(0));
                                retVal = true;
                            }
                        } else if ("on".equalsIgnoreCase((String) value) || "true".equalsIgnoreCase((String) value) || "y".equalsIgnoreCase((String) value) || "n".equalsIgnoreCase((String) value)) {
                            if(curValue == null || (Integer)curValue != 1) {
                                field.set(bean, new Integer(1));
                                retVal = true;
                            }
                        } else if ("off".equalsIgnoreCase((String) value) || "false".equalsIgnoreCase((String) value) || "n".equalsIgnoreCase((String) value)) {
                            if(curValue == null || (Integer)curValue != 0) {
                                field.set(bean, new Integer(0));
                                retVal = true;
                            }
                        } else {
                            try {
                                if (value != null) {
                                    if (!"null".equalsIgnoreCase(String.valueOf(value))) {
                                        if(curValue == null || (Integer)curValue != Integer.parseInt((String) value)) {
                                            field.set(bean, Integer.parseInt((String) value));
                                            retVal = true;
                                        }
                                    } else {
                                        if(curValue == null || curValue != null) {
                                            field.set(bean, null);
                                            retVal = true;
                                        }
                                    }
                                } else {
                                    if(curValue == null || curValue != value) {
                                        field.set(bean, value);
                                        retVal = true;
                                    }
                                }
                            } catch (Exception e) {
                                Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, e);
                                throw e;
                            }
                        }
                    } else if (value instanceof Object) {
                        if(curValue == null || curValue != (Integer)value) {
                            field.set(bean, (Integer) value);
                            retVal = true;
                        }
                    }
                } else if (propType.equals(Long.class)) {
                    if (value instanceof String) {
                        if (value == null || ((String) value).isEmpty()) {
                            if (!"null".equalsIgnoreCase(String.valueOf(value))) {
                                if(curValue == null || (Long)curValue != 0L) {
                                    field.set(bean, new Long(0));
                                    retVal = true;
                                }

                            } else {
                                if(curValue == null || (Long)curValue != null) {
                                    field.set(bean, null);
                                    retVal = true;
                                }
                            }
                        } else {
                            try {
                                if(curValue == null || (Long)curValue != Long.parseLong((String) value)) {
                                    field.set(bean, Long.parseLong((String) value));
                                    retVal = true;
                                }
                            } catch (Exception e) {
                                Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, e);
                                throw e;
                            }
                        }
                    } else if (value instanceof Object) {
                        if(curValue == null || (Long)curValue != (Long) value) {
                            field.set(bean, (Long) value);
                            retVal = true;
                        }
                    }
                } else if (propType.equals(Float.class)) {
                    if (value instanceof String) {
                        if (value == null || ((String) value).isEmpty() || "null".equalsIgnoreCase((String)value)) {
                            if(curValue != null) {
                                field.set(bean, null);
                                retVal = true;
                            }
                        } else {
                            try {
                                Float newValue = Float.valueOf(((String) value).replaceAll(",", "."));
                                if(curValue == null || ((Float)field.get(bean)).compareTo(newValue) != 0) {
                                    field.set(bean, newValue);
                                    retVal = true;
                                }
                            } catch (Exception e) {
                                Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, e);
                                throw e;
                            }
                        }
                    } else if (value instanceof Double) {
                        if(curValue == null || ((Float)field.get(bean)).compareTo(new Float((Double) value)) != 0) {
                            field.set(bean, new Float((Float)value));
                            retVal = true;
                        }
                    } else if (value instanceof Float) {
                        if(curValue == null || ((Float)field.get(bean)).compareTo((Float) value) != 0) {
                            field.set(bean, (Float)value);
                            retVal = true;
                        }
                    } else if (value instanceof Object) {
                        if(curValue == null || ((Float)field.get(bean)).compareTo((Float) value) != 0) {
                            field.set(bean, (Float) value);
                        }
                    }
                } else if (propType.equals(java.lang.Double.class)) {
                    if (value instanceof String) {
                        if (value == null || ((String) value).isEmpty() || "null".equalsIgnoreCase((String)value)) {
                            if(curValue != null) {
                                field.set(bean, null);
                                retVal = true;
                            }
                        } else {
                            try {
                                Double newValue = Double.valueOf(((String) value).replaceAll(",", "."));
                                if(curValue == null || ((Double)field.get(bean)).compareTo(newValue) != 0) {
                                    field.set(bean, newValue);
                                    retVal = true;
                                }
                            } catch (Exception e) {
                                Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, e);
                                throw e;
                            }
                        }
                    } else if (value instanceof Float) {
                        if(curValue == null || ((Double)field.get(bean)).compareTo(new Double((Float) value)) != 0) {
                            field.set(bean, new Double((Float)value));
                            retVal = true;
                        }
                    } else if (value instanceof Double) {
                        if(curValue == null || ((Double)curValue).compareTo((Double) value) != 0) {
                            field.set(bean, (Double)value);
                            retVal = true;
                        }
                    } else if (value instanceof BigDecimal) {
                        if(curValue == null || ((Double)curValue).compareTo((Double) value) != 0) {
                            field.set(bean, ((BigDecimal)value).doubleValue());
                            retVal = true;
                        }
                    } else if (value instanceof Long) {
                        if(curValue == null || ((Double)curValue).compareTo((Double) value) != 0) {
                            field.set(bean, new Double((Long)value));
                            retVal = true;
                        }
                    } else if (value instanceof Integer) {
                        if(curValue == null || ((Double)curValue).compareTo((Double) value) != 0) {
                            field.set(bean, new Double(((Integer)value)));
                            retVal = true;
                        }
                    } else if (value instanceof Object) {
                        if(curValue == null || ((Double)field.get(bean)).compareTo((Double) value) != 0) {
                            field.set(bean, new Double(String.valueOf(value)));
                            retVal = true;
                        }
                    }
                } else if (propType.equals(java.lang.String.class)) {
                    if (value instanceof String) {
                        if(curValue == null || ((String)field.get(bean)).compareTo((String) value) != 0) {
                            field.set(bean, (String) value);
                            retVal = true;
                        }
                    } else if (value instanceof Object) {
                        if(curValue == null || ((String)field.get(bean)).compareTo(String.valueOf(value)) != 0) {
                            field.set(bean, String.valueOf(value));
                            retVal = true;
                        }
                    }
                } else if (propType.equals(java.util.Date.class)) {
                    java.sql.Date newDate = DateUtil.toDate(value);
                    if(newDate != null) {
                        java.util.Date newValue = (newDate != null ? newDate : null);
                        if(curValue == null || ((java.util.Date)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, newValue);
                            retVal = true;
                        }
                    } else {
                        if(curValue != null) {
                            field.set(bean, null);
                            retVal = true;
                        }
                    }
                } else if (propType.equals(java.sql.Date.class)) {
                    java.sql.Date newDate = DateUtil.toDate(value);
                    if(value != null) {
                        java.sql.Date newValue = (value != null ? new java.sql.Date( newDate.getTime()) : null);
                        if(curValue == null || ((java.sql.Date)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, newValue);
                            retVal = true;
                        }
                    } else {
                        if(curValue != null) {
                            field.set(bean, null);
                            retVal = true;
                        }
                    }
                } else if (propType.equals(java.sql.Timestamp.class)) {
                    Timestamp newDate = DateUtil.toTimestamp(value);
                    if(newDate != null) {
                        java.sql.Timestamp newValue = (value != null ? new java.sql.Timestamp( newDate.getTime()) : null);
                        if(curValue == null || ((java.sql.Timestamp)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, newValue);
                            retVal = true;
                        }
                    } else {
                        if(curValue != null) {
                            field.set(bean, null);
                            retVal = true;
                        }
                    }
                } else if (propType.equals(java.sql.Time.class)) {
                    Timestamp newDate = DateUtil.toTimestamp(value);
                    if(newDate != null) {
                        java.sql.Time newValue = (value != null ? new java.sql.Time( newDate.getTime()) : null);
                        if(curValue == null || ((java.sql.Time)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, newValue);
                            retVal = true;
                        }
                    } else {
                        if(curValue != null) {
                            field.set(bean, null);
                            retVal = true;
                        }
                    }
                } else if (propType.equals(java.math.BigDecimal.class)) {
                    if (value instanceof String) {
                        BigDecimal newValue = new BigDecimal((String)value != null && !((String) value).isEmpty() ? (String)value : (String) "0");
                        if(curValue == null || ((BigDecimal)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, (BigDecimal) newValue);
                            retVal = true;
                        }
                    } else if (value instanceof Double) {
                        BigDecimal newValue = new BigDecimal((Double)value);
                        if(curValue == null || ((BigDecimal)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, (BigDecimal)newValue);
                            retVal = true;
                        }
                    } else if (value instanceof Float) {
                        BigDecimal newValue = new BigDecimal((Float)value);
                        if(curValue == null || ((BigDecimal)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, (BigDecimal)newValue);
                            retVal = true;
                        }
                    } else if (value instanceof Long) {
                        BigDecimal newValue = new BigDecimal((Long)value);
                        if(curValue == null || ((BigDecimal)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, (BigDecimal)newValue);
                            retVal = true;
                        }
                    } else if (value instanceof Integer) {
                        BigDecimal newValue = new BigDecimal((Integer)value);
                        if(curValue == null || ((BigDecimal)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, (BigDecimal)newValue);
                            retVal = true;
                        }
                    } else if (value instanceof Short) {
                        BigDecimal newValue = new BigDecimal((Short)value);
                        if(curValue == null || ((BigDecimal)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, (BigDecimal)newValue);
                            retVal = true;
                        }
                    } else if (value instanceof BigDecimal) {
                        BigDecimal newValue = (BigDecimal)value;
                        if(curValue == null || ((BigDecimal)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, (BigDecimal)newValue);
                            retVal = true;
                        }
                    } else if (value == null) {
                        if(curValue != null) {
                            field.set(bean, null);
                            retVal = true;
                        }
                    } else if (value instanceof Object) {
                        BigDecimal newValue = new BigDecimal(String.valueOf(value));
                        if(curValue == null || ((BigDecimal)field.get(bean)).compareTo(newValue) != 0) {
                            field.set(bean, (BigDecimal)newValue);
                            retVal = true;
                        }
                    } else {
                        field.set(bean, value);
                        retVal = true;
                    }

                } else {
                    if(value != null) {
                        if (curValue == null || !curValue.equals(value)) {
                            field.set(bean, value);
                            retVal = true;
                        }
                    } else {
                        if(curValue != null) {
                            field.set(bean, null);
                            retVal = true;
                        }
                    }
                }

                // set changed, avoiding mirrored events
                if ("&Parent".equals(property)) {
                } else if (property.indexOf("$Read") > 0) {
                } else if (property.indexOf("$Changed") > 0) {
                } else if (property.indexOf("$controlId") > 0) {
                } else if (property.indexOf("$className") > 0) {
                } else {
                    try {
                        // Ricerca nel bean corrispondenza esatta
                        field = searchProperty(bean, property + "$Changed", true, false);
                        if (field != null) {
                            field.setAccessible(true);
                            field.set(bean, true);
                        }
                    } catch (Throwable th2) {
                        try {
                            bean.getClass().getMethod("setChanged", String.class, Boolean.class).invoke(bean, property, true);
                        } catch (Throwable th) {
                            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th2);
                            Method[] methods = bean.getClass().getMethods();
                            for (int i = 0; i < methods.length; i++) {
                                System.err.println("{" + bean.getClass() + "}.Method #" + (i + 1) + ":" + methods[i].toString());
                            }
                        }
                    }
                }

            } catch (ParseException ex) {
                Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, ex);
                throw ex;
            }
        }
        return retVal;
    }


    /**
     * <h3>Get the property of a bean</h3>
     * <p>
     * This method get a property from a bean
     *
     * @param bean     the bean (Object)
     * @param property the name of the property to get (String)
     * @return property value (Object)
     * @see utility
     */
    static public Object getEx(Object bean, String property) {
        try {
            return get(bean, property);
        } catch (Exception e) {
            Logger.getLogger(utility.class.getName()).log(Level.INFO, null, e);
        }
        return null;
    }

    static public Object getEx(Object bean, String property, boolean log) {
        try {
            return get(bean, property);
        } catch (Exception e) {
            if (log)
                Logger.getLogger(utility.class.getName()).log(Level.WARNING, null, e);
        }
        return null;
    }

    /**
     * <h3>Get the property of a bean</h3>
     * <p>
     * This method get a property from a bean
     *
     * @param bean
     * @param property
     * @return
     * @throws Exception
     */
    static public Object get(Object bean, String property) throws Exception {
        try {
            property = property.replace("\\.", "$");
            String clasName = bean.getClass().getName();
            if (clasName.equalsIgnoreCase("java.util.ArrayList") || clasName.equalsIgnoreCase("java.util.List")) {
                // wrap to bean
                List<?> list = (List<?>) bean;
                if (list.size() > 0) {
                    bean = (Object) list.get(0);
                }
            }
            String searchingProperty = property.replaceAll("\\.", "\\$");
            if (bean != null) {
                Field field = null;
                try {
                    field = bean.getClass().getDeclaredField(searchingProperty);
                    if (field != null) {
                        field.setAccessible(true);
                        return field.get(bean);
                    }
                } catch (Throwable th) {
                }

                // Ricerca nel bean per similitudine
                field = searchProperty(bean, searchingProperty, false, false);
                if (field != null) {
                    field.setAccessible(true);
                    return field.get(bean);
                }
                // Codice Obsoleto
                PropertyDescriptor propertyDescriptor = getPropertyDescriptor(bean.getClass(), searchingProperty);
                if (propertyDescriptor == null) {
                    throw new IllegalArgumentException("No such property " + searchingProperty + " for " + bean + " exists");
                }
                Method readMethod = propertyDescriptor.getReadMethod();
                if (readMethod == null) {
                    throw new IllegalStateException("No getter available for property " + property + " on " + bean);
                }
                return readMethod.invoke(bean);
            }
        } catch (Exception e) {
            throw new Exception(e);
        }
        return null;
    }

    static public boolean has(Object bean, String property) {
        try {
            if (bean != null) {
                Field field = bean.getClass().getDeclaredField(property.replace("\\.", "$"));
                if (field != null) {
                    return true;
                }

            }
        } catch (Exception e) {
            // Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, e);
        } catch (Throwable th) {
            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th);
        }
        return false;
    }

    static public boolean isChanged(Object bean, String property) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException {
        if (bean != null) {
            Field field = bean.getClass().getDeclaredField(property + "$Changed");
            if (field != null) {
                field.setAccessible(true);
                return (boolean) field.get(bean);
            }
            // Ricerca nei beans
            field = searchProperty(bean, property, false, false);
            if (field != null) {
                return (boolean) field.get(bean);
            }
        }
        return false;
    }

    static public boolean isChangedEx(Object bean, String property) {
        try {
            if (bean != null) {
                Field field = bean.getClass().getDeclaredField(property + "$Changed");
                if (field != null) {
                    field.setAccessible(true);
                    return (boolean) field.get(bean);
                }
                // Ricerca nei beans
                field = searchProperty(bean, property, false, false);
                if (field != null) {
                    return (boolean) field.get(bean);
                }
            }
        } catch (Exception e) {
        }
        return false;
    }

    static public boolean isChanged(Object bean) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException {
        if (bean != null) {
            Field[] fields = bean.getClass().getDeclaredFields();
            for (Field field : fields) {
                if (field != null) {
                    if (field.getName().indexOf("$Changed") != -1) {
                        if ((Boolean) getEx(bean, field.getName())) return true;
                    }
                }
            }
        }
        return false;
    }

    static public void setChanged(Object bean, String property, boolean bChanged) throws NoSuchFieldException, IllegalArgumentException, IllegalAccessException {
        if (bean != null) {
            Field field = bean.getClass().getDeclaredField(property + "$Changed");
            if (field != null) {
                field.setAccessible(true);
                field.set(bean, bChanged);
            }
        }
    }

    static public void resetAllChanged(Object bean) throws NoSuchFieldException, IllegalAccessException {
        if (bean != null) {
            Field[] fields = bean.getClass().getDeclaredFields();
            for (Field f : fields) {
                try {
                    String fieldName = f.getName();
                    if (fieldName.indexOf("$Changed") < 0
                            && fieldName.indexOf("$tableKey") < 0
                            && fieldName.indexOf("$primaryKey") < 0
                            && fieldName.indexOf("$databaseSchemaTable") < 0
                            && fieldName.indexOf("$controlId") < 0
                            && fieldName.indexOf("$Read") < 0) {
                        Field field = bean.getClass().getDeclaredField(fieldName + "$Changed");
                        if (field != null) {
                            field.setAccessible(true);
                            field.set(bean, false);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("resetAllChanged() error:"+e.getMessage());
                }
            }
        }
    }


    static private PropertyDescriptor getPropertyDescriptor(Class<?> bean, String propertyname) throws IntrospectionException {
        BeanInfo beanInfo = Introspector.getBeanInfo(bean);
        PropertyDescriptor[] propertyDescriptors = beanInfo.getPropertyDescriptors();
        PropertyDescriptor propertyDescriptor = null;
        for (int i = 0; i < propertyDescriptors.length; i++) {
            PropertyDescriptor currentPropertyDescriptor = propertyDescriptors[i];
            if (currentPropertyDescriptor.getName().equals(propertyname)) {
                propertyDescriptor = currentPropertyDescriptor;
            }
        }
        return propertyDescriptor;
    }

    static Object removeCommas(Object key) {
        return removeString(key, "\"");
    }

    static Object removeString(Object key, String removing) {
        if (key != null) {
            String skey = String.valueOf(key);
            int index = skey.indexOf(removing);
            if (index >= 0) {
                skey = skey.substring(index + removing.length());
            }
            int lastIndex = skey.lastIndexOf(removing);
            if (lastIndex >= 0) {
                skey = skey.substring(0, lastIndex);
            }
            return skey;
        } else {
            return null;
        }
    }

    static public boolean folderExist(String folder) {
        if (folder != null && !folder.isEmpty()) {
            File file = new File(folder);
            return file.isDirectory();
        } else {
            return false;
        }
    }

    static public String getFolderFromFile(String fileName) {
        File file = new File(fileName);
        return file.getParentFile().getAbsolutePath();
    }


    static public boolean createFolder(String folder) {
        return createFolder(folder, false, false, false);
    }

    static public boolean createFolder(String folder, boolean foreignRead, boolean foreignWrite, boolean foreignExec) {
        try {
            Path path = Paths.get(folder);
            Files.createDirectories(path);
            File file = new File(folder);
            if (file != null) {
                file.setReadable(true, foreignRead);
                file.setWritable(true, foreignWrite);
                file.setExecutable(true, foreignExec);
            } else {
                System.err.println("Failed to access created directory!" + folder);
                return false;
            }
        } catch (IOException e) {
            System.err.println("Failed to create directory!" + e.getMessage());
            return false;
        }
        return true;
    }

    /**
     * Set file or folder writable setting owner and group if not null
     *
     * @param fileName
     * @param owner
     * @param group
     * @return true if success
     */
    static public boolean setWritable(String fileName, String owner, String group) {
        boolean retVal = false;
        File file = new File(fileName);
        if (file != null) {
            retVal = true;

            file.setReadable(true, true);
            file.setExecutable(true, true);
            file.setWritable(true, true);

            if (group != null) {
                Path path = file.toPath();
                FileOwnerAttributeView view = Files.getFileAttributeView(path, FileOwnerAttributeView.class);
                UserPrincipalLookupService lookupService = FileSystems.getDefault().getUserPrincipalLookupService();
                GroupPrincipal groupPrincipal = null;
                try {
                    groupPrincipal = lookupService.lookupPrincipalByGroupName(group);
                    Files.getFileAttributeView(file.toPath(), PosixFileAttributeView.class, LinkOption.NOFOLLOW_LINKS).setGroup(groupPrincipal);
                } catch (IOException e) {
                    e.printStackTrace();
                    retVal = false;
                }
            }
            if (owner != null) {
                Path path = file.toPath();
                FileOwnerAttributeView view = Files.getFileAttributeView(path, FileOwnerAttributeView.class);
                UserPrincipalLookupService lookupService = FileSystems.getDefault().getUserPrincipalLookupService();
                UserPrincipal userPrincipal = null;
                try {
                    userPrincipal = lookupService.lookupPrincipalByName(owner);
                    Files.getFileAttributeView(file.toPath(), PosixFileAttributeView.class, LinkOption.NOFOLLOW_LINKS).setOwner(userPrincipal);
                } catch (IOException e) {
                    e.printStackTrace();
                    retVal = false;
                }
            }
        }
        return retVal;
    }


    static public boolean fileExist(String fileName) {
        if (fileName != null && !fileName.isEmpty()) {
            File file = new File(fileName);
            return file.isFile();
        } else {
            return false;
        }
    }

    static public String strip_last_slash(String str) {
        if (str != null && str.length() > 0 && (str.charAt(str.length() - 1) == '/' || str.charAt(str.length() - 1) == '\\')) {
            str = str.substring(0, str.length() - 1);
        }
        return str;
    }

    static public String strip_last_char(String str, char char_to_strip) {
        if (str == null) {
            return "";
        }
        if (str.isEmpty()) {
            return "";
        }
        if (str.charAt(str.length() - 1) == char_to_strip) {
            str = str.replace(str.substring(str.length() - 1), "");
            return str;
        } else {
            return str;
        }
    }

    public static void close_process(Process process) {
        try {
            process.wait(3000); // let the process run for 3 seconds
        } catch (Throwable th) {
        }
        process.destroy();
        try {
            process.wait(5000); // give it a chance to stop
        } catch (Throwable th) {
        }
        process.destroy();
        try {
            process.waitFor(); // the process is now dead
        } catch (Throwable th) {
        }
    }

    /**
     * Execute command by Runtime.getRuntime().exec
     * @param script
     */
    public static void execute_process(String script) {

        try {

            Process p = Runtime.getRuntime().exec(script);

            Thread.sleep(1000);

            BufferedReader input = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line = null;

            while ((line = input.readLine()) != null) {
                System.out.println(line);
            }

            int exitVal = p.waitFor();
            System.out.println("Exited with error code " + exitVal);
            // log.debug(("Exited with error code "+exitVal));

        } catch (Exception e) {
            System.out.println(e.toString());
            e.printStackTrace();
            // log.error(e.getMessage());
        }
    }

    /**
     * Create system process by ProcessBuilder
     * @param processPath
     * @param args
     * @return
     */
    public static Process startProcess(String processPath, String [] args) throws IOException {
        String folder = getFolderFromFile(processPath);
        ArrayList<String> argsList = new ArrayList<String>();
        argsList.add(processPath);
        argsList.addAll(Arrays.asList(args));
        ProcessBuilder pbuilder = new ProcessBuilder(argsList);
        pbuilder.directory(new File(folder));
        Process process = pbuilder.start();
        return process;
    }



    static public String appendSeparator(String path) {
        if (path != null && !path.isEmpty()) {
            Character c = path.charAt(path.length() - 1);
            if (c != File.separatorChar && !c.equals("\\")) {
                return "" + File.separatorChar;
            }
        }
        return "";
    }

    static public String appendURLSeparator(String path) {
        if (path != null && !path.isEmpty()) {
            Character c = path.charAt(path.length() - 1);
            if (c != '/' && !c.equals("/")) {
                return "/";
            }
        }
        return "";
    }

    static public String get_parent_path(String fullFileName) throws IOException {
        File relativePath = new File(fullFileName).getParentFile();
        return relativePath != null ? relativePath.getCanonicalPath() : null;
    }

    static public String get_absolute_path(HttpServletRequest request, String fileName) throws IOException {
        String fullFileName = "";
        ServletContext servletContext = request.getSession().getServletContext();
        String absoluteFilePathRoot = strip_last_slash(servletContext.getRealPath("/"));
        File relativePath = new File(absoluteFilePathRoot);
        String absolutePath = relativePath.getCanonicalPath();
        File pyFilePath = new File(absolutePath + utility.appendSeparator(absolutePath) + fileName);
        fullFileName = pyFilePath.getCanonicalPath();
        if (!utility.fileExist(fullFileName)) {
            throw new IOException("ERROR : file " + fullFileName + " not found");
        }
        return fullFileName;
    }

    // checks if two given strings match. The first string  may contain wildcard characters 
    static boolean match(String first, String second) {

        // If we reach at the end of both strings,  // we are done 
        if (first.length() == 0 && second.length() == 0) {
            return true;
        }

        // Make sure that the characters after '*'  
        // are present in second string.  
        // This function assumes that the first 
        // string will not contain two consecutive '*' 
        if (first.length() > 1 && first.charAt(0) == '*' && second.length() == 0) {
            return false;
        }

        // If the first string contains '?',  
        // or current characters of both strings match 
        if ((first.length() > 1 && first.charAt(0) == '?')
                || (first.length() != 0 && second.length() != 0
                && first.charAt(0) == second.charAt(0))) {
            return match(first.substring(1),
                    second.substring(1));
        }

        // If there is *, then there are two possibilities 
        // a) We consider current character of second string 
        // b) We ignore current character of second string. 
        if (first.length() > 0 && first.charAt(0) == '*') {
            return match(first.substring(1), second)
                    || match(first, second.substring(1));
        }
        return false;
    }

    public static String getDomainName(String url) throws URISyntaxException {
        URI uri = new URI(url);
        String domain = uri.getHost();
        return domain.startsWith("www.") ? domain.substring(4) : domain;
    }

    public static Object[] downloadFile(HttpServletRequest request, HttpServletResponse response, String fileToDownload) throws FileNotFoundException, IOException {
        response.setHeader("Content-Disposition", "attachment; filename=\"" + fileToDownload + "\"");

        ServletContext context = request.getSession().getServletContext();
        String relativePath = context.getRealPath("");
        String filePath = relativePath + "LiquidX/download/" + fileToDownload;
        File downloadFile = new File(filePath);
        FileInputStream inStream = new FileInputStream(downloadFile);

        // gets MIME type of the file
        String mimeType = context.getMimeType(filePath);
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }

        response.setContentType(mimeType);
        response.setContentLength((int) downloadFile.length());

        // obtains response's output stream
        OutputStream outStream = response.getOutputStream();

        byte[] buffer = new byte[4096];
        int bytesRead = -1;
        while ((bytesRead = inStream.read(buffer)) != -1) {
            outStream.write(buffer, 0, bytesRead);
        }

        inStream.close();
        outStream.close();

        return new Object[]{true};
    }



    /**
     * Aggiunge gli oggetti json target (esecuzione multilivello)
     * N.B.: La marginazione su oggetti JSONArray viene fatta per posizione
     *
     * @param source
     * @param target
     * @param excludingList
     * @return
     * @throws Exception
     */
    public static int mergeJsonObjects(JSONObject source, JSONObject target, String[] excludingList) throws Exception {
        int insertCount = 0;
        for (Object keyObject : JSONObject.getNames(source)) {
            String key = (String) keyObject;
            Object obj = source.get(key);
            if(excludingList == null || excludingList != null && !utility.contains(excludingList, key)) {
                if (target.has(key)) {
                    if (obj instanceof JSONObject) {
                        insertCount += mergeJsonObjects(source, target.getJSONObject(key), excludingList);
                    } else if (obj instanceof JSONArray) {
                        insertCount += mergeJsonArrays((JSONArray) obj, target.getJSONArray(key), excludingList);
                    } else {
                        target.put(key, obj);
                        insertCount++;
                    }
                } else {
                    target.put(key, obj);
                    insertCount++;
                }
            }
        }
        return insertCount;
    }


    public static int mergeJsonArrays(JSONArray source, JSONArray target, String[] excludingList) throws Exception {
        try {
            int insertCount = 0;
            JSONArray objs = (JSONArray)source;
            for(int i=0; i<objs.length(); i++) {
                Object obj = objs.get(i);
                if(obj instanceof JSONObject) {
                    insertCount += mergeJsonObjects((JSONObject) obj, target.getJSONObject(i), new String[]{"preFilters"});
                } else if(obj instanceof JSONArray) {
                    insertCount += mergeJsonArrays((JSONArray) obj, target.getJSONArray(i), excludingList);
                } else {
                    // target.put(i, obj);
                    target.putAll(source);
                    return 1;
                }
                // TODO : check length
            }
            return insertCount;
        } catch (Exception e) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
            throw e;
        }
    }


    /**
     * Aggiunge l'oggetto json target
     *
     * @param source
     * @param target
     * @return
     * @throws Exception
     */
    public static int mergeJsonObject(JSONObject source, JSONObject target) throws Exception {
        int insertCount = 0;
        for (Object keyObject : JSONObject.getNames(source)) {
            String key = (String) keyObject;
            Object obj = source.get(key);
            target.put(key, obj);
            insertCount++;
        }
        return insertCount;
    }

    /**
     * Aggiunge l'oggetto json target
     *
     * @param ssource
     * @param starget
     * @return
     * @throws Exception
     */
    public static String mergeJsonObject(String ssource, String starget) throws Exception {
        JSONObject sourceJson = ssource != null && !ssource.isEmpty() ? new JSONObject(ssource) : null;
        JSONObject targetJson = starget != null  && !starget.isEmpty() ? new JSONObject(starget) : new JSONObject();
        if(sourceJson != null && targetJson != null) {
            String[] names = JSONObject.getNames(sourceJson);
            if(names != null) {
                for (Object keyObject : names) {
                    String key = (String) keyObject;
                    Object obj = sourceJson.get(key);
                    targetJson.put(key, obj);
                }
            }
        }
        if(targetJson != null) {
            return targetJson.toString();
        } else {
            return starget;
        }
    }

    /**
     * Aggiorna l'oggetto json "target" usando i valori in "source" elencati da "map"
     *
     * @param map
     * @param source
     * @param target
     * @return
     * @throws Exception
     */
    public static int mergeJsonObjectByMap(HashMap<String, String> map, JSONObject source, JSONObject target) throws Exception {
        int insertCount = 0;
        Iterator it = map.entrySet().iterator();
        Map.Entry pair = null;
        while (it.hasNext()) {
            pair = (Map.Entry) it.next();
            String key = (String) pair.getKey();
            if (source.has(key)) {
                Object obj = source.get(key);
                target.put(key, obj);
                insertCount++;
            }
        }
        return insertCount;
    }


    static javax.net.ssl.TrustManager[] trustAllCerts = null;

    public static void disableCertificateValidation() {
        // Create a trust manager that does not validate certificate chains
        trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }

                    public void checkClientTrusted(X509Certificate[] certs, String authType) {
                    }

                    public void checkServerTrusted(X509Certificate[] certs, String authType) {
                    }
                }
        };
    }

    public static Object[] readURL(String curUrl, String method, String post) throws Exception {
        // Install the all-trusting trust manager
        try {
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, (TrustManager[]) trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
        } catch (Exception e) {
            System.err.println(e);
        }

        HttpURLConnection connection = null;
        int code = 0;
        while (true) {
            URL url = new URL(curUrl);
            try {
                connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(true);
                HttpURLConnection.setFollowRedirects(true);
                connection.setReadTimeout(15000);
                connection.setRequestMethod("GET");
                connection.connect();
                code = connection.getResponseCode();
                connection.disconnect();
            } catch (Throwable th) {
                String err = "Error:" + th.getLocalizedMessage();
                System.err.print(err);
                break;
            }
            if (code == HttpURLConnection.HTTP_NOT_FOUND) {
                return new Object[]{HttpURLConnection.HTTP_NOT_FOUND, null};
            } else if (code == HttpURLConnection.HTTP_MOVED_PERM || code == HttpURLConnection.HTTP_MOVED_TEMP) {
                String location = connection.getHeaderField("Location");
                location = URLDecoder.decode(location, "UTF-8");
                URL base = new URL(curUrl);
                URL next = new URL(base, location);
                curUrl = next.toExternalForm();
            } else {
                return new Object[]{code, null};
            }
        }
        return new Object[]{0, null};
    }

    static String getTimeString(float timeLeft) {
        String sTimeLeft = "";
        int days = (int) Math.ceil(timeLeft / 3600.0f / 24.0f) - 1;
        String timeLeftDays = days > 0.0f ? String.valueOf(days) + "days " : "";
        timeLeft -= days * 3600.0f * 24.0f;
        int hours = (int) Math.ceil(timeLeft / 3600.0f) - 1;
        String timeLeftHours = hours > 0.0f ? String.valueOf(hours) + "h " : "";
        timeLeft -= hours * 3600.0f;
        int minutes = (int) Math.ceil(timeLeft / 60.0f) - 1;
        String timeLeftMinutes = minutes > 0.0f ? String.valueOf(minutes) + "m " : "";
        timeLeft -= minutes * 60.0f;
        int seconds = (int) Math.ceil(timeLeft);
        String timeLeftSeconds = seconds > 0.0f ? String.valueOf(seconds) + "s" : "0s";
        sTimeLeft = timeLeftDays + timeLeftHours + timeLeftMinutes + timeLeftSeconds;
        return sTimeLeft;
    }

    /**
     * @param columns
     * @param checking_columns
     * @return true if match found or checking_columns is null or empty
     */
    static boolean compare_array(ArrayList<String> columns, ArrayList<String> checking_columns) {
        if (checking_columns != null) {
            for (int i = 0; i < checking_columns.size(); i++) {
                String v = checking_columns.get(i);
                boolean bFound = false;
                for (int j = 0; j < columns.size(); j++) {
                    if (v.equalsIgnoreCase(columns.get(j))) {
                        bFound = true;
                        break;
                    }
                }
                if (!bFound)
                    return false;
            }
        }
        return true;
    }

    static public boolean compare_json(Object jo1, Object jo2, ArrayList<String> excludingProps) throws JSONException {
        if (jo1 == jo2) return true;
        if (jo2 == null) return false;
        if (jo1.getClass() != jo2.getClass()) {
            return false;
        }
        if (jo1 instanceof JSONObject) {
            JSONArray names = ((JSONObject) jo1).names();
            for (int io = 0; io < names.length(); io++) {
                String name = names.getString(io);
                if (!contains(excludingProps, name)) {
                    Object o1 = ((JSONObject) jo1).get(name);
                    Object o2 = ((JSONObject) jo2).get(name);
                    if (o1 instanceof JSONObject) {
                        return compare_json((JSONObject) o1, (JSONObject) jo2, excludingProps);
                    } else if (o1 instanceof JSONArray) {
                        JSONArray oa1 = (JSONArray) o1;
                        JSONArray oa2 = (JSONArray) o2;
                        for (int j = 0; j < oa1.length(); j++) {
                            o1 = oa1.get(j);
                            o2 = oa2.get(j);
                            if (o1 instanceof JSONObject) {
                                if (!compare_json((JSONObject) o1, (JSONObject) o2, excludingProps)) {
                                    return false;
                                }
                            }
                        }
                    } else {
                        return o1.equals(o2);
                    }
                }
            }
        } else if (jo1 instanceof Object) {
            return jo1.equals(jo2);
        }
        return false;
    }


    static private String transfer_client_to_result(Object clientToTransfer, String result) throws JSONException {
        JSONObject retValJSON = new JSONObject(result);
        if (clientToTransfer != null) {
            if (retValJSON.has("client")) {
                Object retValClient = retValJSON.get("client");
                JSONArray newRetValClient = null;
                if (retValClient instanceof String) {
                    if (clientToTransfer instanceof String) {
                        newRetValClient = new JSONArray();
                        newRetValClient.put(retValClient);
                        newRetValClient.put(clientToTransfer);
                    } else if (clientToTransfer instanceof JSONArray) {
                        newRetValClient = new JSONArray();
                        newRetValClient.put(retValClient);
                        for (int i = 0; i < ((JSONArray) clientToTransfer).length(); i++) {
                            newRetValClient.put(((JSONArray) clientToTransfer).get(i));
                        }
                    }
                    if (newRetValClient != null) {
                        retValJSON.put("client", newRetValClient);
                    }

                } else if (retValClient instanceof JSONArray) {
                    if (clientToTransfer instanceof String) {
                        ((JSONArray) retValClient).put(clientToTransfer);
                    } else if (clientToTransfer instanceof JSONArray) {
                        for (int i = 0; i < ((JSONArray) clientToTransfer).length(); i++) {
                            ((JSONArray) retValClient).put(((JSONArray) clientToTransfer).get(i));
                        }
                    }
                    retValJSON.put("client", retValClient);
                }
            }
        }
        return retValJSON.toString();
    }


    /**
     * Transfer result to parameter of next event process
     * <p>
     * ex.:
     * {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
     * to
     * {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
     *
     * @param retValToTransfer
     * @param params
     * @return
     * @throws JSONException
     */
    static private String transfer_result_to_params(String retValToTransfer, String params) throws JSONException {
        return event.transfer_result_to_params(retValToTransfer, params);
    }


    /**
     * Transfer current result to global result for next event process
     *
     * @param retValToTransfer
     * @param retValTarget
     * @return ex.:
     * {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
     * to
     * {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
     * @throws JSONException
     */
    static public String transfer_result_to_results(String retValToTransfer, String retValTarget) throws JSONException {
        return event.transfer_result_to_results(retValToTransfer, retValTarget);
    }


    /**
     * Get id of created record from result string
     *
     * @param result
     * @return
     * @throws JSONException
     */
    static public Object get_result_id(String result) throws JSONException {
        JSONObject resultJson = new JSONObject(result);
        if (resultJson != null) {
            if (resultJson.has("tables")) {
                JSONArray tbls = (JSONArray) resultJson.getJSONArray("tables");
                if (tbls != null && tbls.length() > 0) {
                    JSONArray ids = ((JSONObject) tbls.get(0)).getJSONArray("ids");
                    if (ids != null && ids.length() > 0) {
                        return ids.get(0);
                    }
                }
            } else if (resultJson.has("details")) {
                JSONArray details = (JSONArray) resultJson.getJSONArray("details");
                if (details != null) {
                    for (int id = 0; id < details.length(); id++) {
                        Object detail = details.get(id);
                        if (detail instanceof JSONObject) {
                            JSONObject detailJson = (JSONObject) detail;
                            if (detailJson.has("tables")) {
                                JSONArray tbls = (JSONArray) detailJson.getJSONArray("tables");
                                if (tbls != null && tbls.length() > 0) {
                                    JSONArray ids = ((JSONObject) tbls.get(0)).getJSONArray("ids");
                                    if (ids != null && ids.length() > 0) {
                                        return ids.get(0);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get the error/warning/... from a result json sring
     * @param result
     * @return
     * @throws JSONException
     */
    static public JSONObject get_result_messages(String result) throws JSONException {
        JSONObject messageJson = new JSONObject();
        JSONObject resultJson = new JSONObject(result);
        if (resultJson != null) {
            if (resultJson.has("tables")) {
            } else if (resultJson.has("details")) {
                JSONArray details = (JSONArray) resultJson.getJSONArray("details");
                if (details != null) {
                    for (int id = 0; id < details.length(); id++) {
                        Object detail = details.get(id);
                        if (detail instanceof JSONObject) {
                            JSONObject detailJson = (JSONObject) detail;
                            if (detailJson.has("error")) {
                                messageJson.put("error", detailJson.get("error"));
                            }
                            if (detailJson.has("warning")) {
                                messageJson.put("warning", detailJson.get("warning"));
                            }
                            if (detailJson.has("info")) {
                                messageJson.put("info", detailJson.get("info"));
                            }
                            if (detailJson.has("message")) {
                                messageJson.put("message", detailJson.get("message"));
                            }
                            if (detailJson.has("tables")) {
                                JSONArray table_details = (JSONArray) detailJson.getJSONArray("tables");
                                if (table_details != null) {
                                    for (int idt = 0; idt < table_details.length(); idt++) {
                                        Object table_detail = table_details.get(idt);
                                        if (table_detail instanceof JSONObject) {
                                            JSONObject detailTableJson = (JSONObject) table_detail;
                                            if (detailTableJson.has("error")) {
                                                messageJson.put("error", detailTableJson.get("error"));
                                            }
                                            if (detailTableJson.has("warning")) {
                                                messageJson.put("warning", detailTableJson.get("warning"));
                                            }
                                            if (detailTableJson.has("info")) {
                                                messageJson.put("info", detailTableJson.get("info"));
                                            }
                                            if (detailTableJson.has("message")) {
                                                messageJson.put("message", detailTableJson.get("message"));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return messageJson;
    }

    /**
     * Transfer error to global result
     *
     * @param error
     * @param result
     * @return ex.:
     * {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
     * to
     * {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
     * @throws JSONException
     */
    static public String append_error_to_result(String error, String result) {
        return event.append_error_to_result(error, result);
    }

    public static String replace_values(String sourceContnet, HashMap<String, String> values) {
        Iterator it = values.entrySet().iterator();
        Map.Entry pair = null;
        try {
            while (it.hasNext()) {
                pair = (Map.Entry) it.next();
                sourceContnet = sourceContnet.replace((String) "${" + pair.getKey() + "}", (String) pair.getValue());
            }
        } catch (Exception e) {
            Logger.getLogger("replace_values").log(Level.SEVERE, "errore replacing " + pair.getKey());
        }
        return sourceContnet;
    }


    /**
     * @param values
     * @return
     */
    public static JSONObject put_json_values(JSONObject sourceObject, HashMap<String, String> values) {
        Iterator it = values.entrySet().iterator();
        Map.Entry pair = null;
        try {
            while (it.hasNext()) {
                pair = (Map.Entry) it.next();
                if (!sourceObject.has(String.valueOf(pair.getKey()))) {
                    sourceObject.put(String.valueOf(pair.getKey()), pair.getValue());
                }
            }
        } catch (Exception e) {
            Logger.getLogger("put_json_values").log(Level.SEVERE, "errore replacing " + pair.getKey());
        }
        return sourceObject;
    }

    /**
     * Genera il codice js per il set dei noedi HTML dai valori nel server
     *
     * @param values     : mappa chiave-valore
     * @param sourceJson : se valorizzato costituisce la sorgente dei valori
     * @return
     */
    public static String get_html_set_input_values(HashMap<String, String> values, JSONObject sourceJson) {
        Iterator it = values.entrySet().iterator();
        Map.Entry pair = null;
        String out = "";
        try {
            while (it.hasNext()) {
                pair = (Map.Entry) it.next();
                String val = null;

                if (sourceJson != null) {
                    String key = String.valueOf(pair.getKey());
                    if (sourceJson.has(key)) {
                        Object oval = sourceJson.get(key);
                        val = String.valueOf(oval);
                    }
                } else {
                    if (pair.getValue() instanceof Float || pair.getValue() instanceof Double) {
                        val = String.format("0.3f", pair.getValue());
                    } else {
                        val = String.valueOf(pair.getValue());
                    }
                }
                String varName = ("gl_" + pair.getKey()).replace(".", "_");
                varName = toCamelCase(varName);
                out += "try { if(typeof " + varName + " === 'undefined') { " + varName + "='" + val + "'; } Liquid.setHTMLElementValue(document.getElementById(\"" + String.valueOf(pair.getKey()) + "\"), " + varName + "); } catch(e) { console.error(e); }\n";
            }
        } catch (Exception e) {
            Logger.getLogger("get_html_set_input_values").log(Level.SEVERE, e, null);
        }
        return out;
    }

    public static String get_html_set_input_values(HashMap<String, String> values) {
        return get_html_set_input_values(values, null);
    }


    /**
     * Genera il codice js per il get dei noedi HTML e set dei valori nel server (che vivono nel client)
     *
     * @param values
     * @return
     */
    public static String get_html_get_input_values(HashMap<String, String> values) {
        Iterator it = values.entrySet().iterator();
        Map.Entry pair = null;
        String out = "";
        try {
            while (it.hasNext()) {
                pair = (Map.Entry) it.next();
                String val = null;
                if (pair.getValue() instanceof Float || pair.getValue() instanceof Double) {
                    val = String.format("0.3f", pair.getValue());
                } else {
                    val = String.valueOf(pair.getValue());
                }
                String varName = ("gl_" + pair.getKey()).replace(".", "_");
                varName = toCamelCase(varName);
                out += "try { if(typeof " + varName + " === 'undefined') { " + varName + "=''; } " + varName + "=( document.getElementById(\"" + String.valueOf(pair.getKey()) + "\") ? document.getElementById(\"" + String.valueOf(pair.getKey()) + "\").value : null); } catch(e) { console.error(e); }\n";
            }
        } catch (Exception e) {
            Logger.getLogger("get_html_get_input_values").log(Level.SEVERE, e, null);
        }
        return out;
    }


    /**
     * genera l'elenco di proprieta' dentro un oggetto js (,"prop":"value")
     *
     * @param values
     * @return
     */
    public static String get_html_set_js_params_values(HashMap<String, String> values) {
        Iterator it = values.entrySet().iterator();
        Map.Entry pair = null;
        String out = "";
        try {
            while (it.hasNext()) {
                pair = (Map.Entry) it.next();
                String val = "( document.getElementById(\"" + String.valueOf(pair.getKey()) + "\") ? document.getElementById(\"" + String.valueOf(pair.getKey()) + "\").value : null )";
                out += ",\"" + String.valueOf(pair.getKey()) + "\" : " + val + "\n";
            }
        } catch (Exception e) {
            Logger.getLogger("get_html_set_js_params_values").log(Level.SEVERE, e, null);
        }
        return out;
    }


    /**
     * genera l'elenco di proprieta' dentro un oggetto json stringa (,"prop":"value")
     *
     * @param values
     * @return
     */
    public static String get_json_string_values(HashMap<String, String> values, JSONObject sourceJson) {
        Iterator it = values.entrySet().iterator();
        Map.Entry pair = null;
        String out = "";
        try {
            while (it.hasNext()) {
                pair = (Map.Entry) it.next();
                String key = String.valueOf(pair.getKey());
                if (sourceJson.has(key)) {
                    String val = String.valueOf(sourceJson.get(key));
                    out += ",\"" + key + "\" : \"" + val + "\"";
                }
            }
        } catch (Exception e) {
            Logger.getLogger("get_json_string_values").log(Level.SEVERE, e, null);
        }
        return out;
    }

    public static boolean compare_db_schema_table(String databaseSchemaTable, String searchingDatabaseSchemaTable) {
        String[] wrkDatabaseSchemaTableParts = databaseSchemaTable.split("\\.");
        String[] searchingDatabaseSchemaTableParts = searchingDatabaseSchemaTable.split("\\.");
        if (searchingDatabaseSchemaTableParts.length == 1) {
            if (wrkDatabaseSchemaTableParts.length >= 1) {
                if (searchingDatabaseSchemaTableParts[0].equalsIgnoreCase(wrkDatabaseSchemaTableParts[wrkDatabaseSchemaTableParts.length - 1])) {
                    return true;
                }
            }
        } else if (searchingDatabaseSchemaTableParts.length == 2) {
            if (wrkDatabaseSchemaTableParts.length >= 2) {
                if (searchingDatabaseSchemaTableParts[1].equalsIgnoreCase(wrkDatabaseSchemaTableParts[wrkDatabaseSchemaTableParts.length - 1])) {
                    if (searchingDatabaseSchemaTableParts[0].equalsIgnoreCase(wrkDatabaseSchemaTableParts[wrkDatabaseSchemaTableParts.length - 2])) {
                        return true;
                    }
                }
            }
        } else if (searchingDatabaseSchemaTableParts.length >= 3) {
            if (wrkDatabaseSchemaTableParts.length >= 3) {
                if (searchingDatabaseSchemaTableParts[2].equalsIgnoreCase(wrkDatabaseSchemaTableParts[wrkDatabaseSchemaTableParts.length - 1])) {
                    if (searchingDatabaseSchemaTableParts[1].equalsIgnoreCase(wrkDatabaseSchemaTableParts[wrkDatabaseSchemaTableParts.length - 2])) {
                        if (searchingDatabaseSchemaTableParts[0].equalsIgnoreCase(wrkDatabaseSchemaTableParts[wrkDatabaseSchemaTableParts.length - 3])) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Set languase in session and in client-side (put it outside <script></script>)
     *
     * @param session
     * @param out
     * @param lang    (String, "IT" or "EN")
     */
    public static boolean setLanguage(HttpSession session, JspWriter out, String lang) throws IOException {
        return workspace.setLanguage(session, out, lang);
    }

    public static String jsonToRowset(workspace tbl_wrk, JSONArray rowsetJson) throws JSONException {
        String result = null;
        if (rowsetJson != null) {
            ArrayList<Integer> colMap = new ArrayList<Integer>();
            boolean colMapped = false;
            result = "[";
            for (int ir = 0; ir < rowsetJson.length(); ir++) {
                String row = "";
                JSONObject rowJson = rowsetJson.getJSONObject(ir);
                int colCounter = 0;
                if (rowJson != null) {
                    JSONArray names = ((JSONObject) rowJson).names();
                    for (int iname = 0; iname < names.length(); iname++) {
                        int field1B = 0;
                        if (colMapped) {
                            field1B = colMap.get(iname);
                        } else {
                            String colName = names.getString(iname);
                            JSONObject col = workspace.getColumnByName(tbl_wrk, colName);
                            if (col != null) {
                                String sfield1B = col.getString("field");
                                try {
                                    field1B = Integer.parseInt(sfield1B);
                                    colMap.add(field1B);
                                } catch (Exception e) {
                                    colMap.add(0);
                                }
                            } else {
                                colMap.add(0);
                            }
                        }
                        if (field1B > 0) {
                            Object obj = rowJson.get(names.getString(iname));
                            row += (colCounter > 0 ? "," : "") + "\"" + field1B + "\"" + ":";
                            if (obj == null) {
                                row += "null";
                            } else {
                                if (obj instanceof String) {
                                    row += "\"" + String.valueOf(obj) + "\"";
                                } else if (obj instanceof Integer || obj instanceof Long || obj instanceof BigDecimal || obj instanceof Float || obj instanceof Double) {
                                    row += "" + String.valueOf(obj) + "";
                                } else if (obj instanceof Boolean) {
                                    row += "" + ((boolean) obj ? "true" : "false") + "";
                                } else {
                                    row += "\"" + String.valueOf(obj) + "\"";
                                }
                            }
                            colCounter++;
                        }
                    }
                    colMapped = true;
                }
                result += (ir > 0 ? "," : "") + "{" + row + "}";
            }
            result += "]";
        }
        return result;
    }

    public static String append_to_folder(String folder, String file) {
        if (folder != null && file != null) {
            if (folder.endsWith(File.separator)) {
                return folder + file;
            } else {
                return folder + (file.startsWith(File.separator) ? file : File.separator + file);
            }
        }
        return folder;
    }

    public static boolean append_to_file_content(String fileName, StringBuffer content, boolean insertBefore, String tag) throws IOException {
        if (insertBefore) {
            RandomAccessFile randomAccessFile = null;
            try {
                randomAccessFile = new RandomAccessFile(fileName, "rw");
                long size = randomAccessFile.length();
                byte[] buf = new byte[512];
                if (size > 512) {
                    randomAccessFile.seek(size - 512);
                } else {
                    randomAccessFile.seek(0);
                }
                randomAccessFile.read(buf);
                String bufStr = new String(buf);
                int pos = bufStr.lastIndexOf(tag);
                if (pos >= 0) {
                    randomAccessFile.seek(size - (buf.length - pos));
                }
                randomAccessFile.write("\n\n".getBytes(StandardCharsets.UTF_8));
                randomAccessFile.write(content.toString().getBytes(StandardCharsets.UTF_8));
                randomAccessFile.write(("\n" + tag).getBytes(StandardCharsets.UTF_8));
            } finally {
                if (randomAccessFile != null)
                    randomAccessFile.close();
            }
            return true;

        } else {
            Files.write(Paths.get(fileName), "\n\n".getBytes(StandardCharsets.UTF_8), StandardOpenOption.APPEND);
            Files.write(Paths.get(fileName), content.toString().getBytes(StandardCharsets.UTF_8), StandardOpenOption.APPEND);
            return true;
        }
    }

    public static Object invoke(Object clsInstance, String methodName) throws ClassNotFoundException, InvocationTargetException, NoSuchMethodException, IllegalAccessException {
        return event.invoke(clsInstance, methodName, null);
    }
    public static Object invoke(Object clsInstance, String methodName, Object [] Params) throws ClassNotFoundException, InvocationTargetException, NoSuchMethodException, IllegalAccessException {
        return event.invoke(clsInstance, methodName, Params);
    }

    public static ArrayList<Object> arrayFromJson(JSONArray json_array, String prop) {
        ArrayList<Object> objList = new ArrayList<>();
        for (int id = 0; id < json_array.length(); id++) {
            JSONObject json = json_array.getJSONObject(id);
            if (json != null) {
                objList.add(json.get(prop));
            }
        }
        return objList;
    }

    public static  Map<String, Object> request_params_to_hash_map(HttpServletRequest request, String[] params) {
        Map<String, Object> parametersString = new HashMap<String, Object>();
        for (String k : params ) {
            parametersString.put(k, request.getParameter(k));
        }
        return parametersString;
    }


    public static class DataListCache {
        public String databaseSchemaTable = null, codeColumn = null, descColumn = null, where = null;
        public ArrayList<Object> beans = null;
    }

    public static ArrayList<DataListCache> glDataListCache = new ArrayList<DataListCache>();


    public static DataListCache get_datalist_from_cahce(String databaseSchemaTable, String codeColumn, String descColumn, String where) {
        for (int i = 0; i < glDataListCache.size(); i++) {
            DataListCache dataListCache = glDataListCache.get(i);
            if (dataListCache != null) {
                if (databaseSchemaTable.equalsIgnoreCase(dataListCache.databaseSchemaTable)) {
                    if (codeColumn.equalsIgnoreCase(dataListCache.codeColumn)) {
                        if (descColumn.equalsIgnoreCase(dataListCache.descColumn)) {
                            if ((where == null && dataListCache.where == null) || (where != null && where.equalsIgnoreCase(dataListCache.where))) {
                                return dataListCache;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     *
     * @param controlId
     * @param databaseSchemaTable
     * @param codeColumn
     * @param descColumn
     * @param where
     * @param emptyRow
     * @param chacheIt
     * @return
     */
    public static String get_datalist_from_table(String controlId, String databaseSchemaTable, String codeColumn, String descColumn, String where, String emptyRow, boolean chacheIt) throws Throwable {
        return get_datalist_from_table(controlId, databaseSchemaTable, codeColumn, descColumn, null, where, null, emptyRow, null, chacheIt);
    }


    /**
     * @param inputId               ID of the control (code)
     * @param databaseSchemaTable
     * @param codeColumn            Code field in the database
     * @param descColumn            Description field in the database
     * @param tooltipColumn         Tooltip field in the database
     * @param where
     * @param order
     * @param emptyRow              Show empty row (emptyRow define the code of the option element)
     * @param currentValue          current code value (as selected)
     * @param chacheIt
     * @return
     * @throws Throwable
     */
    public static String get_datalist_from_table(String inputId, String databaseSchemaTable,
                                                 String codeColumn, String descColumn, String tooltipColumn,
                                                 String where, String order,
                                                 String emptyRow,
                                                 String currentValue,
                                                 boolean chacheIt) throws Throwable {
        String out = "";
        String datalistId = inputId+".list";
        String descId = inputId+".desc";
        ArrayList<Object> beans = null;
        DataListCache dataListCache = get_datalist_from_cahce(databaseSchemaTable, codeColumn, descColumn, where);
        if (dataListCache != null) {
            beans = dataListCache.beans;
        } else {
            beans = bean.load_beans(databaseSchemaTable, null, (where != null && !where.isEmpty() ? where : "*"), 0, order);
        }
        boolean codeHidden = false;
        String [] codeColumnParts = null;
        String idColumn = null;
        if(codeColumn != null) {
            /*codeColumnParts = codeColumn.split("\\|");
            if (codeColumnParts.length > 1) {
                codeColumn = codeColumnParts[0];
                idColumn = codeColumnParts[1];
                codeHidden = true;
            }*/
            codeHidden = true;
        }

        if(codeHidden) {
            out += "<input type=\"text\" class=\"liquidDatalistDesc\" id=\"" + descId + "\" style=\"visibility:'hidden'\"" + "value=\"" + "" + "\" />";
        }
        out += "<datalist " +
                "id=\"" + datalistId + "\" " +
                "class='liquidDatalist' "+
                "data-inputid=\""+inputId+"\" " +
                // (idColumn != null ? "onchange=\"try { Liquid.onOptionSelected(this,'"+idColumn+"') } catch (e) { console.error(e) }\" " : " ") +
                ">";
        int iCurrent = 0;
        if(currentValue != null) {
            if (beans != null) {
                for (int i = 0; i < beans.size(); i++) {
                    String code = (codeColumn != null ? String.valueOf(utility.getEx(beans.get(i), codeColumn)) : null);
                    if(currentValue.compareTo(code) == 0) {
                        iCurrent = i + 1;
                        break;
                    }
                }
            }
        }
        if (emptyRow != null) {
            out += "<option title=\"" + ("") + "\" " +
                    (iCurrent == 0 ? "selected " : "") +
                    "value=\"" + emptyRow + "\">" + " " + "</option>";
        }
        if (beans != null) {
            for (int i = 0; i < beans.size(); i++) {
                String code = (codeColumn != null ? String.valueOf(utility.getEx(beans.get(i), codeColumn)) : null);
                String desc = (descColumn != null ? (String) utility.getEx(beans.get(i), descColumn) : null);
                String tooltip = (tooltipColumn != null ? (String) (utility.has(beans.get(i), tooltipColumn) ? utility.getEx(beans.get(i), tooltipColumn) : null) : null);
                out += "<option " +
                        (iCurrent == i+1 ? "selected " : "") +
                        "data-id=\""+code+"\" " +
                        "data-code=\""+code+"\" " +
                        "name=\""+desc+"\" " +
                        "" + (tooltip != null ? "title=\"" + tooltip.replace("\"", "'") +"\"" : "") +
                        (codeHidden ? "" : "value=\"" + code + "\" ") +
                        ">" + desc + "</option>";
            }
        }
        out += "</datalist>";
        if (dataListCache == null) {
            if (chacheIt) {
                dataListCache = new DataListCache();
                dataListCache.databaseSchemaTable = databaseSchemaTable;
                dataListCache.codeColumn = codeColumn;
                dataListCache.descColumn = descColumn;
                dataListCache.where = where;
                dataListCache.beans = beans;
                glDataListCache.add(dataListCache);
            }
        }
        if(codeHidden) {
            // No attavato da document ready in liquid.js
            // out += "<script>Liquid.setupDescDatalist('" + inputId + "','" + descId + "','" + datalistId + "')</script>";
        }
        return out;
    }


    /**
     * Create search input HRML control
     *
     * @param inputId
     * @param databaseSchemaTable
     * @param codeColumn
     * @param descColumn
     * @param tooltipColumn
     * @param where
     * @param order
     * @param emptyRow
     * @param chacheIt
     * @param onChange
     * @param style
     * @return
     * @throws Throwable
     */
    public static String get_search_datalist_from_table(
            String inputId, String databaseSchemaTable, String codeColumn,
            String descColumn, String tooltipColumn,
            String where, String order, String emptyRow, boolean chacheIt,
            String onChange, String style
    ) throws Throwable {

        String input = "<input class=\"auctionEditboxClass\"\n" +
                "id=\""+inputId+"\"\n" +
                "type=\"text\"\n" +
                "value=\"\"\n" +
                "placeholder=\"\"\n" +
                "onchange=\""+onChange+"\"\n" +
                "style=\""+style+"\"\n" +
                "onmousedown=\"this.placeholder=this.value; if(!this.readOnly && !this.disabled) this.value =''\"\n" +
                "onblur=\"if(!this.value) { this.value=this.placeholder; onchange(this); }\"\n" +
                ">\n";

        String datalist = com.liquid.utility.get_datalist_from_table(
                inputId,
                databaseSchemaTable,
                codeColumn,
                descColumn,
                tooltipColumn,
                where, order, emptyRow, null, chacheIt
        );

        String descId = inputId+".desc";
        String reset = "<button class=\"close-icon\" " +
                "onclick=\"" +
                "if(document.getElementById('"+inputId+"').value) { " +
                "document.getElementById('"+inputId+"').value=''; " +
                "document.getElementById('"+inputId+"').placeholder=''; " +
                "document.getElementById('"+inputId+"').onchange(); " +
                "document.getElementById('"+descId+"').value=''; " +
                "document.getElementById('"+descId+"').placeholder=''; " +
                "document.getElementById('"+descId+"').onchange(); " +
                "} else {}\">" +
                "</button>";

        return input + "\n" + datalist + "\n" + reset;
    }


    /**
     *
     * @param inputId
     * @param onChange
     * @param style
     * @return
     * @throws Throwable
     */
    public static String get_search_text_box(
            String inputId,
            String onChange, String style
    ) throws Throwable {

        String input = "<input class=\"auctionEditboxClass\"\n" +
                "id=\""+inputId+"\"\n" +
                "type=\"text\"\n" +
                "value=\"\"\n" +
                "placeholder=\"\"\n" +
                "onchange=\""+onChange+"\"\n" +
                "style=\""+style+"\"\n" +
                ">\n";

        String reset = "<button class=\"close-icon\" onclick=\"if(document.getElementById('"+inputId+"').value) { document.getElementById('"+inputId+"').value=''; document.getElementById('"+inputId+"').placeholder=''; document.getElementById('"+inputId+"').onchange(); } else {}\"></button>";

        return input + "\n" + reset;
    }


    /**
     *
     * @param inputId
     * @return
     */
    public static String get_reset_button( String inputId ) {
        return "<button class=\"close-icon\" onclick=\"if(document.getElementById('"+inputId+"').value) { document.getElementById('"+inputId+"').value=''; document.getElementById('"+inputId+"').placeholder=''; document.getElementById('"+inputId+"').onchange(); } else {}\"></button>";
    }


    /**
     * reset datalist readed data
     */
    public static void resetDatalistCache() {
        glDataListCache.clear();
    }


    /**
     *
     * @param fileName
     * @param fileContent
     * @return
     */
    public static boolean set_file_content(String fileName, String fileContent) {
        BufferedWriter out = null;
        File f = new File(fileName);

        try {

            if (!f.exists()) {
                if (f.createNewFile()) {
                    System.out.println("File created: " + f.getName());
                } else {
                    System.out.println("set_file_content() connot create file: " + fileName);
                    return false;
                }
            }
            if (!f.canRead()) {
                System.out.println("set_file_content() connot read file: " + fileName);
                return false;
            }
            if (!f.canWrite()) {
                System.out.println("set_file_content() connot write file: " + fileName);
                return false;
            }

            out = new BufferedWriter(new FileWriter(fileName));
            out.write(fileContent);

        } catch (IOException e) {
            System.out.println("set_file_content() error: " + e.getMessage());
            return false;
        } finally {
            if (out != null) {
                try {
                    out.close();
                } catch (IOException e) {
                    System.out.println("set_file_content() error: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
        return true;
    }

    /**
     *
     * @param cDate
     * @param days
     * @return
     */
    public static java.util.Date addToDate(Date cDate, int days) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(cDate);
        cal.add(Calendar.DATE, days); //minus number would decrement the days
        return cal.getTime();
    }


    /**
     *
     * @param cDate
     * @param format
     * @return
     */
    public static String dateToString(Date cDate, String format) {
        DateFormat dateFormat = format != null ? new SimpleDateFormat(format) : new SimpleDateFormat("dd" + workspace.dateSep + "MM" + workspace.dateSep + "yyyy");
        return dateFormat.format(cDate);
    }

    /**
     *
     * @param cDate
     * @param format
     * @return
     */
    public static String dateToString(long cDate, String format) {
        DateFormat dateFormat = format != null ? new SimpleDateFormat(format) : new SimpleDateFormat("dd" + workspace.dateSep + "MM" + workspace.dateSep + "yyyy");
        return dateFormat.format(new Date(cDate));
    }


    static class MyErrorHandler implements ErrorHandler {
        public void warning(SAXParseException e) throws SAXException {
            show("Warning", e);
            throw (e);
        }

        public void error(SAXParseException e) throws SAXException {
            show("Error", e);
            throw (e);
        }

        public void fatalError(SAXParseException e) throws SAXException {
            show("Fatal Error", e);
            throw (e);
        }

        private void show(String type, SAXParseException e) {
            System.out.println(type + ": " + e.getMessage());
            System.out.println("Line " + e.getLineNumber() + " Column " + e.getColumnNumber());
            System.out.println("System ID: " + e.getSystemId());
        }
    }


    public static Object getArchiveXMLTag(String warFile, String resourceFile, String attribute) throws IOException, SAXException, ParserConfigurationException, XPathExpressionException {
        java.util.zip.ZipFile zipFile = new java.util.zip.ZipFile(warFile);
        java.util.zip.ZipEntry r = zipFile.getEntry(resourceFile);
        if (r != null) {
            InputStream is = zipFile.getInputStream(r);
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            // dbf.setNamespaceAware(false);
            DocumentBuilder parser = dbf.newDocumentBuilder();
            MyErrorHandler myErrorHandler = new MyErrorHandler();
            parser.setErrorHandler(myErrorHandler);
            Document doc = (Document) parser.parse(is);
            XPathFactory xPathfactory = XPathFactory.newInstance();
            XPath xpath = xPathfactory.newXPath();
            Element userElement = (Element) xpath.evaluate(attribute, doc, XPathConstants.NODE);
            if (userElement != null) {
                // <version major="2" minor="0" build="0" revision="022" date="19-05-2020">
                return (Object) (userElement.getAttribute("major") + "." + userElement.getAttribute("minor") + "." + userElement.getAttribute("build") + "." + userElement.getAttribute("revision") + " - date:" + userElement.getAttribute("date"));
            }
        }
        return "";
    }

    public static String getFileContent(String fileName) throws Exception {
        return workspace.get_file_content((HttpServletRequest) null, fileName, false, false);
    }

    public static String get_file_content(String fileName) throws Exception {
        return workspace.get_file_content((HttpServletRequest) null, fileName, false, false);
    }

    public static String getArchiveFile(String warFile, String resourceFile, String attribute) throws IOException, SAXException, ParserConfigurationException, XPathExpressionException {
        java.util.zip.ZipFile zipFile = new java.util.zip.ZipFile(warFile);
        java.util.zip.ZipEntry r = zipFile.getEntry(resourceFile);
        if (r != null) {
            InputStream is = zipFile.getInputStream(r);
            if (is.available() > 0) {
                BufferedReader br = new BufferedReader(new InputStreamReader(is));
                StringBuffer sb = new StringBuffer();
                while (true) {
                    String line = br.readLine();
                    if (line != null) {
                        sb.append(line);
                    } else {
                        break;
                    }
                }
                return sb.toString();
            }
        }
        return null;
    }


    //
    // Wrappers
    //
    public static String arrayToString(String[] objs, String prefix, String postfix, String separator) {
        return workspace.arrayToString(objs, prefix, postfix, separator);
    }

    public static String arrayToString(Object[] objs, String prefix, String postfix, String separator) {
        return workspace.arrayToString(objs, prefix, postfix, separator);
    }

    public static String jsonArrayToString(JSONArray objs, String prefix, String postfix, String separator) {
        return workspace.jsonArrayToString(objs, prefix, postfix, separator);
    }

    public static ArrayList<String> jsonArrayToArrayList(JSONArray objs, String prefix, String postfix) {
        return workspace.jsonArrayToArrayList(objs, prefix, postfix);
    }

    public static ArrayList<String> jsonArrayToArrayList(JSONArray objs) {
        return workspace.jsonArrayToArrayList(objs, null, null);
    }

    public static String arrayToString(ArrayList<String> columns, String prefix, String postfix, String separator) {
        return arrayToString(columns.toArray(), prefix, postfix, separator);
    }

    public static String objArrayToString(ArrayList<Object> columns, String prefix, String postfix, String separator) {
        return arrayToString(columns.toArray(), prefix, postfix, separator);
    }


    private static boolean contains(String[] list, Object key) {
        for (int i = 0; i < list.length; i++) {
            if (list[i].compareTo(String.valueOf(key)) == 0) return true;
        }
        return false;
    }

    public static boolean contains(ArrayList<Object> controlIds, Object controlId) {
        for (int i = 0; i < controlIds.size(); i++) {
            if (String.valueOf(controlIds.get(i)).equals(String.valueOf(controlId))) return true;
        }
        return false;
    }

    public static boolean contains(ArrayList<Object> beans, Object bean, String Key) {
        Object keyVal = utility.getEx(bean, Key);
        for (int i = 0; i < beans.size(); i++) {
            Object val = utility.getEx(beans, Key);
            if (keyVal.equals(val)) return true;
        }
        return false;
    }

    public static boolean contains(List<String> controlIds, String controlId) {
        for (int i = 0; i < controlIds.size(); i++) {
            if (controlIds.get(i).equalsIgnoreCase(controlId)) return true;
        }
        return false;
    }

    public static <T> ArrayList<T> removeDuplicates(ArrayList<T> list) {
        ArrayList<T> newList = new ArrayList<T>();
        for (T element : list) {
            if (!newList.contains(element)) {
                newList.add(element);
            }
        }
        return newList;
    }


    public static String htmlEncode(String s) {
        return htmlEncode(s, true);
    }

    public static String htmlEncode(String s, boolean encodeSpecialChars) {
        if (s != null) {
            StringBuilder str = new StringBuilder();

            for (int j = 0; j < s.length(); j++) {
                char c = s.charAt(j);

                // encode standard ASCII characters into HTML entities where needed
                if (c < '\200') {
                    switch (c) {
                        case '"':
                            str.append("&quot;");

                            break;

                        case '&':
                            str.append("&amp;");

                            break;

                        case '<':
                            str.append("&lt;");

                            break;

                        case '>':
                            str.append("&gt;");

                            break;

                        default:
                            str.append(c);
                    }
                } // encode 'ugly' characters (ie Word "curvy" quotes etc)
                else if (encodeSpecialChars && (c < '\377')) {
                    String hexChars = "0123456789ABCDEF";
                    int a = c % 16;
                    int b = (c - a) / 16;
                    str.append("&#x").append(hexChars.charAt(b)).append(hexChars.charAt(a)).append(';');
                } //add other characters back in - to handle charactersets
                //other than ascii
                else {
                    str.append(c);
                }
            }
            return str.toString();
        }
        return null;
    }

    public static String decodeHtml(String str) {
        if (str != null && !str.isEmpty()) {
            return Jsoup.parse(str).text().replaceAll("\\<.*?>", "");
        } else {
            return str;
        }
    }

    public static String createRegexFromGlob(String glob) {
        StringBuilder out = new StringBuilder("^");
        for (int i = 0; i < glob.length(); ++i) {
            final char c = glob.charAt(i);
            switch (c) {
                case '*':
                    out.append(".*");
                    break;
                case '?':
                    out.append('.');
                    break;
                case '.':
                    out.append("\\.");
                    break;
                case '\\':
                    out.append("\\\\");
                    break;
                default:
                    out.append(c);
            }
        }
        out.append('$');
        return out.toString();
    }


    /**
     * Uopdate column attribute inside the control
     *
     * @param controlJSON the control (JSONObject)
     * @param columnName  the name of the updating column (Srting)
     * @param attribute   the attribute to update (Srting)
     * @param value       the nre value (Object)
     * @return
     * @throws JSONException
     */
    static public boolean setControlColumn(JSONObject controlJSON, String columnName, String attribute, Object value) throws JSONException {
        boolean retVal = false;
        if (controlJSON != null && columnName != null) {
            if (controlJSON.has("columns")) {
                JSONArray columns = controlJSON.getJSONArray("columns");
                for (int i = 0; i < columns.length(); i++) {
                    JSONObject column = columns.getJSONObject(i);
                    if (controlJSON.has("name")) {
                        if (columnName.equalsIgnoreCase(column.getString("name"))) {
                            if (attribute != null) {
                                column.put(attribute, value);
                                retVal = true;
                            }
                        }
                    }
                }
            }
        }
        return retVal;
    }


    class FolderWatchThread extends Thread {

        public String folder = null;
        public String fileExt = null;

        public Object callbackInstance = null;
        public String callbackMethod = null;
        private Method method = null;

        public String error = "";

        public boolean run = false;

        public void run() {

            try {

                WatchService watchService = FileSystems.getDefault().newWatchService();

                Path path = Paths.get(folder);

                path.register(
                        watchService,
                        StandardWatchEventKinds.ENTRY_CREATE,
                        StandardWatchEventKinds.ENTRY_DELETE,
                        StandardWatchEventKinds.ENTRY_MODIFY
                );

                WatchKey key;

                run = true;

                if (callbackInstance != null) {
                    try {
                        Class cls = callbackInstance.getClass();
                        method = cls.getMethod(callbackMethod, String.class, Object.class);
                        if (method == null) {
                            error += "Method " + callbackMethod + " not found.. Did you declare it publlic ?" + "\n";
                        }
                    } catch (Exception ex) {
                        error += ex.getLocalizedMessage() + "\n";
                        Logger.getLogger(wsStreamerClient.class.getName()).log(Level.SEVERE, null, ex);
                        Method[] methods = callbackMethod.getClass().getMethods();
                        for (int i = 0; i < methods.length; i++) {
                            System.err.println("{" + callbackMethod.getClass() + "}.Method #" + (i + 1) + ":" + methods[i].toString());
                        }
                    }
                }

                while ((key = watchService.take()) != null) {

                    if (!run) return;

                    for (WatchEvent<?> event : key.pollEvents()) {
                        if (callbackInstance != null && method != null) {
                            try {
                                boolean retVal = (boolean) method.invoke(callbackInstance, folder + File.separator + event.context(), (Object) event.kind());
                            } catch (Throwable th) {
                                Logger.getLogger(wsStreamerClient.class.getName()).log(Level.SEVERE, null, th);
                            }
                        } else {
                            System.out.println("Event kind:" + event.kind() + ". File affected: " + event.context() + ".");
                        }
                    }
                    key.reset();
                }

            } catch (Exception ex) {
                error += ex.getLocalizedMessage() + "\n";
                Logger.getLogger(wsStreamerClient.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    }


    static public ArrayList<FolderWatchThread> folderWatchThreadList = new ArrayList<FolderWatchThread>();

    /**
     * Starts a watch thread in a folder, calling the callbackInstance.callbackMethod in case of event
     *
     * @param folder
     * @param fileExt
     * @param callbackInstance
     * @param callbackMethod
     * @return
     * @throws Exception
     */
    static public boolean startWatchFolder(String folder, String fileExt, Object callbackInstance, String callbackMethod) throws Exception {
        try {
            for (FolderWatchThread folderWatchThread : folderWatchThreadList) {
                if (folder.equalsIgnoreCase(folderWatchThread.folder)) {
                    folderWatchThread.run = false;
                    Thread.sleep(1000);
                    folderWatchThread.interrupt();
                    folderWatchThreadList.remove(folderWatchThread);
                }
            }
        } catch (Exception ex) {
            Logger.getLogger(wsStreamerClient.class.getName()).log(Level.SEVERE, null, ex);
        }
        FolderWatchThread folderWatchThread = new utility().new FolderWatchThread();
        folderWatchThread.folder = folder;
        folderWatchThread.fileExt = fileExt;
        folderWatchThread.callbackInstance = callbackInstance;
        folderWatchThread.callbackMethod = callbackMethod;
        folderWatchThreadList.add(folderWatchThread);
        folderWatchThread.start();
        return true;
    }

    /**
     * @param folder
     * @return
     * @throws Exception
     */
    static public boolean stopWatchFolder(String folder) throws Exception {
        for (FolderWatchThread folderWatchThread : folderWatchThreadList) {
            if (folder.equalsIgnoreCase(folderWatchThread.folder)) {
                folderWatchThread.run = false;
                Thread.sleep(1000);
                folderWatchThread.interrupt();
                folderWatchThreadList.remove(folderWatchThread);
                return true;
            }
        }
        return false;
    }

    /**
     * @param folder
     * @return
     * @throws Exception
     */
    static public String statusWatchFolder(String folder) throws Exception {
        String out = "";
        for (FolderWatchThread folderWatchThread : folderWatchThreadList) {
            out += "Folder:" + folderWatchThread.folder + "\tstatus:" + (folderWatchThread.run ? "running" : "stopped") + "\terror:" + folderWatchThread.error + "\n";
        }
        return out;
    }


    /**
     * @param month (1 based)
     * @param lang  ("IT" / "ENG")
     * @return
     */
    public static String getMonthName(int month, String lang) {
        DateFormatSymbols dateFormatSymbols = new DateFormatSymbols("IT".equalsIgnoreCase(lang) ? Locale.ITALIAN : Locale.ENGLISH);
        return dateFormatSymbols.getMonths()[month - 1];
    }

    /**
     * @param var
     * @return
     */
    public static String toCamelCase(String var) {
        String out = "";
        String[] list = var.replace("-", "_").replace(" ", "_").split("_");
        for (int i = 0; i < list.length; i++) {
            if (i > 0)
                out += capitalizeFirstLetter(list[i]);
            else
                out += list[i].toLowerCase();
        }
        return out;
    }

    /**
     * @param s
     * @return
     */
    public static String capitalizeOlnyFirstLetter(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1).replaceAll("/ /g", "");
    }

    ;

    public static String capitalizeFirstLetter(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1).replaceAll("/ /g", "").toLowerCase();
    }

    ;

    public static String uncapitalizeOlnyFirstLetter(String s) {
        return s.substring(0, 1).toLowerCase() + s.substring(1).replaceAll("/ /g", "");
    }

    public static String toDescriptionCase(String var) {
        String out = "";
        String[] list = var.replace("-", " ").replace("_", " ").split(" ");
        for (int i = 0; i < list.length; i++) {
            if (i > 0)
                out += " " + list[i].toLowerCase();
            else
                out += capitalizeFirstLetter(list[i]);
        }
        return out;
    }

    /**
     * Update a json attay by key, merging sJsonToMerge
     *
     * @param arrayToUpdate
     * @param keyName
     * @param keyValue
     * @param bKeySensitive
     * @param sJsonToMerge
     */
    public static boolean updateJsonArray(JSONArray arrayToUpdate, String keyName, String keyValue, boolean bKeySensitive, String sJsonToMerge) throws Exception {
        boolean result = false;
        if (arrayToUpdate != null && keyName != null) {
            for (int i = 0; i < arrayToUpdate.length(); i++) {
                Object oToUpdate = arrayToUpdate.get(i);
                if (oToUpdate instanceof JSONObject) {
                    JSONObject objToUpdate = (JSONObject) oToUpdate;
                    boolean eq = bKeySensitive ? objToUpdate.getString(keyName).equals(keyValue) : objToUpdate.getString(keyName).equalsIgnoreCase(keyValue);
                    if (eq) {
                        JSONObject jsonToMerge = new JSONObject(sJsonToMerge);
                        if (mergeJsonObject(jsonToMerge, objToUpdate) > 0) {
                            result = true;
                        }
                        break;
                    }
                } else {
                    throw new Exception("Unexpected case");
                }
            }
        }
        return result;
    }

    /**
     * Classe predefinita pannello
     *
     * @param json
     * @param beanClass
     * @return
     */
    public static String get_default_bean_class(JSONObject json, String beanClass) {
        if (beanClass != null) {
            String table = json.getString("table");
            return get_default_bean_class(table, beanClass);
        }
        return null;
    }

    /**
     * Returl last component of full class path
     * @param className
     * @return
     */
    public static String get_class_name_from_full_class_path(String className) {
        if(className != null) {
            String[] classParts = className.split("\\.");
            if (classParts != null) {
                return classParts[classParts.length - 1];
            }
        }
        return null;
    }

    /**
     * Classe predefinita pannello
     *
     * @param table
     * @param beanClass
     * @return
     */
    public static String get_default_bean_class(String table, String beanClass) {
        if (beanClass != null) {
            String[] classParts = beanClass.split("\\.");
            if (classParts != null) {
                classParts[classParts.length - 1] = utility.capitalizeOlnyFirstLetter(nameSpacer.DB2Hibernate(table));
                return utility.arrayToString(classParts, null, null, ".");
            }
        }
        return null;
    }

    /**
     * Ritorna la chiave primaria (campo "name)
     *
     * @param json
     * @return
     */
    public static String get_primary_key_field(JSONObject json) {
        return (String) get_primary_key_info(json)[0];
    }

    /**
     * Ritorna la chiave primaria
     *
     * @param json
     * @return Object [] { campo "name", indice 1 based (int) }
     */
    public static Object[] get_primary_key_info(JSONObject json) {
        if (json.has("primaryKey")) {
            String primakyKey = json.getString("primaryKey");
            JSONArray cols = json.getJSONArray("columns");
            for (int ic = 0; ic < cols.length(); ic++) {
                if (cols.getJSONObject(ic).getString("name").equalsIgnoreCase(primakyKey)) {
                    return new Object[]{cols.getJSONObject(ic).getString("name"), ic + 1};
                }
            }
        }
        return new Object[]{null, 0};
    }


    /**
     * Ritorna il descrittore; il campo che segue la primary key
     *
     * @param json
     * @return
     */
    public static String get_default_descriptor_field(JSONObject json) {
        Object[] pk_info = get_primary_key_info(json);
        if ((int) pk_info[1] > 0) {
            int ic = (int) pk_info[1] - 1 + 1;
            JSONArray cols = json.getJSONArray("columns");
            String name = cols.getJSONObject(ic).getString("name");
            if (name.toLowerCase().startsWith("cod") || name.toLowerCase().startsWith("cd")) {
                if (ic + 1 < cols.length()) {
                    String name2 = cols.getJSONObject(ic + 1).getString("name");
                    if (name.toLowerCase().startsWith("des") || name.toLowerCase().startsWith("ds")) {
                        name = name2;
                    }
                }
            }
            return nameSpacer.DB2Hibernate(name);
        }
        return null;
    }


    static public String get_file_md5(String fileName) throws NoSuchAlgorithmException, IOException {
        MessageDigest digest = MessageDigest.getInstance("MD5");
        File f = new File(fileName);
        InputStream is = new FileInputStream(f);
        byte[] buffer = new byte[8192];
        int read = 0;
        while( (read = is.read(buffer)) > 0) {
            digest.update(buffer, 0, read);
        }
        byte[] md5sum = digest.digest();
        BigInteger bigInt = new BigInteger(1, md5sum);
        String output = bigInt.toString(16);
        return utility.base64Encode(output);
    }

    static public String get_file_content_md5(byte [] buffer) throws NoSuchAlgorithmException, IOException {
        MessageDigest digest = MessageDigest.getInstance("MD5");
        digest.update(buffer, 0, buffer.length);
        byte[] md5sum = digest.digest();
        BigInteger bigInt = new BigInteger(1, md5sum);
        String output = bigInt.toString(16);
        return utility.base64Encode(output);
    }

    /*
    static public String [] get_upload_file_content(HttpServletRequest request, String tempFolder, long maxFileSize) {
        boolean isMultipart = ServletFileUpload.isMultipartContent(request);

        response.setContentType("text/html");
        java.io.PrintWriter out = response.getWriter( );
          if( !isMultipart ){
            out.println("<html>");
            out.println("<head>");
            out.println("<title>Servlet upload</title>");
            out.println("</head>");
            out.println("<body>");
            out.println("<p>No file uploaded</p>");
            out.println("</body>");
            out.println("</html>");
            return;
        }

        DiskFileItemFactory factory = new DiskFileItemFactory();
        maximum size that will be stored in memory
        factory.setSizeThreshold(maxMemSize);
        // Location to save data that is larger than maxMemSize.
        factory.setRepository(new File("c:\\temp"));

        // Create a new file upload handler
        ServletFileUpload upload = new ServletFileUpload(factory);
        // maximum file size to be uploaded.
          upload.setSizeMax( maxFileSize );

          try{
            // Parse the request to get file items.
            List fileItems = upload.parseRequest(request);

            // Process the uploaded file items
            Iterator i = fileItems.iterator();

            out.println("<html>");
            out.println("<head>");
            out.println("<title>Servlet upload</title>");
            out.println("</head>");
            out.println("<body>");

            String fileName = "";
            while ( i.hasNext () )
            {
                FileItem fi = (FileItem)i.next();
                if ( !fi.isFormField () )
                {
                    // Get the uploaded file parameters
                    String fieldName = fi.getFieldName();
                    fileName = fi.getName();
                    String contentType = fi.getContentType();
                    boolean isInMemory = fi.isInMemory();
                    long sizeInBytes = fi.getSize();
                    // Write the file
                    if( fileName.lastIndexOf("\\") >= 0 ){
                        file = new File( filePath +
                                fileName.substring( fileName.lastIndexOf("\\"))) ;
                    }else{
                        file = new File( filePath +
                                fileName.substring(fileName.lastIndexOf("\\")+1)) ;
                    }
                    fi.write( file ) ;
                    out.println("Uploaded Filename: " + fileName + "<br>");
                    out.println("Uploaded in location: "+filePath);
                }
            }
            out.println("</body>");
            out.println("</html>");
            ReadExcelDemo rd = new ReadExcelDemo();
            System.out.println("file name: "+fileName.substring(fileName.lastIndexOf("\\")));
            String s = fileName.substring(fileName.lastIndexOf("\\"));
            System.out.println(filePath);
            System.out.println(s);
            String fileP = filePath.concat(s+"\\");

            System.out.println(fileP);
            rd.read(fileP);

        }catch(Exception ex) {
            System.out.println(ex);
        }
    }
    */


    static public Date get_local2server_time(HttpServletRequest request, Object oDate) throws ParseException {
        String sXTimezoneOffset = request.getHeader("X-Timezone-Offset");
        Integer iXTimezoneOffset = Integer.parseInt(sXTimezoneOffset);
        Date dXTimezoneOffset = null;
        if(oDate instanceof String) {
            SimpleDateFormat df = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
            dXTimezoneOffset = df.parse((String)oDate);
        } else if(oDate instanceof Date) {
            dXTimezoneOffset = (Date)oDate;
        }
        if(dXTimezoneOffset != null) {
            Calendar cal = Calendar.getInstance();
            cal.setTime(dXTimezoneOffset);
            cal.add(Calendar.MINUTE, iXTimezoneOffset);
            return cal.getTime();
        }
        return null;
    }

    static public Date get_gmt_time() throws ParseException {
        long date = System.currentTimeMillis();
        int offset = TimeZone.getDefault().getOffset(date);
        return new Date(date + offset);
    }

    public static Timestamp get_gmt_timestamp() {
        long date = System.currentTimeMillis();
        int offset = TimeZone.getDefault().getOffset(date);
        return new Timestamp(date + offset);
    }

}
