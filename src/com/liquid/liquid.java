package com.liquid;

import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.jsp.JspWriter;
import java.lang.reflect.Method;
import java.util.ArrayList;

public class liquid {

    static public Object is_session_expired_class_instance;
    static public Method is_session_expired_method;

    static public String is_session_expired_method_name;

    /**
     * set the callback to chech if the session was expired
     * @param classInstance
     * @param methodName class.method inside classInstance to call ( args : HttpServletRequest, HttpServletResponse, JspWriter )
     */
    static public void set_session_expired_callback (Object classInstance, String methodName) {
        if(classInstance != null && methodName != null) {
            is_session_expired_class_instance = classInstance;
            is_session_expired_method = null;
            is_session_expired_method_name = methodName;
        } else {
            is_session_expired_class_instance = null;
            is_session_expired_method = null;
            is_session_expired_method_name = null;
        }
    }


    /**
     * check is the session was expired by callback application's method
     *
     * @param request
     * @param response
     * @param out
     * @return
     * @throws Exception
     */
    static public boolean is_session_expired (HttpServletRequest request, HttpServletResponse response, JspWriter out) throws Exception {
        if(is_session_expired_class_instance != null && is_session_expired_method_name != null) {
            if(is_session_expired_method == null) {
                Object[] result = event.get_method_by_class_name(is_session_expired_method_name, is_session_expired_class_instance);
                // Object classInstance = result[0];
                is_session_expired_method = (Method) result[1];
            }
            if(is_session_expired_method != null) {
                return (boolean)is_session_expired_method.invoke(is_session_expired_class_instance, request, response, out);
            } else {
                throw new Exception("invalid metdod:"+is_session_expired_method_name);
            }
        } else {
            return false;
        }
    }

    /**
     *
     * Prepare the script to execute in the client, and register the control in the server side
     *
     * @param request           the httpServelt request
     * @param controlId         the Id of the control
     * @param controlJsonFile   the json file name (relative path)
     * @param owner             the class instance owning the callbacks
     * @param preFilters        the pre-filters (Object [] : name, value, operator(><= ..), logic(AND/OR) Mode (RW/RO)
     * @param filters           the filters (Object [] : name, value, operator(><= ..), logic(AND/OR) Mode (RW/RO)
     * @param userProps         the user properties to append to the control
     * @param langSupport
     * @return
     * @throws Throwable
     */

    public static String startPopup(
            HttpServletRequest request
            , String controlId
            , String controlJsonFile
            , String controlJsonContent
            , Object owner
            , ArrayList<Object[]> preFilters
            , ArrayList<Object[]> filters
            , ArrayList<Object[]> userProps
            , boolean langSupport
    ) throws Throwable {

        String scriptToExec = "";

        // Registra il controllo e la classe a cui è+ connesso (this) : NO lo regestrerà Liquid.startPopup a runtime
        String sPopupJson = null;

        if(controlJsonFile != null)
            sPopupJson = workspace.get_table_control(
                    (HttpServletRequest) request,
                    controlId,
                    controlJsonFile,
                    owner,
                    "json");
        else
            sPopupJson = workspace.get_table_control_from_string(
                    (HttpServletRequest) request,
                    controlId,
                    controlJsonFile,
                    owner,
                    "json");


        //
        // Set dei pre-filtri
        //
        if (preFilters != null) {
            workspace wrk = workspace.get_tbl_manager_workspace(controlId);
            for (int iF = 0; iF < preFilters.size(); iF++) {
                Object[] filter = preFilters.get(iF);
                if (filter != null) {
                    String name = (String) filter[0];
                    String value = (String) (filter[1] != null ? filter[1] : null);
                    String operator = (String) (filter[2] != null ? filter[2] : null);
                    String logic = (String)(filter[3] != null ? filter[3] : null);
                    if (name != null) {
                        db.set_prefilter(wrk, name, value, operator, logic);
                    }
                }
            }
        }


        // script da eseguire per visualizzare il popup
        scriptToExec = "";

        // Supportlo lingua corrente
        if(!langSupport) {
            scriptToExec += "Liquid.translateLabels=false;";
        }

        scriptToExec += "Liquid.startPopup('"+controlId+"','" + sPopupJson + "');";



        // setFilters(obj, columnName, filterName, filterValue, filterOperator, filterLogic)
        if (filters != null) {
            for (int iF = 0; iF < filters.size(); iF++) {
                Object[] filter = filters.get(iF);
                if (filter != null) {
                    String name = (String) filter[0];
                    String value = (String) filter[1];
                    String operator = (String) filter[2];
                    String logic = (String) filter[3];
                    String mode = (String) filter[4];
                    if (name != null) {
                        scriptToExec += "Liquid.setFilters('" + controlId + "','" + name + "',''," + (value != null ? "'"+value+"'" : "null") + "," + (operator != null ? "'"+operator+"'" : "null") + "," + (logic != null ? "'"+logic+"'" : "null") + ");";
                    }
                    if (mode != null) {
                        scriptToExec += "Liquid.setFilterMode('" + controlId + "','"+name+"','" + mode + "');";
                    }
                }
            }
        }
        // Proprieta' del controllo
        if (userProps != null) {
            for (int iF = 0; iF < userProps.size(); iF++) {
                Object[] userProp = userProps.get(iF);
                if (userProp != null) {
                    String name = String.valueOf(userProp[0]);
                    String value = String.valueOf(userProp[1]);
                    if (name != null) {
                        scriptToExec += "Liquid.setUserProp('" + controlId + "','" + name + "'," + (value != null ? "'"+value+"'" : "null") + ");";
                    }
                }
            }
        }
        return scriptToExec;
    }


