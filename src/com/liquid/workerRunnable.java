package com.liquid;

import static com.liquid.worker.DONE;
import java.lang.reflect.InvocationTargetException;
import java.util.logging.Level;
import java.util.logging.Logger;

/*
* @exclude
*/
public class workerRunnable implements Runnable {
    worker wrk = null;
    public workerRunnable(Object param) {
        wrk = (worker)param;
    }
    @Override
    public void run() {
        try {
            if(wrk != null) {
                wrk.result = (Object)wrk.method.invoke(wrk.Instance, (Object)wrk.userId, (Object)wrk.params, (Object)wrk.clientData, (Object)null);
                wrk.status = DONE;
            }
        } catch (IllegalAccessException ex) {
            Logger.getLogger(worker.class.getName()).log(Level.SEVERE, null, ex);
        } catch (IllegalArgumentException ex) {
            Logger.getLogger(worker.class.getName()).log(Level.SEVERE, null, ex);
        } catch (InvocationTargetException ex) {
            Logger.getLogger(worker.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}