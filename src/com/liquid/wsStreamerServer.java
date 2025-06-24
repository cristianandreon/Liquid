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

    public static void stop() {
        try {
            Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID] : Stopping WS Server ... ");
            if(serverThread != null) {
                serverThread.run = false;
                if (wsStreamerServer.serverThread.server != null) {
                    try {
                        wsStreamerServer.serverThread.server.close();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
                if (wsStreamerServer.serverThread.clientThreads != null) {
                    for (int i = 0; i < wsStreamerServer.serverThread.clientThreads.size(); i++) {
                        wsClientThread clientThread = wsStreamerServer.serverThread.clientThreads.get(i);

                        if (clientThread.clientSocket != null) {
                            try {
                                clientThread.clientSocket.close();
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                        }
                        if (clientThread.outputStream != null) {
                            try {
                                clientThread.outputStream.close();
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                        }

                        if (clientThread.isAlive()) {
                            clientThread.run = false;
                            try {
                                Thread.sleep(1000);
                            } catch (InterruptedException e) {
                                e.printStackTrace();
                            }
                            if (clientThread.isAlive()) {
                                clientThread.stop();
                            }
                        }
                        wsStreamerServer.serverThread.clientThreads.set(i, null);
                    }
                    wsStreamerServer.serverThread.clientThreads.clear();
                    wsStreamerServer.serverThread.clientThreads = null;
                }

                long timeut = System.currentTimeMillis() + 30 * 1000;
                while(System.currentTimeMillis() < timeut) {
                    Thread.sleep(100);
                    if(!serverThread.isAlive()) break;
                }
                if(serverThread.isAlive()) {
                    serverThread.stop();
                }
                serverThread = null;
            }
            Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID] : WS Server stopped ");
        } catch (Exception ex) {
            Logger.getLogger(wsStreamerClient.class.getName()).log(Level.SEVERE, "Could not create web server "+ex.getLocalizedMessage());
        }
    }
}
