package com.liquid;



import org.json.JSONArray;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.net.SocketAddress;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletContext;
import javax.servlet.ServletContextListener;
import javax.servlet.ServletContextEvent;


// @WebListener
public class AppInitializer implements ServletContextListener {

    public static boolean bHttpSessionListnerAdded = false;
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID] : contextInitialized ... ");
        ServletContext sc = sce.getServletContext();
        if(!bHttpSessionListnerAdded) {
            try {
                sc.addListener(new HttpSessionCollector());
            } catch (Throwable e3) {
                try {
                    // TODO try to register servlet2 httpListner
                    // sc.addListener(new HttpSessionCollector2());
                } catch (Throwable e2) {
                }
            }
        }
        check_libs();
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        // throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
        if (wsStreamerServer.serverThread != null) {
            if (wsStreamerServer.serverThread.server != null) {
                try {
                    wsStreamerServer.serverThread.server.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (wsStreamerServer.serverThread.run) {
                wsStreamerServer.serverThread.run = false;
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
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

            if (wsStreamerServer.serverThread.isAlive()) {
                wsStreamerServer.serverThread.stop();
            }
            wsStreamerServer.serverThread = null;
        }
    }

    static public boolean check_libs() {
        boolean retVal = true;
        for(Object cls : new Object [] { JSONArray.class }) {
            Class klass = (Class) cls;
            String className = klass.getName();
            URL location = klass.getResource('/' + className.replace('.', '/') + ".class");
            System.out.println("LIQUID: Checking libs...");
            System.out.print(" [" + klass.getName() + " -> " + location);
            if ("org.json.JSONArray".equalsIgnoreCase(className)) {
                if (location.toString().contains("json-20211205.jar!/org/json/JSONArray.class")) {
                    System.out.println(" .. [OK]");
                } else {
                    System.out.println(" .. [FAIL]");
                    retVal = false;
                }
            }
        }
        return retVal;
    }

}