/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.IOException;
import java.net.SocketException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;



public class wsStreamerServer {

    static public String AppURL = null;
    static public String webSocketHost = null;
    static public int port = 7373;
    
    static public boolean run = false;
    static public wsServerThread serverThread = null;
    static public String errors = "";
    static public long nConnections = 0;
    static public long nRequests = 0;
    static public long nRecived = 0;
    static public long nSent = 0;

    // override user's assets (test purpose)
    static public boolean applyForAllUsers = true;

    
    public static void start( HttpServletRequest request ) throws SocketException, IOException {
        try {
            AppURL = request.getContextPath();
            if(serverThread == null) {
                serverThread = new wsServerThread();
                serverThread.start();
                wsStreamerServer.run = true;
            }
        } catch (Exception ex) {
            Logger.getLogger(wsStreamerClient.class.getName()).log(Level.SEVERE, "Could not create web server "+ex.getLocalizedMessage());
        }        
    }   
}
