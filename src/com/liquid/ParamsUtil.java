/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import org.json.JSONObject;

/**
 *
 * @author Cristitan
 */
public class ParamsUtil {
    
    public class get_recordset_params {
        public String service;
        String controlId = null;
        String tblWrk = null;
        String sCacheIds = null;
        int cacheIds = 0;
        String columnsResolved = null;
        long startRow = 0;
        long endRow = workspace.pageSize > 0 ? workspace.pageSize : 100;
        long pageStart = 0;
        long pageSize = workspace.pageSize > 0 ? workspace.pageSize : 100;
        String targetDatabase = null;
        String targetSchema = null;
        String targetTable = null;
        String targetColumn = null;
        String targetMode = null;
        String idColumn = null;
        String applicationRoot = null;
        boolean extendedMetadata = true;
        String sRequest = null;
        JSONObject requestJson = null;
        String dateSep = null;
        String timeSep = null;
        
        HttpServletRequest request = null;
        HttpSession session = null;
        
        boolean bSaveQueryInfo = true;
                
        
        get_recordset_params( HttpServletRequest request ) {
            
            try {
                
                this.request = request;                
                if(request != null) {                    
                    this.session = request.getSession();                
                    try { controlId = (String) request.getParameter("controlId"); } catch (Exception e) {}            
                    try { tblWrk = (String) request.getParameter("tblWrk"); } catch (Exception e) {}  
                    try {
                        String sCacheIds = (String) request.getParameter("cacheIds");
                        if("auto".equalsIgnoreCase(sCacheIds)) {
                            cacheIds = 2;
                        } else {
                            try {
                                if ("true".equalsIgnoreCase(sCacheIds)) {
                                    cacheIds = 1;
                                } else {
                                    cacheIds = Integer.parseInt(sCacheIds);
                                }
                            } catch (Exception e) {
                            }
                        }
                    } catch (Exception e) {}
                    try { columnsResolved = request.getParameter("columnsResolved"); } catch (Exception e) {}
                    try { startRow = Integer.parseInt((String) request.getParameter("startRow")); } catch (NumberFormatException e) {}
                    try { endRow = Integer.parseInt((String) request.getParameter("endRow")); } catch (NumberFormatException e) {}
                    try { pageStart = Integer.parseInt((String) request.getParameter("page")); } catch (NumberFormatException e) { pageStart = 0; }
                    try { pageSize = Integer.parseInt((String) request.getParameter("pageSize")); } catch (NumberFormatException e) { }

                    try { targetDatabase = (String) request.getParameter("targetDatabase"); } catch (Exception e) {}
                    try { targetSchema = (String) request.getParameter("targetSchema"); } catch (Exception e) {}
                    try { targetTable = (String) request.getParameter("targetTable"); } catch (Exception e) {}
                    try { targetColumn = (String) request.getParameter("targetColumn"); } catch (Exception e) {}
                    try { targetMode = (String) request.getParameter("targetMode"); } catch (Exception e) {}
                    try { idColumn = (String) request.getParameter("idColumn"); } catch (Exception e) {}
                    try { service = (String) request.getParameter("service"); } catch (Exception e) {}

                    try { extendedMetadata = (boolean) "false".equalsIgnoreCase(request.getParameter("extendedMetadata")) ? false : true; } catch (Exception e) {}

                    try { applicationRoot = request.getContextPath(); } catch (Exception e) { }

                    sRequest = workspace.get_request_content(request);
                    try { 
                        if(sRequest != null && !sRequest.isEmpty()) 
                            requestJson = new JSONObject(sRequest); 
                    } catch (Exception e) { System.err.println(e.getLocalizedMessage()); }

                    try { dateSep = request.getParameter("dateSep"); } catch (Exception e) { }
                    try { timeSep = request.getParameter("timeSep"); } catch (Exception e) { }

                    request.setAttribute("dateSep", dateSep);
                    request.setAttribute("timeSep", timeSep);
                }

                if(pageSize > 0) {
                    startRow = pageStart * pageSize;
                    endRow = startRow + pageSize;
                }
                if(startRow < 0) startRow = 0;
                
                bSaveQueryInfo = true;
                
            } catch (Exception e) {
            }
        }

        get_recordset_params(String controlId, String sRequest, boolean bSaveQueryInfo, long maxRows) {
            this.controlId = controlId;
            this.sRequest = sRequest;
            try { 
                if(sRequest != null && !sRequest.isEmpty()) 
                    requestJson = new JSONObject(sRequest); 
            } catch (Exception e) { System.err.println(e.getLocalizedMessage()); }
            this.bSaveQueryInfo = bSaveQueryInfo;
            this.endRow = this.pageSize = maxRows > 0 ? maxRows : workspace.maxRows;
        }
    }
    
}
