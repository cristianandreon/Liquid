/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import com.liquid.db.IdsCache;
import java.lang.management.ManagementFactory;
import java.lang.reflect.Field;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 *
 * @author Cristitan
 */
public class Info {

    static public String message;

    public static String getVersion() {
        return workspace.version_string;
    }
    public static String getInfo( HttpServletRequest request, HttpServletResponse response) {
        String out_string = "";

        out_string += "<div style=\"padding-top:70px; width:calc( 100% - 20px );\">";
        out_string += "<table class=\"liquidFoundTable liquidMenuXLeft\" border=0 cellspacing=0 cellpadding=10 style=\"display:block; padding: 3; border: 1px solid darkolivegreen; width:calc( 100% - 10px )\">";
        
        out_string += "<tr style=\"background-color:Gray\">";
        out_string += "<td style=\"font-size: 150%;\">Liquid framework</td>";
        out_string += "<td>version <b>"+getVersion()+"</b></td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>General Info</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr>";
        out_string += "<td>"+"Written by"+"</td>";
        out_string += "<td>"+"Cristian Andreon, via Roma 194, 31040 Chiarano (TV), Italy"+"</td>";
        out_string += "<td>"+"cristianandreon.eu<br/>info@cristianandreon.eu"+"</td>";
        out_string += "</tr>";
                
        out_string += "<tr style=\"background-color:whiteSmoke\">";
        out_string += "<td>WS Server</td>";
        out_string += "<td>"+(wsStreamerServer.serverThread != null ? (wsStreamerServer.serverThread.run ? "<span style=\"color:darkGreen\">[running on port "+wsStreamerServer.port+"]</span>" : "<span style=\"color:darkRed\">[stopped]</span>") : ("<span style=\"color:darkGray\">[n/d]</span>") )+"</td>";
        out_string += "<td>"
                +(wsStreamerServer.errors != null ? (wsStreamerServer.errors.replace("\n", "<br/>")+"<br/>") : "")
                +(wsStreamerServer.nConnections > 0 ? (wsStreamerServer.nConnections+" connections"+"<br/>") : "")
                +(wsStreamerServer.nRequests > 0 ? (wsStreamerServer.nRequests+" requests"+"<br/>") : "")
                +(wsStreamerServer.serverThread != null ? (wsStreamerServer.serverThread.clientThreads.size()+" hosts"+"<br/>") : "")
                
                +"</td>";
        out_string += "</tr>";
        
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Max retrieve rows</td>";
        out_string += "<td>"+workspace.maxRows+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr>";
        out_string += "<td>Default page size</td>";
        out_string += "<td>"+workspace.pageSize+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>No. active workspace</td>";
        out_string += "<td>"+workspace.glTblWorkspaces.size()+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr>";
        out_string += "<td>No. cache items</td>";
        out_string += "<td>"+db.glIdsCaches.size()+"</td>";
        out_string += "<td style=\"font-size: 65%;\">";
        for(int ic=0; ic<db.glIdsCaches.size(); ic++) {
            IdsCache idc = db.glIdsCaches.get(ic);
            out_string += "query:<span style=\"font-size: 65%;\">"+idc.query + "</span></br>";
            out_string += "n.ids:"+(idc.ids != null ? idc.ids.size() : "N/D") + "</br>";;
            out_string += "lastAccessTime:"+idc.lastAccessTime + "</br>";;
            out_string += "startRow:"+idc.startRow + "</br>";;
            out_string += "</br>";            
        }
        out_string += "</td>";
        out_string += "</tr>";

        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Genesis token</td>";
        out_string += "<td>"+workspace.genesisToken+"</td>";
        out_string += "<td>"+"(project mode)"+"</td>";
        out_string += "</tr>";


        /*
        String LiquidDatabase = (String)request.getSession().getAttribute("GLLiquidDatabase");
        out_string += "<tr>";
        out_string += "<td>Current database</td>";
        out_string += "<td>"+(LiquidDatabase != null ? LiquidDatabase : "[N/D]")+"</td>";
        out_string += "<td>"+"(user session)"+"</td>";
        out_string += "</tr>";

        String LiquidSchema = (String)request.getSession().getAttribute("GLLiquidSchema");
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Current schema</td>";
        out_string += "<td>"+(LiquidSchema != null ? LiquidSchema : "[N/D]")+"</td>";
        out_string += "<td>"+"(user session)"+"</td>";
        out_string += "</tr>";
        */

        String LiquidDriver = (String)request.getSession().getAttribute("GLLiquidDriver");
        out_string += "<tr>";
        out_string += "<td>DB Driver</td>";
        out_string += "<td>"+(LiquidDriver != null ? LiquidDriver : "[N/D]")+"</td>";
        out_string += "<td>"+"(user session)"+"</td>";
        out_string += "</tr>";

        String LiquidConnectionURL = (String)request.getSession().getAttribute("GLLiquidConnectionURL");
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Connection URL</td>";
        out_string += "<td>"+(LiquidConnectionURL != null ? LiquidConnectionURL : "[N/D]")+"</td>";
        out_string += "<td>"+"(user session)"+"</td>";
        out_string += "</tr>";

        String methodConnection = connection.testDBConnection();
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Managed Connection</td>";
        out_string += "<td>"+(methodConnection != null ? methodConnection.replace("\n", "</br>") : "[N/D]")+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr>";
        out_string += "<td>Black list</td>";
        out_string += "<td>"+BlackWhiteList.getBlackListHTML()+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>White list</td>";
        out_string += "<td>"+BlackWhiteList.getWhiteListHTML()+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";


        out_string += "<tr>";
        out_string += "<td>Metadata Cache Enabled</td>";
        out_string += "<td>"+metadata.IsMetadataCacheEnabled+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>No. MetaData Tables</td>";
        out_string += "<td>"+metadata.metaDataTable.size()+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";
     
        int bytecodeVer = 0;
        String s = null;
        try { 
            s = javassist.CtClass.version; 
            bytecodeVer = javassist.bytecode.ClassFile.MAJOR_VERSION; 
            if(bytecodeVer == 53) {
                if(s==null) s = "";
                s += "</br><span style=\"color:red\">Java 9 is unsupported</span>]";
            }
        } catch(Throwable th) {}
        out_string += "<tr>";
        out_string += "<td>Java version</td>";
        out_string += "<td>"+System.getProperty("java.version")+"</td>";
        out_string += "<td>"
                +"(bytecode ver.:"+bytecodeVer+")<br/>"
                +"("+request.getSession().getServletContext().getMajorVersion()+"."+request.getSession().getServletContext().getMinorVersion()+")<br/>"
                +"</td>";
        out_string += "</tr>";

        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Arguments</td>";
        out_string += "<td colspan=2 style=\"font-size: 70%;\">"+ManagementFactory.getRuntimeMXBean().getInputArguments()+"</td>";
        out_string += "</tr>";

        out_string += "<tr>";
        out_string += "<td>Library path</td>";
        out_string += "<td colspan=2 style=\"font-size: 70%;\">"+ManagementFactory.getRuntimeMXBean().getLibraryPath()+"</td>";
        out_string += "</tr>";
        
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Class path</td>";
        out_string += "<td colspan=2 style=\"font-size: 70%;\">"+ManagementFactory.getRuntimeMXBean().getClassPath()+"</td>";
        out_string += "</tr>";

        out_string += "<tr>";
        out_string += "<td>In Arguments</td>";
        out_string += "<td colspan=2 style=\"font-size: 70%;\">"+ManagementFactory.getRuntimeMXBean().getInputArguments()+"</span></td>";
        out_string += "</tr>";
        
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Specific name</td>";
        out_string += "<td><span style=\"font-size: 70%;\">"+ManagementFactory.getRuntimeMXBean().getSpecName() + " - " + ManagementFactory.getRuntimeMXBean().getSpecVersion() + " - " + ManagementFactory.getRuntimeMXBean().getSpecVendor()+"</span></td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr>";
        out_string += "<td>VM name</td>";
        out_string += "<td><span style=\"font-size: 70%;\">"+ManagementFactory.getRuntimeMXBean().getVmName() + " - " + ManagementFactory.getRuntimeMXBean().getVmVersion()+ " - " + ManagementFactory.getRuntimeMXBean().getVmVersion()+"</span></td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>HTTP Response buffer size</td>";
        out_string += "<td><span style=\"font-size: 70%;\">"+response.getBufferSize()+"</span></td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";


        String domains = "";
        for (String domain : ManagementFactory.getPlatformMBeanServer().getDomains() ) {
            domains += "["+domain+"]";
        }
        out_string += "<tr>";
        out_string += "<td>Domain</td>";
        out_string += "<td>"+domains+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Memory usage</td>";
        out_string += "<td><span style=\"font-size: 70%;\">"+ManagementFactory.getMemoryMXBean().getHeapMemoryUsage() + " - " + ManagementFactory.getMemoryMXBean().getNonHeapMemoryUsage()+"</span></td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";

        out_string += "<tr>";
        out_string += "<td>Threads</td>";
        out_string += "<td>"+ManagementFactory.getThreadMXBean().getThreadCount() + " - " + ManagementFactory.getThreadMXBean().getPeakThreadCount()+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";


        
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Python path</td>";
        out_string += "<td>"+(workspace.pythonPath != null ? workspace.pythonPath : "[N/D]")+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";
        
        out_string += "<tr>";
        out_string += "<td>Python executable</td>";
        out_string += "<td>"+(workspace.pythonExecutable != null ? workspace.pythonExecutable : "python3")+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";
        
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Python env path</td>";
        out_string += "<td>"+workspace.arrayToString( workspace.getPythonPath().toArray(), "\"", "\"", ",")+"</td>";
        out_string += "<td>"+""+"</td>";
        out_string += "</tr>";
        
        String hostName = "";
        try {
            hostName = InetAddress.getLocalHost().getHostName();
            out_string += "<tr>";
            out_string += "<td>Host</td>";
            out_string += "<td>"+hostName+"</td>";
            out_string += "<td>"+""+"</td>";
            out_string += "</tr>";
        } catch (UnknownHostException ex) {
            Logger.getLogger(Info.class.getName()).log(Level.SEVERE, null, ex);
        }

        try {
            for(int i=0; i<workspace.glTblWorkspaces.size(); i++) {
                String sSessions = "";
                for(int j=0; j<workspace.glTblWorkspaces.get(i).sessions.size(); j++) {
                    sSessions += "#" + (j+1) + " : " + workspace.glTblWorkspaces.get(i).sessions.get(j).browser + " - " + workspace.glTblWorkspaces.get(i).sessions.get(j).threadName;
                    sSessions += "<br/>";
                }

                out_string += "<tr style=\"background-color:lightGray\">";
                out_string += "<td>"+workspace.glTblWorkspaces.get(i).controlId+"</td>";
                out_string += "<td>"+workspace.glTblWorkspaces.get(i).databaseSchemaTable
                        + "<span style=\"font-size: 85%;\">"
                        + " - (token:"+workspace.glTblWorkspaces.get(i).token+")"
                        + "</span>"
                        + "</td>";
                out_string += "<td>"
                        + "Service count:"+workspace.glTblWorkspaces.get(i).nConnections
                        + "<br/>"
                        + "<br/>"
                        + "N.Sessions:"+workspace.glTblWorkspaces.get(i).sessions.size()
                        + "<br/>"
                        + "</td>";
                
                out_string += "</tr>";

                out_string += "<tr rowspan=\"2\" style=\"background-color:lightGray\">";
                out_string += "<td>"+""+"</td>";
                out_string += "<td>"
                        + "<span style=\"font-size: 85%;\">"
                        + "<a href='' onclick='javascript:location.href=\"./index.jsp/act=resetTableMetadata\"'>[Reset Tables Metadata]</a>"
                        + "</span>"
                        + "<span style=\"font-size: 85%;\">"
                        + "<a href='' onclick='javascript:location.href=\"./index.jsp/act=resetDatalist\"'>[Reset Datalist]</a>"
                        + "</span>"
                        + "</td>";
                out_string += "<td>"
                        + "Service count:"+workspace.glTblWorkspaces.get(i).nConnections
                        + "<br/>"
                        + "<br/>"
                        + "N.Sessions:"+workspace.glTblWorkspaces.get(i).sessions.size()
                        + "<br/>"
                        + "</td>";

                out_string += "</tr>";

                if(Info.message != null && !Info.message.isEmpty()) {
                    out_string += "<tr style=\"background-color:transparent\">";
                    out_string += "<td colspan='3'>" + Info.message + "</td>";
                    out_string += "</tr>";
                }

            }
        } catch (Exception ex) {
            Logger.getLogger(Info.class.getName()).log(Level.SEVERE, null, ex);
        }



        String dmsFTP = null, dmsFTPPublicURL = null, dmsSchema = null, dmsTable = null, dmsDocTypeTable = null, dmsRootFolder = null, dmsName = null;
        String mode = null;
        long dmsMaxFileSize = 0;

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
            Field fdt = cls.getDeclaredField("dmsDocType");
            if (fdt != null) {
                fdt.setAccessible(true);
                dmsDocTypeTable = (String) fdt.get(null);
            }
            Field fr = cls.getDeclaredField("dmsRootFolder");
            if (fr != null) {
                fr.setAccessible(true);
                dmsRootFolder = (String) fr.get(null);
            }
            Field fms = cls.getDeclaredField("dmsMaxFileSize");
            if (fms != null) {
                fms.setAccessible(true);
                dmsMaxFileSize = (long) fms.get(null);
            }

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
        }

