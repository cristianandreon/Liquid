/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

package com.liquid;

import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

public class HibernateRevEng {


    /**
     * Build hibernate reverse engineering from a Liquid control
     *
     * @param json                          JSONObject od the Liquid control
     * @param referenceClass                bean reference class (es com.company.app.my_hibernate_file)
     * @param projectFolder                 Project folder (where output the created files)
     * @return
     */
    static public String reverse_eng(HttpServletRequest request, JSONObject json, String referenceClass, String projectFolder, JSONObject jsonParams) throws Throwable {
        try {
            if (json != null) {
                String hibFileName = null;
                String classFileName = null;
                String fullFileName = null;
                String hibFileContent = null;
                String classFileContent = null;


                // Creazione codice controllo Hibernate
                Object[] hibFileContents = process_reverse_eng(json, referenceClass, jsonParams);

                //
                // salvataggio file nella cartella del progetto (file .hbm.xml)
                //
                if((boolean)hibFileContents[0]) {
                    hibFileName = (String) hibFileContents[1];
                    hibFileContent = (String) hibFileContents[2];
                    hibFileName = hibFileName != null ? hibFileName.replaceAll("[^a-zA-Z0-9\\.\\-]", "_") : null;

                    workspace.check_result(workspace.save_file_in_project_folder(request, hibFileName, hibFileContent, projectFolder), "Hib xml file");


                    //
                    // salvataggio file nella cartella del progetto (file .java)
                    //
                    classFileName = (String) hibFileContents[3];
                    classFileContent = (String) hibFileContents[4];
                    classFileName = classFileName != null ? classFileName.replaceAll("[^a-zA-Z0-9\\.\\-]", "_") : null;

                    workspace.check_result(workspace.save_file_in_project_folder(request, classFileName, classFileContent, projectFolder), "Hib class file");
                } else {
                    return "{\"result\":-1,\"error\":\"" + utility.base64Encode("error:"+hibFileContents[5]) + "\"}";
                }


                // TODO: in hibernate.cfg :
                // <mapping resource="com/geisoft/gor/hibernate/bean/BandoTipologieOpal.hbm.xml"/>
            }

        } catch (Exception ex) {
            Logger.getLogger(HibernateRevEng.class.getName()).log(Level.SEVERE, null, ex);
            return "{\"result\":-1,\"error\":\"" + utility.base64Encode("Unexpected error:"+ex.getMessage()) + "\"}";
        }
        return "{\"result\":0}";
    }






