package com.liquid;

import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
// import java.util.Base64;
import javax.servlet.ServletContext;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.jsp.JspWriter;
import javax.xml.bind.DatatypeConverter;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;
import org.apache.commons.codec.*;



public class utility {
    
    static public String base64Encode(String data) {
        if(data == null || data.isEmpty()) return "";
        try {
            return base64Encode(data.getBytes());
        } catch(Throwable th) {
            System.err.println("Error:"+th.getLocalizedMessage()+"Please try adding apache commons-codes.jar to your project");
        }
        return "";
    }
    static public String base64Encode(byte [] data) {
        if(data == null) return "";
        try {
            return DatatypeConverter.printBase64Binary(data);
        } catch(Throwable th) {
            try {
                return new String(Base64.getEncoder().encode(data));
                // throw new Throwable();  // x java 7
            } catch(Throwable th2) {
                try {
                    return new String(org.apache.commons.codec.binary.Base64.encodeBase64(data));
                } catch(Throwable th3) {
                    System.err.println("Error:"+th3.getLocalizedMessage()+"Please try adding apache commons-codes.jar to your project");
                }
            }
        }
        return "";
    }
    static public String base64Decode(String data) {
        try {
            return base64Decode(data.getBytes());
        } catch(Throwable th) {
            System.err.println("Error:"+th.getLocalizedMessage()+"Please try adding apache commons-codes.jar to your project");
        }
        return null;
    }
    static public String base64Decode(byte [] data) {
        try {
            return new String(DatatypeConverter.parseBase64Binary(new String(data)));
        } catch(Throwable th) {            
            try {
                return new String(Base64.getDecoder().decode(data));
                // throw new Throwable(); // x java 7
            } catch(Throwable th2) {
                try {
                    return new String(org.apache.commons.codec.binary.Base64.decodeBase64(data));
                } catch(Throwable th3) {
                    System.err.println("Error:"+th3.getLocalizedMessage());
                }
            }
        }
        return null;
    }

    
    static public ArrayList<String> get_dms_keys ( workspace tblWrk, String params ) {
        ArrayList<String> keyList = null;
        try {
            if(tblWrk != null) {
                JSONObject paramsJson = new JSONObject((String)params);
                JSONObject paramJson = paramsJson.getJSONObject("params");
                if(paramJson != null) {
                    JSONArray ids = paramJson.getJSONArray("ids");
                    String database = null, schema = null, table = null, name = null;
                    try { database = paramJson.getString("database"); } catch(Exception e) {}
                    try { schema = paramJson.getString("schema"); } catch(Exception e) {}
                    try { table = paramJson.getString("table"); } catch(Exception e) {}
                    try { name = paramJson.getString("name"); } catch(Exception e) {}
                    // { database:liquid.tableJson.database, schema:liquid.tableJson.schema, table:liquid.tableJson.table, ids:nodeKeys };
                    if(database==null || database.isEmpty()) try { database = tblWrk.tableJson.getString("database");  } catch(Exception e) {}
                    if(schema==null || schema.isEmpty()) try { schema = tblWrk.tableJson.getString("schema");  } catch(Exception e) {}
                    if(table==null || table.isEmpty()) try { table = tblWrk.tableJson.getString("table");  } catch(Exception e) {}

                    if(database==null || database.isEmpty()) database = tblWrk.defaultDatabase;
                    if(schema==null || schema.isEmpty()) schema = "";
                    if(table==null || table.isEmpty()) table = "";
                    if(name==null || name.isEmpty()) try { name = "default"; } catch(Exception e) {}

                    keyList = new ArrayList<String>();
                    String id;
                    for(int i=0; i<ids.length(); i++) {
                        id = ids.getString(i);
                        keyList.add(database+"."+schema+"."+table+"."+name+"."+id);
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
     * @param  bean  the bean (Object)
     * @param  property the Field of the property to get (Field)
     * @param  exaclyMatch if false strip by $ and check only the parts defined in the param property (boolean)
     *                      ex.: searching for 'foreigntTable' the property named 'foreigntTable$foreignColumn$column' is returned as found
     * @see         utility
     */
    static public Field searchProperty( Object bean, String property, boolean exaclyMatch, boolean onlyObject ) {
        if(bean != null) {
            String clasName = bean.getClass().getName();
            if(clasName.equalsIgnoreCase("java.util.ArrayList") || clasName.equalsIgnoreCase("java.util.List")) {
                // wrap to bean
                List<?>list = (List<?>)bean;
                if(list.size()>0) bean = (Object)list.get(0);
            }
            String [] searchParts = property.split("\\$");
            Field[] fields = bean.getClass().getDeclaredFields();
            Field fieldFound = null;
            int propLen = property.length();
            for(int istp=0; istp<2; istp++) {
                int bestMatch = 999999999;
                for(Field f : fields) {
                    String fieldName = f.getName();
                    if(!exaclyMatch) {
                        String [] colParts = fieldName.split("\\$");
                        if(colParts.length > 1) {
                            fieldName = "";
                            for(int ip=0; ip<searchParts.length && ip<colParts.length; ip++) {
                                fieldName += (fieldName.length()>0?"$":"") + colParts[ip];
                            }
                        }
                    }
                    if( istp==0 ? fieldName.equals(property) : fieldName.toUpperCase().equalsIgnoreCase(property.toUpperCase()) ) {
                        if(!exaclyMatch) {                        
                            int dSize = f.getName().length() - propLen;
                            if(dSize <= bestMatch) {
                                if(onlyObject) {
                                    if(f.getType().equals(Object.class)) {
                                        bestMatch = dSize;
                                        fieldFound = f;                                    
                                    }
                                } else {
                                    bestMatch = dSize;
                                    fieldFound = f;
                                }
                            }
                        } else {
                            if(onlyObject) {
                                if(f.getType().equals(Object.class))
                                    return f;
                            } else {
                                return f;
                            }
                        }
                    }
                }
                if(fieldFound != null)
                    return fieldFound;
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
     * @param  bean  the bean (Object)
     * @param  property the name of the property to get (String)

     * @see         utility
     */
    static public void set(Object bean, String property, Object value) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException {        
        Field field = bean.getClass().getDeclaredField(property);
        if(field==null) {
            // Ricerca nei beans per similitudine
            field = searchProperty(bean, property, false, false);
        }
        // debug
        if("bool".equalsIgnoreCase(property)) {
            int lb = 1;
        }
        if(field != null) {
            field.setAccessible(true);
            Class<?> propType = field.getType();
            try {
                if(propType.equals(Boolean.class) || propType.equals(boolean.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty() 
                                || "0".equalsIgnoreCase((String)value) || "false".equalsIgnoreCase((String)value) 
                                || "N".equalsIgnoreCase((String)value) || "no".equalsIgnoreCase((String)value) 
                                || "zero".equalsIgnoreCase((String)value)|| "empty".equalsIgnoreCase((String)value))
                            if(propType.equals(Boolean.class)) {
                                field.set(bean, new Boolean(false));
                            } else {
                                field.set(bean, false);
                            }
                        else
                            if(propType.equals(Boolean.class)) {
                                field.set(bean, new Boolean(true));
                            } else {
                                field.set(bean, true);
                            }
                    } else if(value instanceof Object) {
                        field.set(bean, (Boolean)value);
                    }
                } else if(propType.equals(Integer.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty())
                            field.set(bean, new Integer(0));
                        else
                            field.set(bean, Integer.parseInt((String) value));
                    } else if(value instanceof Object) {
                        field.set(bean, (Integer)value);
                    }
                } else if(propType.equals(Long.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty())
                            field.set(bean, new Long(0));
                        else
                            field.set(bean, Long.parseLong((String) value));
                    } else if(value instanceof Object) {
                        field.set(bean, (Long)value);
                    }
                } else if(propType.equals(Float.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty())
                            field.set(bean, new Float(0.0f));
                        else
                            field.set(bean, Float.valueOf(((String) value).replaceAll(",", ".")));
                    } else if(value instanceof Object) {
                        field.set(bean, (Float)value);
                    }
                } else if(propType.equals(java.lang.Double.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty())
                            field.set(bean, new Double(0.0));
                        else
                            field.set(bean, Double.valueOf(((String)value).replaceAll(",", ".")));
                    } else if(value instanceof Object) {
                        field.set(bean, (Double)value);
                    }
                } else if(propType.equals(java.lang.String.class)) {
                    if(value instanceof String) {
                        field.set(bean, (String)value);
                    } else if(value instanceof Object) {
                        field.set(bean, String.valueOf(value));
                    }
                } else if(propType.equals(java.util.Date.class)) {
                    field.set(bean, DateUtil.toDate(value));
                } else if(propType.equals(java.sql.Date.class)) {
                    field.set(bean, DateUtil.toDate(value));
                } else if(propType.equals(java.sql.Timestamp.class)) {
                    field.set(bean, DateUtil.toTimestamp(value));
                } else if(propType.equals(java.sql.Time.class)) {
                    field.set(bean, DateUtil.toTime(value));
                } else {
                    field.set(bean, value);
                }
                
                // set changed, avoiding mirrored events
                if("&Parent".equals(property)) {
                } else if(property.indexOf("$Read") > 0) {
                } else if(property.indexOf("$Changed") > 0) {
                } else if(property.indexOf("$controlId") > 0) {
                } else if(property.indexOf("$className") > 0) {
                } else {
                    try {
                        // Ricerca nel bean corrispondenza esatta
                        field = searchProperty(bean, property+"$Changed", true, false);
                        if(field != null)
                            field.setAccessible(true);
                            field.set(bean, true);
                    } catch (Throwable th2) {
                        try {
                            bean.getClass().getMethod("setChanged", String.class, Boolean.class).invoke(bean, property, true);
                        } catch (Throwable th) {
                            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th2);
                            Method[] methods = bean.getClass().getMethods();
                            for(int i=0; i<methods.length; i++) {
                                System.err.println("{"+bean.getClass()+"}.Method #"+(i+1)+":" + methods[i].toString());
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
     * @param  bean  the bean (Object)
     * @param  property the name of the property to get (String)

     * @return      property value (Object)
     * @see         utility
     */
    static public Object get(Object bean, String property) {
        try {
            String clasName = bean.getClass().getName();
            if(clasName.equalsIgnoreCase("java.util.ArrayList") || clasName.equalsIgnoreCase("java.util.List")) {
                // wrap to bean
                List<?>list = (List<?>)bean;
                if(list.size()>0) bean = (Object)list.get(0);
            }
            String searchingProperty = property.replaceAll("\\.", "\\$");
            if(bean != null) {
                Field field = null;
                try {
                    field = bean.getClass().getDeclaredField(searchingProperty);
                    if(field!=null) {
                        field.setAccessible(true);
                        return field.get(bean);
                    }
                } catch (Throwable th) { }
                
                // Ricerca nel bean per similitudine
                field = searchProperty(bean, searchingProperty, false, false);
                if(field != null) {
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
                    throw new IllegalStateException("No getter available for property "+ property + " on " + bean);
                }
                return readMethod.invoke(bean);
            }
        } catch (Throwable th) {
            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th);
        }
        return null;
    }
    
    
    static public boolean isChanged(Object bean, String property) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException {
        if(bean != null) {
            Field field = bean.getClass().getDeclaredField(property+"$Changed");
            if(field!=null) {
                field.setAccessible(true);
                return (boolean)field.get(bean);
            }
            // Ricerca nei beans
            field = searchProperty(bean, property, false, false);
            if(field != null) {
                return (boolean)field.get(bean);
            }
        }
        return false;
    }

    
    static private PropertyDescriptor getPropertyDescriptor(Class<?> bean, String propertyname) throws IntrospectionException {
        BeanInfo beanInfo = Introspector.getBeanInfo(bean);
        PropertyDescriptor[] propertyDescriptors = beanInfo.getPropertyDescriptors();
        PropertyDescriptor propertyDescriptor = null;
        for (int i=0; i<propertyDescriptors.length; i++) {
            PropertyDescriptor currentPropertyDescriptor = propertyDescriptors[i];
            if (currentPropertyDescriptor.getName().equals(propertyname)) {
                propertyDescriptor = currentPropertyDescriptor;
            }
        }
        return propertyDescriptor;
    }    
    
    static Object removeCommas( Object key ) {
        return removeString( key, "\"" );        
    }
    static Object removeString( Object key, String removing ) {
        if(key != null) {
            String skey = (String)key;
            int index = skey.indexOf(removing);
            if(index >= 0) skey = skey.substring(index+removing.length());
            int lastIndex = skey.lastIndexOf(removing);
            if(lastIndex >= 0) skey = skey.substring(0, lastIndex);
            return skey;
        } else {
            return null;
        }
    }

    static public boolean folderExist( String folder ) {
        if(folder != null && !folder.isEmpty()) {
            File file = new File(folder); 
            return file.isDirectory();
        } else {
            return false;
        }
    }
    static public boolean fileExist( String folder ) {
        if(folder != null && !folder.isEmpty()) {
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
        if(str==null) return "";
        if(str.isEmpty()) return "";
        if (str.charAt(str.length()-1)==char_to_strip){
            str = str.replace(str.substring(str.length()-1), "");
            return str;
        } else{
            return str;
        }
    }    

    public static void close_process( Process process ) {
        try {
            process.wait(3000); // let the process run for 3 seconds
        } catch (Throwable th) {}
        process.destroy();        
        try {
            process.wait(5000); // give it a chance to stop
        } catch (Throwable th) {}
        process.destroy();
        try {
            process.waitFor(); // the process is now dead
        } catch (Throwable th) {}
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
         if(path != null && !path.isEmpty()) {
            Character c = path.charAt(path.length()-1);
            if(c != File.separatorChar && !c.equals("\\")) {
                return ""+File.separatorChar;
            }
        }
        return "";
    }
    static public String appendURLSeparator(String path) {
         if(path != null && !path.isEmpty()) {
            Character c = path.charAt(path.length()-1);
            if(c != '/' && !c.equals("/")) {
                return "/";
            }
        }
        return "";
    }
 
   static public String get_parent_path(String fullFileName) throws IOException {
        File relativePath = new File(fullFileName).getParentFile();
        return relativePath.getCanonicalPath();
    }       
    static public String get_absolute_path(HttpServletRequest request, String fileName) throws IOException {
        String fullFileName = "";
        ServletContext servletContext = request.getSession().getServletContext();
        String absoluteFilePathRoot = strip_last_slash(servletContext.getRealPath("/"));
        File relativePath = new File(absoluteFilePathRoot);
        String absolutePath = relativePath.getCanonicalPath();        
        File pyFilePath = new File(absolutePath + utility.appendSeparator(absolutePath) + fileName);
        fullFileName = pyFilePath.getCanonicalPath();
        if(!utility.fileExist(fullFileName)) {
            throw new IOException("ERROR : file "+fullFileName+" not found");
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
    
    
    public static Object [] downloadFile( HttpServletRequest request, HttpServletResponse response, String fileToDownload ) throws FileNotFoundException, IOException {
        response.setHeader("Content-Disposition", "attachment; filename=\""+fileToDownload+"\"");
        
        ServletContext context = request.getSession().getServletContext();
        String relativePath = context.getRealPath("");
        String filePath = relativePath + "LiquidX/download/"+fileToDownload;
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
        
        return new Object [] { true };
    }
    
    
    public static int mergeJsonObject( JSONObject source, JSONObject target ) throws Exception {
        int insertCount = 0;
        for (Object keyObject : JSONObject.getNames(source)) {
            String key = (String)keyObject;
            Object obj = source.get(key);
            target.put(key, obj);
            insertCount++;
        }
        return insertCount;
    }
    
}