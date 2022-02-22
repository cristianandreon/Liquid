/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.OutputStream;
import java.util.ArrayList;
import java.util.concurrent.Semaphore;
import java.util.logging.Level;
import java.util.logging.Logger;
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

    private static final int MAX_AVAILABLE = 1;
    private static final Semaphore semaphore = new Semaphore(MAX_AVAILABLE, true);


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

    // for the websocket
    public OutputStream outputStream = null;
    public String token = null;
            
   // store the owner (the callback instance) of the workspace... one workspace can have multiple owner (storing additional data)
    public Object workspaceOwner = null;
    
    static ArrayList<ThreadSession> threadSessionList = new ArrayList<ThreadSession>();
    
    static private boolean bDebug = false;
            
            

    static synchronized public void saveThreadSessionInfo ( String browser, HttpServletRequest request, HttpServletResponse response, JspWriter out ) throws InterruptedException {
        try {
            semaphore.acquire();
            ThreadSession threadSessionInfo = new ThreadSession();
            threadSessionInfo.browser = browser;
            threadSessionInfo.request = request;
            threadSessionInfo.response = response;
            threadSessionInfo.out = out;
            threadSessionInfo.outputStream = null;
            threadSessionInfo.token = null;
            threadSessionInfo.timeTick = System.currentTimeMillis();
            threadSessionInfo.thread = Thread.currentThread();
            threadSessionInfo.threadName = threadSessionInfo.thread.getName();
            threadSessionInfo.threadId = threadSessionInfo.thread.getId();
            threadSessionInfo.cypher = login.getSaltString(16) + "-" + String.valueOf(threadSessionInfo.timeTick);
            threadSessionInfo.sessionId = request != null ? request.getRequestedSessionId() : null;
            threadSessionList.add(threadSessionInfo);


            if (bDebug)
                Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, "ThreadID:" + Thread.currentThread().getId() + " regsitered ...(" + ThreadSession.threadSessionList.size() + ")");

            if (getThreadSessionInfo() == null) {
                for (int i = 0; i < ThreadSession.threadSessionList.size(); i++) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, "#" + (i + 1) + " ThreadID:" + ThreadSession.threadSessionList.get(i).threadId);
                }
                Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, "*** FATAL ERROR : saveThreadSessionInfo() : ThreadID:" + Thread.currentThread().getId() + " NOT ADDED");
                getThreadSessionInfo();
            }
        } catch (Exception e) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, e.getMessage());
        } finally {
            semaphore.release();
        }
    }
    
    static synchronized void saveThreadSessionInfo(String browser, String sessionId, OutputStream outputStream, String token) throws InterruptedException {
        try {
            semaphore.acquire();
            ThreadSession threadSessionInfo = new ThreadSession();
            threadSessionInfo.browser = browser;
            threadSessionInfo.request = null;
            threadSessionInfo.response = null;
            threadSessionInfo.out = null;
            threadSessionInfo.outputStream = outputStream;
            threadSessionInfo.token = token;
            threadSessionInfo.timeTick = System.currentTimeMillis();        
            threadSessionInfo.thread = Thread.currentThread();
            threadSessionInfo.threadName = threadSessionInfo.thread.getName();
            threadSessionInfo.threadId = threadSessionInfo.thread.getId();
            threadSessionInfo.cypher = login.getSaltString(16) + "-" + String.valueOf(threadSessionInfo.timeTick);
            threadSessionInfo.sessionId = sessionId;
            threadSessionList.add(threadSessionInfo);
            if(bDebug) 
                Logger.getLogger(workspace.class.getName()).log(Level.INFO, " WS ThreadID:"+Thread.currentThread().getId()+" regsitered");
        } catch (Exception e) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, e.getMessage());
        } finally {
            semaphore.release();
        }
    }
    
    
    /**
     * set a specific owner for this session (ex.: workspace store multiple owner, each for his thread, or none for main, like in a static class)
     * 
     * @param owner the object Owning
     * @return 
     */
    static synchronized public boolean setOwner ( Object owner ) {
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
    static synchronized public ThreadSession getThreadSessionInfo ( ) {
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
    static public synchronized void removeThreadSessionInfo () throws InterruptedException {
        try {
            semaphore.acquire();
            if(bDebug) 
                Logger.getLogger(workspace.class.getName()).log(Level.INFO, "ThreadID:"+Thread.currentThread().getId()+" removed");
            threadSessionList.remove(getThreadSessionInfo());
        } catch (Exception e) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, e.getMessage());
        } finally {
            semaphore.release();
        }
    }
    
    static public synchronized void addIncomingMessage ( String message, String cypher ) throws InterruptedException {
        try {
            semaphore.acquire();
            for(ThreadSession threadSession : threadSessionList) {
                if(threadSession.cypher.equals(cypher)) {
                    if(threadSession.incoming == null)
                        threadSession.incoming = "";
                    threadSession.incoming += message;
                }
            }
        } finally {
            semaphore.release();
        }
    }
    static public synchronized String getIncomingMessage ( String cypher ) throws InterruptedException {
        try {
            semaphore.acquire();
            for(ThreadSession threadSession : threadSessionList) {
                if(threadSession.cypher.equals(cypher)) {
                    if(threadSession.incoming != null) {
                        return threadSession.incoming;
                    }
                }
            }
        } finally {
            semaphore.release();
        }
        return null;
    }

    static public synchronized String getIncomingMessage () {
        ThreadSession threadSession = getThreadSessionInfo ();
        if(threadSession != null) {
            if(threadSession.incoming != null) {
                return threadSession.incoming;
            }
        }
        return null;
    }
    static public synchronized String resetIncomingMessage () {
        ThreadSession threadSession = getThreadSessionInfo ();
        if(threadSession != null) {
            threadSession.incoming = null;
        }
        return null;
    }
}
