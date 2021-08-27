/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

package com.liquid;

import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.*;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.file.*;
import java.nio.file.attribute.*;
import java.text.DateFormat;
import java.text.DateFormatSymbols;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.bind.DatatypeConverter;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.ErrorHandler;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import java.security.cert.X509Certificate;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

// comment this for java <= 7
import org.jsoup.Jsoup;

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
            if(data != null)
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
                    String id;
                    for (int i = 0; i < ids.length(); i++) {
                        id = ids.getString(i);
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
     * @param bean the bean (Object)
     * @param property the Field of the property to get (Field)
     * @param exaclyMatch if false strip by $ and check only the parts defined
     * in the param property (boolean) ex.: searching for 'foreigntTable' the
     * property named 'foreigntTable$foreignColumn$column' is returned as found
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
    /**
     * <h3>Set the property of a bean</h3>
     * <p>
     * This method set a property from a bean
     *
     * @param bean the bean (Object)
     * @param property the name of the property to get (String)
     * @param value the new value to set
     * 
     * @throws java.beans.IntrospectionException
     * @throws java.lang.NoSuchFieldException
     * @throws java.lang.reflect.InvocationTargetException
     * @throws java.lang.IllegalAccessException
     *
     * @see utility
     */
    static public void set(Object bean, String property, Object value) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException {
        Field field = bean.getClass().getDeclaredField(property);
        if (field == null) {
            // Ricerca nei beans per similitudine
            field = searchProperty(bean, property, false, false);
        }
        // debug
        if ("bool".equalsIgnoreCase(property)) {
            int lb = 1;
        }
        if (field != null) {
            field.setAccessible(true);
            Class<?> propType = field.getType();
            try {
                if (propType.equals(Boolean.class) || propType.equals(boolean.class)) {
                    if (value instanceof String) {
                        if (value == null || ((String) value).isEmpty()
                                || "0".equalsIgnoreCase((String) value) || "false".equalsIgnoreCase((String) value)
                                || "N".equalsIgnoreCase((String) value) || "no".equalsIgnoreCase((String) value)
                                || "zero".equalsIgnoreCase((String) value) || "empty".equalsIgnoreCase((String) value)) {
                            if (propType.equals(Boolean.class)) {
                                field.set(bean, new Boolean(false));
                            } else {
                                field.set(bean, false);
                            }
                        } else if (propType.equals(Boolean.class)) {
                            field.set(bean, new Boolean(true));
                        } else {
                            field.set(bean, true);
                        }
                    } else if (value instanceof Object) {
                        field.set(bean, (Boolean) value);
                    }
                } else if (propType.equals(Integer.class)) {
                    if (value instanceof String) {
                        if (value == null || ((String) value).isEmpty()) {
                            field.set(bean, new Integer(0));
                        } else {
                            try {
                                field.set(bean, Integer.parseInt((String) value));
                            } catch(Exception e) {}
                        }
                    } else if (value instanceof Object) {
                        field.set(bean, (Integer) value);
                    }
                } else if (propType.equals(Long.class)) {
                    if (value instanceof String) {
                        if (value == null || ((String) value).isEmpty()) {
                            field.set(bean, new Long(0));
                        } else {
                            try {
                                field.set(bean, Long.parseLong((String) value));
                            } catch(Exception e) {}
                        }
                    } else if (value instanceof Object) {
                        field.set(bean, (Long) value);
                    }
                } else if (propType.equals(Float.class)) {
                    if (value instanceof String) {
                        if (value == null || ((String) value).isEmpty()) {
                            field.set(bean, new Float(0.0f));
                        } else {
                            try {
                                field.set(bean, Float.valueOf(((String) value).replaceAll(",", ".")));
                            } catch(Exception e) {}
                        }
                    } else if (value instanceof Object) {
                        field.set(bean, (Float) value);
                    }
                } else if (propType.equals(java.lang.Double.class)) {
                    if (value instanceof String) {
                        if (value == null || ((String) value).isEmpty()) {
                            field.set(bean, new Double(0.0));
                        } else {
                            try {
                                field.set(bean, Double.valueOf(((String) value).replaceAll(",", ".")));
                            } catch(Exception e) {}
                        }
                    } else if (value instanceof Object) {
                        field.set(bean, (Double) value);
                    }
                } else if (propType.equals(java.lang.String.class)) {
                    if (value instanceof String) {
                        field.set(bean, (String) value);
                    } else if (value instanceof Object) {
                        field.set(bean, String.valueOf(value));
                    }
                } else if (propType.equals(java.util.Date.class)) {
                    field.set(bean, (value != null ? DateUtil.toDate(value) : null ) );            
                } else if (propType.equals(java.sql.Date.class)) {
                    field.set(bean, (value != null ? DateUtil.toDate(value) : null ) );
                } else if (propType.equals(java.sql.Timestamp.class)) {
                    field.set(bean, (value != null ? DateUtil.toTimestamp(value) : null ) ); 
                    // dbSqlDateTime = (java.sql.Timestamp) 2020-05-27 10:41:53.149992
                    // value = (java.lang.String) "27-05-2020 10:35:47.788"
                } else if (propType.equals(java.sql.Time.class)) {
                    if (value instanceof java.sql.Time) {
                        field.set(bean, value);
                    } else {
                        field.set(bean, DateUtil.toTime(value));
                    }
                } else {
                    field.set(bean, value);
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
                    /*
                    OBSOLETO
                    try {
                        bean.getClass().getMethod("setChanged", String.class, boolean.class).invoke(bean, property, true);
                    } catch (Throwable th) {
                        Method[] methods = bean.getClass().getMethods();
                        for(int i=0; i<methods.length; i++) {
                            if(methods[i].getName().equalsIgnoreCase(property)) {
                                System.err.println("{"+bean.getClass()+"}.Method #"+(i+1)+":" + methods[i].toString());
                            }
                        }
                        try {
                            // Ricerca nel bean corrispondenza esatta
                            field = searchProperty(bean, property+"$Changed", true, false);
                            if(field != null)
                                field.set(bean, value);
                        } catch (Throwable th2) {
                            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th2);
                        }
                    }
                     */
                }

            } catch (ParseException ex) {
                Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return;
    }

    /**
     * <h3>Get the property of a bean</h3>
     * <p>
     * This method get a property from a bean
     *
     * @param bean the bean (Object)
     * @param property the name of the property to get (String)
     *
     * @return property value (Object)
     * @see utility
     */
    static public Object get(Object bean, String property) {
        try {
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
        } catch (Throwable th) {
            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th);
        }
        return null;
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
    static public boolean isChanged(Object bean) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException {
        if (bean != null) {
            Field [] fields = bean.getClass().getDeclaredFields();
            for(Field field : fields) {
                if (field != null) {
                    if(field.getName().indexOf("$Changed") != -1) {
                        if((Boolean)get(bean, field.getName())) return true;
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
            if(file != null) {
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

            if(group != null) {
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
            if(owner != null) {
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


    static public boolean fileExist(String folder) {
        if (folder != null && !folder.isEmpty()) {
            File file = new File(folder);
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
     * 
     * @param columns
     * @param checking_columns
     * @return true if match found or checking_columns is null or empty
     */
    static boolean compare_array(ArrayList<String> columns, ArrayList<String> checking_columns) {
        if(checking_columns != null) {
            for(int i=0; i<checking_columns.size(); i++) {
                String v = checking_columns.get(i);
                boolean bFound = false;
                for(int j=0; j<columns.size(); j++) {
                    if(v.equalsIgnoreCase(columns.get(j))) {
                        bFound = true;
                        break;                    
                    }
                }
                if(!bFound) 
                    return false;
            }
        }
        return true;
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
     * 
     * Transfer result to parameter of next event process
     * 
     *  ex.: 
     *       {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
     *           to 
     *       {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
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
     * 
     * Transfer current result to global result for next event process
     * 
     * @param retValToTransfer
     * @param retValTarget
     * @return
     * 
     * ex.: 
     *      {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
     *  to 
     *      {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
     * 
     * @throws JSONException 
     */
    static public String transfer_result_to_results(String retValToTransfer, String retValTarget) throws JSONException {
        return event.transfer_result_to_results(retValToTransfer, retValTarget);
    }


    /**
     * 
     * Transfer error to global result
     * 
     * @param error
     * @param result
     * @return
     * 
     * ex.: 
     *      {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
     *  to 
     *      {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
     * 
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
                sourceContnet = sourceContnet.replace((String) "${"+pair.getKey()+"}", (String) pair.getValue());
            }
        } catch(Exception e) {
            Logger.getLogger("replace_values").log(Level.SEVERE, "errore replacing "+pair.getKey());
        }
        return sourceContnet;
    }




    public static boolean set_file_content(String fileName, String fileContent) {
        BufferedWriter out = null;
        File f = new File(fileName);

        try {

            if (!f.exists()) {
                if (f.createNewFile()) {
                    System.out.println("File created: " + f.getName());
                } else {
                    System.out.println("set_file_content() connot create file: "+fileName);
                    return false;
                }
            }
            if(!f.canRead()) {
                System.out.println("set_file_content() connot read file: "+fileName);
                return false;
            }
            if(!f.canWrite()) {
                System.out.println("set_file_content() connot write file: " + fileName);
                return false;
            }

            out = new BufferedWriter(new FileWriter(fileName));
            out.write(fileContent);

        } catch (IOException e) {
            System.out.println("set_file_content() error: "+e.getMessage());
            return false;
        } finally {
            if(out != null) {
                try {
                    out.close();
                } catch (IOException e) {
                    System.out.println("set_file_content() error: "+e.getMessage());
                    e.printStackTrace();
                }
            }
        }
        return true;
    }

    public static java.util.Date addToDate(Date cDate, int days) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(cDate);
        cal.add(Calendar.DATE, days); //minus number would decrement the days
        return cal.getTime();
    }


    public static String dateToString(Date cDate, String format) {
        DateFormat dateFormat = format != null ? new SimpleDateFormat(format) : new SimpleDateFormat("dd" + workspace.dateSep + "MM" + workspace.dateSep + "yyyy");
        return dateFormat.format( cDate );
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

    public static String getFileContent(String fileName) {
        return workspace.get_file_content((HttpServletRequest) null, fileName, false, false);
    }
    public static String get_file_content(String fileName) {
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
    static String arrayToString(ArrayList<String> columns, String prefix, String postfix, String separator) {
        return arrayToString(columns.toArray(), prefix, postfix, separator);
    }
    
    public static boolean contains(ArrayList<Object> controlIds, Object controlId) {
        for(int i=0; i<controlIds.size(); i++) {
        	if(String.valueOf(controlIds.get(i)).equals(String.valueOf(controlId))) return true;
        }
        return false;
    }
    
    public static boolean contains(List<String> controlIds, String controlId) {
        for(int i=0; i<controlIds.size(); i++) {
            if(controlIds.get(i).equalsIgnoreCase(controlId)) return true;
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
    
    public static String decodeHtml( String str ) {
        if(str != null && !str.isEmpty()) {
            return Jsoup.parse(str).text().replaceAll("\\<.*?>","");
        } else {
            return str;
        }
    }
    
    public static String createRegexFromGlob(String glob) {
        StringBuilder out = new StringBuilder("^");
        for(int i = 0; i < glob.length(); ++i) {
            final char c = glob.charAt(i);
            switch(c) {
                case '*': out.append(".*"); break;
                case '?': out.append('.'); break;
                case '.': out.append("\\."); break;
                case '\\': out.append("\\\\"); break;
                default: out.append(c);
            }
        }
        out.append('$');
        return out.toString();
    }
    
    
    /**
     * Uopdate column attribute inside the control
     * @param controlJSON   the control (JSONObject)
     * @param columnName    the name of the updating column (Srting)
     * @param attribute     the attribute to update (Srting)
     * @param value         the nre value (Object)
     * @return
     * @throws JSONException 
     */
    static public boolean setControlColumn(JSONObject controlJSON, String columnName, String attribute, Object value) throws JSONException {
    	boolean retVal = false;
        if (controlJSON != null && columnName != null) {
            if (controlJSON.has("columns")) {
            	JSONArray columns = controlJSON.getJSONArray("columns");
                for(int i=0; i<columns.length(); i++) {
                	JSONObject column = columns.getJSONObject(i);
                	if (controlJSON.has("name")) {
                		if(columnName.equalsIgnoreCase(column.getString("name"))) {
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

                if(callbackInstance != null) {
                    try {
                        Class cls = callbackInstance.getClass();
                        method = cls.getMethod(callbackMethod, String.class, Object.class);
                        if(method == null) {
                            error += "Method "+callbackMethod+" not found.. Did you declare it publlic ?" + "\n";
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
                    
                    if(!run) return;
                    
                    for (WatchEvent<?> event : key.pollEvents()) {
                        if(callbackInstance != null && method != null) {
                            try {
                                boolean retVal = (boolean) method.invoke(callbackInstance, folder+File.separator+event.context(), (Object)event.kind());
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
    
    static public boolean startWatchFolder(String folder, String fileExt, Object callbackInstance, String callbackMethod) throws Exception {
        try {
            for (FolderWatchThread folderWatchThread : folderWatchThreadList) {
                if(folder.equalsIgnoreCase(folderWatchThread.folder)) {
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
    
    static public boolean stopWatchFolder(String folder) throws Exception {        
        for (FolderWatchThread folderWatchThread : folderWatchThreadList) {
            if(folder.equalsIgnoreCase(folderWatchThread.folder)) {
                folderWatchThread.run = false;
                Thread.sleep(1000);
                folderWatchThread.interrupt();
                folderWatchThreadList.remove(folderWatchThread);
                return true;
            }        
        }
        return false;
    }
    
    static public String statusWatchFolder(String folder) throws Exception {        
        String out = "";
        for (FolderWatchThread folderWatchThread : folderWatchThreadList) {
            out += "Folder:"+folderWatchThread.folder+ "\tstatus:"+(folderWatchThread.run ? "running" : "stopped")+ "\terror:"+folderWatchThread.error+"\n";
        }
        return out;
    }


    /**
     *
     * @param month (1 based)
     * @param lang ("IT" / "ENG")
     * @return
     */
    public static String getMonthName(int month, String lang) {
        DateFormatSymbols dateFormatSymbols = new DateFormatSymbols("IT".equalsIgnoreCase(lang) ? Locale.ITALIAN : Locale.ENGLISH);
        return dateFormatSymbols.getMonths()[month-1];
    }

}
