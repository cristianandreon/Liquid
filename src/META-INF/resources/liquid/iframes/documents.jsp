<%@ page 
    language="java" 
    contentType="text/html; charset=UTF-8"
    import="javax.servlet.*"
    import="javax.servlet.http.*"
    import="javax.servlet.jsp.*"
    errorPage="" 
    %><%!
    // JSP declarations
    /*
     * Copyright (c) 2021-present, Cristian Andreon. All rights reserved.
     *
     * https://cristianandreon.eu   https://liquid-framework.net
     *
     * ver 1.01
     *
     * You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
     * copy, modify, and distribute this software in source code or binary form for use
     * in connection with the web services and APIs provided by Cristian Andreon.
     *
     * As with any software that integrates with the Cristian Andreon platform, your use of
     * this software is subject to the Cristian Andreon Platform Policy
     * This copyright notice shall be
     * included in all copies or substantial portions of the software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
     * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
     * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
     * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
     * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
     */

    %><%

    %>
<html>
    <head>
        <title>Liquid - Documents Manager</title>
        <link rel="stylesheet" href="../.././liquid/liquid.css?ve=<%=com.liquid.workspace.version_string%>" type='text/css' />
        <script lang="javascript">

            // N.B.: one document managment control <-> one iFrame, one global vars etc
            var glLiquidServlet = "";
            var glControlId = null;
            var glLiquid = null;
            var glDocName = null;
            var glDoc = null;
            var glNodes = null;

            function onLoad() {
                // init ... 
                const urlParams = new URLSearchParams(window.location.search);
                glDocName = urlParams.get('docName');
                glControlId = urlParams.get('controlId');
                glLiquid = window.parent.Liquid.getLiquid(glControlId);
                glDoc = parent.window.Liquid.getDocumentByName(glLiquid, glDocName);
                if(glNodes) {
                    addNewDocuemntRow(glDoc);
                }
            }
            
            function addDocuments( docItems ) {
                if(glNodes) {
                    var table = document.getElementById("liquidDocumentsX.table");
                    while(table.rows.length > 1)
                        table.deleteRow(1);
                    for(var i=0; i<docItems.length; i++) {
                        addDocuemnt( docItems[i], i+1 );
                    }
                    addNewDocuemntRow(glDoc);
                }
            }
            
            function addDocuemnt( docItem, id ) {
                if(docItem) {
                    var table = document.getElementById("liquidDocumentsX.table");
                    if(table) {
                        table.className = "liquidDocumentsXTable";
                        var row = table.insertRow(1);
                        row.className = "liquidDocumentsXRows";
                        var cell1 = row.insertCell(0);
                        var cell2 = row.insertCell(1);
                        var cell3 = row.insertCell(2);
                        var cell4 = row.insertCell(3);
                        var cell5 = row.insertCell(4);
                        docItem.type = docItem.file.split('.').pop();
                        docItem.name = docItem.file.substring(docItem.file.lastIndexOf('/')+1);
                        docItem.name = docItem.name.substring(docItem.name.lastIndexOf('\\')+1);
                        let doc_type_title = (docItem.doc_type_id ? "Document type id:"+docItem.doc_type_id+"" : "");
                        cell1.innerHTML = "<img style='float:left;' " +
                            "title='"+(docItem.doc_type ? docItem.doc_type : "")+"' " +
                            "scr=\""+getDocuemntTypeHTML(docItem)+"\" " +
                            "class=\"liquidDocumentsXDocIcon\" />" +
                            "<div title='"+doc_type_title+"' style='width:90px; float:left; font-size:90%'>"+(docItem.doc_type ? docItem.doc_type : "")+"</div>";
                        cell2.innerHTML = docItem.name;
                        cell3.innerHTML = (docItem.size / 1024).toFixed(1);
                        cell4.innerHTML = docItem.note;
                        cell4.id = (glControlId !== null ? glControlId+".liquidDocumentsX.note."+docItem.id : "");
                        
                        var itemId = (glControlId !== null ? glControlId+".liquidDocumentsX.table" : "");
                        var title = (window.parent.Liquid.lang === 'ita' ? "Scarica documento" : "Download document");
                        var cmdDownload = "<img src=\"../.././liquid/images/download.png\" class=\"liquidDocumentsXCmdIcon\" id=\""+itemId+".download\" title=\""+title+"\" onClick=\"window.parent.Liquid.onDownloadDocument('"+itemId+"',event); downloadDocument("+docItem.id+");\" style=\"width:20px; height:20px; padding-left:0px; filter:grayscale(0.7); cursor:pointer\" />";
                        title = (window.parent.Liquid.lang === 'ita' ? "Cancella documento" : "Delete document");
                        var cmdDelete = "<img src=\"../.././liquid/images/delete.png\" class=\"liquidDocumentsXCmdIcon\" id=\""+itemId+".delete\" title=\""+title+"\" onClick=\"window.parent.Liquid.onDeleteDocument('"+itemId+"',event); deleteDocument("+docItem.id+");\" style=\"width:20px; height:20px; padding-left:0px; filter:grayscale(0.7); cursor:pointer\" />";
                        title = (window.parent.Liquid.lang === 'ita' ? "Aggiorna note" : "Update note");
                        var cmdUpdate = "<img src=\"../.././liquid/images/update.png\" class=\"liquidDocumentsXCmdIcon\" id=\""+itemId+".upload\" title=\""+title+"\" onClick=\"window.parent.Liquid.onUpdateDocument('"+itemId+"',event); updateDocument("+docItem.id+");\" style=\"width:20px; height:20px; padding-left:0px; filter:grayscale(0.7); cursor:pointer\" />";
                        var cmdsHTML = "" + cmdDownload + "" + cmdDelete + "" + cmdUpdate;
                        
                        cell5.innerHTML = cmdsHTML;
                    } else console.error("ERROR: target table not found");
                }
            }
            function addNewDocuemntRow( doc ) {
                var table = document.getElementById("liquidDocumentsX.table");
                if(table) {
                    var row = table.insertRow(-1);
                    row.className = "liquidDocumentsXRows";

                    var cell0 = row.insertCell(0);
                    var typeItemId = (glControlId !== null ? glControlId+".liquidDocumentsX.uploadFileType" : "");
                    var html = "<input class=\"cfgEditboxClass\" style=\"text-align:left;\""
                                              +"name=\""+typeItemId+"\" id=\""+typeItemId+"\""+
                                              +"type=\"text\" value=\"\""
                                              +"autocomplete=\"off\""
                                              +"onmousedown=\"this.placeholder=this.value; if(!this.readOnly && !this.disabled) this.value =''\""
                                              +"onblur=\"if(!this.value) this.value=this.placeholder\""
                                              +"onchange=\"onMaterialCategoryChange(this)\""
                    +"/>";
                    var html_dl = "<%= com.liquid.utility.get_datalist_from_table(
                            "@@@DatalistID@@@",
                            "cnconline.DMS_DOC_TYPE",
                            "id",
                            ("ENG".equalsIgnoreCase((String) session.getAttribute("GLLang")) ? "type_desc" : "type_desc_"+((String) session.getAttribute("GLLang")).toLowerCase()+"" ),
                            null,
                            null,
                            "order by \"order\"",
                            ("ENG".equalsIgnoreCase((String)session.getAttribute("GLLang")) ? "":""),
                            null,
                            true
                            ).replace("\"", "\\\"")%>";
                    html_dl = html_dl.replaceAll("@@@DatalistID@@@", typeItemId);
                    cell0.innerHTML = html + html_dl;
                    cell0.style.width = "90px";
                    var cell1 = row.insertCell(1);
                    cell1.colSpan = 2;
                    var itemId = (glControlId !== null ? glControlId+".liquidDocumentsX.uploadFile" : "");
                    cell1.innerHTML = "<input type=\"file\" accept=\"*\" autofocus=\"true\" id=\""+itemId+"\" value=\"\" style=\"width:100%; height:27px\" />";
                    var cell4 = row.insertCell(2);
                    cell4.innerHTML = "<input id=\""+(glControlId !== null ? glControlId+".liquidDocumentsX.table.insert.note" : "")+"\" style=\"width:100%\" />";
                    var cell5 = row.insertCell(3);
                    cell5.id = (glControlId !== null ? glControlId+".liquidDocumentsX.table.insert" : "");
                    var itemId = (glControlId !== null ? glControlId+".liquidDocumentsX.table" : "");
                    let maxSize = getMaxUploadSize(doc);
                    var title = (window.parent.Liquid.lang === 'ita' ? "Carica documento" : "Upload document");
                    if(maxSize > 0) {
                        title += (window.parent.Liquid.lang === 'ita' ? "\n\nDimensione massima:" : "\n\nMax file size:");
                        title += maxSize / 1024 + " Kb";
                    }
                    var cmdUpload = "<img src=\"../.././liquid/images/upload.png\" class=\"liquidDocumentsXCmdIcon\" id=\""+itemId+".upload\" title=\""+title+"\" onClick=\"window.parent.Liquid.onUploadDocument('"+itemId+"',event); uploadDocument();\" style=\"width:20px; height:20px; padding-left:0px; filter:grayscale(0.7); cursor:pointer\" />";
                    cell5.innerHTML = cmdUpload;

                    // setup datalist
                    window.parent.Liquid.setupDescDatalistEx(window, typeItemId, typeItemId + ".desc", typeItemId + ".list");

                    // set datalist content by dms def
                    fit_datalist_content(typeItemId + ".list", doc.docTypeId);

                } else console.error("ERROR: target table not found");
            }

            function fit_datalist_content(datalistId, docTypeIds) {
                if (!Array.isArray(docTypeIds)) {
                    docTypeIds = [docTypeIds];
                } else {
                    docTypeIds = docTypeIds;
                }
                let datalist = document.getElementById(datalistId);
                if(datalist) {
                    for (let i= 0; i<datalist.childNodes.length; i++) {
                        let node = datalist.childNodes[i];
                        let nodeName = node.nodeName.toUpperCase();
                        if (nodeName === 'OPTION') {
                            let found = false;
                            for(let j=0; j<docTypeIds.length; j++) {
                                if(docTypeIds[j] == node.innerText ||
                                    docTypeIds[j] == node.getAttribute('data-code')) {
                                    node.selected = true;
                                    node.style.display = "";
                                    found=true;
                                    break;
                                }
                            }
                            if(!found) {
                                node.selected = false;
                                node.style.display = "none";
                            }
                        }
                    }
                }
            }

            function getDocuemntTypeHTML( docItem ) {
                switch(docItem.type) {
                    case 'step':
                    case 'stp':
                    case 'iges':
                    case 'igs':
                    case 'stl':
                    case 'obj':
                        return "../.././liquid/images/step.png";
                        break
                    case 'pdf':
                        return "../.././liquid/images/pdf.png";
                        break
                    case 'xls':
                        return "../.././liquid/images/xls.png";
                        break
                    case 'ods':
                        return "../.././liquid/images/ods.png";
                        break
                    case 'doc':
                        return "../.././liquid/images/world.png";
                        break
                    case 'txt':
                        return "../.././liquid/images/txt.png";
                        break
                    case 'dwg':
                        return "../.././liquid/images/dwg.png";
                        break
                    case 'dxf':
                        return "../.././liquid/images/dwg.png";
                        break
                    case 'xml':
                        return "../.././liquid/images/toXML.png";
                        break
                    default:
                        return "../.././liquid/images/compute_cycle.png";
                        break
                }
            }
            
            function loadDocuments( liquid, doc, nodes, mode ) {
                glNodes = null;
                var owner = liquid.tableJson.owner + ".getDocuments";
                if(doc.owner) owner = doc.owner;
                if(owner == 'com.liquid.event' || owner == 'com.liquid') owner = null;
                if(!owner) owner = 'com.liquid.event.getDocuments';
                if(owner) {
                    if(nodes) {
                        if(nodes.length>0) {
                            glNodes = nodes;
                            var nodeKeys = [];
                            for (var iN = 0; iN < nodes.length; iN++) {
                                nodeKeys.push(nodes[iN].data[liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : null]);
                            }
                            var params = {
                                database: liquid.tableJson.database,
                                schema: liquid.tableJson.schema,
                                table: liquid.tableJson.table,
                                name: (typeof doc.name !== 'undefined' ? doc.name : ""),
                                ids: nodeKeys
                            };
                            var xhr = new XMLHttpRequest();
                            xhr.open('POST', glLiquidServlet + '?operation=exec'
                                + '&className=' + encodeURI(owner)
                                + '&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : "")
                            );
                            xhr.send("{\"params\":" + (params ? JSON.stringify(params) : "[]") + "}");
                            xhr.onreadystatechange = function () {
                                if (xhr.readyState === 4) {
                                    if (xhr.status === 200) {
                                        try {
                                            // \b \f \n \r \t \\
                                            var responseText = xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b"); // .replace(/(?:[\r\\])/g, "\\\\");
                                            responseText = responseText.substring(0, responseText.lastIndexOf("}") + 1);
                                            if (responseText) {
                                                var httpResultJson = JSON.parse(responseText);
                                                if (httpResultJson.resultSet) {
                                                    addDocuments(httpResultJson.resultSet);
                                                }
                                                if (httpResultJson.error) {
                                                    let err = atob(httpResultJson.error);
                                                    console.error("[SERVER] ERROR:" + err);
                                                    try { document.getElementById("" + liquid.controlId + ".error").innerHTML = err; } catch (e) { }
                                                    window.parent.Liquid.showToast("Document error", err, "ERROR");
                                                }
                                            }
                                        } catch (e) {
                                            console.error(responseText);
                                            console.error("loadDocuments() on " + liquid.controlId + " error in response process:" + e);
                                        }

                                    } else {
                                        console.error("loadDocuments() . wrong response:" + xhr.status);
                                    }
                                }
                            };
                        }
                    }
                }
            }
            async function uploadDocument( ) {
                var liquid = glLiquid;
                var docName = glDocName;
                if(liquid) {
                    var doc = parent.window.Liquid.getDocumentByName(liquid, docName);
                    var owner = liquid.tableJson.owner + ".uploadDocument";
                    if(doc && doc.owner) owner = doc.owner;
                    if(owner == 'com.liquid.event' || owner == 'com.liquid') owner = null;
                    if(!owner) owner = 'com.liquid.event.uploadDocument';
                    if(owner) {
                        var itemId = (glControlId !== null ? glControlId+".liquidDocumentsX.uploadFile" : "");
                        var fileObj = document.getElementById(itemId);
                        if(fileObj.files && fileObj.files.length == 1) {
                            var noteId = glControlId+".liquidDocumentsX.table.insert.note";
                            var noteObj = document.getElementById(noteId);
                            var note = noteObj ? noteObj.value : "";
                            var file = fileObj.files[0];
                            var fileName = fileObj.files[0].name;
                            var fileSize = fileObj.files[0].size;
                            var docTypeId = typeof doc.docTypeId !== 'undefined' ? doc.docTypeId : null;
                            if(typeof doc.maxSize !=='undefined') {
                                if(Number(doc.maxSize) > 0) {
                                    if(fileSize >doc.maxSize) {
                                        alert(parent.window.Liquid.FileTooBigMessage+"... max : "+(doc.maxSize / 1024)+"Kb");
                                        return;
                                    }
                                }
                            }
                            let MAX_DOWNLOAD_SIZE = <%=com.liquid.event.MAX_DOWNLOAD_SIZE%>;
                            if(MAX_DOWNLOAD_SIZE > 0) {
                                if(fileSize > MAX_DOWNLOAD_SIZE) {
                                    alert(parent.window.Liquid.FileTooBigMessage+"... max : "+(MAX_DOWNLOAD_SIZE / 1024)+"Kb");
                                    return;
                                }
                            }
                            const reader = new FileReader();
                            reader.onerror = function(result) { console.log('ERROR: uploadDocument() : ', result.message); };
                            reader.onloadend = function(result) {
                                var nodeKeys = [];
                                var nodes = glNodes;
                                for (var iN=0; iN<nodes.length; iN++) {
                                    nodeKeys.push( nodes[iN].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : null ] );
                                }
                                var params = {
                                    database:liquid.tableJson.database,
                                    schema:liquid.tableJson.schema,
                                    table:liquid.tableJson.table,
                                    name:(typeof doc.name!=='undefined'?doc.name:""),
                                    ids:nodeKeys,
                                    file:fileName,
                                    size:fileSize,
                                    note:note,
                                    docTypeId:docTypeId,
                                    content:btoa(result.target.result)
                                };
                                var xhr = new XMLHttpRequest();
                                xhr.open('POST', glLiquidServlet + '?operation=exec'
                                        + '&className=' + encodeURI(owner)
                                        + '&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : "")
                                        + '&clientData='+doc.name
                                        );
                                xhr.send("{\"params\":" + (params ? JSON.stringify(params) : "[]") + "}");
                                xhr.onreadystatechange = function() {
                                    if(xhr.readyState === 4) {
                                        if(xhr.status === 200) {
                                            try { // \b \f \n \r \t \\
                                                var responseText = xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b"); // .replace(/(?:[\r\\])/g, "\\\\");
                                                responseText = responseText.substring(0, responseText.lastIndexOf("}") + 1);
                                                if(responseText) {
                                                    window.parent.Liquid.refreshDocuemnt(liquid, doc, false);
                                                    var httpResultJson = JSON.parse(responseText);                                            
                                                    // if(httpResultJson.resultSet) { addDocuments(httpResultJson.resultSet); }
                                                    if(httpResultJson.error) {
                                                        let err = atob(httpResultJson.error);
                                                        console.error("[SERVER] ERROR:" + err);
                                                        try { document.getElementById("" + liquid.controlId + ".error").innerHTML = err; } catch (e) { }
                                                        window.parent.Liquid.showToast("Document error", err, "ERROR");
                                                    }
                                                }
                                            } catch (e) {
                                                console.error(responseText);
                                                console.error("uploadDocument() on " + liquid.controlId + " error in response process:" + e);
                                            }

                                        } else {
                                            console.error("uploadDocument() . wrong response:" + xhr.status);
                                        }
                                    }
                                };
                            };
                            reader.readAsBinaryString(file);
                        } else {
                            alert(parent.window.Liquid.NoSelectedFileMessage);
                        }
                    }
                }
            }
            function downloadDocument( id ) {
                var liquid = glLiquid;
                var docName = glDocName;
                var nodes = glNodes;
                var doc = parent.window.Liquid.getDocumentByName(liquid, docName);
                var owner = liquid.tableJson.owner + ".downloadDocument";
                if(doc && doc.owner) owner = doc.owner;
                if(owner == 'com.liquid.event' || owner == 'com.liquid') owner = null;
                if(!owner) owner = 'com.liquid.event.downloadDocument';
                if(owner) {
                    if(nodes) {
                        var nodeKeys = [];
                        var nodes = glNodes;
                        for (var iN=0; iN<nodes.length; iN++) {
                            nodeKeys.push( nodes[iN].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : null ] );
                        }
                        var params = { database:liquid.tableJson.database, schema:liquid.tableJson.schema, table:liquid.tableJson.table, name:(typeof doc.name!=='undefined'?doc.name:""), ids:nodeKeys, id:String(id) };
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', glLiquidServlet + '?operation=exec'
                                + '&className=' + encodeURI(owner)
                                + '&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : "")
                                );
                        xhr.responseType = "blob";
                        xhr.send("{\"params\":" + (params ? JSON.stringify(params) : "[]") + "}");
                        xhr.onreadystatechange = function() {
                            if(xhr.readyState === 4) {
                                if(xhr.status === 200) {
                                    try {
                                        var contentType = xhr.getResponseHeader('content-type');
                                        var disposition = xhr.getResponseHeader('content-disposition');
                                        if (disposition && disposition.indexOf('attachment') !== -1) {
                                            var filename = "file";
                                            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                            var matches = filenameRegex.exec(disposition);
                                            if (matches != null && matches[1]) { 
                                                filename = matches[1].replace(/['"]/g, '');
                                            }
                                        }
                                        var link = document.createElement('a');
                                        link.href = window.URL.createObjectURL(xhr.response);
                                        link.download = filename;
                                        document.body.appendChild(link);
                                        link.click();
                                    } catch (e) {
                                        console.error("downloadDocument() on " + liquid.controlId + " error in response process:" + e);
                                    }
                                } else {
                                    console.error("downloadDocument() . wrong response:" + xhr.status);
                                }
                            }
                        };
                    }
                }
            }

            function deleteDocument( id ) {
                let row_id = id;
                let title = (window.parent.Liquid.lang === 'ita' ? "CONFERMA CANCELLAZIONE" : "DELETE CONFIRM");
                let msg = (window.parent.Liquid.lang === 'ita' ? "Cancellare il documento ?" : "Delete the document ?");
                parent.window.Liquid.messageBox(null, parent.window.Liquid.QUESTION_STRING, msg,
                    function () { doDdeleteDocument( row_id ); },
                    function () {}
                )
            }
            function doDdeleteDocument( id ) {
                var liquid = glLiquid;
                var docName = glDocName;
                var nodes = glNodes;
                var doc = parent.window.Liquid.getDocumentByName(liquid, docName);
                var owner = liquid.tableJson.owner + ".deleteDocument";
                if(doc.owner) owner = doc.owner;
                if(owner == 'com.liquid.event' || owner == 'com.liquid') owner = null;
                if(!owner) owner = 'com.liquid.event.deleteDocument';
                if(owner) {
                    if(nodes) {
                        glNodes = nodes;
                        var nodeKeys = [];
                        for (var iN=0; iN<nodes.length; iN++) {
                            nodeKeys.push( nodes[iN].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : null ] );
                        }
                        var params = { database:liquid.tableJson.database, schema:liquid.tableJson.schema, table:liquid.tableJson.table, name:(typeof doc.name!=='undefined'?doc.name:""), ids:nodeKeys, id:String(id) };
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', glLiquidServlet + '?operation=exec'
                                + '&className=' + encodeURI(owner)
                                + '&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : "")
                                );
                        xhr.send("{\"params\":" + (params ? JSON.stringify(params) : "[]") + "}");
                        xhr.onreadystatechange = function() {
                            if(xhr.readyState === 4) {
                                if(xhr.status === 200) {
                                    try {
                                        // \b \f \n \r \t \\
                                        var responseText = xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b"); // .replace(/(?:[\r\\])/g, "\\\\");
                                        responseText = responseText.substring(0, responseText.lastIndexOf("}") + 1);
                                        if(responseText) {
                                            window.parent.Liquid.refreshDocuemnt(liquid, doc, false);
                                            var httpResultJson = JSON.parse(responseText);
                                            if(httpResultJson.error) {
                                                let err = atob(httpResultJson.error);
                                                console.error("[SERVER] ERROR:" + err);
                                                try { document.getElementById("" + liquid.controlId + ".error").innerHTML = err; } catch (e) { }
                                                window.parent.Liquid.showToast("Document error", err, "ERROR");
                                            }
                                        }
                                    } catch (e) {
                                        console.error(responseText);
                                        console.error("deleteDocument() on " + liquid.controlId + " error in response process:" + e);
                                    }

                                } else {
                                    console.error("deleteDocument() . wrong response:" + xhr.status);
                                }
                            }
                        };
                    }
                }
            }
            function updateDocument( id ) {
                var liquid = glLiquid;
                var docName = glDocName;
                var nodes = glNodes;
                var doc = parent.window.Liquid.getDocumentByName(liquid, docName);
                var owner = liquid.tableJson.owner + ".updateDocument";
                var noteId = id;
                if(doc.owner) owner = doc.owner;
                if(owner == 'com.liquid.event' || owner == 'com.liquid') owner = null;
                if(!owner) owner = 'com.liquid.event.updateDocument';
                if(owner) {
                    if(nodes) {
                        glNodes = nodes;
                        var nodeKeys = [ id ];
                        let curNote = document.getElementById(glControlId+".liquidDocumentsX.note."+id).innerText;
                        var note = prompt("Note", curNote);
                        var params = { database:liquid.tableJson.database, schema:liquid.tableJson.schema, table:liquid.tableJson.table, note:note, name:(typeof doc.name!=='undefined'?doc.name:""), ids:nodeKeys, id:String(id) };
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', glLiquidServlet + '?operation=exec'
                                + '&className=' + encodeURI(owner)
                                + '&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : "")
                                );
                        xhr.send("{\"params\":" + (params ? JSON.stringify(params) : "[]") + "}");
                        xhr.onreadystatechange = function() {
                            if(xhr.readyState === 4) {
                                if(xhr.status === 200) {
                                    try {
                                        // \b \f \n \r \t \\
                                        var responseText = xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b"); // .replace(/(?:[\r\\])/g, "\\\\");
                                        responseText = responseText.substring(0, responseText.lastIndexOf("}") + 1);
                                        if(responseText) {
                                            window.parent.Liquid.refreshDocuemnt(liquid, doc, false);
                                            var httpResultJson = JSON.parse(responseText);
                                            if(httpResultJson.error) {
                                                let err = atob(httpResultJson.error);
                                                console.error("[SERVER] ERROR:" + err);
                                                try { document.getElementById("" + liquid.controlId + ".error").innerHTML = err; } catch (e) { }
                                                window.parent.Liquid.showToast("Document error", err, "ERROR");
                                            } else {
                                                document.getElementById(glControlId+".liquidDocumentsX.note."+noteId).innerHtml = note;
                                            }
                                        }
                                    } catch (e) {
                                        console.error(responseText);
                                        console.error("updateDocument() on " + liquid.controlId + " error in response process:" + e);
                                    }
                                } else {
                                    console.error("updateDocument() . wrong response:" + xhr.status);
                                }
                            }
                        };
                    }
                }
            }

            function getMaxUploadSize(doc) {
                let maxSize = 0;
                if (typeof doc.maxSize !=='undefined') {
                    if (Number(doc.maxSize) > 0) {
                        maxSize = Number(doc.maxSize);
                    }
                }
                let MAX_DOWNLOAD_SIZE = <%=com.liquid.event.MAX_DOWNLOAD_SIZE%>;
                if (MAX_DOWNLOAD_SIZE > 0) {
                    if (MAX_DOWNLOAD_SIZE < maxSize) {
                        maxSize = MAX_DOWNLOAD_SIZE;
                    }
                }
                return maxSize;
            }

        </script>
    </head>
    <body onload="onLoad();">
        <table id="liquidDocumentsX.table" class="liquidDocumentsX" border=0 cellspacing=0 cellpadding=10 style="">
             <tr class="liquidDocumentsXHeader">
                 <% if("IT".equalsIgnoreCase((String) session.getAttribute("GLLang"))) { %>
                 <td>Tipo</td>
                 <td>Nome</td>
                 <td>Dim.(Kb)</td>
                 <td>Note</td>
                 <td> </td>
                 <% } else { %>
                 <td>Type</td>
                 <td>Name</td>
                 <td>size(Kb)</td>
                 <td>Note</td>
                 <td> </td>
                 <% } %>
             </tr>
        </table>
    </body>
</html>