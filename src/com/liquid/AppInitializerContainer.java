package com.liquid;



import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;



public class AppInitializerContainer implements javax.servlet.ServletContainerInitializer {

    @Override
    public void onStartup(Set<Class<?>> set, ServletContext sc) throws ServletException {
        // throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
        Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID] : adding listner HttpSessionCollector ... ");
        if(!AppInitializer.bHttpSessionListnerAdded) {
            sc.addListener(new HttpSessionCollector()); // javax.servlet.ServletContext.addListener(Ljava/util/EventListener;)V
        }
    }
}