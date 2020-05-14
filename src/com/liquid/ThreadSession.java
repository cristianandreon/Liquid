/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.util.ArrayList;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.jsp.JspWriter;

/**
 *
 * @author Cristitan
 */
public class ThreadSession {

    //
    // Dati sessione per thread
    //
    // N.B.: Di fatto TLRequests potrebbe essere sostituito dal threadId
    //
    static ThreadLocal<Object> TLRequests = new ThreadLocal<Object>();    
    static public boolean bLocked = false;
    
    public String browser = "";
    public long timeTick = 0;
    public String cypher = "";
    public HttpServletRequest request = null;
    public HttpServletResponse response = null;
    public JspWriter out = null;
    public Thread thread = null;
    public String threadName = "";
    public long threadId = 0;
    public String incoming = null;
    
    static ArrayList<ThreadSession> threadSessionList = new ArrayList<ThreadSession>();

    static public void saveThreadSessionInfo ( String browser, HttpServletRequest request, HttpServletResponse response, JspWriter out ) throws InterruptedException {
        while(bLocked) { Thread.sleep(100); }
        try {
            bLocked = true;
            ThreadSession threadSessionInfo = new ThreadSession();
            threadSessionInfo.browser = browser;
            threadSessionInfo.request = request;
            threadSessionInfo.response = response;
            threadSessionInfo.out = out;
            threadSessionInfo.timeTick = System.currentTimeMillis();        
            threadSessionInfo.thread = Thread.currentThread();
            threadSessionInfo.threadName = threadSessionInfo.thread.getName();
            threadSessionInfo.threadId = threadSessionInfo.thread.getId();
            threadSessionInfo.cypher = login.getSaltString(16) + "-" + String.valueOf(threadSessionInfo.timeTick);
            TLRequests.set(threadSessionInfo);
            threadSessionList.add(threadSessionInfo);
        } finally {
            bLocked = false;
        }
    }    
    static public ThreadSession getThreadSessionInfo ( ) {
        return (ThreadSession)TLRequests.get();
    }
    static public void removeThreadSessionInfo () throws InterruptedException {
        while(bLocked) { Thread.sleep(100); }
        try {
            bLocked = true;
            threadSessionList.remove(getThreadSessionInfo());
            TLRequests.remove();
        } finally {
            bLocked = false;
        }
    }
    
    static public void addIncomingMessage ( String message, String cypher ) throws InterruptedException {
        while(bLocked) { Thread.sleep(100); }
        try {
            for(ThreadSession threadSession : threadSessionList) {
                if(threadSession.cypher.equals(cypher)) {
                    if(threadSession.incoming == null)
                        threadSession.incoming = "";
                    threadSession.incoming += message;
                }
            }
        } finally {
            bLocked = false;
        }
    }
    static public String getIncomingMessage ( String cypher ) throws InterruptedException {
        while(bLocked) { Thread.sleep(100); }
        try {
            for(ThreadSession threadSession : threadSessionList) {
                if(threadSession.cypher.equals(cypher)) {
                    if(threadSession.incoming != null) {
                        return threadSession.incoming;
                    }
                }
            }
        } finally {
            bLocked = false;
        }
        return null;
    }

    static public String getIncomingMessage () {        
        ThreadSession threadSession = (ThreadSession)TLRequests.get();
        if(threadSession != null) {
            if(threadSession.incoming != null) {
                return threadSession.incoming;
            }
        }
        return null;
    }
    static public String resetIncomingMessage () {        
        ThreadSession threadSession = (ThreadSession)TLRequests.get();
        if(threadSession != null) {
            threadSession.incoming = null;
        }
        return null;
    }
}
