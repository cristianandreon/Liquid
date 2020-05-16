/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author Cristitan
 */
public class Callback {
    
            
    /**
     * <h3>Show a message in the client and wait for the response</h3>
     * <p>
     * This method set a property from a bean
     * </p>
     * @param  message  the message to show (String)

     * @see         Callback
     */    
    static public int send( String data ) {
        return send( data, null );
    }
    
    /**
     * <h3>Show a message in the client and wait for the response</h3>
     * <p>
     * This method set a property from a bean
     * </p>
     * @param  data  the data to send to client(String)
     * @param  mode free param, not still used(String)

     * @see         Messagebox
     */    
    private static int send( String data, String mode ) {
        int retVal = 0;
        ThreadSession threadSession = ThreadSession.getThreadSessionInfo ( );
        if(threadSession != null && threadSession.out != null) {
            try {
                String messageJson = "<Liquid>serverCallback:{"
                        + "\"data\":\""+utility.base64Encode(data)+"\""
                        + ",\"cypher\":\""+utility.base64Encode(threadSession.cypher)+"\""
                        + "}</Liquid><LiquidStartResponde/>";
                threadSession.out.print(messageJson);
                threadSession.out.flush();
            } catch (IOException ex) {
                Logger.getLogger(Callback.class.getName()).log(Level.SEVERE, null, ex);
            }
        } else {
            // Fatal error
            Logger.getLogger(Callback.class.getName()).log(Level.SEVERE, null, "No sessionInfo available. Cannot communicate with client");
        }
        return retVal;
    }    
}
