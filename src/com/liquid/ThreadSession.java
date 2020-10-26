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
    //

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
    private ArrayList<Long> childThreadIds = null;
    public String incoming = null;
    public String sessionId = null;
            
   // store the owner (the callback instance) of the workspace... one workspace can have multiple owner (storing additional data)
    public Object workspaceOwner = null;
    
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
            threadSessionInfo.sessionId = request.getRequestedSessionId();
            threadSessionList.add(threadSessionInfo);
        } finally {
            bLocked = false;
        }
    }    
    
    static void saveThreadSessionInfo(String browser, String sessionId) throws InterruptedException {
        while(bLocked) { Thread.sleep(100); }
        try {
            bLocked = true;
            ThreadSession threadSessionInfo = new ThreadSession();
            threadSessionInfo.browser = browser;
            threadSessionInfo.request = null;
            threadSessionInfo.response = null;
            threadSessionInfo.out = null;
            threadSessionInfo.timeTick = System.currentTimeMillis();        
            threadSessionInfo.thread = Thread.currentThread();
            threadSessionInfo.threadName = threadSessionInfo.thread.getName();
            threadSessionInfo.threadId = threadSessionInfo.thread.getId();
            threadSessionInfo.cypher = login.getSaltString(16) + "-" + String.valueOf(threadSessionInfo.timeTick);
            threadSessionInfo.sessionId = sessionId;
            threadSessionList.add(threadSessionInfo);
        } finally {
            bLocked = false;
        }
    }
    
    
    /**
     * set a specific owner for this session (ex.: workspace store multiple owner, each for his thread, or none for main, like in a static class)
     * 
     * @param Owner the object Owning
     * @return 
     */
    static public boolean setOwner ( Object owner ) {
        ThreadSession threadSession = getThreadSessionInfo ();
        if(threadSession != null) {
            if(threadSession.workspaceOwner != owner) {
                threadSession.workspaceOwner = owner;
            }
            return true;
        }
        return false;
    }
    
    static public boolean addChildThread ( long childThreadId ) {
        ThreadSession threadSession = getThreadSessionInfo ();
        if(threadSession != null) {
            if(threadSession.childThreadIds == null) threadSession.childThreadIds = new ArrayList<Long>();
            threadSession.childThreadIds.add(childThreadId);
            return true;
        }
        return false;
    }
    
    /**
     * Search in the threads registered as servlet for the request / session / etc..
     * @return 
     */
    static public ThreadSession getThreadSessionInfo ( ) {
        long threadId = Thread.currentThread().getId();
        for(ThreadSession threadSession : threadSessionList) {
            if(threadSession != null) {
                if(threadSession.threadId == threadId) return threadSession;
                if(threadSession.childThreadIds != null) {
                    for(long childThreadId : threadSession.childThreadIds) {
                        if(childThreadId == threadId) return threadSession;
                    }
                }
            }
        }
        return null;
    }
    static public void removeThreadSessionInfo () throws InterruptedException {
        while(bLocked) { Thread.sleep(100); }
        try {
            bLocked = true;
            threadSessionList.remove(getThreadSessionInfo());
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
        ThreadSession threadSession = getThreadSessionInfo ();
        if(threadSession != null) {
            if(threadSession.incoming != null) {
                return threadSession.incoming;
            }
        }
        return null;
    }
    static public String resetIncomingMessage () {        
        ThreadSession threadSession = getThreadSessionInfo ();
        if(threadSession != null) {
            threadSession.incoming = null;
        }
        return null;
    }
}