    public static String startPopup(
            HttpServletRequest request
            , String controlId
            , String controlJsonFile
            , Object owner
            , ArrayList<Object[]> preFilters
            , ArrayList<Object[]> filters
            , ArrayList<Object[]> userProps
            , boolean langSupport
    ) throws Throwable {
        return startPopup(
                request
                , controlId
                , controlJsonFile
                , null
                , owner
                , preFilters
                , filters
                , userProps
                , langSupport);
    }

    public static String startPopup(
            HttpServletRequest request
            , String controlId
            , String controlJsonFile
            , Object owner
            , ArrayList<Object[]> filters
            , ArrayList<Object[]> userProps
            , boolean langSupport
    ) throws Throwable {
        return startPopup(
                request
                , controlId
                , controlJsonFile
                , null
                , owner
                , null
                , filters
                , userProps,
                langSupport);
    }

    public static String startPopupFromString(
            HttpServletRequest request
            , String controlId
            , String controlJsonContent
            , Object owner
            , ArrayList<Object[]> preFilters
            , ArrayList<Object[]> filters
            , ArrayList<Object[]> userProps
            , boolean langSupport
    ) throws Throwable {
        return startPopup(
                request
                , controlId
                , null
                , controlJsonContent
                , owner
                , preFilters
                , filters
                , userProps,
                langSupport);
    }

    public static String startPopupFromString(
            HttpServletRequest request
            , String controlId
            , String controlJsonContent
            , Object owner
            , ArrayList<Object[]> filters
            , ArrayList<Object[]> userProps
            , boolean langSupport
    ) throws Throwable {
        return startPopup(
                request
                , controlId
                , null
                , controlJsonContent
                , owner
                , null
                , filters
                , userProps,
                langSupport);
    }


    public static String startFormX(
            HttpServletRequest request
            , String controlId
            , String controlJsonFile
            , Object owner
            , String mode
            , ArrayList<Object[]> fieldsValue
            , ArrayList<Object[]> userProps
    ) throws Throwable {
        return startFormX(request, controlId, controlJsonFile, null, owner, mode, fieldsValue, userProps);
    }

    public static String startFormXFromString(
            HttpServletRequest request
            , String controlId
            , String controlJsonContent
            , Object owner
            , String mode
            , ArrayList<Object[]> fieldsValue
            , ArrayList<Object[]> userProps
    ) throws Throwable {
        return startFormX(request, controlId, null, controlJsonContent, owner, mode, fieldsValue, userProps);
    }


    /**
     * Prepare the script to execute in the client, and register the control (FormX/DialogX) in the server side
     *
     * @param request
     * @param controlId
     * @param controlJsonFile
     * @param controlJsonContent
     * @param owner
     * @param mode
     * @param fieldsValue
     * @param userProps
     * @return
     * @throws Throwable
     */
    public static String startFormX(
            HttpServletRequest request
            , String controlId
            , String controlJsonFile
            , String controlJsonContent
            , Object owner
            , String mode
            , ArrayList<Object[]> fieldsValue
            , ArrayList<Object[]> userProps
    ) throws Throwable {

        String scriptToExec = "";

        // Registra il controllo e la classe a cui è+ connesso (this) : NO lo regestrerà Liquid.startPopup a runtime
        String sPopupJson = null;
        if(controlJsonFile != null)
            sPopupJson = workspace.get_table_control(
                (HttpServletRequest) request,
                controlId,
                controlJsonFile,
                owner,
                "json");
        else
            sPopupJson = workspace.get_table_control_from_string(
                    (HttpServletRequest) request,
                    controlId,
                    controlJsonFile,
                    owner,
                    "json");


        // script da eseguire per visualizzare il popup
        if("DialogX".equalsIgnoreCase(mode) || "Dialog".equalsIgnoreCase(mode)) {
            scriptToExec = "Liquid.startDialogX('" + controlId + "','" + sPopupJson + "');";
        } else if("FormX".equalsIgnoreCase(mode) || "Form".equalsIgnoreCase(mode)) {
            scriptToExec = "Liquid.startFormX('" + controlId + "','" + sPopupJson + "');";
        }


        // Campi del controllo
        if (fieldsValue != null) {
            for (int iF = 0; iF < fieldsValue.size(); iF++) {
                Object[] fieldValue = fieldsValue.get(iF);
                if (fieldValue != null) {
                    String name = String.valueOf(fieldValue[0]);
                    String value = String.valueOf(fieldValue[1]);
                    if (name != null) {
                        scriptToExec += "Liquid.setField('" + controlId + "','" + name + "'," + (value != null ? "'"+value+"'" : "null") + ");";
                    }
                }
            }
        }

        // Proprieta' del controllo
        if (userProps != null) {
            for (int iF = 0; iF < userProps.size(); iF++) {
                Object[] userProp = userProps.get(iF);
                if (userProp != null) {
                    String name = String.valueOf(userProp[0]);
                    String value = String.valueOf(userProp[1]);
                    if (name != null) {
                        scriptToExec += "Liquid.setUserProp('" + controlId + "','" + name + "'," + (value != null ? "'"+value+"'" : "null") + ");";
                    }
                }
            }
        }
        return scriptToExec;
    }



