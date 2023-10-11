package com.liquid;

import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.ServletContext;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidParameterException;
import java.sql.*;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;

public class dms {

    public static final int MAX_DOWNLOAD_SIZE = 16 * 1024 * 1024;

    /**
     * get absolute file path
     *
     * @param fileName
     * @param request
     * @return
     */
    public static String getDMSFileAbsolutePath(String fileName, HttpServletRequest request) {
        String dmsFTP = null, dmsFTPPublicURL = null;
        try {
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fFtp = cls.getDeclaredField("dmsFTP");
            if (fFtp != null) {
                fFtp.setAccessible(true);
                dmsFTP = (String) fFtp.get(null);
            }
            Field fFtpURL = cls.getDeclaredField("dmsFTPPublicURL");
            if (fFtpURL != null) {
                fFtpURL.setAccessible(true);
                dmsFTPPublicURL = (String) fFtpURL.get(null);
            }
        } catch (Exception e) {
            // Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, e);
        }
        if(dmsFTP != null && !dmsFTP.isEmpty()) {
            // String APP_CONTEXT = request.getContextPath();
            // return dmsFTPPublicURL + (fileName.startsWith(APP_CONTEXT) ? fileName.substring(APP_CONTEXT.length()) : fileName);
            return dmsFTPPublicURL;
        } else {
            ServletContext servletContext = request.getSession().getServletContext();
            String absoluteFilePathRoot = utility.strip_last_slash(servletContext.getRealPath("/"));
            String APP_CONTEXT = request.getContextPath();
            return absoluteFilePathRoot + (fileName.startsWith(APP_CONTEXT) ? fileName.substring(APP_CONTEXT.length()) : fileName);
        }
    }


    /**
     * get relative file path
     *
     * @param fileName
     * @param request
     * @return
     */
    public static String getDMSFileRelativePath(String fileName, HttpServletRequest request) {
        String dmsFTP = null, dmsFTPPublicURL = null, dmsRootFolder = null;
        try {
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fFtp = cls.getDeclaredField("dmsFTP");
            if (fFtp != null) {
                fFtp.setAccessible(true);
                dmsFTP = (String) fFtp.get(null);
            }
            Field fFtpURL = cls.getDeclaredField("dmsFTPPublicURL");
            if (fFtpURL != null) {
                fFtpURL.setAccessible(true);
                dmsFTPPublicURL = (String) fFtpURL.get(null);
            }
            Field fF = cls.getDeclaredField("dmsRootFolder");
            if (fF != null) {
                fF.setAccessible(true);
                dmsRootFolder = (String) fF.get(null);
            }
        } catch (Exception e) {
            // Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, e);
        }
        if(dmsFTP != null && !dmsFTP.isEmpty()) {
            // String APP_CONTEXT = request.getContextPath();
            if(fileName.startsWith(dmsFTPPublicURL)) {
                return fileName;
            } else {
                return fileName.replace(dmsRootFolder, dmsFTPPublicURL);
            }
        } else {
            ServletContext servletContext = request.getSession().getServletContext();
            String absoluteFilePathRoot = utility.strip_last_slash(servletContext.getRealPath("/"));
            String APP_CONTEXT = request.getContextPath();
            return fileName.replace(absoluteFilePathRoot, APP_CONTEXT + "");
        }
    }


    /**
     *
     * @param dmsRootFolder
     * @param request
     * @return
     */
    static public String getAbsoluteRootPath(String dmsRootFolder, HttpServletRequest request) {
        if(dmsRootFolder.startsWith("/")) {
            return dmsRootFolder;
        } else {
            ServletContext servletContext = request.getSession().getServletContext();
            String absoluteFilePathRoot = utility.strip_last_slash(servletContext.getRealPath(dmsRootFolder));
            if (absoluteFilePathRoot != null) {
                return absoluteFilePathRoot;
            } else {
                return dmsRootFolder;
            }
        }
    }