    static Object [] process_reverse_eng(JSONObject json, String classReferenceName, JSONObject jsonParams) throws Throwable {
        String hibFileName = null, hibFileContent = "";
        String classFileName = null, classFileContent = "", classMethodsFileContent = "";
        String error = null;
        boolean result = false;
        Object[] connResult = null;
        Connection conn = null;

        try {

            // Tabella schema
            String database = json.getString("schema");
            String schema = json.getString("schema");
            String tableName = json.getString("table");
            String primaryKey = json.getString("primaryKey");

            String appName = jsonParams.has("appName") ? jsonParams.getString("appName") : "[app]";
            String customerName = jsonParams.has("customerName") ? jsonParams.getString("customerName") : "[company]";

            // Fit to hibernate
            String baseBeanName = utility.capitalizeOlnyFirstLetter(nameSpacer.DB2Hibernate(tableName));

            hibFileName = baseBeanName + ".hbm.xml";
            classFileName = baseBeanName + ".java";


            String fullClassName = ZKpanels.get_default_bean_class(json, classReferenceName);
            String className = ZKpanels.get_class_name_from_full_class_path(fullClassName);


            //
            // Lettura di tutte le FOREIGN TABLE (LOOKUP) (Non REFERENCES) nella tabella (indipendentemente da quanto selezionato nel controllo Liquid)
            //
            connResult = connection.getDBConnection(database);
            conn = (Connection) connResult[0];
            String connError = (String) connResult[1];
            if(conn != null) {
                ArrayList<metadata.ForeignKey> foreignKeysObjectsOnTable = metadata.getForeignKeyData(database, schema, tableName, conn);
                JSONArray newForeignTables = workspace.foreign_keys_to_json(foreignKeysObjectsOnTable);
                if (newForeignTables != null) {
                    json.put("runtimeForeignTables", newForeignTables);
                }
            } else {
                throw new Exception("Connection error:"+connError);
            }



            hibFileContent =
                    "<?xml version='1.0' encoding='utf-8'?>\n" +
                            "<!-- Generated by Liquid ver."+workspace.version_string+" - Copyright (c) Cristian Andreon - cristianandreon.eu - liquid-framework.org - 2022. -->\n" +
                            "<!DOCTYPE hibernate-mapping PUBLIC\n" +
                            "    \"-//Hibernate/Hibernate Mapping DTD 3.0//EN\"\n" +
                            "    \"http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd\">\n" +
                            "<hibernate-mapping>\n" +
                            "    <class name=\""+fullClassName+"\" table=\""+tableName+"\" >\n"
            ;

            classFileContent = "" +
                    "/* Generated by Liquid ver."+workspace.version_string+" - Copyright (c) Cristian Andreon - cristianandreon.eu - liquid-framework.org - 2022. */\n" +
                    "package com."+customerName+"."+appName+".hibernate.bean;\n" +
                    "\n" +
                    "import java.io.Serializable;\n" +
                    "import java.math.BigDecimal;\n" +
                    "import java.util.Date;\n" +
                    "import java.sql.Timestamp;\n" +
                    "\n" +
                    "\n" +
                    "public class "+className+" implements Serializable {\n";


            // Campi nella lista
            JSONArray cols = json.has("columns") ? json.getJSONArray("columns") : null;
            if (cols != null) {
                for (int ic = 0; ic < cols.length(); ic++) {
                    JSONObject col = cols.getJSONObject(ic);
                    String colName = col.getString("name");
                    Object oSize = col.has("size") ? col.get("size") : null;
                    String hibPropName = nameSpacer.DB2Hibernate(colName);
                    String hibFieldContent = "";
                    String classFieldContent = "";
                    String classMethodsFieldContent = "";
                    String fieldFullClassName = null;
                    String fieldClassName = null;
                    String fieldPropName = null;

                    Object[] FTInfo = get_foreign_table_info(json, colName);

                    if ((boolean) FTInfo[0]) {
                        // many to one

                        // classe per la tabella collegata
                        fieldFullClassName = ZKpanels.get_default_bean_class((String)FTInfo[1], classReferenceName); // "com.geisoft.gor.hibernate.bean.Autorizzazioni";
                        fieldClassName = ZKpanels.get_class_name_from_full_class_path(fieldFullClassName);
                        hibPropName = utility.uncapitalizeOlnyFirstLetter(fieldClassName);

                        hibFieldContent =
                                "\t\t<many-to-one name=\""+hibPropName+"\" class=\""+fieldFullClassName+"\" fetch=\"select\" lazy=\"false\">\n" +
                                "\t\t\t<column name=\""+colName+"\" length=\""+oSize+"\" />\n" +
                                "\t\t</many-to-one>\n";

                    } else if(primaryKey.equalsIgnoreCase(colName)) {
                        // id
                        hibFieldContent ="\t\t<id name=\""+hibPropName+"\">\n";
                        hibFieldContent += get_hib_column(col) + "\n";
                        hibFieldContent += "\t\t</id>\n";

                    } else {
                        // property
                        hibFieldContent ="\t\t<property name=\""+hibPropName+"\">\n";
                        hibFieldContent += get_hib_column(col) + "\n";
                        hibFieldContent +="\t\t</property>\n";
                    }

                    // file hbm
                    hibFileContent += hibFieldContent;

                    // campi nella classe
                    classFileContent += get_class_field_column(col, fieldClassName, hibPropName) + "\n";

                    // setter e getter
                    classMethodsFileContent += "\n" + get_method_column(col, fieldClassName, hibPropName) + "\n";
                }


                // Chiusura tags
                hibFileContent +=
                        "\t</class>\n" +
                        "</hibernate-mapping>";


                // Aggiunta dei metodi
                classFileContent +=
                                "\n" +
                                classMethodsFileContent+
                                "\n" +
                                "}";

                result = true;
            }

        } catch (Exception e) {
            System.err.println(e.getMessage());
            result = false;
            error = e.getMessage();
            conn.rollback();

        } finally {
            if(conn != null) {
                conn.close();
            }
        }

        return new Object [] { result, hibFileName, hibFileContent, classFileName, classFileContent, error };
    }


    /**
     * Ritorna la colonna hibernate in base tipo di campo ...
     * @param col
     * @return
     */
    static private String get_hib_column ( JSONObject col ) throws Exception {
        String typeName = col.getString("typeName");
        Object oSize = col.has("size") ? col.get("size") : null;
        if(typeName.equalsIgnoreCase("VARCHAR") || typeName.equalsIgnoreCase("VARCHAR2")) {
            return "\t\t\t<column name=\"" + col.getString("name") + "\" sql-type=\"varchar2(" + oSize + ")\" length=\"" + oSize + "\"/>";
        } else if(typeName.equalsIgnoreCase("DATE")) {
            return "\t\t\t<column name=\"" + col.getString("name") + "\" sql-type=\"date\"/>";
        } else if(typeName.equalsIgnoreCase("TIMESTAMP")) {
            return "\t\t\t<column name=\"" + col.getString("name") + "\" sql-type=\"timestamp("+7+")\" precision=\""+7+"\" />";
        } else if(typeName.equalsIgnoreCase("NUMBER")) {
            Object oPrecision = col.has("digits") ? col.get("digits") : null;
            if(oPrecision != null) {
                return "\t\t\t<column name=\"" + col.getString("name") + "\" sql-type=\"number(" + oSize + ","+oPrecision+")\" precision=\"" + oSize + "\" scale=\""+oPrecision+"\"/>";
            } else {
                return "\t\t\t<column name=\"" + col.getString("name") + "\" sql-type=\"number(" + oSize + ")\" precision=\"" + oSize + "\" />";
            }
        } else {
            throw new Exception("Unrecognized typeName");
        }
    }


