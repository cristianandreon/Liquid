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


/**
 *
 */
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

        // Check libraries version
        check_libs();

        // setuo the DMS
        try {
            dms.startUp(sc);
        } catch (IOException e) {
            Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID] : error on contextInitialized : "+e);
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        // throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
        wsStreamerServer.stop();
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
                    System.out.println(" .. [FAIL : need json-20211205.jar]");
                    retVal = false;
                }
            }
        }
        return retVal;
    }

}