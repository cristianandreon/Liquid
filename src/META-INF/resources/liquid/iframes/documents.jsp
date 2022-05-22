<%@ page 
    language="java" 
    contentType="text/html; charset=UTF-8"
    import="javax.servlet.*"
    import="javax.servlet.http.*"
    import="javax.servlet.jsp.*"
    errorPage="" 
    %><%!
        // JSP declarations
    %><%
        // JSP methods
    %>
<html>
    <head>
        <title>Liquid - Documents Manager</title>
        <link rel="stylesheet" href="../.././liquid/liquid.css" type='text/css' />
        <link rel="stylesheet" href="/LiquidX/liquid.css" type='text/css' />
        <script lang="javascript">            
           
            var glLiquidServlet = "";
            var glControlId = null;
            var glLiquid = null;
            var glDocName = null;
            var glNodes = null;

            function onLoad() {
                // init ... 
                const urlParams = new URLSearchParams(window.location.search);
                glDocName = urlParams.get('docName');
                glControlId = urlParams.get('controlId');
                glLiquid = window.parent.Liquid.getLiquid(glControlId);
                addNewDocuemntRow();
            }
            
            function addDocuments( docItems ) {
                var table = document.getElementById("liquidDocumentsX.table");
                while(table.rows.length > 1) 
                    table.deleteRow(1); 
                for(var i=0; i<docItems.length; i++) {
                    addDocuemnt( docItems[i], i+1 );
                }
                addNewDocuemntRow();
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
                        cell1.innerHTML = "<img scr=\""+getDocuemntTypeHTML(docItem)+"\" class=\"liquidDocumentsXDocIcon\" />";
                        cell2.innerHTML = docItem.name;
                        cell3.innerHTML = (docItem.size / 1024).toFixed(1);
                        cell4.innerHTML = docItem.note;
                        cell4.id = (glControlId !== null ? glControlId+".liquidDocumentsX.note."+docItem.id : "");
                        
                        var itemId = (glControlId !== null ? glControlId+".liquidDocumentsX.table" : "");
                        var cmdDownload = "<img src=\"../.././liquid/images/download.png\" class=\"liquidDocumentsXCmdIcon\" id=\""+itemId+".download\" title=\""+"Download document"+"\" onClick=\"window.parent.Liquid.onDownloadDocument('"+itemId+"',event); downloadDocument("+docItem.id+");\" style=\"width:20px; height:20px; padding-left:0px; filter:grayscale(0.0); cursor:pointer\" />";
                        var cmdDelete = "<img src=\"../.././liquid/images/delete.png\" class=\"liquidDocumentsXCmdIcon\" id=\""+itemId+".delete\" title=\""+"delete document"+"\" onClick=\"window.parent.Liquid.onDeleteDocument('"+itemId+"',event); deleteDocument("+docItem.id+");\" style=\"width:20px; height:20px; padding-left:0px; filter:grayscale(0.0); cursor:pointer\" />";
                        var cmdUpdate = "<img src=\"../.././liquid/images/update.png\" class=\"liquidDocumentsXCmdIcon\" id=\""+itemId+".upload\" title=\""+"Update row"+"\" onClick=\"window.parent.Liquid.onUpdateDocument('"+itemId+"',event); updateDocument("+docItem.id+");\" style=\"width:20px; height:20px; padding-left:0px; filter:grayscale(0.0); cursor:pointer\" />";
                        var cmdsHTML = "" + cmdDownload + "" + cmdDelete + "" + cmdUpdate;
                        
                        cell5.innerHTML = cmdsHTML;
                    } else console.error("ERROR: target table not found");
                }
            }
            function addNewDocuemntRow( ) {
                var table = document.getElementById("liquidDocumentsX.table");
                if(table) {
                    var row = table.insertRow(-1);
                    row.className = "liquidDocumentsXRows";
                    var cell1 = row.insertCell(0);
                    cell1.colSpan = 3;
                    var itemId = (glControlId !== null ? glControlId+".liquidDocumentsX.uploadFile" : "");
                    cell1.innerHTML = "<input type=\"file\" accept=\"*\" autofocus=\"true\" id=\""+itemId+"\" value=\"\" style=\"width:100%; height:27px\" />";
                    var cell4 = row.insertCell(1);
                    cell4.innerHTML = "<input id=\""+(glControlId !== null ? glControlId+".liquidDocumentsX.table.insert.note" : "")+"\" style=\"width:100%\" />";
                    var cell5 = row.insertCell(2);
                    cell5.id = (glControlId !== null ? glControlId+".liquidDocumentsX.table.insert" : "");
                    var itemId = (glControlId !== null ? glControlId+".liquidDocumentsX.table" : "");
                    var cmdUpload = "<img src=\"../.././liquid/images/upload.png\" class=\"liquidDocumentsXCmdIcon\" id=\""+itemId+".upload\" title=\""+"Upload document"+"\" onClick=\"window.parent.Liquid.onUploadDocument('"+itemId+"',event); uploadDocument();\" style=\"width:20px; height:20px; padding-left:0px; filter:grayscale(0.0); cursor:pointer\" />";
                    cell5.innerHTML = cmdUpload;
                } else console.error("ERROR: target table not found");
            }
            function getDocuemntTypeHTML( docItem ) {
                switch(docItem.type) {
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
                    default:
                        return "../.././liquid/images/doc.png";
                        break
                }
            }
            
            function loadDocuments( liquid, doc, nodes, mode ) {
                glNodes = null;
                var owner = liquid.tableJson.owner + ".getDocuments";
                if(doc.owner) owner = doc.owner;
                if(!owner) owner = 'com.liquid.event.getDocuments';
                if(owner) {
                    if(nodes) {
                        glNodes = nodes;
                        var nodeKeys = [];
                        for (var iN=0; iN<nodes.length; iN++) {
                            nodeKeys.push( nodes[iN].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : null ] );
                        }
                        var params = { database:liquid.tableJson.database, schema:liquid.tableJson.schema, table:liquid.tableJson.table, name:(typeof doc.name!=='undefined'?doc.name:""), ids:nodeKeys };
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
                                            var httpResultJson = JSON.parse(responseText);                                            
                                            if(httpResultJson.resultSet) {
                                                addDocuments(httpResultJson.resultSet);
                                            }
                                            if(httpResultJson.error) {
                                                console.error("[SERVER] ERROR:" + atob(httpResultJson.error));
                                                try {
                                                    document.getElementById("" + liquid.controlId + ".error").innerHTML = atob(httpResultJson.error);
                                                } catch (e) {
                                                }
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
            async function uploadDocument( ) {
                var liquid = glLiquid;
                var docName = glDocName;
                if(liquid) {
                    var doc = parent.window.Liquid.getDocumentByName(liquid, docName);
                    var owner = liquid.tableJson.owner + ".uploadDocument";
                    if(doc.owner) owner = doc.owner;
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
                            if(doc.maxSize !== 'undefined') {
                                if(Number(doc.maxSize) > 0) {
                                    if(fileSize >doc.maxSize) {
                                        alert(parent.window.Liquid.FileTooBigMessage+"... max : "+(doc.maxSize / 1024)+"Kb");
                                        return;
                                    }
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
                                    content:result.target.result
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
                                                        console.error("[SERVER] ERROR:" + atob(httpResultJson.error));
                                                        try {
                                                            document.getElementById("" + liquid.controlId + ".error").innerHTML = atob(httpResultJson.error);
                                                        } catch (e) {
                                                        }
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
                            reader.readAsDataURL(file);
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
                if(!owner) owner = 'com.liquid.event.downloadDocument';
                if(owner) {
                    if(nodes) {
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
                                        var blob = new Blob([xhr.response], { type:contentType });
                                        var link = document.createElement('a');
                                        link.href = window.URL.createObjectURL(blob);
                                        link.download = filename;

                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
        
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
                var liquid = glLiquid;
                var docName = glDocName;
                var nodes = glNodes;
                var doc = parent.window.Liquid.getDocumentByName(liquid, docName);
                var owner = liquid.tableJson.owner + ".deleteDocument";
                if(doc.owner) owner = doc.owner;
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
                                                console.error("[SERVER] ERROR:" + atob(httpResultJson.error));
                                                try {
                                                    document.getElementById("" + liquid.controlId + ".error").innerHTML = atob(httpResultJson.error);
                                                } catch (e) {
                                                }
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
                if(doc.owner) owner = doc.owner;
                if(!owner) owner = 'com.liquid.event.updateDocument';
                if(owner) {
                    if(nodes) {
                        glNodes = nodes;
                        var nodeKeys = [];
                        for (var iN=0; iN<nodes.length; iN++) {
                            nodeKeys.push( nodes[iN].data[ liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : null ] );
                        }
                        var curNote = document.getElementById("" + liquid.controlId + ".error").innerHTML = atob(httpResultJson.error);
                        var note = prompt();
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
                                                console.error("[SERVER] ERROR:" + atob(httpResultJson.error));
                                                try {
                                                    document.getElementById("" + liquid.controlId + ".error").innerHTML = atob(httpResultJson.error);
                                                } catch (e) {
                                                }
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
        </script>
    </head>
    <body onload="onLoad();">
        <table id="liquidDocumentsX.table" class="liquidDocumentsX" border=0 cellspacing=0 cellpadding=10 style="">
             <tr class="liquidDocumentsXHeader">
                 <td>Type</td>
                 <td>Name</td>
                 <td>size(Kb)</td>
                 <td>Note</td>
                 <td> </td>
             </tr>
        </table>
    </body>
</html>