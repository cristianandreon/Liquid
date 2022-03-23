/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2022.
 */

package com.liquid;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.StringWriter;
import java.io.Writer;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import static com.liquid.XMLutils.getChildrenByNodeName;
import static com.liquid.XMLutils.getNodeByProp;


public class ZKpanelsMerge {


        public static void mergeXML(String newFile, String existingFile) throws Exception {

            try {

                DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();

                DocumentBuilder db = dbf.newDocumentBuilder();

                Document existingFileXML = db.parse(new File(existingFile));
                Document newFileXML = db.parse(new File(newFile));

                NodeList existingPanels = existingFileXML.getElementsByTagName("panels");
                NodeList newPanels = newFileXML.getElementsByTagName("panels");

                for (int g = 0; g < newPanels.getLength(); g++) {
                    Node newPanel = newPanels.item(g);
                    String newPanelId = String.valueOf( newPanel.getUserData("id") );
                    Node existingPanel = getNodeByProp( existingPanels, newPanelId);
                    if(existingPanel == null) {
                        // Aggiunta pannello

                        // existingPanels.appendChild(secondaryMetabolismXML.importNode(getChildrenByNodeName(generalReaction, "reactionDescription"), true));

                    } else {
                        // confronto pannello ...

                        // Finder

                        // List
                        Node existList = getChildrenByNodeName(existingPanel, "list");
                        Node newList = getChildrenByNodeName(newPanel, "list");

                        // Grids
                        Node existGrids = getChildrenByNodeName(existingPanel, "grids");
                        Node newGrids = getChildrenByNodeName(newPanel, "grids");
                    }
                }

                TransformerFactory tFactory = TransformerFactory.newInstance();
                Transformer transformer = tFactory.newTransformer();
                transformer.setOutputProperty(OutputKeys.INDENT, "yes");

                DOMSource source = new DOMSource(existingFileXML);
                StreamResult result = new StreamResult(new StringWriter());
                transformer.transform(source, result);

                Writer output = new BufferedWriter(new FileWriter(existingFile));
                String xmlOutput = result.getWriter().toString();
                output.write(xmlOutput);
                output.close();

            } catch (Exception e) {
                e.printStackTrace();
            }

        }


}
