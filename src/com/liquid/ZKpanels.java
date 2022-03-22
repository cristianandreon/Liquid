/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

package com.liquid;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ZKpanels {


    /**
     *
     * @param request
     * @param out
     * @return
     */
    static public String set_zk_content(HttpServletRequest request, JspWriter out) {
        try {
            if (request != null) {
                String controlId = "", tblWrk = "";
                String table = "", schema = "", database = "", source = "", token = "", note = "";
                try {
                    controlId = (String) request.getParameter("controlId");
                } catch (Exception e) {
                }
                try {
                    token = (String) request.getParameter("token");
                } catch (Exception e) {
                }

                // Verifica tel token : almeno un controllo deve avere il token assegnato (foreign table, lockuo etc hanno il token ereditato
                if (!workspace.isTokenValid(token)) {
                    System.out.println("// LIQUID ERROR : Invalid Token");
                    return "{\"result\":-1,\"error\":\"" + utility.base64Encode("Error: invalid token") + "\"}";
                }

                String fileContent = workspace.get_request_content(request);
                String res = null;
                if (fileContent != null && !fileContent.isEmpty()) {
                    if (fileContent.charAt(0) == '{') {
                        JSONObject json = new JSONObject(fileContent);
                        if (json != null) {
                            String fileName = json.has("sourceFileName") ? utility.base64Decode(json.getString("sourceFileName")) : null;
                            String fullFileName = json.has("sourceFullFileName") ? utility.base64Decode(json.getString("sourceFullFileName")) : null;
                            String liquidJsonsProjectFolder = (String) request.getSession().getAttribute("GLLiquidJsonsProjectFolder");

                            if (fileName == null || fileName.isEmpty()) {
                                fileName = controlId + ".xml";
                            }
                            fileName = fileName != null ? fileName.replaceAll("[^a-zA-Z0-9\\.\\-]", "_") : null;
                            fullFileName = fullFileName != null ? fullFileName.replaceAll("[^a-zA-Z0-9\\.\\-]", "_") : null;

                            JSONObject zkParams = json.getJSONObject("zkParams");

                            // Parametro dalla UI
                            if(zkParams.has("projectFolder")) {
                                liquidJsonsProjectFolder = zkParams.getString("projectFolder");
                            }

                            // Creazione codice controllo ZK
                            StringBuffer zkFileContent = process_control(request, json, zkParams, null, null, liquidJsonsProjectFolder);

                            if (fullFileName != null && !fullFileName.isEmpty()) {
                                // salvataggio file nella cartella in produzione
                                try {
                                    Files.write(Paths.get(fullFileName), zkFileContent.toString().getBytes(StandardCharsets.UTF_8));
                                } catch (Exception ex) {
                                    return "{\"result\":-1,\"error\":\"" + utility.base64Encode(ex.getLocalizedMessage() + " - writing:" + fullFileName) + "\"}";
                                }
                            }


                            //
                            // salvataggio file nella cartella del progetto
                            //
                            res = workspace.save_file_in_project_folder(request, fileName, zkFileContent.toString(), liquidJsonsProjectFolder);
                        }

                        return res;

                    } else {
                        return "{\"result\":-1,\"error\":\"" + utility.base64Encode("Invalid content : should be the json of the control") + "\"}";
                    }
                }
            }
        } catch (Exception ex) {
            Logger.getLogger(ZKpanels.class.getName()).log(Level.SEVERE, null, ex);
            return "{\"result\":-1,\"error\":\"" + utility.base64Encode("Unexpected error:"+ex.getMessage()) + "\"}";
        }
        return "{\"result\":0}";
    }





    static StringBuffer process_control(HttpServletRequest request,
                                  JSONObject json,
                                  JSONObject zkParams,
                                  JSONObject foreignTableJSON,
                                  String parentPanelId,
                                  String projectFolder) throws Exception {
        StringBuffer zkFileContent = null;

        // Tabella schema
        String tableName = json.getString("table");
        String schemaName = json.getString("schema");


        // Parametri ZK
        String fieldInTitleBar = zkParams.getString("fieldInTitleBar");


        // Titolo del pannello
        String panelTitle = zkParams.getString("panelTitle");
        if (panelTitle == null || panelTitle.isEmpty()) {
            panelTitle = utility.toDescriptionCase(tableName);
        }


        // ID pannello
        String panelBaseId = zkParams.getString("panelId");
        if (panelBaseId == null || panelBaseId.isEmpty()) {
            panelBaseId = nameSpacer.DB2Hibernate(tableName);
        }
        String panelId = panelBaseId + "_P@1";
        String beanName = panelBaseId;


        // Fit to hibernate
        fieldInTitleBar = nameSpacer.DB2Hibernate(fieldInTitleBar);

        String customerName = zkParams.getString("customerName");
        String appName = zkParams.getString("appName");
        String beanClass = zkParams.getString("beanClass"); // "com."+customerName+"."+appName+".hibernate.bean."+panelId;
        int maxResult = zkParams.getInt("maxResult");
        ;
        String orderByField = zkParams.getString("orderByField");
        String orderByFieldMode = zkParams.getString("orderByFieldMode");
        String profileData = zkParams.getString("profileData");
        ; // "/com/"+customerName+"/util/hibernate/controller/datiPiedinoProfilo-1.incxml";

        boolean showList = zkParams.getBoolean("showList"); // "S";
        boolean autoSelect = zkParams.getBoolean("autoSelect"); // "S";
        boolean autoFind = zkParams.getBoolean("autoFind"); // "S";
        int itemsInPage = zkParams.getInt("itemsInPage"); // "20";
        boolean popupCommand = zkParams.getBoolean("popupCommand"); // ;
        boolean use_asset = zkParams.getBoolean("use_asset"); // false;
        boolean can_insert = zkParams.getBoolean("can_insert"); // true;
        boolean can_update = zkParams.getBoolean("can_update"); // true;
        boolean can_delete = zkParams.getBoolean("can_delete"); // true;
        boolean process_foreign_tables = zkParams.getBoolean("process_foreign_tables");
        boolean process_hibernate = zkParams.getBoolean("process_hibernate");

        String eventsFunctionsFile = zkParams.getString("eventsFunctionsFile");
        String lookupDefinitionFile = zkParams.getString("lookupDefinitionFile");
        String hibFolder = zkParams.getString("hibFolder");

        StringBuffer allLookupReferenceCode = new StringBuffer("");


        boolean eventsFunctionCodeToFile = false;
        if(projectFolder != null && !projectFolder.isEmpty()) {
            if(eventsFunctionsFile != null && !eventsFunctionsFile.isEmpty()) {
                eventsFunctionCodeToFile = true;
            }
        }


        boolean lookupCodeToFile = false;
        if(projectFolder != null && !projectFolder.isEmpty()) {
            if (lookupDefinitionFile != null && !lookupDefinitionFile.isEmpty()) {
                lookupCodeToFile = true;
            }
        }



        if (process_hibernate) {
            try {
                String hibProjFolder = projectFolder;
                if(!hibProjFolder.endsWith(File.separator) && !hibFolder.startsWith(File.separator))
                    hibProjFolder += File.separator;
                hibProjFolder += hibFolder;
                workspace.check_result(HibernateRevEng.reverse_eng(request, json, beanClass, hibProjFolder, zkParams), "ZKpanels");
            } catch (Throwable e) {
                System.err.println(e.getMessage());
            }
        }




        if(parentPanelId == null) {
            zkFileContent = new StringBuffer(
                    "<!-- Generated by Liquid ver." + workspace.version_string + " - Copyright (c) Cristian Andreon - cristianandreon.eu - liquid-framework.org - 2022. -->\n" +
                            "<page id=\"" + panelBaseId + "\">\n"
                            + "\t<template-xmlreference>/com/" + customerName + "/" + appName + "/controller/Reference.xml</template-xmlreference>\n"
                            + "\t<title><![CDATA[" + panelTitle + "]]></title>\n"
                            + "\t<menupath><![CDATA[ / " + panelTitle + "]]></menupath>\n"
                            + "\t<panels>\n"
            );
        } else {
            zkFileContent = new StringBuffer("");
        }

        zkFileContent.append(""
                        + "\t\t<!-- " + panelTitle + " on Table:" + tableName + " -->\n"
                        + "\t\t<panel id=\"" + panelId + "" + "\">\n"
                        + "\t\t\t<title><![CDATA[" + panelTitle + "]]></title>\n"

                        // Titolo finestra
                        + "\n"
                        + "\t\t\t<template-paneldato-hibernate>\n"
                        + "\t\t\t\t<entity>" + beanClass + "</entity>\n"
                        + "\t\t\t\t<propertyDescription>\n"
                        + "\t\t\t\t\t<property name=\"" + fieldInTitleBar + "\"/>\n"
                        + "\t\t\t\t</propertyDescription>\n"
                        + "\t\t\t</template-paneldato-hibernate>\n"
        );

                        // Link
                        if(foreignTableJSON != null) {
                            zkFileContent.append(
                                    "\n"
                                    + "\t\t\t<template-link-hibernate>\n"
                                    + "\t\t\t\t<entity>" + beanClass + "</entity>\n"
                                    + "\t\t\t\t<panelMaster>"+parentPanelId+"</panelMaster>\n"
                                    + "\t\t\t\t<propertyLink>\n"
                                    + "\t\t\t\t\t<property name=\"" + nameSpacer.DB2Hibernate(foreignTableJSON.getString("column")) + "\">\n"
                                    + "\t\t\t\t\t\t<proprietaMaster>"+ nameSpacer.DB2Hibernate(foreignTableJSON.getString("foreignColumn")) +"</proprietaMaster>\n"
                                    + "\t\t\t\t\t</property>\n"
                                    + "\t\t\t\t</propertyLink>\n"
                                    + "\t\t\t</template-link-hibernate>\n"
                            );
                        }


        // Profilo
        zkFileContent.append(
                         "\n"
                        + "\t\t\t<template-profilo-hibernate>\n"
                        + "\t\t\t\t<entity>" + beanClass + "</entity>\n"
                        + "\t\t\t\t<propertyProfilo>\n"
        );

        // filtro orop profilo (PreFilter in Liquid)
        String valueInProfileFilter = null;
        String fieldInProfileFilter = null; // es.: ${user}.filtro_bando_attivo
        if (valueInProfileFilter != null) {
            zkFileContent.append(
                    "\t\t\t\t<property name=\"" + fieldInProfileFilter + "\">\n"
                    + "\t\t\t\t<espressioneRicerca>" + valueInProfileFilter + "</espressioneRicerca>\n"
                    + "\t\t\t\t<comparatoreRicerca>?=</comparatoreRicerca>\n"
                    + "\t\t\t\t<espressioneValore>${user}.valore_bando_attivo</espressioneValore>\n"
                    + "\t\t\t\t<espressioneValoreOnlyIfNull>S</espressioneValoreOnlyIfNull>\n"
                    + "\t\t\t\t</property>\n"
            );
        }

        // Prop profilo incluse su file
        if (profileData != null) {
            zkFileContent.append("\t\t\t\t<!--@template-xmlinclude=" + profileData + " -->\n");
        }

        zkFileContent.append(
                ""
                + "\t\t\t\t</propertyProfilo>\n"
                + "\t\t\t</template-profilo-hibernate>\n"
        );


        // Lista e finders
        zkFileContent.append(
                "\n"
                + "\t\t\t<list id=\"" + panelBaseId + "_L@1\">\n"
                + "\t\t\t\t<show>" + (showList ? "S" : "N") + "</show>\n"
                + "\t\t\t\t<autoFind>" + (autoFind ? "S" : "N") + "</autoFind>\n"
                + "\t\t\t\t<autoSelect>" + (autoSelect ? "S" : "N") + "</autoSelect>\n"
                + "\t\t\t\t<paging>\n"
                + "\t\t\t\t\t<size>" + itemsInPage + "</size>\n"
                + "\t\t\t\t</paging>\n"
                + "\t\t\t\t<title><![CDATA[Ricerca]]></title>\n"
        );

        // Schede ricerca
        Object ofilters = json.has("filters") ? utility.base64Decode(json.getString("filters")) : null;
        JSONArray filters = null;
        if (ofilters instanceof JSONObject) {
            filters = new JSONArray();
            filters.put(ofilters);
        } else if (ofilters instanceof JSONArray) {
            filters = (JSONArray) ofilters;
        }

        if (filters != null) {

            zkFileContent.append("\t\t\t\t<finders>\n");

            for (int ir = 0; ir < filters.length(); ir++) {
                zkFileContent.append(""
                        + "\t\t\t\t\t<finder id=\"" + panelBaseId + "_R@" + (ir + 1) + "\">\n"
                        + "\t\t\t\t\t<title><![CDATA[Ricerca base]]></title>\n"
                        + "\t\t\t\t\t<limitResult>" + maxResult + "</limitResult>\n"
                        + "\t\t\t\t\t<fields>\n");


                JSONObject filter = (JSONObject) filters.get(ir);
                JSONArray cols = filter.has("cols") ? filter.getJSONArray("cols") : null;
                if (cols != null) {
                    // Scheda ricerca
                    zkFileContent.append(""
                            + "\t\t\t\t\t<template-fields-hibernate>\n"
                            + "\t\t\t\t\t\t<entity>" + beanClass + "</entity>\n"
                            + "\t\t\t\t\t\t<propertyFields>\n");

                    // Campi ricerca
                    for (int irf = 0; irf < cols.length(); irf++) {
                        JSONObject col = cols.getJSONObject(irf);
                        String name = col.has("name") ? col.getString("name") : null;
                        JSONObject target_col = workspace.getColumnByName(name, cols);
                        String searchFieldName = "??";
                        String posX = "";
                        String posY = "";
                        String width = "200px";
                        String operator = "?=";
                        String controlType = null;
                        String controlValues = null;
                        String label = null;
                        String lookupId = null;

                        if (target_col != null) {
                            int size = target_col.getInt("size");
                            label = target_col.has("label") ? target_col.getString("label") : name;
                            if (name.startsWith("F") || name.startsWith("f")) {
                                if (size == 1) {
                                    controlType = "LISTBOX";
                                    controlValues = "S=Si,N=No";
                                }
                            }
                        }

                        zkFileContent.append("\t\t\t\t\t\t\t\t<property name=\"" + searchFieldName + "\">\n"
                                + (label != null ? "\t\t\t\t\t\t\t\t\t<etichetta>" + label + "</etichetta>" : "") + "\n"
                                + (lookupId != null ? "\t\t\t\t\t\t\t\t\t<xmlreference-id>" + lookupId + "</xmlreference-id>" : "") + "\n"
                                + (width != null ? "\t\t\t\t\t\t\t\t\t<widthControllo>" + width + "</widthControllo>" : "") + "\n"
                                + (operator != null ? "\t\t\t\t\t\t\t\t\t<comparatoreRicerca>" + operator + "</comparatoreRicerca>" : "") + "\n"
                                + (controlType != null ? "\t\t\t\t\t\t\t\t\t<tipoControllo>" + controlType + "</tipoControllo>" : "") + "\n"
                                + (controlValues != null ? "\t\t\t\t\t\t\t\t\t<elencoValori>" + controlValues + "</elencoValori>" : "") + "\n"
                                + (posX != null ? "\t\t\t\t\t\t\t\t\t<posX>" + posX + "</posX>" : "") + "\n"
                                + (posY != null ? "\t\t\t\t\t\t\t\t\t<posY>" + posY + "</posY>" : "") + "\n"
                                + "\t\t\t\t\t\t\t\t</property>" + "\n");
                    }


                    zkFileContent.append(""
                            + "\t\t\t\t\t\t</propertyFields>\n"
                            + "\t\t\t\t\t</template-fields-hibernate>\n"
                            + "\t\t\t\t</fields>\n"
                            + "\t\t\t\t</finder>\n");

                }
            }
            zkFileContent.append("\t\t\t</finders>\n\n");
        }


        // Campi nella lista
        JSONArray cols = json.has("columns") ? json.getJSONArray("columns") : null;
        if (cols != null) {

            zkFileContent.append(""
                    + "\t\t\t\t<fields>\n"
                    + "\t\t\t\t\t<template-fields-hibernate>\n"
                    + "\t\t\t\t\t\t<entity>" + beanClass + "</entity>\n"
                    + "\t\t\t\t\t\t<propertyFields>\n"
            );

            for (int ic = 0; ic < cols.length(); ic++) {
                JSONObject col = cols.getJSONObject(ic);
                String fieldInList = col.getString("name");
                String labelInList = col.has("label") ? col.getString("label") : null;
                String width = col.has("width") ? col.getString("width") : null;
                String rtWidth = col.has("rtWidth") ? col.getString("rtWidth") : null;
                Object oSize = col.has("size") ? col.get("size") : null;
                String controlTypeInList = "";
                String labelWidthInList = null;


                int isize = Integer.parseInt(oSize != null ? String.valueOf(oSize) : "0");
                int irtwidth = 0;
                int iwidth = 0;

                try {
                    irtwidth = Integer.parseInt(rtWidth);
                } catch (Exception e) {
                }
                try {
                    iwidth = Integer.parseInt(width);
                } catch (Exception e) {
                }

                if (irtwidth > 0) {
                    labelWidthInList = Math.max(irtwidth, 500) + "px";
                } else if (iwidth > 0) {
                    labelWidthInList = Math.max(iwidth, 500) + "px";
                } else if (isize > 0) {
                    if (isize > 1) {
                        labelWidthInList = Math.max((isize * 10), 500) + "px";
                    } else {
                        labelWidthInList = Math.max((labelInList.length() * 10), 500) + "px";
                    }
                } else {
                    labelWidthInList = Math.max(5 * labelInList.length(), 500) + "px";
                }


                // Fit to hibernate
                fieldInList = nameSpacer.DB2Hibernate(fieldInList);

                zkFileContent.append(""
                        + "\t\t\t\t\t\t\t<property name=\"" + fieldInList + "\">\n"
                        + "\t\t\t\t\t\t\t\t<etichetta>" + (labelInList != null ? labelInList : fieldInList) + "</etichetta>\n"
                        // + "\t\t\t\t\t\t<tipoControllo>" + controlTypeInList + "</tipoControllo>\n"
                        // + "\t\t\t\t\t\t<visibile>S</visibile>\n"
                        + "\t\t\t\t\t\t\t\t<widthEtichetta>" + labelWidthInList + "</widthEtichetta>\n"
                        + "\t\t\t\t\t\t\t</property>\n");
            }

            zkFileContent.append(""
                    + "\t\t\t\t\t\t</propertyFields>\n"
                    + "\t\t\t\t\t</template-fields-hibernate>\n"
                    + "\t\t\t\t</fields>\n");


            if (orderByField != null) {
                zkFileContent.append("\n"
                        + "\t\t\t\t<template-orderby>\n"
                        // +"\t\t<propertyOrderby>edizione.comune.provincia.desTarga(ASC)</propertyOrderby>"
                        // +"\t\t<propertyOrderby>edizione.comune.desComune(ASC)</propertyOrderby>"
                        + "\t\t\t\t\t<propertyOrderby>" + nameSpacer.DB2Hibernate(orderByField) + "(" + orderByFieldMode + ")</propertyOrderby>\n"
                        + "\t\t\t\t</template-orderby>\n");
            }

            zkFileContent.append("\t\t\t</list>\n");
        }


        // Grids
        JSONArray grids = json.has("grids") ? json.getJSONArray("grids") : null;
        if (grids != null) {
            zkFileContent.append(
                    "\n"
                    + "\t\t\t<grids>\n"
            );

            for (int ig = 0; ig < grids.length(); ig++) {
                JSONObject grid = (JSONObject) grids.get(ig);
                String gridTitle = grid.has("title") ? grid.getString("title") : "Dellaglio";
                zkFileContent.append(""
                        + "\t\t\t\t<grid id=\"" + panelBaseId + "_G@" + (ig + 1) + "\">\n"
                        + "\t\t\t\t\t<title><![CDATA[" + gridTitle + "]]></title>\n"
                        + "\t\t\t\t\t<template-fields-hibernate>\n"
                        + "\t\t\t\t\t\t<entity>" + beanClass + "</entity>\n"
                        + "\t\t\t\t\t\t<propertyFields>\n");

                if (grid != null) {
                    JSONArray gcols = grid.has("columns") ? grid.getJSONArray("columns") : null;
                    if (gcols != null) {
                        for (int ic = 0; ic < gcols.length(); ic++) {
                            // campo grid
                            JSONObject gcol = gcols.getJSONObject(ic);
                            String gridField = gcol.has("name") ? gcol.getString("name") : null;
                            String gridLabel = gcol.has("label") ? gcol.getString("label") : null;
                            JSONObject col = workspace.getColumnByName(gridField, cols);
                            String gridLabelWidth = null; // "70px";
                            String gridControlType = getZKControlType(gridField, cols, "type");
                            String gridControlWidth = getZKControlType(gridField, cols, "width");
                            String gridControlHeight = getZKControlType(gridField, cols, "height");
                            String gridControlRO = col.has("readOnly") ? (col.getBoolean("readOnly") ? "S" : null) : null;
                            String gridControlVisible = col.has("visible") ? (col.getBoolean("visible") ? null : "N") : null;
                            String gridControlValues = null;
                            String lookupReferenceCode = null;


                            Object posX = gcol.has("col") ? gcol.get("col") : null;
                            Object posY = gcol.has("row") ? gcol.get("row") : null;

                            // Fit to hibernate
                            gridField = nameSpacer.DB2Hibernate(gridField);

                            if (col != null) {
                                int size = col.getInt("size");
                                if (gridField.startsWith("F") || gridField.startsWith("f")) {
                                    if (size == 1) {
                                        gridControlType = "LISTBOX";
                                        gridControlValues = "S=Si,N=No";
                                    }
                                }
                            }


                            zkFileContent.append(""
                                    + "\t\t\t\t\t\t\t<property name=\"" + gridField + "\">\n"
                                    + (gridLabel != null ? "\t\t\t\t\t\t\t\t<etichetta>" + gridLabel + "</etichetta>\n" : "")
                                    + (gridLabelWidth != null ? "\t\t\t\t\t\t\t\t<widthEtichetta>" + gridLabelWidth + "</widthEtichetta>\n" : "")
                                    + (gridControlType != null ? "\t\t\t\t\t\t\t\t<tipoControllo>" + gridControlType + "</tipoControllo>\n" : "")
                                    + (gridControlValues != null ? "\t\t\t\t\t\t\t\t<elencoValori>" + gridControlValues + "</elencoValori>\n" : "") + ""
                                    + (posX != null ? "\t\t\t\t\t\t\t\t<posX>" + posX + "</posX>\n" : "")
                                    + (posY != null ? "\t\t\t\t\t\t\t\t<posY>" + posY + "</posY>\n" : "")
                                    + (gridControlWidth != null ? "\t\t\t\t\t\t\t\t<widthControllo>" + gridControlWidth + "</widthControllo>\n" : "") + ""
                                    + (gridControlHeight != null ? "\t\t\t\t\t\t\t\t<heightControllo>" + gridControlHeight + "</heightControllo>\n" : "") + ""
                                    + (gridControlRO != null ? "\t\t\t\t\t\t\t\t<solaLettura>" + gridControlRO + "</solaLettura>\n" : "") + ""
                                    + (gridControlVisible != null ? "\t\t\t\t\t\t\t\t<visibile>" + gridControlVisible + "</visibile>\n" : "") + ""
                            );


                            // codice in Reference.xml
                            if (col.has("lookup")) {
                                JSONObject lookupJson = col.getJSONObject("lookup");
                                String lookupControlId = lookupJson.has("controlId") ? lookupJson.getString("controlId") : null;
                                String lookupField = lookupJson.has("lookupField") ? lookupJson.getString("lookupField") : null;
                                String lookupForeignTable = lookupJson.has("foreignTable") ? lookupJson.getString("foreignTable") : null;
                                String lookupForeignColumn = lookupJson.has("foreignColumn") ? lookupJson.getString("foreignColumn") : null;
                                String lookupColumn = lookupJson.has("column") ? lookupJson.getString("column") : null;
                                String lookupBean = ZKpanels.get_default_bean_class((String)lookupForeignTable, beanClass);
                                String lookupType = "LOOKUP"; // "LISTLOOKUP";
                                String lookupCodeField = nameSpacer.DB2Hibernate(lookupForeignColumn);

                                String lookupDescField = null;
                                if(lookupField != null) {
                                    lookupDescField = lookupField;
                                } else {
                                    if (lookupControlId != null) {
                                        workspace wrkLookup = workspace.get_tbl_manager_workspace(lookupControlId);
                                        JSONObject Lookupjson = new JSONObject(wrkLookup.clientTableJson);
                                        lookupDescField = get_default_descriptor_field(Lookupjson);
                                    } else {
                                        // TODO : caricare un controllo dalla tabella ?
                                        lookupDescField = nameSpacer.DB2Hibernate(lookupColumn);
                                    }
                                }

                                String lookupSearchType = "?FULLLIKE";

                                if(!lookupCodeToFile) {
                                    lookupReferenceCode = "<!-- START Lookup code .. (to put in Reference.xml)\n";
                                } else {
                                    lookupReferenceCode = "<!-- START Lookup in "+panelId+"-->\n";
                                }

                                lookupReferenceCode += ""+
                                        "<xmlreference category='template' entityLookup=\"" + lookupBean + "\" >\n" +
                                        "    <tipoControllo>" + lookupType + "</tipoControllo>\n" +
                                        "    <proprietaCodiceLookup>" + lookupCodeField + "</proprietaCodiceLookup>\n" +
                                        "    <proprietaDescrizioneLookup>" + lookupDescField + "</proprietaDescrizioneLookup>\n" +
                                        "    <finderLookup>\n" +
                                        "        <property name=\"" + lookupCodeField + "\">\n" +
                                        "            <etichetta>Codice</etichetta>\n" +
                                        "            <comparatoreRicerca>" + lookupSearchType + "</comparatoreRicerca>\n" +
                                        "        </property>\n" +
                                        "        <property name=\"" + lookupDescField + "\">\n" +
                                        "            <etichetta>Descrizione</etichetta>\n" +
                                        "            <tipoControllo>TEXTBOX</tipoControllo>\n" +
                                        "            <comparatoreRicerca>" + lookupSearchType + "</comparatoreRicerca>\n" +
                                        "        </property>\n" +
                                        "    </finderLookup>\n" +
                                        "    <colonneLookup>" + lookupCodeField + "=Codice," + lookupDescField + "=Descrizione</colonneLookup>\n" +
                                        "    <orderbyLookup>" + lookupCodeField + "</orderbyLookup>\n" +
                                        "</xmlreference>\n";

                                if(!lookupCodeToFile) {
                                    lookupReferenceCode += " END lookup code -->\n\n";
                                } else {
                                    lookupReferenceCode += "<!-- END Lookup in "+panelId+"-->\n";
                                }
                            }


                            // evento onChange del campo
                            boolean bCallbackOnChange = false;
                            if (bCallbackOnChange) {
                                zkFileContent.append(""
                                        + "\t\t\t\t\t\t<events>" + "\n"
                                        + "\t\t\t\t\t\t\t<event>" + "\n"
                                        + "\t\t\t\t\t\t\t\t<name>onVariazione</name>" + "\n"
                                        + "\t\t\t\t\t\t\t\t<parameter id=\"function\">" + "\n"
                                        + "\t\t\t\t\t\t\t\t<value><![CDATA[ritorno = com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onVariazione" + panelId + "((com." + customerName + ".zk.controller.datamanager.PanelBeanManager)windowContext.getOpener().getValoreEspressione(\"${panel}." + panelId + "\"));]]></value>" + "\n"
                                        + "\t\t\t\t\t\t\t\t</parameter>" + "\n"
                                        + "\t\t\t\t\t\t\t</event>" + "\n"
                                        + "\t\t\t\t\t\t</events>" + "\n");
                            }
                            zkFileContent.append("\t\t\t\t\t\t\t</property>" + "\n");


                            if(lookupReferenceCode != null) {
                                if(!lookupCodeToFile) {
                                    zkFileContent.append("\n"
                                            + lookupReferenceCode
                                            + "\n\n");
                                } else {
                                    allLookupReferenceCode.append( lookupReferenceCode + "\n\n");
                                }
                            }
                        }

                        zkFileContent.append(""
                                + "\t\t\t\t\t\t</propertyFields>\n"
                                + "\t\t\t\t\t</template-fields-hibernate>\n"
                                + "\t\t\t\t</grid>\n");
                    }
                }
            }
            zkFileContent.append(
                    "\n"
                    + "\t\t\t</grids>\n"
            );
        }

        // Eventi del controllo
        zkFileContent.append("\n"
                + "\t\t\t<template-events>\n"
                + "\t\t\t\t<event name=\"onNuovo\">\n"
                + "\t\t\t\t\t<id>onNuovo</id>\n"
                + "\t\t\t\t\t<stepClass>com." + customerName + ".zk.controller.datamanager.events.BeanShellStepEvent</stepClass>\n"
                + "\t\t\t\t\t<parameterFunction><![CDATA[ritorno = com." + customerName + "." + appName + ".controller.FunzioniEventi." + "defaultDatiPerNuovo" + beanName + "((com." + customerName + ".zk.controller.datamanager.PanelBeanManager)windowContext.getOpener().getValoreEspressione(\"${panel}." + panelId + "\"));]]></parameterFunction>\n"
                + "\t\t\t\t</event>\n"
                + "\t\t\t\t<event name=\"onSalvaNuovo\">\n"
                + "\t\t\t\t\t<id>onSalvaNuovo</id>\n"
                + "\t\t\t\t\t<stepClass>com." + customerName + ".zk.controller.datamanager.events.BeanShellStepEvent</stepClass>\n"
                + "\t\t\t\t\t<parameterFunction><![CDATA[ritorno = com." + customerName + "." + appName + ".controller.FunzioniEventi." + "checkStatoPerSalva" + beanName + "((com." + customerName + ".zk.controller.datamanager.PanelBeanManager)windowContext.getOpener().getValoreEspressione(\"${panel}." + panelId + "\"));]]></parameterFunction>\n"
                + "\t\t\t\t</event>\n"
                + "\t\t\t\t<event name=\"onSalva\">\n"
                + "\t\t\t\t\t<id>onSalva</id>\n"
                + "\t\t\t\t\t<stepClass>com." + customerName + ".zk.controller.datamanager.events.BeanShellStepEvent</stepClass>\n"
                + "\t\t\t\t\t<parameterFunction><![CDATA[ritorno = com." + customerName + "." + appName + ".controller.FunzioniEventi." + "checkStatoPerSalva" + beanName + "((com." + customerName + ".zk.controller.datamanager.PanelBeanManager)windowContext.getOpener().getValoreEspressione(\"${panel}." + panelId + "\"));]]></parameterFunction>\n"
                + "\t\t\t\t</event>\n"
                + "\t\t\t\t<event name=\"onAbilitaPulsanti\">\n"
                + "\t\t\t\t\t<id>onAbilitaPulsanti</id>\n"
                + "\t\t\t\t\t<stepClass>com." + customerName + ".zk.controller.datamanager.events.BeanShellStepEvent</stepClass>\n"
                + "\t\t\t\t\t<parameterFunction><![CDATA[ritorno = com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onAbilitaPulsanti" + beanName + "((com." + customerName + ".zk.controller.datamanager.PanelBeanManager)windowContext.getOpener().getValoreEspressione(\"${panel}." + panelId + "\"));]]></parameterFunction>\n"
                + "\t\t\t\t</event>\n"
                + "\t\t\t\t<event name=\"onLoad\">\n"
                + "\t\t\t\t\t<id>onLoad</id>\n"
                + "\t\t\t\t\t<stepClass>com." + customerName + ".zk.controller.datamanager.events.BeanShellStepEvent</stepClass>\n"
                + "\t\t\t\t\t<parameterFunction><![CDATA[ritorno = com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onLoad" + beanName + "((com." + customerName + ".zk.controller.datamanager.PanelBeanManager)windowContext.getOpener().getValoreEspressione(\"${panel}." + panelId + "\"));]]></parameterFunction>\n"
                + "\t\t\t\t</event>\n"
                + "\t\t\t\t<event name=\"onPostLoad\">\n"
                + "\t\t\t\t\t<id>onPostLoad</id>\n"
                + "\t\t\t\t\t<stepClass>com." + customerName + ".zk.controller.datamanager.events.BeanShellStepEvent</stepClass>\n"
                + "\t\t\t\t\t<parameterFunction><![CDATA[ritorno = com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onPostLoad" + beanName + "((com." + customerName + ".zk.controller.datamanager.PanelBeanManager)windowContext.getOpener().getValoreEspressione(\"${panel}." + panelId + "\"));]]></parameterFunction>\n"
                + "\t\t\t\t</event>\n"
                + "\t\t\t\t<event name=\"onPreSalvaNuovo\">\n"
                + "\t\t\t\t\t<id>onPreSalvaNuovo</id>\n"
                + "\t\t\t\t\t<stepClass>com." + customerName + ".zk.controller.datamanager.events.BeanShellStepEvent</stepClass>\n"
                + "\t\t\t\t\t<parameterFunction><![CDATA[ritorno = com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onBeforeSalva" + beanName + "((com." + customerName + ".zk.controller.datamanager.PanelBeanManager)windowContext.getOpener().getValoreEspressione(\"${panel}." + panelId + "\"));]]></parameterFunction>\n"
                + "\t\t\t\t</event>\n"
                + "\t\t\t\t<event name=\"onAfterSalvaNuovo\">\n"
                + "\t\t\t\t\t<id>onAfterSalvaNuovo</id>\n"
                + "\t\t\t\t\t<stepClass>com." + customerName + ".zk.controller.datamanager.events.BeanShellStepEvent</stepClass>\n"
                + "\t\t\t\t\t<parameterFunction><![CDATA[ritorno = com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onPostSalva" + beanName + "((com." + customerName + ".zk.controller.datamanager.PanelBeanManager)windowContext.getOpener().getValoreEspressione(\"${panel}." + panelId + "\"));]]></parameterFunction>\n"
                + "\t\t\t\t</event>\n"
                + "\t\t\t</template-events>\n"
        );


        String[] fncList = {
                "com." + customerName + "." + appName + ".controller.FunzioniEventi." + "defaultDatiPerNuovo" + beanName + ""
                , "com." + customerName + "." + appName + ".controller.FunzioniEventi." + "checkStatoPerSalva" + beanName + ""
                , "com." + customerName + "." + appName + ".controller.FunzioniEventi." + "checkStatoPerSalva" + beanName + ""
                , "com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onAbilitaPulsanti" + beanName + ""
                , "com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onLoad" + beanName + ""
                , "com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onPostLoad" + beanName + ""
                , "com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onBeforeSalva" + beanName + ""
                , "com." + customerName + "." + appName + ".controller.FunzioniEventi." + "onPostSalva" + beanName + ""
        };

        zkFileContent.append("\n");


        //
        // Funzioni gestone eventi
        //
        StringBuffer zkFunctionsFileContent = new StringBuffer("");

        if(projectFolder == null || projectFolder.isEmpty()) {
            zkFunctionsFileContent.append( "<!-- START of callback functions :");
        } else {
            zkFunctionsFileContent.append( "// START of callback functions panel "+panelId);
        }

        for (int ifn = 0; ifn < fncList.length; ifn++) {
            String fncClass = fncList[ifn];
            String[] fncParts = fncClass.split("\\.");
            String fnc = fncParts[fncParts.length - 1];

            if (ifn == 0) {
                String primaryKey = json.getString("primaryKey");
                String hibFieldName = nameSpacer.DB2Hibernate(primaryKey);
                String getSethibFieldName = hibFieldName.substring(0, 1).toUpperCase() + hibFieldName.substring(1);

                String fncCode =
                        "public static ArrayList " + fnc + "(PanelBeanManager panelContext) throws Exception{\n"
                                + "\tArrayList errori = new ArrayList();\n"
                                + "\t" + beanName + " bean=(" + beanName + ")panelContext.getBean();\n"
                                + "\tif(bean!=null){\n"
                                + "\t\t\ttry{\n"
                                + "\t\t\tBigDecimal pk = Keypools.getFromKeypoolsManager(\"" + tableName + "\");\n"
                                + "\t\t\tbean.set" + getSethibFieldName + "(pk.toString());\n"
                                + "\t\t\t}catch (Exception e) {\n"
                                + "\t\t\t\terrori.add(\"Impossibile procedere con l'operazione: \"+e.getMessage());\n"
                                + "\t\t\t}\n"
                                + "\t\t}\n"
                                + "\treturn errori;\n"
                                + "}\n";

                zkFunctionsFileContent.append("\n");
                zkFunctionsFileContent.append("// Gestione inserimento riga tabella " + tableName.toUpperCase() + "\n");
                zkFunctionsFileContent.append("/**\n"
                        + "*\n"
                        + "* @param panelContext\n"
                        + "* @return\n"
                        + "* @throws Exception\n"
                        + "*/\n");

                zkFunctionsFileContent.append(fncCode);

            } else if (ifn == 1) {
                // TODO : verifica valori not null
                String beanVarName = utility.toCamelCase(beanName);
                String labelName = null;
                String fncCode = "public static ArrayList " + fnc + "(PanelBeanManager panelContext) throws Exception{\n"
                        + "\tObject bean = panelContext.getBean();\n"
                        + "\tArrayList errori = new ArrayList();\n"
                        + "\tif (bean instanceof " + beanName + ") {\n"
                        + "\t\t" + beanName + " " + beanVarName + " = (" + beanName + ")bean;\n";


                // Campi da controllare
                for (int irf = 0; irf < cols.length(); irf++) {
                    JSONObject col = cols.getJSONObject(irf);
                    String name = col.has("name") ? col.getString("name") : null;
                    JSONObject target_col = workspace.getColumnByName(name, cols);

                    if (target_col != null) {
                        boolean isRequired = false;
                        if (target_col.has("required")) {
                            if (target_col.getBoolean("required")) {
                                isRequired = true;
                            }
                        }
                        if (target_col.has("requiredByDB")) {
                            if (target_col.getBoolean("requiredByDB")) {
                                isRequired = true;
                            }
                        }

                        if (isRequired) {
                            String label = target_col.has("label") ? target_col.getString("label") : name;
                            String getMethod = nameSpacer.getGetter(nameSpacer.DB2Hibernate(name));
                            if (target_col.has("lookup")) {
                                String lookupFieldName = name;
                                if (target_col.has("hibPropName")) {
                                    lookupFieldName = target_col.getString("hibPropName");
                                    getMethod = nameSpacer.getGetter(nameSpacer.DB2Hibernate(lookupFieldName));
                                }
                                fncCode += ""
                                        + "\t\tif (" + beanVarName + "." + getMethod + "() == null) {\n"
                                        + "errori.add(\"Attenzione: necessario definire il campo \\\"" + label + "\\\"\");\n"
                                        + "}";
                            } else {
                                fncCode += ""
                                        + "\t\tif (GeiUtil.isNullorBlank(" + beanVarName + "." + getMethod + "())) {\n"
                                        + "\t\t\terrori.add(\"Attenzione: necessario definire il campo \\\"" + label + "\\\"\");\n"
                                        + "\t\t}\n";
                            }
                        }
                    }
                }


                fncCode += ""
                        + "\t}\n"
                        + "\treturn errori;\n"
                        + "\t}\n";

                zkFunctionsFileContent.append("// Gestione Salvataggio riga tabella " + tableName.toUpperCase() + "\n");
                zkFunctionsFileContent.append(fncCode);

            } else if (ifn == 2) {

            } else if (ifn == 3) {
                String fncCode = "public static ArrayList " + fnc + "(PanelBeanManager panelContext) throws Exception{\n"
                        + "\tArrayList errori = new ArrayList();\n"
                        + "\treturn errori;\n"
                        + "}\n";
                zkFunctionsFileContent.append("// Gestione Abilitazione pulsanti " + tableName.toUpperCase() + "\n");
                zkFunctionsFileContent.append(fncCode);

            } else if (ifn == 4) {
                String fncCode = "public static ArrayList " + fnc + "(PanelBeanManager panelContext) throws Exception{\n"
                        + "\tArrayList errori = new ArrayList();\n"
                        + "\treturn errori;\n"
                        + "}\n";
                zkFunctionsFileContent.append("// Gestione caricamento (onLoad)" + tableName.toUpperCase() + "\n");
                zkFunctionsFileContent.append(fncCode);

            } else if (ifn == 5) {
                String fncCode = "public static ArrayList " + fnc + "(PanelBeanManager panelContext) throws Exception{\n"
                        + "\tArrayList errori = new ArrayList();\n"
                        + "\treturn errori;\n"
                        + "}\n";
                zkFunctionsFileContent.append("// Gestione post caricamento (onPostLoad) " + tableName.toUpperCase() + "\n");
                zkFunctionsFileContent.append(fncCode);

            } else if (ifn == 6) {
                String fncCode = "public static ArrayList " + fnc + "(PanelBeanManager panelContext) throws Exception{\n"
                        + "\tArrayList errori = new ArrayList();\n"
                        + "\treturn errori;\n"
                        + "}\n";
                zkFunctionsFileContent.append("// Gestione post caricamento (onBeforeSalva) " + tableName.toUpperCase() + "\n");
                zkFunctionsFileContent.append(fncCode);

            } else if (ifn == 7) {
                String fncCode = "public static ArrayList " + fnc + "(PanelBeanManager panelContext) throws Exception{\n"
                        + "\tArrayList errori = new ArrayList();\n"
                        + "\treturn errori;\n"
                        + "}\n";
                zkFunctionsFileContent.append("// Gestione post caricamento (onPostSalva) " + tableName.toUpperCase() + "\n");
                zkFunctionsFileContent.append(fncCode);
            }
        }

        if(!eventsFunctionCodeToFile) {
            zkFunctionsFileContent.append("\n");
            zkFunctionsFileContent.append("\n");
            zkFunctionsFileContent.append("END of callback functions -->");
        } else {
            zkFunctionsFileContent.append("\n");
            zkFunctionsFileContent.append("\n");
            zkFunctionsFileContent.append("// END of callback functions panel "+panelId);
        }




        // File delle funzioni eventi
        if(!eventsFunctionCodeToFile) {
            zkFileContent.append( zkFunctionsFileContent );
        } else {
            if(zkFunctionsFileContent != null && zkFunctionsFileContent.length()>0) {
                utility.append_to_file_content(utility.append_to_folder(projectFolder, eventsFunctionsFile), zkFunctionsFileContent, true, "}");
            }
        }


        // File delle lookup
        if(!lookupCodeToFile) {
            // già fatto supra
        } else {
            if(allLookupReferenceCode != null && allLookupReferenceCode.length()>0) {
                utility.append_to_file_content(utility.append_to_folder(projectFolder, lookupDefinitionFile), allLookupReferenceCode, true, "</resource>");
            }
        }


        // Pulsanti del Menu
        zkFileContent.append("\n"
                + "\t\t\t<template-menus>\n"
                + "\t\t\t\t<menu name=\"INDIETRO\"/>\n"
                + "\t\t\t\t<menu name=\"AVANTI\"/>\n"

                + (can_insert ?
                "\t\t\t\t<menu name=\"NUOVO\">\n"
                        + (use_asset ? "\t\t<assets>pulsanti_" + panelBaseId.toLowerCase() + "</assets>\n" : "")
                        + "\t\t\t\t</menu>\n"
                : "")
                + (can_update ?
                "\t\t\t\t<menu name=\"MODIFICA\">\n"
                        + (use_asset ? "\t\t<assets>pulsanti_" + panelBaseId.toLowerCase() + "</assets>\n" : "")
                        + "\t\t\t\t</menu>\n"
                : "")
                + (can_delete ?
                "\t\t\t\t<menu name=\"ELIMINA\">\n"
                        + (use_asset ? "\t\t<assets>pulsanti_" + panelBaseId.toLowerCase() + "</assets>\n" : "")
                        + "\t\t\t\t</menu>\n"
                : "")

                + (can_insert || can_update ?
                "\t\t\t\t<menu name=\"SALVA\"/>\n"
                        + "\t\t\t\t<menu name=\"ANNULLA\"/>\n"
                : "")

                + (can_insert ?
                "\n\n"
                        + "\t\t\t\t<!-- SQL inserimento KEYPOOLS -->\n"
                        + "\t\t\t\t<!-- INSERT INTO " + (schemaName != null && !schemaName.isEmpty() ? (schemaName + ".") : "") + "KEYPOOLS (TABLENAME,PROGR,UTENTE_INS,DATA_INS) VALUES ('" + tableName + "'," + "1000" + "," + "'azienda'" + "," + "CURRENT_TIMESTAMP" + ") -->\n"
                : "")
        );


        // Pulsante apertura popup
        if (popupCommand) {
            zkFileContent.append("\n\n"
                    + "\t\t\t<menu name=\"" + "PopupCommand" + "\">\n"
                    + "\t\t\t\t<tipo>ITEM_ONLY_SELECT</tipo>\n"
                    + "\t\t\t\t<label>" + "Richiedi validazione" + "</label>\n"
                    + "\t\t\t\t<icon>" + "img/true.gif" + "</icon>\n"
                    + "\t\t\t\t<assets>" + "pulsante_invia_percorso" + "</assets>\n"
                    + "\t\t\t\t<actionClass>com." + customerName + ".zk.controller.datamanager.actions.ApriWindowAction</actionClass>\n"
                    + "\t\t\t\t<parameters>class=" + "com." + customerName + "." + appName + ".controller.InviaPercorso" + ";\n"
                    + "\t\t\t\t\tpopup=S;\n"
                    + "\t\t\t\t</parameters>\n"
                    + "\t\t\t</menu>\n"
                    + "\n"
                    + "\t\t</template-menus>\n\n");

        }

        zkFileContent.append("\n"
                + "\t\t\t</template-menus>\n");

        zkFileContent.append("\n"
                + "\t\t</panel>\n\n");

        if (process_foreign_tables) {
            // Foreign tables
            // +"\t\t\t<!-- bando destinatari -->"
            // +"\t\t\t<panel id=\"PercorsiDestinatari_P@1254136534031\">"
            // ...
            try {
                JSONArray foreignTables = json.getJSONArray("foreignTables");
                for (int ift = 0; ift < foreignTables.length(); ift++) {
                    JSONObject foreignTableJson = foreignTables.getJSONObject(ift);
                    if (foreignTableJson != null) {
                        String foreignTable = foreignTableJson.has("foreignTable") ? foreignTableJson.getString("foreignTable") : null;
                        String foreignColumn = foreignTableJson.has("foreignColumn") ? foreignTableJson.getString("foreignColumn") : null;
                        String column = foreignTableJson.has("column") ? foreignTableJson.getString("column") : null;
                        String name = foreignTableJson.has("name") ? foreignTableJson.getString("name") : null;
                        String controlId = foreignTableJson.has("controlId") ? foreignTableJson.getString("controlId") : null;

                        // get control ..
                        // get columns...
                        // get finders...
                        // get grid...

                        if(controlId != null && !controlId.isEmpty()) {

                            workspace wrkFT = workspace.get_tbl_manager_workspace(controlId);

                            if(wrkFT != null) {
                                zkFileContent.append("\n");
                                JSONObject FTjson = new JSONObject(wrkFT.clientTableJson);

                                // Adattamento parametri ZK
                                JSONObject zkParamsFT = new JSONObject(zkParams.toString());

                                String FTbeanClass = get_default_bean_class(FTjson, zkParams.getString("beanClass"));
                                String FTClass = ZKpanels.get_class_name_from_full_class_path(FTbeanClass);
                                String FTpanelId = FTClass;

                                zkParamsFT.put("fieldInTitleBar", get_default_descriptor_field(FTjson));
                                zkParamsFT.put("orderByField", get_primary_key_field(FTjson));
                                zkParamsFT.put("panelId", FTpanelId);
                                zkParamsFT.put("orderByFieldMode", "");
                                zkParamsFT.put("popupCommand", false);
                                zkParamsFT.put("process_foreign_tables", true);
                                zkParamsFT.put("beanClass", FTbeanClass);
                                zkParamsFT.put("panelTitle", get_default_panel_title(FTjson));
                                zkParamsFT.put("can_delete", true);
                                zkParamsFT.put("can_insert", true);
                                zkParamsFT.put("can_update", true);
                                zkParamsFT.put("autoSelect", true);
                                zkParamsFT.put("autoFind", true);
                                zkParamsFT.put("showList", true);

                                /*
                                    "fieldInTitleBar" -> ""
                                    "orderByField" -> ""
                                    "panelId" -> "Bando"
                                    "appName" -> "gor"
                                    "customerName" -> "geisoft"
                                    "orderByFieldMode" -> "ASC"
                                    "showList" -> {Boolean@15920} true
                                    "autoSelect" -> {Boolean@15920} true
                                    "maxResult" -> {Integer@15923} 5000
                                    "autoFind" -> {Boolean@15920} true
                                    "itemsInPage" -> {Integer@15926} 20
                                    "popupCommand" -> {Boolean@15928} false
                                    "process_foreign_tables" -> {Boolean@15920} true
                                    "use_asset" -> {Boolean@15928} false
                                    "beanClass" -> "com.geisoft.gor.hibernate.bean.Bando"
                                    "panelTitle" -> " bando"
                                    "can_delete" -> {Boolean@15920} true
                                    "can_insert" -> {Boolean@15920} true
                                    "can_update" -> {Boolean@15920} true
                                    "profileData" -> "/com/geisoft/gor/controller/datiPiedinoProfilo-1.incxml"
                                    "process_hibernate" -> "/com/geisoft/gor/controller/datiPiedinoProfilo-1.incxml"
                                    "projectFolder" -> ""
                                */

                                zkFileContent.append( process_control(request, FTjson, zkParamsFT, foreignTableJson, zkParams.getString("panelId")+"_P@1", projectFolder) );
                                zkFileContent.append("\n");
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println(e.getMessage());
            }
        }

        if(parentPanelId == null) {
            zkFileContent.append(
                    "\n"
                    + "\t</panels>\n\n"
                    + "</page>\n\n"
            );
        }

        return zkFileContent;
    }




    /// Utility per pannelli nidificati

    /**
     * Titolo predefinito pannello
     * @param json
     * @return
     */
    private static String get_default_panel_title(JSONObject json) {
        String panelTitle = json.getString("table");
        if (panelTitle != null || !panelTitle.isEmpty()) {
            return utility.toDescriptionCase(panelTitle);
        }
        return null;
    }

    /**
     * Classe predefinita pannello
     * @param json
     * @param beanClass
     * @return
     */
    public static String get_default_bean_class(JSONObject json, String beanClass) {
        if(beanClass != null) {
            String table = json.getString("table");
            return get_default_bean_class(table, beanClass);
        }
        return  null;
    }

    /**
     * Classe predefinita pannello
     * @param table
     * @param beanClass
     * @return
     */
    public static String get_default_bean_class(String table, String beanClass) {
        if(beanClass != null) {
            String[] classParts = beanClass.split("\\.");
            if(classParts != null) {
                classParts[classParts.length-1] = utility.capitalizeOlnyFirstLetter(nameSpacer.DB2Hibernate(table));
                return utility.arrayToString(classParts, null, null, ".");
            }
        }
        return  null;
    }

    /**
     * Ritorna la chiave primaria (campo "name)
     * @param json
     * @return
     */
    public static String get_primary_key_field(JSONObject json) {
        return (String)get_primary_key_info(json)[0];
    }

    /**
     * Ritorna la chiave primaria
     * @param json
     * @return Object [] { campo "name", indice 1 based (int) }
     */
    public static Object [] get_primary_key_info(JSONObject json) {
        if(json.has("primaryKey")) {
            String primakyKey = json.getString("primaryKey");
            JSONArray cols = json.getJSONArray("columns");
            for (int ic = 0; ic < cols.length(); ic++) {
                if(cols.getJSONObject(ic).getString("name").equalsIgnoreCase(primakyKey)) {
                    return new Object [] { cols.getJSONObject(ic).getString("name"), ic+1 };
                }
            }
        }
        return new Object [] { null, 0 };
    }


    /**
     * Ritorna il descrittore; il campo che segue la primary key
     * @param json
     * @return
     */
    public static String get_default_descriptor_field (JSONObject json) {
        Object [] pk_info = get_primary_key_info(json);
        if((int)pk_info[1] > 0) {
            int ic = (int)pk_info[1]-1+1;
            JSONArray cols = json.getJSONArray("columns");
            String name = cols.getJSONObject(ic).getString("name");
            if(name.toLowerCase().startsWith("cod") || name.toLowerCase().startsWith("cd")) {
                if(ic+1 < cols.length()) {
                    String name2 = cols.getJSONObject(ic + 1).getString("name");
                    if(name.toLowerCase().startsWith("des") || name.toLowerCase().startsWith("ds")) {
                        name = name2;
                    }
                }
            }
            return nameSpacer.DB2Hibernate(name);
        }
        return null;
    }







    /**
     * TEXTBOX/RICHTEXT/DATEBOX/VALUEBOX/LISTBOX/INTEGERBOX";
     *
     * @param gridField
     * @param cols
     * @return
     */
    public static String getZKControlType( String gridField, JSONArray cols, String mode) throws JSONException {
        String gridControlType = "", width = null, height = null;
        for (int ic = 0; ic < cols.length(); ic++) {
            JSONObject col = cols.getJSONObject(ic);
            String colName = null, typeName = null;
            col = workspace.getColumnByName( gridField, cols);
            if(col != null) {
                if (col.has("type")) {
                    Object oWidth = col.has("width") ? col.get("width") : null;
                    Object oType = col.get("type");
                    boolean isLookup = col.has("lookup");
                    Class type = metadata.getJavaClass(oType);

                    if(oWidth != null) {
                        try {
                            width = String.valueOf(Integer.parseInt(String.valueOf(oWidth)));
                        } catch (Exception e) {
                        }
                    }
                    if(isLookup) {
                        gridControlType = "LISTLOOKUP";
                    } else if(type.getName().equalsIgnoreCase("java.util.Date")) {
                        gridControlType = "DATEBOX";
                    } else if(type.getName().equalsIgnoreCase("java.sql.Timestamp")) {
                        gridControlType = "DATEBOX";
                    } else if(type.getName().equalsIgnoreCase("java.sql.BigDecimal")) {
                        gridControlType = "INTEGERBOX"; // VALUEBOX
                    } else if(type.getName().equalsIgnoreCase("java.lang.String")) {
                        gridControlType = "TEXTBOX";
                        if(col.getInt("size") >= 2000) {
                            gridControlType = "RICHTEXT";
                            // oWidth
                            width = "400px";
                            height = "400px";
                        }
                    } else {
                        //
                        gridControlType = "TEXTBOX";
                    }
                }
            }
        }
        if("type".equalsIgnoreCase(mode)) {
            return gridControlType;
        } else if("width".equalsIgnoreCase(mode)) {
            return width;
        } else if("height".equalsIgnoreCase(mode)) {
            return height;
        } else {
            return null;
        }
    }


    /**
     * Returl last component of full class path
     * @param className
     * @return
     */
    public static String get_class_name_from_full_class_path(String className) {
        if(className != null) {
            String[] classParts = className.split("\\.");
            if (classParts != null) {
                return classParts[classParts.length - 1];
            }
        }
        return null;
    }
}