        out_string += "<tr style=\"background-color:transparent\">";
        out_string += "<td>D.M.S.</td>";
        out_string += "<td colspan=\"2\">";
        out_string += "<table cellspacing=\"10\" cellpadding=\"10\" style=\"border:1px solid gray; padding:30px; width:800px\">";
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Schema</td>"
                + "<td><b>"
                + dmsSchema
                + "</b></td>"
                + "</tr>";
        out_string += "</td></tr>";
        out_string += "<tr style=\"background-color:whitesmoke\">";
        out_string += "<td>Table</td>"
                + "<td><b>"
                + dmsTable
                + "</b></td>"
                + "</tr>";
        out_string += "</td></tr>";


        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Max File Size</td>"
                + "<td><b>"
                + dmsMaxFileSize
                + "</b></td>"
                + "</tr>";
        out_string += "</td></tr>";
        out_string += "<tr style=\"background-color:whitesmoke\">";
        out_string += "<td>Doc Type Table</td>"
                + "<td><b>"
                + dmsDocTypeTable
                + "</b></td>"
                + "</tr>";
        out_string += "</td></tr>";
        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>Root Folder</td>"
                + "<td><b>"
                + dmsRootFolder
                + "</b></td>"
                + "</tr>";
        out_string += "</td></tr>";
        out_string += "<tr style=\"background-color:whitesmoke\">";
        out_string += "<td>FTP</td>"
                + "<td><b>"
                + (dmsFTP != null ? utility.purge_password_url(dmsFTP) : "[N/D]")
                + "</b></td>"
                + "</tr>";

        out_string += "<tr style=\"background-color:lightGray\">";
        out_string += "<td>FTP Public URL</td>"
                + "<td><b>"
                + (dmsFTPPublicURL != null ? utility.purge_password_url(dmsFTPPublicURL) : "[N/D]")
                + "</b></td>"
                + "</tr>";
        out_string += "</td></tr>";
        out_string += "<tr style=\"background-color:whitesmoke\">";
        out_string += "<td></td>"
                + "<td><b>"
                + com.liquid.workspace.get_button_control("PURGE DMS", "", "com.liquid.dms.purge_dms")
                + "</b></td>"
                + "</tr>";

        out_string += "</td></tr>";

        out_string += "</table>";


        out_string += "</table>";
        out_string += "</div>";

        
                
        return  out_string;
    }    
}
