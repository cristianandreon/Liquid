package com.liquid;

import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;

public class liquid {

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
     * @return
     * @throws Throwable
     */

    public static String startPopup(
            HttpServletRequest request
            , String controlId
            , String controlJsonFile
            , Object owner
            , ArrayList<Object[]> preFilters
            , ArrayList<Object[]> filters
            , ArrayList<Object[]> userProps
            ) throws Throwable {

        String scriptToExec = "";

        // Registra il controllo e la classe a cui è+ connesso (this) : NO lo regestrerà Liquid.startPopup a runtime
        String sPopupJson = workspace.get_table_control(
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
        scriptToExec = "Liquid.startPopup('"+controlId+"','" + sPopupJson + "');";


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

        if (userProps != null) {
            for (int iF = 0; iF < userProps.size(); iF++) {
                Object[] userProp = userProps.get(iF);
                if (userProp != null) {
                    String name = (String) userProp[0];
                    String value = (String) userProp[1];
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
            , ArrayList<Object[]> filters
            , ArrayList<Object[]> userProps
    ) throws Throwable {
        return startPopup(
                request
                , controlId
                , controlJsonFile
                , owner
                , null
                , filters
                , userProps
            );
    }

}
