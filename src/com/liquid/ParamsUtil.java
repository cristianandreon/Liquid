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
        
        String sRequest = null;
        JSONObject requestJson = null;
        
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
                        try { cacheIds = "true".equalsIgnoreCase(sCacheIds) ? 1 : Integer.parseInt((String) request.getParameter("cacheIds")); } catch (Exception e) {}
                        try { cacheIds = "auto".equalsIgnoreCase(sCacheIds) ? 2 : cacheIds; } catch (Exception e) {}
                    } catch (Exception e) {}
                    try { columnsResolved = request.getParameter("columnsResolved"); } catch (Exception e) {}
                    try { startRow = Integer.parseInt((String) request.getParameter("startRow")); } catch (Exception e) {}
                    try { endRow = Integer.parseInt((String) request.getParameter("endRow")); } catch (Exception e) {}
                    try { pageStart = Integer.parseInt((String) request.getParameter("page")); } catch (NumberFormatException e) {}
                    try { pageSize = Integer.parseInt((String) request.getParameter("pageSize")); } catch (NumberFormatException e) {}

                    try { targetDatabase = (String) request.getParameter("targetDatabase"); } catch (NumberFormatException e) {}
                    try { targetSchema = (String) request.getParameter("targetSchema"); } catch (NumberFormatException e) {}
                    try { targetTable = (String) request.getParameter("targetTable"); } catch (NumberFormatException e) {}
                    try { targetColumn = (String) request.getParameter("targetColumn"); } catch (NumberFormatException e) {}
                    try { targetMode = (String) request.getParameter("targetMode"); } catch (NumberFormatException e) {}
                    try { idColumn = (String) request.getParameter("idColumn"); } catch (NumberFormatException e) {}
                    try { applicationRoot = request.getContextPath(); } catch (Exception e) { }

                    sRequest = workspace.get_request_content(request);
                    try { 
                        if(sRequest != null && !sRequest.isEmpty()) 
                            requestJson = new JSONObject(sRequest); 
                    } catch (Exception e) { System.err.println(e.getLocalizedMessage()); }                    
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
