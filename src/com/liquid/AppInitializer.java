package com.liquid;



import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletContext;
import javax.servlet.ServletContextListener;
import javax.servlet.ServletContextEvent;


// @WebListener
public class AppInitializer implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID] : contextInitialized ... ");
        ServletContext sc = sce.getServletContext();
        // sc.addListener(new HttpSessionCollector());
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
        }
    }

    
}