    /**
     * Ritorna i metodi setter e getter del campo
     * @param col
     * @return
     */
    static private String get_method_column ( JSONObject col, String className, String fieldPropName ) throws Exception {
        String name = col.getString("name");
        String typeName = col.getString("typeName");
        Object oSize = col.has("size") ? col.get("size") : null;
        String typeOfField = "";
        String hibFieldName = nameSpacer.DB2Hibernate(name);
        String hibName = nameSpacer.DB2Hibernate(name);

        if(className != null && !className.isEmpty()) {
            typeOfField = className;
            hibFieldName = fieldPropName;
            hibName = fieldPropName;
        } else if(typeName.equalsIgnoreCase("VARCHAR") || typeName.equalsIgnoreCase("VARCHAR2")) {
            typeOfField = "String";
        } else if(typeName.equalsIgnoreCase("DATE")) {
            typeOfField = "Date";
        } else if(typeName.equalsIgnoreCase("TIMESTAMP")) {
            typeOfField = "Timestamp";
        } else if(typeName.equalsIgnoreCase("NUMBER")) {
            typeOfField = "BigDecimal";
        } else {
            throw new Exception("Unrecognized typeName");
        }

        String setter = nameSpacer.getSetter(hibFieldName);
        String getter = nameSpacer.getGetter(hibFieldName);

        setter = "\tpublic " + "void" + " " + setter + "("+typeOfField+" " + hibName + ") {\n"
                +"\t\tthis."+hibName+" = "+hibName+";\n"
                +"\t}\n";
        getter = "\tpublic " + typeOfField + " " + getter + "() {\n"
                +"\t\treturn "+hibName+";\n"
                +"\t}\n";

        return getter + "\n" + setter;
    }




    /**
     * Ritorna il nome della proprieta per la classe hibernate
     * @param col
     * @return
     */
    static private String get_class_field_column ( JSONObject col, String className, String fieldPropName ) throws Exception {
        String name = col.getString("name");
        String typeName = col.getString("typeName");
        if(className != null && !className.isEmpty()) {
            return "    private "+className+" " + fieldPropName + ";";
        } else if(typeName.equalsIgnoreCase("VARCHAR") || typeName.equalsIgnoreCase("VARCHAR2")) {
            return "    private String " + nameSpacer.DB2Hibernate(name) + ";";
        } else if(typeName.equalsIgnoreCase("DATE")) {
            return "    private Date " + nameSpacer.DB2Hibernate(name) + ";";
        } else if(typeName.equalsIgnoreCase("NUMBER")) {
            return "    private BigDecimal " + nameSpacer.DB2Hibernate(name) + ";";
        } else if(typeName.equalsIgnoreCase("NUMBER")) {
        } else {
            throw new Exception("Unrecognized typeName");
        }
        return "";
    }

    
    static public Object [] get_foreign_table_info ( JSONObject json, String colName ) {
        try {
            if(json.has("runtimeForeignTables")) {
                JSONArray foreignTables = json.getJSONArray("runtimeForeignTables");
                for (int ift = 0; ift < foreignTables.length(); ift++) {
                    JSONObject foreignTableJson = foreignTables.getJSONObject(ift);
                    if (foreignTableJson != null) {
                        String foreignTable = foreignTableJson.has("foreignTable") ? foreignTableJson.getString("foreignTable") : null;
                        String foreignColumn = foreignTableJson.has("foreignColumn") ? foreignTableJson.getString("foreignColumn") : null;
                        String column = foreignTableJson.has("column") ? foreignTableJson.getString("column") : null;
                        String name = foreignTableJson.has("name") ? foreignTableJson.getString("name") : null;
                        String controlId = foreignTableJson.has("controlId") ? foreignTableJson.getString("controlId") : null;

                        if (colName.equalsIgnoreCase(column)) {
                            return new Object[]{true, foreignTable, foreignColumn, column, name, controlId};
                        }
                    }
                }
            }
        } catch (Exception e) {
            return new Object [] { false, e.getMessage() };
        }

        return new Object [] { false };
    }

}
