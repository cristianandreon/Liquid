/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

// in web.xml
// <listener><listener-class>com.example.HttpSessionCollector</listener-class></listener>
            

public class HttpSessionCollector implements HttpSessionListener {
    private static final Map<String, HttpSession> sessions = new HashMap<String, HttpSession>();

    @Override
    public void sessionCreated(HttpSessionEvent event) {
        HttpSession session = event.getSession();
        sessions.put(session.getId(), session);
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent event) {
        sessions.remove(event.getSession().getId());
    }

    public static HttpSession find(String sessionId) {
        if(sessions == null || (sessions != null && sessions.isEmpty())) {
            Logger.getLogger(wsStreamerClient.class.getName()).log(Level.SEVERE, "[LIQUID] : no HttpSession collected ... may listner is not active");
            return null;
        } else {
            return sessions.get(sessionId);
        }
    }
}
