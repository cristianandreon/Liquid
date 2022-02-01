/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

var LiquidEditing = {
    version: 1.04,
    controlid:"Liquid framework - Editing module",
    
    
    /**
     * Create a DialogX .JSON (the dialogX configuration)  and .java (as callback code) starting from a HTML file defining the form and inputs
     * 
     * @returns {undefined}
     */
    createNewDialogX:function() {
        
        file = '';
        context = {};
        
        LiquidEditing.getFileContent(file, next_step, context);
        
    },
    createNewDialogXProcess:function(context) {
        
        if(context) {
            if(isDef(context.fileContent)) {
                var div = document.createElement("div");
                div.id = "LiquidTemporaryDiv";
                div.className = "";
                div.style.visible = "hidden";
                div.style.height = "0x";
                document.body.appendChild(div);
                
                div.innerHTML = context.fileContent;
                
                var columnsList = "";
                
                for(var j=0; j<div.childNodes.length; j++) {                    
                    if(div.childNodes[j].nodeName) {
                        if(div.childNodes[j].nodeName.toUpperCase() === 'FORM') {
                            frm_elements = div.childNodes[j];
                            if(frm_elements && frm_elements.length) {
                                for (var i = 0; i < frm_elements.length; i++) {
                                    var field_type = frm_elements[i].type.toLowerCase();
                                    var field_name = frm_elements[i].id ? frm_elements[i].id : frm_elements[i].name;
                                    var field_value = "";
                                    switch (field_type) {
                                        case "text":
                                        case "password":
                                        case "textarea":
                                        case "email":
                                        case "hidden":
                                            field_value = Liquid.handleFormText(frm_elements[i]);
                                            break;
                                        case "radio":
                                        case "checkbox":
                                            field_value = frm_elements[i].checked;
                                            break;
                                        case "select-one":
                                        case "select-multi":
                                            field_value = frm_elements[i].selectedIndex;
                                            break;
                                        case "file":
                                            field_value = frm_elements[i].files;
                                            break;
                                        default:
                                            break;
                                    }
                                    if(field_name) {
                                        columnsList += (columnsList.length?",":"") + "\""+field_name+"\":\""+field_value+"\"";
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // file .json of the dialogX control
            var jsonContent = "\n\
            { \n\
\"columns\":[\n\
"+columnsList+"\
]\n\
,\"mode\":\"dialogX\"\n\
,\"modless\":false\\n\
,\"navVisible\":false\n\
,\"autoInsert\":false\n\
,\"left\":\"center\"\n\
,\"top\":\"center\"\
,\"width\":\"450px\"\
,\"height\":\"650px\"\
,\"documents\":[ ]\n\
,\"layouts\":[\n\
    {\"name\":\"MyFormX\", \"title\":\"My formX\", \"tooltip\":\"My formX\", \"icon\":\"\", \"source\":\"url(liquidFormX.jsp)\", \"nRows\":1, \"overflow\":\"overlay\" }\n\
        ]\n\
,\"actions\":[\n\
    {\"name\":\"cancel\", \"img\":\"cancel.png\", \"size\":20, \"text\":\"Annulla\", \"client\":\"Liquid.close\" }\n\
    ,{\"name\":\"ok\", \"img\":\"add.png\", \"size\":20, \"text\":\"OK\", \"server\":\"com.liquid.event.echo\", \"client\":[\"Liquid.close\", \"onCloseDialogX()\"] }\n\
]\n\
,\"listTabVisible\":false\n\
,\"layoutsTabVisible\":false\n\
}\n\
";
        }
    },
    getFileContent:function(file, next_step, context) {
        var reader = new FileReader();
        // reader.readAsDataURL(file);
        reader.readAsBinaryString(file);
        reader.onload = function(evt) {
            try { 
                if(Liquid.uploadUseGZIp && typeof gzip === 'function') {
                    // var comp = LZW.compress();
                    // var my_lzma = new LZMA("./lzma_worker.js");                            	
                    // queue.propValue = JSONC.pack( evt.target.result, true );
                    var s1 = evt.target.result.length;
                    var t1 = performance.now();
                    var zipped = gzip.zip(evt.target.result);
                    var s2 = zipped.length;
                    // queue.propValue = "base64,"+Base64.encode(zipped);
                    // queue.propValue = "binaryData,"+zipped.length+":"+zipped;
                    // queue.propValue = "base64,"+btoa(zipped);
                    context.fileContent = "gzip,"+btoa(evt.target.result);                            	
                    var t2 = performance.now();
                    var s3 = queue.propValue.length;
                    console.log("ZIP time:"+(t2-t1)/1000.0 + " sec, size:"+s1 / 1024 +" / "+s2/1024+" / "+s3/1024 + " Kb, ratio:"+(s3/s1 * 100.0)+"%")
                } else {
                    context.fileContent = "base64,"+btoa(evt.target.result);
                }
            } catch(e) { console.error(e); }
            // callback
            if(typeof next_step === 'function')
                next_step(context);
        };
        reader.onerror = function (evt) {
            console.error("ERROR: file read error");
            context.fileContent = null;
            if(typeof next_step === 'function')
                next_step(context);
        };
    },
    
    onNewGrid:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            Liquid.startPopup('liquidSelectTableColumns', window.liquidSelectTableColumns);
            var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
            selectorLiquid.tableJson.caption = "New grid : <b>select columns</b>";
            selectorLiquid.tableJson.database = liquid.tableJson.database;
            selectorLiquid.tableJson.schema = liquid.tableJson.schema;
            var table = liquid.tableJson.table;
            var ftIndex1B = Liquid.getForeignTableIndex(liquid);
            if(ftIndex1B) { // work on liquid.foreignTables[].options
                liquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
                table = liquid.tableJson.table;
            }            
            selectorLiquid.tableJson.table = table;
            Liquid.loadData(selectorLiquid, null, "newGrid");
            selectorLiquid.onPostClosed = "LiquidEditing.onNewGridProcess('"+obj_id+"',"+ftIndex1B+")";
            if(typeof event === 'object') event.stopPropagation();
        }
    },    
    onNewGridProcess:function(obj_id, ftIndex1B) {
        var liquid = Liquid.getLiquid(obj_id);
        if(liquid) {
            var nameItems = obj_id.split(".");
            var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
            if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                if(selectorLiquid.tableJson.selections) {
                    if(selectorLiquid.tableJson.selections.length) {
                        var sels = selectorLiquid.tableJson.selections;
                        if(nameItems[1] === 'newGrid') {
                            var cols = "";
                            for(var i=0; i<sels.length; i++) {
                                cols += "[" + sels[i]["COLUMN"] + "]";
                            }
                            var gridName = prompt("Enter grid name", "new grid "+(liquid.tableJson.grids?liquid.tableJson.grids.length+1:1));
                            if(gridName) {
                                var gridNumColumns = prompt("Enter grid no. columns", "1");
                                if(gridNumColumns) {
                                    var nCols = Number(gridNumColumns) > 0 ? Number(gridNumColumns) : 1;
                                    var nRows = Math.ceil(sels.length / nCols);
                                    var gridColumns = [];
                                    
                                    for(var i=0; i<sels.length; i++) {
                                        var gridColumn = { name:sels[i]["COLUMN"], tooltip:sels[i]["REMARKS"], label:sels[i]["COLUMN"].replace("_", " "), row:Math.floor(i/nCols), col:(i%nCols) };
                                        gridColumns.push( gridColumn );                                        
                                        if(ftIndex1B) {
                                            // TODO : add column ?
                                            tagetLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
                                            var iField1B = Liquid.solveGridField(tagetLiquid, gridColumn);
                                            if(iField1B <= 0) {
                                                var listColumn = { name:sels[i]["COLUMN"], visible:false };
                                                tagetLiquid.tableJsonSource.columns.push(listColumn);
                                                tagetLiquid.tableJsonSource.columnsResolved = false;
                                            }
                                        } else {
                                            var iField1B = Liquid.solveGridField(liquid, gridColumn);
                                            if(iField1B <= 0) {
                                                var listColumn = { name:sels[i]["COLUMN"], visible:false };
                                                liquid.tableJsonSource.columns.push(listColumn);
                                                liquid.tableJsonSource.columnsResolved = false;
                                            }
                                        }
                                    }
                                    if(typeof liquid.tableJsonSource.grids === 'undefined' || !liquid.tableJsonSource.grids) liquid.tableJsonSource.grids = [];
                                    var newGridJson = { name:gridName, title:gridName, tooltip:"", icon:"", nRows:nRows, nCols:nCols, columns:gridColumns };
                                    try { console.log("INFO: new grid json : \n"+JSON.stringify(newGridJson)); } catch(e) { console.error(e); }
     
                                    // adding the property...
                                    Liquid.addProperty(liquid, ftIndex1B, "grids", newGridJson);                                    
                                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                                }
                            }                            
                        } else {
                            console.error("ERROR : Unrecognized taget");
                        }
                    } else {
                        console.warn("ERROR : no column selected");
                    }
                }
            }
        }
    },    
    onNewLayout:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            var table = liquid.tableJson.table;
            var ftIndex1B = Liquid.getForeignTableIndex(liquid);
            if(ftIndex1B) { // work on liquid.foreignTables[].options
                liquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
                table = liquid.tableJson.table;
            }            
            if(typeof event === 'object') event.stopPropagation();
            Liquid.onNewLayoutProcess(obj_id,ftIndex1B);
        }
    },    
    onNewLayoutProcess:function(obj_id, ftIndex1B) {
        var liquid = Liquid.getLiquid(obj_id);
        if(liquid) {
            if(typeof liquid.tableJsonSource.layouts === 'undefined' || !liquid.tableJsonSource.layouts) liquid.tableJsonSource.layouts = [];
            var layoutName = "Layout" + (liquid.tableJsonSource.layouts.length > 0 ? (liquid.tableJsonSource.layouts.length+1) : "");
            var nRows = "";
            var newLayoutJson = { name:layoutName, tooltip:"", source:"url(./layouts/myLayout.jsp)", sourceForInsert:"url(./layouts/myLayoutForInsert.jsp)", nRows:-1 };
            try { console.log("INFO: new layout json : \n"+JSON.stringify(newLayoutJson)); } catch(e) { console.error(e); }

            //  to accees need layput built ( liquid.foreignTables[].option.layouts[]... )
            //  better user options in layout tab
            // if(!isDef(liquid.onLoaded)) liquid.srcLiquid.onLoaded = [];
            // liquid.onLoaded.push ( function() { LiquidEditing.onContextMenu({target:{classList:["liquidOptionsLayout"], id:obj_id}}); } );

            // adding the property...
            Liquid.addProperty(liquid, ftIndex1B, "layouts", newLayoutJson);
            Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
        }
    },    
    onNewFilters:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            Liquid.startPopup('liquidSelectTableColumns', window.liquidSelectTableColumns);
            var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
            selectorLiquid.tableJson.caption = "New Liquid Filters : </b>select columns</b>";
            selectorLiquid.tableJson.database = liquid.tableJson.database;
            selectorLiquid.tableJson.schema = liquid.tableJson.schema;
            selectorLiquid.tableJson.table = liquid.tableJson.table;
            var ftIndex1B = Liquid.getForeignTableIndex(liquid);
            if(ftIndex1B) { // work on liquid.foreignTables[].options
                liquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
            }            
            Liquid.loadData(selectorLiquid, null, "newFilter");
            selectorLiquid.onPostClosed = "LiquidEditing.onNewFiltersProcess('"+obj_id+"',"+ftIndex1B+")";
            if(typeof event === 'object') event.stopPropagation();
        }
    },    
    onNewFiltersProcess:function(obj_id, ftIndex1B) {
        var liquid = Liquid.getLiquid(obj_id);
        if(liquid) {
            var nameItems = obj_id.split(".");
            var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
            if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                if(selectorLiquid.tableJson.selections) {
                    if(selectorLiquid.tableJson.selections.length) {
                        var sels = selectorLiquid.tableJson.selections;
                        if(nameItems[1] === 'newFilters' || nameItems[1] === 'newFilter') {
                            var cols = "";
                            for(var i=0; i<sels.length; i++) {
                                cols += "[" + sels[i]["COLUMN"] + "]";
                            }
                            var filtersName = "newFilter";
                            if(nameItems[1] === 'newFilters') {
                                filtersName = prompt("Enter filters name", "Filter tab "+(liquid.tableJson.filters?(Array.isArray(liquid.tableJsonSource.filters)?liquid.tableJson.filters.length+1:1):1));
                            }
                            if(filtersName) {
                                var filterNumColumns = 1;
                                if(nameItems[1] === 'newFilters') {
                                    filterNumColumns = prompt("Enter filters no. columns", "1");
                                    if(filterNumColumns <= 0) filterNumColumns = 1;
                                    if(filterNumColumns > 1000) filterNumColumns = 1000;
                                }
                                if(filterNumColumns) {
                                    var nCols = Number(filterNumColumns) > 0 ? Number(filterNumColumns) : 1;
                                    var nRows = Math.ceil(sels.length / nCols);
                                    var filtersColumns = [];
                                    
                                    if(nameItems[1] === 'newFilter') { 
                                        nCols = "";
                                        nRows = "";
                                    }
                                    for(var i=0; i<sels.length; i++) {
                                        var filtersColumn = { name:sels[i]["COLUMN"], tooltip:sels[i]["REMARKS"], label:sels[i]["COLUMN"], row:nCols?(i/nCols):'', col:nCols?(i%nCols):'' };
                                        filtersColumns.push( filtersColumn );
                                        var iField1B = Liquid.solveGridField(liquid, filtersColumn);
                                        if(iField1B <= 0) { // Add column if not in list
                                            var listColumn = { name:sels[i]["COLUMN"], visible:false };
                                            liquid.tableJsonSource.columns.push(listColumn);
                                            liquid.tableJsonSource.columnsResolved = false;
                                        }
                                    }
                                    if(!isDef(liquid.curFilter)) liquid.curFilter = 0;
                                    if(!isDef(liquid.tableJsonSource.filters)) liquid.tableJsonSource.filters = [];
                                    if(!Array.isArray(liquid.tableJsonSource.filters)) {
                                        liquid.curFilter = 0;
                                        liquid.tableJsonSource.filters = [ liquid.tableJsonSource.filters ];                                        
                                    } else {
                                        if(!isDef(liquid.tableJsonSource.filters[0]) || !liquid.tableJsonSource.filters.length) {
                                            var newFiltersJson = { name:"", title:"", tooltip:"", icon:"", nRows:filtersColumns.length/2, nCols:2, columns:[] };
                                            liquid.tableJsonSource.filters.push( newFiltersJson );
                                            liquid.curFilter = 0;
                                        }
                                    }
                                    if(nameItems[1] === 'newFilters') {
                                        var newFiltersJson = { name:filtersName, title:filtersName, tooltip:"", icon:"", nRows:nRows, nCols:nCols, columns:filtersColumns };
                                        try { console.log("INFO: new filters json : \n"+JSON.stringify(newFiltersJson)); } catch(e) { console.error(e); }
                                        // adding the property...
                                        Liquid.addProperty(liquid, ftIndex1B, "filters", newFiltersJson);
                                        
                                    } else if(nameItems[1] === 'newFilter') {
                                        LiquidEditing.addFilterToGroup(liquid, ftIndex1B, liquid.curFilter, filtersColumns, true);
                                    }
                                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                                }
                            }
                        } else {
                            console.error("ERROR : Unrecognized taget");
                        }
                    } else {
                        console.warn("ERROR : no column selected");
                    }
                }
            }
        }
    },    
    // Add one or more filters to the Filters Group at index 'curFilter'
    // TODO : test
    addFilterToGroup:function(liquid, ftIndex1B, curFilter, filtersColumns, bPrint) {
        var propName = "filters";
        if(ftIndex1B) {
            //
            // update from source the foreignTable
            //
            var foreignTable = liquid.tableJsonSource.foreignTables[ftIndex1B-1];
            if(!isDef(foreignTable.options)) foreignTable.options = { };
            if(!isDef(foreignTable.options[propName])) foreignTable.options[propName] = [];
            
            if(curFilter < foreignTable.options[propName].length) {
                for(var ic=0; ic<filtersColumns.length; ic++) {
                    var filterColumn = filtersColumns[ic];
                    if(bPrint) { try { console.log("INFO: new filter json : \n"+JSON.stringify(filterColumn)); } catch(e) { console.error(e); } }
                    foreignTable.options[propName][curFilter].columns.push( filterColumn );
                }
            } else {
                console.error("ERROR:addFilterToGroup() out of range");
            }
            
        } else if(isDef(liquid.sourceData) && isDef(liquid.sourceData.rootControlId)) {
            //
            // update from the foreign table the source
            //
            if(isDef(liquid.sourceData.sourceForeignTablesIndexes1B)) {
                var sourceLiquid = Liquid.getLiquid(liquid.sourceData.rootControlId);
                if(sourceLiquid) {
                    var foreignTable = sourceLiquid.tableJsonSource.foreignTables[liquid.sourceData.sourceForeignTablesIndexes1B-1];
                    if(!isDef(foreignTable.options)) foreignTable.options = { };
                    if(!isDef(foreignTable.options[propName])) foreignTable.options[propName] = [];

                    // if(curFilter > liquid.tableJsonSource.filters.length || curFilter < 0) curFilter = liquid.tableJsonSource.filters.length;
                    if(curFilter < liquid.tableJsonSource.filters.length) {
                        if(!isDef(liquid.tableJsonSource.filters[curFilter].columns)) liquid.tableJsonSource.filters[curFilter].columns = [];
                        for(var ic=0; ic<filtersColumns.length; ic++) {
                            var filterColumn = filtersColumns[ic];
                            if(bPrint) { try { console.log("INFO: new filter json : \n"+JSON.stringify(filterColumn)); } catch(e) { console.error(e); } }
                            liquid.tableJsonSource.filters[curFilter].columns.push( filterColumn );
                        }
                        // update all columns
                        foreignTable.options[propName][curFilter].columns = liquid.tableJsonSource.filters[curFilter].columns;

                        Liquid.setAskForSave(sourceLiquid, true);
                    } else {
                        console.error("ERROR:addFilterToGroup() out of range");
                    }
                } else {
                    console.error("ERROR : source "+propName+" update failed .. source control '"+liquid.sourceData.rootControlId+"' not found");
                }
            } else {
                console.error("ERROR : source "+propName+" update failed .. source foreign table not indexed");
            }
        } else {
            //
            // direct update
            //
            if(curFilter > liquid.tableJsonSource.filters.length || curFilter < 0) curFilter = liquid.tableJsonSource.filters.length;
            if(!isDef(liquid.tableJsonSource.filters[curFilter].columns)) liquid.tableJsonSource.filters[curFilter].columns = [];
            for(var ic=0; ic<filtersColumns.length; ic++) {
                var filterColumn = filtersColumns[ic];
                if(bPrint) { try { console.log("INFO: new filter json : \n"+JSON.stringify(filterColumn)); } catch(e) { console.error(e); } }
                liquid.tableJsonSource.filters[curFilter].columns.push( filterColumn );
            }
            // liquid.tableJsonSource.filters[curFilter].name = "";
        }
    },            
    onNewCommand:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            if(liquid.tableJsonSource) {
                var ftIndex1B = Liquid.getForeignTableIndex(liquid);
                if(ftIndex1B) { // work on liquid.foreignTables[].options
                    liquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
                }            
                if(typeof liquid.tableJsonSource.commands === 'undefined' || !liquid.tableJsonSource.commands) 
                    liquid.tableJsonSource.commands = [];
                var command = {};
                var userCmdName = prompt("Enter command name", "new_command"+(liquid.tableJsonSource.commands.length+1));
                if(userCmdName) {
                    var cmdName = userCmdName.replace(/\ /g, "_");
                    var cmdText = userCmdName.replace(/_/g, " ");
                    var cmdImage = "new.png";
                    var userClientSide = prompt("Enter client side action", "alert(\"Command fired\")");
                    var userServerSide = prompt("Enter server side action", "com.company.application.class");                    
                    // custom command
                    newCommandJson = { name:cmdName, img:cmdImage, size:20, text:cmdText , server:userServerSide, params:["", ""], client:userClientSide };
                                        
                    // adding the property...
                    Liquid.addProperty(liquid, ftIndex1B, "commands", newCommandJson);                    
                    // Liquid.rebuildGrid(liquid, target_grid_coords.gridIndex);
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                }
            }
        } else {
            console.error("ERROR: target coords not detected");
        }
    },
    onNewActionBar:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            if(liquid.tableJsonSource) {
                if(typeof liquid.tableJsonSource.actions === 'undefined' || !liquid.tableJsonSource.actions)
                    liquid.tableJsonSource.actions = [];                
                var userCmdName = prompt("Enter action name", "new_action"+(liquid.tableJsonSource.actions.length+1));
                if(userCmdName) {
                    var cmdName = userCmdName.replace(/\ /g, "_");
                    var userClientSide = prompt("Enter client side action", "Liquid.close");
                    var userServerSide = prompt("Enter server side action", "com.company.application.class");
                    var command = { name:cmdName, img:"cancel.png", size:20, text:"Close", client:userClientSide, server:userServerSide };
                    liquid.tableJsonSource.actions.push(command);
                    try { console.log("INFO: updated table json : \n"+JSON.stringify(liquid.tableJsonSource)); } catch(e) { console.error(e); }
                    Liquid.setAskForSave(liquid, true);
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                }
            }
        }
    },
    onNewCommandBar:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            if(liquid.tableJsonSource) {
                if(typeof liquid.tableJsonSource.commands === 'undefined' || !liquid.tableJsonSource.commands)
                    liquid.tableJsonSource.commands = [ {name:"insert"} ,{name:"update"},{name:"delete"},{name:"previous"},{name:"next"} ];
                var userCmdName = prompt("Enter action name", "new_command"+(liquid.tableJsonSource.commands.length+1));
                if(userCmdName) {
                    var cmdName = userCmdName.replace(/\ /g, "_");
                    var userClientSide = prompt("Enter client side action", "Liquid.close");
                    var userServerSide = prompt("Enter server side action", "com.company.application.class");
                    var command = { name:cmdName, img:"cancel.png", size:20, text:"Close", client:userClientSide, server:userServerSide };
                    liquid.tableJsonSource.commands.push(command);
                    try { console.log("INFO: updated table json : \n"+JSON.stringify(liquid.tableJsonSource)); } catch(e) { console.error(e); }
                    Liquid.setAskForSave(liquid, true);
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                }
            }
        }
    },
    onNewEvent:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {            
            // TODO : dialogo tipo evento  + codice java callback
            LiquidEditing.onContextMenu({target:{classList:["liquidEvent"],id:liquid.controlId}});
        }
    },
    onNewEventOk:function(formId, obj) {
        var liquid = Liquid.getLiquid(obj);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            var event = {};
            var formObj = document.getElementById(formId);
            Liquid.formToObjectExchange(formObj, event);
            if(liquid.tableJsonSource) {
                if(typeof liquid.tableJsonSource.events === 'undefined' || !liquid.tableJsonSource.events)
                    liquid.tableJsonSource.events = [];
                liquid.tableJsonSource.events.push( event );
                Liquid.setAskForSave(liquid, true);
                Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
            }
        }
    },
    onNewWindowFromTableName:function(tableName, mode, parentObjId) {
        LiquidEditing.onContextMenuClose();
        Liquid.startPopup('liquidSelectTables', window.liquidSelectTables);
        var selectorLiquid = Liquid.getLiquid("liquidSelectTables");
        if(selectorLiquid) {
            selectorLiquid.lastAction = { name:"ok" };
            selectorLiquid.tableJson.selections = [ { TABLE:tableName } ];
            Liquid.close(selectorLiquid);
            Liquid.onNewWindowProcess('',(mode?mode:'winX'),(parentObjId?parentObjId:'WinXContainer'));
        } else console.error("ERROR: selector module not found");
    },
    onNewWindow:function(event, mode, parentObjId) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        LiquidEditing.onContextMenuClose();
        if(!glLiquidGenesisToken) {
            alert("In order to create new window you must Enable Project Mode by server-side");
            return;
        }
        Liquid.startPopup('liquidSelectTables', window.liquidSelectTables);
        var selectorLiquid = Liquid.getLiquid("liquidSelectTables");
        if(selectorLiquid) {
            if(mode === 'formX')
                selectorLiquid.tableJson.caption = "New FormX : <b>select table (if you need to store data)</b>";
            else
                selectorLiquid.tableJson.caption = "New Window : <b>select table</b>";
            selectorLiquid.tableJson.database = Liquid.curDatabase;
            selectorLiquid.tableJson.schema = Liquid.curSchema;
            selectorLiquid.tableJson.table = "";
            Liquid.loadData(selectorLiquid, null, "newWindow");
            selectorLiquid.onPostClosed = "LiquidEditing.onNewWindowProcess('"+obj_id+"'"+",'"+(mode?mode:'winX')+"','"+(parentObjId?parentObjId:'WinXContainer')+"')";
            if(typeof event === 'object') event.stopPropagation();
        } else console.error("ERROR: selector module not found");
    },
    onNewWindowProcess:function(obj_id, mode, parentObjId) {
        var selectorLiquid = Liquid.getLiquid("liquidSelectTables");
        if(selectorLiquid) {
            if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                if(selectorLiquid.tableJson.selections) {
                    if(selectorLiquid.tableJson.selections.length) {
                        var sels = selectorLiquid.tableJson.selections;
                        if(sels.length > 0) {
                            var table = sels[0]["TABLE"];
                            Liquid.startPopup('liquidSelectTableColumns', window.liquidSelectTableColumns);
                            var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
                            if(mode === 'formX')
                                selectorLiquid.tableJson.caption = "New forX : <b>select columns</b>";
                            else
                                selectorLiquid.tableJson.caption = "New Window : <b>select columns</b>";
                            selectorLiquid.tableJson.database = Liquid.curDatabase;
                            selectorLiquid.tableJson.schema = Liquid.curSchema;
                            selectorLiquid.tableJson.table = table;
                            Liquid.loadData(selectorLiquid, null, "newWindow");
                            selectorLiquid.onPostClosed = "LiquidEditing.onNewWindowProcess2('"+obj_id+"','"+mode+"','"+parentObjId+"','"+table+"')";
                            if(typeof event === 'object') event.stopPropagation();
                        } else {
                            
                        }
                    }
                }
            }
        } else console.error("ERROR: selector module not found");
    },
    onNewWindowProcess2:function(obj_id, mode, parentObjId, table) {
        var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
        if(selectorLiquid) {
            if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                var cols = [];
                if(selectorLiquid.tableJson.selections && selectorLiquid.tableJson.selections.length) {
                    var sels = selectorLiquid.tableJson.selections;
                    for(var i=0; i<sels.length; i++) {
                        cols.push( { name:sels[i]["COLUMN"], width:"!auto", label:sels[i]["COLUMN"] } );
                    }
                } else {
                    if(mode === 'formX') {
                        cols.push( { name:"data1" } );
                    }
                }
                
                if(cols) {
                    var defaultVal = "";
                    if(mode === 'winX')
                        defaultVal = ""+(table)+"";
                    else if(mode === 'formX')
                        defaultVal = "new formX_"+(table)+"";
                    else
                        defaultVal = "new_control_"+(glLiquids.length+1);

                    var parentObj = document.getElementById(parentObjId);
                    var width = Math.floor(parentObj.offsetWidth * 0.8 / 5) * 5;
                    var height = Math.floor(parentObj.offsetHeight * 0.8 / 5) * 5;
                    var controlId = prompt("Enter control name", defaultVal);
                    if(controlId) {
                        var copyCounter = 1;
                        var sourceControlId = controlId;
                        var checkLiquid = true;
                        while(checkLiquid) {
                            checkLiquid = Liquid.getLiquid(controlId);
                            if(checkLiquid) {
                                copyCounter++;
                                controlId = sourceControlId+"("+copyCounter+")";
                            }
                        }
                        var cmds = [];
                        if(mode === 'winX')
                            cmds = [ { name:"create" },{ name:"update" },{ name:"delete" },{ name:"copy" },{ name:"paste" },{ name:"next" },{ name:"previous" } ];
                        
                        liquidJson = {
                            database:Liquid.curDatabase
                            ,schema:Liquid.curSchema
                            ,table:table
                            ,columns:cols
                            ,foreignTables:"*"
                            ,commands:cmds
                            ,caption:controlId
                            ,mode:mode
                            ,parentObjId:parentObjId
                            ,autoFitColumns:true
                            ,width:width
                            ,height:height
                            ,resize:"both"
                            ,askForSave:true
                            ,editable:true
                        };
                        
                        if(mode === 'formX') {
                            liquidJson.navVisible = false;
                            liquidJson.autoInsert = false;
                            liquidJson.layouts = [ { name:"MyFormX", title:"My formX", tooltip:"My formX", icon:"", source:"url(liquidFormX.jsp)", nRows:1, overflow:"overlay" } ];
                            liquidJson.actions = [ 
                                 { name:"cancel", img:"cancel.png", size:20, text:"Annulla", client:"Liquid.close"  }
                                ,{ name:"ok", img:"add.png", size:20, text:"OK", server:"com.liquid.event.echo", client:["Liquid.close", "closeFormX()"] }
                            ];
                            liquidJson.listTabVisible = false;
                            liquidJson.layoutsTabVisible = false;
                            liquidJson.owner = "com.liquid.event";
                            liquidJson.events = [ { name:"onInserted", server:"com.liquid.event.onInsertedRow", params:[], client:"" } ];
                        }
    
                        if(Liquid.curDriver) liquidJson.driver = Liquid.curDriver; 
                        if(Liquid.curConnectionURL) liquidJson.connectionURL = Liquid.curConnectionURL;
                        liquidJson.token = glLiquidGenesisToken;
                        liquidJson.askForSave = true;
                        var newLiquid = new LiquidCtrl(controlId, controlId, JSON.stringify(liquidJson)
                                        , null
                                        , mode, parentObjId
                                        );
                        Liquid.setFocus(controlId);
                    }
                }
            }
        } else console.error("ERROR: selector module not found");
    },
    onNewWindowFromFileJson:function(obj_id, mode, parentObjId, file) {
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                LiquidEditing.onNewWindowFromJsonProcess(obj_id, mode, parentObjId, e.target.result);
            };
        })(file);
        reader.readAsText(file);
    },      
    onNewWindowFromJson:function(obj_id, mode, parentObjId) {
        LiquidEditing.onContextMenuClose();
        if(!glLiquidGenesisToken) {
            alert("In order to create new window you must Enable Project Mode by server-side");
            return;
        }
        var parentObj = document.getElementById(parentObjId);
        var width = Math.floor(parentObj.offsetWidth * 0.8 / 5) * 5;
        var height = Math.floor(parentObj.offsetHeight * 0.8 / 5) * 5;
        var liquidJsonString = prompt("Enter control json", "{}");
        return LiquidEditing.onNewWindowFromJsonProcess(obj_id, mode, parentObjId, liquidJsonString);
    },
    onNewWindowFromJsonProcess:function(obj_id, mode, parentObjId, liquidJsonString) {
        if(liquidJsonString) {
            var parentObj = document.getElementById(parentObjId);
            var width = Math.floor(parentObj.offsetWidth * 0.8 / 5) * 5;
            var height = Math.floor(parentObj.offsetHeight * 0.8 / 5) * 5;
            var liquidJson = JSON.parse(liquidJsonString);
            var controlId = liquidJson.controlId;
            if(!controlId) {
                controlId = "window-"+liquidJson.table;
            }
            if(controlId) {
                var copyCounter = 1;
                var sourceControlId = controlId;
                var checkLiquid = true;
                while(checkLiquid) {
                    checkLiquid = Liquid.getLiquid(controlId);
                    if(checkLiquid) {
                        copyCounter++;
                        controlId = sourceControlId+"("+copyCounter+")";
                    }
                }
                // liquidJson = { database:Liquid.curDatabase, schema:Liquid.curSchema, table:table, columns:cols, caption:controlId, mode:mode, parentObjId:parentObjId, autoFitColumns:true, width:width, height:height, resize:"both", askForSave:true };
                if(Liquid.curDriver) liquidJson.driver = Liquid.curDriver; 
                if(Liquid.curConnectionURL) liquidJson.connectionURL = Liquid.curConnectionURL;
                liquidJson.columnsResolved = null;
                liquidJson.columnsResolvedBy = null;
                liquidJson.token = glLiquidGenesisToken;
                new LiquidCtrl( controlId, controlId, JSON.stringify(liquidJson), 
                                null, 
                                mode, parentObjId );
            }
        }
    },
    onNewControlByForm:function(obj_id, parentObjId) {
        LiquidEditing.onContextMenuClose();
        if(!glLiquidGenesisToken) {
            alert("In order to create new window you must Enable Project Mode by server-side");
            return;
        }
        var mode = "";
        var parentObj = document.getElementById(parentObjId);
        var width = parentObj ? Math.floor(parentObj.offsetWidth * 0.8 / 5) * 5 : 0;
        var height = parentObj ? Math.floor(parentObj.offsetHeight * 0.8 / 5) * 5 : 0;
        var formName = prompt("Enter form name", "");
        return LiquidEditing.onNewControlByFormProcess(obj_id, mode, parentObjId, formName);
    },
    newControlByForm:function( formName, controlName ) {
        if(!glLiquidGenesisToken) {
            alert("In order to create new window you must Enable Project Mode by server-side");
            return;
        }
        var obj_id = null;
        var parentObjId = null;
        var mode = "";
        var parentObj = null;
        var width = parentObj ? Math.floor(parentObj.offsetWidth * 0.8 / 5) * 5 : 0;
        var height = parentObj ? Math.floor(parentObj.offsetHeight * 0.8 / 5) * 5 : 0;
        return LiquidEditing.onNewControlByFormProcess(obj_id, mode, parentObjId, formName);
    },
    onNewControlByFormProcess:function(obj_id, mode, parentObjId, formName) {
        if(formName) {
            var parentObj = document.getElementById(parentObjId);
            var width = parentObj ? Math.floor(parentObj.offsetWidth * 0.8 / 5) * 5 : 0;
            var height = parentObj ? Math.floor(parentObj.offsetHeight * 0.8 / 5) * 5 : 0;
            var formObj = document.getElementById(formName);
            if(formObj) {
                var controlId = formName.name ? formName.name : formName.id;
                if(!controlId) {
                    controlId = "FormToControl";
                }
                if(controlId) {
                    var copyCounter = 1;
                    var sourceControlId = controlId;
                    var checkLiquid = true;
                    while(checkLiquid) {
                        checkLiquid = Liquid.getLiquid(controlId);
                        if(checkLiquid) {
                            copyCounter++;
                            controlId = sourceControlId+"("+copyCounter+")";
                        }
                    }

                    var liquidJson = { columns:[], createIfMissing:true };
                    var frm_elements = formObj.elements;
                    if(frm_elements && frm_elements.length) {
                        for (var i = 0; i < frm_elements.length; i++) {
                            var formElement = frm_elements[i];
                            var dataType = 1;
                            name = Liquid.getFormElementId(formElement);
                            
                            var size = 0;
                            
                            if(formElement.type.toLowerCase() === 'datetime') {
                                dataType = 93;
                            } else if(formElement.type.toLowerCase() === 'date') {
                                dataType = 6;
                            } else if(formElement.type.toLowerCase() === 'time') {
                                dataType = 92;
                            } else if(formElement.type.toLowerCase() == 'text') {
                                size = formElement.size ? formElement.size : 512;
                            } else if(formElement.type.toLowerCase() == 'textarea') {
                                size = formElement.size ? formElement.size : 0;
                            } else if(formElement.type.toLowerCase() == 'file') {
                                size = formElement.size ? formElement.size : 0;
                            } else if(formElement.type.toLowerCase() == 'hidden') {
                                size = formElement.size ? formElement.size : 0;
                            }
                            if(name) {
                                var bAlreadyDefined = false;
                                for(var ic=0; ic<liquidJson.columns.length; ic++) {
                                    if(liquidJson.columns[ic].name === name) {
                                        bAlreadyDefined = true;
                                        break;
                                    }
                                }
                                if(!bAlreadyDefined) {
                                    liquidJson.columns.push( { name:name, type:dataType, size:size } );
                                }
                            } else {
                                console.warn('WARNING : element in the form discharged : missing name or id (see red berder)');
                                formElement.style.border = "2px solid red";
                            }
                        }
                    }
                    liquidJson.table = controlId;
                    liquidJson.database = Liquid.curDatabase;
                    liquidJson.schema = Liquid.curSchema;

                    // liquidJson = { database:Liquid.curDatabase, schema:Liquid.curSchema, table:table, columns:cols, caption:controlId, mode:mode, parentObjId:parentObjId, autoFitColumns:true, width:width, height:height, resize:"both", askForSave:true };
                    if(Liquid.curDriver) liquidJson.driver = Liquid.curDriver; 
                    if(Liquid.curConnectionURL) liquidJson.connectionURL = Liquid.curConnectionURL;
                    liquidJson.columnsResolved = null;
                    liquidJson.columnsResolvedBy = null;
                    liquidJson.token = glLiquidGenesisToken;
                    var result = new LiquidCtrl( controlId, controlId, JSON.stringify(liquidJson), 
                                    null, 
                                    mode, parentObjId );
                    if(result) {
                        Liquid.onSaveToServer(result);
                        
                    }
                }
            } else {
                alert("Form '"+formName+"' not found");
            }
        }
    },
    onNewColumns:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {            
            if(liquid.tableJsonSource) {
                Liquid.startPopup('liquidSelectTableColumns', window.liquidSelectTableColumns);
                var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
                selectorLiquid.tableJson.caption = "New Liquid Window : <b>select columns</b>";
                selectorLiquid.tableJson.database = Liquid.curDatabase;
                selectorLiquid.tableJson.schema = Liquid.curSchema;
                selectorLiquid.tableJson.table = liquid.tableJson.table;
                Liquid.loadData(selectorLiquid, null, "newColumn");
                selectorLiquid.onPostClosed = "LiquidEditing.onNewColumnsProcess('"+obj_id+"')";
            }
        }
    },
    onNewColumnsProcess:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        if(liquid) {
            var selectorLiquid = Liquid.getLiquid("liquidSelectTableColumns");
            if(selectorLiquid) {
                if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                    if(selectorLiquid.tableJson.selections) {
                        if(selectorLiquid.tableJson.selections.length) {
                            var sels = selectorLiquid.tableJson.selections;
                            var colsToAdd = [];
                            var colsToRemove = [];
                            for(var i=0; i<liquid.tableJson.columns.length; i++) {
                                colsToRemove.push(liquid.tableJson.columns[i].name);
                            }
                            for(var i=0; i<sels.length; i++) {
                                var col = Liquid.getColumn(liquid, sels[i]["COLUMN"]);
                                if(col) {
                                    colsToRemove.splice(col.name, 1);
                                } else {
                                    colsToAdd.push(sels[i]["COLUMN"]);
                                }
                            }
                            console.log("INFO: columns added:"+colsToAdd.toString() + "...");
                            console.log("INFO: columns removed:"+colsToRemove.toString() + "...");
                            
                            // rimozioe e aggiunta colonne
                            if(liquid.columnsApi) {
                                for(var ic=0; ic<colsToAdd.length; ic++) {
                                    liquid.columnsApi(liquid, "add", colsToAdd[ic], liquid.columnsApiParams);
                                }
                                for(var ic=0; ic<colsToRemove.length; ic++) {
                                    liquid.columnsApi(liquid, "delete", colsToRemove[ic], liquid.columnsApiParams);
                                }
                            }
                            Liquid.setAskForSave(liquid, true);
                            Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                        }
                    }
                }            
            }
        }
    },
    onColumnsManager:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            var ftIndex1B = Liquid.getForeignTableIndex(liquid);
            var tagetLiquid = liquid;
            var foreignTable = null;
            if(ftIndex1B) { // work on liquid.foreignTables[].options
                tagetLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
                foreignTable = liquid.tableJsonSource.foreignTables[ftIndex1B-1];
            } else if(isDef(liquid.sourceData) && isDef(liquid.sourceData.rootControlId)) {
                // update from the foreign table the source
                if(isDef(liquid.sourceData.sourceForeignTablesIndexes1B)) {
                    var sourceLiquid = Liquid.getLiquid(liquid.sourceData.rootControlId);
                    if(sourceLiquid) {
                        foreignTable = sourceLiquid.tableJsonSource.foreignTables[liquid.sourceData.sourceForeignTablesIndexes1B-1];
                    }
                }
            }
            if(foreignTable){
                if(isDef(foreignTable.options)) {
                    if(isDef(foreignTable.options.columns)) {
                        if(typeof foreignTable.options.columns === 'string') {
                            alert("WARNING: Unable to manage columns define by expression\n\nYou should detect manually the source control and modify it");
                            console.error("ERROR: unsupported case");
                            return;
                        }
                    }
                }
            }            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', glLiquidServlet + '?operation=getColumnsManager&controlId=' + tagetLiquid.controlId);
            xhr.send(JSON.stringify(liquid.tableJsonSource));
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4) {
                    if(xhr.status === 200) {
                        try {
                            if(xhr.responseText) {
                                Liquid.startPopup('liquidColumnsManager', xhr.responseText);
                                var selectorLiquid = Liquid.getLiquid("liquidColumnsManager");
                                selectorLiquid.tableJson.caption = "Columns Manager : <b>"+liquid.controlId+"</b>";
                                Liquid.loadData(selectorLiquid, null, "columnsManager");
                                selectorLiquid.onPostClosed = "LiquidEditing.onColumnsManagerProcess('"+liquid.controlId+"')";
                            } else
                                console.error(xhr.responseText);
                        } catch (e) {
                            console.error(xhr.responseText);
                            alert("FATAL ERROR: unsupported condition in columsn manager... error:"+e);
                        }
                    }
                }
            };
        }
    },
    onColumnsManagerProcess:function(controlId) {
        var liquid = Liquid.getLiquid(controlId);
        if(liquid) {            
            var selectorLiquid = Liquid.getLiquid("liquidColumnsManager");
            if(selectorLiquid) {
                if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', glLiquidServlet + '?operation=setColumnsManager&controlId=' + liquid.controlId);
                    var nodes = selectorLiquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                    var dataSet = [];
                    for(var node=0; node<nodes.length; node++) dataSet.push(nodes[node].data);
                    xhr.send("{\"dataSet\":"+JSON.stringify(dataSet)+"}");
                    xhr.onreadystatechange = function() {
                        if(xhr.readyState === 4) {
                            if(xhr.status === 200) {
                                try {
                                    if(xhr.responseText) {
                                        var resltJson = JSON.parse(xhr.responseText);
                                        // "{ "columns":... , "log":[...]}"
                                        try { console.log("INFO: "+resltJson.log); } catch (e) { }

                                        var targetColumns = null;
                                        var ftIndex1B = Liquid.getForeignTableIndex(liquid);
                                        var foreignTable = null;                                        
                                        if(ftIndex1B) { 
                                            // update from source the foreignTable
                                            foreignTable = liquid.tableJsonSource.foreignTables[ftIndex1B-1];
                                        } else if(isDef(liquid.sourceData) && isDef(liquid.sourceData.rootControlId)) { 
                                            // update from the foreign table the source
                                            if(isDef(liquid.sourceData.sourceForeignTablesIndexes1B)) {
                                                var sourceLiquid = Liquid.getLiquid(liquid.sourceData.rootControlId);
                                                if(sourceLiquid) {
                                                    foreignTable = sourceLiquid.tableJsonSource.foreignTables[liquid.sourceData.sourceForeignTablesIndexes1B-1];
                                                }
                                            }
                                        }
                                        if(foreignTable) {
                                            if(!isDef(foreignTable.options)) foreignTable.options = { };
                                            if(!isDef(foreignTable.options.columns)) foreignTable.options.columns = [];
                                            targetColumns = foreignTable.options.columns;
                                        } else {
                                            targetColumns = liquid.tableJsonSource.columns;
                                        }
                                        
                                        for(var ic=0; ic<resltJson.updatedColumns.length; ic++) {
                                            for(var ics=0; ics<targetColumns.length; ics++) {
                                                if(targetColumns[ics].name === resltJson.updatedColumns[ic].name) {
                                                    Liquid.overlayObjectContent( targetColumns[ics], resltJson.updatedColumns[ic] );
                                                    Liquid.setAskForSave(liquid, true);
                                                    break;
                                                }
                                            }
                                        }

                                        for(var ic=0; ic<resltJson.addedColumns.length; ic++) {
                                            if(resltJson.addedColumns[ic].name) {
                                                targetColumns.push( resltJson.addedColumns[ic] );
                                                Liquid.setAskForSave(liquid, true);
                                            }
                                        }
                                        for(var ic=0; ic<resltJson.deletedColumns.length; ic++) {
                                            var name = resltJson.deletedColumns[ic].name;
                                            if(name) {
                                                for(var index=0; index<targetColumns.length; index++) {
                                                    if(targetColumns[index].name === name) {
                                                        try { console.log("INFO: on "+liquid.controlId+" removed column "+name); } catch (e) { }
                                                        targetColumns.splice(index, 1);
                                                        Liquid.setAskForSave(liquid, true);
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        liquid.tableJsonSource.columnsResolved = false;
                                        Liquid.rebuild( liquid, liquid.outDivObjOrId, liquid.tableJsonSource );
                                    } else console.error("ERROR: "+xhr.responseText);
                                } catch (e) {
                                    console.error(xhr.responseText);
                                }
                            }
                        }
                    };
                }
            }
        }
    },
    onNewGridLookup:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            var nameItems = obj_id.split(".");
            Liquid.startPopup('liquidSelectForeignKeys', window.liquidSelectForeignKeys);
            var selectorLiquid = Liquid.getLiquid("liquidSelectForeignKeys");
            selectorLiquid.tableJson.caption = "New Liquid Lookup : <b>create or select foreign key</b>";
            selectorLiquid.tableJson.database = liquid.tableJson.database;
            selectorLiquid.tableJson.schema = liquid.tableJson.schema;
            selectorLiquid.tableJson.table = liquid.tableJson.table;
            var grid_coords = Liquid.getGridCoords(liquid, obj_id);
            if(grid_coords) {
                var gridControl = grid_coords.control;
                if(gridControl) {
                    var col = grid_coords.column;
                    selectorLiquid.tableJson.column = col.name;
                }
            }
            Liquid.loadData(selectorLiquid, null, "newGridLookup");
            selectorLiquid.onPostClosed = "LiquidEditing.onNewGridLookupProcess('"+obj_id+"')";
            Liquid.autoInsert(selectorLiquid);
            if(typeof event === 'object') event.stopPropagation();
        }
    },
    onNewGridLookupProcess:function(obj_id) {
        var liquid = Liquid.getLiquid(obj_id);
        if(liquid) {
            var selectorLiquid = Liquid.getLiquid("liquidSelectForeignKeys");
            if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok" && selectorLiquid.tableJson.selections) {
                var sel = selectorLiquid.tableJson.selections[0];
                if(sel) {
                    Liquid.startPopup('liquidSelectTableColumns', window.liquidSelectTableColumns);
                    var selectorColumnLiquid = Liquid.getLiquid("liquidSelectTableColumns");
                    selectorColumnLiquid.tableJson.caption = "New Lookup : <b>select columns to show</b>";
                    selectorColumnLiquid.tableJson.database = liquid.tableJson.database;
                    selectorColumnLiquid.tableJson.schema = liquid.tableJson.schema;
                    selectorColumnLiquid.tableJson.table = sel["FOREIGN_TABLE"];
                    Liquid.loadData(selectorColumnLiquid, null, "newGridLookup");
                    selectorColumnLiquid.onPostClosed = "LiquidEditing.onNewGridLookupProcess2('"+obj_id+"')";
                }
            }
        }
    },
    onNewGridLookupProcess2:function(obj_id, selectorLiquid) {
        var liquid = Liquid.getLiquid(obj_id);
        if(liquid) {
            var nameItems = obj_id.split(".");
            var selectorLiquid = Liquid.getLiquid("liquidSelectForeignKeys");
            var selectorColumnLiquid = Liquid.getLiquid("liquidSelectTableColumns");
            if(selectorColumnLiquid.lastAction && selectorColumnLiquid.lastAction.name==="ok" && selectorColumnLiquid.tableJson.selections) {
                var colSel = selectorColumnLiquid.tableJson.selections[0];
                if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok" && selectorLiquid.tableJson.selections) {
                    var rootLiquid = Liquid.getRootLiquid(liquid);
                    for(var isel=0; isel<selectorLiquid.tableJson.selections.length; isel++) {
                        var sel = selectorLiquid.tableJson.selections[isel];
                        if(sel) {
                            var grid_coords = Liquid.getGridCoords(liquid, obj_id);
                            if(grid_coords) {
                                var gridControl = grid_coords.control;
                                if(gridControl) {
                                    var col = grid_coords.column;
                                    if(col) {
                                        if(typeof col.isReflected === 'undefined' || col.isReflected !== true) {
                                            var columnsToShow = [];
                                            for(var isc=0; isc<selectorColumnLiquid.tableJson.selections.length; isc++) {
                                                columnsToShow.push( { name:selectorColumnLiquid.tableJson.selections[isc]["COLUMN"] } );
                                            }
                                            var globalVarName = "gl"+capitalizeFirstLetter(sel["FOREIGN_TABLE"].toCamelCase())+"JSON";
                                            var controlName = sel["FOREIGN_TABLE"];
                                            var controlId = null;
                                            var foreignLiquid = Liquid.getLiquid(sel["FOREIGN_TABLE"]);
                                            if(foreignLiquid) {
                                                controlId = sel["FOREIGN_TABLE"];
                                            } else {
                                                foreignLiquid = Liquid.getProperty(sel["FOREIGN_TABLE"]);
                                                if(foreignLiquid) {
                                                    controlId = foreignLiquid;
                                                } else {
                                                    foreignLiquid = Liquid.getProperty(globalVarName);
                                                    if(foreignLiquid) { // point to js global var
                                                        controlId = globalVarName+".json";
                                                    }                                                    
                                                }
                                            }
                                            if(!isDef(controlId)) {
                                                var msg = "Unable to find a control to use by the lookup : "
                                                        +"\n\nControl "+controlName+" not found"
                                                        +"\n\nGlobal var "+globalVarName+" not found"
                                                        +"\n\n\nYou should define it manually (by \"lookup\":\"...\" property) ...";
                                                alert(msg);
                                                console.error(msg);
                                                controlId = sel["FOREIGN_TABLE"];
                                            }
                                            
                                            var lookupField = colSel["COLUMN"];
                                            var newOptionsJson = {
                                                lookupField:lookupField,
                                                idColumn:sel["FOREIGN_COLUMN"],
                                                targetColumn:sel["COLUMN"],
                                                navVisible:true,
                                                autoSelect:false,
                                                status:"closed",
                                                height:Liquid.defaultLookupHeight,
                                                columns:columnsToShow };
                                            // verify if exist
                                            var new_col_name = sel["FOREIGN_TABLE"] + "." + colSel["COLUMN"];
                                            var new_col_label = colSel["COLUMN"].replace(/\_/g, " ")

                                            if(confirm("Hide column "+col.name+" ?")) {
                                                col.visible = false;
                                            }
                                            
                                            if(!isDef(sel["COLUMN"])) {
                                                sel["COLUMN"] = col.name;
                                            }
                                            
                                            // new column on table columns
                                            var new_col = { 
                                                 name: new_col_name
                                                ,foreignTable: sel["FOREIGN_TABLE"]
                                                ,foreignColumn: sel["FOREIGN_COLUMN"] 
                                                ,column: sel["COLUMN"]
                                            };
                                            new_col.lookup = controlId;
                                            new_col.options = newOptionsJson;
                                            
                                            if(liquid.columnsApi) {
                                               liquid.columnsApi(liquid, "add", new_col, liquid.columnsApiParams);
                                            }

                                            // replace grid column pointer
                                            var updatedGrid = null;
                                            if(liquid.gridsApi) {
                                                updatedGrid = liquid.gridsApi(liquid, "update", grid_coords.gridIndex, grid_coords.itemIndex, { name:new_col_name, label:new_col_label }, liquid.gridsApiParams );
                                            }

                                            try { console.log("INFO: grid field : \n"+JSON.stringify(updatedGrid.columns[grid_coords.itemIndex])); } catch(e) { console.error(e); }
                                            try { console.log("INFO: new column : \n"+JSON.stringify(new_col)); } catch(e) { console.error(e); }
                                        }
                                    }
                                }                                                
                            }
                        }
                    }                    
                    Liquid.setAskForSave(rootLiquid, true);
                    Liquid.rebuild(rootLiquid, rootLiquid.outDivObjOrId, rootLiquid.tableJsonSource);
                }
            }
        }
    },
    onSetDatabase:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        LiquidEditing.onContextMenuClose();
        Liquid.startPopup('liquidSelectDatabases', window.liquidSelectDatabases);
        var selectorLiquid = Liquid.getLiquid("liquidSelectDatabases");
        if(selectorLiquid) {
            selectorLiquid.tableJson.caption = "<b>Select current Database</b>";
            selectorLiquid.tableJson.database = Liquid.curDatabase;
            Liquid.loadData(selectorLiquid, null, "setDatabase");
            selectorLiquid.onPostClosed = "LiquidEditing.onSetDatabaseProcess('"+obj_id+"')";
            if(typeof event === 'object') event.stopPropagation();
        } else console.error("ERROR: selector module not found");
    },
    onSetDatabaseProcess:function(obj_id) {
        var selectorLiquid = Liquid.getLiquid("liquidSelectDatabases");
        if(selectorLiquid) {
            if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                if(selectorLiquid.tableJson.selections) {
                    if(selectorLiquid.tableJson.selections.length) {
                        var sels = selectorLiquid.tableJson.selections;
                        Liquid.curDatabase = sels[0]["DATABASE"];
                    }
                }
            }
        }
    },
    onSetSchema:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        LiquidEditing.onContextMenuClose();
        Liquid.startPopup('liquidSelectSchemas', window.liquidSelectSchemas);
        var selectorLiquid = Liquid.getLiquid("liquidSelectSchemas");
        if(selectorLiquid) {
            selectorLiquid.tableJson.caption = "<b>Select current Schema</b>";
            selectorLiquid.tableJson.database = Liquid.curDatabase;
            selectorLiquid.tableJson.schema =  Liquid.curSchema;
            Liquid.loadData(selectorLiquid, null, "setSchema");
            selectorLiquid.onPostClosed = "LiquidEditing.onSetSchemaProcess('"+obj_id+"')";
            if(typeof event === 'object') event.stopPropagation();
        } else console.error("ERROR: selector module not found");
    },    
    onSetSchemaProcess:function(obj_id) {
        var selectorLiquid = Liquid.getLiquid("liquidSelectSchemas");
        if(selectorLiquid) {
            if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                if(selectorLiquid.tableJson.selections) {
                    if(selectorLiquid.tableJson.selections.length) {
                        var sels = selectorLiquid.tableJson.selections;
                        Liquid.curSchema = sels[0]["SCHEMA"];
                    } else {
                        console.info("INFO: setting schema as default");
                        Liquid.curSchema = "";
                    }
                }
            }
        }
    },
    onLiquidAssets:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        LiquidEditing.onContextMenuClose();
        Liquid.startPopup('liquidAssets', window.liquidAssets);
    },
    onLiquidRoles:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        LiquidEditing.onContextMenuClose();
        Liquid.startPopup('liquidRoles', window.liquidRoles);
    },
    onLiquidRolesAssets:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        LiquidEditing.onContextMenuClose();
        Liquid.startPopup('liquidRolesAssets', window.liquidRolesAssets);
    },
    onLiquidUsersRoles:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        LiquidEditing.onContextMenuClose();
        Liquid.startPopup('liquidUsersRoles', window.liquidUsersRoles);
    },
    onLiquidUsersAssets:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        LiquidEditing.onContextMenuClose();
        Liquid.startPopup('liquidUsersAssets', window.liquidUsersAssets);
    },
    onLiquidLoginUsers:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        LiquidEditing.onContextMenuClose();
        Liquid.startPopup('liquidLoginUsers', window.liquidLoginUsers);
    },
    onMenuOptions:function(obj) {
        LiquidEditing.onContextMenu({target:{classList:["liquidMenuX"],id: typeof obj === 'string' ? obj : obj.id}});
    },
    onLayoutOptions:function(obj) {
        LiquidEditing.onContextMenu({target:{classList:["liquidLayoutOptions"],id: typeof obj === 'string' ? obj : obj.id}});
    },
    onGridOptions:function(obj) {
        LiquidEditing.onContextMenu({target:{classList:["liquidGridOptions"],id: typeof obj === 'string' ? obj : obj.id}});
    },
    onOptions:function(obj) {
        LiquidEditing.onContextMenu({target:{classList:["liquidOptions"],id: typeof obj === 'string' ? obj : obj.id}});
    },
    onLiquidOptions:function() {
        LiquidEditing.onContextMenu({target:{classList:["liquidGeneralOptions"],id:null}});
    },
    onOptionsOk:function(objId, controlId) {
        var obj = document.getElementById(objId);
        var liquid = Liquid.getLiquid(controlId);
        if(obj && liquid) {
            var ftIndex1B = Liquid.getForeignTableIndex(liquid);
            var tagetLiquid = liquid;
            if(ftIndex1B) { // work on liquid.foreignTables[].options
                tagetLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
                var foreignTable = liquid.tableJsonSource.foreignTables[ftIndex1B-1];
                if(typeof foreignTable.options === 'undefined') foreignTable.options = { };
                Liquid.formToObjectExchange(obj, foreignTable.options);
            }
            if(Liquid.formToObjectExchange(obj, tagetLiquid.tableJsonSource)) {
                try { console.log("INFO: updated table json : \n"+JSON.stringify(tagetLiquid.tableJsonSource)); } catch(e) { console.error(e); }
                Liquid.setAskForSave(liquid, true);
                Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
            } else {
                console.log("INFO: no changes to apply");
            }
        }
    },
    onGridOptionsOk:function(objId, controlId, gridName) {
        var obj = document.getElementById(objId);
        var liquid = Liquid.getLiquid(controlId);
        if(obj && liquid && gridName) {
            var ftIndex1B = Liquid.getForeignTableIndex(liquid);
            var gridIndex1B = Liquid.getGridIndexByName(liquid, gridName);
            if(gridIndex1B) {
                var grid = liquid.tableJson.grids[gridIndex1B-1];
                var newOptions = {};
                if(Liquid.formToObjectExchange(obj, newOptions)) {
                    Liquid.updateProperty(liquid, ftIndex1B, "grids", gridIndex1B-1, newOptions);
                    if(!isDef(liquid.sourceData)) liquid.sourceData = {};
                    liquid.sourceData.tempCurrentTab = gridIndex1B;
                    Liquid.setAskForSave(liquid, true);
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                    try { console.log("INFO: updated table json : \n"+JSON.stringify(liquid.tableJsonSource.grids[gridIndex1B-1])); } catch(e) { console.error(e); }
                } else {
                    console.log("INFO: no changes to apply");
                }
            }
        }
    },
    onGridFieldOptionsOk:function(objId, controlId, gridName, fieldName) {
        var obj = document.getElementById(objId);
        var liquid = Liquid.getLiquid(controlId);
        if(obj && liquid && gridName) {
            var ftIndex1B = Liquid.getForeignTableIndex(liquid);
            var gridIndex1B = Liquid.getGridIndexByName(liquid, gridName);
            if(gridIndex1B) {
                var grid = liquid.tableJson.grids[gridIndex1B-1];
                var newOptions = {};
                if(Liquid.formToObjectExchange(obj, newOptions)) {
                    var sourceObjects = Liquid.getSourceProperty(liquid, ftIndex1B, "grids", gridIndex1B-1);
                    if(sourceObjects) {
                        var sourceLiquid = sourceObjects[0];
                        var sourceProperty = sourceObjects[1];
                        var updateDone = false;
                        for(var i=0; i<sourceProperty.columns.length; i++) {
                            if(sourceProperty.columns[i].name === fieldName) {
                                Liquid.overlayObjectContent(sourceProperty.columns[i], newOptions);
                                updateDone = true;
                                break;
                            }
                        }
                        if(sourceProperty != liquid.tableJsonSource.grids[gridIndex1B-1]) { // reflect on runtime area
                            sourceProperty = liquid.tableJsonSource.grids[gridIndex1B-1]
                            for(var i=0; i<sourceProperty.columns.length; i++) {
                                if(sourceProperty.columns[i].name === fieldName) {
                                    Liquid.overlayObjectContent(sourceProperty.columns[i], newOptions);
                                    updateDone = true;
                                    break;
                                }
                            }
                        }
                        if(updateDone) {
                            try { console.log("INFO: updated table json : \n"+JSON.stringify(liquid.tableJsonSource.grids[gridIndex1B-1])); } catch(e) { console.error(e); }
                            if(!isDef(liquid.sourceData)) liquid.sourceData = {};
                            liquid.sourceData.tempCurrentTab = gridIndex1B;                    
                            Liquid.setAskForSave(sourceLiquid, true);
                            Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                        }
                    }
                } else {
                    console.log("INFO: no changes to apply");
                }
            }
        }
    },            
    onLiquidOptionsOk:function(objId) {
        var obj = document.getElementById(objId);        
        Liquid.formToObjectExchange(obj, Liquid);
    },
    onLayoutOptionsOk:function(objId, controlId, layoutName) {
        var obj = document.getElementById(objId);
        var liquid = Liquid.getLiquid(controlId);
        if(obj && liquid && layoutName) {
            var ftIndex1B = Liquid.getForeignTableIndex(liquid);
            var layoutIndex1B = Liquid.getLayoutIndexByName(liquid, layoutName);
            if(layoutIndex1B) {
                var layout = liquid.tableJson.layouts[layoutIndex1B-1];
                var newOptions = {};
                if(Liquid.formToObjectExchange(obj, newOptions)) {
                    Liquid.updateProperty(liquid, ftIndex1B, "layouts", layoutIndex1B-1, newOptions);
                    if(!isDef(liquid.sourceData)) liquid.sourceData = {};
                    liquid.sourceData.tempCurrentTab = layoutIndex1B;
                    Liquid.setAskForSave(liquid, true);
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                    try { console.log("INFO: updated table json : \n"+JSON.stringify(liquid.tableJsonSource.layouts[layoutIndex1B-1])); } catch(e) { console.error(e); }
                } else {
                    console.log("INFO: no changes to apply");
                }
            }
        }
    },
    onLiquidConnection:function(event) {
        var xhr = new XMLHttpRequest();
        try {
            xhr.open('POST', glLiquidServlet + '?operation=getConnection');
            xhr.send();
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4) {
                    if(xhr.status === 200) {
                        try {
                            if(xhr.responseText) {
                                httpResultJson = JSON.parse(xhr.responseText);
                                Liquid.curDriver = httpResultJson.driver ? atob(httpResultJson.driver) : "";
                                Liquid.curConnectionURL = httpResultJson.connectionURL ? atob(httpResultJson.connectionURL) : "";
                                Liquid.curConnectionDesc = httpResultJson.connectionDesc ? atob(httpResultJson.connectionDesc) : "";
                            }
                            LiquidEditing.onContextMenu({target:{classList:["liquidConnection"],id:null}});
                        } catch (e) { console.error("ERROR "+e+" on : "+xhr.responseText); }
                    }
                }
            };
        } catch (e) { console.error(e); }
    },
    onLiquidConnectionOk:function(objId) {
        var obj = document.getElementById(objId);
        Liquid.formToObjectExchange(obj, Liquid);
        if(Liquid.curConnectionURL && Liquid.curConnectionURL) {
            var xhr = new XMLHttpRequest();
            try {
                xhr.open('POST', glLiquidServlet + '?operation=setConnection' 
                        + '&driver=' + btoa(Liquid.curDriver ? Liquid.curDriver : "")
                        + '&connectionURL=' + btoa(Liquid.curConnectionURL ? Liquid.curConnectionURL : "")
                        );
                xhr.send();
                xhr.onreadystatechange = function() {
                    if(xhr.readyState === 4) {
                        if(xhr.status === 200) {
                            try {
                                if(xhr.responseText) {
                                    httpResultJson = JSON.parse(xhr.responseText);
                                    Liquid.createPopup( httpResultJson.message, httpResultJson.img );
                                }
                            } catch (e) { console.error("ERROR "+e+" on : "+xhr.responseText); }
                        }
                    }
                };
            } catch (e) { console.error(e); }
        } else {
            Liquid.dialogBox(null, "ERROR", "Please select driver and url", { text:"OK", func:function() { } }, null);
            // alert("ERROR: Please select driver and url");
        }
    },
    onSearchDatabase:function(event) {
        LiquidEditing.onContextMenuClose();
        var db = prompt("Database where to search, * for all", Liquid.curDatabase ? Liquid.curDatabase: "*");
        if(db) {
            var searchFor = prompt("String to search", Liquid.lastSearchFor);
            if(searchFor) {
                LiquidEditing.onDoSearch(db, null, null, searchFor);
                Liquid.lastSearchFor = searchFor;
            }
        }
    },
    onSearchSchema:function(event) {
        LiquidEditing.onContextMenuClose();
        var scm = prompt("Schema where to search, * for all (current db.schema: "+(Liquid.curDatabase ? Liquid.curDatabase : "[N/D]")+"."+(Liquid.curSchema ? Liquid.curSchema : "[N/D]")+")", Liquid.curSchema ? Liquid.curSchema : "*");
        if(scm) {
            var searchFor = prompt("String to search", Liquid.lastSearchFor);
            if(searchFor) {
                LiquidEditing.onDoSearch(Liquid.curDatabase, scm, null, searchFor);
                Liquid.lastSearchFor = searchFor;            
            }
        }
    },
    onSearchTable:function(event) {
        LiquidEditing.onContextMenuClose();
        var tbl = prompt("Table where to search, * for all (cur database.schema:"+Liquid.curDatabase+"."+Liquid.curSchema+")", "*");
        if(tbl) {
            var searchFor = prompt("String to search", Liquid.lastSearchFor);
            if(searchFor) {
                LiquidEditing.onDoSearch(Liquid.curDatabase, Liquid.curSchema, tbl, searchFor);
                Liquid.lastSearchFor = searchFor;
            }
        }
    },
    onDoSearch:function(database, schema, table, search) {
        if(search) {
            // craete status bar
            var parentObjId = "WinXContainer";
            Liquid.parentObj = document.getElementById(parentObjId);
            Liquid.parentObjStatus = Liquid.createStatusDiv(Liquid.parentObj, parentObjId);
            var xhr = new XMLHttpRequest();
            try {
                xhr.open('POST', glLiquidServlet + '?operation=search' 
                        + '&database=' + (database ? database : "")
                        + '&schema=' + (schema ? schema : "") 
                        + '&table=' + (table ? table : "")
                        + '&search=' + (search ? search : "")
                        );
                
                xhr.upload.addEventListener("progress", function(e) { Liquid.onTransferUploading(Liquid, null, "Searching", e); }, false);
                xhr.addEventListener("progress", function(e) { Liquid.onTransferDownloading(Liquid, null, "Searching", e); }, false);
                xhr.addEventListener("load", function(e) { Liquid.onTransferLoaded(Liquid, null, "Searching", e); }, false);
                xhr.addEventListener("error", function(e) { Liquid.onTransferFailed(Liquid, null, "Searching", e); }, false);
                xhr.addEventListener("abort", function(e) { Liquid.onTransferAbort(Liquid, null, "Searching", e); }, false);
                
                xhr.send();
                xhr.onreadystatechange = function() {
                    if(xhr.readyState === 4) {
                        if(xhr.status === 200) {
                            try {
                                if(xhr.responseText) {
                                    responseText = Liquid.getXHRResponse(xhr.responseText);
                                    Liquid.createPopup( responseText, null );
                                }
                            } catch (e) {
                                console.error(xhr.responseText);
                            }
                        }
                    }
                };
            } catch (e) {
                console.error(e);
            }
        }
    },    
    onNewForeignTable:function(event, mode) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            var nameItems = obj_id.split(".");
            Liquid.startPopup('liquidSelectForeignKeys', window.liquidSelectForeignKeys);
            var selectorLiquid = Liquid.getLiquid("liquidSelectForeignKeys");
            selectorLiquid.tableJson.caption = "New Liquid Foreign Table : <b>create or select foreign key</b>";
            selectorLiquid.tableJson.database = liquid.tableJson.database;
            selectorLiquid.tableJson.schema = liquid.tableJson.schema;
            if(nameItems[1] === 'newForeignTable') {
                selectorLiquid.tableJson.table = liquid.tableJson.table;
                selectorLiquid.tableJson.column = null;
            } else {
                if(nameItems.length > 2) { selectorLiquid.tableJson.table = nameItems[2]; } else { console.error("ERROR: unrecognize context:"+obj.id); return; }
            }
            Liquid.loadData(selectorLiquid, null, "newForeignTable");
            selectorLiquid.onPostClosed = "LiquidEditing.onNewForeignTableProcess('"+obj_id+"','"+mode+"')";
            Liquid.autoInsert(selectorLiquid);
            if(typeof event === 'object') event.stopPropagation();
        }
    },
    onNewForeignTableProcess:function(obj_id, mode) {
        var liquid = Liquid.getLiquid(obj_id);
        if(liquid) {
            var nameItems = obj_id.split(".");
            var selectorLiquid = Liquid.getLiquid("liquidSelectForeignKeys");
            if(selectorLiquid.lastAction && selectorLiquid.lastAction.name==="ok") {
                if(selectorLiquid.tableJson.selections) {
                    for(var isel=0; isel<selectorLiquid.tableJson.selections.length; isel++) {
                        var sel = selectorLiquid.tableJson.selections[isel];
                        if(sel) {
                            var foreignName = prompt("Enter folder name", ""+sel["FOREIGN_TABLE"]);
                            if(foreignName) {
                                var newForeignTableJson = null;
                                if(nameItems[1] === 'newForeignTable') {
                                    // alert("New foreign table : "+sel["TABLE"]+"."+sel["COLUMN"]+"="+sel["FOREIGN_TABLE"]+"."+sel["FOREIGN_COLUMN"]);
                                    newForeignTableJson = { name:foreignName, tooltip:"", icon:"", column:sel["COLUMN"], foreignTable:sel["FOREIGN_TABLE"], foreignColumn:sel["FOREIGN_COLUMN"], options:{ editable:true, autoSelect:true, autoSizeColumns:true } };
                                    if(mode === 'multipanel') {
                                        if(typeof liquid.tableJsonSource.multipanels === 'undefined' || !liquid.tableJsonSource.multipanels) liquid.tableJsonSource.multipanels = [];
                                        newForeignTableJson["height"] = Liquid.defaultMultipanelHeight;
                                        newForeignTableJson["text"] = sel["FOREIGN_TABLE"];
                                        newForeignTableJson["options"] = { navVisible:false };
                                        liquid.tableJsonSource.multipanels.push( newForeignTableJson );
                                    } else {
                                        if(typeof liquid.tableJsonSource.foreignTables === 'undefined' || !liquid.tableJsonSource.foreignTables) liquid.tableJsonSource.foreignTables = [];
                                        if(!(liquid.tableJsonSource.foreignTables instanceof Array)) liquid.tableJsonSource.foreignTables = [];
                                        liquid.tableJsonSource.foreignTables.push( newForeignTableJson );
                                    }
                                } else {
                                    // alert("On "+nameItems[2] + " : " + sel["TABLE"]+"."+sel["COLUMN"]+"="+sel["FOREIGN_TABLE"]+"."+sel["FOREIGN_COLUMN"]);
                                    newForeignTableJson = { name:foreignName, tooltip:"", icon:"", column:sel["COLUMN"], foreignTable:sel["FOREIGN_TABLE"], foreignColumn:sel["FOREIGN_COLUMN"], options:{ autoSelect:true, autoSizeColumns:true } };
                                    var targetForeignTables = Liquid.getForeignTablesContainer(liquid.tableJsonSource.foreignTables, nameItems[2]);
                                    if(targetForeignTables) targetForeignTables.push( newForeignTableJson );
                                    else console.error("ERROR: foreign table target not found:"+nameItems[2]);
                                }
                                try { console.log("INFO: new foreign table json : \n"+JSON.stringify(newForeignTableJson)); } catch(e) { console.error(e); }
                            }
                        }
                    }
                    Liquid.setAskForSave(liquid, true);
                    Liquid.rebuild(liquid, liquid.outDivObjOrId, liquid.tableJsonSource);
                }
            }
        }
    },
    
    
    createContextMenu:function() {
        var menu = document.getElementById("liquidContextMenu");
        if(!menu) {
            menu = document.createElement('div');
            menu.id = "liquidContextMenu";
            menu.className = "liquidContextMenu";
            menu.display = 'none';
            document.body.appendChild(menu);
        }
        return menu;
    },
    createOnTabContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        if(!liquid)
            liquid = Liquid.getLiquidByFullScan(obj);
        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var ckeckImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        
        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        var innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>";
        if(liquid && liquid.controlId) {
            innerHTML += ""            
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewGrid('"+liquid.controlId+".newGrid')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Grid"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewLayout('"+liquid.controlId+".newLayout')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Layout"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewForeignTable('"+liquid.controlId+".newForeignTable','')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Foreign Table"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewForeignTable('"+liquid.controlId+".newForeignTable','multipanel')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Multipanel"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewFilters('"+liquid.controlId+".newFilters')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Filter Group"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewFilters('"+liquid.controlId+".newFilter')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Filter Field"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewEvent('"+liquid.controlId+".newEvent')\" >"+addImg+"<a href=\"javascript:void(0)\" >New Event"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewCommandBar('"+liquid.controlId+".newActionBar')\" >"+ckeckImg+"<a href=\"javascript:void(0)\" >Add Command Bar"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewActionBar('"+liquid.controlId+".newActionBar')\" >"+ckeckImg+"<a href=\"javascript:void(0)\" >Add Action Bar"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewColumns('"+liquid.controlId+".newColumns')\" >"+addImg+"<a href=\"javascript:void(0)\" >New columns"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onColumnsManager('"+liquid.controlId+".columnsManager')\">"+optImg+"<a href=\"javascript:void(0)\">Columns options"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onOptions('"+liquid.controlId+".options')\">"+optImg+"<a href=\"javascript:void(0)\">Options"+"</a></p>"
                + (obj.classList.contains("liquidLayoutTab") ? "<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onGridOptions('"+liquid.controlId+".options','"+obj_id+"')\">"+optImg+"<a href=\"javascript:void(0)\">Grid Options"+"</a></p>" : "")
                + (obj.classList.contains("liquidLayoutTab") ? "<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onLayoutOptions('"+liquid.controlId+".options','"+obj_id+"')\">"+optImg+"<a href=\"javascript:void(0)\">Layouy Options"+"</a></p>" : "")                
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onServerCallbackTemplate('"+liquid.controlId+".template')\">"+optImg+"<a href=\"javascript:void(0)\">Get Server Callback"+"</a></p>"
                +"<p><hr size=1></p>"        
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToServer('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Save to server"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToZK('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Save to server as ZK"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToJSON('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToCSV('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Download as csv"+"</a></p>"
                +"</div>";
        }
        menu.innerHTML = innerHTML;
    },
    createOnCommandBarContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";

        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        menu.innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewCommand('"+liquid.controlId+".newCommand')\" >"+addImg+"<a href=\"javascript:void(0)\">New Command"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onOptions('"+liquid.controlId+".options')\">"+optImg+"<a href=\"javascript:void(0)\">Options"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onServerCallbackTemplate('"+liquid.controlId+".template')\">"+optImg+"<a href=\"javascript:void(0)\">Get Server Callback"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToServer('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Save to server"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToZK('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Save to server as ZK"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToJSON('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToCSV('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as csv"+"</a></p>"
                +"</div>";        
    },
    createOnWindowContainerContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("database.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var storeImg = "<img src=\""+Liquid.getImagePath("store.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        
        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        menu.innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" title=\"Set Connection\" onclick=\"LiquidEditing.onLiquidConnection(event)\" >"+dbImg+"<a href=\"javascript:void(0)\" >Set Connection"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" title=\"Current:"+Liquid.curDatabase+"\"onclick=\"LiquidEditing.onSetDatabase(event)\" >"+dbImg+"<a href=\"javascript:void(0)\" >Select database"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" title=\"Current:"+Liquid.curSchema+"\" onclick=\"LiquidEditing.onSetSchema(event)\" >"+storeImg+"<a href=\"javascript:void(0)\" >Select schema"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSearchDatabase(event)\" >"+addImg+"<a href=\"javascript:void(0)\" >Search on databases"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSearchSchema(event)\" >"+addImg+"<a href=\"javascript:void(0)\" >Search on schemas"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSearchTable(event)\" >"+addImg+"<a href=\"javascript:void(0)\" >Search on table"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewWindow(event, 'winX','"+obj.id+"')\" >"+addImg+"<a href=\"javascript:void(0)\" >New window"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewWindowFromJson(event, 'winX','"+obj.id+"')\" >"+addImg+"<a href=\"javascript:void(0)\" >New window from json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewControlByForm(event, '"+obj.id+"')\" >"+addImg+"<a href=\"javascript:void(0)\" >New windows by form"+"</a></p>"        
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewWindow(event, 'formX','"+obj.id+"')\" >"+addImg+"<a href=\"javascript:void(0)\" >New formX"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onLiquidAssets()\">"+optImg+"<a href=\"javascript:void(0)\">Manage assets"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onLiquidRoles()\">"+optImg+"<a href=\"javascript:void(0)\">Manage roles"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onLiquidRolesAssets()\">"+optImg+"<a href=\"javascript:void(0)\">Manage roles's assets"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onLiquidUsersRoles()\">"+optImg+"<a href=\"javascript:void(0)\">Manage user's roles"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onLiquidUsersAssets()\">"+optImg+"<a href=\"javascript:void(0)\">Manage user's assets"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onLiquidLoginUsers()\">"+optImg+"<a href=\"javascript:void(0)\">Manage login users"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onLiquidOptions()\">"+optImg+"<a href=\"javascript:void(0)\">Options"+"</a></p>"
                +"</div>";        
    },
    createOnFormXContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";

        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        menu.innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onOptions('"+liquid.controlId+".options')\">"+optImg+"<a href=\"javascript:void(0)\">Options"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToServer('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToZK('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Save to server as ZK"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToJSON('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToCSV('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as csv"+"</a></p>"
                +"</div>";                
    },
    createOnGridControlContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";        
        menu.innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onNewGridLookup('"+obj.id+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Make lookup"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onOptions('"+liquid.controlId+".options')\">"+optImg+"<a href=\"javascript:void(0)\">Options"+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToServer('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToZK('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Save to server as ZK"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToJSON('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as json"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToCSV('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\">Download as csv"+"</a></p>"
                +"</div>";                
    },
    getCheckedAttr:function( obj, def ) {
        if(typeof obj === 'undefined') { if(def === true) return "checked"; } else { if(obj === true) return "checked"; }
        return "";
    },
    createLiquidOptionsContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = LiquidEditing.createContextMenu();
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>";        
        var controlId = liquid.controlId;
        var formId = controlId+".optionsForm";
        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "LiquidEditing.onContextMenuClose(); LiquidEditing.onOptionsOk('"+formId+"','"+controlId+"');";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        var ftIndex1B = Liquid.getForeignTableIndex(liquid);
        var tagetLiquid = liquid;
        if(ftIndex1B) { // work on liquid.foreignTables[].options
            tagetLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
        }        
        contentHTML += "<table id=\""+formId+"\" cellPadding=\"3\" class=\"liquidOptionsMenu\" style=\"max-height:95%; overflow:auto; display:block;  \">"
                +"<tr><td colspan=\"3\"><center>"
                +"<span style=\"font-size:200%\">Liquid Control Options<span>"
                +"</center></td></tr>"
                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Name:"+"<input id=\"name\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.name !== 'undefined' ? tagetLiquid.tableJson.name : '')+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+""+"Control Id:"+"<input id=\"controlId\" type=\"text\" readonly=\"readonly\" disabled value=\""+(typeof tagetLiquid.controlId !== 'undefined' ? tagetLiquid.controlId : '')+"\" style=\"background-color:transparent\" "+""+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Caption:"+"<input id=\"caption\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.caption !== 'undefined' ? tagetLiquid.tableJson.caption : '')+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td></tr>"
                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Primary key:"+"<input id=\"primaryKey\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.primaryKey !== 'undefined' ? tagetLiquid.tableJson.primaryKey : '')+"\" list=\"primaryKeyDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"primaryKeyDataliast\"><option></option></datalist>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Lookup Field:"+"<input id=\"lookupField\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.lookupField !== 'undefined' ? tagetLiquid.tableJson.lookupField : '')+"\" list=\"lookupFieldDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"lookupFieldDataliast\"><option value=\"closed\">closed</option><option value=\"open\">open</option></datalist>"
                +"</td><td>"
                +"</td></tr>"        
                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Mode:"+"<input id=\"status\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.status !== 'undefined' ? tagetLiquid.tableJson.status : '')+"\" list=\"statusDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"statusDataliast\"><option value=\"closed\">closed</option><option value=\"open\">open</option></datalist>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Modeless:"+"<input id=\"modeless\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.modeless, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Resize:"+"<input id=\"resize\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.resize !== 'undefined' ? tagetLiquid.tableJson.resize : '')+"\" list=\"resizeDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"resizeDataliast\"><option value=\"both\">both</option><option value=\" \"></option></datalist>"
                +"</td></tr>"
                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Left:"+"<input id=\"left\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.left !== 'undefined' ? tagetLiquid.tableJson.left : "")+"\" list=\"leftDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"leftDataliast\"><option value=\"center\">center</option><option value=\"\"></option></datalist>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Top:"+"<input id=\"top\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.top !== 'undefined' ? tagetLiquid.tableJson.top : "")+"\" list=\"topDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"topDataliast\"><option value=\"center\">center</option><option value=\"\"></option></datalist>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Width:"+"<input id=\"width\" min=\"0\" type=\"\text\" value=\""+(typeof tagetLiquid.tableJson.width !== 'undefined' ? tagetLiquid.tableJson.width : "")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Height:"+"<input id=\"height\" min=\"0\" type=\"\text\" value=\""+(typeof tagetLiquid.tableJson.height !== 'undefined' ? tagetLiquid.tableJson.height : "")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Filter mode:"+"<input id=\"left\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.filterMode !== 'undefined' ? tagetLiquid.tableJson.filterMode : "")+"\" list=\"filterModeDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"filterModeDataliast\"><option value=\"\"></option><option value=\"client\">client</option><option value=\"client\">dynamic</option></datalist>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Sort mode:"+"<input id=\"top\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.sortMode !== 'undefined' ? tagetLiquid.tableJson.sortMode : "")+"\" list=\"sortModeDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"sortModeDataliast\"><option value=\"\"></option><option value=\"client\">client</option><option value=\"server\">server</option></datalist>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Navigation bar visible:"+"<input id=\"navVisible\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.navVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Checkbox selection:"+"<input id=\"checkboxSelection\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.checkboxSelection, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Row selection:"+"<input id=\"rowSelection\"type=\"\text\" value=\""+(typeof tagetLiquid.tableJson.rowSelection !== 'undefined' ? tagetLiquid.tableJson.rowSelection : "")+"\" list=\"rowSelectionDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"rowSelectionDataliast\"><option value=\"single\">single</option><option value=\"multiple\">multiple</option></datalist>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Row multiselect with click:"+"<input id=\"rowMultiSelectWithClick\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.rowMultiSelectWithClick, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Reset selection on row change:"+"<input id=\"resetSelectionOnRowChange\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.resetSelectionOnRowChange, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Row deselection:"+"<input id=\"rowDeselection\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.rowDeselection, false)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Auto select:"+"<input id=\"autoSelect\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.autoSelect, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Auto load:"+"<input id=\"autoLoad\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.autoLoad, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Editable:"+"<input id=\"editable\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.editable, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Edit type:"+"<input id=\"editType\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.editType !== 'undefined' ? tagetLiquid.tableJson.editType : "")+"\" list=\"editTypeDataliast\"  "+onKeyPressCode+"/></p>"
                +"<datalist id=\"editTypeDataliast\"><option value=\"\"></option><option value=\"fullRow\">fullRow</option></datalist>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"single click edit:"+"<input id=\"singleClickEdit\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.singleClickEdit, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Skip header on auto size:"+"<input id=\"skipHeaderOnAutoSize\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.skipHeaderOnAutoSize, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Auto size columns:"+"<input id=\"autoSizeColumns\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.autoSizeColumns, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Auto fit columns:"+"<input id=\"autoFitColumns\" type=\"checkbox\" v"+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.autoFitColumns, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td></tr>"


                +"<tr><td>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Search button on filters:"+"<input id=\"filtersSearch\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.filtersSearch, false)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Menu on grid header:"+"<input id=\"gridHeaderMenu\" type=\"checkbox\" v"+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.gridHeaderMenu, true)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                
                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"List Tab title:"+"<input id=\"listTabTitle\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.listTabTitle !== 'undefined' ? tagetLiquid.tableJson.listTabTitle : "Lista")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Loading Message:"+"<input id=\"loadingMessage\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.loadingMessage !== 'undefined' ? tagetLiquid.tableJson.loadingMessage : "")+"\" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Command bar visible:"+"<input id=\"commandBarVisible\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.commandBarVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"List tab visible:"+"<input id=\"listTabVisible\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.listTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Grids tab visible:"+"<input id=\"gridsTabVisible\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.gridsTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Layouts tab visible:"+"<input id=\"layoutsTabVisible\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.layoutsTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Documents tab visible:"+"<input id=\"documentsTabVisible\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.documentsTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Charts tabs visible:"+"<input id=\"chartsTabVisible\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.chartsTabVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Caption visible:"+"<input id=\"captionVisible\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.captionVisible, true)+" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td><td>"
                +"</td></tr>"


                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"pageSize:"+"<input id=\"pageSize\" type=\"number\" value=\""+(typeof tagetLiquid.tableJson.pageSize !== 'undefined' ? tagetLiquid.tableJson.pageSize : "")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Cache:"+"<input id=\"cache\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.cache, true)+""+onKeyPressCode+" /></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Header menu:"+"<input id=\"headerMenu\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.headerMenu, true)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"owner:"+"<input id=\"owner\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.owner !== 'undefined' ? tagetLiquid.tableJson.owner : "com.liquid.event")+"\" "+onKeyPressCode+"/></p>"
                +"</td><td>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Create table if missing:"+"<input id=\"createTableIfMissing\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(tagetLiquid.tableJson.createTableIfMissing, false)+" "+onKeyPressCode+"/></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"current tab:"+"<input id=\"currentTab\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.currentTab !== 'undefined' ? tagetLiquid.tableJson.currentTab : "")+"\"/></p>"
                +"</td><td>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"current foreign table:"+"<input id=\"currentForeignTable\" type=\"text\" value=\""+(typeof tagetLiquid.tableJson.currentForeignTable !== 'undefined' ? tagetLiquid.tableJson.currentForeignTable : "")+"\"/></p>"
                +"</td></tr>"

                +"<tr><td style=\"border-top:1px solid lightgray;\" colspan=\"3\"></td></tr>"

                +"<tr><td style=\"text-align: center;\">"
                +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\""+onCancelCode+"\">Cancel</button>"
                +"</td><td>"
                +"</td><td style=\"text-align: center;\">"
                +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\""+onOkCode+"\">Ok</button>"
                +"</td></tr>"

                +"</table>"
                +"</div>";

        menu.innerHTML = contentHTML;
        var modal_content = document.querySelector('.liquidContextMenu-content');
        modal_content.style.margin="0 auto";
        modal_content.style.fontSize="12px";
        modal_content.style.position="relative";
        modal_content.style.top="10px";
    },
    createLiquidGridOptionsContextMenu:function( obj, gridNameOrIndex ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = LiquidEditing.createContextMenu();
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>";        
        var controlId = liquid.controlId;
        var formId = controlId+".gridOptionsForm";

        var ftIndex1B = Liquid.getForeignTableIndex(liquid);
        var tagetLiquid = liquid;
        if(ftIndex1B) { // work on liquid.foreignTables[].options
            tagetLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
            // console.error("ERROR: unsupported");
            return;
        }
        
        var grid = null;
        if(typeof(gridNameOrIndex) === 'string') {
            var gridIndex1B = Liquid.getGridIndexByName(tagetLiquid, gridNameOrIndex);
            if(gridIndex1B) {
                grid = tagetLiquid.tableJson.grids[gridIndex1B];
            }
        } else {
            grid = tagetLiquid.tableJson.grids[gridNameOrIndex];
        }
        if(grid) {
            var onCancelCode = "LiquidEditing.onContextMenuClose();";
            var onOkCode = "LiquidEditing.onContextMenuClose(); LiquidEditing.onGridOptionsOk('"+formId+"','"+controlId+"','"+grid.name+"');";
            var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
            
            if(!isDef(grid.image)) {
                grid.image = {};
            }
            contentHTML += "<table id=\""+formId+"\" cellPadding=\"3\" class=\"liquidOptionsMenu\" style=\"max-height:95%; overflow:auto; display:block;  \">"
                    +"<tr><td colspan=\"3\"><center>"
                    +"<span style=\"font-size:200%\">Grid Options<span>"
                    +"</center></td></tr>"
                    +"<tr><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Name:"+"<input id=\"name\" type=\"text\" value=\""+(typeof grid.name !== 'undefined' ? grid.name : '')+"\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Tooltip:"+"<input id=\"tooltip\" type=\"text\" value=\""+(typeof grid.tooltip !== 'undefined' ? grid.tooltip : '')+"\" style=\"background-color:transparent\" "+""+"/></p>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Caption:"+"<input id=\"title\" type=\"text\" value=\""+(typeof grid.title !== 'undefined' ? grid.title : '')+"\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"</td></tr>"
                    +"<tr><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Icon:"+"<input id=\"icon\" type=\"text\" value=\""+(typeof grid.icon !== 'undefined' ? grid.icon : '')+"\" list=\"primaryKeyDataliast\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"N.rows:"+"<input id=\"nRows\" type=\"number\" value=\""+(typeof grid.nRows !== 'undefined' ? grid.nRows : '')+"\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"N.cols:"+"<input id=\"nCols\" type=\"number\" value=\""+(typeof grid.nCols !== 'undefined' ? grid.nCols : '')+"\" "+onKeyPressCode+"/></p>"
                    +"</td></tr>"        
                    +"<tr><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Background image:"+"<input id=\"image.url\" type=\"text\" value=\""+(typeof grid.image.url !== 'undefined' ? grid.image.url : "")+"\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"size:"+"<input id=\"image.size\" type=\"text\" value=\""+(typeof grid.image.size !== 'undefined' ? grid.image.size : "")+"\" list=\"sizeDataliast\" "+onKeyPressCode+"/></p>"
                    +"<datalist id=\"sizeDataliast\"><option value=\"\"></option><option value=\"auto\">auto</option><option value=\"contain\">contain</option><option value=\"cover\">cover</option><option value=\"inherit\">inherit</option><option value=\"initial\">initial</option><option value=\"unset\">unset</option></datalist>"
            
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Repeat:"+"<input id=\"image.repeat\" type=\"text\" value=\""+(typeof grid.image.repeat !== 'undefined' ? grid.image.repeat : "")+"\" list=\"repeatDataliast\" "+onKeyPressCode+"/></p>"
                    +"<datalist id=\"repeatDataliast\"><option value=\"\"></option><option value=\"round\">round</option><option value=\"no-repeat\">no-repeat</option><option value=\"repeat-x\">repeat-x</option><option value=\"repeat-y\">repeat-y</option></datalist>"
                    +"</td></tr>"

                    +"<tr><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Position X:"+"<input id=\"image.positionX\" type=\"text\" value=\""+(typeof grid.image.positionX !== 'undefined' ? grid.image.positionX : "")+"\" list=\"positionXDataliast\" "+onKeyPressCode+"/></p>"
                    +"<datalist id=\"positionXDataliast\"><option value=\"\"></option><option value=\"no-repeat\">no-repeat</option><option value=\"\"></option></datalist>"
                    +"</td><td>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Position Y:"+"<input id=\"image.positionY\" type=\"text\" value=\""+(typeof grid.image.positionY !== 'undefined' ? grid.image.positionY : "")+"\" list=\"positionYDataliast\" "+onKeyPressCode+"/></p>"
                    +"<datalist id=\"positionYDataliast\"><option value=\"\"></option><option value=\"no-repeat\">no-repeat</option><option value=\"\"></option></datalist>"
                    +"</td></tr>"

                    +"<tr><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Width:"+"<input id=\"width\" type=\"text\" value=\""+(typeof grid.width !== 'undefined' ? grid.width : "")+"\" list=\"widthDataliast\" "+onKeyPressCode+"/></p>"
                    +"<datalist id=\"widthDataliast\"><option value=\"\"></option><option value=\"auto\">auto</option><option value=\"100%\">100%</option></datalist>"
                    +"</td><td>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Height:"+"<input id=\"height\" type=\"text\" value=\""+(typeof grid.height !== 'undefined' ? grid.height : "")+"\" list=\"heightDataliast\" "+onKeyPressCode+"/></p>"
                    +"<datalist id=\"heightDataliast\"><option value=\"\"></option><option value=\"auto\">auto</option><option value=\"100%\">100%</option></datalist>"
                    +"</td></tr>"

                    +"<tr><td style=\"border-top:1px solid lightgray;\" colspan=\"3\"></td></tr>"

                    +"<tr><td style=\"text-align: center;\">"
                    +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\""+onCancelCode+"\">Cancel</button>"
                    +"</td><td>"
                    +"</td><td style=\"text-align: center;\">"
                    +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\""+onOkCode+"\">Ok</button>"
                    +"</td></tr>"

                    +"</table>"
                    +"</div>";

            menu.innerHTML = contentHTML;
            var modal_content = document.querySelector('.liquidContextMenu-content');
            modal_content.style.margin="0 auto";
            modal_content.style.fontSize="12px";
            modal_content.style.position="relative";
            modal_content.style.top="10px";
        } else {
            console.error("ERROR: grid '"+gridNameOrIndex+"' not found")
        }
    },
    createLiquidLayoutOptionsContextMenu:function( obj, layoutNameOrIndex ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = LiquidEditing.createContextMenu();
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>";        
        var controlId = liquid.controlId;
        var formId = controlId+".layoutOptionsForm";

        var ftIndex1B = Liquid.getForeignTableIndex(liquid);
        var tagetLiquid = liquid;
        if(ftIndex1B) { // work on liquid.foreignTables[].options
            tagetLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
        }
        
        var layout = null;
        if(typeof(layoutNameOrIndex) === 'string') {
            var layoutIndex1B = Liquid.getLayoutIndexByName(tagetLiquid, layoutNameOrIndex);
            if(layoutIndex1B) {
                layout = tagetLiquid.tableJson.layouts[layoutIndex1B];
            }
        } else {
            layout = tagetLiquid.tableJson.layouts[layoutNameOrIndex];
        }
        if(layout) {
            var onCancelCode = "LiquidEditing.onContextMenuClose();";
            var onOkCode = "LiquidEditing.onContextMenuClose(); Liquid.onLayoutOptionsOk('"+formId+"','"+controlId+"','"+layout.name+"');";
            var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
            
            if(!isDef(layout.image)) {
                layout.image = {};
            }
            contentHTML += "<table id=\""+formId+"\" cellPadding=\"3\" class=\"liquidOptionsMenu\" style=\"max-height:95%; overflow:auto; display:block;  \">"
                    +"<tr><td colspan=\"3\"><center>"
                    +"<span style=\"font-size:200%\">Layout Options<span>"
                    +"</center></td></tr>"
                    +"<tr><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Name:"+"<input id=\"name\" type=\"text\" value=\""+(typeof layout.name !== 'undefined' ? layout.name : '')+"\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Tooltip:"+"<input id=\"tooltip\" type=\"text\" value=\""+(typeof layout.tooltip !== 'undefined' ? layout.tooltip : '')+"\" style=\"background-color:transparent\" "+""+"/></p>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Caption:"+"<input id=\"title\" type=\"text\" value=\""+(typeof layout.title !== 'undefined' ? layout.title : '')+"\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"</td></tr>"
                    +"<tr><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"Icon:"+"<input id=\"icon\" type=\"text\" value=\""+(typeof layout.icon !== 'undefined' ? layout.icon : '')+"\" list=\"primaryKeyDataliast\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"N.rows:"+"<input id=\"nRows\" type=\"number\" value=\""+(typeof layout.nRows !== 'undefined' ? layout.nRows : '')+"\" "+onKeyPressCode+"/></p>"
                    +"</td></tr>"        
                    +"<tr><td>"
                    +"</td><td>"
                    +"</td><td>"
                    +"</td></tr>"

                    +"<tr><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"source:"+"<input id=\"header\" type=\"text\" value=\""+(isDef(layout.header) ? layout.header : "")+"\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"source:"+"<input id=\"source\" type=\"text\" value=\""+(isDef(layout.source) ? layout.source : "")+"\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"source:"+"<input id=\"footer\" type=\"text\" value=\""+(isDef(layout.footer) ? layout.footer : "")+"\" "+onKeyPressCode+"/></p>"
                    +"</td></tr>"

                    +"<tr><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"source for update row:"+"<input id=\"sourceForUpdate\" type=\"text\" value=\""+(isDef(layout.sourceForUpdate) ? layout.sourceForUpdate : "")+"\" "+onKeyPressCode+"/></p>"
                    +"</td><td>"
                    +"</td><td>"
                    +"<p class=\"liquidContextMenu-item\">"+optImg+"source for new row:"+"<input id=\"sourceForInsert\" type=\"text\" value=\""+(isDef(layout.sourceForInsert) ? layout.sourceForInsert : "")+"\" "+onKeyPressCode+"/></p>"
                    // +"<datalist id=\"sourceForInsertDataliast\"><option value=\"\"></option><option value=\"no-repeat\">/layouts/myLayoutForInsert.jsp</option><option value=\"\"></option></datalist>"
                    +"</td></tr>"

                    +"<tr><td style=\"border-top:1px solid lightgray;\" colspan=\"3\"></td></tr>"

                    +"<tr><td style=\"text-align: center;\">"
                    +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\""+onCancelCode+"\">Cancel</button>"
                    +"</td><td>"
                    +"</td><td style=\"text-align: center;\">"
                    +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\""+onOkCode+"\">Ok</button>"
                    +"</td></tr>"

                    +"</table>"
                    +"</div>";

            menu.innerHTML = contentHTML;
            var modal_content = document.querySelector('.liquidContextMenu-content');
            modal_content.style.margin="0 auto";
            modal_content.style.fontSize="12px";
            modal_content.style.position="relative";
            modal_content.style.top="10px";
        } else {
            console.error("ERROR: layout '"+layoutNameOrIndex+"' not found")
        }
    },
    createLiquidGridFieldContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = LiquidEditing.createContextMenu();
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:12px; height:16px; padding-right:5px; filter:grayscale(0.5); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>";        
        var controlId = liquid.controlId;
        var formId = controlId+".gridFieldForm";

        var ftIndex1B = Liquid.getForeignTableIndex(liquid);
        var tagetLiquid = liquid;
        if(ftIndex1B) { // work on liquid.foreignTables[].options
            // tagetLiquid = Liquid.getLiquid(liquid.foreignTables[ftIndex1B-1].controlId);
            console.error("ERROR: unsupported");
            return;
        }
    
        var grid_coords = Liquid.getGridCoords(liquid, obj.id);
        if(grid_coords) {
            var grid = grid_coords.grid;        
            if(grid) {
                var gridCol = grid_coords.control;
                var onCancelCode = "LiquidEditing.onContextMenuClose();";
                var onOkCode = "LiquidEditing.onContextMenuClose(); LiquidEditing.onGridFieldOptionsOk('"+formId+"','"+controlId+"','"+grid.name+"','"+gridCol.name+"');";
                var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";



                contentHTML += "<table id=\""+formId+"\" cellPadding=\"3\" class=\"liquidOptionsMenu\" style=\"max-height:95%; overflow:auto; display:block;  \">"
                        +"<tr><td colspan=\"3\"><center>"
                        +"<span style=\"font-size:200%\">Grid Field<span>"
                        +"</center></td></tr>"
                        +"<tr><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Name:"+"<input id=\"name\" type=\"text\" value=\""+(typeof gridCol.name !== 'undefined' ? gridCol.name : '')+"\" "+onKeyPressCode+"/></p>"
                        +"</td><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Label:"+"<input id=\"label\" type=\"text\" value=\""+(typeof gridCol.label !== 'undefined' ? gridCol.label : '')+"\" style=\"\" "+""+"/></p>"
                        +"</td><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Tooltip:"+"<input id=\"tooltip\" type=\"text\" value=\""+(typeof gridCol.tooltip !== 'undefined' ? gridCol.tooltip : '')+"\" style=\"\" "+""+"/></p>"
                        +"</td><td>"
                        +"</td></tr>"


                        +"<tr><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"row:"+"<input id=\"row\" type=\"number\" value=\""+(typeof gridCol.row !== 'undefined' ? gridCol.row : '')+"\" "+onKeyPressCode+"/></p>"
                        +"</td><td>"
                        +"</td><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"col:"+"<input id=\"col\" type=\"number\" value=\""+(typeof gridCol.col !== 'undefined' ? gridCol.col : '')+"\" "+onKeyPressCode+"/></p>"
                        +"</td></tr>"        

                        +"<tr><td>"            
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Field pos X:"+"<input id=\"fieldData.positionX\" type=\"text\" value=\""+(isDef(gridCol.fieldData) && isDef(gridCol.fieldData.positionX) ? gridCol.fieldData.positionX : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Field pos Y:"+"<input id=\"fieldData.positionY\" type=\"text\" value=\""+(isDef(gridCol.fieldData) && isDef(gridCol.fieldData.positionY) ? gridCol.fieldData.positionY : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Field position:"+"<input id=\"fieldData.position\" type=\"text\" value=\""+(isDef(gridCol.fieldData) && isDef(gridCol.fieldData.position) ? gridCol.fieldData.position : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td></tr>"

                        +"<tr><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Field width:"+"<input id=\"fieldData.width\" type=\"text\" value=\""+(isDef(gridCol.fieldData) && isDef(gridCol.fieldData.width) ? gridCol.fieldData.width : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td><td>"
                        +"</td><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Field height:"+"<input id=\"fieldData.height\" type=\"text\" value=\""+(isDef(gridCol.fieldData) && isDef(gridCol.fieldData.height) ? gridCol.fieldData.height : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td></tr>"

                        +"<tr><td colspan=3>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Field style:"+"<input id=\"fieldData.style\" type=\"text\" value=\""+(isDef(gridCol.fieldData) && isDef(gridCol.fieldData.style) ? gridCol.fieldData.style : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td></tr>"




                        +"<tr><td>"            
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Label pos X:"+"<input id=\"labelData.positionX\" type=\"text\" value=\""+(isDef(gridCol.labelData) && isDef(gridCol.labelData.positionX) ? gridCol.labelData.positionX : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Label pos Y:"+"<input id=\"labelData.positionY\" type=\"text\" value=\""+(isDef(gridCol.labelData) && isDef(gridCol.labelData.positionY) ? gridCol.labelData.positionY : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Label position:"+"<input id=\"labelData.position\" type=\"text\" value=\""+(isDef(gridCol.labelData) && isDef(gridCol.labelData.position) ? gridCol.labelData.position : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td></tr>"

                        +"<tr><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Label width:"+"<input id=\"labelData.width\" type=\"text\" value=\""+(isDef(gridCol.labelData) && isDef(gridCol.labelData.width) ? gridCol.labelData.width : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td><td>"
                        +"</td><td>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Label height:"+"<input id=\"labelData.height\" type=\"text\" value=\""+(isDef(gridCol.labelData) && isDef(gridCol.labelData.height) ? gridCol.labelData.height : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td></tr>"

                        +"<tr><td colspan=3>"
                        +"<p class=\"liquidContextMenu-item\">"+optImg+"Label style:"+"<input id=\"labelData.style\" type=\"text\" value=\""+(isDef(gridCol.labelData) && isDef(gridCol.labelData.style) ? gridCol.labelData.style : "")+"\" "+onKeyPressCode+"/></p>"
                        +"</td></tr>"


                        +"<tr><td style=\"border-top:1px solid lightgray;\" colspan=\"3\"></td></tr>"

                        +"<tr><td style=\"text-align: center;\">"
                        +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\""+onCancelCode+"\">Cancel</button>"
                        +"</td><td>"
                        +"</td><td style=\"text-align: center;\">"
                        +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\""+onOkCode+"\">Ok</button>"
                        +"</td></tr>"

                        +"</table>"
                        +"</div>";

                menu.innerHTML = contentHTML;
                var modal_content = document.querySelector('.liquidContextMenu-content');
                modal_content.style.margin="0 auto";
                modal_content.style.fontSize="12px";
                modal_content.style.position="relative";
                modal_content.style.top="10px";
            } else {
                console.error("ERROR: grid '"+obj.id+"' not found")
            }
        } else {
            console.error("ERROR: grid '"+obj.id+"' not found")
        }
    },
    createGeneralOptionsContextMenu:function( obj ) {
        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("database.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var storeImg = "<img src=\""+Liquid.getImagePath("store.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">" + "<span class=\"liquidContextMenu-close\"></span>";
        
        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        var formId = "Liquid.options";
        
        contentHTML += "<table id=\""+formId+"\" cellPadding=\"3\" class=\"liquidGeneralOptionsMenu\" style=\"max-height:95%; overflow:auto; display:block; position:relative; top:10px;\">"
                +"<tr><td colspan=\"3\"><center>"
                +"<span style=\"font-size:200%\">Liquid Options<span>"
                +"</center></td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Language:"+"<input id=\"lang\" type=\"text\" value=\""+(Liquid.lang ? Liquid.lang : "eng")+"\" list=\"langDataliast\" autocomplete=\"false\" /></p>"
                +"<datalist id=\"langDataliast\"><option value=\"en\">english</option><option value=\"it\">italiano</option></datalist>"
                +"</td><td>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Current database:"+"<input id=\"curDatabase\" type=\"text\" value=\""+(Liquid.curDatabase !== 'undefined' ? Liquid.curDatabase : "")+"\" /></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Current schema:"+"<input id=\"curSchema\" type=\"text\" value=\""+(Liquid.curSchema !== 'undefined' ? Liquid.curSchema : "")+"\" /></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Clean Data:"+"<input id=\"cleanData\" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(Liquid.cleanData, true)+" /></p>"
                +"</td><td>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Date separator:"+"<input id=\"dateSep\" type=\"text\" value=\""+(Liquid.dateSep ? Liquid.dateSep : "")+"\" /></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Time separator:"+"<input id=\"lang\" type=\"text\" value=\""+(Liquid.timeSep ? Liquid.timeSep : ":")+"\" /></p>"
                +"</td></tr>"

                +"<tr><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Project mode:"+"<input id=\"projectMode\" "+"disabled readonly" + " type=\"checkbox\" "+LiquidEditing.getCheckedAttr(Liquid.projectMode, true)+" /></p>"
                +"</td><td>"
                +"<p class=\"liquidContextMenu-item\">"+optImg+"Debug mode:"+"<input id=\"debug\" " + (Liquid.projectMode ? "" : "disabled readonly") +" type=\"checkbox\" "+LiquidEditing.getCheckedAttr(Liquid.debug, true)+" /></p>"
                +"</td></tr>"


                +"<tr><td style=\"border-top:1px solid lightgray;\" colspan=\"3\"></td></tr>"

                +"<tr><td style=\"text-align: center;\">"
                +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\"LiquidEditing.onContextMenuClose();\">Cancel</button>"
                +"</td><td>"
                +"</td><td style=\"text-align: center;\">"
                +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\"LiquidEditing.onContextMenuClose(); LiquidEditing.onLiquidOptionsOk('"+formId+"')\">Ok</button>"
                +"</td></tr>"

                +"</table>"
                +"</div>";
        
        menu.innerHTML = contentHTML;
        var modal_content = document.querySelector('.liquidContextMenu-content');
        modal_content.style.margin="0 auto";
        modal_content.style.fontSize="12px";    
        modal_content.style.position="relative";
        modal_content.style.top="10px";
    },
    createConnectionContextMenu:function( obj ) {
        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("database.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var storeImg = "<img src=\""+Liquid.getImagePath("store.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">" + "<span class=\"liquidContextMenu-close\"></span>";

        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";        
        
        var formId = "Liquid.connection";
        
        var userConnectionList = "";
        if(Liquid.userConnectionList) {
            for(var it=0; it<Liquid.userConnectionList.length; it++) {
                userConnectionList += "<option value=\""+Liquid.userConnectionList[it].url+"\">"+Liquid.userConnectionList[it].name+"</option>";
            }
        }        
        
        contentHTML += "<table id=\""+formId+"\" cellPadding=\"3\" class=\"liquidConnection\" style=\"max-height:95%; overflow:auto; display:block; position:relative; top:10px;\">"

                +"<tr><td colspan=\"2\">"
                +"<p class=\"liquidContextMenu-item\" style=\"width:480px;\">"+Liquid.curConnectionDesc+"</p>"
                +"</td></tr>"

                +"<tr><td colspan=\"2\">"
                +"<p class=\"liquidContextMenu-item\" style=\"width:480px;\">"+optImg+"Driver:"+"<input id=\"curDriver\" type=\"text\" style=\"width:475px; height:32px\" value=\""+(Liquid.curDriver ? Liquid.curDriver : "")+"\" list=\"driverDataliast\" autocomplete=\"false\" /></p>"
                +"<datalist id=\"driverDataliast\"><option value=\"oracle.jdbc.driver.OracleDriver\">Oracle</option>"
                +"<option value=\"com.mysql.jdbc.Driver\">MySQL</option>"
                +"<option value=\"org.postgresql.Driver\">Postgres</option>"
                +"<option value=\"com.microsoft.sqlserver.jdbc.SQLServerDriver\">SqlServer</option></datalist>"
                +"</td></tr>"

                +"<tr><td colspan=\"2\">"
                +"<p class=\"liquidContextMenu-item\" style=\"width:480px;\">"+optImg+"Connection URL:"+"<input id=\"curConnectionURL\" style=\"width:475px; height:32px\" type=\"text\" value=\""+(Liquid.curConnectionURL !== 'undefined' ? Liquid.curConnectionURL : "")+"\" list=\"curConnectionURLDataliast\" autocomplete=\"false\" /></p>"
                +"<datalist id=\"curConnectionURLDataliast\">"
                +"<option value=\"jdbc:oracle:thin:@[host]:1521:xe,[database],[password]\">Oracle</option>"
                +"<option value=\"jdbc:mysql://[host]:3306/[database],[user],[password]\">MySQL</option>"
                +"<option value=\"jdbc:postgresql://[host]:5432/[database],[user],[password]\">PostGres</option>"
                +"<option value=\"jdbc:sqlserver//[host]:1433;databaseName=[database],[user],[password]\">SQLServer</option>"
        
                +userConnectionList
        
                +"</datalist>"
                +"</td></tr>"

                +"<tr><td style=\"border-top:1px solid lightgray;\" colspan=\"2\"></td></tr>"

                +"<tr><td style=\"text-align: center;\">"
                +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\"LiquidEditing.onContextMenuClose();\">Cancel</button>"
                +"</td><td style=\"text-align: center;\">"
                +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\"LiquidEditing.onContextMenuClose(); LiquidEditing.onLiquidConnectionOk('"+formId+"')\">Ok</button>"
                +"</td></tr>"

                +"</table>"
                +"</div>";
        
        menu.innerHTML = contentHTML;
        var modal_content = document.querySelector('.liquidContextMenu-content');
        modal_content.style.margin="0 auto";
        modal_content.style.fontSize="12px";    
        modal_content.style.position="relative";
        modal_content.style.top="10px";
        modal_content.style.width = "500px";
    },
    createEventContextMenu:function( obj, objId ) {
        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var dbImg = "<img src=\""+Liquid.getImagePath("database.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var storeImg = "<img src=\""+Liquid.getImagePath("store.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var contentHTML = "<div class=\"liquidContextMenu-content\">" + "<span class=\"liquidContextMenu-close\"></span>";

        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";        
        
        var formId = "Liquid.event";
        contentHTML += "<table id=\""+formId+"\" cellPadding=\"3\" class=\"liquidEvent\" style=\"max-height:95%; overflow:auto; display:block; position:relative; top:10px;\">"

                +"<tr><td colspan=\"2\">"
                +"<p class=\"liquidContextMenu-item\" style=\"width:780px;\">"+optImg+"Event:"+"<input id=\"name\" type=\"text\" style=\"width:775px; height:32px\" value=\""+(Liquid.curDriver ? Liquid.curDriver : "")+"\" list=\"nameDataliast\" autocomplete=\"false\" /></p>"
                +"<datalist id=\"nameDataliast\">"
                +"<option value=\"onFirstLoad\">on first time loaded control</option>"
                +"<option value=\"onLoad\">on loaded windows</option>"
                +"<option value=\"onRowSelected\">on row selected</option>"
                +"<option value=\"onRowUnSelected\">on row unselected</option>"
                +"<option value=\"onRowClicked\">on row clicked</option>"        
                +"<option value=\"onRowRendering\">on row rendering</option>"
                +"<option value=\"onCellClicked\">on cell clicked</option>"
                +"<option value=\"onCellChanged\">on cell changed</option>"
                +"<option value=\"onCellDoubleClicked\">on cell double-clicked</option>"
                +"<option value=\"cellContextMenu\">on cell right-clicked</option>"                
                +"<option value=\"onSelectionChanged\">on selection changed</option>"
                +"<option value=\"onGetSelection\">on get selection</option>"
                +"<option value=\"isRowSelectable\">is row selectable</option>"
                +"<option value=\"onCellValueChanged\">on cell value changed</option>"
                +"<option value=\"onSorting\">before sort</option>"
                +"<option value=\"onSorted\">after sort</option>"
                +"<option value=\"onInserting\">before intert row</option>"
                +"<option value=\"onUpdating\">before update row</option>"
                +"<option value=\"onDeleting\">before delete row</option>"
                +"<option value=\"onInserted\">before intert row</option>"
                +"<option value=\"onUpdated\">before update row</option>"
                +"<option value=\"onDeleted\">before delete row</option>"
                +"<option value=\"onRollback\">on command rollback</option>"
                +"<option value=\"onUploadDocument\">on update DMS document</option>"
                +"<option value=\"onDownloadDocument\">on download DMS document</option>"
                +"<option value=\"onDeleteDocument\">on delete DMS document</option>"
                +"<option value=\"onUpdateDocument\">on update DMS document</option>"
                +"<option value=\"onClosing\">before close windows</option>"
                +"<option value=\"onClosed\">after windows</option>"
                +"</datalist>"
                +"</td></tr>"

                +"<tr><td colspan=\"2\">"
                +"<p class=\"liquidContextMenu-item\" style=\"width:780px;\">"+optImg+"Client code:"+"<textarea id=\"client\" style=\"width:775px; height:200px\" type=\"text\" value=\""+("")+"\" placeholder=\"javascript:\" ></textarea></p>"
                +"</td></tr>"
                +"<tr><td colspan=\"2\">"
                +"<p class=\"liquidContextMenu-item\" style=\"width:780px;\">"+optImg+"Server class:"+"<textarea id=\"server\" style=\"width:775px; height:60px\" type=\"text\" value=\""+("")+"\" placeholder=\"server_package.server_class\" /></textarea></p>"
                +"</td></tr>"
                +"<tr><td colspan=\"2\">"
                +"<p class=\"liquidContextMenu-item\" style=\"width:780px;\">"+optImg+"Parameters:"+"<input id=\"params\" type=\"text\" style=\"width:775px; height:32px\" value=\""+("")+"\" placeholder=\"[control1, control2]\" /></p>"
                +"<datalist id=\"driverDataliast\">"
                +"<option value=\"empty\"> </option>"
                +"<option value=\"controlId\">[ControlId1, ControlId2]</option>"
                +"</td></tr>"

                +"<tr><td style=\"border-top:1px solid lightgray;\" colspan=\"2\"></td></tr>"

                +"<tr><td style=\"text-align: center;\">"
                +"<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\"LiquidEditing.onContextMenuClose();\">Cancel</button>"
                +"</td><td style=\"text-align: center;\">"
                +"<button id=\"ok\" class=\"liquidOptionsButtonMenu\" onclick=\"LiquidEditing.onContextMenuClose(); Liquid.onNewEventOk('"+formId+"','"+objId+"')\">Ok</button>"
                +"</td></tr>"

                +"</table>"
                +"</div>";
        
        menu.innerHTML = contentHTML;
        var modal_content = document.querySelector('.liquidContextMenu-content');
        modal_content.style.margin="0 auto";
        modal_content.style.fontSize="12px";    
        modal_content.style.position="relative";
        modal_content.style.top="10px";
    },
    createOnMenuContextMenu:function( obj ) {
        var liquid = Liquid.getLiquid(obj);
        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var ckeckImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";

        var onCancelCode = "LiquidEditing.onContextMenuClose();";
        var onOkCode = "";
        var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
        
        menu.innerHTML = "<div class=\"liquidContextMenu-content\">"
                +"<span class=\"liquidContextMenu-close\"></span>"
                +"<p class=\"liquidContextMenu-item\">"+addImg+"<a href=\"javascript:void(0)\" onclick=\"location.href='"+glLiquidRoot+"/liquid/info/'\" >Liquid ver."+Liquid.version+"</a></p>"
                +"<p><hr size=1></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToServer('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Sate to server"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToZK('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Save to server as ZK"+"</a></p>"
                +"<p class=\"liquidContextMenu-item\" onclick=\"LiquidEditing.onSaveToJSON('"+liquid.controlId+"')\" >"+saveImg+"<a href=\"javascript:void(0)\" >Download as json"+"</a></p>"
                +"</div>";        
    },
    onContextMenu:function(e) {
        var repositionMenu = true;
        if(e) {
            if(e.target.classList.contains('liquidPopupCaption')
            || e.target.classList.contains('liquidGridTablesTabs')
            || e.target.classList.contains('liquidForeignTables') 
            || e.target.classList.contains('liquidPopupCaptionDragger') 
            || e.target.classList.contains('liquidForeignTablesContainer')
            || e.target.classList.contains('liquidNavLabel')
            || e.target.classList.contains('liquidErrorMessage')
            || e.target.classList.contains('liquidErrorCoords')
            || e.target.classList.contains('liquidNavPage')
            || e.target.classList.contains('liquidLayoutRowContainer')
            || e.target.classList.contains('liquidLayoutRowContainerDiv')
            || e.target.classList.contains('ag-center-cols-viewport')
            ) {
                LiquidEditing.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidMenuX') || e.target.classList.contains('liquidMenuXContainer')) {
                LiquidEditing.createOnMenuContextMenu(e.target);
            } else if(e.target.classList.contains('liquidCommandBar') || e.target.classList.contains('liquidCommandText') || e.target.classList.contains('liquidCommandImg')) {
                LiquidEditing.createOnCommandBarContextMenu(e.target);
            } else if(e.target.classList.contains('liquidWinXContainer')) {
                LiquidEditing.createOnWindowContainerContextMenu(e.target);
            } else if(e.target.classList.contains('liquidOptions')) {
                LiquidEditing.createLiquidOptionsContextMenu(e.target);
            } else if(e.target.classList.contains('liquidOptionsLayout')) {
                LiquidEditing.createLiquidLayoutOptionsContextMenu(e.target);                
            } else if(e.target.classList.contains('liquidOptions')) {
                LiquidEditing.onGridOptions(e.target);                
            } else if(e.target.classList.contains('liquidGeneralOptions')) {
                LiquidEditing.createGeneralOptionsContextMenu(e.target);
            } else if(e.target.classList.contains('liquidConnection')) {
                LiquidEditing.createConnectionContextMenu(e.target);
            } else if(e.target.classList.contains('liquidEvent')) {
                LiquidEditing.createEventContextMenu(e.target, e.target.id);
            } else if(e.target.classList.contains('ag-cell')) {
                return true;
            } else if(e.target.classList.contains('ag-header-cell')) {
                return true;
            } else if(e.target.classList.contains('ag-header-cell')) {
                return true;
            } else if(e.target.classList.contains('liquidFilterLabel')) {
                LiquidEditing.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidFilterTbl')) {
                LiquidEditing.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidFilterInput')) {
                LiquidEditing.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidFiltersSpacer')) {
                LiquidEditing.createOnTabContextMenu(e.target);
            } else if(e.target.classList.contains('liquidFormX')) {
                LiquidEditing.createOnFormXContextMenu(e.target);
            } else if(e.target.classList.contains('liquidGridControl')) {
                LiquidEditing.createOnGridControlContextMenu(e.target);
            } else if(e.target.classList.contains('liquidGridOptions')) {
                LiquidEditing.createLiquidGridOptionsContextMenu(e.target, e.target.id);
                repositionMenu = false;                
            } else if(e.target.classList.contains('liquidGridCell') || e.target.classList.contains('liquidGridLabel')) {
                LiquidEditing.createLiquidGridFieldContextMenu(e.target);
                repositionMenu = false;                
            } else if(e.target.classList.contains('liquidTab')) {
                var nameItems = e.target.id.substring(1).split(".");
                if(nameItems.length>=2) {
                    if(nameItems[1] == "grid_tab") {
                        LiquidEditing.createLiquidGridOptionsContextMenu(e.target, Number(nameItems[2])-1);
                    } else if(nameItems[1] == "layout_tab") {
                        LiquidEditing.createLiquidLayoutOptionsContextMenu(e.target, Number(nameItems[2])-1);
                    } else if(nameItems[1] == "document_tab") {
                    } else if(nameItems[1] == "chart_tab") {
                    }
                }
                repositionMenu = false;
            } else return;
            var modal = document.getElementById('liquidContextMenu');
            modal.style.display = "block";
            var modal_content = document.querySelector('.liquidContextMenu-content');
            if(modal_content) {
                if(repositionMenu) {
                    modal_content.style.left = (e.clientX+5)+'px';
                    modal_content.style.top = (e.clientY+5)+'px';
                    modal_content.style.position = "relative";
                }
                var span = document.getElementsByClassName("liquidContextMenu-close")[0];
                span.onclick = function() { modal.style.display = "none"; };
                window.onclick = function(event) { if(event.target === modal) modal.style.display = "none"; };
                return true;
            } else {
                modal.style.display = "none";
            }
        }
        return false;
    },
    onContextMenuClose:function() {
        var span = document.getElementsByClassName("liquidContextMenu-close")[0];
        if(span) span.click();
    },
    onServerCallbackTemplate:function(event) {
        var obj = typeof event === 'object' ? event.target : null;
        var obj_id = typeof event === 'object' ? obj.id : event;
        var liquid = typeof event === 'object' ? Liquid.getLiquid(obj) : Liquid.getLiquid(event);
        LiquidEditing.onContextMenuClose();
        if(liquid) {
            var funcName = prompt("Enter server side method name", "myCommand");
            var funcCode = LiquidEditing.getServerCallbackTemplateCode(liquid, funcName);
            var dlg = LiquidEditing.createServerCallbackTemplate(liquid, "ServerCallbackTemplateCode");
            document.body.appendChild(dlg);
            dlg.style.display = "";
            var dlgContent = document.querySelector(".liquidEditorDialog-content");
            if(dlgContent) {
                dlgContent.style.top = dlg.parentNode.offsetTop + dlg.parentNode.clientHeight/2 - (dlgContent.clientHeight > 0 ? dlgContent.clientHeight:250)/2;
                dlgContent.style.left = dlg.parentNode.offsetLeft + dlg.parentNode.clientWidth/2 - (dlgContent.clientWidth > 0 ? dlgContent.clientWidth:200)/2;
                dlgContent.style.position='absolute';
            }            
            document.getElementById("ServerCallbackTemplateCode").innerHTML = funcCode;
        }
    },
    getServerCallbackTemplateCode:function(liquid, funcName) {
        var out = "";
        out += "static public String "+funcName+"(Object tbl_wrk, Object params, Object clientData, Object requestParam ) {\n";
        out += "int retVal = 0;\n";
        out += "String result = \"\";\n";
        out += "String updateResults = \"\";\n";
        out += "\n";
        out += "if(tbl_wrk != null) {\n";
        out += "    if(params != null) {\n";
        out += "        // get selection in the control\n";
        out += "            String ids = db.getSelection(tbl_wrk, params);\n";
        out += "            long maxRows = 0;\n";
        out += "            // read the row in the db as bean\n";
        out += "            ArrayList<Object> beans = (ArrayList<Object>)db.get_bean(requestParam, (String)ids, \"bean\", \"all\", \"all\", maxRows);\n";
        out += "            if(beans != null) {\n";
        out += "                int i = 1, n = beans.size();\n";
        out += "                for(Object bean : beans) {\n";
        out += "                    try {\n";
        if(liquid) {
            out += "                        // loading bean "+liquid.controlId+" from db\n";
            if(liquid.tableJsonSource.columns) {
                for(var ic=0; ic<liquid.tableJsonSource.columns.length; ic++) {
                    var col = liquid.tableJsonSource.columns[ic];
                    var jType = "Object";
                    if(col) {
                        if(Liquid.isInteger(col.type)) {
                            jType = "Long";
                        } else if(Liquid.isFloat(col.type)) {
                            jType = "Float";
                        } else if(Liquid.isDate(col.type)) {
                            jType = "java.sql.Date";
                        } else {
                            jType = "String";
                        }
                        out += "                        ";
                        out += jType
                        out += " " + liquid.controlId.toLowerCase() + "$" + col.name.replace(".", "_") + " = ("+jType+")utility.get(bean, \""+col.name+"\");\n";
                    }
                }
            }
        }
        if(liquid.srcLiquid) {
            out += "\n";
            out += "                        // Loading parent bean "+liquid.srcLiquid.controlId+" from db\n";
            out += "                        Object parentBean = db.load_parent_bean( bean, params, maxRows );\n";
            if(liquid.srcLiquid.tableJsonSource.columns) {
                for(var ic=0; ic<liquid.srcLiquid.tableJsonSource.columns.length; ic++) {
                    var col = liquid.srcLiquid.tableJsonSource.columns[ic];
                    var jType = "Object";
                    if(col) {
                        if(Liquid.isInteger(col.type)) {
                            jType = "Long";
                        } else if(Liquid.isFloat(col.type)) {
                            jType = "Float";
                        } else if(Liquid.isDate(col.type)) {
                            jType = "java.sql.Date";
                        } else {
                            jType = "String";
                        }
                        out += "                        ";
                        out += jType
                        out += " " + liquid.srcLiquid.controlId.toLowerCase() + "$" + col.name.replace(".", "_") + " = ("+jType+")utility.get(bean, \""+col.name+"\");\n";
                    }
                }
            }
            out += "\n";
        }
        out += "\n";
        out += "                    } catch (Throwable ex) {\n";
        out += "                        Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);\n";
        out += "                    }\n";
        out += "\n";
        out += "\n";
        out += "                    /*\n";
        out += "                    // confirmation\n";
        out += "                    if(Messagebox.show( \"Update ?\", \"Liquid\", Messagebox.OK+Messagebox.CANCEL+Messagebox.QUESTION, 30, Messagebox.CANCEL ) == Messagebox.OK) {\n";
        out += "\n";
        out += "                        // update DB\n";
        out += "                        String updateResult = db.update ( bean, tbl_wrk );\n";
        out += "\n";
        out += "                        // ids to refrsh in the client\n";
        out += "                        updateResults += (updateResults.length()>0?\",\":\"\") + updateResult;\n";
        out += "                    }\n";
        out += "                    */\n";
        out += "                }\n";
        out += "            }\n";
        out += "        }\n";
        out += "    }\n";
        out += "\n";
        out += "result = \"{ \\\"result\\\":\"+retVal;\n";
        out += "result += \",\\\"detail\\\":[\"+updateResults+\"]\";\n";
        out += "result += \"}\";\n";
        out += "return result;\n";
        out += "}\n";
        return out;
    },
    createSystemEditorsDialog:function(liquid, resultId) {
        var editorFromValuesCodes = { editor:{type:"values", "values":["true","false"], "codes":["1","0"] } };
        var editorFromValues = { editor:{type:"values", "values":["S","N"] } };
        var editorFromColumn = { editor:{type:"distinct",table:"TABLE",column:"COLUMN",idColumn:"ID",targetColumn:"TRAGET",cache:true } };
        var editorRich = { editor:{type:"richEdit",options:"" } };
        var editorDate = { editor:{type:"date",options:"" } };
        var editorDateTime = { editor:{type:"datetime",options:"" } };
        var editorCode = { editor:{type:"sunEditor",options:"", code:true} };
        var dlg = document.getElementById("liquidEditorDialog");
        if(!dlg) {
            dlg = document.createElement('div');
            dlg.id = "liquidEditorDialog";
            dlg.className = "liquidContextMenu";
            dlg.display = 'none';
            dlg.innerHTML = "<div class=\"liquidEditorDialog-content\">"
                    +"<span class=\"liquidContextMenu-close\"></span>"
                    +"Editor:<input id=\""+resultId+"\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+""+"'/>"
                    +"</br>"
                    +"</br>"
                    +"</br>"
                    +"Commom values</br>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt1"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Edit by values list:<input readonly=readonly; id=\"opt1\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorFromValues)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt2"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Edit by codes as values list:<input readonly=readonly; id=\"opt2\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorFromValuesCodes)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt3"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Edit selecting column:<input readonly=readonly; id=\"opt3\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorFromColumn)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt4"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Rich text editor:<input readonly=readonly; id=\"opt4\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorRich)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt5"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Date editor:<input readonly=readonly; id=\"opt5\" type=\"text\" class=\"liquidSystemDialogInput\" value='"+JSON.stringify(editorDate)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt6"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Date/time editor:<input readonly=readonly; id=\"opt6\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorDateTime)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt7"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Date/time editor:<input readonly=readonly; id=\"opt6\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(editorCode)+"'/></p>"
                    ;
        }
        return dlg;
    },
    createServerCallbackTemplate:function(liquid, itemId) {
        var dlg = document.getElementById("liquidServerCallbackTemplate");
        if(!dlg) {
            dlg = document.createElement('div');
            dlg.id = "liquidServerCallbackTemplate";
            dlg.className = "liquidContextMenu";
            // dlg.display = 'none';
            var onCancelCode = "document.getElementById('liquidServerCallbackTemplate').style.display='none'";
            var onOkCode = "";
            var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";
            var contentHTML = "<div class=\"liquidEditorDialog-content\">"
                    + "<span class=\"liquidContextMenu-close\"></span>"
                    + "<textarea id=\""+itemId+"\" class=\"liquidSystemDialogTextarea\" ></textarea>"
                    + "<input class=\"liquidSystemDialogInput\" type=\"hidden\" value='"+""+onKeyPressCode+"'/>"
                    + "<button id=\"cancel\" class=\"liquidOptionsButtonMenu\" onclick=\""+onCancelCode+"\">Close</button>"
                    + "</div>";
            dlg.innerHTML = contentHTML;
        }
        return dlg;
    },
    createSystemLookupDialog:function(liquid, resultId) {
        var lookupVariable = "GLOBAL_VAR_NAME"; // by json in global var or object
        var lookupContent = { schema:"SCHEMA", table:"TABLE", lookupField:"COLUMN", idColumn:"ID_COLUMN", tagetColumn:"TARGET_COLUMN" }; // by json content
        var lookupShared = { lookup:"CONTROL_ID" }; // by json in other control
        var dlg = document.getElementById("liquidLookupDialog");
        if(!dlg) {
            dlg = document.createElement('div');
            dlg.id = "liquidLookupDialog";
            dlg.className = "liquidContextMenu";
            // dlg.display = 'none';
            dlg.innerHTML = "<div class=\"liquidEditorDialog-content\">"
                    +"<span class=\"liquidContextMenu-close\"></span>"
                    +"Editor:<input id=\""+resultId+"\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+""+"'/>"
                    +"</br>"
                    +"</br>"
                    +"</br>"
                    +"Commom values</br>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt1"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Lookup by global variable:<input readonly=readonly; id=\"opt1\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(lookupVariable)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt2"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Lookup by local content:<input readonly=readonly; id=\"opt2\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(lookupContent)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt3"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Lookup by shared controlId:<input readonly=readonly; id=\"opt3\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(lookupShared)+"'/></p>"
                    ;
        }
        return dlg;
    },
    createSystemOptionsDialog:function(liquid, resultId) {
        var optionsFull = { options:{ lookupField:"COLUMN",targetColumn:"TARGET_COLUMN",idColumn:"ID_COLUMN",navVisible:true, autoSelect:false, status:"closed",width:"250px",height:"200px" } };
        var optionsMinimal = { options:{ navVisible:false, autoSelect:false, width:"250px",height:"200px" } };
        var optionsBase = { options:{ } };
        var dlg = document.getElementById("liquidOptionsDialog");
        if(!dlg) {
            dlg = document.createElement('div');
            dlg.id = "liquidOptionsDialog";
            dlg.className = "liquidContextMenu";
            dlg.display = 'none';
            dlg.innerHTML = "<div class=\"liquidEditorDialog-content\">"
                    +"<span class=\"liquidContextMenu-close\"></span>"
                    +"Options:<input id=\""+resultId+"\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+""+"'/>"
                    +"</br>"
                    +"</br>"
                    +"</br>"
                    +"Commom values</br>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt1"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Lookup options:<input readonly=readonly; d=\"opt1\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(optionsFull)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt2"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Minimal options:<input readonly=readonly; id=\"opt2\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(optionsMinimal)+"'/></p>"
                    +"<p style=\"width:auto\" onclick=\"LiquidEditing.applySystemEditor('"+dlg.id+"','"+"opt3"+"','"+resultId+"')\" class=\"liquidContextMenu-item\">Base options:<input readonly=readonly; id=\"opt3\" class=\"liquidSystemDialogInput\" type=\"text\" value='"+JSON.stringify(optionsBase)+"'/></p>"
                    ;
        }
        return dlg;
    },
    applySystemEditor:function(dlgId, optId, objId) {
        if(dlgId) {
            var dlg = document.getElementById(dlgId);
            if(dlg) {
                if(optId) {
                    var opt = document.getElementById(optId);
                    if(opt) {
                        if(objId) {
                            var obj = document.getElementById(objId);
                            if(obj) obj.value = opt.value;
                        }
                    }
                }
            }
        }
    },
    /**
     *
     * @param liquid
     * @returns {HTMLElement}
     */
    exportToZKDialog:function(liquid) {
        var dlgId = "liquidExportToZKDialog";
        var dlg = document.getElementById(dlgId);
        if (!dlg) {
            dlg = document.createElement('div');
            dlg.id = dlgId;
            dlg.className = "liquidContextDialog";

            var panelCode = capitalizeFirstLetter(liquid.tableJson.table.toCamelCase());
            if (!Liquid.customerName)
                Liquid.customerName = "geisoft";
            if (!Liquid.appName)
                Liquid.appName = "app";

            if (!Liquid.orderByField)
                Liquid.orderByField = "";
            if (!Liquid.orderByField)
                Liquid.orderByField = "";


            var beanClass = "com." + Liquid.customerName + "." + Liquid.appName + ".hibernate.bean." + panelCode;
            if (!Liquid.fieldInTitleBar)
                Liquid.fieldInTitleBar = "";
            if (!Liquid.maxResult)
                Liquid.maxResult = "5000";
            if (!Liquid.piedino)
                Liquid.piedino = "/com/" + Liquid.customerName + "/controller/datiPiedinoProfilo-1.incxml";
            if (!Liquid.showList)
                Liquid.showList = "S";
            if (!Liquid.autoSelect)
                Liquid.autoSelect = "S";
            if (!Liquid.autoFind)
                Liquid.autoFind = "S";
            if (!Liquid.itemsInPage)
                Liquid.itemsInPage = "20";
            if (!Liquid.popupCommand)
                Liquid.popupCommand = "N";
            if (!Liquid.use_asset)
                Liquid.use_asset = "N";
            if (!Liquid.process_foreign_tables)
                Liquid.process_foreign_tables = "N";
            if (!Liquid.can_insert)
                Liquid.can_insert = "S";
            if (!Liquid.can_update)
                Liquid.can_update = "S";
            if (!Liquid.can_delete)
                Liquid.can_delete = "S";

            var onCancelCode = "LiquidEditing.onContextMenuClose();";
            var onOkCode = "";
            var onKeyPressCode = "onkeypress=\"if(event.keyCode === 13) {"+onOkCode+"} else if(event.keyCode === 13) { "+onCancelCode+" } \"";

            dlg.innerHTML =
                "<div class=\"liquidEditorDialog-content\">"
                + "<span class=\"liquidContextMenu-close\"></span>"
                + "<span style='text-align: center'><h1>Export to ZK panel</h1></span>"
                + "<table cellpadding='3' cellspacing='3'     style='width: 100%; height: 100%;'>"
                + "<tr><td>Panel title</td><td><input id=\"" + "panelTitle" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + panelCode + "' "+onKeyPressCode+" /></td</tr>"
                + "<tr><td>Field in title bar</td><td><input id=\"" + "fieldInTitleBar" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.fieldInTitleBar + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Customer name</td><td><input id=\"" + "customerName" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.customerName + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>App name</td><td><input id=\"" + "appName" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.appName + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Bean class</td><td><input id=\"" + "beanClass" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + beanClass + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Max Result</td><td><input id=\"" + "maxResult" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.maxResult + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Order by field</td><td><input id=\"" + "orderByField" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.orderByField + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Order mode</td><td><input id=\"" + "orderByFieldMode" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + "ASC" + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Piedino</td><td><input id=\"" + "piedino" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.piedino + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Show list</td><td><input id=\"" + "showList" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.showList + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Auto select</td><td><input id=\"" + "autoSelect" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.autoSelect + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Auto find</td><td><input id=\"" + "autoFind" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.autoFind + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>No.items per page</td><td><input id=\"" + "itemsInPage" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.itemsInPage + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Popup command</td><td><input id=\"" + "popupCommand" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.popupCommand + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Use asset</td><td><input id=\"" + "use_asset" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.use_asset + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Can insert</td><td><input id=\"" + "can_insert" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.can_insert + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Can update</td><td><input id=\"" + "can_update" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.can_update + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Can delete</td><td><input id=\"" + "can_delete" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.can_delete + "' "+onKeyPressCode+"/></td</tr>"
                + "<tr><td>Foreign tables</td><td><input id=\"" + "process_foreign_tables" + "\" class=\"liquidSystemDialogInput\" type=\"text\" autocomplete='off' value='" + Liquid.process_foreign_tables + "' "+onKeyPressCode+"/></td</tr>"
                + "</table>"
                + "</br>"
                + "</br>"
                + "<p style=\"width:auto; text-align: center\" onclick=\"LiquidEditing.applyExportToZKDialog('" + liquid.controlId + "','" + dlg.id + "')\" class=\"liquidContextMenu-item\">Do export</p>"
            ;
        }

        Liquid.showDlg(dlg);

        Liquid.createDatalistByColumns(document.getElementById("fieldInTitleBar"), liquid);

        Liquid.createDatalistByProp(document.getElementById("maxResult"), liquid, "100,200,500,1000,2000,3000,4000,5000,10000");

        Liquid.createDatalistByColumns(document.getElementById("orderByField"), liquid);

        Liquid.createDatalistByProp(document.getElementById("orderByFieldMode"), liquid, "ASC,DESC");

        Liquid.createDatalistByProp(document.getElementById("showList"), liquid, "S,N");
        Liquid.createDatalistByProp(document.getElementById("autoSelect"), liquid, "S,N");
        Liquid.createDatalistByProp(document.getElementById("autoFind"), liquid, "S,N");

        Liquid.createDatalistByProp(document.getElementById("itemsInPage"), liquid, "5,10,15,20,30,40,50,100,150,200,500,1000");

        Liquid.createDatalistByProp(document.getElementById("popupCommand"), liquid, "S,N");
        Liquid.createDatalistByProp(document.getElementById("use_asset"), liquid, "S,N");
        Liquid.createDatalistByProp(document.getElementById("can_insert"), liquid, "S,N");
        Liquid.createDatalistByProp(document.getElementById("can_update"), liquid, "S,N");
        Liquid.createDatalistByProp(document.getElementById("can_delete"), liquid, "S,N");
        Liquid.createDatalistByProp(document.getElementById("process_foreign_tables"), liquid, "S,N");



        var menu = LiquidEditing.createContextMenu();
        var addImg = "<img src=\""+Liquid.getImagePath("add.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var optImg = "<img src=\""+Liquid.getImagePath("setup.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var ckeckImg = "<img src=\""+Liquid.getImagePath("check.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";
        var saveImg = "<img src=\""+Liquid.getImagePath("saveas.png")+"\" style=\"width:16px; height:16px; padding-right:5px; filter:grayscale(0.8); \">";

        menu.appendChild(dlg);
        menu.style.display = "";
    },
    applyExportToZKDialog:function(objId, dlgId) {
        LiquidEditing.onContextMenuClose();
        if(dlgId) {
            var dlg = document.getElementById(dlgId);
            if(dlg) {
                if(objId) {
                    var liquid = Liquid.getLiquid(objId);
                    if(liquid) {
                        var obj = document.getElementById("panelTitle");
                        if(obj) Liquid.panelTitle = obj.value;
                        obj = document.getElementById("fieldInTitleBar");
                        if(obj) Liquid.fieldInTitleBar = obj.value;
                        obj = document.getElementById("customerName");
                        if(obj) Liquid.customerName = obj.value;
                        obj = document.getElementById("appName");
                        if(obj) Liquid.appName = obj.value;
                        obj = document.getElementById("beanClass");
                        if(obj) Liquid.beanClass = obj.value;
                        obj = document.getElementById("maxResult");
                        if(obj) Liquid.maxResult = obj.value;
                        obj = document.getElementById("orderByField");
                        if(obj) Liquid.orderByField = obj.value;
                        obj = document.getElementById("orderByFieldMode");
                        if(obj) Liquid.orderByFieldMode = obj.value;
                        obj = document.getElementById("piedino");
                        if(obj) Liquid.piedino = obj.value;
                        obj = document.getElementById("showList");
                        if(obj) Liquid.showList = obj.value;
                        obj = document.getElementById("autoSelect");
                        if(obj) Liquid.autoSelect = obj.value;
                        obj = document.getElementById("autoFind");
                        if(obj) Liquid.autoFind = obj.value;
                        obj = document.getElementById("itemsInPage");
                        if(obj) Liquid.itemsInPage = obj.value;
                        obj = document.getElementById("popupCommand");
                        if(obj) Liquid.popupCommand = obj.value;
                        obj = document.getElementById("use_asset");
                        if(obj) Liquid.use_asset = obj.value;
                        obj = document.getElementById("can_insert");
                        if(obj) Liquid.can_insert = obj.value;
                        obj = document.getElementById("can_update");
                        if(obj) Liquid.can_update = obj.value;
                        obj = document.getElementById("can_delete");
                        if(obj) Liquid.can_delete = obj.value;
                        obj = document.getElementById("process_foreign_tables");
                        if(obj) Liquid.process_foreign_tables = obj.value;

                        var json = null;
                        if(liquid instanceof LiquidCtrl) {
                            json = liquid.tableJsonSource ? JSON.parse(JSON.stringify(liquid.tableJsonSource)) : null;
                        } else if(liquid instanceof LiquidMenuXCtrl) {
                            json = liquid.menuJsonSource ? JSON.parse(JSON.stringify(liquid.menuJsonSource)) : null;
                        }
                        if(json) {
                            // aggiunta parametri
                            var token = json.token; // cave current token

                            json.zkParams = {
                                panelTitle:Liquid.panelTitle
                                ,fieldInTitleBar:Liquid.fieldInTitleBar
                                ,customerName:Liquid.customerName
                                ,appName:Liquid.appName
                                ,beanClass:Liquid.beanClass
                                ,maxResult:Number(Liquid.maxResult)
                                ,orderByField:Liquid.orderByField
                                ,orderByFieldMode:Liquid.orderByFieldMode
                                ,piedino:Liquid.piedino
                                ,showList:Liquid.showList === 'S' ? true : false
                                ,autoSelect:Liquid.autoSelect === 'S' ? true : false
                                ,autoFind:Liquid.autoFind === 'S' ? true : false
                                ,itemsInPage:Number(Liquid.itemsInPage)
                                ,popupCommand:Liquid.popupCommand === 'S' ? true : false
                                ,use_asset:Liquid.use_asset === 'S' ? true : false
                                ,can_insert:Liquid.can_insert === 'S' ? true : false
                                ,can_update:Liquid.can_update === 'S' ? true : false
                                ,can_delete:Liquid.can_delete === 'S' ? true : false
                                ,process_foreign_tables:Liquid.process_foreign_tables === 'S' ? true : false
                            }
                            var fileName = liquid.controlId+".json";
                            var tableJsonString = JSON.stringify(json);

                            // TODO: risoluzione larghezze
                            if(json.columns) {
                                for(let ic=0; ic<liquid.tableJson.columns.length; ic++) {
                                    var col = json.columns[ic];
                                    if(col.width) {
                                        var width = Number(col.width && !isNaN(col.width) ? col.width : 0)
                                        if(width==0) {
                                            liquid.gridOptions.columnApi.autoSizeColumns([json.columns[ic].field], true);
                                        }
                                        width = Number(liquid.tableJson.columns[ic].width && !isNaN(liquid.tableJson.columns[ic].width) ? liquid.tableJson.columns[ic].width : 0)
                                        if(width > 0) {
                                            json.columns[ic].rtWidth = width;
                                        }
                                    }
                                }
                            }
                            json.token = token; // need current token
                            Liquid.registerOnUnloadPage();
                            if(!liquid.xhr)
                                liquid.xhr = new XMLHttpRequest();
                            if(Liquid.wait_for_xhr_ready(liquid), "export to ZK") {
                                try {
                                    Liquid.startWaiting(liquid);
                                    liquid.xhr.open('POST', glLiquidServlet + '?operation=saveToZK'
                                        +'&controlId=' + (typeof json.registerControlId !== "undefined" ? json.registerControlId : liquid.controlId)
                                        +'&token=' + (typeof token !== "undefined" ? token : "")
                                        , true);

                                    var command = { name:"onSaveToZK" };
                                    liquid.xhr.upload.addEventListener("progress", function(e) { Liquid.onTransferUploading(liquid, command, "onSaveToZK", e, null, null); }, false);
                                    liquid.xhr.addEventListener("progress", function(e) { Liquid.onTransferDownloading(liquid, command, "onSaveToZK", e, null, null); }, false);
                                    liquid.xhr.addEventListener("load", function(e) { Liquid.onTransferLoaded(liquid, command, "onSaveToZK", e, null, null); }, false);
                                    liquid.xhr.addEventListener("error", function(e) { Liquid.onTransferFailed(liquid, command, "onSaveToZK", e, null, null); }, false);
                                    liquid.xhr.addEventListener("abort", function(e) { Liquid.onTransferAbort(liquid, command, "onSaveToZK", e, null, null); }, false);

                                    liquid.xhr.send(tableJsonString);
                                    liquid.xhr.onreadystatechange = function() {
                                        if(liquid.xhr.readyState === 4) {
                                            Liquid.release_xhr(liquid);
                                            Liquid.stopWaiting(liquid);
                                            if(liquid.xhr.status === 200) {
                                                // \b \f \n \r \t
                                                var responseText = liquid.xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b");
                                                responseText = Liquid.getXHRResponse(responseText);
                                                httpResultJson = JSON.parse(responseText);
                                                if(httpResultJson) {
                                                    var anyMessage = false;
                                                    if(httpResultJson.error) {
                                                        var err = null;
                                                        try { err = atob(httpResultJson.error); } catch(e) { err = httpResultJson.error; }
                                                        Liquid.dialogBox(null, httpResultJson.title ? httpResultJson.title : "ERROR", err, { text:"OK", func:function() { } }, null);
                                                        anyMessage = true;
                                                    } else if(httpResultJson.warning) {
                                                        var warn = null;
                                                        try { warn = atob(httpResultJson.warning); } catch(e) { warn = httpResultJson.warning; }
                                                        Liquid.dialogBox(null, httpResultJson.title ? httpResultJson.title : "WARNING", warn, { text:"OK", func:function() { } }, null);
                                                        anyMessage = true;
                                                    } else if(httpResultJson.message) {
                                                        var msg = null;
                                                        try { msg = atob(httpResultJson.message); } catch(e) { msg = httpResultJson.message; }
                                                        Liquid.dialogBox(null, httpResultJson.title ? httpResultJson.title : "MESSAGE", msg, { text:"OK", func:function() { } }, null);
                                                        anyMessage = true;
                                                    }
                                                    if(httpResultJson.client) {
                                                        Liquid.executeClientSide(liquid, "Save json response:", httpResultJson.client, null, true);
                                                    }
                                                    if(httpResultJson.result>0) {
                                                        Liquid.setAskForSave(liquid, false);
                                                    }
                                                }
                                            } else {
                                                console.error("ERROR : wring response:"+liquid.xhr.status);
                                            }
                                        }
                                    };
                                } catch (e) {
                                    console.error("ERROR : "+e);
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    onSaveToServer:function(obj) {
        return LiquidEditing.onSaveTo(obj, false, true);
    },
    onSaveToJSON:function(obj) {
        return LiquidEditing.onSaveTo(obj, true, false);
    },
    onSaveTo:function(obj, bDownload, bSaveToServer) {
        LiquidEditing.onContextMenuClose();
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var json = null;
            if(liquid instanceof LiquidCtrl) {
                json = liquid.tableJsonSource ? JSON.parse(JSON.stringify(liquid.tableJsonSource)) : null;
            } else if(liquid instanceof LiquidMenuXCtrl) {
                json = liquid.menuJsonSource ? JSON.parse(JSON.stringify(liquid.menuJsonSource)) : null;
            }
            if(json) {
                var token = json.token; // cave current token
                Liquid.removeRuntimeTableJsonProps(json);
                if(bSaveToServer) {
                    // controllo presenza file, set se fila nuovo
                    if(typeof liquid.controlId === 'undefined' || !liquid.controlId) {
                        liquid.controlId = ""
                            + (json.database ? json.database+"." : "")
                            + (json.schema ? json.schema+"." : "")
                            + (json.table ? json.table+"." : "")
                            + "";
                    }
                    if(typeof json.sourceFileName === 'undefined' || !json.sourceFileName) {
                        json.sourceFileName = btoa(liquid.controlId + ".json");
                    }
                }
                // var link=window.URL.createObjectURL(jsonBlob); // window.location=link;
                var fileName = liquid.controlId+".json";
                var tableJsonString = JSON.stringify(json);

                if(bDownload) {
                    var jsonBlob = new Blob([ tableJsonString ], {type: "text/plain;charset=utf-8"});
                    saveAs(jsonBlob, fileName);
                }
                if(bSaveToServer) {
                    json.token = token; // need current token
                    Liquid.registerOnUnloadPage();
                    if(!liquid.xhr)
                        liquid.xhr = new XMLHttpRequest();
                    if(Liquid.wait_for_xhr_ready(liquid), "save to server") {
                        try {
                            Liquid.startWaiting(liquid);
                            liquid.xhr.open('POST', glLiquidServlet + '?operation=setJson'
                                +'&controlId=' + (typeof json.registerControlId !== "undefined" ? json.registerControlId : liquid.controlId)
                                +'&token=' + (typeof token !== "undefined" ? token : "")
                                , true);

                            var command = { name:"saveTo" };
                            liquid.xhr.upload.addEventListener("progress", function(e) { Liquid.onTransferUploading(liquid, command, "onSaveTo", e, null, null); }, false);
                            liquid.xhr.addEventListener("progress", function(e) { Liquid.onTransferDownloading(liquid, command, "onSaveTo", e, null, null); }, false);
                            liquid.xhr.addEventListener("load", function(e) { Liquid.onTransferLoaded(liquid, command, "onSaveTo", e, null, null); }, false);
                            liquid.xhr.addEventListener("error", function(e) { Liquid.onTransferFailed(liquid, command, "onSaveTo", e, null, null); }, false);
                            liquid.xhr.addEventListener("abort", function(e) { Liquid.onTransferAbort(liquid, command, "onSaveTo", e, null, null); }, false);

                            liquid.xhr.send(tableJsonString);
                            liquid.xhr.onreadystatechange = function() {
                                if(liquid.xhr.readyState === 4) {
                                    Liquid.release_xhr(liquid);
                                    Liquid.stopWaiting(liquid);
                                    if(liquid.xhr.status === 200) {
                                        // \b \f \n \r \t
                                        var responseText = liquid.xhr.responseText.replace(/(?:[\r\n])/g, "\\n").replace(/(?:[\t])/g, "\\t").replace(/(?:[\r\f])/g, "\\f").replace(/(?:[\r\b])/g, "\\b");
                                        responseText = Liquid.getXHRResponse(responseText);
                                        httpResultJson = JSON.parse(responseText);
                                        if(httpResultJson) {
                                            var anyMessage = false;
                                            if(httpResultJson.error) {
                                                var err = null;
                                                try { err = atob(httpResultJson.error); } catch(e) { err = httpResultJson.error; }
                                                Liquid.dialogBox(null, httpResultJson.title ? httpResultJson.title : "ERROR", err, { text:"OK", func:function() { } }, null);
                                                anyMessage = true;
                                            } else if(httpResultJson.warning) {
                                                var warn = null;
                                                try { warn = atob(httpResultJson.warning); } catch(e) { warn = httpResultJson.warning; }
                                                Liquid.dialogBox(null, httpResultJson.title ? httpResultJson.title : "WARNING", warn, { text:"OK", func:function() { } }, null);
                                                anyMessage = true;
                                            } else if(httpResultJson.message) {
                                                var msg = null;
                                                try { msg = atob(httpResultJson.message); } catch(e) { msg = httpResultJson.message; }
                                                Liquid.dialogBox(null, httpResultJson.title ? httpResultJson.title : "MESSAGE", msg, { text:"OK", func:function() { } }, null);
                                                anyMessage = true;
                                            }
                                            if(httpResultJson.client) {
                                                Liquid.executeClientSide(liquid, "Save json response:", httpResultJson.client, null, true);
                                            }
                                            if(httpResultJson.result>0) {
                                                Liquid.setAskForSave(liquid, false);
                                            }
                                        }
                                    } else {
                                        console.error("ERROR : wring response:"+liquid.xhr.status);
                                    }
                                }
                            };
                        } catch (e) {
                            console.error("ERROR : "+e);
                        }
                    }
                }
            }
        }
    },
    onSaveToZK:function(obj) {
        LiquidEditing.onContextMenuClose();
        var liquid = Liquid.getLiquid(obj);
        if(liquid) {
            var json = null;
            if(liquid instanceof LiquidCtrl) {
                json = liquid.tableJsonSource ? JSON.parse(JSON.stringify(liquid.tableJsonSource)) : null;
            } else if(liquid instanceof LiquidMenuXCtrl) {
                json = liquid.menuJsonSource ? JSON.parse(JSON.stringify(liquid.menuJsonSource)) : null;
            }
            if(json) {
                var token = json.token; // cave current token
                Liquid.removeRuntimeTableJsonProps(json);
                // controllo presenza file, set se fila nuovo
                if(typeof liquid.controlId === 'undefined' || !liquid.controlId) {
                    liquid.controlId = ""
                        + (json.database ? json.database+"." : "")
                        + (json.schema ? json.schema+"." : "")
                        + (json.table ? json.table+"." : "")
                        + "";
                }
                if(typeof json.sourceFileName === 'undefined' || !json.sourceFileName) {
                    json.sourceFileName = btoa(liquid.controlId + ".json");
                }
                LiquidEditing.exportToZKDialog(liquid);
            }
        }
    },

}