    /**
     *
     * Prepare the script to execute in the client, and register the control (FormX/DialogX) in the server side
     *
     * @param request
     * @param controlId
     * @param jspPage               Pagina JSP che definische gli elementi HTML
     * @param onOKServerClass       Classe da invocare su pressione pulsante OK
     * @param onOKName              nome del pulsante OK
     * @param onCancelServerClass   Classe da invocare su pressione pulsante Cancel
     * @param onOKCancelName        nome del pulsante Cancel
     * @param mode                  Modalita' (DialogX/FormX)
     * @param fieldsValue           Valori iniziali dei campi
     * @param userProps             Proprietà inmiziali del controllo
     * @return
     * @throws Throwable
     */
    public static String startFormX(
            HttpServletRequest request
            , String controlId
            , String jspPage
            , ArrayList<Object[]> jspParams
            , String onOKServerClass
            , String onOKName
            , String onCancelServerClass
            , String onOKCancelName
            , String mode
            , ArrayList<Object[]> fieldsValue
            , ArrayList<Object[]> userProps
    ) throws Throwable {

        JSONObject popupJson = new JSONObject();

        // Campi del controllo
        JSONArray columnsJson = null;
        if (fieldsValue != null) {
            columnsJson = new JSONArray();
            for (int iF = 0; iF < fieldsValue.size(); iF++) {
                Object[] fieldValue = fieldsValue.get(iF);
                if (fieldValue != null) {
                    String name = (String) fieldValue[0];
                    String value = (String) fieldValue[1];
                    if (name != null) {
                        JSONObject columnJson = new JSONObject();
                        columnJson.put("name", name);
                        columnJson.put("required", true);
                        columnsJson.put(columnJson);
                    }
                }
            }
        }
        popupJson.put("columns", columnsJson);

        // Parametri da passare alla jsp del controllo
        JSONArray jspParamsJson = null;
        if (jspParams != null) {
            jspParamsJson = new JSONArray();
            for (int iF = 0; iF < jspParams.size(); iF++) {
                Object[] jspParam = jspParams.get(iF);
                if (jspParam != null) {
                    String name = (String) jspParam[0];
                    String value = (String) jspParam[1];
                    if (name != null) {
                        JSONObject jspParamJson = new JSONObject();
                        jspParamJson.put("name", name);
                        jspParamJson.put("required", true);
                        jspParamsJson.put(jspParamJson);
                    }
                }
            }
        }

        // Layout
        JSONArray layoutsJson = new JSONArray();
        JSONObject layoutJson = new JSONObject();
        layoutJson.put("name", controlId);
        layoutJson.put("source", "url("+jspPage+")");
        if(jspParamsJson != null)
            layoutJson.put("sourceParams", jspParamsJson);
        layoutJson.put("nRows", 1);
        layoutJson.put("overflow", "overlay");
        layoutsJson.put(layoutJson);
        popupJson.put("layouts", layoutsJson);

        // Azioni
        JSONArray actionsJson = new JSONArray();
        JSONObject actionJson = new JSONObject();
        actionJson.put("name", "cancel");
        actionJson.put("img", "cancel.png");
        actionJson.put("size", 20);
        actionJson.put("text", "Annulla");
        actionJson.put("client", "Liquid.close");
        if(onOKServerClass != null)
            actionJson.put("server", onOKServerClass);
        actionJson.put("overflow", "overlay");
        actionsJson.put(actionJson);
        actionJson = new JSONObject();
        actionJson.put("name", "ok");
        actionJson.put("img", "add.png");
        actionJson.put("size", 20);
        actionJson.put("text", "OK");
        JSONArray clients = new JSONArray();
        clients.put("Liquid.close");
        clients.put("closeFormX()");
        actionJson.put("client", clients);
        if(onCancelServerClass != null)
            actionJson.put("server", onCancelServerClass);
        actionsJson.put(actionJson);
        popupJson.put("actions", actionsJson);

        // Opzioni
        popupJson.put("mode", mode);
        popupJson.put("modless",true);
        popupJson.put("navVisible",false);
        popupJson.put("autoInsert",false);
        popupJson.put("listTabVisible",false);
        popupJson.put("layoutsTabVisible",false);

        // Creazione codice JS
        return startFormX(request, controlId, null, popupJson.toString(), mode, fieldsValue, userProps);
    }

}
