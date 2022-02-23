package com.liquid;



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
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        // throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
        if(wsStreamerServer.serverThread.run) {
            wsStreamerServer.serverThread.run = false;
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            if(wsStreamerServer.serverThread.clientThreads != null) {
                for(int i=0; i<wsStreamerServer.serverThread.clientThreads.size(); i++) {
                    wsClientThread clientThread = wsStreamerServer.serverThread.clientThreads.get(i);
                    if(clientThread.isAlive()) {
                        clientThread.run = false;
                        try {
                            Thread.sleep(1000);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                        if(clientThread.isAlive()) {
                            clientThread.stop();
                        }
                    }
                    wsStreamerServer.serverThread.clientThreads.set(i, null);
                }
                wsStreamerServer.serverThread.clientThreads.clear();
                wsStreamerServer.serverThread.clientThreads = null;
            }

            if(wsStreamerServer.serverThread.isAlive()) {
                wsStreamerServer.serverThread.stop();
            }
            wsStreamerServer.serverThread = null;
        }
    }

    
}