    static public String getDocuments(Object tbl_wrk, Object params, Object clientData, Object requestParam) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if (tbl_wrk != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                Class cls = null;
                // collecting keys for the link
                ArrayList<String> keyList = utility.get_dms_keys(tblWrk, (Object) params);
                try {
                    // Custom implementation
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("getDocuments", Object.class, Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    return (String) method.invoke(classInstance, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object)requestParam, (Object) keyList);
                } catch (Throwable th) {
                    // default implementation
                    return getDocumentsDefault(tbl_wrk, params, clientData, requestParam, keyList);
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" getDocuments() error:" + e.getLocalizedMessage());
        }
        return result;
    }

    /**
     * Default DMS implementation
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     */
    public static String getDocumentsDefault( Object tbl_wrk, Object params, Object clientData, Object requestParam, Object keyListParam ) throws Throwable {
        HttpServletRequest request = (HttpServletRequest) requestParam;
        StringBuilder resultSet = new StringBuilder("{\"resultSet\":[");
        Connection conn = null;
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        String sQuery = null;
        String sWhere = "";
        String dmsSchema = null, dmsTable = null, dmsDocType = null;
        int nRecs = 0;


        try {

            // root table
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fs = cls.getDeclaredField("dmsSchema");
            if(fs != null) {
                fs.setAccessible(true);
                dmsSchema = (String) fs.get(null);
            }
            Field ft = cls.getDeclaredField("dmsTable");
            if(ft != null) {
                ft.setAccessible(true);
                dmsTable = (String) ft.get(null);
            }
            Field fdt = cls.getDeclaredField("dmsDocType");
            if(fdt != null) {
                fdt.setAccessible(true);
                dmsDocType = (String) fdt.get(null);
            }

            //  params :
            // { database:... , schema:... , table:... , name:... , ids:nodeKeys };

            if(requestParam != null) {
                if(transaction.isTransaction(request)) {
                    conn = transaction.getTransaction(request);
                } else {
                    Object [] connRes = connection.getDBConnection();
                    conn = (Connection) connRes[0];
                }
                if(conn != null) {
                    String cols = "D.file, D.size, D.date, D.note, D.type, D.link, D.hash, D.id, D.doc_type_id, DT.type as doc_type";
                    if("IT".equalsIgnoreCase(workspace.getGLLang())) {
                        cols += ", DT.type_desc_it as doc_type_desc";
                    } else {
                        cols += ", DT.type_desc as doc_type_desc";
                    }

                    ArrayList<String> keyList = (ArrayList<String>)keyListParam;
                    for(int ik=0; ik<keyList.size(); ik++) {
                        sWhere += sWhere.length()>0?" OR ":"" + "link='"+keyList.get(ik)+"'";
                    }
                    sQuery = "SELECT "+cols+" from \""+dmsSchema+"\".\""+dmsTable+"\" D"
                            + " LEFT JOIN \""+ dmsSchema + "\".\"" + dmsDocType +"\" DT ON DT.id=doc_type_id"
                            + " WHERE ("+sWhere+") "
                            + "ORDER BY date DESC";
                    psdo = conn.prepareStatement(sQuery);
                    rsdo = psdo.executeQuery();
                    if(rsdo != null) {
                        while(rsdo.next()) {
                            String file = rsdo.getString("file");
                            // N.B.: Protocollo JSON : nella risposta JSON il caratere "->\" è a carico del server, e di conseguenza \->\\
                            file = file != null ? file.replace("\\", "\\\\").replace("\"", "\\\"") : "";
                            int size = rsdo.getInt("size");
                            String date = rsdo.getString("date");
                            String note = rsdo.getString("note");
                            String hash = rsdo.getString("hash");
                            String doc_type = rsdo.getString("doc_type_desc");
                            String doc_type_id = rsdo.getString("doc_type_id");
                            String type = rsdo.getString("type");
                            String id = rsdo.getString("id");
                            String short_file = Paths.get(file).getFileName().toString();
                            if(short_file.indexOf(".F.") >= 0) {
                                short_file = short_file.substring(short_file.indexOf(".F.")+3);
                            }
                            String fieldSet = "{"
                                    + "\"fullFile\":\""+(file!=null?file:"")+"\""
                                    + ",\"file\":\""+(short_file!=null?short_file:"")+"\""
                                    + ",\"size\":"+size
                                    + ",\"note\":\""+note+"\""
                                    + ",\"type\":\""+type+"\""
                                    + ",\"date\":\""+date+"\""
                                    + ",\"hash\":\""+hash+"\""
                                    + ",\"doc_type\":"+(doc_type != null ? "\""+doc_type+"\"" : "null")
                                    + ",\"doc_type_id\":"+(doc_type_id != null ? "\""+doc_type_id+"\"" : "null")
                                    + ",\"id\":\""+id+"\""
                                    + "}";
                            resultSet.append( (nRecs>0?",":"") + fieldSet);
                            nRecs++;
                        }
                    }
                    if(rsdo != null) rsdo.close();
                    if(psdo != null) psdo.close();
                }
            }
        } catch (Throwable e) {
            System.err.println("Query Error:" + e.getLocalizedMessage() + sQuery);
            throw e;

        } finally {
            if(transaction.isTransaction(request)) {
            } else {
                try {
                    conn.close();
                } catch (SQLException ex) {
                    Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        }
        resultSet.append("]}");
        return resultSet.toString();
    }


    /**
     * put file by content into DMS
     *
     * @param tbl_wrk
     * @param b64FileContentOrByteArray
     * @param fileName
     * @param fileSize
     * @param docType
     * @param userData
     * @param database
     * @param schema
     * @param table
     * @param name
     * @param rowId
     * @param clientData
     * @param requestParam
     * @param mode
     * @return
     * @throws IOException
     * @throws ClassNotFoundException
     * @throws InvocationTargetException
     * @throws InstantiationException
     * @throws IllegalAccessException
     * @throws NoSuchMethodException
     */
    static public String uploadDocument(Object tbl_wrk,
                                        Object b64FileContentOrByteArray, String fileName, Long fileSize,
                                        String docType, String userData,
                                        String database, String schema, String table, String name, Object rowId,
                                        Object clientData, Object requestParam, String mode) throws Throwable {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if (tbl_wrk != null && b64FileContentOrByteArray != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                JSONObject paramsJson = new JSONObject("{\"params\":null}");
                JSONObject dmsParamsJson = new JSONObject();

                boolean readObly = true;
                if(name != null) {
                    readObly = workspace.is_dms_readonly((workspace)tbl_wrk, name);
                } else {
                    Class cls = Class.forName("app.liquid.dms.connection");
                    Field fs = cls.getDeclaredField("dmsReadOnly");
                    if(fs != null) {
                        fs.setAccessible(true);
                        readObly = (boolean) fs.get(null);
                    }
                }

                if(!readObly) {
                    dmsParamsJson.put("database", database != null ? database : tblWrk.tableJson.has("database") ? tblWrk.tableJson.getString("database") : null);
                    dmsParamsJson.put("schema", schema != null ? schema : tblWrk.tableJson.has("schema") ? tblWrk.tableJson.getString("schema") : null);
                    dmsParamsJson.put("table", table != null ? table : tblWrk.tableJson.has("table") ? tblWrk.tableJson.getString("table") : null);
                    dmsParamsJson.put("name", name != null ? name : tblWrk.tableJson.has("name") ? tblWrk.tableJson.getString("name") : null);
                    dmsParamsJson.put("row", rowId != null ? String.valueOf(rowId) : null);
                    dmsParamsJson.put("file", fileName != null ? fileName : null);
                    dmsParamsJson.put("size", fileSize != null ? fileSize : null);

                    String mimeType = null;
                    if (mimeType == null) {
                        ServletContext context = ((HttpServletRequest) requestParam).getSession().getServletContext();
                        mimeType = context.getMimeType(fileName);
                        if (mimeType == null) {
                            if (requestParam != null) {
                                mimeType = (String) ((HttpServletRequest) requestParam).getAttribute("mimeType");
                            }
                        }
                        dmsParamsJson.put("mimeType", mimeType != null ? mimeType : null);
                    }

                    byte[] fileContentByteArray = null;
                    if(b64FileContentOrByteArray instanceof String) {
                        dmsParamsJson.put("content", b64FileContentOrByteArray != null ? b64FileContentOrByteArray : null);
                    } else if (b64FileContentOrByteArray instanceof byte[]) {
                        fileContentByteArray = (byte[])b64FileContentOrByteArray;
                    }
                    // collecting keys for the link
                    dmsParamsJson.put("doc_type", docType != null ? docType : null);
                    dmsParamsJson.put("user_data", userData != null ? userData : null);
                    JSONArray ids = new JSONArray();
                    ids.put(rowId);
                    dmsParamsJson.put("ids", ids);
                    dmsParamsJson.put("mode", mode);
                    paramsJson.put("params", dmsParamsJson);

                    // return uploadDocument(tbl_wrk, paramsJson.toString(), clientData, requestParam);
                    ArrayList<String> keyList = utility.get_dms_keys(tblWrk, (Object) paramsJson.toString());
                    if(keyList != null) {
                        return uploadDocumentDefault(tbl_wrk, paramsJson.toString(), clientData, requestParam, keyList, fileContentByteArray);
                    }
                }
            }
        } catch(Throwable th){
            error = " uploadDocuments() error:" + th.getLocalizedMessage();
            System.err.println(error);
            throw th;
        }
        return result;
    }


    /**
     * Upload existing file into DMS
     *
     * @param tbl_wrk
     * @param filePath
     * @param fileSize
     * @param docType
     * @param userData
     * @param database
     * @param schema
     * @param table
     * @param name
     * @param rowId
     * @param clientData
     * @param requestParam
     * @param mode
     * @return
     * @throws Throwable
     */
    static public String uploadDocument(Object tbl_wrk,
                                        String filePath, Long fileSize,
                                        String docType, String userData,
                                        String database, String schema, String table, String name, Object rowId,
                                        Object clientData, Object requestParam, String mode) throws Throwable {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if (tbl_wrk != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                JSONObject paramsJson = new JSONObject("{\"params\":null}");
                JSONObject dmsParamsJson = new JSONObject();

                boolean readObly = true;
                if(name != null) {
                    readObly = workspace.is_dms_readonly((workspace)tbl_wrk, name);
                } else {
                    Class cls = Class.forName("app.liquid.dms.connection");
                    Field fs = cls.getDeclaredField("dmsReadOnly");
                    if(fs != null) {
                        fs.setAccessible(true);
                        readObly = (boolean) fs.get(null);
                    }
                }

                if(!readObly) {
                    String fileName = utility.get_file_name(filePath);

                    dmsParamsJson.put("database", database != null ? database : tblWrk.tableJson.has("database") ? tblWrk.tableJson.getString("database") : null);
                    dmsParamsJson.put("schema", schema != null ? schema : tblWrk.tableJson.has("schema") ? tblWrk.tableJson.getString("schema") : null);
                    dmsParamsJson.put("table", table != null ? table : tblWrk.tableJson.has("table") ? tblWrk.tableJson.getString("table") : null);
                    dmsParamsJson.put("name", name != null ? name : tblWrk.tableJson.has("name") ? tblWrk.tableJson.getString("name") : null);
                    dmsParamsJson.put("row", rowId != null ? String.valueOf(rowId) : null);
                    dmsParamsJson.put("file", fileName != null ? fileName : null);
                    dmsParamsJson.put("size", fileSize != null ? fileSize : null);

                    String mimeType = null;
                    if (mimeType == null) {
                        ServletContext context = ((HttpServletRequest) requestParam).getSession().getServletContext();
                        mimeType = context.getMimeType(fileName);
                        if (mimeType == null) {
                            if (requestParam != null) {
                                mimeType = (String) ((HttpServletRequest) requestParam).getAttribute("mimeType");
                            }
                        }
                        dmsParamsJson.put("mimeType", mimeType != null ? mimeType : null);
                    }

                    dmsParamsJson.put("filePath", filePath);
                    dmsParamsJson.put("doc_type", docType != null ? docType : null);
                    dmsParamsJson.put("user_data", userData != null ? userData : null);
                    JSONArray ids = new JSONArray();
                    ids.put(rowId);
                    dmsParamsJson.put("ids", ids);
                    dmsParamsJson.put("mode", mode);
                    paramsJson.put("params", dmsParamsJson);
                    return uploadDocument(tbl_wrk, paramsJson.toString(), clientData, requestParam);
                }
            }
        } catch(Throwable th){
            error = " uploadDocuments() error:" + th.getLocalizedMessage();
            System.err.println(error);
            throw th;
        }
        return result;
    }


    /**
     * Handle file update from DMS panel
     * need in params special keys like :
     *  [database][schema][table][name][ids]
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     */
    static public String uploadDocument(Object tbl_wrk, Object params, Object clientData, Object requestParam) throws Throwable {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if (tbl_wrk != null) {
                HttpServletRequest request = (HttpServletRequest) requestParam;
                workspace tblWrk = (workspace) tbl_wrk;
                Class cls = null;
                if (request != null) {
                    // data:*/*;base64,
                    if (tblWrk != null) {
                        if (clientData != null) { // calling from Liquid UI
                            String docName = (String) clientData;
                            if (docName != null) {
                                JSONObject doc = workspace.get_dms_by_name(tblWrk, docName);
                                if(doc != null) {
                                    if (doc.has("maxSize")) {
                                        // TODO : check document size
                                    }
                                }
                            }
                        }
                    }

                    JSONObject paramsJson = new JSONObject((String) params);
                    JSONObject paramJson = paramsJson.getJSONObject("params");

                    String mimeType = null;
                    if(paramJson.has("mimeType")) {
                        mimeType = paramJson.getString("mimeType");
                    }

                    if(mimeType == null) {
                        if (requestParam != null) {
                            mimeType = (String)((HttpServletRequest) requestParam).getAttribute("mimeType");
                        }
                    }
                    if(mimeType == null) {
                        if (paramJson.has("file")) {
                            if (!paramJson.has("mimeType")) {
                                String file = paramJson.getString("file");
                                Path path = new File(file).toPath();
                                if (path != null) {
                                    // fileContent = Files.readAllBytes( path ) ;
                                    mimeType = Files.probeContentType(path);
                                    if (mimeType == null || mimeType.isEmpty()) {
                                        if (file.toLowerCase().endsWith(".jsp")) {
                                            mimeType = "application/jsp";
                                        }
                                    }
                                    paramJson.put("mimeType", mimeType);
                                }
                            }
                        }
                    }
                    if(mimeType == null) {
                        if (paramJson.has("file")) {
                            ServletContext context = ((HttpServletRequest) requestParam).getSession().getServletContext();
                            mimeType = context.getMimeType(paramJson.getString("file"));
                            if (mimeType == null) {
                                if (requestParam != null) {
                                    mimeType = (String) ((HttpServletRequest) requestParam).getAttribute("mimeType");
                                    paramJson.put("mimeType", mimeType);
                                }
                            }
                        }
                    }
                    if (!paramJson.has("mimeType")) {
                        paramJson.put("mimeType", "");
                    }

                    // collecting keys for the link
                    ArrayList<String> keyList = utility.get_dms_keys(tblWrk, (Object) params);
                    if(keyList != null) {
                        boolean readObly = true;
                        if(paramJson.has("name")) {
                            readObly = workspace.is_dms_readonly((workspace)tbl_wrk, paramJson.getString("name"));
                        } else {
                            cls = Class.forName("app.liquid.dms.connection");
                            Field fs = cls.getDeclaredField("dmsReadOnly");
                            if(fs != null) {
                                fs.setAccessible(true);
                                readObly = (boolean) fs.get(null);
                            }
                        }

                        if(!readObly) {
                            try {
                                cls = Class.forName("app.liquid.dms.connection");
                                Object classInstance = (Object) cls.newInstance();
                                Method method = cls.getMethod("uploadDocument", Object.class, Object.class, Object.class, Object.class, Object.class);
                                return (String) method.invoke(classInstance, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) requestParam, (Object) keyList);
                            } catch (Throwable th) {
                                //
                                // default implementation
                                //
                                return uploadDocumentDefault(tbl_wrk, paramsJson.toString(), clientData, requestParam, keyList);
                            }
                        }
                    } else {
                        throw new InvalidParameterException("Unable to build DMS keys");
                    }
                }
            }
        } catch (Throwable th2) {
            error = " uploadDocuments() error:" + th2.getLocalizedMessage();
            System.err.println(error);
            throw th2;
        }
        return result;
    }


    static public String uploadDocumentDefault( Object tbl_wrk, Object params, Object clientData, Object requestParam, Object keyListParam) throws Throwable {
        return uploadDocumentDefault( tbl_wrk, params, clientData, requestParam, keyListParam, null);
    }
    /**
     * Default upload file into DMS implementation : set file name, write file, create row in DB
     *
     * @param tbl_wrk
     * @param params        (parametri usate per comporre il nome del file)
     * @param clientData
     * @param requestParam  (Campo link nel DB; elenco identificatori ArrayList<String> per identificare i records ai quali il doc è collegato)
     * @return
     */
    static public String uploadDocumentDefault( Object tbl_wrk, Object params, Object clientData, Object requestParam, Object keyListParam, byte[] content ) throws Throwable {
        HttpServletRequest request = (HttpServletRequest) requestParam;
        StringBuilder resultSet = new StringBuilder("{\"resultSet\":[");
        Connection conn = null;
        PreparedStatement psdo = null;
        String sQuery = null;
        String sWhere = "";
        String dmsFTP = null, dmsFTPPublicURL = null, dmsSchema = null, dmsTable = null, dmsDocTypeTable = null, dmsRootFolder = null, dmsName = null;
        String mode = null;
        String sRecId = null;
        long dmsMaxFileSize = 0;
        int nRecs = 0;

        try {

            // root table
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fs = cls.getDeclaredField("dmsSchema");
            if(fs != null) {
                fs.setAccessible(true);
                dmsSchema = (String) fs.get(null);
            }
            Field ft = cls.getDeclaredField("dmsTable");
            if(ft != null) {
                ft.setAccessible(true);
                dmsTable = (String) ft.get(null);
            }
            Field fdt = cls.getDeclaredField("dmsDocType");
            if(fdt != null) {
                fdt.setAccessible(true);
                dmsDocTypeTable = (String) fdt.get(null);
            }
            Field fr = cls.getDeclaredField("dmsRootFolder");
            if(fr != null) {
                fr.setAccessible(true);
                dmsRootFolder = (String) fr.get(null);
            }
            Field fms = cls.getDeclaredField("dmsMaxFileSize");
            if(fms != null) {
                fms.setAccessible(true);
                dmsMaxFileSize = (long) fms.get(null);
            }

            Field fFtp = cls.getDeclaredField("dmsFTP");
            if(fFtp != null) {
                fFtp.setAccessible(true);
                dmsFTP = (String) fFtp.get(null);
            }
            Field fFtpURL = cls.getDeclaredField("dmsFTPPublicURL");
            if (fFtpURL != null) {
                fFtpURL.setAccessible(true);
                dmsFTPPublicURL = (String) fFtpURL.get(null);
            }




            JSONObject paramsJson = new JSONObject((String)params);
            JSONObject paramJson = paramsJson.getJSONObject("params");
            // paramJson : { database: ... , schema: ..., table: ..., name: ..., ids:nodesKey, file:"", size:"", note:"", fileContent:"" mimeType:""};


            if(!dmsRootFolder.endsWith(File.separator))
                dmsRootFolder += File.separator;

            int added = 0;
            String fileAbsolutePath = getAbsoluteRootPath(dmsRootFolder, request) + File.separator;
            // Database
            String comp = paramJson.has("database") ? paramJson.getString("database") : null;
            if(comp != null && !comp.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + "D." + comp;
            }
            // Schema
            comp = paramJson.has("schema") ? paramJson.getString("schema") : null;
            if(comp != null && !comp.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + ".S." + comp;
            }
            // Table
            comp = paramJson.has("table") ? paramJson.getString("table") : null;
            if(comp != null && !comp.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + ".T." + comp;
            }
            // Row
            comp = paramJson.has("row") ? paramJson.getString("row") : null;
            if(comp != null && !comp.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + ".R." + comp;
            }
            // DMS folder name
            dmsName = paramJson.has("name") ? paramJson.getString("name") : null;
            if(dmsName != null && !dmsName.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + ".N." + dmsName;
                JSONObject doc = workspace.get_dms_by_name((workspace) tbl_wrk, dmsName);
                if(doc != null) {
                    if (doc.has("maxSize")) {
                        int maxSize = doc.getInt("maxSize");
                        if (maxSize > 0 && (maxSize < dmsMaxFileSize || dmsMaxFileSize == 0)) {
                            dmsMaxFileSize = maxSize;
                        }
                    }
                }
            }

            // Mode
            comp = paramJson.has("row") ? paramJson.getString("mode") : null;
            if(comp != null && !comp.isEmpty()) {
                mode = comp;
            }


            // Time tick
            long tick = System.currentTimeMillis();
            fileAbsolutePath += (added > 0 ? "." : "") + ".TK." + tick;

            // File name
            String fileName = paramJson.getString("file");
            fileName = utility.santizeFileName(fileName);

            fileAbsolutePath += (added > 0 ? "." : "") + ".F." + fileName;



            // Scrittura file
            if(paramJson.has("content")) {
                String b64FileContent = paramJson.getString("content");
                byte[] fileContent = null;
                if (b64FileContent.startsWith("base64,")) {
                    fileContent = utility.base64DecodeBytes(b64FileContent.substring(7));
                } else {
                    fileContent = utility.base64DecodeBytes(b64FileContent);
                }
                if (fileContent != null) {
                    if (fileContent.length > dmsMaxFileSize && dmsMaxFileSize > 0) {
                        throw new Exception("File too large .. max:" + (dmsMaxFileSize / 1024) + "Kb");
                    }

                    if(dmsFTP != null && !dmsFTP.isEmpty()) {
                        ftp.setByURL(dmsFTP);
                        if(!ftp.upload(fileContent, fileAbsolutePath.substring(dmsRootFolder.length()))) {
                            throw new Exception("Unable to upload file to ftp");
                        }
                        if(fileAbsolutePath.startsWith(dmsRootFolder))
                            fileAbsolutePath = fileAbsolutePath.substring(dmsRootFolder.length());
                        fileAbsolutePath = dmsFTPPublicURL + File.separator + fileAbsolutePath;
                        paramJson.put("hash", utility.get_file_content_md5(fileContent));
                    } else {
                        if(dmsRootFolder != null && !dmsRootFolder.isEmpty()){
                            dmsRootFolder = getAbsoluteRootPath(dmsRootFolder, request);
                            if (!utility.folderExist(dmsRootFolder)) {
                                if(!utility.createFolder(dmsRootFolder)) {
                                    throw new Exception("Unable to create foolder : " + dmsRootFolder);
                                }
                            }
                        } else {
                            throw new InvalidParameterException("'dmsRootFolder' not set in 'app.liquid.dms.connection'");
                        }
                        Files.write(Paths.get(fileAbsolutePath), fileContent);
                        paramJson.put("hash", utility.get_file_md5(fileAbsolutePath));
                    }

                } else {
                    // paramJson.put("hash", null);
                    throw new Exception("File content not valid! Please check it's base 64 encoded");
                }
            } else if(paramJson.has("filePath")) {
                // Link a file esistente
                fileAbsolutePath = paramJson.getString("filePath");
                if(dmsFTP != null && !dmsFTP.isEmpty()) {
                } else {
                    File f = new File(fileAbsolutePath);
                    if (!f.exists()) {
                        throw new Exception("File " + fileAbsolutePath + " not exist");
                    }
                }
                paramJson.put("hash", utility.get_file_md5(fileAbsolutePath));

            } else if (content != null) {
                byte[] fileContent = content;
                if (fileContent.length > dmsMaxFileSize && dmsMaxFileSize > 0) {
                    throw new Exception("File too large .. max:" + (dmsMaxFileSize / 1024) + "Kb");
                }
                if(dmsFTP != null && !dmsFTP.isEmpty()) {
                    ftp.setByURL(dmsFTP);
                    if(!ftp.upload(fileContent, fileAbsolutePath.substring(dmsRootFolder.length()))) {
                        throw new Exception("Unable to upload file to ftp");
                    }
                    if(fileAbsolutePath.startsWith(dmsRootFolder))
                        fileAbsolutePath = fileAbsolutePath.substring(dmsRootFolder.length());
                    fileAbsolutePath = dmsFTPPublicURL + File.separator + fileAbsolutePath;
                    paramJson.put("hash", utility.get_file_content_md5(fileContent));
                } else {
                    if(dmsRootFolder != null && !dmsRootFolder.isEmpty()){
                        dmsRootFolder = getAbsoluteRootPath(dmsRootFolder, request);
                        if (!utility.folderExist(dmsRootFolder)) {
                            if(!utility.createFolder(dmsRootFolder)) {
                                throw new Exception("Unable to create foolder : " + dmsRootFolder);
                            }
                        }
                    } else {
                        throw new InvalidParameterException("'dmsRootFolder' not set in 'app.liquid.dms.connection'");
                    }
                    Files.write(Paths.get(fileAbsolutePath), fileContent);
                    paramJson.put("hash", utility.get_file_md5(fileAbsolutePath));
                }


            } else {
                // paramJson.put("hash", null);
                throw new Exception("File content not defined");
            }

            if(!paramJson.has("note")) {
                paramJson.put("note", "");
            }

            Object doc_type_id = null;
            boolean bResolveDocTypeId = false;
            if(paramJson.has("doc_type_id")) {
                doc_type_id = paramJson.get("doc_type_id");
            } else if(paramJson.has("docTypeId")) {
                doc_type_id = paramJson.get("docTypeId");
            } else {
                if (paramJson.has("doc_type")) {
                    doc_type_id = "(SELECT id FROM "
                            + (dmsSchema != null ? "\""+dmsSchema+"\"." : "")
                            + "\"" + dmsDocTypeTable + "\""
                            + " WHERE \"type\"='" + paramJson.get("doc_type") + "')";
                    bResolveDocTypeId = true;
                } else if (paramJson.has("docType")) {
                    doc_type_id = "(SELECT id FROM "
                            + (dmsSchema != null ? "\""+dmsSchema+"\"." : "")
                            + "\"" + dmsDocTypeTable + "\""
                            + " WHERE \"type\"='"+paramJson.get("docType")+"')";
                    bResolveDocTypeId = true;
                }
            }
            Object user_data = null;
            if(paramJson.has("user_data")) {
                user_data = paramJson.get("user_data");
            }


            boolean readObly = true;
            if(paramJson.has("name")) {
                readObly = workspace.is_dms_readonly((workspace)tbl_wrk, paramJson.getString("name"));
            } else {
                cls = Class.forName("app.liquid.dms.connection");
                fs = cls.getDeclaredField("dmsReadOnly");
                if(fs != null) {
                    fs.setAccessible(true);
                    readObly = (boolean) fs.get(null);
                }
            }

            if(!readObly) {
                if (requestParam != null) {
                    if (transaction.isTransaction(request)) {
                        conn = transaction.getTransaction(request);
                    } else {
                        Object[] connRes = connection.getDBConnection();
                        conn = (Connection) connRes[0];
                        if (conn != null) {
                            conn.setAutoCommit(false);
                        }
                    }

                    if (conn != null) {
                        // N.B.: one document can refres to multiple rows in table, if rowSelect is "multiple"
                        // JSONArray ids = paramJson.getJSONArray("ids");
                        ArrayList<String> keyList = null;
                        if (keyListParam != null) {
                            keyList = (ArrayList<String>) keyListParam;
                        } else {
                            throw new Exception("No keys defined");
                        }

                        for (int i = 0; i < keyList.size(); i++) {
                            String link = keyList.get(i);
                            String delete_file_error = "";

                            if("REPLACE".equalsIgnoreCase(mode) || "REPLACE_ALL".equalsIgnoreCase(mode)) {
                                String sQueryDel = "DELETE FROM \"" + dmsSchema + "\".\"" + dmsTable + "\"" +
                                        " WHERE (" +
                                        "link='" + link + "'" +
                                        (doc_type_id != null && "REPLACE".equalsIgnoreCase(mode) ? (" AND doc_type_id=" + doc_type_id + "") : "") +
                                        ")";
                                String sQuerySel = "SELECT file FROM \"" + dmsSchema + "\".\"" + dmsTable + "\"" +
                                        " WHERE (" +
                                        "link='" + link + "'" +
                                        (doc_type_id != null && "REPLACE".equalsIgnoreCase(mode) ? (" AND doc_type_id=" + doc_type_id + "") : "") +
                                        ")";
                                if (sQuerySel != null) {
                                    ResultSet rsdo = null;
                                    try {
                                        psdo = conn.prepareStatement(sQuerySel);
                                        rsdo = psdo.executeQuery();
                                        if (rsdo != null) {
                                            while(rsdo.next()) {
                                                String file = rsdo.getString("file");
                                                if (file != null && !file.isEmpty()) {
                                                    File f = new File(file);
                                                    if(f.exists()) {
                                                        boolean resDel = f.delete();
                                                        if (!resDel) {
                                                            if (delete_file_error.length() == 0) {
                                                                delete_file_error += "{";
                                                            } else {
                                                                delete_file_error += ",";
                                                            }
                                                            delete_file_error += "[\"Failed to delete " + file + "\"]";
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } finally {
                                        if (rsdo != null)
                                            rsdo.close();
                                        rsdo = null;

                                        if (psdo != null)
                                            psdo.close();
                                        psdo = null;
                                    }

                                    try {
                                        if (sQueryDel != null) {
                                            psdo = conn.prepareStatement(sQueryDel);
                                            int res = psdo.executeUpdate();
                                            if (res >= 0) {
                                            } else {
                                                if (delete_file_error.length() == 0) {
                                                    delete_file_error += "{";
                                                } else {
                                                    delete_file_error += ",";
                                                }
                                                delete_file_error += "[\"Failed to delete row " + link + "\"]";
                                            }
                                        }
                                    } finally {
                                        if (psdo != null)
                                            psdo.close();
                                        psdo = null;
                                    }
                                }
                            }

                            sQuery = "INSERT INTO \"" + dmsSchema + "\".\"" + dmsTable + "\" " +
                                    "(\"file\",\"size\",\"note\",\"type\",\"hash\",\"link\",\"doc_type_id\",\"user_data\")" +
                                    " VALUES " +
                                    "(" + "?" + ""
                                    + ",'" + paramJson.getInt("size") + "'"
                                    + "," + "?" + ""
                                    + ",'" + paramJson.getString("mimeType") + "'"
                                    + ",'" + paramJson.getString("hash") + "'"
                                    + ",'" + link + "'"
                                    + "," + doc_type_id
                                    + ",?"
                                    + ")";
                            psdo = conn.prepareStatement(sQuery, Statement.RETURN_GENERATED_KEYS);

                            psdo.setString(1, (String) fileAbsolutePath);
                            psdo.setString(2, (String) paramJson.getString("note"));
                            if (user_data instanceof String) {
                                psdo.setString(3, (String) user_data);
                            } else if (user_data instanceof byte[]) {
                                psdo.setString(3, (String) utility.base64Encode((byte[]) user_data));
                            } else {
                                psdo.setNull(3, Types.VARCHAR);
                            }

                            int res = psdo.executeUpdate();
                            if (res >= 0) {
                                if (bResolveDocTypeId) {
                                    ResultSet rs = psdo.getGeneratedKeys();
                                    PreparedStatement psdoRead = null;
                                    ResultSet rsdoRead = null;
                                    doc_type_id = null;
                                    try {
                                        if (rs != null && rs.next()) {
                                            sRecId = rs.getString(1);
                                            sQuery = "SELECT doc_type_id FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" " +
                                                    "WHERE id=" + sRecId;
                                            psdoRead = conn.prepareStatement(sQuery);
                                            rsdoRead = psdoRead.executeQuery();
                                            if (rsdoRead != null) {
                                                if (rsdoRead.next()) {
                                                    doc_type_id = rsdoRead.getString(1);
                                                }
                                            }
                                        }
                                    } finally {
                                        if (rs != null) rs.close();
                                        if (psdoRead != null) psdoRead.close();
                                        if (rsdoRead != null) rsdoRead.close();
                                    }
                                }
                                String fieldSet = "{"
                                        + "\"id\":\"" + (sRecId != null ? sRecId : "") + "\""
                                        + ",\"file\":\"" + (paramJson.getString("file")) + "\""
                                        + ",\"filePath\":\"" + (fileAbsolutePath != null ? fileAbsolutePath : "") + "\""
                                        + ",\"size\":" + paramJson.getInt("size")
                                        + ",\"note\":\"" + paramJson.getString("note") + "\""
                                        + ",\"type\":\"" + paramJson.getString("mimeType") + "\""
                                        + ",\"hash\":\"" + paramJson.getString("hash") + "\""
                                        + ",\"link\":\"" + keyList.get(i) + "\""
                                        + ",\"doc_type_id\":\"" + doc_type_id + "\""
                                        + (delete_file_error.isEmpty() ? ",\"errors\":\"" + delete_file_error + "\"" : "")
                                        + "}";
                                resultSet.append(nRecs > 0 ? "," : "" + fieldSet);
                                nRecs++;
                            }
                        }

                        if (transaction.isTransaction(request)) {
                        } else {
                            conn.commit();
                        }
                    }
                }
            }

        } catch (Throwable e) {

            if(transaction.isTransaction(request)) {
            } else {
                if (conn != null) conn.rollback();
            }
            System.err.println("Query Error:" + e.getLocalizedMessage() + sQuery);
            throw e;

        } finally {
            try {
                if(psdo != null) psdo.close();
                if(transaction.isTransaction(request)) {
                } else {
                    if (conn != null)
                        conn.close();
                }
            } catch (SQLException ex) {
                Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        resultSet.append("]}");
        return resultSet.toString();
    }


    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData    "content" -> download as content, "getLink" -> download the data, default download as file
     * @param requestParam
     * @return
     */
    static public String downloadDocument(Object tbl_wrk, Object params, Object clientData, Object requestParam) {
        String error = "", resultSet = "";
        Object[] result = null;
        try {
            HttpServletRequest request = (HttpServletRequest) requestParam;
            HttpServletResponse response = (HttpServletResponse) request.getAttribute("response");
            workspace tblWrk = (workspace) tbl_wrk;
            Class cls = null;

            ServletOutputStream out_stream = response.getOutputStream();

            if (out_stream != null) {

                try {
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("downloadDocument", Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    result = (Object[]) method.invoke(classInstance, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) requestParam);
                } catch (Throwable th) {
                    // default implementation
                    result = downloadDocumentDefault(tbl_wrk, params, clientData, requestParam);
                }
                if ("getLink".equalsIgnoreCase((String) clientData)) {
                    String outData = "{"
                            + "\"fileName\":\""+(result[0])+"\""
                            + ",\"fileMimeType\":\""+(result[1])+"\""
                            + ",\"file\":\""+(result[3])+"\""
                            + ",\"size\":\""+(result[4])+"\""
                            + ",\"date\":\""+(result[5])+"\""
                            + ",\"note\":\""+(result[6])+"\""
                            + ",\"type\":\""+(result[7])+"\""
                            + ",\"link\":\""+(result[8])+"\""
                            + ",\"hash\":\""+(result[9])+"\""
                            + ",\"id\":\""+(result[10])+"\""
                            + "\"doc_type\":\""+(result[11])+"\""
                            + ",\"doc_type_desc\":\""+(result[12])+"\""
                            + ",\"user_data\":\""+(result[13])+"\""
                            + "}";
                    response.getOutputStream().write(outData.getBytes());
                } else {
                    // download as file : NO file is not in public area
                    // response.setHeader("Content-Disposition", "attachment; filename=" + (String) result[0]);
                    response.setHeader("Filename", (String) result[0]);
                    if (result[2] != null) {
                        // download as content
                        byte[] data = (byte[]) result[2];
                        response.setContentType((String) result[1]);
                        response.setContentLength(data.length);
                        out_stream.write(data);
                        out_stream.close();;
                    } else {
                        String err = (String) result[15];
                        response.setContentType((String) result[1]);
                        response.setStatus(500);
                        response.getOutputStream().write((err != null ? err : "File not found").getBytes());
                    }
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" downloadDocument() error:" + e.getLocalizedMessage());
        }
        return null;
    }

    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData    "contentBase64" -> download as content base64 encoded
     * @param requestParam
     * @return
     */
    static public void downloadDocumentFromURL(Object tbl_wrk, Object params, Object clientData, Object requestParam) throws IOException {
        HttpServletRequest request = (HttpServletRequest) requestParam;
        HttpServletResponse response = (HttpServletResponse) request.getAttribute("response");
        try {
            ServletOutputStream out_stream = response.getOutputStream();
            if (out_stream != null) {
                if ("contentBase64".equalsIgnoreCase((String) clientData)) {
                    // download as content base64 encoded
                    JSONObject paramsJson = new JSONObject((String)params);
                    JSONObject paramJson = paramsJson.getJSONObject("params");
                    if(paramJson != null) {
                        String slink = paramJson.has("link") ? paramJson.getString("link") : null;
                        Object[] contentBase64Res = net.getURL(slink, null);
                        if((int)contentBase64Res[1] == 200) {
                            String data = utility.base64Encode((byte[]) contentBase64Res[0]);
                            response.setContentType((String) contentBase64Res[2]);
                            response.setContentLength(data.length());
                            out_stream.write(data.getBytes());
                            out_stream.close();
                        } else {
                            response.setStatus(500);
                            response.getOutputStream().write(("[LIQUID] url '"+slink+"' got invalid response code:"+(int)contentBase64Res[1]).getBytes());
                        }
                    } else {
                        response.setStatus(500);
                        response.getOutputStream().write("[LIQUID] Invalid params".getBytes());
                    }
                }
            }
        } catch (Throwable e) {
            System.err.println(" downloadDocumentFromURL() error:" + e.getLocalizedMessage());
            response.setStatus(500);
            response.getOutputStream().write(("[LIQUID] Internal error:"+e.toString()).getBytes());
        }
    }



    static public Object [] downloadDocumentDefault( Object tbl_wrk, Object params, Object clientData, Object requestParam ) {
        HttpServletRequest request = (HttpServletRequest) requestParam;
        byte [] fileContent = null;
        String fileName = "";
        String fileMimeType = "";
        Connection conn = null;
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        String sQuery = null;
        String sWhere = "";
        String error = null;
        String dmsFTP = null, dmsSchema = null, dmsTable = null, dmsDocType = null, dmsRootFolder = null;
        int nRecs = 0;
        String file = null, date = null, note = null, type = null, link = null, hash = null, id = null, doc_type = null, doc_type_desc = null, user_data = null;
        long size = 0;

        try {

            // root table data
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fs = cls.getDeclaredField("dmsSchema");
            if(fs != null) {
                fs.setAccessible(true);
                dmsSchema = (String) fs.get(null);
            }
            Field ft = cls.getDeclaredField("dmsTable");
            if(ft != null) {
                ft.setAccessible(true);
                dmsTable = (String) ft.get(null);
            }
            Field fdt = cls.getDeclaredField("dmsDocType");
            if(fdt != null) {
                fdt.setAccessible(true);
                dmsDocType = (String) fdt.get(null);
            }
            Field fFtp = cls.getDeclaredField("dmsFTP");
            if(fFtp != null) {
                fFtp.setAccessible(true);
                dmsFTP = (String) fFtp.get(null);
            }
            Field fr = cls.getDeclaredField("dmsRootFolder");
            if(fr != null) {
                fr.setAccessible(true);
                dmsRootFolder = (String) fr.get(null);
            }



            JSONObject paramsJson = new JSONObject((String)params);
            JSONObject paramJson = paramsJson.getJSONObject("params");
            // { paramJson:..., schema:..., table:..., ids:..., id: ... };
            if(paramJson != null) {

                String sid = paramJson.has("id") ? paramJson.getString("id") : null;
                String slink = paramJson.has("link") ? paramJson.getString("link") : null;

                if(transaction.isTransaction(request)) {
                    conn = transaction.getTransaction(request);
                } else {
                    Object[] connRes = connection.getDBConnection();
                    conn = (Connection) connRes[0];
                }
                if(conn != null) {
                    String cols = "D.file, D.size, D.date, D.note, D.type, D.link, D.hash, D.id, DT.type as doc_type";
                    if("IT".equalsIgnoreCase(workspace.getGLLang())) {
                        cols += ", DT.type_desc_it as doc_type_desc";
                    } else {
                        cols += ", DT.type_desc as doc_type_desc";
                    }
                    sQuery = "SELECT "+cols+""
                            + " from \"" + dmsSchema + "\".\"" + dmsTable + "\" D"
                            + " LEFT JOIN \""+ dmsSchema + "\".\"" + dmsDocType +"\" DT ON DT.id=doc_type_id";

                    if(sid != null && !sid.isEmpty()) {
                        sQuery += " WHERE (D.id='" + sid + "')";
                    } else if(slink != null && !slink.isEmpty()) {
                        if(slink.startsWith("DMS://"))
                            slink = slink.substring(6);
                        sQuery += " WHERE (D.link='" + slink + "')";
                    } else {
                        throw new Exception("Cannot download document : missing search key");
                    }

                    sQuery +=" ORDER BY \"date\" DESC";

                    psdo = conn.prepareStatement(sQuery);
                    rsdo = psdo.executeQuery();
                    if(rsdo != null) {
                        if(rsdo.next()) {
                            file = rsdo.getString("file");
                            size = rsdo.getInt("size");
                            date = rsdo.getString("date");
                            note = rsdo.getString("note");
                            type = rsdo.getString("type");
                            doc_type = rsdo.getString("doc_type");
                            doc_type_desc = rsdo.getString("doc_type_desc");
                            link = rsdo.getString("link");
                            hash = rsdo.getString("hash");
                            id = rsdo.getString("id");

                            if(clientData != null && ((String)clientData).contains("getLink")) {
                                // Non necessario leggere il contenuto
                            } else {
                                if(size > MAX_DOWNLOAD_SIZE) {
                                    String err = "ERROR : File exceed max download size .. " + size/1024 + "/" + MAX_DOWNLOAD_SIZE / 1024 + " Kb";
                                    System.err.println(err);
                                    throw new Exception(err);
                                } else {
                                    Path path = new File(file).toPath();
                                    if (path != null) {
                                        String short_file = Paths.get(file).getFileName().toString();
                                        if(short_file.indexOf(".F.") >= 0) {
                                            short_file = short_file.substring(short_file.indexOf(".F.")+3);
                                        }
                                        fileName = short_file;

                                        fileMimeType = Files.probeContentType(path);
                                        if(dmsFTP != null && !dmsFTP.isEmpty()) {
                                            ftp.setByURL(dmsFTP);
                                            fileContent = ftp.download(path.toString().substring(dmsRootFolder.length()));
                                        } else {
                                            fileContent = Files.readAllBytes(path);
                                        }

                                    } else {
                                        String err = "ERROR : File \"" + file + "\" not found";
                                        System.err.println(err);
                                        throw new Exception(err);
                                    }
                                }
                            }
                            nRecs++;
                        }
                    }
                }
            }
        } catch (Throwable e) {
            error = "Internal Error:" + e.getLocalizedMessage();
            System.err.println(error);
        } finally {
            try {
                if(rsdo != null) rsdo.close();
                if(psdo != null) psdo.close();
                if(transaction.isTransaction(request)) {
                } else {
                    if (conn != null) conn.close();
                }
            } catch (SQLException ex) {
                Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return new Object[] {
                (Object)fileName, (Object)fileMimeType, (Object)fileContent,
                (Object)file, (Object)size,
                (Object)date, (Object)note, (Object)type, (Object)link, (Object)hash, (Object)id,
                (Object)doc_type, (Object)doc_type_desc, (Object)user_data,
                (Object)nRecs,
                (Object)error
        };
    }


    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     */
    static public String deleteDocument(Object tbl_wrk, Object params, Object clientData, Object requestParam) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            workspace tblWrk = (workspace) tbl_wrk;
            JSONObject paramsJson = new JSONObject((String)params);
            JSONObject paramJson = paramsJson.getJSONObject("params");
            // { paramJson:..., schema:..., table:..., ids:..., id: ... };

            boolean readObly = true;
            if(paramJson.has("name")) {
                readObly = workspace.is_dms_readonly((workspace)tbl_wrk, paramJson.getString("name"));
            } else {
                Class cls = Class.forName("app.liquid.dms.connection");
                Field fs = cls.getDeclaredField("dmsReadOnly");
                if(fs != null) {
                    fs.setAccessible(true);
                    readObly = (boolean) fs.get(null);
                }
            }

            if(!readObly) {
                Class cls = null;
                try {
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("deleteDocument", Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    return (String) method.invoke(classInstance, (Object) tblWrk, (Object) params, (Object) clientData, (Object) requestParam);
                } catch (Throwable th) {
                    // Default implementation
                    return deleteDocumentDefault(tbl_wrk, params, clientData, requestParam);
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" deleteDocument() error:" + e.getLocalizedMessage());
        }
        return result;
    }


    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     */
    static public String deleteDocumentDefault( Object tbl_wrk, Object params, Object clientData, Object requestParam ) throws Throwable {
        HttpServletRequest request = (HttpServletRequest) requestParam;
        StringBuilder resultSet = new StringBuilder("{\"resultSet\":[");
        Connection conn = null;
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        String sQuery = null, sQuerySel = null;
        String sWhere = "";
        String dmsSchema = null, dmsTable = null;
        String dmsFTP = null, dmsRootFolder = null;
        int nRecs = 0;
        String delete_file_error = "";

        try {

            // root table
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fs = cls.getDeclaredField("dmsSchema");
            if(fs != null) {
                fs.setAccessible(true);
                dmsSchema = (String) fs.get(null);
            }
            Field ft = cls.getDeclaredField("dmsTable");
            if(ft != null) {
                ft.setAccessible(true);
                dmsTable = (String) ft.get(null);
            }
            Field fFtp = cls.getDeclaredField("dmsFTP");
            if(fFtp != null) {
                fFtp.setAccessible(true);
                dmsFTP = (String) fFtp.get(null);
            }
            Field fr = cls.getDeclaredField("dmsRootFolder");
            if(fr != null) {
                fr.setAccessible(true);
                dmsRootFolder = (String) fr.get(null);
            }

            JSONObject paramsJson = new JSONObject((String)params);
            JSONObject paramJson = paramsJson.getJSONObject("params");
            // { paramJson:..., schema:..., table:..., ids:..., id: ... };

            if(paramJson != null) {

                boolean readObly = true;
                if(paramJson.has("name")) {
                    readObly = workspace.is_dms_readonly((workspace)tbl_wrk, paramJson.getString("name"));
                } else {
                    cls = Class.forName("app.liquid.dms.connection");
                    fs = cls.getDeclaredField("dmsReadOnly");
                    if(fs != null) {
                        fs.setAccessible(true);
                        readObly = (boolean) fs.get(null);
                    }
                }

                if(!readObly) {
                    if(transaction.isTransaction(request)) {
                        conn = transaction.getTransaction(request);
                    } else {
                        Object[] connRes = connection.getDBConnection();
                        conn = (Connection) connRes[0];
                    }

                    if(conn != null) {
                        if (paramJson.has("id")) {
                            String id = paramJson.getString("id");
                            sQuery = "DELETE FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (id='" + id + "')";
                            sQuerySel = "SELECT file FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (id='" + id + "')";
                        } else if (paramJson.has("link")) {
                            String link = paramJson.getString("link");
                            if (link.startsWith("DMS://")) link = link.substring(6);
                            sQuery = "DELETE FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (link='" + link + "')";
                            sQuerySel = "SELECT file FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (link='" + link + "')";
                        } else if (paramJson.has("links")) {
                            JSONArray links = paramJson.getJSONArray("links");
                            String all_links = "(";
                            int n_links = 0;
                            for (int il = 0; il < links.length(); il++) {
                                String link = links.getString(il);
                                if (link.startsWith("DMS://")) link = link.substring(6);
                                all_links += (n_links > 0 ? "," : "") + "'" + link + "'";
                                n_links++;
                            }
                            all_links += ")";
                            sQuery = "DELETE FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (link IN " + all_links + ")";
                            sQuerySel = "SELECT file FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (link IN " + all_links + ")";
                        } else if (paramJson.has("files")) {
                            JSONArray files = paramJson.getJSONArray("files");
                            String all_files = "(";
                            int n_links = 0;
                            for (int il = 0; il < files.length(); il++) {
                                String link = files.getString(il);
                                if (link.startsWith("DMS://")) link = link.substring(6);
                                all_files += (n_links > 0 ? "," : "") + "'" + link + "'";
                                n_links++;
                            }
                            all_files += ")";
                            sQuery = "DELETE FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (file IN " + all_files + ")";
                            sQuerySel = "SELECT file FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (file IN " + all_files + ")";
                        } else {
                            throw new Exception("Unknown record handler in deleteDocumentDefault()");
                        }
                        if (sQuerySel != null) {
                            try {
                                psdo = conn.prepareStatement(sQuerySel);
                                rsdo = psdo.executeQuery();
                                if (rsdo != null) {
                                    while (rsdo.next()) {
                                        String file = rsdo.getString("file");
                                        if (file != null && !file.isEmpty()) {
                                            if(dmsFTP != null && !dmsFTP.isEmpty()) {
                                                ftp.setByURL(dmsFTP);
                                                if(!ftp.delete(file.substring(dmsRootFolder.length()))) {
                                                    if (delete_file_error.length() == 0) {
                                                        delete_file_error += "{";
                                                    } else {
                                                        delete_file_error += ",";
                                                    }
                                                    delete_file_error += "[\"Failed to delete " + file + "\"]";
                                                }
                                            } else {
                                                File f = new File(file);
                                                if (f.exists()) {
                                                    boolean resDel = f.delete();
                                                    if (!resDel) {
                                                        if (delete_file_error.length() == 0) {
                                                            delete_file_error += "{";
                                                        } else {
                                                            delete_file_error += ",";
                                                        }
                                                        delete_file_error += "[\"Failed to delete " + file + "\"]";
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } finally {
                                if (rsdo != null)
                                    rsdo.close();
                                rsdo = null;

                                if (psdo != null)
                                    psdo.close();
                                psdo = null;
                            }

                            if (delete_file_error.length() > 0) {
                                delete_file_error += "}";
                            }

                            try {
                                psdo = conn.prepareStatement(sQuery);
                                int res = psdo.executeUpdate();
                                if (res >= 0) {
                                    String fieldSet = "";
                                    if (paramJson.has("id")) {
                                        fieldSet = "{" + "\"id\":\"" + (paramJson.getString("id")) + "\",\"res\":" + res + ",\"delete_file_error\":\"" + delete_file_error + "\" }";
                                    } else if (paramJson.has("link")) {
                                        fieldSet = "{" + "\"link\":\"" + (paramJson.getString("link")) + "\",\"res\":" + res + ",\"delete_file_error\":\"" + delete_file_error + "\" }";
                                    } else if (paramJson.has("links")) {
                                        fieldSet = "{" + "\"links\":\"" + (paramJson.getString("links")) + "\",\"res\":" + res + ",\"delete_file_error\":\"" + delete_file_error + "\" }";
                                    }
                                    resultSet.append((nRecs > 0 ? "," : "") + fieldSet);
                                    nRecs++;
                                }
                            } finally {
                                if (psdo != null) psdo.close();
                            }
                        }
                    }
                }
            }
        } catch (Throwable e) {
            System.err.println("Query Error:" + e.getLocalizedMessage() + sQuery);
            throw e;

        } finally {
            if(transaction.isTransaction(request)) {
            } else {
                try {
                    conn.close();
                } catch (SQLException ex) {
                    Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        }
        resultSet.append("]}");
        return resultSet.toString();
    }




    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     */
    static public String updateDocument(Object tbl_wrk, Object params, Object clientData, Object requestParam) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if (tbl_wrk != null) {
                JSONObject paramsJson = new JSONObject((String)params);
                JSONObject paramJson = paramsJson.getJSONObject("params");
                // { paramJson:..., schema:..., table:..., ids:..., id: ... };

                boolean readObly = true;
                if(paramJson.has("name")) {
                    readObly = workspace.is_dms_readonly((workspace)tbl_wrk, paramJson.getString("name"));
                } else {
                    Class cls = Class.forName("app.liquid.dms.connection");
                    Field fs = cls.getDeclaredField("dmsReadOnly");
                    if(fs != null) {
                        fs.setAccessible(true);
                        readObly = (boolean) fs.get(null);
                    }
                }

                if(!readObly) {
                    Class cls = null;
                    try {
                        cls = Class.forName("app.liquid.dms.connection");
                        Method method = cls.getMethod("updateDocument", Object.class, Object.class, Object.class, Object.class);
                        Object classInstance = (Object) cls.newInstance();
                        return (String) method.invoke(classInstance, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) requestParam);
                    } catch (Throwable th) {
                        // Default implementation
                        return updateDocumentDefault(tbl_wrk, params, clientData, requestParam);
                    }
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" updateDocument() error:" + e.getLocalizedMessage());
        }
        return result;
    }


    static public String updateDocumentDefault( Object tbl_wrk, Object params, Object clientData, Object requestParam ) {
        try {
            HttpServletRequest request = (HttpServletRequest) requestParam;
            StringBuilder resultSet = new StringBuilder("{\"resultSet\":[");
            Connection conn = null;
            PreparedStatement psdo = null;
            String sQuery = null;
            String sWhere = "";
            String dmsSchema = null, dmsTable = null;
            int nRecs = 0;

            try {

                // root table
                Class cls = Class.forName("app.liquid.dms.connection");
                Field fs = cls.getDeclaredField("dmsSchema");
                if(fs != null) {
                    fs.setAccessible(true);
                    dmsSchema = (String) fs.get(null);
                }
                Field ft = cls.getDeclaredField("dmsTable");
                if(ft != null) {
                    ft.setAccessible(true);
                    dmsTable = (String) ft.get(null);
                }

                JSONObject paramsJson = new JSONObject((String)params);
                JSONObject paramJson = paramsJson.getJSONObject("params");
                // { paramJson:..., schema:..., table:..., ids:..., id: ... };
                if(paramJson != null) {
                    if(transaction.isTransaction(request)) {
                        conn = transaction.getTransaction(request);
                    } else {
                        Object[] connRes = connection.getDBConnection();
                        conn = (Connection) connRes[0];
                    }
                    if(conn != null) {
                        JSONArray keyList;
                        if(paramJson.has("ids")) {
                            keyList = paramJson.getJSONArray("ids");
                        } else {
                            throw new Exception("No keys defined");
                        }

                        boolean readObly = true;
                        if(paramJson.has("name")) {
                            readObly = workspace.is_dms_readonly((workspace)tbl_wrk, paramJson.getString("name"));
                        } else {
                            cls = Class.forName("app.liquid.dms.connection");
                            fs = cls.getDeclaredField("dmsReadOnly");
                            if(fs != null) {
                                fs.setAccessible(true);
                                readObly = (boolean) fs.get(null);
                            }
                        }

                        if(!readObly) {
                            for (int ik = 0; ik < keyList.length(); ik++) {
                                sQuery = "UPDATE \"" + dmsSchema + "\".\"" + dmsTable + "\" SET " + "note='" + paramJson.getString("note") + "'" + " WHERE (id='" + keyList.get(ik) + "')";
                                psdo = conn.prepareStatement(sQuery);
                                int res = psdo.executeUpdate();
                                if (res >= 0) {
                                    String fieldSet = "{" + "\"id\":\"" + (paramJson.getString("id")) + "\"}";
                                    resultSet.append((nRecs > 0 ? "," : "") + fieldSet);
                                    nRecs++;
                                }
                                if (psdo != null) psdo.close();
                            }
                        }
                    }
                }
            } catch (Throwable th) {
                System.err.println("Query Error:" + th.getLocalizedMessage() + sQuery);
                throw th;

            } finally {
                if(transaction.isTransaction(request)) {
                } else {
                    try {
                        conn.close();
                    } catch (SQLException ex) {
                        Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
                    }
                }
            }
            resultSet.append("]}");
            return resultSet.toString();
        } catch(Throwable th) {
        }
        return null;
    }


    public static Object getWorkspace(String database, String schema, String table) {
        workspace wrk = new workspace();
        wrk.tableJson = new JSONObject();
        wrk.tableJson.put("database", database);
        wrk.tableJson.put("schema", schema);
        wrk.tableJson.put("table", table);
        return wrk;
    }


    /**
     *
     * @param request
     * @return
     * @throws Throwable
     */
    public String purge_dms (Object tbl_wrk, Object params, Object clientData, Object request) throws Throwable {
        String dmsSchema = null, dmsTable = null, dmsRootFolder = null;

        try {
            // root table
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fs = cls.getDeclaredField("dmsSchema");
            if (fs != null) {
                fs.setAccessible(true);
                dmsSchema = (String) fs.get(null);
            }
            Field ft = cls.getDeclaredField("dmsTable");
            if (ft != null) {
                ft.setAccessible(true);
                dmsTable = (String) ft.get(null);
            }
            Field fr = cls.getDeclaredField("dmsRootFolder");
            if (fr != null) {
                fr.setAccessible(true);
                dmsRootFolder = (String) fr.get(null);
            }

            if (dmsRootFolder != null && !dmsRootFolder.isEmpty()) {
                dmsRootFolder = getAbsoluteRootPath(dmsRootFolder, (HttpServletRequest) request);
                if (!utility.folderExist(dmsRootFolder)) {
                    if (!utility.createFolder(dmsRootFolder)) {
                        throw new Exception("Unable to create foolder : " + dmsRootFolder);
                    }
                }

                File directoryPath = new File(dmsRootFolder);
                String contents[] = directoryPath.list();
                Object [] connRes = connection.getDBConnection();
                Connection conn = (Connection) connRes[0];
                int dCount = 0;

                if(conn != null) {
                    String sQuery = "SELECT id from \"" + dmsSchema + "\".\"" + dmsTable + "\""
                            + " WHERE file=?"
                            + " ORDER BY date DESC";
                    PreparedStatement psdo = conn.prepareStatement(sQuery);
                    for(int i=0; i<contents.length; i++) {
                        psdo.setString(1, directoryPath + "/" + contents[i]);
                        ResultSet rsdo = psdo.executeQuery();
                        if (rsdo != null) {
                            if(!rsdo.next()) {
                                // delete file
                                // utility.deleteFile(contents[i]);
                                System.out.println("deleting " + contents[i]);
                                dCount++;
                            }
                            rsdo.close();
                        }
                    }
                    psdo.close();
                    System.out.println("No file deleted : " + dCount);
                }
            } else {
                throw new InvalidParameterException("'dmsRootFolder' not set in 'app.liquid.dms.connection'");
            }
        } catch (Exception e) {
        }
        return "";
    }

}
