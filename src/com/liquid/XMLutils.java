/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2022.
 */

package com.liquid;

import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class XMLutils {

    /**
     * Returns a node child when you have a match with a given node name
     *
     * @param node
     * @param nodeName
     * @return
     */
    public static Node getChildrenByNodeName(Node node, String nodeName) {
        for (Node childNode = node.getFirstChild(); childNode != null;) {
            Node nextChild = childNode.getNextSibling();
            if (childNode.getNodeName().equalsIgnoreCase(nodeName)) {
                return childNode;
            }
            childNode = nextChild;
        }
        return null;
    }

    public static Node getNodeByProp(NodeList nodes, String prop) {
        for (int in=0; in<nodes.getLength(); in++) {
            Node node = nodes.item(in);
            if (String.valueOf(node.getUserData("id")).equalsIgnoreCase(prop)) {
                return node;
            }
        }
        return null;
    }

}
